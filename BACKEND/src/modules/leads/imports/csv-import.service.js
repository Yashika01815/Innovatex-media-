/**
 * Low-level CSV parsing for lead imports. Dependency-free.
 * Handles quoted fields, escaped quotes, and CRLF/LF line endings.
 */

// Maps common CSV header labels → lead fields.
const HEADER_MAP = {
  name: 'name',
  email: 'email',
  phone: 'phone',
  'whatsapp': 'whatsapp_number',
  'whatsapp number': 'whatsapp_number',
  company: 'company',
  source: 'source',
  medium: 'medium',
  campaign: 'campaign',
  status: 'status',
  temperature: 'lead_temperature',
  segment: 'segment',
  value: 'value',
};

/** Parse raw CSV text into an array of cell-arrays. */
export function parseCsv(text = '') {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];

    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      row.push(field);
      field = '';
    } else if (ch === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else if (ch === '\r') {
      // ignore; handled by \n
    } else {
      field += ch;
    }
  }
  // last field / row
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => c.trim() !== ''));
}

/** Convert CSV text → array of lead objects keyed by mapped header. */
export function csvToLeadRows(text = '') {
  const rows = parseCsv(text);
  if (rows.length === 0) return [];

  const headers = rows[0].map((h) => h.trim().toLowerCase());
  const mapped = headers.map((h) => HEADER_MAP[h] || null);

  return rows.slice(1).map((cells) => {
    const obj = {};
    mapped.forEach((field, idx) => {
      if (!field) return;
      const val = (cells[idx] ?? '').trim();
      if (val === '') return;
      obj[field] = field === 'value' ? Number(val) || 0 : val;
    });
    return obj;
  });
}
