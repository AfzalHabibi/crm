const axios = require('axios');

async function testRateLimit() {
  console.log('🧪 Testing Rate Limiting on Login Endpoint...\n');
  
  for (let i = 1; i <= 8; i++) {
    try {
      const response = await axios.post('http://localhost:3000/api/auth/login', {
        email: 'test@example.com',
        password: 'wrongpassword'
      }, { 
        validateStatus: () => true,
        timeout: 5000
      });
      
      console.log(`Attempt ${i}: Status ${response.status}`);
      console.log(`  Message: ${response.data.error || response.data.message}`);
      
      if (response.status === 429) {
        console.log('  ✅ RATE LIMITING IS WORKING! 🛡️');
        console.log(`  ⏰ Retry After: ${response.data.retryAfter} seconds\n`);
        break;
      } else if (response.status === 401) {
        console.log('  ❌ Login failed (expected)\n');
      }
      
    } catch (error) {
      console.log(`Attempt ${i}: Error - ${error.message}\n`);
    }
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  
  console.log('Rate limiting test completed!');
}

testRateLimit().catch(console.error);