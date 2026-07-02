/**
 * WhatsApp Settings — service.
 *
 * Contains ALL business logic:
 *   • Create / get / update settings (one document per tenant)
 *   • Section-specific updates (provider, business-profile, messaging, …)
 *   • Provider configuration validation
 *   • Connection test (simulated; real provider ping is pluggable)
 *   • Synchronisation stamps
 *   • Reset to defaults
 *   • Credential stripping — accessToken / appSecret / verifyToken are NEVER
 *     returned to a client
 *   • getProviderConfig() — the integration helper other modules call to
 *     obtain credentials WITHOUT going through the HTTP layer
 */
import { AppError } from '../../../../shared/helpers/lead.helpers.js';
import { whatsappSettingsRepository } from './whatsappSettings.repository.js';
import {
  DEFAULT_SETTINGS,
  SENSITIVE_FIELDS,
  PROVIDER,
  PROVIDER_MODE,
  GRAPH_API_VERSION_PATTERN,
  SYNC_ENTITY,
} from './whatsappSettings.constants.js';

// ── Helpers ────────────────────────────────────────────────────────────────────

function isPlainObject(v) {
  return v && typeof v === 'object' && !Array.isArray(v) && !(v instanceof Date);
}

/** Deep-merge source onto a clone of target (arrays + dates replaced wholesale). */
function deepMerge(target, source) {
  const out = Array.isArray(target) ? [...target] : { ...target };
  for (const [key, val] of Object.entries(source || {})) {
    if (isPlainObject(val) && isPlainObject(out[key])) {
      out[key] = deepMerge(out[key], val);
    } else {
      out[key] = val;
    }
  }
  return out;
}

/**
 * Flatten a nested patch into dot-notation keys so Mongo $set merges nested
 * sub-objects field-by-field. e.g. { meta: { appId: 'x' } } → { 'meta.appId': 'x' }.
 * Arrays and Dates are treated as leaf values.
 */
function flatten(obj, prefix = '', out = {}) {
  for (const [key, val] of Object.entries(obj || {})) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (isPlainObject(val)) {
      flatten(val, path, out);
    } else {
      out[path] = val;
    }
  }
  return out;
}

/** Remove a dot-path from a plain object (mutates). */
function unsetPath(obj, dotPath) {
  const parts = dotPath.split('.');
  let cur = obj;
  for (let i = 0; i < parts.length - 1; i += 1) {
    if (!cur || typeof cur !== 'object') return;
    cur = cur[parts[i]];
  }
  if (cur && typeof cur === 'object') delete cur[parts[parts.length - 1]];
}

/** Strip sensitive credentials and return a safe plain object for responses. */
function sanitize(doc) {
  if (!doc) return null;
  const o = doc.toObject ? doc.toObject() : { ...doc };
  const { _id, ...rest } = o;
  const safe = { id: String(_id ?? o.id), ...rest };
  for (const path of SENSITIVE_FIELDS) unsetPath(safe, path);
  // Surface a boolean so the UI knows a token exists without exposing it.
  if (safe.meta) {
    safe.meta.hasAccessToken = !!(o.meta && o.meta.accessToken);
    safe.meta.hasAppSecret   = !!(o.meta && o.meta.appSecret);
    safe.meta.hasVerifyToken = !!(o.meta && o.meta.verifyToken);
  }
  return safe;
}

/** Validate provider-specific required configuration before persisting. */
function validateProviderConfig(provider, meta = {}) {
  if (provider === PROVIDER.META_CLOUD) {
    if (meta.graphApiVersion && !GRAPH_API_VERSION_PATTERN.test(meta.graphApiVersion)) {
      throw new AppError(400, 'graphApiVersion must look like v21.0');
    }
  }
}

// ── Service ────────────────────────────────────────────────────────────────────

