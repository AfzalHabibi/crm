import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import connectDB from "@/lib/mongodb"
import User from "@/models/User"
import { authOptions } from "@/lib/auth-config"
import { secureRegisterSchema } from "@/lib/security/validation"
import { applyRateLimit } from "@/lib/security/rate-limiter"
import { applyExpressRateLimit } from "@/lib/security/express-rate-limit-adapter"
import { runValidation, userValidation, combineValidations } from "@/lib/security/express-validation"
import { createSecurityMiddleware, SecurityEventType, logSecurityEvent, applySecurityHeaders } from "@/lib/security/helmet-adapter"
import { ApiErrorHandler, getClientInfo, createErrorResponse } from "@/lib/security/error-handler"
import { PermissionManager } from "@/lib/security/permissions"
import { AuditLogger } from "@/lib/security/audit-logger"
import { SecurityUtils } from "@/lib/security/validation"
import { z } from "zod"

const securityMiddleware = createSecurityMiddleware()

// Enhanced validation schemas
const createUserSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100, "Name must be less than 100 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["admin", "user", "manager", "hr", "finance", "sales"]),
  phone: z.string().optional(),
  department: z.string().optional(),
  position: z.string().optional(),
  status: z.enum(["active", "inactive", "suspended"]).default("active"),
  address: z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    country: z.string().optional(),
    zipCode: z.string().optional(),
  }).optional(),
  metadata: z.object({
    notes: z.string().optional(),
    tags: z.array(z.string()).optional(),
  }).optional(),
})

const querySchema = z.object({
  page: z.string().transform(val => Math.max(1, parseInt(val) || 1)),
  limit: z.string().transform(val => Math.min(100, Math.max(1, parseInt(val) || 10))),
  search: z.string().optional(),
  role: z.string().optional(),
  status: z.enum(["active", "inactive", "suspended"]).optional(),
  department: z.string().optional(),
  sortBy: z.string().default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
})

// GET /api/users - Get all users with advanced filtering, pagination, and search
export async function GET(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResponse = await applyRateLimit(request, "api")
    if (rateLimitResponse) return rateLimitResponse

    const session = await getServerSession(authOptions)
    const clientInfo = getClientInfo(request)

    if (!session) {
      return createErrorResponse("Unauthorized", 401)
    }

    // Check permissions
    if (!PermissionManager.canAccessResource(session, "user", "read")) {
      await AuditLogger.log({
        userId: session.user.id,
        userEmail: session.user.email,
        action: "GET_USERS_UNAUTHORIZED",
        resource: "USER",
        ipAddress: clientInfo.ipAddress,
        userAgent: clientInfo.userAgent,
        success: false,
        errorMessage: "Insufficient permissions to view users",
      })
      return createErrorResponse("Insufficient permissions", 403)
    }

    // Parse and validate query parameters
    const { searchParams } = new URL(request.url)
    const queryParams = Object.fromEntries(searchParams.entries())
    
    const validation = querySchema.safeParse(queryParams)
    if (!validation.success) {
      return createErrorResponse("Invalid query parameters", 400, validation.error.errors)
    }

    const { page, limit, search, role, status, department, sortBy, sortOrder } = validation.data

    await connectDB()

    // Build search query
    let searchQuery: any = {}
    
    if (search) {
      const sanitizedSearch = SecurityUtils.sanitizeString(search)
      searchQuery.$or = [
        { name: { $regex: sanitizedSearch, $options: "i" } },
        { email: { $regex: sanitizedSearch, $options: "i" } },
        { department: { $regex: sanitizedSearch, $options: "i" } },
        { position: { $regex: sanitizedSearch, $options: "i" } },
      ]
    }

    // Add filters
    if (role) searchQuery.role = role
    if (status) searchQuery.status = status
    if (department) searchQuery.department = department

    // Validate sort field
    const allowedSortFields = [
      "name", "email", "role", "department", "position", 
      "status", "createdAt", "updatedAt", "lastLogin"
    ]
    const safeSortBy = allowedSortFields.includes(sortBy) ? sortBy : "createdAt"

    // Calculate pagination
    const skip = (page - 1) * limit
    const sortOptions: any = {}
    sortOptions[safeSortBy] = sortOrder === "asc" ? 1 : -1

    // Execute query with aggregation for better performance
    const aggregationPipeline = [
      { $match: searchQuery },
      {
        $project: {
          password: 0,
          resetPasswordToken: 0,
          resetPasswordExpire: 0,
        }
      },
      { $sort: sortOptions },
      {
        $facet: {
          users: [
            { $skip: skip },
            { $limit: limit }
          ],
          totalCount: [
            { $count: "count" }
          ]
        }
      }
    ]

    const [result] = await User.aggregate(aggregationPipeline)
    const users = result.users
    const total = result.totalCount[0]?.count || 0
    const pages = Math.ceil(total / limit)

    // Get statistics for dashboard
    const stats = await User.aggregate([
      {
        $group: {
          _id: null,
          totalUsers: { $sum: 1 },
          activeUsers: { $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] } },
          inactiveUsers: { $sum: { $cond: [{ $eq: ["$status", "inactive"] }, 1, 0] } },
          suspendedUsers: { $sum: { $cond: [{ $eq: ["$status", "suspended"] }, 1, 0] } },
          roleDistribution: {
            $push: "$role"
          }
        }
      }
    ])

    // Log successful access
    await AuditLogger.log({
      userId: session.user.id,
      userEmail: session.user.email,
      action: "GET_USERS",
      resource: "USER",
      details: { page, limit, search, total, filters: { role, status, department } },
      ipAddress: clientInfo.ipAddress,
      userAgent: clientInfo.userAgent,
      success: true,
    })

    const response = NextResponse.json({
      success: true,
      users,
      pagination: { page, limit, total, pages },
      stats: stats[0] || {
        totalUsers: 0,
        activeUsers: 0,
        inactiveUsers: 0,
        suspendedUsers: 0,
        roleDistribution: []
      },
      message: "Users retrieved successfully"
    })

    return applySecurityHeaders(response)
  } catch (error: any) {
    const session = await getServerSession(authOptions)
    const clientInfo = getClientInfo(request)

    return ApiErrorHandler.handleError(error, {
      userId: session?.user?.id,
      userEmail: session?.user?.email,
      action: "GET_USERS",
      resource: "USER",
      ipAddress: clientInfo.ipAddress,
      userAgent: clientInfo.userAgent,
    })
  }
}

