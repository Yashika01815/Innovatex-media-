/**
 * Low-level CSV generation for leads. Dependency-free.
 */

export const EXPORT_COLUMNS = [
  { header: 'Name', field: 'name' },
  { header: 'Email', field: 'email' },
  { header: 'Phone', field: 'phone' },
  { header: 'Company', field: 'company' },
  { header: 'Status', field: 'status' },
  { header: 'Temperature', field: 'lead_temperature' },
  { header: 'Source', field: 'source' },
  { header: 'Score', field: 'qualification_score' },
  { header: 'Created At', field: 'created_at' },
];

function escapeCell(value) {
  if (value === null || value === undefined) return '';
  const str = value instanceof Date ? value.toISOString() : String(value);
  return /[",\r\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}

/** Build CSV text from an array of lead documents/objects. */
export function leadsToCsv(leads = [], columns = EXPORT_COLUMNS) {
  const header = columns.map((c) => c.header).join(',');
  const lines = leads.map((lead) => {
    const obj = typeof lead.toObject === 'function' ? lead.toObject() : lead;
    return columns.map((c) => escapeCell(obj[c.field])).join(',');
  });
  return [header, ...lines].join('\r\n');
}
