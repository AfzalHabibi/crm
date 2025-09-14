import { NextRequest, NextResponse } from "next/server"

// Store for tracking requests (simple in-memory store for development)
// In production, use Redis or a database
interface RateLimitStore {
  [key: string]: {
    count: number
    resetTime: number
  }
}

const requestStore: RateLimitStore = {}

// Rate limit configuration type
interface RateLimitConfig {
  windowMs: number
  max: number
  message: string
}

// Rate limit configurations
const rateLimitConfigs: Record<string, RateLimitConfig> = {
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 requests per windowMs
    message: "Too many authentication attempts, please try again later."
  },

  api: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 100, // Limit each IP to 100 requests per hour
    message: "Too many API requests, please try again later."
  },

  sensitive: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // Limit each IP to 10 sensitive operations per hour
    message: "Too many sensitive operations, please try again later."
  }
}

// Helper function to get client IP
export function getClientIP(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    req.headers.get("cf-connecting-ip") ||
    "127.0.0.1"
  )
}

// Simple rate limiter implementation as backup/alternative
export function applyExpressRateLimit(
  req: NextRequest,
  type: keyof typeof rateLimitConfigs = "api"
): NextResponse | null {
  const config = rateLimitConfigs[type]
  const ip = getClientIP(req)
  const now = Date.now()
  const key = `${ip}_${type}_${req.nextUrl.pathname}`

  // Clean up expired entries
  if (requestStore[key] && requestStore[key].resetTime < now) {
    delete requestStore[key]
  }

  // Initialize or increment counter
  if (!requestStore[key]) {
    requestStore[key] = {
      count: 1,
      resetTime: now + config.windowMs
    }
  } else {
    requestStore[key].count++
  }

  // Check if limit exceeded
  if (requestStore[key].count > config.max) {
    const retryAfter = Math.ceil((requestStore[key].resetTime - now) / 1000)
    
    return NextResponse.json({
      success: false,
      error: config.message,
      retryAfter
    }, {
      status: 429,
      headers: {
        'RateLimit-Limit': String(config.max),
        'RateLimit-Remaining': '0',
        'RateLimit-Reset': String(Math.ceil(requestStore[key].resetTime / 1000)),
        'Retry-After': String(retryAfter)
      }
    })
  }

  return null
}

// Enhanced rate limiter with progressive penalties
export function applyProgressiveRateLimit(
  req: NextRequest,
  type: keyof typeof rateLimitConfigs = "api",
  userId?: string
): NextResponse | null {
  const config = rateLimitConfigs[type]
  const ip = getClientIP(req)
  const now = Date.now()
  
  // Create compound key with user ID if available for better tracking
  const key = userId 
    ? `${ip}_${userId}_${type}_${req.nextUrl.pathname}`
    : `${ip}_${type}_${req.nextUrl.pathname}`

  // Clean up expired entries
  if (requestStore[key] && requestStore[key].resetTime < now) {
    delete requestStore[key]
  }

  // Initialize or increment counter
  if (!requestStore[key]) {
    requestStore[key] = {
      count: 1,
      resetTime: now + config.windowMs
    }
  } else {
    requestStore[key].count++
  }

  // Progressive penalties based on violation count
  let effectiveMax = config.max
  if (requestStore[key].count > config.max * 2) {
    // Double violation - extend window
    requestStore[key].resetTime = now + (config.windowMs * 2)
    effectiveMax = config.max / 2
  } else if (requestStore[key].count > config.max * 1.5) {
    // 50% over limit - reduce allowance
    effectiveMax = Math.floor(config.max * 0.8)
  }

  // Check if limit exceeded
  if (requestStore[key].count > effectiveMax) {
    const retryAfter = Math.ceil((requestStore[key].resetTime - now) / 1000)
    
    return NextResponse.json({
      success: false,
      error: config.message,
      retryAfter,
      details: requestStore[key].count > config.max * 2 
        ? "Extended penalty period due to repeated violations"
        : undefined
    }, {
      status: 429,
      headers: {
        'RateLimit-Limit': String(effectiveMax),
        'RateLimit-Remaining': String(Math.max(0, effectiveMax - requestStore[key].count)),
        'RateLimit-Reset': String(Math.ceil(requestStore[key].resetTime / 1000)),
        'Retry-After': String(retryAfter),
        'X-Progressive-Penalty': requestStore[key].count > config.max ? 'true' : 'false'
      }
    })
  }

  return null
}

// Utility to get current rate limit status
export function getRateLimitStatus(
  req: NextRequest,
  type: keyof typeof rateLimitConfigs = "api",
  userId?: string
): {
  limit: number
  remaining: number
  resetTime: number
  isLimited: boolean
} {
  const config = rateLimitConfigs[type]
  const ip = getClientIP(req)
  const key = userId 
    ? `${ip}_${userId}_${type}_${req.nextUrl.pathname}`
    : `${ip}_${type}_${req.nextUrl.pathname}`

  const record = requestStore[key]
  
  if (!record || record.resetTime < Date.now()) {
    return {
      limit: config.max,
      remaining: config.max,
      resetTime: Date.now() + config.windowMs,
      isLimited: false
    }
  }

  return {
    limit: config.max,
    remaining: Math.max(0, config.max - record.count),
    resetTime: record.resetTime,
    isLimited: record.count >= config.max
  }
}

// Clean up expired entries periodically (every 10 minutes)
if (typeof window === 'undefined') {
  setInterval(() => {
    const now = Date.now()
    Object.keys(requestStore).forEach(key => {
      if (requestStore[key].resetTime < now) {
        delete requestStore[key]
      }
    })
  }, 10 * 60 * 1000)
}