(() => {
  'use strict';

  // ── Font catalogue ─────────────────────────────────────────────────
  const FONTS = [
    { label: 'Great Vibes', value: "'Great Vibes', cursive", category: 'Handwriting' },
    { label: 'Pinyon Script', value: "'Pinyon Script', cursive", category: 'Handwriting' },
    { label: 'Allura', value: "'Allura', cursive", category: 'Handwriting' },
    { label: 'Alex Brush', value: "'Alex Brush', cursive", category: 'Handwriting' },
    { label: 'Sacramento', value: "'Sacramento', cursive", category: 'Handwriting' },
    { label: 'Tangerine', value: "'Tangerine', cursive", category: 'Handwriting' },
    { label: 'Dancing Script', value: "'Dancing Script', cursive", category: 'Handwriting' },
    { label: 'Satisfy', value: "'Satisfy', cursive", category: 'Handwriting' },
    { label: 'Pacifico', value: "'Pacifico', cursive", category: 'Handwriting' },
    { label: 'Cinzel', value: "'Cinzel', serif", category: 'Elegant Serif' },
    { label: 'Cormorant Garamond', value: "'Cormorant Garamond', serif", category: 'Elegant Serif' },
    { label: 'Playfair Display', value: "'Playfair Display', serif", category: 'Elegant Serif' },
    { label: 'EB Garamond', value: "'EB Garamond', serif", category: 'Elegant Serif' },
    { label: 'Crimson Text', value: "'Crimson Text', serif", category: 'Elegant Serif' },
    { label: 'Libre Baskerville', value: "'Libre Baskerville', serif", category: 'Elegant Serif' },
    { label: 'Georgia', value: 'Georgia, serif', category: 'Classic' },
    { label: 'Palatino', value: "'Palatino Linotype', serif", category: 'Classic' },
    { label: 'Times New Roman', value: "'Times New Roman', serif", category: 'Classic' },
    { label: 'Raleway', value: "'Raleway', sans-serif", category: 'Sans-serif' },
    { label: 'Lato', value: "'Lato', sans-serif", category: 'Sans-serif' },
    { label: 'Arial', value: 'Arial, sans-serif', category: 'Sans-serif' },
    { label: 'Verdana', value: 'Verdana, sans-serif', category: 'Sans-serif' },
    { label: 'Courier New', value: "'Courier New', monospace", category: 'Monospace' },
  ];

  // ── Auto-Proportional Size Engine ──────────────────────────────────
  function getAutoFontSizeForField(key) {
    const h = state.naturalH || 1414;
    const lower = String(key || '').toLowerCase();

    // Recipient Name fields -> prominent display size (~5.8% of template height)
    if (lower.includes('name') || lower.includes('recipient') || lower.includes('student') || lower.includes('nominee') || lower.includes('person') || lower.includes('attendee')) {
      return Math.max(14, Math.round(h * 0.058));
    }

    // Course / Achievement / Title / Degree / Program -> strong subtitle (~2.6% of template height)
    if (lower.includes('course') || lower.includes('title') || lower.includes('award') || lower.includes('event') || lower.includes('program') || lower.includes('degree') || lower.includes('track') || lower.includes('project') || lower.includes('topic')) {
      return Math.max(12, Math.round(h * 0.026));
    }

    // Date / ID / Serial / Signature / Distinction / Honors -> elegant label (~1.8% of template height)
    if (lower.includes('date') || lower.includes('id') || lower.includes('cert') || lower.includes('serial') || lower.includes('sign') || lower.includes('distinction') || lower.includes('honors') || lower.includes('rank') || lower.includes('score') || lower.includes('grade') || lower.includes('roll')) {
      return Math.max(10, Math.round(h * 0.018));
    }

    // Generic / Custom Fields -> balanced size (~3.2% of template height)
    return Math.max(12, Math.round(h * 0.032));
  }

  // ── Default typography for new fields ─────────────────────────────
  function defaultTypography(key = '') {
    return {
      font: FONTS[0].value,
      size: getAutoFontSizeForField(key),
      color: '#000000',
      bold: false,
      italic: false,
      align: 'center',
      textTransform: 'none',
      shadowEnabled: false,
      shadowColor: '#000000',
      shadowBlur: 6,
      shadowOffsetX: 2,
      shadowOffsetY: 3,
      shadowOpacity: 60,
    };
  }

  // ── Application State ──────────────────────────────────────────────
  const state = {
    image: null,
    templateType: null,
    naturalW: 2000,
    naturalH: 1414,
    scale: 0.65,
    fields: [],   // [{key, x, y, font, size, color, bold, italic, align, ...}]
    activeFieldIdx: -1,
    draggingField: false,
    dragFieldOffX: 0,
    dragFieldOffY: 0,
    isPanning: false,
    panStartX: 0,
    panStartY: 0,
    scrollStartX: 0,
    scrollStartY: 0,
    committedFont: FONTS[0].value,
    hoverFont: null,
    excelData: [],
    excelColumns: [],
    previewRowIdx: 0,
    editingRowIdx: -1,
    rowOverrides: {},   // { rowIdx: { fieldKey: { ...typography/pos } } }
    undoStack: [],
    redoStack: [],
  };

  // ── DOM References ─────────────────────────────────────────────────
  const canvas = document.getElementById('previewCanvas');
  const ctx = canvas.getContext('2d');
  const canvasWrap = document.getElementById('canvasWrap');
  const canvasContainer = document.getElementById('canvasContainer');
  const canvasEmptyState = document.getElementById('canvasEmptyState');
  const btnEmptyLoadBuiltin = document.getElementById('btnEmptyLoadBuiltin');
  const btnEmptyUpload = document.getElementById('btnEmptyUpload');
  const customTextInputGroup = document.getElementById('customTextInputGroup');
  const customTextInput = document.getElementById('customTextInput');

  // Typography controls
  const fontSize = document.getElementById('fontSize');
  const fontColor = document.getElementById('fontColor');
  const fontColorHex = document.getElementById('fontColorHex');
  const boldBtn = document.getElementById('boldBtn');
  const italicBtn = document.getElementById('italicBtn');
  const alignBtns = document.querySelectorAll('.align-btn');
  const transformBtns = document.querySelectorAll('.transform-btn');
  const activeFieldLabel = document.getElementById('activeFieldLabel');
  const btnRemoveField = document.getElementById('btnRemoveField');
  const posX = document.getElementById('posX');
  const posY = document.getElementById('posY');

  // Shadow controls
  const shadowEnabled = document.getElementById('shadowEnabled');
  const shadowControls = document.getElementById('shadowControls');
  const shadowColor = document.getElementById('shadowColor');
  const shadowColorHex = document.getElementById('shadowColorHex');
  const shadowBlur = document.getElementById('shadowBlur');
  const shadowOffsetX = document.getElementById('shadowOffsetX');
  const shadowOffsetY = document.getElementById('shadowOffsetY');
  const shadowOpacity = document.getElementById('shadowOpacity');
  const shadowOpacityVal = document.getElementById('shadowOpacityVal');

  // Nudge controls
  const btnNudgeUp = document.getElementById('btnNudgeUp');
  const btnNudgeDown = document.getElementById('btnNudgeDown');
  const btnNudgeLeft = document.getElementById('btnNudgeLeft');
  const btnNudgeRight = document.getElementById('btnNudgeRight');
  const btnCenterField = document.getElementById('btnCenterField');

  // Zoom controls
  const zoomInBtn = document.getElementById('zoomIn');
  const zoomOutBtn = document.getElementById('zoomOut');
  const zoomLbl = document.getElementById('zoomLbl');
  const zoomFitBtn = document.getElementById('zoomFit');
  const zoom100Btn = document.getElementById('zoom100');

  // Font picker
  const fontPicker = document.getElementById('fontPicker');
  const fontTrigger = document.getElementById('fontTrigger');
  const fontTriggerLabel = document.getElementById('fontTriggerLabel');
  const fontDropdown = document.getElementById('fontDropdown');

  // Excel & Data
  const excelFile = document.getElementById('excelFile');
  const excelUploadArea = document.getElementById('excelUploadArea');
  const excelUploadLabel = document.getElementById('excelUploadLabel');
  const excelPreviewWrap = document.getElementById('excelPreviewWrap');
  const excelTableBody = document.getElementById('excelTableBody');
  const excelPreviewTitle = document.getElementById('excelPreviewTitle');
  const excelCount = document.getElementById('excelCount');
  const btnClearExcel = document.getElementById('btnClearExcel');
  const columnFieldsSection = document.getElementById('columnFieldsSection');
  const columnChipsEl = document.getElementById('columnChips');
  const btnLoadSampleData = document.getElementById('btnLoadSampleData');

  // Recipient Stepper in HUD
  const btnPrevRecipient = document.getElementById('btnPrevRecipient');
  const btnNextRecipient = document.getElementById('btnNextRecipient');
  const rowIndicatorLabel = document.getElementById('rowIndicatorLabel');
  const btnResetRowOverride = document.getElementById('btnResetRowOverride');

  // Quick Action Buttons
  const btnHeaderDemo = document.getElementById('btnHeaderDemo');
  const btnAddFieldDirect = document.getElementById('btnAddFieldDirect');
  const btnUndo = document.getElementById('btnUndo');
  const btnRedo = document.getElementById('btnRedo');

  // Export Buttons
  const exportDropdownWrap = document.getElementById('exportDropdownWrap');
  const btnExportMenu = document.getElementById('btnExportMenu');
  const btnDownloadPng = document.getElementById('btnDownloadPng');
  const btnDownloadPdf = document.getElementById('btnDownloadPdf');
  const btnDownloadZip = document.getElementById('btnDownloadZip');
  const btnSendAllEmails = document.getElementById('btnSendAllEmails');

  // Modals
  const smtpModal = document.getElementById('smtpModal');
  const smtpModalClose = document.getElementById('smtpModalClose');
  const btnOpenSmtp = document.getElementById('btnOpenSmtp');
  const btnConfigSmtpSidebar = document.getElementById('btnConfigSmtpSidebar');
  const btnSaveSmtp = document.getElementById('btnSaveSmtp');
  const btnTestSmtp = document.getElementById('btnTestSmtp');
  const smtpTestResult = document.getElementById('smtpTestResult');
  const smtpStatusBadge = document.getElementById('smtpStatusBadge');
  const smtpHostVal = document.getElementById('smtpHostVal');
  const smtpUserVal = document.getElementById('smtpUserVal');
  const smtpHost = document.getElementById('smtpHost');
  const smtpPort = document.getElementById('smtpPort');
  const smtpUser = document.getElementById('smtpUser');
  const smtpPass = document.getElementById('smtpPass');
  const smtpFromName = document.getElementById('smtpFromName');

  const emailModal = document.getElementById('emailModal');
  const emailModalClose = document.getElementById('emailModalClose');
  const emailModalDone = document.getElementById('emailModalDone');
  const btnOpenComposeSidebar = document.getElementById('btnOpenComposeSidebar');
  const composeSummary = document.getElementById('composeSummary');
  const varChipsEl = document.getElementById('varChips');
  const emailSubject = document.getElementById('emailSubject');
  const emailBody = document.getElementById('emailBody');
  const btnSendEmails = document.getElementById('btnSendEmails');
  const emailProgressWrap = document.getElementById('emailProgressWrap');
  const emailProgressFill = document.getElementById('emailProgressFill');
  const emailProgressLbl = document.getElementById('emailProgressLbl');
  const emailResultLog = document.getElementById('emailResultLog');

  const shortcutsModal = document.getElementById('shortcutsModal');
  const shortcutsModalClose = document.getElementById('shortcutsModalClose');
  const shortcutsModalDone = document.getElementById('shortcutsModalDone');
  const btnOpenShortcuts = document.getElementById('btnOpenShortcuts');

  const certFileInput = document.getElementById('certFileInput');
  const btnUploadCustomTpl = document.getElementById('btnUploadCustomTpl');

  const progressWrap = document.getElementById('progressWrap');
  const progressFill = document.getElementById('progressFill');
  const progressLbl = document.getElementById('progressLbl');

  const API_BASE = (window.location.origin && !window.location.origin.startsWith('null') && !window.location.origin.startsWith('file'))
    ? window.location.origin
    : 'http://localhost:3001';

  // ── History Undo / Redo ────────────────────────────────────────────
  function saveHistory() {
    const snapshot = JSON.stringify({
      fields: state.fields,
      rowOverrides: state.rowOverrides,
      activeFieldIdx: state.activeFieldIdx,
    });
    state.undoStack.push(snapshot);
    if (state.undoStack.length > 30) state.undoStack.shift();
    state.redoStack = [];
  }

  function undo() {
    if (!state.undoStack.length) { toast('Nothing to undo'); return; }
    const current = JSON.stringify({
      fields: state.fields,
      rowOverrides: state.rowOverrides,
      activeFieldIdx: state.activeFieldIdx,
    });
    state.redoStack.push(current);
    const prev = JSON.parse(state.undoStack.pop());
    state.fields = prev.fields || [];
    state.rowOverrides = prev.rowOverrides || {};
    selectField(prev.activeFieldIdx >= 0 && prev.activeFieldIdx < state.fields.length ? prev.activeFieldIdx : -1);
    render();
    toast('Undo');
  }

  function redo() {
    if (!state.redoStack.length) { toast('Nothing to redo'); return; }
    const current = JSON.stringify({
      fields: state.fields,
      rowOverrides: state.rowOverrides,
      activeFieldIdx: state.activeFieldIdx,
    });
    state.undoStack.push(current);
    const next = JSON.parse(state.redoStack.pop());
    state.fields = next.fields || [];
    state.rowOverrides = next.rowOverrides || {};
    selectField(next.activeFieldIdx >= 0 && next.activeFieldIdx < state.fields.length ? next.activeFieldIdx : -1);
    render();
    toast('Redo');
  }

  btnUndo.addEventListener('click', undo);
  btnRedo.addEventListener('click', redo);

  // ── Sidebar Tabs ───────────────────────────────────────────────────
  document.querySelectorAll('.sidebar-tab').forEach(tabBtn => {
    tabBtn.addEventListener('click', () => {
      document.querySelectorAll('.sidebar-tab').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(tc => tc.classList.remove('active'));
      tabBtn.classList.add('active');
      const targetId = tabBtn.dataset.tab;
      const targetEl = document.getElementById(targetId);
      if (targetEl) targetEl.classList.add('active');
    });
  });

  // ── Build Font Picker Dropdown ─────────────────────────────────────
  (function buildDropdown() {
    let currentCategory = '';
    FONTS.forEach((f, idx) => {
      if (f.category !== currentCategory) {
        currentCategory = f.category;
        const sep = document.createElement('div');
        sep.className = 'font-category-label';
        sep.textContent = f.category;
        fontDropdown.appendChild(sep);
      }
      const item = document.createElement('div');
      item.className = 'font-item' + (idx === 0 ? ' active' : '');
      item.dataset.idx = idx;
      item.style.fontFamily = f.value;
      item.innerHTML = `
        <span>${f.label}</span>
        <svg class="font-item-check" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2.5">
          <polyline points="2 8 6 12 14 4"/>
        </svg>`;
      item.addEventListener('mouseenter', () => {
        state.hoverFont = f.value;
        if (state.activeFieldIdx >= 0) render();
      });
      item.addEventListener('click', () => { commitFont(idx); closeDropdown(); });
      fontDropdown.appendChild(item);
    });
  })();

  function commitFont(idx, silent = false) {
    state.committedFont = FONTS[idx].value;
    state.hoverFont = null;
    fontTriggerLabel.style.fontFamily = state.committedFont;
    fontTriggerLabel.textContent = FONTS[idx].label;
    fontDropdown.querySelectorAll('.font-item').forEach(el => {
      el.classList.toggle('active', parseInt(el.dataset.idx) === idx);
    });
    if (!silent) {
      saveActiveFieldTypography();
      render();
    }
  }

  function openDropdown() {
    fontDropdown.classList.add('open');
    fontTrigger.classList.add('open');
    FONTS.forEach(f => {
      document.fonts.load(`${parseInt(fontSize.value) || 700}px ${f.value}`).catch(() => { });
    });
  }

  function closeDropdown() {
    state.hoverFont = null;
    fontDropdown.classList.remove('open');
    fontTrigger.classList.remove('open');
    render();
  }

  fontTrigger.addEventListener('click', () => {
    if (fontDropdown.classList.contains('open')) closeDropdown();
    else openDropdown();
  });

  fontDropdown.addEventListener('mouseleave', () => { state.hoverFont = null; render(); });
  document.addEventListener('click', e => { if (!fontPicker.contains(e.target)) closeDropdown(); });

  // ── Helpers ────────────────────────────────────────────────────────
  function hexToRgba(hex, opacity) {
    const r = parseInt(hex.slice(1, 3), 16) || 0;
    const g = parseInt(hex.slice(3, 5), 16) || 0;
    const b = parseInt(hex.slice(5, 7), 16) || 0;
    return `rgba(${r},${g},${b},${opacity / 100})`;
  }

  function esc(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function toast(msg, type = '') {
    const el = document.getElementById('toast');
    el.textContent = msg;
    el.className = `show ${type}`;
    clearTimeout(el._t);
    el._t = setTimeout(() => el.className = '', 2500);
  }

  // ── Row Overrides ──────────────────────────────────────────────────
  function getEffectiveField(baseField, rowIdx) {
    const override = (rowIdx >= 0) ? state.rowOverrides[rowIdx]?.[baseField.key] : null;
    return override ? { ...baseField, ...override } : baseField;
  }

  function hasRowOverrides(rowIdx) {
    const o = state.rowOverrides[rowIdx];
    return !!o && Object.keys(o).length > 0;
  }

  // ── Typography Read / Write ────────────────────────────────────────
  function readTypographyFromControls() {
    return {
      font: state.committedFont,
      size: parseInt(fontSize.value) || 700,
      color: fontColor.value,
      bold: boldBtn.classList.contains('active'),
      italic: italicBtn.classList.contains('active'),
      align: document.querySelector('.align-btn.active')?.dataset.align || 'center',
      textTransform: document.querySelector('.transform-btn.active')?.dataset.transform || 'none',
      shadowEnabled: shadowEnabled.checked,
      shadowColor: shadowColor.value,
      shadowBlur: parseInt(shadowBlur.value) || 0,
      shadowOffsetX: parseInt(shadowOffsetX.value) || 0,
      shadowOffsetY: parseInt(shadowOffsetY.value) || 0,
      shadowOpacity: parseInt(shadowOpacity.value) || 60,
    };
  }

  function writeTypographyToControls(t) {
    const fidx = FONTS.findIndex(f => f.value === t.font);
    if (fidx >= 0) commitFont(fidx, true);

    fontSize.value = t.size || 700;
    fontColor.value = t.color || '#000000';
    fontColorHex.value = t.color || '#000000';

    boldBtn.classList.toggle('active', !!t.bold);
    italicBtn.classList.toggle('active', !!t.italic);

    alignBtns.forEach(b => b.classList.toggle('active', b.dataset.align === (t.align || 'center')));
    transformBtns.forEach(b => b.classList.toggle('active', b.dataset.transform === (t.textTransform || 'none')));

    shadowEnabled.checked = !!t.shadowEnabled;
    shadowControls.classList.toggle('visible', !!t.shadowEnabled);
    shadowColor.value = t.shadowColor || '#000000';
    shadowColorHex.value = t.shadowColor || '#000000';
    shadowBlur.value = t.shadowBlur || 6;
    shadowOffsetX.value = t.shadowOffsetX || 2;
    shadowOffsetY.value = t.shadowOffsetY || 3;
    shadowOpacity.value = t.shadowOpacity || 60;
    shadowOpacityVal.textContent = (t.shadowOpacity || 60) + '%';
  }

  function saveActiveFieldTypography() {
    if (state.activeFieldIdx < 0) return;
    saveHistory();
    const t = readTypographyFromControls();
    const baseField = state.fields[state.activeFieldIdx];

    if (state.editingRowIdx >= 0) {
      if (!state.rowOverrides[state.editingRowIdx]) state.rowOverrides[state.editingRowIdx] = {};
      if (!state.rowOverrides[state.editingRowIdx][baseField.key]) state.rowOverrides[state.editingRowIdx][baseField.key] = {};
      Object.assign(state.rowOverrides[state.editingRowIdx][baseField.key], t);
      updateTableRowHighlights();
    } else {
      Object.assign(baseField, t);
    }
  }

  // ── Field Management ───────────────────────────────────────────────
  function addField(key, x, y, customTypo = null, customValue = null, isCustomText = false) {
    saveHistory();
    const autoSize = getAutoFontSizeForField(key);
    const baseTypo = readTypographyFromControls();
    const t = customTypo || {
      ...baseTypo,
      size: autoSize,
    };
    state.fields.push({
      key,
      x,
      y,
      customValue: customValue !== null ? customValue : (isCustomText ? key : null),
      isCustomText: !!isCustomText,
      ...t,
      _bbox: null,
    });
    selectField(state.fields.length - 1);
    updateBulkBtn();
  }

  function selectField(idx) {
    state.activeFieldIdx = idx;
    if (idx >= 0 && idx < state.fields.length) {
      const baseField = state.fields[idx];
      const effectiveField = getEffectiveField(baseField, state.editingRowIdx);
      writeTypographyToControls(effectiveField);

      // Check if this is a custom static text field (not an Excel column)
      const isCustom = !!(baseField.isCustomText || (baseField.customValue !== undefined && baseField.customValue !== null) || (!state.excelColumns.includes(baseField.key) && !state.excelData.some(r => r[baseField.key] !== undefined)));

      if (customTextInputGroup && customTextInput) {
        if (isCustom) {
          customTextInputGroup.style.display = 'flex';
          customTextInput.value = effectiveField.customValue !== undefined && effectiveField.customValue !== null
            ? effectiveField.customValue
            : (baseField.customValue !== undefined && baseField.customValue !== null ? baseField.customValue : (effectiveField.text || baseField.key || ''));
        } else {
          customTextInputGroup.style.display = 'none';
        }
      }

      activeFieldLabel.textContent = isCustom ? (baseField.customValue || baseField.key) : baseField.key;
      activeFieldLabel.classList.add('has-field');
      btnRemoveField.style.display = '';
    } else {
      state.activeFieldIdx = -1;
      if (customTextInputGroup) customTextInputGroup.style.display = 'none';
      activeFieldLabel.textContent = 'no field selected';
      activeFieldLabel.classList.remove('has-field');
      btnRemoveField.style.display = 'none';
    }
    render();
  }

  if (customTextInput) {
    customTextInput.addEventListener('input', () => {
      if (state.activeFieldIdx < 0) return;
      const baseField = state.fields[state.activeFieldIdx];
      const val = customTextInput.value;
      baseField.customValue = val;
      baseField.isCustomText = true;
      if (state.editingRowIdx >= 0) {
        if (!state.rowOverrides[state.editingRowIdx]) state.rowOverrides[state.editingRowIdx] = {};
        if (!state.rowOverrides[state.editingRowIdx][baseField.key]) state.rowOverrides[state.editingRowIdx][baseField.key] = {};
        state.rowOverrides[state.editingRowIdx][baseField.key].customValue = val;
      }
      activeFieldLabel.textContent = val || 'Custom Text';
      render();
    });
  }

  btnRemoveField.addEventListener('click', () => {
    if (state.activeFieldIdx < 0) return;
    saveHistory();
    const key = state.fields[state.activeFieldIdx].key;
    for (const rowIdx of Object.keys(state.rowOverrides)) {
      delete state.rowOverrides[rowIdx][key];
    }
    state.fields.splice(state.activeFieldIdx, 1);
    selectField(-1);
    updateBulkBtn();
    updateTableRowHighlights();
    render();
    toast(`Field removed`);
  });

  btnAddFieldDirect.addEventListener('click', () => {
    if (!state.image) {
      const luxuryBtn = document.getElementById('btnSelectTplLuxury');
      if (luxuryBtn) luxuryBtn.click();
    }
    const defaultText = 'Certificate of Achievement';
    const uniqueKey = 'custom_' + Date.now();
    addField(uniqueKey, 0.50, 0.50, null, defaultText, true);

    // Switch to Style tab to show custom text input immediately
    const tabStyle = document.getElementById('tabBtnTypography');
    if (tabStyle) tabStyle.click();

    if (customTextInput) {
      customTextInput.focus();
      customTextInput.select();
    }
    toast('Custom text added! Type text in sidebar', 'success');
  });

  function updateBulkBtn() {
    const canBulk = state.excelData.length > 0 && state.fields.length > 0;
    btnDownloadZip.disabled = !canBulk;
    btnSendEmails.disabled = state.excelData.length === 0;
  }

  // ── Hit Testing ────────────────────────────────────────────────────
  function hitTestFields(cx, cy) {
    for (let i = state.fields.length - 1; i >= 0; i--) {
      const b = state.fields[i]._bbox;
      if (!b) continue;
      const pad = 12;
      if (cx >= b.x1 - pad && cx <= b.x2 + pad && cy >= b.y1 - pad && cy <= b.y2 + pad) return i;
    }
    return -1;
  }

  function buildFieldFont(field, overrideFont) {
    const parts = [];
    if (field.italic) parts.push('italic');
    if (field.bold) parts.push('bold');
    parts.push(`${field.size}px`);
    parts.push(overrideFont || field.font);
    return parts.join(' ');
  }

  function applyTextTransform(value, transform) {
    if (transform === 'uppercase') return String(value).toUpperCase();
    if (transform === 'titlecase') return String(value).replace(/\w\S*/g, txt => txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase());
    return String(value);
  }

  function drawFieldOnCtx(c, field, value, x, y, fontOverride) {
    const displayValue = applyTextTransform(value, field.textTransform || 'none');
    c.font = fontOverride || buildFieldFont(field);
    c.fillStyle = field.color;
    c.textAlign = field.align;
    c.textBaseline = 'middle';

    if (field.shadowEnabled) {
      c.shadowColor = hexToRgba(field.shadowColor, field.shadowOpacity);
      c.shadowBlur = field.shadowBlur;
      c.shadowOffsetX = field.shadowOffsetX;
      c.shadowOffsetY = field.shadowOffsetY;
    } else {
      c.shadowColor = 'transparent';
      c.shadowBlur = c.shadowOffsetX = c.shadowOffsetY = 0;
    }

    c.fillText(displayValue, x, y);
    c.shadowColor = 'transparent';
    c.shadowBlur = c.shadowOffsetX = c.shadowOffsetY = 0;
  }

  // ── High-Performance Canvas Rendering ──────────────────────────────
  function render() {
    if (!state.image) {
      if (canvasEmptyState) canvasEmptyState.style.display = 'flex';
      if (canvasContainer) canvasContainer.style.display = 'none';
      return;
    }
    if (canvasEmptyState) canvasEmptyState.style.display = 'none';
    if (canvasContainer) canvasContainer.style.display = 'inline-block';

    const w = state.naturalW;
    const h = state.naturalH;
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(state.image, 0, 0, w, h);

    const previewRow = state.excelData[state.previewRowIdx] || null;

    for (let i = 0; i < state.fields.length; i++) {
      const baseField = state.fields[i];
      const field = getEffectiveField(baseField, state.previewRowIdx);
      let value = '';
      if (previewRow && previewRow[field.key] !== undefined && previewRow[field.key] !== '') {
        value = previewRow[field.key];
      } else if (field.customValue !== undefined && field.customValue !== null) {
        value = field.customValue;
      } else if (field.isCustomText) {
        value = field.key;
      } else {
        value = `[${field.key}]`;
      }
      const x = field.x * w;
      const y = field.y * h;

      const effectiveFont = (i === state.activeFieldIdx && state.hoverFont)
        ? buildFieldFont(field, state.hoverFont)
        : buildFieldFont(field);

      drawFieldOnCtx(ctx, field, value, x, y, effectiveFont);

      ctx.font = effectiveFont;
      const tw = ctx.measureText(applyTextTransform(value, field.textTransform || 'none')).width;
      const th = field.size * 1.35;
      let x1, x2;
      if (field.align === 'center') { x1 = x - tw / 2; x2 = x + tw / 2; }
      else if (field.align === 'left') { x1 = x; x2 = x + tw; }
      else { x1 = x - tw; x2 = x; }
      baseField._bbox = { x1, y1: y - th / 2, x2, y2: y + th / 2 };

      if (i === state.activeFieldIdx) {
        ctx.save();
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = Math.max(2, w / 600);
        ctx.setLineDash([8, 6]);
        const pad = 10;
        ctx.strokeRect(x1 - pad, y - th / 2 - pad / 2, (x2 - x1) + pad * 2, th + pad);
        ctx.setLineDash([]);
        ctx.restore();
      }
    }

    if (state.activeFieldIdx >= 0) {
      const baseField = state.fields[state.activeFieldIdx];
      const f = getEffectiveField(baseField, state.previewRowIdx);
      posX.textContent = 'X: ' + Math.round(f.x * 100) + '%';
      posY.textContent = 'Y: ' + Math.round(f.y * 100) + '%';
    } else {
      posX.textContent = 'X: —';
      posY.textContent = 'Y: —';
    }
  }

  // ── Canvas Navigation, Zoom & Panning ──────────────────────────────
  const ZOOM_PRESETS = [0.08, 0.12, 0.16, 0.20, 0.25, 0.33, 0.40, 0.50, 0.65, 0.75, 0.85, 1.00, 1.25, 1.50, 2.00, 2.50, 3.00, 4.00, 5.00];

  function setZoom(scale) {
    state.scale = Math.max(0.04, Math.min(5.0, scale));
    zoomLbl.textContent = Math.round(state.scale * 100) + '%';
    if (state.naturalW && state.naturalH) {
      let needsRedraw = false;
      if (canvas.width !== state.naturalW) {
        canvas.width = state.naturalW;
        needsRedraw = true;
      }
      if (canvas.height !== state.naturalH) {
        canvas.height = state.naturalH;
        needsRedraw = true;
      }
      canvas.style.width = Math.round(state.naturalW * state.scale) + 'px';
      canvas.style.height = Math.round(state.naturalH * state.scale) + 'px';
      if (needsRedraw) render();
    }
  }

  function zoomIn() {
    const nextPreset = ZOOM_PRESETS.find(p => p > state.scale + 0.015);
    setZoom(nextPreset || state.scale * 1.2);
  }

  function zoomOut() {
    const prevPresets = ZOOM_PRESETS.filter(p => p < state.scale - 0.015);
    setZoom(prevPresets.length ? prevPresets[prevPresets.length - 1] : state.scale / 1.2);
  }

  function autoFitZoom() {
    if (!state.naturalW || !state.naturalH || !canvasWrap) return;
    const wrapRect = canvasWrap.getBoundingClientRect();
    const paddingX = 64;
    const paddingY = 120;
    const availW = Math.max(200, (wrapRect.width || canvasWrap.clientWidth || 800) - paddingX);
    const availH = Math.max(200, (wrapRect.height || canvasWrap.clientHeight || 600) - paddingY);
    const bestScale = Math.min(availW / state.naturalW, availH / state.naturalH);
    setZoom(Math.max(0.04, Math.min(bestScale, 1.0)));
  }

  zoomInBtn.addEventListener('click', zoomIn);
  zoomOutBtn.addEventListener('click', zoomOut);
  zoomFitBtn.addEventListener('click', autoFitZoom);
  zoom100Btn.addEventListener('click', () => setZoom(1.0));
  zoomLbl.addEventListener('click', () => Math.abs(state.scale - 1.0) < 0.04 ? autoFitZoom() : setZoom(1.0));

  // Wheel Zoom
  if (canvasWrap) {
    canvasWrap.addEventListener('wheel', e => {
      if (!state.image) return;
      e.preventDefault();
      const delta = -e.deltaY;
      const zoomFactor = delta > 0 ? 1.12 : 0.89;
      const wrapRect = canvasWrap.getBoundingClientRect();
      const mouseX = e.clientX - wrapRect.left + canvasWrap.scrollLeft;
      const mouseY = e.clientY - wrapRect.top + canvasWrap.scrollTop;
      const prevScale = state.scale;
      const newScale = Math.max(0.04, Math.min(5.0, prevScale * zoomFactor));

      if (Math.abs(newScale - prevScale) > 0.0001) {
        setZoom(newScale);
        const scaleRatio = newScale / prevScale;
        canvasWrap.scrollLeft = (mouseX * scaleRatio) - (e.clientX - wrapRect.left);
        canvasWrap.scrollTop = (mouseY * scaleRatio) - (e.clientY - wrapRect.top);
      }
    }, { passive: false });
  }

  // Panning & Dragging
  function canvasCoords(e) {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: (clientX - rect.left) / rect.width,
      y: (clientY - rect.top) / rect.height,
    };
  }

  function startPanning(e) {
    if (!state.image) return;
    state.isPanning = true;
    state.panStartX = e.clientX;
    state.panStartY = e.clientY;
    state.scrollStartX = canvasWrap.scrollLeft;
    state.scrollStartY = canvasWrap.scrollTop;
    canvasWrap.style.cursor = 'grabbing';
  }

  canvas.addEventListener('mousedown', e => {
    if (e.button === 2) return;
    if (e.button === 1 || e.altKey || e.shiftKey || e.spaceKey) {
      startPanning(e);
      e.preventDefault();
      return;
    }
    if (e.button === 0) {
      const c = canvasCoords(e);
      const cx = c.x * state.naturalW;
      const cy = c.y * state.naturalH;
      const hitIdx = hitTestFields(cx, cy);

      if (hitIdx >= 0) {
        selectField(hitIdx);
        state.draggingField = true;
        const baseField = state.fields[hitIdx];
        const f = getEffectiveField(baseField, state.previewRowIdx);
        state.dragFieldOffX = c.x - f.x;
        state.dragFieldOffY = c.y - f.y;
        canvas.style.cursor = 'grabbing';
      } else {
        selectField(-1);
        startPanning(e);
      }
      e.preventDefault();
    }
  });

  window.addEventListener('mousemove', e => {
    if (state.isPanning) {
      const dx = e.clientX - state.panStartX;
      const dy = e.clientY - state.panStartY;
      canvasWrap.scrollLeft = state.scrollStartX - dx;
      canvasWrap.scrollTop = state.scrollStartY - dy;
      return;
    }
    if (!state.draggingField || state.activeFieldIdx < 0) return;
    const c = canvasCoords(e);
    const newX = Math.max(0, Math.min(1, c.x - state.dragFieldOffX));
    const newY = Math.max(0, Math.min(1, c.y - state.dragFieldOffY));
    const baseField = state.fields[state.activeFieldIdx];

    if (state.editingRowIdx >= 0) {
      if (!state.rowOverrides[state.editingRowIdx]) state.rowOverrides[state.editingRowIdx] = {};
      if (!state.rowOverrides[state.editingRowIdx][baseField.key]) state.rowOverrides[state.editingRowIdx][baseField.key] = {};
      state.rowOverrides[state.editingRowIdx][baseField.key].x = newX;
      state.rowOverrides[state.editingRowIdx][baseField.key].y = newY;
      updateTableRowHighlights();
    } else {
      baseField.x = newX;
      baseField.y = newY;
    }
    render();
  });

  window.addEventListener('mouseup', () => {
    if (state.isPanning) {
      state.isPanning = false;
      canvasWrap.style.cursor = '';
    }
    state.draggingField = false;
    canvas.style.cursor = 'crosshair';
  });

  // Nudge Buttons & Actions
  function nudgeField(dx, dy) {
    if (state.activeFieldIdx < 0) return;
    saveHistory();
    const baseField = state.fields[state.activeFieldIdx];
    const f = getEffectiveField(baseField, state.previewRowIdx);
    const newX = Math.max(0, Math.min(1, f.x + dx / state.naturalW));
    const newY = Math.max(0, Math.min(1, f.y + dy / state.naturalH));

    if (state.editingRowIdx >= 0) {
      if (!state.rowOverrides[state.editingRowIdx]) state.rowOverrides[state.editingRowIdx] = {};
      if (!state.rowOverrides[state.editingRowIdx][baseField.key]) state.rowOverrides[state.editingRowIdx][baseField.key] = {};
      state.rowOverrides[state.editingRowIdx][baseField.key].x = newX;
      state.rowOverrides[state.editingRowIdx][baseField.key].y = newY;
    } else {
      baseField.x = newX;
      baseField.y = newY;
    }
    render();
  }

  btnNudgeUp.addEventListener('click', () => nudgeField(0, -6));
  btnNudgeDown.addEventListener('click', () => nudgeField(0, 6));
  btnNudgeLeft.addEventListener('click', () => nudgeField(-6, 0));
  btnNudgeRight.addEventListener('click', () => nudgeField(6, 0));
  btnCenterField.addEventListener('click', () => {
    if (state.activeFieldIdx < 0) return;
    saveHistory();
    const baseField = state.fields[state.activeFieldIdx];
    if (state.editingRowIdx >= 0) {
      if (!state.rowOverrides[state.editingRowIdx]) state.rowOverrides[state.editingRowIdx] = {};
      if (!state.rowOverrides[state.editingRowIdx][baseField.key]) state.rowOverrides[state.editingRowIdx][baseField.key] = {};
      state.rowOverrides[state.editingRowIdx][baseField.key].x = 0.50;
    } else {
      baseField.x = 0.50;
    }
    render();
    toast('Field centered horizontally', 'success');
  });

  // Keyboard Shortcuts
  window.addEventListener('keydown', e => {
    if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName) || document.activeElement.isContentEditable) return;

    if (e.key === 'ArrowUp') { e.preventDefault(); nudgeField(0, e.shiftKey ? -20 : -2); }
    if (e.key === 'ArrowDown') { e.preventDefault(); nudgeField(0, e.shiftKey ? 20 : 2); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); nudgeField(e.shiftKey ? -20 : -2, 0); }
    if (e.key === 'ArrowRight') { e.preventDefault(); nudgeField(e.shiftKey ? 20 : 2, 0); }

    if ((e.key === 'Delete' || e.key === 'Backspace') && state.activeFieldIdx >= 0) {
      e.preventDefault();
      btnRemoveField.click();
    }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
      e.preventDefault();
      if (e.shiftKey) redo(); else undo();
    }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
      e.preventDefault();
      redo();
    }
    if (e.key === '[') btnPrevRecipient.click();
    if (e.key === ']') btnNextRecipient.click();
    if (e.key === '?') openModal(shortcutsModal);
    if (e.key === 'Escape') {
      closeModal(smtpModal);
      closeModal(emailModal);
      closeModal(shortcutsModal);
      selectField(-1);
    }
  });

  // ── Drag Drop Column Chips to Canvas ───────────────────────────────
  canvas.addEventListener('dragover', e => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    canvas.classList.add('drop-over');
  });
  canvas.addEventListener('dragleave', () => canvas.classList.remove('drop-over'));
  canvas.addEventListener('drop', e => {
    e.preventDefault();
    canvas.classList.remove('drop-over');
    const key = e.dataTransfer.getData('text/plain');
    if (!key) return;
    const rect = canvas.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
    addField(key, x, y);
    toast(`"${key}" placed on certificate`, 'success');
  });

  function buildColumnChips(columns) {
    columnChipsEl.innerHTML = '';
    columns.forEach(col => {
      const chip = document.createElement('div');
      chip.className = 'col-chip';
      chip.draggable = true;
      chip.dataset.key = col;
      chip.innerHTML = `
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <polyline points="5 9 2 12 5 15"/><polyline points="19 9 22 12 19 15"/><line x1="2" y1="12" x2="22" y2="12"/>
        </svg>
        ${esc(col)}`;
      chip.addEventListener('dragstart', e => {
        e.dataTransfer.setData('text/plain', col);
        chip.classList.add('dragging');
      });
      chip.addEventListener('dragend', () => chip.classList.remove('dragging'));
      columnChipsEl.appendChild(chip);
    });
    columnFieldsSection.style.display = '';
  }

  // ── Excel & CSV Import ─────────────────────────────────────────────
  excelUploadArea.addEventListener('click', () => excelFile.click());
  excelUploadArea.addEventListener('dragover', e => { e.preventDefault(); excelUploadArea.classList.add('drag-over'); });
  excelUploadArea.addEventListener('dragleave', () => excelUploadArea.classList.remove('drag-over'));
  excelUploadArea.addEventListener('drop', e => {
    e.preventDefault();
    excelUploadArea.classList.remove('drag-over');
    if (e.dataTransfer.files[0]) parseExcelFile(e.dataTransfer.files[0]);
  });
  excelFile.addEventListener('change', () => {
    if (excelFile.files[0]) parseExcelFile(excelFile.files[0]);
  });

  function parseExcelFile(file) {
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
        if (!rows.length) { toast('No data rows found in file', 'warning'); return; }

        const normalise = obj => {
          const res = {};
          for (const k of Object.keys(obj)) res[k.toLowerCase().trim()] = String(obj[k]).trim();
          return res;
        };

        const parsed = rows.map(normalise);
        const allKeys = Object.keys(parsed[0]);
        const nameKey = allKeys.find(k => k.includes('name')) || allKeys[0];
        const emailKey = allKeys.find(k => k.includes('email')) || allKeys[1];

        state.excelColumns = allKeys;
        state.excelData = parsed.map(r => ({
          ...r,
          name: r[nameKey] || '',
          email: emailKey ? (r[emailKey] || '') : '',
        })).filter(r => r.name || allKeys.some(k => r[k]));

        state.previewRowIdx = 0;
        state.editingRowIdx = -1;
        state.rowOverrides = {};

        buildVarChips();
        buildColumnChips(allKeys);
        renderExcelPreview();
        updateBulkBtn();
        updateRowIndicator();
        excelUploadLabel.textContent = `${file.name} (${state.excelData.length} rows)`;
        toast(`Loaded ${state.excelData.length} recipients & ${allKeys.length} columns`, 'success');
        render();
      } catch (err) {
        toast('Parse failed: ' + err.message, 'warning');
      }
    };
    reader.readAsArrayBuffer(file);
  }

  function renderExcelPreview() {
    const data = state.excelData;
    const cols = state.excelColumns.slice(0, 3);
    const thead = document.getElementById('excelTableHead');
    thead.innerHTML = '<tr><th>#</th>' + cols.map(c => `<th>${esc(c)}</th>`).join('') + '</tr>';
    excelTableBody.innerHTML = '';
    for (let i = 0; i < data.length; i++) {
      const tr = document.createElement('tr');
      tr.dataset.rowIdx = i;
      tr.innerHTML = `<td>${i + 1}</td>` + cols.map(c => `<td>${esc(data[i][c] || '—')}</td>`).join('');
      tr.addEventListener('click', () => selectPreviewRow(i));
      excelTableBody.appendChild(tr);
    }
    excelPreviewTitle.textContent = `Recipients (${data.length})`;
    excelPreviewWrap.style.display = 'block';
    excelCount.textContent = `${data.length} rows`;
    updateTableRowHighlights();
  }

  function selectPreviewRow(rowIdx) {
    state.previewRowIdx = rowIdx;
    state.editingRowIdx = rowIdx;
    if (state.activeFieldIdx >= 0) {
      const baseField = state.fields[state.activeFieldIdx];
      writeTypographyToControls(getEffectiveField(baseField, rowIdx));
    }
    updateTableRowHighlights();
    updateRowIndicator();
    render();
  }

  function updateTableRowHighlights() {
    excelTableBody.querySelectorAll('tr[data-row-idx]').forEach(tr => {
      const idx = parseInt(tr.dataset.rowIdx);
      tr.classList.toggle('active', idx === state.previewRowIdx);
    });
  }

  function updateRowIndicator() {
    if (!state.excelData.length) {
      rowIndicatorLabel.textContent = 'Recipient 1 of 1';
      return;
    }
    const cur = state.previewRowIdx + 1;
    const total = state.excelData.length;
    const row = state.excelData[state.previewRowIdx];
    const name = row?.name || `Recipient ${cur}`;
    rowIndicatorLabel.textContent = `${cur}/${total}: ${name}`;
  }

  btnPrevRecipient.addEventListener('click', () => {
    if (!state.excelData.length) return;
    let nextIdx = state.previewRowIdx - 1;
    if (nextIdx < 0) nextIdx = state.excelData.length - 1;
    selectPreviewRow(nextIdx);
  });

  btnNextRecipient.addEventListener('click', () => {
    if (!state.excelData.length) return;
    let nextIdx = state.previewRowIdx + 1;
    if (nextIdx >= state.excelData.length) nextIdx = 0;
    selectPreviewRow(nextIdx);
  });

  btnResetRowOverride.addEventListener('click', () => {
    if (state.editingRowIdx < 0) return;
    delete state.rowOverrides[state.editingRowIdx];
    if (state.activeFieldIdx >= 0) writeTypographyToControls(state.fields[state.activeFieldIdx]);
    updateTableRowHighlights();
    render();
    toast(`Recipient ${state.editingRowIdx + 1} overrides reset`, 'success');
  });

  btnClearExcel.addEventListener('click', () => {
    state.excelData = [];
    state.excelColumns = [];
    state.previewRowIdx = 0;
    state.editingRowIdx = -1;
    state.rowOverrides = {};
    excelPreviewWrap.style.display = 'none';
    columnFieldsSection.style.display = 'none';
    excelCount.textContent = '0 rows';
    excelUploadLabel.textContent = 'Drop Excel / CSV file';
    excelFile.value = '';
    updateRowIndicator();
    updateBulkBtn();
    render();
    toast('Recipient data cleared');
  });

  // ── Sample Recipient Data ──────────────────────────────────────────
  function loadSampleRecipientData(silent = false) {
    const sampleRows = [
      { name: 'Alexander Vance', email: 'alexander.vance@example.com', course: 'Full-Stack Software Architecture', distinction: 'Summa Cum Laude', cert_id: 'VG-2026-0814', date: 'October 15, 2026' },
      { name: 'Elena Rostova', email: 'elena.rostova@example.com', course: 'Artificial Intelligence & Agentic Systems', distinction: 'Distinction with Honors', cert_id: 'VG-2026-0815', date: 'October 15, 2026' },
      { name: 'Marcus Sterling', email: 'marcus.sterling@example.com', course: 'Cloud Infrastructure & High-Scale Systems', distinction: 'First Class Honors', cert_id: 'VG-2026-0816', date: 'October 15, 2026' },
      { name: 'Sophia Chen', email: 'sophia.chen@example.com', course: 'Enterprise Cyber Security & DevSecOps', distinction: 'Excellence Distinction', cert_id: 'VG-2026-0817', date: 'October 15, 2026' },
    ];
    const allKeys = ['name', 'email', 'course', 'distinction', 'cert_id', 'date'];
    state.excelColumns = allKeys;
    state.excelData = sampleRows;
    state.previewRowIdx = 0;
    state.editingRowIdx = -1;
    state.rowOverrides = {};
    buildVarChips();
    buildColumnChips(allKeys);
    renderExcelPreview();
    updateBulkBtn();
    updateRowIndicator();
    if (!silent) toast('Loaded 4 sample recipients & fields!', 'success');
    render();
  }

  btnLoadSampleData.addEventListener('click', () => loadSampleRecipientData(false));

  // ── Built-in Luxury Templates ──────────────────────────────────────
  function generateTemplateCanvas(type, onComplete) {
    const off = document.createElement('canvas');
    off.width = 2000;
    off.height = 1414;
    const c = off.getContext('2d');

    // Base White Parchment
    c.fillStyle = '#ffffff';
    c.fillRect(0, 0, 2000, 1414);

    if (type === 'vg-luxury') {
      // Jet Black Outer Frame
      c.fillStyle = '#000000';
      c.fillRect(0, 0, 2000, 1414);
      c.fillStyle = '#ffffff';
      c.fillRect(40, 40, 1920, 1334);

      // Engraved Triple Borders
      c.strokeStyle = '#000000';
      c.lineWidth = 6;
      c.strokeRect(58, 58, 1884, 1298);

      c.strokeStyle = '#71717a';
      c.lineWidth = 1.5;
      c.strokeRect(70, 70, 1860, 1274);

      c.strokeStyle = '#000000';
      c.lineWidth = 1;
      c.strokeRect(78, 78, 1844, 1258);

      // Top VG Seal Crest
      c.fillStyle = '#000000';
      c.beginPath();
      c.arc(1000, 200, 42, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = '#ffffff';
      c.beginPath();
      c.arc(1000, 200, 36, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = '#000000';
      c.font = 'bold 24px "Cinzel", serif';
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.fillText('VG', 1000, 200);

      // Headers
      c.font = '700 17px "Cinzel", serif';
      c.fillStyle = '#52525b';
      c.fillText('VG CERTIFICATION AUTHORITY', 1000, 280);

      c.font = '900 50px "Cinzel", serif';
      c.fillStyle = '#000000';
      c.fillText('CERTIFICATE OF ACHIEVEMENT', 1000, 350);

      c.font = 'italic 22px "Playfair Display", serif';
      c.fillStyle = '#71717a';
      c.fillText('THIS IS PROUDLY PRESENTED TO', 1000, 430);

      // Underline Bar
      c.strokeStyle = '#000000';
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(500, 650);
      c.lineTo(1500, 650);
      c.stroke();

      // Description Body
      c.font = '20px "Lato", sans-serif';
      c.fillStyle = '#27272a';
      c.fillText('For exceptional dedication, outstanding competence, and successful fulfillment', 1000, 760);
      c.fillText('of all program standards and requirements, awarded with high distinction.', 1000, 795);

      // Bottom Seals & Signature
      c.strokeStyle = '#71717a';
      c.lineWidth = 1.5;
      c.beginPath();
      c.moveTo(340, 1140); c.lineTo(660, 1140);
      c.moveTo(1340, 1140); c.lineTo(1660, 1140);
      c.stroke();

      c.font = 'bold 16px "Cinzel", serif';
      c.fillStyle = '#000000';
      c.fillText('DATE OF ISSUANCE', 500, 1170);
      c.fillText('AUTHORIZED SIGNATURE', 1500, 1170);

      c.font = 'italic 34px "Dancing Script", cursive';
      c.fillText('Authorized Signatory', 1500, 1115);

      // Official Stamp
      c.fillStyle = '#000000';
      c.beginPath(); c.arc(1000, 1100, 56, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#ffffff';
      c.beginPath(); c.arc(1000, 1100, 48, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#000000';
      c.font = 'bold 13px "Cinzel", serif';
      c.fillText('OFFICIAL', 1000, 1090);
      c.fillText('VG SEAL', 1000, 1112);
    }
    else if (type === 'vg-platinum') {
      // Clean Minimalist Platinum Line Art
      c.strokeStyle = '#000000';
      c.lineWidth = 4;
      c.strokeRect(40, 40, 1920, 1334);
      c.strokeStyle = '#a1a1aa';
      c.lineWidth = 1;
      c.strokeRect(52, 52, 1896, 1310);

      c.font = '700 16px "Inter", sans-serif';
      c.fillStyle = '#71717a';
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.fillText('EXCELLENCE IN RECOGNITION', 1000, 240);

      c.font = '900 56px "Cinzel", serif';
      c.fillStyle = '#000000';
      c.fillText('CERTIFICATE OF DISTINCTION', 1000, 320);

      c.font = '18px "Lato", sans-serif';
      c.fillStyle = '#52525b';
      c.fillText('IS PRESENTED TO RECOGNIZE THE MERIT OF', 1000, 420);

      c.strokeStyle = '#e4e4e7';
      c.lineWidth = 2;
      c.beginPath(); c.moveTo(400, 650); c.lineTo(1600, 650); c.stroke();

      c.font = '19px "Inter", sans-serif';
      c.fillStyle = '#3f3f46';
      c.fillText('Having successfully completed all rigorous evaluations and curriculum criteria.', 1000, 770);

      c.strokeStyle = '#000000';
      c.lineWidth = 1.5;
      c.beginPath();
      c.moveTo(350, 1150); c.lineTo(650, 1150);
      c.moveTo(1350, 1150); c.lineTo(1650, 1150);
      c.stroke();

      c.font = 'bold 14px "Inter", sans-serif';
      c.fillStyle = '#000000';
      c.fillText('DATE', 500, 1180);
      c.fillText('DIRECTOR SIGNATURE', 1500, 1180);
    }
    else {
      // Academic Honors
      c.strokeStyle = '#000000';
      c.lineWidth = 8;
      c.strokeRect(50, 50, 1900, 1314);

      c.font = 'bold 22px "Cinzel", serif';
      c.fillStyle = '#000000';
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.fillText('ACADEMIC HONORS COUNCIL', 1000, 240);

      c.font = '900 54px "Cinzel", serif';
      c.fillText('DIPLOMA OF EXCELLENCE', 1000, 330);

      c.font = 'italic 20px "EB Garamond", serif';
      c.fillStyle = '#52525b';
      c.fillText('This honor is conferred upon', 1000, 430);

      c.strokeStyle = '#000000';
      c.lineWidth = 1.5;
      c.beginPath();
      c.moveTo(340, 1150); c.lineTo(660, 1150);
      c.moveTo(1340, 1150); c.lineTo(1660, 1150);
      c.stroke();

      c.font = 'bold 15px "Cinzel", serif';
      c.fillStyle = '#000000';
      c.fillText('VERIFIED DATE', 500, 1180);
      c.fillText('DEAN OF ACADEMICS', 1500, 1180);
    }

    const img = new Image();
    img.onload = () => {
      state.image = img;
      state.naturalW = img.naturalWidth;
      state.naturalH = img.naturalHeight;
      state.templateType = type;
      canvas.width = state.naturalW;
      canvas.height = state.naturalH;
      autoFitZoom();
      render();
      if (onComplete) onComplete();
    };
    img.src = off.toDataURL('image/png');
  }

  // ── IndexedDB Storage for Custom Templates (100% On-Device) ─────────
  const DB_NAME = 'VG_CertificateStudio_DB';
  const DB_VERSION = 1;
  const STORE_TEMPLATES = 'custom_templates';

  function getDB() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = e => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(STORE_TEMPLATES)) {
          db.createObjectStore(STORE_TEMPLATES, { keyPath: 'id' });
        }
      };
      req.onsuccess = e => resolve(e.target.result);
      req.onerror = e => reject(e.target.error);
    });
  }

  async function saveCustomTemplateToDB(templateObj) {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_TEMPLATES, 'readwrite');
      const store = tx.objectStore(STORE_TEMPLATES);
      const req = store.put(templateObj);
      req.onsuccess = () => resolve(templateObj);
      req.onerror = () => reject(req.error);
    });
  }

  async function getAllCustomTemplatesFromDB() {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_TEMPLATES, 'readonly');
      const store = tx.objectStore(STORE_TEMPLATES);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }

  async function deleteCustomTemplateFromDB(id, name) {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_TEMPLATES, 'readwrite');
      const store = tx.objectStore(STORE_TEMPLATES);

      try {
        if (id != null) store.delete(id);
        if (typeof id === 'string' && !isNaN(Number(id))) store.delete(Number(id));
      } catch (_) { }

      const req = store.openCursor();
      req.onsuccess = e => {
        const cursor = e.target.result;
        if (cursor) {
          const val = cursor.value;
          const matchId = id != null && (val.id == id || String(val.id) === String(id) || cursor.key == id || String(cursor.key) === String(id));
          const matchName = name && val.name === name;
          if (matchId || matchName) {
            cursor.delete();
          }
          cursor.continue();
        }
      };
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    });
  }

  // ── Custom Templates UI Renderer ───────────────────────────────────
  const customTemplatesSection = document.getElementById('customTemplatesSection');
  const customTemplatesGrid = document.getElementById('customTemplatesGrid');
  const customTemplatesCount = document.getElementById('customTemplatesCount');
  const tplUploadDropzone = document.getElementById('tplUploadDropzone');
  const tplUploadLabel = document.getElementById('tplUploadLabel');

  async function removeCustomTemplate(tplId, tplName) {
    if (!tplId && !tplName) return;
    try {
      await deleteCustomTemplateFromDB(tplId, tplName);
      toast(`Deleted "${tplName || 'Template'}" from device`, 'success');
      if (state.templateType === `custom-${tplId}` || state.templateType === `custom-${String(tplId)}`) {
        state.image = null;
        state.templateType = null;
        document.querySelectorAll('.template-card, .custom-template-card').forEach(c => c.classList.remove('active'));
        render();
      }
      await refreshCustomTemplatesList();
    } catch (err) {
      console.error('Delete template failed:', err);
      toast('Could not delete template: ' + err.message, 'warning');
    }
  }

  async function refreshCustomTemplatesList() {
    try {
      const templates = await getAllCustomTemplatesFromDB();
      if (customTemplatesCount) customTemplatesCount.textContent = `${templates.length} saved`;
      if (!customTemplatesGrid) return;

      if (!templates.length) {
        customTemplatesGrid.innerHTML = '<p class="field-hint" id="noCustomTplHint">No custom templates saved yet. Upload a certificate background above to store it on your device.</p>';
        return;
      }

      customTemplatesGrid.innerHTML = '';
      templates.forEach(tpl => {
        const card = document.createElement('div');
        const isActive = state.templateType === `custom-${tpl.id}`;
        card.className = `custom-template-card${isActive ? ' active' : ''}`;
        card.dataset.id = tpl.id;

        card.innerHTML = `
          <div class="template-thumb thumb-custom" style="background-image:url('${tpl.thumbDataUrl || tpl.dataUrl}')">
            <span class="thumb-badge">${tpl.naturalW}×${tpl.naturalH}</span>
          </div>
          <div class="custom-template-info">
            <span class="template-name">${esc(tpl.name)}</span>
            <span class="custom-template-meta">${new Date(tpl.createdAt || Date.now()).toLocaleDateString()}</span>
          </div>
          <button type="button" class="btn-delete-custom-tpl" data-del-id="${tpl.id}" data-name="${esc(tpl.name)}" title="Delete template from device" aria-label="Delete template">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg>
          </button>
        `;

        card.addEventListener('click', e => {
          if (e.target.closest('.btn-delete-custom-tpl')) return;
          loadCustomTemplateObject(tpl);
        });

        const delBtn = card.querySelector('.btn-delete-custom-tpl');
        if (delBtn) {
          delBtn.addEventListener('click', e => {
            e.preventDefault();
            e.stopPropagation();
            removeCustomTemplate(tpl.id, tpl.name);
          });
        }

        customTemplatesGrid.appendChild(card);
      });
    } catch (err) {
      console.warn('Failed to load custom templates from IndexedDB', err);
    }
  }

  // Delegated grid listener as safety net
  if (customTemplatesGrid) {
    customTemplatesGrid.addEventListener('click', e => {
      const delBtn = e.target.closest('.btn-delete-custom-tpl');
      if (delBtn) {
        e.preventDefault();
        e.stopPropagation();
        const id = delBtn.dataset.delId;
        const name = delBtn.dataset.name;
        if (id || name) removeCustomTemplate(id, name);
      }
    });
  }

  function loadCustomTemplateObject(tpl) {
    document.querySelectorAll('.template-card, .custom-template-card').forEach(c => c.classList.remove('active'));
    const matchedCard = customTemplatesGrid?.querySelector(`[data-id="${tpl.id}"]`);
    if (matchedCard) matchedCard.classList.add('active');

    const img = new Image();
    img.onload = () => {
      state.image = img;
      state.naturalW = tpl.naturalW || img.naturalWidth;
      state.naturalH = tpl.naturalH || img.naturalHeight;
      state.templateType = `custom-${tpl.id}`;
      canvas.width = state.naturalW;
      canvas.height = state.naturalH;
      autoFitZoom();
      render();
      toast(`Loaded "${tpl.name}" (${state.naturalW}×${state.naturalH}px)`, 'success');
    };
    img.src = tpl.dataUrl;
  }

  // Template switchers
  const btnSelectTplLuxury = document.getElementById('btnSelectTplLuxury');
  if (btnSelectTplLuxury) {
    btnSelectTplLuxury.addEventListener('click', () => {
      document.querySelectorAll('.template-card, .custom-template-card').forEach(c => c.classList.remove('active'));
      btnSelectTplLuxury.classList.add('active');
      generateTemplateCanvas('vg-luxury', () => toast('VG DEMO Certificate loaded', 'success'));
    });
  }

  // Upload and persist custom template to on-device IndexedDB
  function handleUploadedTemplateFile(file) {
    if (!file || !file.type.startsWith('image/')) {
      toast('Please upload an image file (PNG, JPG, WebP)', 'warning');
      return;
    }
    const reader = new FileReader();
    reader.onload = e => {
      const fullDataUrl = e.target.result;
      const img = new Image();
      img.onload = async () => {
        const naturalW = img.naturalWidth;
        const naturalH = img.naturalHeight;

        // Create lightweight thumbnail
        const thumbCanvas = document.createElement('canvas');
        thumbCanvas.width = 120;
        thumbCanvas.height = Math.max(20, Math.round((naturalH / naturalW) * 120));
        const thumbCtx = thumbCanvas.getContext('2d');
        thumbCtx.drawImage(img, 0, 0, thumbCanvas.width, thumbCanvas.height);
        const thumbDataUrl = thumbCanvas.toDataURL('image/jpeg', 0.8);

        const templateObj = {
          id: 'tpl_' + Date.now(),
          name: file.name.replace(/\.[^/.]+$/, ''),
          dataUrl: fullDataUrl,
          thumbDataUrl,
          naturalW,
          naturalH,
          createdAt: Date.now(),
        };

        try {
          await saveCustomTemplateToDB(templateObj);
          await refreshCustomTemplatesList();
          loadCustomTemplateObject(templateObj);
          if (tplUploadLabel) tplUploadLabel.textContent = file.name;
          toast(`Template "${templateObj.name}" saved securely on device!`, 'success');
        } catch (err) {
          console.error('Error saving template to IndexedDB', err);
          state.image = img;
          state.naturalW = naturalW;
          state.naturalH = naturalH;
          canvas.width = state.naturalW;
          canvas.height = state.naturalH;
          autoFitZoom();
          render();
          toast(`Custom template loaded (${naturalW}×${naturalH}px)`, 'success');
        }
      };
      img.src = fullDataUrl;
    };
    reader.readAsDataURL(file);
  }

  if (tplUploadDropzone) {
    tplUploadDropzone.addEventListener('dragover', e => {
      e.preventDefault();
      tplUploadDropzone.classList.add('drag-over');
    });
    tplUploadDropzone.addEventListener('dragleave', () => {
      tplUploadDropzone.classList.remove('drag-over');
    });
    tplUploadDropzone.addEventListener('drop', e => {
      e.preventDefault();
      tplUploadDropzone.classList.remove('drag-over');
      if (e.dataTransfer.files[0]) handleUploadedTemplateFile(e.dataTransfer.files[0]);
    });
  }

  certFileInput.addEventListener('change', () => {
    if (certFileInput.files[0]) {
      handleUploadedTemplateFile(certFileInput.files[0]);
      certFileInput.value = '';
    }
  });

  // ── Load Entire Demo Project ───────────────────────────────────────
  function loadVGDemoProject() {
    if (btnSelectTplLuxury) {
      document.querySelectorAll('.template-card, .custom-template-card').forEach(c => c.classList.remove('active'));
      btnSelectTplLuxury.classList.add('active');
    }
    generateTemplateCanvas('vg-luxury', () => {
      loadSampleRecipientData(true);
      state.fields = [
        {
          key: 'name',
          x: 0.50,
          y: 0.42,
          font: "'Great Vibes', cursive",
          size: getAutoFontSizeForField('name'),
          color: '#000000',
          bold: false,
          italic: false,
          align: 'center',
          textTransform: 'none',
          shadowEnabled: false,
          shadowColor: '#000000',
          shadowBlur: 6,
          shadowOffsetX: 2,
          shadowOffsetY: 3,
          shadowOpacity: 60,
        },
        {
          key: 'course',
          x: 0.50,
          y: 0.51,
          font: "'Cinzel', serif",
          size: getAutoFontSizeForField('course'),
          color: '#000000',
          bold: true,
          italic: false,
          align: 'center',
          textTransform: 'none',
          shadowEnabled: false,
          shadowColor: '#000000',
          shadowBlur: 6,
          shadowOffsetX: 2,
          shadowOffsetY: 3,
          shadowOpacity: 60,
        },
        {
          key: 'date',
          x: 0.25,
          y: 0.79,
          font: "'Lato', sans-serif",
          size: getAutoFontSizeForField('date'),
          color: '#000000',
          bold: false,
          italic: false,
          align: 'center',
          textTransform: 'none',
          shadowEnabled: false,
          shadowColor: '#000000',
          shadowBlur: 6,
          shadowOffsetX: 2,
          shadowOffsetY: 3,
          shadowOpacity: 60,
        },
        {
          key: 'cert_id',
          x: 0.50,
          y: 0.63,
          font: "'Lato', sans-serif",
          size: getAutoFontSizeForField('cert_id'),
          color: '#52525b',
          bold: false,
          italic: false,
          align: 'center',
          textTransform: 'uppercase',
          shadowEnabled: false,
          shadowColor: '#000000',
          shadowBlur: 6,
          shadowOffsetX: 2,
          shadowOffsetY: 3,
          shadowOpacity: 60,
        }
      ];
      selectField(0);
      updateBulkBtn();
      render();
      toast('Demo project loaded with 4 recipients!', 'success');
    });
  }

  btnHeaderDemo.addEventListener('click', loadVGDemoProject);

  // ── Certificate Blob Generation ────────────────────────────────────
  function generateCertBlob(rowData, rowIdx = -1) {
    return new Promise(resolve => {
      const off = document.createElement('canvas');
      off.width = state.naturalW;
      off.height = state.naturalH;
      const oc = off.getContext('2d');
      oc.fillStyle = '#ffffff';
      oc.fillRect(0, 0, state.naturalW, state.naturalH);
      oc.drawImage(state.image, 0, 0, state.naturalW, state.naturalH);
      for (const baseField of state.fields) {
        const field = getEffectiveField(baseField, rowIdx);
        let value = '';
        if (rowData && rowData[baseField.key] !== undefined && rowData[baseField.key] !== '') {
          value = rowData[baseField.key];
        } else if (field.customValue !== undefined && field.customValue !== null) {
          value = field.customValue;
        } else if (field.isCustomText) {
          value = field.key;
        }
        if (!value) continue;
        drawFieldOnCtx(oc, field, value, field.x * state.naturalW, field.y * state.naturalH);
      }
      off.toBlob(resolve, 'image/png');
    });
  }

  function blobToBase64(blob) {
    return new Promise(resolve => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result.split(',')[1]);
      reader.readAsDataURL(blob);
    });
  }

  function triggerDownload(blob, filename) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 3000);
  }

  function safeName(n) {
    return String(n).replace(/[^\w\s-]/g, '').replace(/\s+/g, '_').slice(0, 60) || 'certificate';
  }

  // ── Export Menu & Handlers ─────────────────────────────────────────
  btnExportMenu.addEventListener('click', e => {
    e.stopPropagation();
    exportDropdownWrap.classList.toggle('open');
  });
  document.addEventListener('click', e => {
    if (!exportDropdownWrap.contains(e.target)) exportDropdownWrap.classList.remove('open');
  });

  btnDownloadPng.addEventListener('click', async () => {
    exportDropdownWrap.classList.remove('open');
    if (!state.image) { toast('Load a certificate template first', 'warning'); return; }
    const rowIdx = state.previewRowIdx;
    const rowData = state.excelData[rowIdx] || {};
    const blob = await generateCertBlob(rowData, rowIdx);
    const label = rowData.name ? safeName(rowData.name) : 'certificate';
    triggerDownload(blob, `${label}_VG_Certificate.png`);
    toast('PNG downloaded!', 'success');
  });

  btnDownloadPdf.addEventListener('click', async () => {
    exportDropdownWrap.classList.remove('open');
    if (!state.image) { toast('Load a certificate template first', 'warning'); return; }
    if (typeof window.jspdf === 'undefined') { toast('jsPDF library loading...', 'warning'); return; }
    const rowIdx = state.previewRowIdx;
    const rowData = state.excelData[rowIdx] || {};
    const blob = await generateCertBlob(rowData, rowIdx);
    const base64 = await blobToBase64(blob);
    const label = rowData.name ? safeName(rowData.name) : 'certificate';

    const { jsPDF } = window.jspdf;
    const orientation = state.naturalW >= state.naturalH ? 'landscape' : 'portrait';
    const pdf = new jsPDF({
      orientation,
      unit: 'px',
      format: [state.naturalW, state.naturalH]
    });
    pdf.addImage(`data:image/png;base64,${base64}`, 'PNG', 0, 0, state.naturalW, state.naturalH);
    pdf.save(`${label}_VG_Certificate.pdf`);
    toast('PDF downloaded!', 'success');
  });

  btnDownloadZip.addEventListener('click', async () => {
    exportDropdownWrap.classList.remove('open');
    const rows = state.excelData;
    if (!rows.length) { toast('Upload recipient data or load sample data first', 'warning'); return; }
    if (!state.fields.length) { toast('Place at least one field on the canvas first', 'warning'); return; }
    if (typeof JSZip === 'undefined') { toast('JSZip not loaded', 'warning'); return; }

    progressWrap.classList.add('visible');
    const zip = new JSZip();

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const label = row.name || `recipient_${i + 1}`;
      progressFill.style.width = `${(i / rows.length) * 100}%`;
      progressLbl.textContent = `Rendering ${i + 1}/${rows.length}: ${label}`;
      const blob = await generateCertBlob(row, i);
      zip.file(`${safeName(label)}_${i + 1}.png`, blob);
      await new Promise(r => setTimeout(r, 0));
    }

    progressFill.style.width = '100%';
    progressLbl.textContent = 'Compressing into ZIP…';
    await new Promise(r => setTimeout(r, 50));
    const zipBlob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
    triggerDownload(zipBlob, 'VG_Certificates_Batch.zip');
    progressWrap.classList.remove('visible');
    progressFill.style.width = '0%';
    toast(`${rows.length} certificates exported to ZIP!`, 'success');
  });

  btnSendAllEmails.addEventListener('click', () => {
    exportDropdownWrap.classList.remove('open');
    sendAllEmails();
  });

  // ── SMTP Configuration ─────────────────────────────────────────────
  function loadSmtpFromStorage() {
    try {
      const saved = JSON.parse(localStorage.getItem('certgen_smtp') || '{}');
      if (saved.host) {
        smtpHost.value = saved.host;
        smtpHostVal.textContent = `${saved.host}:${saved.port || 587}`;
      }
      if (saved.port) smtpPort.value = saved.port;
      if (saved.user) {
        smtpUser.value = saved.user;
        smtpUserVal.textContent = saved.user;
      }
      if (saved.fromName) smtpFromName.value = saved.fromName;
      updateSmtpBadge(!!saved.host && !!saved.user);
    } catch (_) { }
  }

  function saveSmtpToStorage() {
    const cfg = {
      host: smtpHost.value.trim(),
      port: smtpPort.value,
      user: smtpUser.value.trim(),
      fromName: smtpFromName.value.trim(),
    };
    localStorage.setItem('certgen_smtp', JSON.stringify(cfg));
    smtpHostVal.textContent = `${cfg.host}:${cfg.port || 587}`;
    smtpUserVal.textContent = cfg.user || 'Not configured';
    updateSmtpBadge(!!cfg.host && !!cfg.user);
    closeModal(smtpModal);
    toast('SMTP settings saved', 'success');
  }

  function updateSmtpBadge(configured) {
    smtpStatusBadge.textContent = configured ? 'Configured' : 'Not set';
    smtpStatusBadge.className = 'smtp-pill-badge ' + (configured ? 'configured' : '');
  }

  btnSaveSmtp.addEventListener('click', saveSmtpToStorage);

  btnTestSmtp.addEventListener('click', async () => {
    const smtp = getSmtpConfig();
    if (!smtp.host) { toast('Enter SMTP host', 'warning'); return; }
    if (!smtp.user) { toast('Enter SMTP username', 'warning'); return; }
    if (!smtp.pass) { toast('Enter SMTP password', 'warning'); return; }

    btnTestSmtp.disabled = true;
    btnTestSmtp.textContent = 'Testing connection…';
    smtpTestResult.style.display = 'none';

    try {
      const res = await fetch(`${API_BASE}/api/test-smtp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ smtp }),
      });
      const data = await res.json();
      smtpTestResult.style.display = 'flex';
      if (res.ok && data.ok) {
        smtpTestResult.className = 'smtp-test-result success';
        smtpTestResult.innerHTML = `<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="2 8 6 12 14 4"/></svg> SMTP Connection verified successfully!`;
        updateSmtpBadge(true);
      } else {
        smtpTestResult.className = 'smtp-test-result fail';
        smtpTestResult.innerHTML = `<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="14" y1="2" x2="2" y2="14"/><line x1="2" y1="2" x2="14" y2="14"/></svg> ${esc(data.error || 'Connection failed')}`;
      }
    } catch (err) {
      smtpTestResult.style.display = 'flex';
      smtpTestResult.className = 'smtp-test-result fail';
      smtpTestResult.innerHTML = `Cannot reach server (${esc(err.message)})`;
    } finally {
      btnTestSmtp.disabled = false;
      btnTestSmtp.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg> Test Connection`;
    }
  });

  function getSmtpConfig() {
    return {
      host: smtpHost.value.trim(),
      port: parseInt(smtpPort.value, 10) || 587,
      user: smtpUser.value.trim(),
      pass: smtpPass.value,
      fromName: smtpFromName.value.trim(),
    };
  }

  // ── SMTP Help Guide Controls ───────────────────────────────────────
  const btnToggleSmtpHelp = document.getElementById('btnToggleSmtpHelp');
  const btnCloseSmtpHelp = document.getElementById('btnCloseSmtpHelp');
  const smtpHelpPanel = document.getElementById('smtpHelpPanel');
  const btnAppPasswordHelp = document.getElementById('btnAppPasswordHelp');
  const smtpHelpTabs = document.querySelectorAll('.smtp-help-tab');

  function toggleSmtpHelp(forceOpen = null, guideTab = null) {
    if (!smtpHelpPanel) return;
    const shouldOpen = forceOpen !== null ? forceOpen : (smtpHelpPanel.style.display === 'none');
    smtpHelpPanel.style.display = shouldOpen ? 'flex' : 'none';
    if (btnToggleSmtpHelp) btnToggleSmtpHelp.classList.toggle('active', shouldOpen);
    if (shouldOpen && guideTab) {
      switchSmtpHelpTab(guideTab);
    }
  }

  function switchSmtpHelpTab(guide) {
    smtpHelpTabs.forEach(t => t.classList.toggle('active', t.dataset.guide === guide));
    const guideMap = {
      gmail: 'helpContentGmail',
      outlook: 'helpContentOutlook',
      yahoo: 'helpContentYahoo',
      custom: 'helpContentCustom',
    };
    Object.keys(guideMap).forEach(k => {
      const el = document.getElementById(guideMap[k]);
      if (el) el.style.display = (k === guide) ? 'flex' : 'none';
    });
  }

  if (btnToggleSmtpHelp) {
    btnToggleSmtpHelp.addEventListener('click', () => toggleSmtpHelp());
  }
  if (btnCloseSmtpHelp) {
    btnCloseSmtpHelp.addEventListener('click', () => toggleSmtpHelp(false));
  }
  if (btnAppPasswordHelp) {
    btnAppPasswordHelp.addEventListener('click', () => toggleSmtpHelp(true, 'gmail'));
  }

  smtpHelpTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      switchSmtpHelpTab(tab.dataset.guide);
    });
  });

  // Preset buttons
  document.querySelectorAll('.smtp-preset-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.smtp-preset-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const preset = btn.dataset.preset;
      if (preset === 'gmail') { smtpHost.value = 'smtp.gmail.com'; smtpPort.value = '587'; }
      else if (preset === 'outlook') { smtpHost.value = 'smtp.office365.com'; smtpPort.value = '587'; }
      else if (preset === 'yahoo') { smtpHost.value = 'smtp.mail.yahoo.com'; smtpPort.value = '587'; }
      else { smtpHost.value = ''; smtpPort.value = '587'; }

      if (smtpHelpPanel && smtpHelpPanel.style.display !== 'none') {
        switchSmtpHelpTab(preset);
      }
    });
  });

  // ── Modals Trigger ─────────────────────────────────────────────────
  function openModal(m) { m.classList.add('open'); m.removeAttribute('aria-hidden'); }
  function closeModal(m) { m.classList.remove('open'); m.setAttribute('aria-hidden', 'true'); }

  [smtpModal, emailModal, shortcutsModal].forEach(m => {
    m.addEventListener('click', e => { if (e.target === m) closeModal(m); });
  });

  btnOpenSmtp.addEventListener('click', () => openModal(smtpModal));
  btnConfigSmtpSidebar.addEventListener('click', () => openModal(smtpModal));
  smtpModalClose.addEventListener('click', () => closeModal(smtpModal));

  btnOpenComposeSidebar.addEventListener('click', () => openModal(emailModal));
  emailModalClose.addEventListener('click', () => { closeModal(emailModal); updateComposeSummary(); });
  emailModalDone.addEventListener('click', () => { closeModal(emailModal); updateComposeSummary(); });

  btnOpenShortcuts.addEventListener('click', () => openModal(shortcutsModal));
  shortcutsModalClose.addEventListener('click', () => closeModal(shortcutsModal));
  shortcutsModalDone.addEventListener('click', () => closeModal(shortcutsModal));

  function updateComposeSummary() {
    composeSummary.textContent = emailSubject.value.trim() || 'No subject set';
  }

  // Rich text toolbar
  document.querySelectorAll('.rich-btn[data-cmd]').forEach(btn => {
    btn.addEventListener('mousedown', e => {
      e.preventDefault();
      document.execCommand(btn.dataset.cmd, false, null);
      emailBody.focus();
    });
  });

  function buildVarChips() {
    varChipsEl.innerHTML = '';
    const cols = state.excelColumns;
    if (!cols.length) {
      varChipsEl.innerHTML = '<span class="var-chip-hint">Upload an Excel file or load sample data to see column variables</span>';
      return;
    }
    ['firstName', ...cols].forEach(col => {
      const chip = document.createElement('span');
      chip.className = 'var-chip';
      chip.textContent = `{{${col}}}`;
      chip.addEventListener('click', () => {
        emailBody.focus();
        document.execCommand('insertText', false, `{{${col}}}`);
      });
      varChipsEl.appendChild(chip);
    });
  }

  function applyVariables(template, rowData) {
    const name = rowData.name || '';
    const enriched = { ...rowData, firstName: name.trim().split(/\s+/)[0] || '', name };
    let result = template;
    for (const [key, val] of Object.entries(enriched)) {
      result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), String(val || ''));
    }
    return result;
  }

  // ── Send All Emails ────────────────────────────────────────────────
  btnSendEmails.addEventListener('click', sendAllEmails);

  async function sendAllEmails() {
    const data = state.excelData;
    if (!data.length) { toast('No recipient data loaded', 'warning'); return; }
    const smtp = getSmtpConfig();
    if (!smtp.host || !smtp.user || !smtp.pass) {
      toast('Please enter SMTP username and password first', 'warning');
      openModal(smtpModal);
      return;
    }
    const recipients = data.filter(r => r.email);
    if (!recipients.length) { toast('No recipients have email addresses in data', 'warning'); return; }

    const confirmed = confirm(`Send ${recipients.length} certificate emails via SMTP?\n\nFrom: ${smtp.user}`);
    if (!confirmed) return;

    btnSendEmails.disabled = true;
    emailProgressWrap.classList.add('visible');
    emailResultLog.style.display = 'block';
    emailResultLog.innerHTML = '';

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < recipients.length; i++) {
      const rowData = recipients[i];
      const dataIdx = state.excelData.indexOf(rowData);
      const { name, email } = rowData;
      emailProgressFill.style.width = `${(i / recipients.length) * 100}%`;
      emailProgressLbl.textContent = `Sending ${i + 1}/${recipients.length}: ${name}`;

      try {
        const blob = await generateCertBlob(rowData, dataIdx);
        const base64 = await blobToBase64(blob);
        const subject = applyVariables(emailSubject.value.trim() || 'Your Certificate', rowData);
        const body = applyVariables(emailBody.innerHTML || 'Hi {{firstName}},<br><br>Please find your certificate attached.', rowData);
        const filename = `${safeName(name)}_Certificate.png`;

        const res = await fetch(`${API_BASE}/api/send-email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            smtp,
            to: email,
            subject,
            html: `<!DOCTYPE html><html><body>${body}</body></html>`,
            attachmentBase64: base64,
            filename,
          }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: res.statusText }));
          throw new Error(err.error || res.statusText);
        }
        successCount++;
        appendLog(name, email, true);
      } catch (err) {
        failCount++;
        appendLog(name, email, false, err.message);
      }
      await new Promise(r => setTimeout(r, 200));
    }

    emailProgressFill.style.width = '100%';
    emailProgressLbl.textContent = `Complete — ${successCount} sent, ${failCount} failed`;
    btnSendEmails.disabled = false;
    toast(`${successCount} certificates emailed!`, successCount > 0 ? 'success' : 'warning');
  }

  function appendLog(name, email, ok, errMsg = '') {
    const div = document.createElement('div');
    div.className = 'log-row ' + (ok ? 'ok' : 'fail');
    div.innerHTML = ok
      ? `<svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="2 8 6 12 14 4"/></svg><span>${esc(name)}</span> <small>${esc(email)}</small>`
      : `<svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="14" y1="2" x2="2" y2="14"/><line x1="2" y1="2" x2="14" y2="14"/></svg><span>${esc(name)}</span> <small class="err">${esc(errMsg)}</small>`;
    emailResultLog.appendChild(div);
    emailResultLog.scrollTop = emailResultLog.scrollHeight;
  }

  // ── Typography Inputs Live Bindings ────────────────────────────────
  function onTypographyChange() {
    saveActiveFieldTypography();
    render();
  }

  fontSize.addEventListener('input', onTypographyChange);
  boldBtn.addEventListener('click', () => { boldBtn.classList.toggle('active'); onTypographyChange(); });
  italicBtn.addEventListener('click', () => { italicBtn.classList.toggle('active'); onTypographyChange(); });

  alignBtns.forEach(btn => btn.addEventListener('click', () => {
    alignBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    onTypographyChange();
  }));

  transformBtns.forEach(btn => btn.addEventListener('click', () => {
    transformBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    onTypographyChange();
  }));

  fontColor.addEventListener('input', () => { fontColorHex.value = fontColor.value; onTypographyChange(); });
  fontColorHex.addEventListener('input', () => {
    if (/^#[0-9a-fA-F]{6}$/.test(fontColorHex.value)) { fontColor.value = fontColorHex.value; onTypographyChange(); }
  });

  shadowEnabled.addEventListener('change', () => {
    shadowControls.classList.toggle('visible', shadowEnabled.checked);
    onTypographyChange();
  });
  shadowColor.addEventListener('input', () => { shadowColorHex.value = shadowColor.value; onTypographyChange(); });
  shadowColorHex.addEventListener('input', () => {
    if (/^#[0-9a-fA-F]{6}$/.test(shadowColorHex.value)) { shadowColor.value = shadowColorHex.value; onTypographyChange(); }
  });
  [shadowBlur, shadowOffsetX, shadowOffsetY].forEach(el => el.addEventListener('input', onTypographyChange));
  shadowOpacity.addEventListener('input', () => {
    shadowOpacityVal.textContent = shadowOpacity.value + '%';
    onTypographyChange();
  });

  // Empty state actions
  if (btnEmptyLoadBuiltin) {
    btnEmptyLoadBuiltin.addEventListener('click', () => {
      if (btnSelectTplLuxury) btnSelectTplLuxury.click();
    });
  }
  if (btnEmptyUpload) {
    btnEmptyUpload.addEventListener('click', () => {
      if (certFileInput) certFileInput.click();
    });
  }

  // ── Initialization ─────────────────────────────────────────────────
  fontTriggerLabel.style.fontFamily = state.committedFont;
  buildVarChips();
  loadSmtpFromStorage();
  updateRowIndicator();
  refreshCustomTemplatesList();
  render();

})();
