# VG Certificate Distributor — Enterprise Certificate Generator & Bulk Mailer

A modern, high-performance web platform for generating personalized certificates from custom or built-in templates and Excel / CSV data, with automated bulk email delivery via SMTP.

---

## Key Features

- **Interactive Certificate Canvas** — Upload your own PNG/JPG/WebP certificate template or click **Use VG Luxury Certificate Template** to generate a high-res certificate on the fly.
- **Excel & CSV Data Import** — Automatically extracts all columns and turns them into draggable fields; supports `.xlsx`, `.xls`, and `.csv`.
- **Instant Sample Data** — Load sample recipients and standard columns to test your template layout with a single click.
- **Dynamic Recipient Stepper** — Page through recipients with `❮` and `❯` buttons on the live canvas to review each person's exact certificate before distribution.
- **Rich Typography & Styling** — 20+ curated fonts (Handwriting, Elegant Serif, Classic, Sans-Serif, Monospace), font size, custom color, bold/italic, text transforms, and configurable drop shadows.
- **Per-Row Fine-Tuning** — Customize position or typography for specific recipients with long names without affecting others.
- **High-Res Export (ZIP & PNG)** — Download individual certificate previews or bulk generate and compress all certificates into a ZIP file with live progress tracking.
- **Automated SMTP Bulk Email Delivery** — Send personalized emails with high-res certificate attachments via Gmail, Outlook, Yahoo, or custom SMTP servers.
- **Rich Email Composer** — Supports custom HTML, `{{variable}}` substitution (e.g. `{{firstName}}`, `{{course}}`, `{{cert_id}}`), clickable links, and reusable email templates.
- **SMTP Provider Presets** — Fast 1-click configuration for Gmail, Outlook 365, and Yahoo Mail.

---

## Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) (v16 or higher)
- npm

### Installation & Run

```bash
# Install dependencies
npm install

# Start the server
npm start
```

Then open **http://localhost:3001** in your web browser.

---

## Workflow Guide

### 1. Load Certificate Template
- Drag & drop your certificate background image onto the drop zone, OR
- Click **Use VG Luxury Certificate Template** to generate a built-in luxury certificate template.

### 2. Import Recipient Data
- Upload your `.xlsx`, `.xls`, or `.csv` file in the sidebar, OR
- Click **Load Sample Recipient Data** for an instant dataset.

**Supported Standard Columns:**
| Column | Description |
|--------|-------------|
| `name` | Recipient's full name |
| `email` | Recipient's email address for distribution |
| `course` / `title` | Program or achievement name |
| `date` / `cert_id` | Custom metadata fields |

### 3. Place & Format Fields
- Drag any column chip onto the certificate canvas.
- Click a placed field to select it and drag it into position.
- Customize font family, size, color, alignments, and text shadows in the **Typography** panel.

### 4. Preview Recipients
- Use the **❮** and **❯** stepper buttons in the recipient bar to flip through all recipients and verify styling.

### 5. Export or Email Distribute
- **Download Current Certificate**: Download a PNG preview of the active recipient.
- **Download All as ZIP**: Compresses all generated certificates into a single `.zip` archive.
- **Distribute Certificates by Email**: Connect your SMTP server and send certificates directly to recipient inboxes.

---

## 📧 Comprehensive SMTP Configuration Guide

VG Certificate Distributor sends emails directly through your own SMTP mail server or email provider. Credentials are stored securely in your browser (`localStorage`) and used locally by your Node.js backend to dispatch emails.

To open the configuration dialog, click the **"SMTP Config"** button in the sidebar.

---

### 1. Provider-Specific Setup Instructions

#### 🔹 Gmail & Google Workspace
Google requires an **App Password** (your regular Gmail password will not work if 2-Step Verification is active):

