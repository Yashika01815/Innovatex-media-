import { csvToLeadRows } from './csv-import.service.js';
import { leadService } from '../lead/lead.service.js';
import { duplicateService } from '../duplicate-detection/duplicate.service.js';
import { AppError } from '../../../shared/helpers/lead.helpers.js';

/**
 * Bulk import leads from CSV text (or pre-parsed rows).
 * Skips duplicates, validates the minimal required fields, and reuses the
 * Lead Service so each created lead is scored + logged + emits events.
 */
export const importService = {
  async importFromCsv(ctx, csvText, { skipDuplicates = true } = {}) {
    if (!csvText || typeof csvText !== 'string') {
      throw AppError.badRequest('csv text is required');
    }
    const rows = csvToLeadRows(csvText);
    return this.importRows(ctx, rows, { skipDuplicates });
  },

  async importRows(ctx, rows = [], { skipDuplicates = true } = {}) {
    const summary = {
      total: rows.length,
      created: 0,
      skipped: 0,
      failed: 0,
      errors: [],
    };

    for (let i = 0; i < rows.length; i += 1) {
      const row = rows[i];
      const line = i + 2; // +1 header, +1 to 1-index

      // Minimal requirement: name + phone (matches create validation).
      if (!row.name || !row.phone) {
        summary.failed += 1;
        summary.errors.push({ line, error: 'Missing name or phone' });
        continue;
      }

      try {
        if (skipDuplicates) {
          const dup = await duplicateService.findDuplicate(ctx.tenantId, {
            email: row.email,
            phone: row.phone,
          });
          if (dup) {
            summary.skipped += 1;
            continue;
          }
        }
        await leadService.createLead(ctx, row, { skipDuplicateCheck: true });
        summary.created += 1;
      } catch (err) {
        summary.failed += 1;
        summary.errors.push({ line, error: err.message });
      }
    }

    return summary;
  },
};
