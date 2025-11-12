// Test login directly to see the actual response
const http = require('http');

const data = JSON.stringify({
  email: 'pharmacist@test.metapharm.ch',
  password: 'TestPass123!'
});

const options = {
  hostname: 'localhost',
  port: 4000,
  path: '/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

console.log('Sending login request to gateway...');
console.log('URL:', `http://${options.hostname}:${options.port}${options.path}`);
console.log('Payload:', data);

const req = http.request(options, (res) => {
  console.log('\n=== RESPONSE ===');
  console.log('Status Code:', res.statusCode);
  console.log('Headers:', JSON.stringify(res.headers, null, 2));

  let responseBody = '';

  res.on('data', (chunk) => {
    responseBody += chunk;
  });

  res.on('end', () => {
    console.log('\nResponse Body:', responseBody);
    try {
      const parsed = JSON.parse(responseBody);
      console.log('\nParsed Response:', JSON.stringify(parsed, null, 2));
    } catch (e) {
      console.log('Could not parse as JSON');
    }
  });
});

req.on('error', (error) => {
  console.error('Request Error:', error);
});

req.write(data);
req.end();
