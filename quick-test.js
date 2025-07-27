// Quick test of the production API
const https = require('https');

const BASE_URL = 'https://e-commerce-app-2jf2.onrender.com';

// Test user registration
const userData = JSON.stringify({
  fullName: 'Test Admin',
  email: 'admin@test.com',
  password: 'testpass123',
  role: 'admin'
});

const options = {
  hostname: 'e-commerce-app-2jf2.onrender.com',
  port: 443,
  path: '/auth/register',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': userData.length
  }
};

console.log('🧪 Testing user registration...');

const req = https.request(options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('Status Code:', res.statusCode);
    try {
      const response = JSON.parse(data);
      console.log('Response:', JSON.stringify(response, null, 2));
      
      if (res.statusCode === 201) {
        console.log('✅ Registration successful!');
        console.log('🔑 Token received:', response.data.token.substring(0, 20) + '...');
      } else {
        console.log('❌ Registration failed');
      }
    } catch (error) {
      console.log('Raw response:', data);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Error:', error.message);
});

req.write(userData);
req.end();