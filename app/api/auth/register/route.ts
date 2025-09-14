import { type NextRequest } from "next/server"
import connectDB from "@/lib/mongodb"
import User from "@/models/User"
import { secureRegisterSchema } from "@/lib/security/validation"
import { applyRateLimit } from "@/lib/security/rate-limiter"
import { ApiErrorHandler, getClientInfo, createErrorResponse } from "@/lib/security/error-handler"
import { AuditLogger } from "@/lib/security/audit-logger"
import { SecurityUtils } from "@/lib/security/validation"

export async function POST(request: NextRequest) {
  try {
    // Apply strict rate limiting for registration
    const rateLimitResponse = await applyRateLimit(request, "auth")
    if (rateLimitResponse) return rateLimitResponse

    const clientInfo = getClientInfo(request)
    const body = await request.json()

    // Validate input with enhanced security
    const validatedFields = secureRegisterSchema.safeParse(body)

    if (!validatedFields.success) {
      await AuditLogger.log({
        action: "REGISTRATION_VALIDATION_ERROR",
        resource: "AUTH",
        details: { errors: validatedFields.error.errors },
        ipAddress: clientInfo.ipAddress,
        userAgent: clientInfo.userAgent,
        success: false,
        errorMessage: "Registration validation failed",
      })
      return ApiErrorHandler.handleError(validatedFields.error)
    }

    const { name, email, password, role, phone, department } = validatedFields.data

    // Additional password strength validation
    const passwordCheck = SecurityUtils.checkPasswordStrength(password)
    if (!passwordCheck.isStrong) {
      await AuditLogger.log({
        userEmail: email,
        action: "REGISTRATION_WEAK_PASSWORD",
        resource: "AUTH",
        ipAddress: clientInfo.ipAddress,
        userAgent: clientInfo.userAgent,
        success: false,
        errorMessage: "Weak password attempted",
      })
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
        userEmail: email,
        action: "REGISTRATION_DUPLICATE_EMAIL",
        resource: "AUTH",
        ipAddress: clientInfo.ipAddress,
        userAgent: clientInfo.userAgent,
        success: false,
        errorMessage: "Registration attempt with existing email",
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

    // Log successful registration
    await AuditLogger.log({
      userId: user._id.toString(),
      userEmail: user.email,
      action: "REGISTRATION_SUCCESS",
      resource: "AUTH",
      details: {
        role: user.role,
        department: user.department,
      },
      ipAddress: clientInfo.ipAddress,
      userAgent: clientInfo.userAgent,
      success: true,
    })

    return ApiErrorHandler.createSuccessResponse(
      {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      "Account created successfully",
      201
    )
  } catch (error: any) {
    const clientInfo = getClientInfo(request)

    return ApiErrorHandler.handleError(error, {
      action: "REGISTRATION",
      resource: "AUTH",
      ipAddress: clientInfo.ipAddress,
      userAgent: clientInfo.userAgent,
    })
  }
}
