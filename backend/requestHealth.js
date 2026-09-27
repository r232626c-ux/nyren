const http = require('http');
const options = {
  host: '127.0.0.1',
  port: 5000,
  path: '/health',
  method: 'GET',
};
const req = http.request(options, (res) => {
  console.log('status', res.statusCode);
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    console.log('body', data);
  });
});
req.on('error', (err) => {
  console.error('error', err.message);
});
req.end();