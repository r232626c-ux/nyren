const express = require('express');
const app = express();

app.get('/test', (req, res) => {
  console.log('Test route called');
  res.json({ message: 'Hello from test server' });
});

app.listen(5000, '0.0.0.0', () => {
  console.log('Test server running on port 5000');
});