/**
 * Normalization + matching rules for duplicate detection.
 */

export function normalizeEmail(email) {
  if (!email) return null;
  return String(email).trim().toLowerCase();
}

/** Reduce a phone to comparable digits (keeps last 10 for loose matching). */
export function normalizePhone(phone) {
  if (!phone) return null;
  const digits = String(phone).replace(/\D/g, '');
  return digits || null;
}

/**
 * Build the OR-query used to find an existing lead by email or phone.
 * Returns null if neither identifier is present.
 */
export function buildDuplicateQuery({ email, phone } = {}) {
  const or = [];
  const e = normalizeEmail(email);
  const p = normalizePhone(phone);

  if (e) or.push({ email: e });
  if (p) {
    // Match by stored phone exactly OR by trailing digits.
    or.push({ phone });
    if (p.length >= 10) {
      or.push({ phone: new RegExp(`${p.slice(-10)}$`) });
    }
  }

  if (or.length === 0) return null;
  return { archived: false, $or: or };
}
