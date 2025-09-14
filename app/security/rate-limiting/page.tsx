"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { 
  Activity, 
  Clock, 
  Shield, 
  AlertTriangle, 
  CheckCircle,
  XCircle,
  Timer,
  Loader2,
  RotateCcw
} from "lucide-react"

interface RateLimitTest {
  id: string
  name: string
  endpoint: string
  limit: number
  windowMinutes: number
  blockMinutes: number
  description: string
}

interface TestAttempt {
  timestamp: Date
  success: boolean
  status: number
  message: string
  blocked: boolean
  retryAfter?: number
}

const rateLimitTests: RateLimitTest[] = [
  {
    id: "login",
    name: "Login Rate Limiting",
    endpoint: "/api/auth/login",
    limit: 5,
    windowMinutes: 15,
    blockMinutes: 15,
    description: "Prevents brute force login attacks by limiting failed attempts"
  },
  {
    id: "registration",
    name: "Registration Rate Limiting", 
    endpoint: "/api/auth/register",
    limit: 3,
    windowMinutes: 15,
    blockMinutes: 30,
    description: "Prevents spam registrations by limiting signup attempts"
  }
]

export default function RateLimitingPage() {
  const [selectedTest, setSelectedTest] = useState<string>("login")
  const [attempts, setAttempts] = useState<Record<string, TestAttempt[]>>({})
  const [isBlocked, setIsBlocked] = useState<Record<string, boolean>>({})
  const [countdown, setCountdown] = useState<Record<string, number>>({})
  const [isLoading, setIsLoading] = useState<Record<string, boolean>>({})

  useEffect(() => {
    const timers: Record<string, NodeJS.Timeout> = {}
    
    Object.keys(countdown).forEach(testId => {
      if (countdown[testId] > 0) {
        timers[testId] = setTimeout(() => {
          setCountdown(prev => ({
            ...prev,
            [testId]: prev[testId] - 1
          }))
        }, 1000)
      } else if (isBlocked[testId] && countdown[testId] === 0) {
        setIsBlocked(prev => ({
          ...prev,
          [testId]: false
        }))
      }
    })

    return () => {
      Object.values(timers).forEach(timer => clearTimeout(timer))
    }
  }, [countdown, isBlocked])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const testRateLimit = async (testId: string) => {
    const test = rateLimitTests.find(t => t.id === testId)
    if (!test) return

    setIsLoading(prev => ({ ...prev, [testId]: true }))

    try {
      let payload: any = {}
      
      if (testId === "login") {
        payload = {
          email: "test@invalid.com",
          password: "wrongpassword"
        }
      } else if (testId === "registration") {
        payload = {
          name: "Test User",
          email: `test${Date.now()}@example.com`,
          password: "TestPass123!",
          role: "user"
        }
      }

      const response = await fetch(test.endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })

      const result = await response.json()
      
      const attempt: TestAttempt = {
        timestamp: new Date(),
        success: response.ok,
        status: response.status,
        message: result.error || result.message || "Request completed",
        blocked: response.status === 429,
        retryAfter: result.retryAfter
      }

      if (response.status === 429) {
        setIsBlocked(prev => ({ ...prev, [testId]: true }))
        setCountdown(prev => ({ 
          ...prev, 
          [testId]: result.retryAfter || (test.blockMinutes * 60) 
        }))
      }

      setAttempts(prev => ({
        ...prev,
        [testId]: [attempt, ...(prev[testId] || []).slice(0, 9)]
      }))

    } catch (error: any) {
      const attempt: TestAttempt = {
        timestamp: new Date(),
        success: false,
        status: 0,
        message: `Error: ${error.message}`,
        blocked: false
      }

      setAttempts(prev => ({
        ...prev,
        [testId]: [attempt, ...(prev[testId] || []).slice(0, 9)]
      }))
    } finally {
      setIsLoading(prev => ({ ...prev, [testId]: false }))
    }
  }

  const resetTest = (testId: string) => {
    setAttempts(prev => ({ ...prev, [testId]: [] }))
    setIsBlocked(prev => ({ ...prev, [testId]: false }))
    setCountdown(prev => ({ ...prev, [testId]: 0 }))
  }

  const getCurrentTest = () => rateLimitTests.find(t => t.id === selectedTest)!
  const currentAttempts = attempts[selectedTest] || []
  const successfulAttempts = currentAttempts.filter(a => a.success).length
  const failedAttempts = currentAttempts.filter(a => !a.success && !a.blocked).length
  const blockedAttempts = currentAttempts.filter(a => a.blocked).length
  const currentTest = getCurrentTest()

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <Activity className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Rate Limiting Demonstration</h1>
        </div>
        <p className="text-muted-foreground">
          Interactive testing interface for demonstrating rate limiting protections.
          Test different endpoints to see how the system prevents abuse.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {rateLimitTests.map((test) => (
          <Card 
            key={test.id}
            className={`cursor-pointer transition-colors ${
              selectedTest === test.id ? 'border-primary bg-primary/5' : ''
            }`}
            onClick={() => setSelectedTest(test.id)}
          >
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center justify-between">
                {test.name}
                {selectedTest === test.id && <Badge>Selected</Badge>}
              </CardTitle>
              <CardDescription className="text-xs">
                {test.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="font-medium">Limit:</span> {test.limit} attempts
                </div>
                <div>
                  <span className="font-medium">Window:</span> {test.windowMinutes} min
                </div>
                <div>
                  <span className="font-medium">Block:</span> {test.blockMinutes} min
                </div>
                <div>
                  <span className="font-medium">Endpoint:</span> {test.endpoint}
                </div>
              </div>
              {attempts[test.id] && attempts[test.id].length > 0 && (
                <div className="flex gap-1 text-xs">
                  <Badge variant="outline" className="text-xs">
                    {attempts[test.id].length} attempts
                  </Badge>
                  {isBlocked[test.id] && (
                    <Badge variant="destructive" className="text-xs">
                      Blocked
                    </Badge>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Test Control Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              {currentTest.name} Test
            </CardTitle>
            <CardDescription>
              Test Rate Limit: {currentTest.limit} attempts per {currentTest.windowMinutes} minutes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isBlocked[selectedTest] && countdown[selectedTest] > 0 && (
              <Alert variant="destructive">
                <Timer className="h-4 w-4" />
                <AlertDescription>
                  Rate limit exceeded! Blocked for {formatTime(countdown[selectedTest])}
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Attempts: {currentAttempts.length}/{currentTest.limit}</span>
                <span>
                  {currentAttempts.length >= currentTest.limit ? 'Limit Reached' : 'Within Limit'}
                </span>
              </div>
              <Progress 
                value={(currentAttempts.length / currentTest.limit) * 100} 
                className="h-2"
              />
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={() => testRateLimit(selectedTest)}
                disabled={isLoading[selectedTest] || isBlocked[selectedTest]}
                className="flex-1"
              >
                {isLoading[selectedTest] && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isBlocked[selectedTest] && countdown[selectedTest] > 0 ? (
                  <>
                    <Timer className="mr-2 h-4 w-4" />
                    Blocked ({formatTime(countdown[selectedTest])})
                  </>
                ) : (
                  <>
                    <Clock className="mr-2 h-4 w-4" />
                    Test Attempt
                  </>
                )}
              </Button>
              <Button 
                variant="outline"
                onClick={() => resetTest(selectedTest)}
                disabled={isLoading[selectedTest]}
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2 bg-green-50 rounded border">
                <div className="text-sm font-medium text-green-700">{successfulAttempts}</div>
                <div className="text-xs text-green-600">Success</div>
              </div>
              <div className="p-2 bg-yellow-50 rounded border">
                <div className="text-sm font-medium text-yellow-700">{failedAttempts}</div>
                <div className="text-xs text-yellow-600">Failed</div>
              </div>
              <div className="p-2 bg-red-50 rounded border">
                <div className="text-sm font-medium text-red-700">{blockedAttempts}</div>
                <div className="text-xs text-red-600">Blocked</div>
              </div>
            </div>

            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                <strong>Testing Logic:</strong> Each test sends invalid credentials to trigger failures.
                After {currentTest.limit} attempts, the IP will be blocked for {currentTest.blockMinutes} minutes.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Test Results */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Test Results
            </CardTitle>
            <CardDescription>
              Live results from rate limiting tests
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {currentAttempts.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No tests run yet. Click "Test Attempt" to start.
                </p>
              ) : (
                currentAttempts.map((attempt, idx) => (
                  <div 
                    key={idx}
                    className={`p-3 rounded border ${
                      attempt.blocked 
                        ? 'bg-red-50 border-red-200' 
                        : attempt.success 
                          ? 'bg-green-50 border-green-200'
                          : 'bg-yellow-50 border-yellow-200'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {attempt.blocked ? (
                        <XCircle className="h-4 w-4 text-red-500 mt-0.5" />
                      ) : attempt.success ? (
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 text-xs">
                          <span className="font-medium">Status {attempt.status}</span>
                          <span className="text-muted-foreground">
                            {attempt.timestamp.toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-sm mt-1">{attempt.message}</p>
                        {attempt.retryAfter && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Retry after: {attempt.retryAfter} seconds
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 p-4 bg-muted rounded-lg">
        <h3 className="font-semibold mb-2 flex items-center gap-2">
          <Shield className="h-5 w-5" />
          How Rate Limiting Works
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
          <div>
            <h4 className="font-medium text-foreground mb-1">Login Protection</h4>
            <ul className="space-y-1">
              <li>• Tracks failed login attempts by IP address</li>
              <li>• Blocks after 5 failed attempts</li>
              <li>• 15-minute lockout period</li>
              <li>• Prevents brute force attacks</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-foreground mb-1">Registration Protection</h4>
            <ul className="space-y-1">
              <li>• Limits registration attempts by IP</li>
              <li>• Blocks after 3 attempts</li>
              <li>• 30-minute lockout period</li>
              <li>• Prevents spam registrations</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}