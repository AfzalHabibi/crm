import { type NextRequest, NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import User from "@/models/User"
import { registerSchema } from "@/lib/validations/auth"
import { applySecurityHeaders } from "@/lib/security/helmet-adapter"
import { AuditLogger } from "@/lib/security/audit-logger"
import { RateLimiterMemory } from "rate-limiter-flexible"

// Create rate limiter for registration attempts
const registerRateLimiter = new RateLimiterMemory({
  points: 3, // Number of attempts (stricter for registration)
  duration: 900, // Per 15 minutes (900 seconds)
  blockDuration: 1800, // Block for 30 minutes after limit exceeded
})

export async function POST(request: NextRequest) {
  try {
    // Get client IP
    const clientIP = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     '127.0.0.1'

    console.log(`Registration attempt from IP: ${clientIP}`) // Debug log

    // Apply rate limiting
    try {
      const rateLimitResult = await registerRateLimiter.consume(clientIP)
      console.log(`Rate limit check passed. Remaining attempts: ${rateLimitResult.remainingPoints}`) // Debug log
    } catch (rateLimiterRes: any) {
      // Rate limit exceeded
      const secs = Math.round(rateLimiterRes.msBeforeNext / 1000) || 1800
      
      console.log(`Registration rate limit exceeded for IP: ${clientIP}, retry in ${secs} seconds`) // Debug log

      const response = NextResponse.json(
        { 
          success: false, 
          error: `Too many registration attempts. Try again in ${Math.ceil(secs / 60)} minutes.`,
          retryAfter: secs
        },
        { status: 429 }
      )

      // Set rate limit headers
      response.headers.set('Retry-After', secs.toString())
      response.headers.set('X-RateLimit-Limit', '3')
      response.headers.set('X-RateLimit-Remaining', '0')
      response.headers.set('X-RateLimit-Reset', new Date(Date.now() + secs * 1000).toISOString())

      return applySecurityHeaders(response)
    }

    // Parse and validate request body
    const body = await request.json()

    console.log(`Registration attempt for email: ${body.email}`) // Debug log

    // Validate with Zod schema (protects against NoSQL injection)
    const validatedFields = registerSchema.safeParse(body)
    if (!validatedFields.success) {
      await AuditLogger.log({
        action: 'REGISTRATION_VALIDATION_FAILED',
        resource: 'AUTH',
        details: {
          email: body.email || 'unknown',
          ipAddress: clientIP,
          userAgent: request.headers.get('user-agent') || 'unknown',
          errors: validatedFields.error.flatten().fieldErrors,
        },
        success: false,
        errorMessage: 'Registration validation failed'
      })

      const response = NextResponse.json(
        { 
          success: false, 
          error: 'Invalid registration data',
          details: validatedFields.error.flatten().fieldErrors
        },
        { status: 400 }
      )
      return applySecurityHeaders(response)
    }

    const { name, email, password } = validatedFields.data

    // Additional NoSQL injection protection
    if (typeof name !== 'string' || typeof email !== 'string' || typeof password !== 'string') {
      console.log(`NoSQL injection attempt detected in registration from IP: ${clientIP}`) // Debug log
      
      const response = NextResponse.json(
        { success: false, error: 'Invalid registration data' },
        { status: 400 }
      )
      return applySecurityHeaders(response)
    }

    // Connect to database
    await connectDB()

    // Check if user already exists (MongoDB query is safe due to Zod validation)
    const existingUser = await User.findOne({ 
      email: email.toLowerCase() // This is safe because email is validated as string
    })

    if (existingUser) {
      // Log registration attempt with existing email
      await AuditLogger.log({
        action: 'DUPLICATE_REGISTRATION_ATTEMPT',
        resource: 'AUTH',
        details: {
          email: email,
          ipAddress: clientIP,
          userAgent: request.headers.get('user-agent') || 'unknown',
        },
        success: false,
        errorMessage: 'Registration attempt with existing email'
      })

      console.log(`Registration failed - email already exists: ${email}`) // Debug log

      const response = NextResponse.json(
        { 
          success: false, 
          error: 'An account with this email already exists' 
        },
        { status: 409 }
      )
      return applySecurityHeaders(response)
    }

    // Create new user
    const user = new User({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password, // Will be hashed by the User model
      role: 'user',
      isActive: true,
    })

    await user.save()

    // Log successful registration
    await AuditLogger.log({
      action: 'USER_REGISTERED',
      resource: 'USER',
      resourceId: user._id.toString(),
      details: {
        userId: user._id.toString(),
        email: user.email,
        name: user.name,
        ipAddress: clientIP,
        userAgent: request.headers.get('user-agent') || 'unknown',
      },
      success: true
    })

    console.log(`Successful registration: ${email}`) // Debug log
    console.log(`Rate limit NOT reset - registration counts toward limit`) // Debug log

    // Return success response (don't include sensitive data)
    const response = NextResponse.json({
      success: true,
      message: 'Account created successfully',
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
      }
    }, { status: 201 })

    return applySecurityHeaders(response)

  } catch (error: any) {
    console.error('Registration error:', error)

    // Log the error
    await AuditLogger.log({
      action: 'REGISTRATION_ERROR',
      resource: 'AUTH',
      details: {
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString(),
      },
      success: false,
      errorMessage: `Registration endpoint error: ${error.message}`
    })

    const response = NextResponse.json(
      { 
        success: false, 
        error: 'Registration failed. Please try again.' 
      },
      { status: 500 }
    )

    return applySecurityHeaders(response)
  }
}