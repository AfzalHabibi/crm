import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import connectDB from "@/lib/mongodb"
import User from "@/models/User"
import { authOptions } from "@/lib/auth-config"
import { applyRateLimit } from "@/lib/security/rate-limiter"
import { applySecurityHeaders } from "@/lib/security/helmet-adapter"
import { ApiErrorHandler, getClientInfo, createErrorResponse } from "@/lib/security/error-handler"
import { PermissionManager } from "@/lib/security/permissions"
import { AuditLogger } from "@/lib/security/audit-logger"
import { SecurityUtils } from "@/lib/security/validation"
import { z } from "zod"

const updateUserSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  email: z.string().email().optional(),
  role: z.enum(["admin", "user", "manager", "hr", "finance", "sales"]).optional(),
  phone: z.string().optional(),
  department: z.string().optional(),
  position: z.string().optional(),
  status: z.enum(["active", "inactive", "suspended"]).optional(),
  address: z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    country: z.string().optional(),
    zipCode: z.string().optional(),
  }).optional(),
  socialLinks: z.object({
    linkedin: z.string().url().optional(),
    twitter: z.string().url().optional(),
    github: z.string().url().optional(),
  }).optional(),
  preferences: z.object({
    theme: z.enum(["light", "dark", "system"]).optional(),
    language: z.string().optional(),
    timezone: z.string().optional(),
    notifications: z.object({
      email: z.boolean().optional(),
      push: z.boolean().optional(),
      sms: z.boolean().optional(),
    }).optional(),
  }).optional(),
  metadata: z.object({
    notes: z.string().optional(),
    tags: z.array(z.string()).optional(),
  }).optional(),
})

// GET /api/users/[id] - Get single user by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const rateLimitResponse = await applyRateLimit(request, "api")
    if (rateLimitResponse) return rateLimitResponse

    const session = await getServerSession(authOptions)
    const clientInfo = getClientInfo(request)

    if (!session) {
      return createErrorResponse("Unauthorized", 401)
    }

    const userId = params.id

    // Validate user ID format
    if (!userId || !userId.match(/^[0-9a-fA-F]{24}$/)) {
      return createErrorResponse("Invalid user ID format", 400)
    }

    // Check permissions - users can view their own profile, others need permission
    const canViewUser = 
      session.user.id === userId || 
      PermissionManager.canAccessResource(session, "user", "read")

    if (!canViewUser) {
      await AuditLogger.log({
        userId: session.user.id,
        userEmail: session.user.email,
        action: "GET_USER_UNAUTHORIZED",
        resource: "USER",
        details: { targetUserId: userId },
        ipAddress: clientInfo.ipAddress,
        userAgent: clientInfo.userAgent,
        success: false,
        errorMessage: "Insufficient permissions",
      })
      return createErrorResponse("Insufficient permissions", 403)
    }

    await connectDB()

    const user = await User.findById(userId).select("-password -resetPasswordToken -resetPasswordExpire")

    if (!user) {
      return createErrorResponse("User not found", 404)
    }

    // Log successful access
    await AuditLogger.log({
      userId: session.user.id,
      userEmail: session.user.email,
      action: "GET_USER",
      resource: "USER",
      details: { targetUserId: userId },
      ipAddress: clientInfo.ipAddress,
      userAgent: clientInfo.userAgent,
      success: true,
    })

    const response = NextResponse.json({
      success: true,
      user: user.toJSON(),
      message: "User retrieved successfully"
    })

    return applySecurityHeaders(response)
  } catch (error: any) {
    const session = await getServerSession(authOptions)
    const clientInfo = getClientInfo(request)

    return ApiErrorHandler.handleError(error, {
      userId: session?.user?.id,
      userEmail: session?.user?.email,
      action: "GET_USER",
      resource: "USER",
      ipAddress: clientInfo.ipAddress,
      userAgent: clientInfo.userAgent,
    })
  }
}

