import { type NextRequest, NextResponse } from "next/server"
import { applySecurityHeaders } from "@/lib/security/helmet-adapter"

export async function GET(request: NextRequest) {
  try {
    // Create a simple response
    const response = NextResponse.json({
      success: true,
      message: "Security headers check endpoint",
      timestamp: new Date().toISOString(),
      headers: "Check the response headers to verify security configuration"
    })

    // Apply all security headers
    return applySecurityHeaders(response)
  } catch (error: any) {
    console.error('Headers check error:', error)
    
    const response = NextResponse.json(
      { 
        success: false, 
        error: 'Headers check failed' 
      },
      { status: 500 }
    )

    return applySecurityHeaders(response)
  }
}