const http = require('http');
const loginData = JSON.stringify({ email: 'test@coli.local', password: 'Password123!' });

const loginOptions = {
  hostname: '127.0.0.1',
  port: 5000,
  path: '/api/users/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(loginData),
  },
};

const loginReq = http.request(loginOptions, (loginRes) => {
  let body = '';
  loginRes.on('data', (c) => (body += c));
  loginRes.on('end', () => {
    console.log('LOGIN STATUS:', loginRes.statusCode);
    const parsed = JSON.parse(body);
    console.log('LOGIN BODY:', parsed);
    const token = parsed.token;
    if (!token) return console.error('No token returned');

    // Now call profile
    const profileOptions = {
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/users/profile',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    };

    const profReq = http.request(profileOptions, (profRes) => {
      let pbody = '';
      profRes.on('data', (c) => (pbody += c));
      profRes.on('end', () => {
        console.log('PROFILE STATUS:', profRes.statusCode);
        try { console.log('PROFILE BODY:', JSON.parse(pbody)); }
        catch (e) { console.log('PROFILE BODY RAW:', pbody); }
      });
    });

    profReq.on('error', (e) => console.error('Profile request error', e));
    profReq.end();
  });
});

loginReq.on('error', (err) => console.error('Login request error', err));
loginReq.write(loginData);
loginReq.end();