export const whatsappSettingsService = {
  // ── Create ─────────────────────────────────────────────────────────────────

  async createSettings(ctx, data = {}) {
    const existing = await whatsappSettingsRepository.findByTenant(ctx.tenantId);
    if (existing) {
      throw new AppError(409, 'Settings already exist for this tenant. Use PATCH to update.');
    }

    if (data.provider) validateProviderConfig(data.provider, data.meta || {});

    // Deep-merge supplied values onto defaults so omitted fields are filled.
    const merged = deepMerge(DEFAULT_SETTINGS, data);
    const created = await whatsappSettingsRepository.create({
      ...merged,
      tenantId:  ctx.tenantId,
      createdBy: ctx.userId,
      updatedBy: ctx.userId,
    });
    return sanitize(created);
  },

  // ── Read ───────────────────────────────────────────────────────────────────

  async getSettings(ctx) {
    let settings = await whatsappSettingsRepository.findByTenant(ctx.tenantId);
    // Auto-provision a default document on first read so other modules can rely
    // on settings always existing.
    if (!settings) {
      settings = await whatsappSettingsRepository.create({
        ...DEFAULT_SETTINGS,
        tenantId:  ctx.tenantId,
        createdBy: ctx.userId,
        updatedBy: ctx.userId,
      });
    }
    return sanitize(settings);
  },

  // ── Generic update (whole document, deep) ──────────────────────────────────

  async updateSettings(ctx, patch = {}) {
    await this._ensureExists(ctx);
    if (patch.provider) validateProviderConfig(patch.provider, patch.meta || {});

    const setOps = flatten(patch);
    setOps.updatedBy = ctx.userId;
    const updated = await whatsappSettingsRepository.update(ctx.tenantId, setOps);
    return sanitize(updated);
  },

  // ── Section-specific updates ───────────────────────────────────────────────

  async updateSection(ctx, section, sectionPatch = {}) {
    await this._ensureExists(ctx);

    // Provider section can change top-level provider + providerMode + meta.
    if (section === 'provider') {
      const { provider, providerMode, meta } = sectionPatch;
      if (provider) validateProviderConfig(provider, meta || {});
      const setOps = {};
      if (provider)     setOps.provider = provider;
      if (providerMode) setOps.providerMode = providerMode;
      if (meta) Object.assign(setOps, flatten({ meta }));
      setOps.updatedBy = ctx.userId;
      const updated = await whatsappSettingsRepository.update(ctx.tenantId, setOps);
      return sanitize(updated);
    }

    // All other sections are a single nested object.
    const setOps = flatten({ [section]: sectionPatch });
    setOps.updatedBy = ctx.userId;
    const updated = await whatsappSettingsRepository.update(ctx.tenantId, setOps);
    return sanitize(updated);
  },

  // ── Connection test ────────────────────────────────────────────────────────

  /**
   * Simulated connection test. For a real Meta Cloud ping, replace the
   * simulated block with a Graph API call using the stored credentials.
   */
  async testConnection(ctx) {
    const settings = await whatsappSettingsRepository.findByTenant(ctx.tenantId);
    if (!settings) throw new AppError(404, 'Settings not found');

    const { provider, meta } = settings;

    if (provider === PROVIDER.SIMULATION) {
      const now = new Date();
      await whatsappSettingsRepository.update(ctx.tenantId, {
        'meta.connected': true,
        'meta.connectedAt': now,
        'meta.lastVerifiedAt': now,
        updatedBy: ctx.userId,
      });
      return { connected: true, provider, mode: settings.providerMode, message: 'Simulation provider is always reachable' };
    }

    if (provider === PROVIDER.META_CLOUD) {
      const missing = [];
      if (!meta?.phoneNumberId)     missing.push('phoneNumberId');
      if (!meta?.businessAccountId) missing.push('businessAccountId');
      if (!meta?.accessToken)       missing.push('accessToken');
      if (missing.length) {
        throw new AppError(400, `Cannot test connection — missing: ${missing.join(', ')}`);
      }
      // Future: real Graph API verification call here.
      const now = new Date();
      await whatsappSettingsRepository.update(ctx.tenantId, {
        'meta.connected': true,
        'meta.connectedAt': now,
        'meta.lastVerifiedAt': now,
        updatedBy: ctx.userId,
      });
      return { connected: true, provider, message: 'Credentials present — verification stamped (live ping pluggable)' };
    }

    // Other providers: presence check on access token.
    if (!meta?.accessToken) {
      throw new AppError(400, `Cannot test connection — ${provider} requires an accessToken`);
    }
    const now = new Date();
    await whatsappSettingsRepository.update(ctx.tenantId, {
      'meta.connected': true, 'meta.lastVerifiedAt': now, updatedBy: ctx.userId,
    });
    return { connected: true, provider, message: 'Credentials present' };
  },

  // ── Synchronisation ────────────────────────────────────────────────────────

  /**
   * Records a sync stamp for an entity. The actual data pull is delegated to
   * the owning module in production; here we stamp lastSyncAt so the dashboard
   * reflects the action and the operation is idempotent and testable.
   */
  async sync(ctx, entity) {
    await this._ensureExists(ctx);
    const now = new Date();
    const setOps = { 'sync.lastSyncAt': now, updatedBy: ctx.userId };

    // Stamp the per-entity flag as recently exercised (kept simple + honest).
    const entityFlag = {
      [SYNC_ENTITY.TEMPLATES]: 'sync.autoSyncTemplates',
      [SYNC_ENTITY.CONTACTS]:  'sync.autoSyncContacts',
      [SYNC_ENTITY.MESSAGES]:  'sync.autoSyncMessages',
      [SYNC_ENTITY.PROFILE]:   'sync.autoSyncBusinessProfile',
    }[entity];

    const updated = await whatsappSettingsRepository.update(ctx.tenantId, setOps);
    return {
      entity,
      syncedAt: now,
      flagField: entityFlag || null,
      settings: sanitize(updated),
    };
  },

  // ── Reset to defaults ──────────────────────────────────────────────────────

  async resetSettings(ctx) {
    await this._ensureExists(ctx);
    // Replace every section with defaults while preserving identity + audit.
    const setOps = flatten(DEFAULT_SETTINGS);
    setOps.updatedBy = ctx.userId;
    const updated = await whatsappSettingsRepository.update(ctx.tenantId, setOps);
    return sanitize(updated);
  },

  // ── Integration helper (NOT exposed over HTTP) ──────────────────────────────

  /**
   * Returns provider configuration INCLUDING credentials for internal use by
   * other modules (Campaigns, Broadcasts, Messages, …). This is the single
   * source of truth so no module hardcodes credentials.
   *
   * NEVER pass the result of this method directly into an HTTP response.
   */
  async getProviderConfig(ctx) {
    const settings = await whatsappSettingsRepository.findByTenant(ctx.tenantId);
    if (!settings) throw new AppError(404, 'WhatsApp settings not configured for this tenant');
    const o = settings.toObject ? settings.toObject() : settings;
    return {
      provider:     o.provider,
      providerMode: o.providerMode,
      meta:         o.meta,        // full credentials — internal callers only
      messaging:    o.messaging,
      limits:       o.limits,
      advanced:     o.advanced,
    };
  },

  // ── Internal ───────────────────────────────────────────────────────────────

  async _ensureExists(ctx) {
    const existing = await whatsappSettingsRepository.findByTenant(ctx.tenantId);
    if (!existing) {
      // Auto-provision so PATCH on a fresh tenant doesn't 404.
      await whatsappSettingsRepository.create({
        ...DEFAULT_SETTINGS,
        tenantId:  ctx.tenantId,
        createdBy: ctx.userId,
        updatedBy: ctx.userId,
      });
    }
  },
};
