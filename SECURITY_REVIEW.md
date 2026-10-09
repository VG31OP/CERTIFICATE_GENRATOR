# Application Security & Data Integrity Review

**Application:** VG Certificate Studio  
**Review Status:** Completed & Remediated  
**Environment:** Production-Ready  

---

## 1. Threat Model & Data Flow Analysis
VG Certificate Studio operates as a privacy-first, client-rendered web application:
1. **Client-Side Rendering:** All spreadsheet files (XLSX, CSV) and certificate templates are processed 100% inside the user's browser memory. Recipient personally identifiable information (PII) is **never saved to a remote database**.
2. **Server-Side Mail Relay:** The backend Node.js server acts strictly as an authenticated relay for Nodemailer to send emails directly via the user's own SMTP credentials.

---

## 2. Security Controls & Hardening Implemented

### A. HTTP Security Headers
Every HTTP response from Express includes standard defense-in-depth headers:
- `X-Content-Type-Options: nosniff` — Prevents MIME-type sniffing attacks.
- `X-Frame-Options: SAMEORIGIN` — Mitigates clickjacking and malicious iframe embedding.
- `X-XSS-Protection: 1; mode=block` — Enables browser-level cross-site scripting filters.
- `Referrer-Policy: strict-origin-when-cross-origin` — Restricts sensitive referrer data leakage across origins.
- `Permissions-Policy: camera=(), microphone=(), geolocation=()` — Blocks unwanted sensor and device access.

### B. Input Validation & Strict Payloads
- **Email Syntax Validation:** Server rejects malformed email strings using regex validation (`/^[^\s@]+@[^\s@]+\.[^\s@]+$/`) before opening any SMTP connections.
- **Payload Limits:** Strict 50MB JSON limit to permit high-resolution certificate base64 attachments while rejecting oversized denial-of-service payloads.
- **Clean Error Handling:** Stack traces and internal server details are stripped from API error messages. Only sanitized, structured JSON errors (`{ ok: false, error: '...' }`) are returned to clients.

### C. Denial of Service (DoS) & Abuse Mitigation
- **In-Memory Rate Limiting:**
  - `/api/test-smtp`: Limited to 10 verification requests per IP per minute.
  - `/api/send-email`: Limited to 120 dispatches per IP per minute.
- **Auto-Eviction:** Rate-limit storage automatically flushes expired IP entries every 5 minutes to prevent memory leaks.

### D. Cloud Network Isolation (`family: 4`)
- Node.js `nodemailer.createTransport` is configured with `family: 4` to force IPv4 DNS resolution. This prevents networking failures (`ENETUNREACH`) on cloud hosts (such as Render or Railway) that do not support outbound IPv6 SMTP routes.

---

## 3. Vulnerability Assessment Summary

| Vulnerability Type | Risk Level | Mitigation Status | Notes |
| :--- | :--- | :--- | :--- |
| **SQL Injection (SQLi)** | None | **N/A** | No SQL database utilized. |
| **Cross-Site Scripting (XSS)** | Low | **Mitigated** | Canvas 2D text rendering API does not execute HTML or script tags. HTML email bodies are sanitized. |
| **Server-Side Request Forgery (SSRF)** | Low | **Mitigated** | SMTP host connections are restricted to valid port integers (25, 465, 587) with timeout limits (10s connection, 15s socket). |
| **Exposed Secrets** | None | **Mitigated** | Zero credentials in source code. `.env.example` contains variable keys only. |
| **Cross-Origin Resource Sharing (CORS)** | Low | **Configured** | Standard CORS headers applied to allow API communication. |
