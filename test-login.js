const http = require('http');

// Test the login API endpoint
const postData = JSON.stringify({
  email: 'test@example.com',
  password: 'password123'
});

const options = {
  hostname: 'localhost',
  port: 3002, // Updated to the correct port
  path: '/api/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

console.log('Testing login API endpoint...');

const req = http.request(options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log(`Status Code: ${res.statusCode}`);
    console.log('Response:', data);
    
    try {
      const response = JSON.parse(data);
      if (response.success) {
        console.log('Login successful!');
        console.log('Token:', response.data.token);
        console.log('User:', response.data.user);
      } else {
        console.log('Login failed:', response.error);
      }
    } catch (e) {
      console.log('Error parsing response:', e);
    }
  });
});

req.on('error', (error) => {
  console.error('Error:', error.message);
});

req.write(postData);
req.end();