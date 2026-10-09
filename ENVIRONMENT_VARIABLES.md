# Environment Variables Reference

This document outlines all environment variables utilized by VG Certificate Studio. 

> [!IMPORTANT]
> **No secret values or real credentials are stored in this document or in the repository.** All environment-specific credentials must be configured securely via your cloud hosting platform's environment settings.

---

## Variable Inventory

| Variable Name | Required | Default Value | Description |
| :--- | :--- | :--- | :--- |
| `PORT` | Optional | `3001` | The HTTP network port on which the Express application server listens. Cloud platforms like Render and Railway dynamically inject this variable. |
| `NODE_ENV` | Optional | `production` | Specifies the runtime execution environment (`production`, `development`, `test`). |

---

## Client-Provided Credentials (No Server Persistence)
The following credentials are entered by the user client-side inside the application's SMTP Configuration modal and sent per-request over HTTPS to the mail relay. They are never written to any database or disk:

- `SMTP Host` (e.g., `smtp.gmail.com`, `smtp.office365.com`)
- `SMTP Port` (e.g., `587`, `465`)
- `SMTP Username / Email`
- `SMTP App Password / Secret`
- `Sender Display Name`
