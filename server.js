const express    = require('express');
const nodemailer = require('nodemailer');
const cors       = require('cors');
const path       = require('path');

const app = express();

// Security & Body parsing
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.static(path.join(__dirname)));

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

// Helper: create nodemailer transporter
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
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
  });
}

// POST /api/test-smtp — verify connection
app.post('/api/test-smtp', async (req, res) => {
  const { smtp } = req.body || {};
  if (!smtp || !smtp.host || !smtp.user || !smtp.pass) {
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

// POST /api/send-email — send single email with certificate attachment
app.post('/api/send-email', async (req, res) => {
  const { smtp, to, subject, html, attachmentBase64, filename } = req.body || {};

  if (!smtp || !to || !subject || !attachmentBase64) {
    return res.status(400).json({
      ok: false,
      error: 'Missing required fields (smtp, to, subject, attachmentBase64)'
    });
  }

  // Basic email syntax check
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
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
      to,
      subject,
      html,
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

const PORT = process.env.PORT || 3001;
const server = app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`  VG Certificate Distributor — Studio IDE`);
  console.log(`  Environment : production-ready`);
  console.log(`  Status      : Online & Healthy`);
  console.log(`  URL         : http://localhost:${PORT}`);
  console.log(`====================================================`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('[VG Studio] Shutting down gracefully...');
  server.close(() => process.exit(0));
});
process.on('SIGINT', () => {
  console.log('[VG Studio] Shutting down gracefully...');
  server.close(() => process.exit(0));
});

