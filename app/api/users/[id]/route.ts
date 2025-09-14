import { type NextRequest } from "next/server"
import { getServerSession } from "next-auth/next"
import connectDB from "@/lib/mongodb"
import User from "@/models/User"
import { authOptions } from "@/lib/auth-config"
import { secureUpdateUserSchema } from "@/lib/security/validation"
import { applyRateLimit } from "@/lib/security/rate-limiter"
import { ApiErrorHandler, getClientInfo, createErrorResponse } from "@/lib/security/error-handler"
import { PermissionManager } from "@/lib/security/permissions"
import { AuditLogger } from "@/lib/security/audit-logger"
import { SecurityUtils } from "@/lib/security/validation"

// GET /api/users/[id] - Get user by ID
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const rateLimitResponse = await applyRateLimit(request, "api")
    if (rateLimitResponse) return rateLimitResponse

    const session = await getServerSession(authOptions)
    const clientInfo = getClientInfo(request)

    if (!session?.user) {
      return createErrorResponse("Unauthorized", 401)
    }

    // Validate ObjectId format
    if (!SecurityUtils.isValidObjectId(params.id)) {
      return createErrorResponse("Invalid user ID format", 400)
    }

    // Check permissions
    if (!PermissionManager.canAccessUser(session, params.id)) {
      await AuditLogger.log({
        userId: session.user.id,
        userEmail: session.user.email,
        action: "GET_USER_UNAUTHORIZED",
        resource: "USER",
        resourceId: params.id,
        ipAddress: clientInfo.ipAddress,
        userAgent: clientInfo.userAgent,
        success: false,
        errorMessage: "Insufficient permissions to view user",
      })
      return createErrorResponse("Insufficient permissions", 403)
    }

    await connectDB()

    const user = await User.findById(params.id).select("-password").lean()

    if (!user) {
      await AuditLogger.log({
        userId: session.user.id,
        userEmail: session.user.email,
        action: "GET_USER_NOT_FOUND",
        resource: "USER",
        resourceId: params.id,
        ipAddress: clientInfo.ipAddress,
        userAgent: clientInfo.userAgent,
        success: false,
        errorMessage: "User not found",
      })
      return ApiErrorHandler.createErrorResponse("User not found", 404)
    }

    // Log successful access
    await AuditLogger.log({
      userId: session.user.id,
      userEmail: session.user.email,
      action: "GET_USER",
      resource: "USER",
      resourceId: params.id,
      details: { targetUserEmail: (user as any).email },
      ipAddress: clientInfo.ipAddress,
      userAgent: clientInfo.userAgent,
      success: true,
    })

    return ApiErrorHandler.createSuccessResponse(user)
  } catch (error: any) {
    const session = await getServerSession(authOptions)
    const clientInfo = getClientInfo(request)

    return ApiErrorHandler.handleError(error, {
      userId: session?.user?.id,
      userEmail: session?.user?.email,
      action: "GET_USER",
      resource: "USER",
      resourceId: params.id,
      ipAddress: clientInfo.ipAddress,
      userAgent: clientInfo.userAgent,
    })
  }
}