// POST /api/users - Create new user with enhanced validation
export async function POST(request: NextRequest) {
  try {
    // Apply strict rate limiting for user creation
    const rateLimitResponse = await applyRateLimit(request, "sensitive")
    if (rateLimitResponse) return rateLimitResponse

    const session = await getServerSession(authOptions)
    const clientInfo = getClientInfo(request)

    if (!session) {
      return createErrorResponse("Unauthorized", 401)
    }

    // Check permissions
    if (!PermissionManager.canCreateUser(session)) {
      await AuditLogger.log({
        userId: session.user.id,
        userEmail: session.user.email,
        action: "CREATE_USER_UNAUTHORIZED",
        resource: "USER",
        ipAddress: clientInfo.ipAddress,
        userAgent: clientInfo.userAgent,
        success: false,
        errorMessage: "Insufficient permissions to create user",
      })
      return createErrorResponse("Insufficient permissions", 403)
    }

    const body = await request.json()

    // Validate input
    const validation = createUserSchema.safeParse(body)
    if (!validation.success) {
      await AuditLogger.log({
        userId: session.user.id,
        userEmail: session.user.email,
        action: "CREATE_USER_VALIDATION_ERROR",
        resource: "USER",
        details: { errors: validation.error.errors },
        ipAddress: clientInfo.ipAddress,
        userAgent: clientInfo.userAgent,
        success: false,
        errorMessage: "Validation failed",
      })
      return createErrorResponse("Validation failed", 400, validation.error.errors)
    }

    const userData = validation.data

    // Check if current user can assign this role
    if (!PermissionManager.canAssignRole(session.user.role, userData.role)) {
      await AuditLogger.log({
        userId: session.user.id,
        userEmail: session.user.email,
        action: "CREATE_USER_ROLE_ERROR",
        resource: "USER",
        details: { attemptedRole: userData.role },
        ipAddress: clientInfo.ipAddress,
        userAgent: clientInfo.userAgent,
        success: false,
        errorMessage: "Cannot assign this role",
      })
      return createErrorResponse("Cannot assign this role", 403)
    }

    // Validate password strength
    const passwordCheck = SecurityUtils.checkPasswordStrength(userData.password)
    if (!passwordCheck.isStrong) {
      return createErrorResponse(
        "Password does not meet security requirements",
        400,
        { feedback: passwordCheck.feedback }
      )
    }

    await connectDB()

    // Check if user already exists
    const existingUser = await User.findOne({ 
      email: userData.email.toLowerCase() 
    })

    if (existingUser) {
      await AuditLogger.log({
        userId: session.user.id,
        userEmail: session.user.email,
        action: "CREATE_USER_DUPLICATE",
        resource: "USER",
        details: { attemptedEmail: userData.email },
        ipAddress: clientInfo.ipAddress,
        userAgent: clientInfo.userAgent,
        success: false,
        errorMessage: "User already exists",
      })
      return createErrorResponse("User with this email already exists", 409)
    }

    // Set default permissions based on role
    const permissions = User.getRolePermissions(userData.role)

    // Create user with enhanced data
    const newUserData = {
      ...userData,
      email: userData.email.toLowerCase(),
      permissions,
      emailVerified: false,
      phoneVerified: false,
      twoFactorEnabled: false,
      preferences: {
        theme: "system",
        language: "en",
        timezone: "UTC",
        notifications: {
          email: true,
          push: true,
          sms: false,
        },
      },
      metadata: {
        createdBy: session.user.id,
        notes: userData.metadata?.notes || "",
        tags: userData.metadata?.tags || [],
      },
    }

    const user = await User.create(newUserData)

    // Log successful user creation
    await AuditLogger.logUserCreation({
      adminId: session.user.id,
      adminEmail: session.user.email,
      targetUserId: user._id.toString(),
      targetUserEmail: user.email,
      ipAddress: clientInfo.ipAddress,
      userAgent: clientInfo.userAgent,
      success: true,
    })

    const response = NextResponse.json({
      success: true,
      user: user.toJSON(),
      message: "User created successfully"
    }, { status: 201 })

    return applySecurityHeaders(response)
  } catch (error: any) {
    const session = await getServerSession(authOptions)
    const clientInfo = getClientInfo(request)

    return ApiErrorHandler.handleError(error, {
      userId: session?.user?.id,
      userEmail: session?.user?.email,
      action: "CREATE_USER",
      resource: "USER",
      ipAddress: clientInfo.ipAddress,
      userAgent: clientInfo.userAgent,
    })
  }
}