// PUT /api/users/[id] - Update user
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const rateLimitResponse = await applyRateLimit(request, "sensitive")
    if (rateLimitResponse) return rateLimitResponse

    const session = await getServerSession(authOptions)
    const clientInfo = getClientInfo(request)

    if (!session) {
      return createErrorResponse("Unauthorized", 401)
    }

    const userId = params.id

    // Validate user ID format
    if (!userId || !userId.match(/^[0-9a-fA-F]{24}$/)) {
      return createErrorResponse("Invalid user ID format", 400)
    }

    // Check permissions - users can update their own basic info, others need permission
    const canUpdateUser = 
      session.user.id === userId || 
      PermissionManager.canAccessResource(session, "user", "update")

    if (!canUpdateUser) {
      await AuditLogger.log({
        userId: session.user.id,
        userEmail: session.user.email,
        action: "UPDATE_USER_UNAUTHORIZED",
        resource: "USER",
        details: { targetUserId: userId },
        ipAddress: clientInfo.ipAddress,
        userAgent: clientInfo.userAgent,
        success: false,
        errorMessage: "Insufficient permissions",
      })
      return createErrorResponse("Insufficient permissions", 403)
    }

    const body = await request.json()

    // Validate input
    const validation = updateUserSchema.safeParse(body)
    if (!validation.success) {
      return createErrorResponse("Validation failed", 400, validation.error.errors)
    }

    const updateData = validation.data

    // Additional role-based validation
    if (updateData.role && session.user.id !== userId) {
      if (!PermissionManager.canAssignRole(session.user.role, updateData.role)) {
        return createErrorResponse("Cannot assign this role", 403)
      }
    }

    // Prevent users from changing their own role unless they're admin
    if (updateData.role && session.user.id === userId && session.user.role !== "admin") {
      return createErrorResponse("Cannot change your own role", 403)
    }

    await connectDB()

    // Check if user exists
    const existingUser = await User.findById(userId)
    if (!existingUser) {
      return createErrorResponse("User not found", 404)
    }

    // Check email uniqueness if email is being updated
    if (updateData.email && updateData.email !== existingUser.email) {
      const emailExists = await User.findOne({ 
        email: updateData.email.toLowerCase(),
        _id: { $ne: userId }
      })
      if (emailExists) {
        return createErrorResponse("Email already exists", 409)
      }
    }

    // Prepare update data
    const sanitizedUpdateData: any = {}
    
    if (updateData.name) sanitizedUpdateData.name = SecurityUtils.sanitizeString(updateData.name)
    if (updateData.email) sanitizedUpdateData.email = updateData.email.toLowerCase()
    if (updateData.role) {
      sanitizedUpdateData.role = updateData.role
      // Update permissions based on new role
      sanitizedUpdateData.permissions = User.getRolePermissions(updateData.role)
    }
    if (updateData.phone) sanitizedUpdateData.phone = SecurityUtils.sanitizeString(updateData.phone)
    if (updateData.department) sanitizedUpdateData.department = SecurityUtils.sanitizeString(updateData.department)
    if (updateData.position) sanitizedUpdateData.position = SecurityUtils.sanitizeString(updateData.position)
    if (updateData.status) sanitizedUpdateData.status = updateData.status
    if (updateData.address) sanitizedUpdateData.address = updateData.address
    if (updateData.socialLinks) sanitizedUpdateData.socialLinks = updateData.socialLinks
    if (updateData.preferences) {
      sanitizedUpdateData.preferences = {
        ...existingUser.preferences,
        ...updateData.preferences
      }
    }
    if (updateData.metadata) {
      sanitizedUpdateData.metadata = {
        ...existingUser.metadata,
        ...updateData.metadata,
        updatedBy: session.user.id
      }
    }

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      sanitizedUpdateData,
      { new: true, runValidators: true }
    ).select("-password -resetPasswordToken -resetPasswordExpire")

    // Log successful update
    await AuditLogger.log({
      userId: session.user.id,
      userEmail: session.user.email,
      action: "UPDATE_USER",
      resource: "USER",
      details: { 
        targetUserId: userId,
        updatedFields: Object.keys(sanitizedUpdateData),
        changes: sanitizedUpdateData
      },
      ipAddress: clientInfo.ipAddress,
      userAgent: clientInfo.userAgent,
      success: true,
    })

    const response = NextResponse.json({
      success: true,
      user: updatedUser?.toJSON(),
      message: "User updated successfully"
    })

    return applySecurityHeaders(response)
  } catch (error: any) {
    const session = await getServerSession(authOptions)
    const clientInfo = getClientInfo(request)

    return ApiErrorHandler.handleError(error, {
      userId: session?.user?.id,
      userEmail: session?.user?.email,
      action: "UPDATE_USER",
      resource: "USER",
      ipAddress: clientInfo.ipAddress,
      userAgent: clientInfo.userAgent,
    })
  }
}