1. Go to your **[Google Account Security](https://myaccount.google.com/security)** page.
2. Under "How you sign in to Google", ensure **2-Step Verification** is turned **ON**.
3. Search for or navigate to **[App Passwords](https://myaccount.google.com/apppasswords)**.
4. Name the app password (e.g., `VG Certificate Mailer`) and click **Create**.
5. Copy the generated **16-character code** (e.g. `abcd efgh ijkl mnop`).
6. In VG Certificate Distributor, click the **Gmail** preset button and enter:
   - **SMTP Host**: `smtp.gmail.com`
   - **Port**: `587`
   - **Username / Email**: Your full Gmail address (`you@gmail.com` or custom Workspace email)
   - **Password / App Password**: The 16-character App Password (spaces can be omitted)
   - **From Name**: `VG Certificate Authority` (or your preferred sender name)

---

#### 🔹 Microsoft Outlook & Office 365
1. Click the **Outlook** preset button.
2. Enter the following parameters:
   - **SMTP Host**: `smtp.office365.com` (or `smtp-mail.outlook.com` for personal Outlook/Hotmail)
   - **Port**: `587`
   - **Username / Email**: Your full Microsoft 365 / Outlook email address
   - **Password**: Your account password (or Microsoft App Password if 2FA/MFA is enabled on your organization)
   - **From Name**: Your organization or team name

---

#### 🔹 Yahoo Mail
1. Go to **Yahoo Account Security** > **Generate App Password**.
2. Click the **Yahoo** preset in the app and fill in:
   - **SMTP Host**: `smtp.mail.yahoo.com`
   - **Port**: `587` (or `465`)
   - **Username / Email**: Your Yahoo email address
   - **Password**: The generated Yahoo App Password

---

#### 🔹 Zoho Mail
1. In Zoho Mail, go to **Settings > Mail Accounts > Security** and generate an **App Password**.
2. Select **Custom** in the SMTP modal and enter:
   - **SMTP Host**: `smtppro.zoho.com` (or `smtp.zoho.com` for personal)
   - **Port**: `587` (STARTTLS) or `465` (SSL)
   - **Username / Email**: Your Zoho email address
   - **Password**: Your Zoho App Password

---

#### 🔹 Transactional SMTP Services (SendGrid, AWS SES, Mailgun, Brevo)
- **SendGrid**: Host `smtp.sendgrid.net`, Port `587`, User `apikey`, Password `<Your API Key>`
- **Amazon SES**: Host `email-smtp.<region>.amazonaws.com`, Port `587`, User `<SES SMTP Username>`, Password `<SES SMTP Password>`
- **Brevo (Sendinblue)**: Host `smtp-relay.brevo.com`, Port `587`, User `<Account Email>`, Password `<SMTP Key>`

---

### 2. Testing Your SMTP Connection

Before sending bulk emails to recipients:
1. Click the **"Test Connection"** button in the SMTP modal.
2. The server will attempt an authentication handshake (`transporter.verify()`).
3. If successful, you will see a green checkmark: `SMTP connection verified successfully`.
4. Click **"Save Settings"** to store your configuration.

---

### 3. Personalizing the Email Template

Click **"Compose Email"** to tailor the message sent to each recipient:

- **Subject Line**: Supports dynamic tags like `Congratulations, {{firstName}}!` or `Your {{course}} Certificate — {{name}}`.
- **Available Variables**: Every column in your uploaded Excel file is automatically converted into a variable (e.g. `{{name}}`, `{{email}}`, `{{course}}`, `{{cert_id}}`, `{{date}}`).
- **`{{firstName}}`**: Automatically extracted from the recipient's full name.
- **Rich Text & Formatting**: Use the built-in toolbar for Bold, Italic, Underline, and Links.
- **Save Template**: Click **"Save Template"** to store customized email bodies in `localStorage` for future batches.

---

### 4. Sending Bulk Certificates

1. Ensure your template is loaded and fields are placed on the canvas.
2. Ensure recipient data is loaded in the preview table.
3. Click **"Distribute Certificates by Email"**.
4. Confirm the recipient count and dispatch summary.
5. Watch the live progress bar and status log showing per-recipient success/failure confirmations.

---

### 5. Troubleshooting & FAQs

| Issue / Error | Cause | Resolution |
| :--- | :--- | :--- |
| `535 5.7.8 Authentication credentials invalid` | Using primary password instead of App Password on 2FA-enabled accounts | Generate a dedicated **App Password** in your Google/Microsoft/Yahoo security settings. |
| `connect ECONNREFUSED` or `ETIMEDOUT` | Port blocked or wrong host entered | Verify SMTP host spelling and use Port `587` (or `465`). Ensure local firewall isn't blocking outbound SMTP. |
| `Self-signed certificate in certificate chain` | Custom mail server TLS requirement | The backend has `rejectUnauthorized: false` enabled by default for maximum compatibility. |
| `Missing required fields` | One or more SMTP fields left blank | Ensure Host, Port, Username, and Password are all filled in before testing. |
| `Backend offline / Failed to fetch` | Node server not running | Ensure you ran `npm start` in the terminal and `http://localhost:3001` is reachable. |

---

## Project Structure

```
├── css/
│   └── style.css       # Complete dark-mode responsive design system
├── js/
│   └── app.js          # Core canvas renderer, Excel parser, & distributor
├── index.html          # Main application interface
├── server.js           # Express API for SMTP verification and email sending
├── package.json        # Node dependencies & project metadata
└── README.md           # Documentation & guides
```

---

## License
MIT License
