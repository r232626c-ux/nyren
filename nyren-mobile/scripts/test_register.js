const http = require('http');
const data = JSON.stringify({ name: 'Test User', email: 'test@coli.local', password: 'Password123!' });

const options = {
  hostname: '127.0.0.1',
  port: 5000,
  path: '/api/users/register',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data),
  },
};

const req = http.request(options, (res) => {
  let body = '';
  res.on('data', (chunk) => (body += chunk));
  res.on('end', () => {
    console.log('STATUS:', res.statusCode);
    try {
      console.log('BODY:', JSON.parse(body));
    } catch (e) {
      console.log('BODY (raw):', body);
    }
  });
});

req.on('error', (err) => console.error('Request error', err));
req.write(data);
req.end();
