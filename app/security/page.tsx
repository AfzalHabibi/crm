"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Shield, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Activity,
  Lock,
  Code,
  Globe,
  Timer,
  Loader2
} from "lucide-react"

interface TestResult {
  success: boolean
  message: string
  details?: any
  timestamp: Date
}

export default function SecurityDemoPage() {
  // Rate Limiting Test States
  const [loginEmail, setLoginEmail] = useState("")
  const [loginPassword, setLoginPassword] = useState("")
  const [loginAttempts, setLoginAttempts] = useState<TestResult[]>([])
  const [loginLoading, setLoginLoading] = useState(false)
  const [loginBlocked, setLoginBlocked] = useState(false)
  const [loginCountdown, setLoginCountdown] = useState(0)

  // Registration Rate Limiting
  const [regEmail, setRegEmail] = useState("")
  const [regName, setRegName] = useState("")
  const [regPassword, setRegPassword] = useState("")
  const [regAttempts, setRegAttempts] = useState<TestResult[]>([])
  const [regLoading, setRegLoading] = useState(false)
  const [regBlocked, setRegBlocked] = useState(false)
  const [regCountdown, setRegCountdown] = useState(0)

  // NoSQL Injection Test States
  const [injectionPayload, setInjectionPayload] = useState("")
  const [injectionResults, setInjectionResults] = useState<TestResult[]>([])
  const [injectionLoading, setInjectionLoading] = useState(false)

  // Security Headers Test
  const [headerResults, setHeaderResults] = useState<TestResult[]>([])
  const [headerLoading, setHeaderLoading] = useState(false)

  const predefinedPayloads = [
    '{"$ne": null}',
    '{"$gt": ""}', 
    '{"$regex": ".*"}',
    '{"$where": "this.email"}',
    '{"email": {"$ne": null}}',
    '{"email": {"$regex": "admin"}}',
    '{"$or": [{"email": "admin@test.com"}, {"role": "admin"}]}',
    '{"password": {"$ne": null}}'
  ]

  // Rate Limiting Tests
  const testLoginRateLimit = async () => {
    if (!loginEmail) {
      setLoginEmail("test@invalid.com")
    }
    if (!loginPassword) {
      setLoginPassword("wrongpassword")
    }

    setLoginLoading(true)
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          email: loginEmail || "test@invalid.com", 
          password: loginPassword || "wrongpassword" 
        }),
      })

      const result = await response.json()
      const testResult: TestResult = {
        success: response.ok,
        message: result.error || result.message || "Login attempt completed",
        details: { status: response.status, retryAfter: result.retryAfter },
        timestamp: new Date()
      }

      if (response.status === 429) {
        setLoginBlocked(true)
        setLoginCountdown(result.retryAfter || 300)
      }

      setLoginAttempts(prev => [testResult, ...prev.slice(0, 9)])
    } catch (error: any) {
      setLoginAttempts(prev => [{
        success: false,
        message: `Error: ${error.message}`,
        timestamp: new Date()
      }, ...prev.slice(0, 9)])
    } finally {
      setLoginLoading(false)
    }
  }

  const testRegistrationRateLimit = async () => {
    if (!regEmail) {
      setRegEmail(`test${Date.now()}@example.com`)
    }
    if (!regName) {
      setRegName("Test User")
    }
    if (!regPassword) {
      setRegPassword("TestPass123!")
    }

    setRegLoading(true)
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST", 
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: regName || "Test User",
          email: regEmail || `test${Date.now()}@example.com`,
          password: regPassword || "TestPass123!",
          role: "user"
        }),
      })

      const result = await response.json()
      const testResult: TestResult = {
        success: response.ok,
        message: result.error || result.message || "Registration attempt completed",
        details: { status: response.status, retryAfter: result.retryAfter },
        timestamp: new Date()
      }

      if (response.status === 429) {
        setRegBlocked(true) 
        setRegCountdown(result.retryAfter || 1800)
      }

      setRegAttempts(prev => [testResult, ...prev.slice(0, 9)])
    } catch (error: any) {
      setRegAttempts(prev => [{
        success: false,
        message: `Error: ${error.message}`,
        timestamp: new Date()
      }, ...prev.slice(0, 9)])
    } finally {
      setRegLoading(false)
    }
  }

  // NoSQL Injection Tests
  const testNoSQLInjection = async (payload?: string) => {
    const testPayload = payload || injectionPayload
    if (!testPayload) return

    setInjectionLoading(true)
    try {
      // Test against login endpoint
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: testPayload,
          password: testPayload
        }),
      })

      const result = await response.json()
      const testResult: TestResult = {
        success: response.status === 400, // We expect validation to reject this
        message: response.status === 400 
          ? "✅ Payload properly blocked by validation" 
          : `⚠️ Unexpected response: ${result.error || result.message}`,
        details: { payload: testPayload, status: response.status },
        timestamp: new Date()
      }

      setInjectionResults(prev => [testResult, ...prev.slice(0, 9)])
    } catch (error: any) {
      setInjectionResults(prev => [{
        success: false,
        message: `Error testing payload: ${error.message}`,
        timestamp: new Date()
      }, ...prev.slice(0, 9)])
    } finally {
      setInjectionLoading(false)
    }
  }

  // Security Headers Test
  const testSecurityHeaders = async () => {
    setHeaderLoading(true)
    try {
      const response = await fetch("/api/security/headers-check")
      const result = await response.json()

      // Check for critical security headers
      const headers = response.headers
      const criticalHeaders = [
        'x-content-type-options',
        'x-frame-options', 
        'x-xss-protection',
        'strict-transport-security'
      ]

      const found = criticalHeaders.filter(header => headers.get(header))
      const missing = criticalHeaders.filter(header => !headers.get(header))

      const testResult: TestResult = {
        success: missing.length === 0,
        message: missing.length === 0 
          ? `✅ All ${criticalHeaders.length} critical security headers present`
          : `⚠️ Missing ${missing.length} critical headers: ${missing.join(', ')}`,
        details: { found, missing, total: criticalHeaders.length },
        timestamp: new Date()
      }

      setHeaderResults(prev => [testResult, ...prev.slice(0, 4)])
    } catch (error: any) {
      setHeaderResults(prev => [{
        success: false,
        message: `Error testing headers: ${error.message}`,
        timestamp: new Date()
      }, ...prev.slice(0, 4)])
    } finally {
      setHeaderLoading(false)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const ResultCard = ({ results, title }: { results: TestResult[], title: string }) => (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <Activity className="h-4 w-4" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="max-h-64 overflow-y-auto">
        {results.length === 0 ? (
          <p className="text-sm text-muted-foreground">No tests run yet</p>
        ) : (
          <div className="space-y-2">
            {results.map((result, idx) => (
              <div key={idx} className="flex items-start gap-2 p-2 bg-muted rounded text-xs">
                {result.success ? <CheckCircle className="h-3 w-3 text-green-500 mt-0.5" /> : <XCircle className="h-3 w-3 text-red-500 mt-0.5" />}
                <div className="flex-1">
                  <p>{result.message}</p>
                  <p className="text-muted-foreground">{result.timestamp.toLocaleTimeString()}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <Shield className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Security Features Demo</h1>
        </div>
        <p className="text-muted-foreground">
          Interactive testing interface for demonstrating security features to clients.
          Test rate limiting, input validation, NoSQL injection protection, and security headers.
        </p>
      </div>

      <Tabs defaultValue="rate-limiting" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="rate-limiting" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Rate Limiting
          </TabsTrigger>
          <TabsTrigger value="injection" className="flex items-center gap-2">
            <Code className="h-4 w-4" />
            NoSQL Protection
          </TabsTrigger>
          <TabsTrigger value="headers" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Security Headers
          </TabsTrigger>
          <TabsTrigger value="validation" className="flex items-center gap-2">
            <Lock className="h-4 w-4" />
            Input Validation
          </TabsTrigger>
        </TabsList>

        <TabsContent value="rate-limiting" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Login Rate Limiting */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  Login Rate Limiting
                </CardTitle>
                <CardDescription>
                  Test login rate limiting (5 attempts per 15 minutes)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="loginEmail">Email</Label>
                  <Input
                    id="loginEmail"
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="test@invalid.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="loginPassword">Password</Label>
                  <Input
                    id="loginPassword"
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="wrongpassword"
                  />
                </div>
                <Button 
                  onClick={testLoginRateLimit} 
                  disabled={loginLoading || loginBlocked}
                  className="w-full"
                >
                  {loginLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {loginBlocked && <Timer className="mr-2 h-4 w-4" />}
                  {loginBlocked && loginCountdown > 0 
                    ? `Blocked - ${formatTime(loginCountdown)}`
                    : "Test Invalid Login"
                  }
                </Button>
                {loginBlocked && (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Rate limit exceeded. Login attempts are blocked for 15 minutes.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
              <ResultCard results={loginAttempts} title="Login Attempts" />
            </Card>

            {/* Registration Rate Limiting */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Registration Rate Limiting
                </CardTitle>
                <CardDescription>
                  Test registration rate limiting (3 attempts per 15 minutes)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="regName">Name</Label>
                  <Input
                    id="regName"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="Test User"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="regEmail">Email</Label>
                  <Input
                    id="regEmail"
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="test@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="regPassword">Password</Label>
                  <Input
                    id="regPassword"
                    type="password"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="TestPass123!"
                  />
                </div>
                <Button 
                  onClick={testRegistrationRateLimit} 
                  disabled={regLoading || regBlocked}
                  className="w-full"
                >
                  {regLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {regBlocked && <Timer className="mr-2 h-4 w-4" />}
                  {regBlocked && regCountdown > 0 
                    ? `Blocked - ${formatTime(regCountdown)}`
                    : "Test Registration"
                  }
                </Button>
                {regBlocked && (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Rate limit exceeded. Registration attempts are blocked for 30 minutes.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
              <ResultCard results={regAttempts} title="Registration Attempts" />
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="injection" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="h-5 w-5" />
                NoSQL Injection Protection Testing
              </CardTitle>
              <CardDescription>
                Test various NoSQL injection payloads to verify they are properly blocked
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="injectionPayload">Test Payload</Label>
                <Textarea
                  id="injectionPayload"
                  value={injectionPayload}
                  onChange={(e) => setInjectionPayload(e.target.value)}
                  placeholder="Enter NoSQL injection payload..."
                  rows={3}
                />
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={() => testNoSQLInjection()} 
                  disabled={injectionLoading || !injectionPayload}
                >
                  {injectionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Test Custom Payload
                </Button>
              </div>
              <div className="space-y-2">
                <Label>Predefined Attack Payloads</Label>
                <div className="grid grid-cols-2 gap-2">
                  {predefinedPayloads.map((payload, idx) => (
                    <Button
                      key={idx}
                      variant="outline"
                      size="sm"
                      onClick={() => testNoSQLInjection(payload)}
                      disabled={injectionLoading}
                      className="text-xs"
                    >
                      Test: {payload.length > 20 ? payload.substring(0, 20) + '...' : payload}
                    </Button>
                  ))}
                </div>
              </div>
              <Alert>
                <Lock className="h-4 w-4" />
                <AlertDescription>
                  All payloads should be blocked by Zod validation and input sanitization.
                  Success = payload was properly rejected.
                </AlertDescription>
              </Alert>
            </CardContent>
            <ResultCard results={injectionResults} title="Injection Test Results" />
          </Card>
        </TabsContent>

        <TabsContent value="headers" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Security Headers Verification
              </CardTitle>
              <CardDescription>
                Verify that all critical security headers are properly configured
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={testSecurityHeaders} disabled={headerLoading} className="w-full">
                {headerLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Test Security Headers
              </Button>
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  Tests for X-Content-Type-Options, X-Frame-Options, X-XSS-Protection, and Strict-Transport-Security headers.
                </AlertDescription>
              </Alert>
            </CardContent>
            <ResultCard results={headerResults} title="Header Test Results" />
          </Card>
        </TabsContent>

        <TabsContent value="validation" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Input Validation Testing
              </CardTitle>
              <CardDescription>
                All forms use Zod schemas for comprehensive validation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium">Login Validation</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Email format validation</li>
                    <li>• Password minimum requirements</li>
                    <li>• XSS prevention</li>
                    <li>• NoSQL injection protection</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Registration Validation</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Name length and format</li>
                    <li>• Strong password requirements</li>
                    <li>• Role validation</li>
                    <li>• Phone number format</li>
                  </ul>
                </div>
              </div>
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  All validation is handled by Zod schemas with real-time error feedback.
                  Try entering invalid data in the login or registration forms to see validation in action.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}