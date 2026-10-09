# Deployment Runbook & DevOps Operations

**Application:** VG Certificate Studio  
**Runtime:** Node.js 18+ LTS  
**Default Port:** `3001` (Configurable via `PORT` environment variable)  
**Supported Platforms:** Render, Railway, Fly.io, DigitalOcean App Platform, AWS App Runner, Docker  

---

## 1. Local Development Setup

```bash
# 1. Clone the repository
git clone https://github.com/VG31OP/CERTIFICATE_GENRATOR.git
cd CERTIFICATE_GENRATOR

# 2. Install dependencies
npm install

# 3. Start local development server
npm run dev

# 4. Open browser
# Navigate to http://localhost:3001
```

---

## 2. Automated Testing

Before deploying changes, verify the test suite:

```bash
npm test
```

Expected output:
```text
✔ API Health Check Endpoint
✔ Security Headers Presence
✔ POST /api/test-smtp Validation Failure (Missing Body)
✔ POST /api/test-smtp Validation Failure (Incomplete Credentials)
✔ POST /api/send-email Validation Failure (Missing Required Fields)
✔ POST /api/send-email Validation Failure (Invalid Email Format)
✔ 404 Route Fallback
✔ Interpolates {{firstName}} and explicit variables correctly
✔ Preserves unknown template tags safely
✔ Detects standard spreadsheet column roles dynamically
✔ Handles single-word first name fallback safely
ℹ tests 11, pass 11, fail 0
```

---

## 3. Production Deployment Procedures

### A. Deploying to Render.com
1. Create a **New Web Service** pointing to your Git repository.
2. Configure settings:
   - **Environment:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
   - **Auto-Deploy:** `Yes` (Triggered on pushes to `main`)
3. Health Check Path: `/api/health`

### B. Deploying to Railway.app
1. Link GitHub repository to Railway.
2. Railway detects Node runtime automatically.
3. Configure `PORT` variable or allow Railway default.

### C. Containerized Docker Deployment

Create a `Dockerfile` with the following specification:

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3001
ENV NODE_ENV=production
USER node
CMD ["node", "server.js"]
```

Build and run container:
```bash
docker build -t vg-certificate-studio .
docker run -p 3001:3001 -e PORT=3001 vg-certificate-studio
```

---

## 4. Post-Deployment Smoke Verification
1. **Health Check:** `curl -f https://<your-domain>/api/health`
   - Expected status: `200 OK`, JSON containing `"status": "online"`.
2. **Static Asset Check:** Load `https://<your-domain>/` in Chrome, Firefox, and Safari.
3. **SMTP Verification:** Open SMTP modal in UI, enter test credentials, and trigger "Test Connection".
4. **Export Check:** Load sample data, click "Download PNG" and "Export PDF".
