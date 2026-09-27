const axios = require('axios');

const BASE_URL = 'http://127.0.0.1:5000';

(async () => {
  try {
    console.log('📋 Testing if Learning routes are accessible...\n');
    
    // Test without auth first - should fail with 401 if route exists
    try {
      const res = await axios.get(`${BASE_URL}/api/learn/categories`);
      console.log('✓ GET /api/learn/categories - Status:', res.status);
    } catch(e) {
      if(e.response?.status === 401) {
        console.log('✓ GET /api/learn/categories - Route exists (got 401 auth error as expected)');
      } else if(e.response?.status === 404) {
        console.log('❌ GET /api/learn/categories - Route NOT found');
        process.exit(1);
      } else {
        throw e;
      }
    }
    
    try {
      const res = await axios.get(`${BASE_URL}/api/learn/modules`);
      console.log('✓ GET /api/learn/modules - Status:', res.status);
    } catch(e) {
      if(e.response?.status === 401) {
        console.log('✓ GET /api/learn/modules - Route exists (got 401 auth error as expected)');
      } else {
        throw e;
      }
    }
    
    try {
      const res = await axios.get(`${BASE_URL}/api/learn/progress`);
      console.log('✓ GET /api/learn/progress - Status:', res.status);
    } catch(e) {
      if(e.response?.status === 401) {
        console.log('✓ GET /api/learn/progress - Route exists (got 401 auth error as expected)');
      } else {
        throw e;
      }
    }
    
    console.log('\n✅ All Learning routes are accessible!');
    console.log('Backend is ready for mobile app connection.\n');
    process.exit(0);
    
  } catch(err) {
    console.error('\n❌ Test failed:', err.message);
    process.exit(1);
  }
})();
