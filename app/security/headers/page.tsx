"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, XCircle, RefreshCw, Shield, Globe } from "lucide-react"

interface SecurityHeader {
  name: string
  description: string
  value?: string
  present: boolean
  expected: string
  category: 'critical' | 'important' | 'recommended'
}

export default function SecurityHeadersPage() {
  const [headers, setHeaders] = useState<SecurityHeader[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [lastChecked, setLastChecked] = useState<Date | null>(null)

  const expectedHeaders = [
    {
      name: 'X-Content-Type-Options',
      description: 'Prevents MIME type sniffing attacks',
      expected: 'nosniff',
      category: 'critical' as const
    },
    {
      name: 'X-Frame-Options',
      description: 'Prevents clickjacking attacks',
      expected: 'DENY or SAMEORIGIN',
      category: 'critical' as const
    },
    {
      name: 'X-XSS-Protection',
      description: 'Enables XSS filtering in older browsers',
      expected: '1; mode=block',
      category: 'important' as const
    },
    {
      name: 'Strict-Transport-Security',
      description: 'Enforces HTTPS connections',
      expected: 'max-age=31536000; includeSubDomains',
      category: 'critical' as const
    },
    {
      name: 'Referrer-Policy',
      description: 'Controls referrer information sent',
      expected: 'no-referrer or strict-origin-when-cross-origin',
      category: 'important' as const
    },
    {
      name: 'Content-Security-Policy',
      description: 'Prevents XSS and code injection',
      expected: 'default-src \'self\'',
      category: 'critical' as const
    },
    {
      name: 'Permissions-Policy',
      description: 'Controls browser feature access',
      expected: 'camera=(), microphone=(), geolocation=()',
      category: 'recommended' as const
    },
    {
      name: 'X-Permitted-Cross-Domain-Policies',
      description: 'Restricts cross-domain policy files',
      expected: 'none',
      category: 'recommended' as const
    }
  ]

  const checkSecurityHeaders = async () => {
    setIsLoading(true)
    try {
      // Make a request to our API to check headers
      const response = await fetch('/api/security/headers-check', {
        method: 'GET',
        cache: 'no-cache'
      })

      const responseHeaders = response.headers
      
      const checkedHeaders: SecurityHeader[] = expectedHeaders.map(expected => {
        const headerValue = responseHeaders.get(expected.name)
        return {
          name: expected.name,
          description: expected.description,
          value: headerValue || undefined,
          present: !!headerValue,
          expected: expected.expected,
          category: expected.category
        }
      })

      setHeaders(checkedHeaders)
      setLastChecked(new Date())
    } catch (error) {
      console.error('Error checking security headers:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    checkSecurityHeaders()
  }, [])

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'critical': return 'destructive'
      case 'important': return 'default'
      case 'recommended': return 'secondary'
      default: return 'secondary'
    }
  }

  const getStatusIcon = (present: boolean) => {
    return present 
      ? <CheckCircle className="h-5 w-5 text-green-500" />
      : <XCircle className="h-5 w-5 text-red-500" />
  }

  const criticalCount = headers.filter(h => h.category === 'critical' && h.present).length
  const totalCritical = headers.filter(h => h.category === 'critical').length
  const securityScore = totalCritical > 0 ? Math.round((criticalCount / totalCritical) * 100) : 0

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <Shield className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Security Headers Verification</h1>
        </div>
        <p className="text-muted-foreground">
          This page verifies that all security headers are properly configured to protect against common web vulnerabilities.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Security Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{securityScore}%</div>
            <p className="text-sm text-muted-foreground">
              {criticalCount}/{totalCritical} critical headers
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Headers Checked</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{headers.length}</div>
            <p className="text-sm text-muted-foreground">Security headers verified</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Last Check</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm font-medium">
              {lastChecked ? lastChecked.toLocaleTimeString() : 'Never'}
            </div>
            <Button 
              onClick={checkSecurityHeaders} 
              disabled={isLoading}
              size="sm"
              className="mt-2"
            >
              {isLoading && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
              Recheck Headers
            </Button>
          </CardContent>
        </Card>
      </div>

      {securityScore < 100 && (
        <Alert className="mb-6">
          <Shield className="h-4 w-4" />
          <AlertDescription>
            Some critical security headers are missing. This may expose your application to security vulnerabilities.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Security Headers Status
          </CardTitle>
          <CardDescription>
            Detailed view of all security headers and their current values
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {headers.map((header) => (
            <div 
              key={header.name} 
              className="flex items-start justify-between p-4 border rounded-lg"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  {getStatusIcon(header.present)}
                  <h3 className="font-semibold">{header.name}</h3>
                  <Badge variant={getCategoryColor(header.category)}>
                    {header.category}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  {header.description}
                </p>
                <div className="space-y-1">
                  <div className="text-xs">
                    <span className="font-medium">Expected:</span> {header.expected}
                  </div>
                  {header.value && (
                    <div className="text-xs">
                      <span className="font-medium">Actual:</span> 
                      <code className="ml-1 px-1 bg-muted rounded">{header.value}</code>
                    </div>
                  )}
                  {!header.present && (
                    <div className="text-xs text-red-500">
                      <span className="font-medium">Status:</span> Header not found
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="mt-8 p-4 bg-muted rounded-lg">
        <h3 className="font-semibold mb-2">How to Use This Tool</h3>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• <strong>Critical:</strong> Essential headers that must be present for basic security</li>
          <li>• <strong>Important:</strong> Recommended headers that provide additional protection</li>
          <li>• <strong>Recommended:</strong> Optional headers that enhance security posture</li>
          <li>• Click "Recheck Headers" to verify changes after configuration updates</li>
          <li>• Headers are automatically applied by the security middleware to all API routes</li>
        </ul>
      </div>
    </div>
  )
}