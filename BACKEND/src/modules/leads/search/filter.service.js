import {
  LEAD_STATUS_VALUES,
  LEAD_TEMPERATURE_VALUES,
} from '../lead/lead.constants.js';
import { AppError } from '../../../shared/helpers/lead.helpers.js';

/**
 * Normalize and validate raw query params into a clean filter object.
 * Rejects unknown status/temperature values (they could only come from a
 * mistaken client, so failing loudly is friendlier than silently ignoring).
 */
export function normalizeFilters(query = {}) {
  const filters = {};

  if (query.search) filters.search = String(query.search).trim();

  if (query.status) {
    if (!LEAD_STATUS_VALUES.includes(query.status)) {
      throw AppError.badRequest(`Invalid status filter: ${query.status}`);
    }
    filters.status = query.status;
  }

  if (query.temperature) {
    if (!LEAD_TEMPERATURE_VALUES.includes(query.temperature)) {
      throw AppError.badRequest(
        `Invalid temperature filter: ${query.temperature}`,
      );
    }
    filters.temperature = query.temperature;
  }

  if (query.source) filters.source = String(query.source).trim();
  if (query.segment) filters.segment = String(query.segment).trim();
  if (query.assigned_user_id) {
    filters.assigned_user_id = String(query.assigned_user_id).trim();
  }

  filters.includeArchived = query.includeArchived === 'true';

  return filters;
}
