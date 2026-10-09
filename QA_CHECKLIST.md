# QA Verification Checklist

**Project:** VG Certificate Studio  
**Test Suite:** Manual Exploratory + Automated Node.js Tests  
**Target Browsers:** Google Chrome, Mozilla Firefox, Apple Safari, Microsoft Edge, Mobile Safari, Android Chrome  

---

## 1. Studio Workspace & Canvas Engine
- [x] Canvas renders uploaded certificate images (.png, .jpg, .webp).
- [x] Template presets (Academic Distinction, Modern Luxury, Minimalist Tech, Executive Gold) load properly with default typography.
- [x] Dynamic field placement (Recipient Name, Course Title, Issue Date, Certificate ID, Custom Field).
- [x] Field role dynamic font size defaults (Name: 48px, Course: 22px, Date: 16px, ID: 15px, Custom: 20px).
- [x] Drag and drop field manipulation with real-time coordinate snapping.
- [x] Scale-aware hit testing padding on high-DPI displays.
- [x] Custom styling controls (Font Family, Weight, Color, Alignment, Letter Spacing, Uppercase toggle, Line Height).
- [x] Canvas zoom controls (Zoom In, Zoom Out, Reset 100%, Fit to Screen).
- [x] Pan viewport (Space + Drag or Middle Click).
- [x] Keyboard shortcuts:
  - Arrow keys: 1px nudge
  - Shift + Arrow keys: 10px nudge
  - Del / Backspace: Delete selected field
  - Ctrl+Z / Ctrl+Y: Undo / Redo history stack
  - [ / ]: Previous / Next recipient navigation
  - ?: Open shortcuts modal

---

## 2. Recipient Data Management & Spreadsheet Processing
- [x] Ingestion of `.xlsx`, `.xls`, and `.csv` files client-side via SheetJS.
- [x] Automatic column detection heuristics (Name, Email, Course, Date, ID).
- [x] Dynamic manual column remapping selector.
- [x] Tabular recipient preview with inline cell editing and custom row overrides.
- [x] Recipient stepper navigation (< 1 / 40 >) with instantaneous canvas re-rendering.
- [x] Sample data generator for quick testing without spreadsheet files.
- [x] Recipient deletion and row addition support.

---

## 3. Export Engine
- [x] **Single PNG Export:** Generates full-resolution PNG directly in browser.
- [x] **Single PDF Export:** Compiles vector PDF with embedded high-resolution raster canvas via jsPDF.
- [x] **Bulk ZIP Generation:** Asynchronously renders all recipient certificates and packages into compressed ZIP file with progress bar.

---

## 4. SMTP Dispatch & Automated Mailer
- [x] SMTP Configuration modal with standard presets (Gmail, Outlook 365, Custom Host).
- [x] "Test Connection" button sends verification request to `/api/test-smtp`.
- [x] Variable replacement in Subject & HTML Email Body (`{{name}}`, `{{firstName}}`, `{{course}}`, `{{date}}`, `{{id}}`).
- [x] High-priority email headers (`X-Priority: 1`, `Importance: High`).
- [x] Automated batch dispatch with individual progress indicators, delay throttling, and cancellation support.

---

## 5. Mobile & Responsive Experience
- [x] Mobile Device Recommendation Overlay screen displayed on screens ≤ 860px.
- [x] "Continue on Mobile Anyway" fallback button allows testing on small viewports.
- [x] Mobile navbar renders ultra-clean `VG` brand logo without UI clipping.
- [x] Pointer Events (`pointerdown`, `pointermove`, `pointerup`) with `setPointerCapture` ensure responsive touch handling.

---

## 6. Automated Test Suite
- [x] `API Health Check Endpoint` (Pass)
- [x] `Security Headers Presence` (Pass)
- [x] `POST /api/test-smtp Validation Failure (Missing Body)` (Pass)
- [x] `POST /api/test-smtp Validation Failure (Incomplete Credentials)` (Pass)
- [x] `POST /api/send-email Validation Failure (Missing Required Fields)` (Pass)
- [x] `POST /api/send-email Validation Failure (Invalid Email Format)` (Pass)
- [x] `404 Route Fallback` (Pass)
- [x] `Interpolates {{firstName}} and explicit variables correctly` (Pass)
- [x] `Preserves unknown template tags safely` (Pass)
- [x] `Detects standard spreadsheet column roles dynamically` (Pass)
- [x] `Handles single-word first name fallback safely` (Pass)
