/**
 * =============================================================================
 * InnovateX Revenue OS — Integration Service
 * =============================================================================
 *
 * FILE: src/modules/integrations/integration.service.js
 *
 * Contains ALL business logic:
 *   - Auto-seeding the 22-item catalog for a tenant on first list/read
 *     (mirrors the WhatsAppSettings auto-provision pattern).
 *   - toggleIntegration — connect/disconnect. Per DEVELOPER_HANDOFF.md
 *     section 17: "toggle flips status + sets last_sync". Connecting an
 *     integration with no real config values lands it in 'simulation'
 *     status rather than 'connected' (see STATUS TRANSITION note below) -
 *     this is this implementation's interpretation of the 3-state badge
 *     system (connected/simulation/disconnected), since the spec names the
 *     three states but does not define exactly what separates "connected"
 *     from "simulation".
 *   - syncIntegration — updates last_sync only; refuses on a disconnected
 *     integration.
 *   - updateIntegrationConfig — merges config, independent of status.
 *   - getCategoryCounts — for the "category tabs" UI.
 *
 * AppError usage matches automation.service.js / template.service.js
 * exactly: static factories from lead.helpers.js.
 *
 * STATUS TRANSITION
 * ──────────────────
 *   disconnected --toggle--> connected   (if config has at least one real value)
 *   disconnected --toggle--> simulation  (if config is still empty/default)
 *   connected    --toggle--> disconnected
 *   simulation   --toggle--> disconnected
 */

import * as integrationRepo from './integration.repository.js';
import { AppError, paginationMeta, normalizePaging } from '../../shared/helpers/lead.helpers.js';
import { INTEGRATION_STATUS } from './integration.constants.js';

// =============================================================================
// PRIVATE HELPERS
// =============================================================================

/** True if the config object has at least one non-empty value. */
const hasRealConfig = (config) => {
  if (!config || typeof config !== 'object') return false;
  return Object.values(config).some((v) => v !== undefined && v !== null && v !== '');
};

// =============================================================================
// READ (auto-seeds the catalog first)
// =============================================================================

export const listIntegrations = async (tenantId, filter, options) => {
  await integrationRepo.ensureCatalogSeeded(tenantId);

  const { page, limit, skip } = normalizePaging(options || {});
  const [integrations, total] = await Promise.all([
    integrationRepo.list(tenantId, filter, { skip, limit }),
    integrationRepo.count(tenantId, filter),
  ]);

  return { integrations, pagination: paginationMeta({ page, limit, total }) };
};

export const getIntegration = async (tenantId, id) => {
  await integrationRepo.ensureCatalogSeeded(tenantId);
  const integration = await integrationRepo.findById(tenantId, id);
  if (!integration) throw AppError.notFound('Integration not found');
  return integration;
};

export const getCategoryCounts = async (tenantId, filter) => {
  await integrationRepo.ensureCatalogSeeded(tenantId);
  const rows = await integrationRepo.countByCategory(tenantId, filter);

  const byCategory = {};
  let total = 0;
  let totalConnected = 0;
  for (const row of rows) {
    byCategory[row.category] = { count: row.count, connected: row.connected };
    total += row.count;
    totalConnected += row.connected;
  }
  return { total, totalConnected, byCategory };
};

export const getErrorLogs = async (tenantId, id) => {
  const integration = await integrationRepo.findById(tenantId, id);
  if (!integration) throw AppError.notFound('Integration not found');
  return { error_logs: integration.error_logs };
};

// =============================================================================
// TOGGLE — connect/disconnect
// =============================================================================

export const toggleIntegration = async (tenantId, userId, id) => {
  const existing = await integrationRepo.findById(tenantId, id);
  if (!existing) throw AppError.notFound('Integration not found');

  let newStatus;
  if (existing.status === INTEGRATION_STATUS.DISCONNECTED) {
    if (!existing.available) {
      throw AppError.badRequest('This integration is coming soon and cannot be connected yet');
    }
    newStatus = hasRealConfig(existing.config)
      ? INTEGRATION_STATUS.CONNECTED
      : INTEGRATION_STATUS.SIMULATION;
  } else {
    newStatus = INTEGRATION_STATUS.DISCONNECTED;
  }

  return integrationRepo.update(tenantId, id, {
    status: newStatus,
    last_sync: new Date(),
    updated_by: userId,
  });
};

// =============================================================================
// SYNC — "updates last-sync"
// =============================================================================

export const syncIntegration = async (tenantId, userId, id) => {
  const existing = await integrationRepo.findById(tenantId, id);
  if (!existing) throw AppError.notFound('Integration not found');

  if (existing.status === INTEGRATION_STATUS.DISCONNECTED) {
    throw AppError.badRequest('Cannot sync a disconnected integration');
  }

  return integrationRepo.update(tenantId, id, {
    last_sync: new Date(),
    updated_by: userId,
  });
};

// =============================================================================
// CONFIG — "settings modal"
// =============================================================================

export const updateIntegrationConfig = async (tenantId, userId, id, configPatch) => {
  const existing = await integrationRepo.findById(tenantId, id);
  if (!existing) throw AppError.notFound('Integration not found');

  const mergedConfig = Object.assign({}, existing.config, configPatch || {});

  return integrationRepo.update(tenantId, id, {
    config: mergedConfig,
    updated_by: userId,
  });
};