// DELETE /api/users/[id] - Delete user
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const rateLimitResponse = await applyRateLimit(request, "sensitive")
    if (rateLimitResponse) return rateLimitResponse

    const session = await getServerSession(authOptions)
    const clientInfo = getClientInfo(request)

    if (!session) {
      return createErrorResponse("Unauthorized", 401)
    }

    const userId = params.id

    // Validate user ID format
    if (!userId || !userId.match(/^[0-9a-fA-F]{24}$/)) {
      return createErrorResponse("Invalid user ID format", 400)
    }

    // Check permissions - only admin or manager can delete users
    if (!PermissionManager.canDeleteUser(session)) {
      await AuditLogger.log({
        userId: session.user.id,
        userEmail: session.user.email,
        action: "DELETE_USER_UNAUTHORIZED",
        resource: "USER",
        details: { targetUserId: userId },
        ipAddress: clientInfo.ipAddress,
        userAgent: clientInfo.userAgent,
        success: false,
        errorMessage: "Insufficient permissions",
      })
      return createErrorResponse("Insufficient permissions", 403)
    }

    // Prevent users from deleting themselves
    if (session.user.id === userId) {
      return createErrorResponse("Cannot delete your own account", 403)
    }

    await connectDB()

    // Check if user exists
    const existingUser = await User.findById(userId)
    if (!existingUser) {
      return createErrorResponse("User not found", 404)
    }

    // Prevent deleting the last admin
    if (existingUser.role === "admin") {
      const adminCount = await User.countDocuments({ role: "admin", _id: { $ne: userId } })
      if (adminCount === 0) {
        return createErrorResponse("Cannot delete the last admin user", 403)
      }
    }

    // Soft delete by setting status to inactive and isActive to false
    const deletedUser = await User.findByIdAndUpdate(
      userId,
      { 
        status: "inactive",
        isActive: false,
        metadata: {
          ...existingUser.metadata,
          updatedBy: session.user.id,
          deletedAt: new Date(),
          deletedBy: session.user.id
        }
      },
      { new: true }
    ).select("-password -resetPasswordToken -resetPasswordExpire")

    // Log successful deletion
    await AuditLogger.log({
      userId: session.user.id,
      userEmail: session.user.email,
      action: "DELETE_USER",
      resource: "USER",
      details: { 
        targetUserId: userId,
        targetUserEmail: existingUser.email,
        deletionType: "soft_delete"
      },
      ipAddress: clientInfo.ipAddress,
      userAgent: clientInfo.userAgent,
      success: true,
    })

    const response = NextResponse.json({
      success: true,
      user: deletedUser?.toJSON(),
      message: "User deleted successfully"
    })

    return applySecurityHeaders(response)
  } catch (error: any) {
    const session = await getServerSession(authOptions)
    const clientInfo = getClientInfo(request)

    return ApiErrorHandler.handleError(error, {
      userId: session?.user?.id,
      userEmail: session?.user?.email,
      action: "DELETE_USER",
      resource: "USER",
      ipAddress: clientInfo.ipAddress,
      userAgent: clientInfo.userAgent,
    })
  }
}