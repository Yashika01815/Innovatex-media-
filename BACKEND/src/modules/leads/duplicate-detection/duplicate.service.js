import { leadRepository } from '../lead/lead.repository.js';
import { buildDuplicateQuery } from './duplicate.rules.js';
import { AppError } from '../../../shared/helpers/lead.helpers.js';

/**
 * Duplicate detection by email / phone (Phase 3).
 */
export const duplicateService = {
  /** Returns the matching lead document, or null. */
  async findDuplicate(tenantId, { email, phone } = {}) {
    const query = buildDuplicateQuery({ email, phone });
    if (!query) return null;
    return leadRepository.findOne(tenantId, query);
  },

  /** Throws 409 { message: 'Duplicate lead detected' } when a match exists. */
  async assertNoDuplicate(tenantId, { email, phone } = {}) {
    const existing = await this.findDuplicate(tenantId, { email, phone });
    if (existing) {
      throw AppError.conflict('Duplicate lead detected', {
        existingLeadId: String(existing._id),
      });
    }
  },
};