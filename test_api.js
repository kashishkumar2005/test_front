const fs = require('fs');
const API = process.env.API_BASE || 'http://localhost:5000';
const email = `ci_test_${Date.now()}@example.com`;
const password = 'TestPass123';

(async () => {
  try {
    console.log('Using', email);

    let res = await fetch(`${API}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, role: 'student' }),
    });

    let body = await res.text();
    console.log('Signup status', res.status);
    try { console.log('Signup body', JSON.parse(body)); } catch (e) { console.log('Signup body', body); }

    res = await fetch(`${API}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    body = await res.text();
    console.log('Login status', res.status);
    const loginJson = JSON.parse(body);
    console.log('Login body', loginJson);

    const token = loginJson.token;
    if (!token) {
      console.error('No token returned; aborting.');
      process.exit(1);
    }

    // Fetch common user endpoints
    const endpoints = [
      '/api/checkins',
      '/api/bookings',
      '/api/reports',
      '/api/settings'
    ];

    for (const ep of endpoints) {
      res = await fetch(`${API}${ep}`, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      body = await res.text();
      console.log(`\n${ep} -> status ${res.status}`);
      try { console.log(JSON.parse(body)); } catch (e) { console.log(body); }
    }

  } catch (err) {
    console.error('Error during API test:', err);
    process.exit(1);
  }
})();
