const test = require('node:test');
const { before, after } = test;
const assert = require('node:assert/strict');
const http = require('node:http');
const nodemailer = require('nodemailer');
const { startServer } = require('../server.js');

let serverInstance = null;
let testPort = 0;

before(async () => {
  serverInstance = await startServer(0);
  testPort = serverInstance.address().port;
});

after(() => {
  if (serverInstance) {
    serverInstance.close();
  }
});

function makeRequest(path, options = {}) {
  return new Promise((resolve, reject) => {
    const reqOptions = {
      hostname: '127.0.0.1',
      port: testPort,
      path: path,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      }
    };

    const req = http.request(reqOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = data ? JSON.parse(data) : {};
          resolve({ status: res.statusCode, headers: res.headers, body: json, raw: data });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, raw: data });
        }
      });
    });

    req.on('error', reject);
    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }
    req.end();
  });
}

test('API Health Check Endpoint', async () => {
  const res = await makeRequest('/api/health');
  assert.equal(res.status, 200);
  assert.equal(res.body.ok, true);
  assert.equal(res.body.app, 'VG Certificate Distributor');
  assert.equal(res.body.status, 'online');
  assert.ok(res.body.uptime);
});

test('Security Headers Presence', async () => {
  const res = await makeRequest('/api/health');
  assert.equal(res.headers['x-content-type-options'], 'nosniff');
  assert.equal(res.headers['x-frame-options'], 'SAMEORIGIN');
  assert.ok(res.headers['referrer-policy']);
});

test('POST /api/test-smtp Validation Failure (Missing Body)', async () => {
  const res = await makeRequest('/api/test-smtp', {
    method: 'POST',
    body: {}
  });
  assert.equal(res.status, 400);
  assert.equal(res.body.ok, false);
  assert.match(res.body.error, /host, username, and password are required/i);
});

test('POST /api/test-smtp Validation Failure (Incomplete Credentials)', async () => {
  const res = await makeRequest('/api/test-smtp', {
    method: 'POST',
    body: { smtp: { host: 'smtp.gmail.com', user: 'user@example.com' } }
  });
  assert.equal(res.status, 400);
  assert.equal(res.body.ok, false);
});

test('POST /api/send-email Validation Failure (Missing Required Fields)', async () => {
  const res = await makeRequest('/api/send-email', {
    method: 'POST',
    body: { smtp: { host: 'smtp.example.com', user: 'a', pass: 'b' } }
  });
  assert.equal(res.status, 400);
  assert.equal(res.body.ok, false);
  assert.match(res.body.error, /Missing required fields/i);
});

test('POST /api/send-email Validation Failure (Invalid Email Format)', async () => {
  const res = await makeRequest('/api/send-email', {
    method: 'POST',
    body: {
      smtp: { host: 'smtp.example.com', user: 'a', pass: 'b' },
      to: 'invalid-email-address',
      subject: 'Test Certificate',
      attachmentBase64: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
    }
  });
  assert.equal(res.status, 400);
  assert.equal(res.body.ok, false);
  assert.match(res.body.error, /Invalid email address format/i);
});

test('404 Route Fallback', async () => {
  const res = await makeRequest('/api/non-existent-route-xyz');
  assert.equal(res.status, 404);
  assert.equal(res.body.ok, false);
});

test('Live Ethereal SMTP Verification and Certificate Email Dispatch', async () => {
  const testAccount = await nodemailer.createTestAccount();
  const smtp = {
    host: testAccount.smtp.host,
    port: testAccount.smtp.port,
    user: testAccount.user,
    pass: testAccount.pass,
    fromName: 'VG Studio Live Test'
  };

  // 1. Verify SMTP
  const verifyRes = await makeRequest('/api/test-smtp', {
    method: 'POST',
    body: { smtp }
  });
  assert.equal(verifyRes.status, 200);
  assert.equal(verifyRes.body.ok, true);

  // 2. Dispatch Live Certificate Email
  const sendRes = await makeRequest('/api/send-email', {
    method: 'POST',
    body: {
      smtp,
      to: 'recipient.student@example.org',
      subject: 'Your Certificate of Completion\r\nInjectedHeader: bad',
      html: '<p>Congratulations on completing the program.</p>',
      attachmentBase64: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      filename: 'Certificate_Student.png'
    }
  });
  assert.equal(sendRes.status, 200);
  assert.equal(sendRes.body.ok, true);
  assert.ok(sendRes.body.messageId);
});
