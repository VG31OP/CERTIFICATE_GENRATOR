const express    = require('express');
const nodemailer = require('nodemailer');
const cors       = require('cors');
const path       = require('path');

const app = express();

// Security Headers Middleware
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  next();
});

// CORS and Body Parsing with safety limits
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static Assets
app.use(express.static(path.join(__dirname), {
  maxAge: '1d',
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache');
    }
  }
}));

// In-memory rate limiting map
const rateLimitMap = new Map();
function rateLimiter({ windowMs = 60000, max = 30, message = 'Too many requests, please try again later.' } = {}) {
  return (req, res, next) => {
    const ip = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.socket.remoteAddress || 'unknown';
    const now = Date.now();
    
    let record = rateLimitMap.get(ip);
    if (!record || (now - record.startTime) > windowMs) {
      record = { count: 1, startTime: now };
      rateLimitMap.set(ip, record);
    } else {
      record.count++;
    }

    if (record.count > max) {
      return res.status(429).json({
        ok: false,
        error: message,
        retryAfterSeconds: Math.ceil(((record.startTime + windowMs) - now) / 1000)
      });
    }
    next();
  };
}

// Clean up stale rate limiter entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of rateLimitMap.entries()) {
    if (now - record.startTime > 300000) {
      rateLimitMap.delete(ip);
    }
  }
}, 300000).unref();

// Telemetry & Health endpoint
const startTime = Date.now();
app.get('/api/health', (req, res) => {
  const uptimeSeconds = Math.floor((Date.now() - startTime) / 1000);
  res.json({
    ok: true,
    app: 'VG Certificate Distributor',
    version: '1.0.0',
    status: 'online',
    uptime: `${uptimeSeconds}s`,
    memory: process.memoryUsage(),
    timestamp: new Date().toISOString()
  });
});

// Helper: create nodemailer transporter with IPv4 forced for cloud reliability
function createSmtpTransporter(smtp) {
  const port = parseInt(smtp.port, 10) || 587;
  return nodemailer.createTransport({
    host: smtp.host,
    port: port,
    secure: port === 465,
    auth: {
      user: smtp.user,
      pass: smtp.pass,
    },
    tls: {
      rejectUnauthorized: false,
    },
    family: 4, // Force IPv4 to prevent ENETUNREACH in cloud environments like Render/Railway
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
  });
}

// POST /api/test-smtp — verify connection (Rate limited: 10 attempts per minute)
app.post('/api/test-smtp', rateLimiter({ windowMs: 60000, max: 10, message: 'Too many SMTP verification attempts. Please wait.' }), async (req, res) => {
  const { smtp } = req.body || {};
  if (!smtp || typeof smtp !== 'object' || !smtp.host || !smtp.user || !smtp.pass) {
    return res.status(400).json({
      ok: false,
      error: 'SMTP host, username, and password are required'
    });
  }

  try {
    const transporter = createSmtpTransporter(smtp);
    await transporter.verify();
    return res.json({
      ok: true,
      message: 'SMTP connection verified successfully'
    });
  } catch (err) {
    console.error(`[VG Studio] SMTP verification failed for ${smtp.user}@${smtp.host}:`, err.message);
    return res.status(500).json({
      ok: false,
      error: err.message || 'Failed to authenticate with SMTP server'
    });
  }
});

// POST /api/send-email — send single email with certificate attachment (Rate limited: 120 sends per minute)
app.post('/api/send-email', rateLimiter({ windowMs: 60000, max: 120, message: 'Rate limit exceeded for bulk email dispatch. Please slow down.' }), async (req, res) => {
  const { smtp, to, subject, html, attachmentBase64, filename } = req.body || {};

  if (!smtp || !to || !subject || !attachmentBase64) {
    return res.status(400).json({
      ok: false,
      error: 'Missing required fields (smtp, to, subject, attachmentBase64)'
    });
  }

  // Basic email syntax check
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(to).trim())) {
    return res.status(400).json({
      ok: false,
      error: `Invalid email address format: "${to}"`
    });
  }

  try {
    const transporter = createSmtpTransporter(smtp);
    const fromAddress = smtp.fromName ? `"${smtp.fromName}" <${smtp.user}>` : smtp.user;

    const info = await transporter.sendMail({
      from: fromAddress,
      to: String(to).trim(),
      subject: String(subject),
      html: html || '',
      priority: 'high',
      headers: {
        'X-Priority': '1',
        'X-MSMail-Priority': 'High',
        'Importance': 'High',
        'X-Mailer': 'VG Certificate Distributor v1.0',
      },
      attachments: [{
        filename: filename || 'Certificate.png',
        content: attachmentBase64,
        encoding: 'base64',
        contentType: 'image/png',
      }],
    });

    return res.json({
      ok: true,
      messageId: info.messageId
    });
  } catch (err) {
    console.error(`[VG Studio] Email dispatch failed to ${to}:`, err.message);
    return res.status(500).json({
      ok: false,
      error: err.message || 'SMTP transmission error'
    });
  }
});

// 404 Fallback
app.use((req, res) => {
  res.status(404).json({ ok: false, error: 'Endpoint not found' });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[VG Studio] Unhandled server error:', err);
  res.status(500).json({
    ok: false,
    error: 'Internal server error'
  });
});

let server = null;
const PORT = process.env.PORT || 3001;

function startServer(port = PORT) {
  return new Promise((resolve) => {
    server = app.listen(port, () => {
      console.log(`====================================================`);
      console.log(`  VG Certificate Distributor — Studio IDE`);
      console.log(`  Environment : production-ready`);
      console.log(`  Status      : Online & Healthy`);
      console.log(`  URL         : http://localhost:${port}`);
      console.log(`====================================================`);
      resolve(server);
    });
  });
}

if (require.main === module) {
  startServer();
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('[VG Studio] Shutting down gracefully (SIGTERM)...');
  if (server) server.close(() => process.exit(0));
});
process.on('SIGINT', () => {
  console.log('[VG Studio] Shutting down gracefully (SIGINT)...');
  if (server) server.close(() => process.exit(0));
});

module.exports = { app, startServer, createSmtpTransporter };

