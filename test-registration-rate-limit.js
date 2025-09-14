// Registration Rate Limit Test
// Run this to test registration rate limiting

const testRegistrationRateLimit = async () => {
  console.log('🧪 Testing Registration Rate Limiting...\n')
  
  for (let i = 1; i <= 5; i++) {
    console.log(`📝 Attempt ${i}:`)
    
    try {
      const response = await fetch('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `Test User ${i}`,
          email: `testuser${i}_${Date.now()}@example.com`,
          password: 'TestPass123!',
          role: 'user'
        })
      })
      
      const result = await response.json()
      
      if (response.status === 429) {
        console.log(`❌ BLOCKED: ${result.error}`)
        console.log(`⏰ Retry after: ${result.retryAfter} seconds\n`)
        break
      } else if (response.ok) {
        console.log(`✅ SUCCESS: ${result.message}`)
        console.log(`👤 User created: ${result.user.email}\n`)
      } else {
        console.log(`⚠️ ERROR: ${result.error}\n`)
      }
      
      // Wait 1 second between attempts
      await new Promise(resolve => setTimeout(resolve, 1000))
      
    } catch (error) {
      console.log(`💥 Request failed: ${error.message}\n`)
    }
  }
}

// Run the test
testRegistrationRateLimit()