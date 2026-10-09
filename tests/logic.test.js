const test = require('node:test');
const assert = require('node:assert/strict');

// Logic helpers matching app.js algorithm
function interpolateTemplate(template, data) {
  if (!template) return '';
  return template.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (match, key) => {
    if (key === 'firstName') {
      const fullName = (data.name || data.Name || data.fullName || '').trim();
      return fullName.split(/\s+/)[0] || '';
    }
    return data[key] !== undefined && data[key] !== null ? String(data[key]) : match;
  });
}

function detectColumnRoles(headers) {
  const mapping = { name: null, email: null, course: null, date: null, id: null };
  const lower = headers.map(h => ({ raw: h, clean: String(h).toLowerCase().trim() }));

  for (const item of lower) {
    if (!mapping.name && /^(name|full[\s_-]?name|student[\s_-]?name|participant|recipient)$/i.test(item.clean)) {
      mapping.name = item.raw;
    } else if (!mapping.email && /^(email|e-mail|mail|email[\s_-]?address)$/i.test(item.clean)) {
      mapping.email = item.raw;
    } else if (!mapping.course && /^(course|event|program|workshop|webinar|title|training)$/i.test(item.clean)) {
      mapping.course = item.raw;
    } else if (!mapping.date && /^(date|issued[\s_-]?date|completion[\s_-]?date)$/i.test(item.clean)) {
      mapping.date = item.raw;
    } else if (!mapping.id && /^(id|cert[\s_-]?id|certificate[\s_-]?id|roll[\s_-]?no|registration[\s_-]?no)$/i.test(item.clean)) {
      mapping.id = item.raw;
    }
  }
  return mapping;
}

test('Interpolates {{firstName}} and explicit variables correctly', () => {
  const data = {
    name: 'Alexandra Montgomery',
    course: 'Full Stack Web Architecture',
    date: 'October 24, 2026',
    id: 'VG-99214'
  };

  const text = 'Dear {{firstName}}, you completed {{course}} on {{date}}. Cert ID: {{id}}';
  const result = interpolateTemplate(text, data);

  assert.equal(result, 'Dear Alexandra, you completed Full Stack Web Architecture on October 24, 2026. Cert ID: VG-99214');
});

test('Preserves unknown template tags safely', () => {
  const data = { name: 'John Doe' };
  const text = 'Hello {{name}}, your code is {{unknownCode}}.';
  const result = interpolateTemplate(text, data);

  assert.equal(result, 'Hello John Doe, your code is {{unknownCode}}.');
});

test('Detects standard spreadsheet column roles dynamically', () => {
  const headers = ['Student Name', 'Email Address', 'Workshop', 'Issued Date', 'Certificate ID'];
  const mapping = detectColumnRoles(headers);

  assert.equal(mapping.name, 'Student Name');
  assert.equal(mapping.email, 'Email Address');
  assert.equal(mapping.course, 'Workshop');
  assert.equal(mapping.date, 'Issued Date');
  assert.equal(mapping.id, 'Certificate ID');
});

test('Handles single-word first name fallback safely', () => {
  const data = { name: 'Madonna' };
  const text = 'Welcome {{firstName}}!';
  const result = interpolateTemplate(text, data);

  assert.equal(result, 'Welcome Madonna!');
});
