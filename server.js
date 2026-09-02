const express    = require('express');
const nodemailer = require('nodemailer');
const cors       = require('cors');
const path       = require('path');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname)));

// GET /api/health
app.get('/api/health', (req, res) => {
  res.json({ ok: true, app: 'VG Certificate Distributor', status: 'online' });
});

// POST /api/test-smtp  — verify credentials without sending
app.post('/api/test-smtp', async (req, res) => {
  const { smtp } = req.body;
  if (!smtp || !smtp.host || !smtp.user || !smtp.pass) {
    return res.status(400).json({ error: 'host, user and pass are required' });
  }
  try {
    const transporter = nodemailer.createTransport({
      host:   smtp.host,
      port:   parseInt(smtp.port, 10) || 587,
      secure: parseInt(smtp.port, 10) === 465,
      auth:   { user: smtp.user, pass: smtp.pass },
      tls:    { rejectUnauthorized: false },
    });
    await transporter.verify();
    res.json({ ok: true, message: 'SMTP connection verified successfully' });
  } catch (err) {
    console.error('[VG Mailer] SMTP Test error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/send-email
// Body: { smtp, to, subject, html, attachmentBase64, filename }
app.post('/api/send-email', async (req, res) => {
  const { smtp, to, subject, html, attachmentBase64, filename } = req.body;

  if (!smtp || !to || !subject || !attachmentBase64) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const transporter = nodemailer.createTransport({
      host:   smtp.host,
      port:   parseInt(smtp.port, 10) || 587,
      secure: parseInt(smtp.port, 10) === 465,
      auth:   { user: smtp.user, pass: smtp.pass },
      tls:    { rejectUnauthorized: false },
    });

    await transporter.sendMail({
      from:     smtp.fromName ? `"${smtp.fromName}" <${smtp.user}>` : smtp.user,
      to,
      subject,
      html,
      priority: 'high',
      headers: {
        'X-Priority':        '1',
        'X-MSMail-Priority': 'High',
        'Importance':        'High',
        'X-Mailer':          'VG Certificate Distributor',
      },
      attachments: [{
        filename:    filename || 'VG-Certificate.png',
        content:     attachmentBase64,
        encoding:    'base64',
        contentType: 'image/png',
      }],
    });

    res.json({ ok: true });
  } catch (err) {
    console.error(`[VG Mailer] Send error to ${to}:`, err.message);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`  VG Certificate Distributor`);
  console.log(`  Server running on http://localhost:${PORT}`);
  console.log(`  Open in browser: http://localhost:${PORT}/index.html`);
  console.log(`====================================================`);
});

