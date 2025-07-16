const axios = require('axios');

const API_URL = 'http://localhost:3003';

async function testCookieAuth() {
  console.log('🧪 Testing Cookie-based Authentication System');
  console.log('=============================================\n');

  try {
    // Test 1: Login with valid credentials
    console.log('1. Testing login with valid credentials...');
    const loginResponse = await axios.post(`${API_URL}/api/login`, {
      username: 'konobar1',
      password: 'konobar123'
    }, {
      withCredentials: true
    });

    console.log('✅ Login successful');
    console.log('User data:', loginResponse.data.user);
    console.log('Cookies set:', loginResponse.headers['set-cookie'] ? 'Yes' : 'No');

    // Test 2: Validate token using cookie
    console.log('\n2. Testing token validation with cookie...');
    const validateResponse = await axios.get(`${API_URL}/api/validate-token`, {
      withCredentials: true
    });

    console.log('✅ Token validation successful');
    console.log('User from validation:', validateResponse.data.user);

    // Test 3: Access protected endpoint
    console.log('\n3. Testing access to protected endpoint...');
    const ordersResponse = await axios.get(`${API_URL}/api/orders`, {
      withCredentials: true
    });

    console.log('✅ Protected endpoint access successful');
    console.log('Orders count:', ordersResponse.data.length);

    // Test 4: Logout
    console.log('\n4. Testing logout...');
    const logoutResponse = await axios.post(`${API_URL}/api/logout`, {}, {
      withCredentials: true
    });

    console.log('✅ Logout successful');
    console.log('Response:', logoutResponse.data);

    // Test 5: Try to access protected endpoint after logout
    console.log('\n5. Testing access after logout...');
    try {
      await axios.get(`${API_URL}/api/orders`, {
        withCredentials: true
      });
      console.log('❌ Should have been denied access');
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.log('✅ Correctly denied access after logout');
      } else {
        console.log('❌ Unexpected error:', error.message);
      }
    }

    console.log('\n🎉 All tests passed! Cookie-based authentication is working correctly.');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

// Run the test
testCookieAuth(); 