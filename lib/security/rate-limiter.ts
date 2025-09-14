import { RateLimiterMemory } from "rate-limiter-flexible"
import { NextRequest, NextResponse } from "next/server"

// Rate limiter configurations
const rateLimiters = {
  auth: new RateLimiterMemory({
    points: 5, // Number of attempts
    duration: 900, // Per 15 minutes (in seconds)
    blockDuration: 900, // Block for 15 minutes
  }),
  
  api: new RateLimiterMemory({
    points: 100, // Number of requests
    duration: 900, // Per 15 minutes (in seconds)
    blockDuration: 300, // Block for 5 minutes (lighter for API)
  }),
  
  sensitive: new RateLimiterMemory({
    points: 10, // Number of requests  
    duration: 900, // Per 15 minutes (in seconds)
    blockDuration: 900, // Block for 15 minutes
  }),
}

export async function applyRateLimit(
  request: NextRequest,
  type: keyof typeof rateLimiters = "api"
): Promise<NextResponse | null> {
  try {
    const ip = request.headers.get("x-forwarded-for") || 
              request.headers.get("x-real-ip") ||
              "anonymous"
    const rateLimiter = rateLimiters[type]
    
    await rateLimiter.consume(ip)
    return null // No rate limit exceeded
  } catch (rejRes: any) {
    const secs = Math.round(rejRes.msBeforeNext / 1000) || 1
    const currentRateLimiter = rateLimiters[type]
    
    return NextResponse.json(
      {
        success: false,
        message: "Too many requests",
        error: `Rate limit exceeded. Try again in ${secs} seconds.`,
        retryAfter: secs,
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(secs),
          "X-RateLimit-Limit": String(currentRateLimiter.points),
          "X-RateLimit-Remaining": String(rejRes.remainingPoints || 0),
          "X-RateLimit-Reset": String(new Date(Date.now() + rejRes.msBeforeNext)),
        },
      }
    )
  }
}

export function getRateLimitHeaders(remainingPoints: number, totalPoints: number, resetTime: Date) {
  return {
    "X-RateLimit-Limit": String(totalPoints),
    "X-RateLimit-Remaining": String(remainingPoints),
    "X-RateLimit-Reset": resetTime.toISOString(),
  }
}
