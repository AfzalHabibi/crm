import { NextRequest, NextResponse } from "next/server"
import { applySecurityHeaders, validateClientIP, SecurityEventType, logSecurityEvent } from "@/lib/security/helmet-adapter"

export default function middleware(req: NextRequest) {
  // Create response with security headers for ALL routes
  const response = NextResponse.next()
  
  // Validate client IP and detect suspicious activity
  const ipValidation = validateClientIP(req)
  if (ipValidation.isSuspicious) {
    logSecurityEvent(SecurityEventType.SUSPICIOUS_IP, {
      ip: ipValidation.ip,
      userAgent: req.headers.get('user-agent') || 'unknown',
      url: req.url,
      severity: 'medium',
      message: `Suspicious IP detected: ${ipValidation.reason}`,
    })
  }
  
  // Apply comprehensive security headers to all responses
  return applySecurityHeaders(response)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
