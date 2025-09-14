import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import connectDB from "@/lib/mongodb"
import User from "@/models/User"
import { authOptions } from "@/lib/auth-config"
import { secureRegisterSchema } from "@/lib/security/validation"
import { applyRateLimit } from "@/lib/security/rate-limiter"
import { ApiErrorHandler, getClientInfo, createErrorResponse } from "@/lib/security/error-handler"
import { PermissionManager } from "@/lib/security/permissions"
import { AuditLogger } from "@/lib/security/audit-logger"
import { SecurityUtils } from "@/lib/security/validation"

// GET /api/users - Get all users with pagination and search
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
        errorMessage: "Insufficient permissions to view all users",
      })
      return createErrorResponse("Insufficient permissions", 403)
    }

    const { searchParams } = new URL(request.url)
    const page = Math.max(1, Number.parseInt(searchParams.get("page") || "1"))
    const limit = Math.min(100, Math.max(1, Number.parseInt(searchParams.get("limit") || "10")))
    const search = SecurityUtils.sanitizeString(searchParams.get("search") || "")
    const sortBy = SecurityUtils.sanitizeString(searchParams.get("sortBy") || "createdAt")
    const sortOrder = searchParams.get("sortOrder") === "asc" ? "asc" : "desc"

    await connectDB()

    // Build search query with security validation
    let searchQuery = {}
    if (search) {
      // Validate search term for security
      const searchValidation = SecurityUtils.validateInput(search, "string")
      if (!searchValidation.isValid) {
        return createErrorResponse("Invalid search term", 400)
      }

      searchQuery = {
        $or: [
          { name: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
          { department: { $regex: search, $options: "i" } },
        ],
      }
    }

    // Validate sort field to prevent NoSQL injection
    const allowedSortFields = ["name", "email", "role", "department", "createdAt", "updatedAt", "isActive"]
    const safeSortBy = allowedSortFields.includes(sortBy) ? sortBy : "createdAt"

    // Calculate pagination
    const skip = (page - 1) * limit
    const sortOptions: any = {}
    sortOptions[safeSortBy] = sortOrder === "asc" ? 1 : -1

    // Get users and total count
    const [users, total] = await Promise.all([
      User.find(searchQuery)
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .select("-password") // Explicitly exclude password
        .lean(),
      User.countDocuments(searchQuery),
    ])

    const pages = Math.ceil(total / limit)

    // Log successful access
    await AuditLogger.log({
      userId: session.user.id,
      userEmail: session.user.email,
      action: "GET_USERS",
      resource: "USER",
      details: {
        page,
        limit,
        search,
        total,
      },
      ipAddress: clientInfo.ipAddress,
      userAgent: clientInfo.userAgent,
      success: true,
    })

    return ApiErrorHandler.createPaginatedResponse(users, {
      page,
      limit,
      total,
      pages,
    })
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

// POST /api/users - Create new user
export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting for sensitive operations
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

    // Validate input with enhanced security
    const validatedFields = secureRegisterSchema.safeParse(body)

    if (!validatedFields.success) {
      await AuditLogger.log({
        userId: session.user.id,
        userEmail: session.user.email,
        action: "CREATE_USER_VALIDATION_ERROR",
        resource: "USER",
        details: { errors: validatedFields.error.errors },
        ipAddress: clientInfo.ipAddress,
        userAgent: clientInfo.userAgent,
        success: false,
        errorMessage: "Validation failed",
      })
      return ApiErrorHandler.handleError(validatedFields.error)
    }

    const { name, email, password, role, phone, department } = validatedFields.data

    // Check if current user can assign this role
    if (!PermissionManager.canAssignRole(session.user.role, role)) {
      await AuditLogger.log({
        userId: session.user.id,
        userEmail: session.user.email,
        action: "CREATE_USER_ROLE_ERROR",
        resource: "USER",
        details: { attemptedRole: role },
        ipAddress: clientInfo.ipAddress,
        userAgent: clientInfo.userAgent,
        success: false,
        errorMessage: "Cannot assign this role",
      })
      return createErrorResponse("Cannot assign this role", 403)
    }

    // Additional password strength validation
    const passwordCheck = SecurityUtils.checkPasswordStrength(password)
    if (!passwordCheck.isStrong) {
      return createErrorResponse(
        "Password is too weak",
        400,
        undefined,
        { feedback: passwordCheck.feedback }
      )
    }

    await connectDB()

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() })

    if (existingUser) {
      await AuditLogger.log({
        userId: session.user.id,
        userEmail: session.user.email,
        action: "CREATE_USER_DUPLICATE",
        resource: "USER",
        details: { attemptedEmail: email },
        ipAddress: clientInfo.ipAddress,
        userAgent: clientInfo.userAgent,
        success: false,
        errorMessage: "User already exists",
      })
      return createErrorResponse("User with this email already exists", 409)
    }

    // Create new user with sanitized data
    const userData = {
      name: SecurityUtils.sanitizeString(name),
      email: email.toLowerCase(),
      password,
      role,
      phone: phone ? SecurityUtils.sanitizeString(phone) : undefined,
      department: department ? SecurityUtils.sanitizeString(department) : undefined,
    }

    const user = await User.create(userData)

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

    return ApiErrorHandler.createSuccessResponse(
      user.toJSON(),
      "User created successfully",
      201
    )
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
