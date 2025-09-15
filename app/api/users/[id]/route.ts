import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import connectDB from "@/lib/mongodb"
import User from "@/models/User"
import { authOptions } from "@/lib/auth-config"
import { applyRateLimit } from "@/lib/security/rate-limiter"
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
})

// GET /api/users/[id] - Get single user by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const rateLimitResponse = await applyRateLimit(request, "api")
    if (rateLimitResponse) return rateLimitResponse

    const session = await getServerSession(authOptions)
    const clientInfo = getClientInfo(request)

    if (!session?.user) {
      return createErrorResponse("Unauthorized", 401)
    }

    const { id } = await params

    // Validate Object ID
    if (!SecurityUtils.isValidObjectId(id)) {
      return createErrorResponse("Invalid user ID format", 400)
    }

    // Check permissions
    if (!PermissionManager.canAccessUser(session, id)) {
      return createErrorResponse("Forbidden", 403)
    }

    await connectDB()

    const user = await User.findById(id).select("-password").lean()

    if (!user) {
      return createErrorResponse("User not found", 404)
    }

    return ApiErrorHandler.createSuccessResponse(user)
  } catch (error: any) {
    return ApiErrorHandler.handleError(error, {
      userId: undefined,
      userEmail: undefined,
      action: "GET_USER",
      resource: "USER",
      resourceId: id,
      ipAddress: getClientInfo(request).ipAddress,
      userAgent: getClientInfo(request).userAgent,
    })
  }
}

// PUT /api/users/[id] - Update user
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const rateLimitResponse = await applyRateLimit(request, "sensitive")
    if (rateLimitResponse) return rateLimitResponse

    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return createErrorResponse("Unauthorized", 401)
    }

    const { id } = await params

    // Validate Object ID
    if (!SecurityUtils.isValidObjectId(id)) {
      return createErrorResponse("Invalid user ID format", 400)
    }

    // Check permissions
    if (!PermissionManager.canModifyUser(session, id)) {
      return createErrorResponse("Forbidden", 403)
    }

    const body = await request.json()
    const validatedFields = updateUserSchema.safeParse(body)

    if (!validatedFields.success) {
      return createErrorResponse("Validation failed", 400)
    }

    await connectDB()

    // Check if user exists
    const existingUser = await User.findById(params.id)
    if (!existingUser) {
      return createErrorResponse("User not found", 404)
    }

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      params.id,
      {
        ...validatedFields.data,
        updatedAt: new Date(),
      },
      { new: true, runValidators: true }
    ).select("-password")

    return ApiErrorHandler.createSuccessResponse(updatedUser, "User updated successfully")
  } catch (error: any) {
    return ApiErrorHandler.handleError(error, {
      userId: undefined,
      userEmail: undefined,
      action: "UPDATE_USER",
      resource: "USER",
      resourceId: params.id,
      ipAddress: getClientInfo(request).ipAddress,
      userAgent: getClientInfo(request).userAgent,
    })
  }
}

// DELETE /api/users/[id] - Delete user
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const rateLimitResponse = await applyRateLimit(request, "sensitive")
    if (rateLimitResponse) return rateLimitResponse

    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return createErrorResponse("Unauthorized", 401)
    }

    const { id } = await params

    // Validate Object ID
    if (!SecurityUtils.isValidObjectId(id)) {
      return createErrorResponse("Invalid user ID format", 400)
    }

    // Check permissions
    if (!PermissionManager.canDeleteUser(session, id)) {
      return createErrorResponse("Forbidden", 403)
    }

    await connectDB()

    // Check if user exists
    const existingUser = await User.findById(id)
    if (!existingUser) {
      return createErrorResponse("User not found", 404)
    }

    // Prevent deleting admin users
    if (existingUser.role === 'admin') {
      return createErrorResponse("Cannot delete admin users", 403)
    }

    // Delete user
    await User.findByIdAndDelete(id)

    return ApiErrorHandler.createSuccessResponse(null, "User deleted successfully")
  } catch (error: any) {
    return ApiErrorHandler.handleError(error, {
      userId: undefined,
      userEmail: undefined,
      action: "DELETE_USER",
      resource: "USER",
      resourceId: id,
      ipAddress: getClientInfo(request).ipAddress,
      userAgent: getClientInfo(request).userAgent,
    })
  }
}