// PUT /api/users/[id] - Update user
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const rateLimitResponse = await applyRateLimit(request, "sensitive")
    if (rateLimitResponse) return rateLimitResponse

    const session = await getServerSession(authOptions)
    const clientInfo = getClientInfo(request)

    if (!session?.user) {
      return ApiErrorHandler.createErrorResponse("Unauthorized", 401)
    }

    // Validate ObjectId format
    if (!SecurityUtils.isValidObjectId(params.id)) {
      return ApiErrorHandler.createErrorResponse("Invalid user ID format", 400)
    }

    // Check permissions
    if (!PermissionManager.canModifyUser(session, params.id)) {
      await AuditLogger.log({
        userId: session.user.id,
        userEmail: session.user.email,
        action: "UPDATE_USER_UNAUTHORIZED",
        resource: "USER",
        resourceId: params.id,
        ipAddress: clientInfo.ipAddress,
        userAgent: clientInfo.userAgent,
        success: false,
        errorMessage: "Insufficient permissions to update user",
      })
      return ApiErrorHandler.createErrorResponse("Insufficient permissions", 403)
    }

    const body = await request.json()

    // Validate input
    const validatedFields = secureUpdateUserSchema.safeParse(body)

    if (!validatedFields.success) {
      await AuditLogger.log({
        userId: session.user.id,
        userEmail: session.user.email,
        action: "UPDATE_USER_VALIDATION_ERROR",
        resource: "USER",
        resourceId: params.id,
        details: { errors: validatedFields.error.errors },
        ipAddress: clientInfo.ipAddress,
        userAgent: clientInfo.userAgent,
        success: false,
        errorMessage: "Validation failed",
      })
      return ApiErrorHandler.handleError(validatedFields.error)
    }

    await connectDB()

    // Check if user exists
    const existingUser = await User.findById(params.id)

    if (!existingUser) {
      await AuditLogger.log({
        userId: session.user.id,
        userEmail: session.user.email,
        action: "UPDATE_USER_NOT_FOUND",
        resource: "USER",
        resourceId: params.id,
        ipAddress: clientInfo.ipAddress,
        userAgent: clientInfo.userAgent,
        success: false,
        errorMessage: "User not found",
      })
      return ApiErrorHandler.createErrorResponse("User not found", 404)
    }

    const updateData = validatedFields.data

    // Additional role validation if role is being changed
    if (updateData.role && updateData.role !== existingUser.role) {
      if (!PermissionManager.canUpdateUserRole(session, params.id, updateData.role)) {
        await AuditLogger.log({
          userId: session.user.id,
          userEmail: session.user.email,
          action: "UPDATE_USER_ROLE_ERROR",
          resource: "USER",
          resourceId: params.id,
          details: { 
            oldRole: existingUser.role, 
            attemptedRole: updateData.role 
          },
          ipAddress: clientInfo.ipAddress,
          userAgent: clientInfo.userAgent,
          success: false,
          errorMessage: "Cannot update user role",
        })
        return ApiErrorHandler.createErrorResponse("Cannot assign this role", 403)
      }
    }

    // Check for email conflicts
    if (updateData.email && updateData.email !== existingUser.email) {
      const emailExists = await User.findOne({ 
        email: updateData.email.toLowerCase(),
        _id: { $ne: params.id }
      })
      
      if (emailExists) {
        await AuditLogger.log({
          userId: session.user.id,
          userEmail: session.user.email,
          action: "UPDATE_USER_EMAIL_CONFLICT",
          resource: "USER",
          resourceId: params.id,
          details: { attemptedEmail: updateData.email },
          ipAddress: clientInfo.ipAddress,
          userAgent: clientInfo.userAgent,
          success: false,
          errorMessage: "Email already exists",
        })
        return ApiErrorHandler.createErrorResponse("Email already exists", 409)
      }
    }

    // Sanitize string fields
    const sanitizedUpdateData = {
      ...updateData,
      ...(updateData.name && { name: SecurityUtils.sanitizeString(updateData.name) }),
      ...(updateData.email && { email: updateData.email.toLowerCase() }),
      ...(updateData.phone && { phone: SecurityUtils.sanitizeString(updateData.phone) }),
      ...(updateData.department && { department: SecurityUtils.sanitizeString(updateData.department) }),
    }

    // Store original data for audit logging
    const originalData = {
      name: existingUser.name,
      email: existingUser.email,
      role: existingUser.role,
      phone: existingUser.phone,
      department: existingUser.department,
      isActive: existingUser.isActive,
    }

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      params.id, 
      sanitizedUpdateData, 
      {
        new: true,
        runValidators: true,
      }
    ).select("-password")

    if (!updatedUser) {
      return ApiErrorHandler.createErrorResponse("Failed to update user", 500)
    }

    // Log successful update
    await AuditLogger.logUserUpdate({
      adminId: session.user.id,
      adminEmail: session.user.email,
      targetUserId: params.id,
      targetUserEmail: updatedUser.email,
      changes: {
        original: originalData,
        updated: sanitizedUpdateData,
      },
      ipAddress: clientInfo.ipAddress,
      userAgent: clientInfo.userAgent,
      success: true,
    })

    return ApiErrorHandler.createSuccessResponse(
      updatedUser.toJSON(),
      "User updated successfully"
    )
  } catch (error: any) {
    const session = await getServerSession(authOptions)
    const clientInfo = getClientInfo(request)

    return ApiErrorHandler.handleError(error, {
      userId: session?.user?.id,
      userEmail: session?.user?.email,
      action: "UPDATE_USER",
      resource: "USER",
      resourceId: params.id,
      ipAddress: clientInfo.ipAddress,
      userAgent: clientInfo.userAgent,
    })
  }
}

// DELETE /api/users/[id] - Delete user
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const rateLimitResponse = await applyRateLimit(request, "sensitive")
    if (rateLimitResponse) return rateLimitResponse

    const session = await getServerSession(authOptions)
    const clientInfo = getClientInfo(request)

    if (!session?.user) {
      return ApiErrorHandler.createErrorResponse("Unauthorized", 401)
    }

    // Validate ObjectId format
    if (!SecurityUtils.isValidObjectId(params.id)) {
      return ApiErrorHandler.createErrorResponse("Invalid user ID format", 400)
    }

    // Check permissions
    if (!PermissionManager.canDeleteUser(session, params.id)) {
      await AuditLogger.log({
        userId: session.user.id,
        userEmail: session.user.email,
        action: "DELETE_USER_UNAUTHORIZED",
        resource: "USER",
        resourceId: params.id,
        ipAddress: clientInfo.ipAddress,
        userAgent: clientInfo.userAgent,
        success: false,
        errorMessage: "Insufficient permissions to delete user",
      })
      return ApiErrorHandler.createErrorResponse("Insufficient permissions", 403)
    }

    await connectDB()

    const user = await User.findById(params.id)

    if (!user) {
      await AuditLogger.log({
        userId: session.user.id,
        userEmail: session.user.email,
        action: "DELETE_USER_NOT_FOUND",
        resource: "USER",
        resourceId: params.id,
        ipAddress: clientInfo.ipAddress,
        userAgent: clientInfo.userAgent,
        success: false,
        errorMessage: "User not found",
      })
      return ApiErrorHandler.createErrorResponse("User not found", 404)
    }

    // Store user data for audit log before deletion
    const userData = {
      email: user.email,
      name: user.name,
      role: user.role,
    }

    await User.findByIdAndDelete(params.id)

    // Log successful deletion
    await AuditLogger.logUserDeletion({
      adminId: session.user.id,
      adminEmail: session.user.email,
      targetUserId: params.id,
      targetUserEmail: userData.email,
      ipAddress: clientInfo.ipAddress,
      userAgent: clientInfo.userAgent,
      success: true,
    })

    return ApiErrorHandler.createSuccessResponse(
      { id: params.id },
      "User deleted successfully"
    )
  } catch (error: any) {
    const session = await getServerSession(authOptions)
    const clientInfo = getClientInfo(request)

    return ApiErrorHandler.handleError(error, {
      userId: session?.user?.id,
      userEmail: session?.user?.email,
      action: "DELETE_USER",
      resource: "USER",
      resourceId: params.id,
      ipAddress: clientInfo.ipAddress,
      userAgent: clientInfo.userAgent,
    })
  }
}
