import { NextRequest, NextResponse } from "next/server"
import { applySecurityHeaders } from "@/lib/security/helmet-adapter"
import { AuditLogger } from "@/lib/security/audit-logger"
import connectDB from "@/lib/mongodb"
import User from "@/models/User"
import { loginSchema } from "@/lib/validations/auth"
import { RateLimiterMemory } from "rate-limiter-flexible"

// Create rate limiter for login attempts
const loginRateLimiter = new RateLimiterMemory({
  points: 5, // Number of attempts
  duration: 900, // Per 15 minutes (900 seconds)
  blockDuration: 900, // Block for 15 minutes after limit exceeded
})

export async function POST(request: NextRequest) {
  try {
    // Get client IP
    const clientIP = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     '127.0.0.1'

    console.log(`Login attempt from IP: ${clientIP}`) // Debug log

    // Apply rate limiting
    try {
      await loginRateLimiter.consume(clientIP)
    } catch (rateLimiterRes: any) {
      // Rate limit exceeded
      const secs = Math.round(rateLimiterRes.msBeforeNext / 1000) || 300
      
      console.log(`Rate limit exceeded for IP: ${clientIP}, retry in ${secs} seconds`) // Debug log

      const response = NextResponse.json(
        { 
          success: false, 
          error: `Too many login attempts. Try again in ${secs} seconds.`,
          retryAfter: secs
        },
        { status: 429 }
      )

      // Set rate limit headers
      response.headers.set('Retry-After', secs.toString())
      response.headers.set('X-RateLimit-Limit', '5')
      response.headers.set('X-RateLimit-Remaining', '0')
      response.headers.set('X-RateLimit-Reset', new Date(Date.now() + secs * 1000).toISOString())

      return applySecurityHeaders(response)
    }

    // Parse and validate request body
    const body = await request.json()

    console.log(`Login attempt for email: ${body.email}`) // Debug log

    // Validate with Zod schema (protects against NoSQL injection)
    const validatedFields = loginSchema.safeParse(body)
    if (!validatedFields.success) {
      await AuditLogger.logFailedLogin({
        email: body.email || 'unknown',
        ipAddress: clientIP,
        userAgent: request.headers.get('user-agent') || 'unknown',
        errorMessage: 'Schema validation failed',
      })

      const response = NextResponse.json(
        { 
          success: false, 
          error: 'Invalid credentials format',
          details: validatedFields.error.flatten().fieldErrors
        },
        { status: 400 }
      )
      return applySecurityHeaders(response)
    }

    const { email, password } = validatedFields.data

    // Additional NoSQL injection protection
    if (typeof email !== 'string' || typeof password !== 'string') {
      console.log(`NoSQL injection attempt detected from IP: ${clientIP}`) // Debug log
      
      const response = NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      )
      return applySecurityHeaders(response)
    }

    // Connect to database
    await connectDB()

    // Find user with password field (MongoDB query is safe due to Zod validation)
    const user = await User.findOne({ 
      email: email.toLowerCase() // This is safe because email is validated as string
    }).select("+password")

    if (!user) {
      // Log failed login attempt
      await AuditLogger.logFailedLogin({
        email: email,
        ipAddress: clientIP,
        userAgent: request.headers.get('user-agent') || 'unknown',
        errorMessage: 'User not found',
      })

      console.log(`Failed login - user not found: ${email}`) // Debug log

      const response = NextResponse.json(
        { 
          success: false, 
          error: 'Invalid credentials' 
        },
        { status: 401 }
      )
      return applySecurityHeaders(response)
    }

    if (!user.isActive) {
      // Log failed login attempt for deactivated user
      await AuditLogger.logFailedLogin({
        email: email,
        ipAddress: clientIP,
        userAgent: request.headers.get('user-agent') || 'unknown',
        errorMessage: 'Account deactivated',
      })

      console.log(`Failed login - account deactivated: ${email}`) // Debug log

      const response = NextResponse.json(
        { 
          success: false, 
          error: 'Account is deactivated' 
        },
        { status: 401 }
      )
      return applySecurityHeaders(response)
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password)

    if (!isPasswordValid) {
      // Log failed login attempt
      await AuditLogger.logFailedLogin({
        email: email,
        ipAddress: clientIP,
        userAgent: request.headers.get('user-agent') || 'unknown',
        errorMessage: 'Invalid password',
      })

      console.log(`Failed login - invalid password: ${email}`) // Debug log

      const response = NextResponse.json(
        { 
          success: false, 
          error: 'Invalid credentials' 
        },
        { status: 401 }
      )
      return applySecurityHeaders(response)
    }

    // Reset rate limit on successful login
    await loginRateLimiter.delete(clientIP)

    // Log successful login
    await AuditLogger.logUserLogin({
      userId: user._id.toString(),
      userEmail: user.email,
      ipAddress: clientIP,
      userAgent: request.headers.get('user-agent') || 'unknown',
      success: true,
    })

    console.log(`Successful login: ${email}`) // Debug log

    // Return success response
    const response = NextResponse.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
      }
    })

    return applySecurityHeaders(response)

  } catch (error: any) {
    console.error('Login error:', error)

    const response = NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error' 
      },
      { status: 500 }
    )

    return applySecurityHeaders(response)
  }
}

// GET method not allowed
export async function GET(request: NextRequest) {
  const response = NextResponse.json(
    { success: false, error: 'Method not allowed' },
    { status: 405 }
  )
  
  response.headers.set('Allow', 'POST')
  return applySecurityHeaders(response)
}