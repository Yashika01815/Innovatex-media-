/**
 * =============================================================================
 * InnovateX Revenue OS — Generic Template Service
 * =============================================================================
 *
 * FILE: src/modules/templates/template.service.js
 *
 * Contains ALL business logic:
 *   - Visibility rules: a tenant sees its OWN templates + ALL global
 *     templates; super_admin sees everything (matches the precedent already
 *     established in tenant.middleware.js's requireSameTenantCheck: "super
 *     admin can access any tenant's data").
 *   - Scope permission: only super_admin may create/edit/delete a GLOBAL
 *     template. A tenant_admin+ may only touch their own tenant's templates.
 *   - Versioning: editing content archives the previous version into
 *     version_history and bumps version.
 *   - Duplicate: always creates a copy the requester can edit - a
 *     tenant-scoped copy for normal users (even when duplicating a global
 *     template), or a global copy for super_admin.
 *
 * AppError usage matches automation.service.js / call.service.js exactly:
 * static factories from lead.helpers.js.
 */

import * as templateRepo from './template.repository.js';
import { AppError, paginationMeta, normalizePaging } from '../../shared/helpers/lead.helpers.js';
import { ROLES } from '../auth/constants/roles.js';
import {
  TEMPLATE_TYPE_VALUES,
  TEMPLATE_SCOPE,
  TEMPLATE_SCOPE_VALUES,
  SEARCHABLE_FIELDS,
} from './template.constants.js';

// =============================================================================
// PRIVATE HELPERS
// =============================================================================

const escapeRegex = (s) => String(s || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const buildVisibilityQuery = (reqUser, filter) => {
  const f = filter || {};
  const and = [];

  if (reqUser.role !== ROLES.SUPER_ADMIN) {
    and.push({ $or: [{ tenant_id: reqUser.tenantId }, { scope: TEMPLATE_SCOPE.GLOBAL }] });
  }
  if (f.type) and.push({ type: f.type });
  if (f.scope) and.push({ scope: f.scope });
  if (f.search) {
    const rx = new RegExp(escapeRegex(f.search), 'i');
    and.push({ $or: SEARCHABLE_FIELDS.map((field) => ({ [field]: rx })) });
  }

  return and.length ? { $and: and } : {};
};

const assertCanView = (template, reqUser) => {
  if (reqUser.role === ROLES.SUPER_ADMIN) return;
  if (template.scope === TEMPLATE_SCOPE.GLOBAL) return;
  if (template.tenant_id !== reqUser.tenantId) {
    throw AppError.notFound('Template not found');
  }
};

const assertCanModify = (template, reqUser) => {
  if (reqUser.role === ROLES.SUPER_ADMIN) return;
  if (template.scope === TEMPLATE_SCOPE.GLOBAL) {
    throw AppError.forbidden('Only a Super Admin can modify a global template');
  }
  if (template.tenant_id !== reqUser.tenantId) {
    throw AppError.notFound('Template not found');
  }
};

// =============================================================================
// CREATE
// =============================================================================

export const createTemplate = async (reqUser, data) => {
  if (!data || !data.name) throw AppError.badRequest('name is required');
  if (!data || !data.content) throw AppError.badRequest('content is required');
  if (!data || !TEMPLATE_TYPE_VALUES.includes(data.type)) {
    throw AppError.badRequest('type must be one of: ' + TEMPLATE_TYPE_VALUES.join(', '));
  }

  const scope = data.scope || TEMPLATE_SCOPE.TENANT;
  if (!TEMPLATE_SCOPE_VALUES.includes(scope)) {
    throw AppError.badRequest('scope must be one of: ' + TEMPLATE_SCOPE_VALUES.join(', '));
  }

  let tenant_id;
  if (scope === TEMPLATE_SCOPE.GLOBAL) {
    if (reqUser.role !== ROLES.SUPER_ADMIN) {
      throw AppError.forbidden('Only a Super Admin can create a global template');
    }
    tenant_id = null;
  } else {
    if (!reqUser.tenantId) {
      throw AppError.badRequest('A tenant context is required to create a tenant-scoped template');
    }
    tenant_id = reqUser.tenantId;
  }

  const template = await templateRepo.create({
    tenant_id: tenant_id,
    scope: scope,
    type: data.type,
    name: data.name,
    description: data.description || '',
    content: data.content,
    version: 1,
    version_history: [],
    created_by: reqUser.sub,
    updated_by: reqUser.sub,
  });

  return template;
};

// =============================================================================
// READ
// =============================================================================

export const getTemplate = async (reqUser, id) => {
  const template = await templateRepo.findById(id);
  if (!template) throw AppError.notFound('Template not found');
  assertCanView(template, reqUser);
  return template;
};

export const listTemplates = async (reqUser, filter, options) => {
  const query = buildVisibilityQuery(reqUser, filter || {});
  const { page, limit, skip } = normalizePaging(options || {});

  const [templates, total] = await Promise.all([
    templateRepo.list(query, { skip, limit }),
    templateRepo.count(query),
  ]);

  return { templates, pagination: paginationMeta({ page, limit, total }) };
};

export const getTypeCounts = async (reqUser, filter) => {
  const f = Object.assign({}, filter);
  delete f.type;
  const query = buildVisibilityQuery(reqUser, f);
  const rows = await templateRepo.countByType(query);

  const byType = {};
  let total = 0;
  for (const row of rows) {
    byType[row.type] = row.count;
    total += row.count;
  }
  return { total: total, byType: byType };
};

// =============================================================================
// UPDATE
// =============================================================================

export const updateTemplate = async (reqUser, id, patch) => {
  const existing = await templateRepo.findById(id);
  if (!existing) throw AppError.notFound('Template not found');
  assertCanModify(existing, reqUser);

  if (patch && patch.type && !TEMPLATE_TYPE_VALUES.includes(patch.type)) {
    throw AppError.badRequest('Invalid type');
  }
  if (patch && patch.scope === TEMPLATE_SCOPE.GLOBAL && reqUser.role !== ROLES.SUPER_ADMIN) {
    throw AppError.forbidden('Only a Super Admin can make a template global');
  }

  const safePatch = Object.assign({}, patch, { updated_by: reqUser.sub });
  delete safePatch.tenant_id;

  const contentChanged = Object.prototype.hasOwnProperty.call(safePatch, 'content')
    && safePatch.content !== existing.content;

  if (contentChanged) {
    const previousVersionEntry = {
      version: existing.version,
      content: existing.content,
      updated_at: existing.updated_at,
      updated_by: existing.updated_by,
    };
    return templateRepo.pushVersionAndUpdate(id, previousVersionEntry, safePatch, existing.version + 1);
  }

  return templateRepo.update(id, safePatch);
};

// =============================================================================
// DELETE
// =============================================================================

export const deleteTemplate = async (reqUser, id) => {
  const existing = await templateRepo.findById(id);
  if (!existing) throw AppError.notFound('Template not found');
  assertCanModify(existing, reqUser);
  await templateRepo.remove(id);
  return { id: id, deleted: true };
};

// =============================================================================
// DUPLICATE
// =============================================================================

export const duplicateTemplate = async (reqUser, id) => {
  const existing = await templateRepo.findById(id);
  if (!existing) throw AppError.notFound('Template not found');
  assertCanView(existing, reqUser);

  const isSuperAdmin = reqUser.role === ROLES.SUPER_ADMIN;
  const scope = isSuperAdmin ? TEMPLATE_SCOPE.GLOBAL : TEMPLATE_SCOPE.TENANT;
  const tenant_id = isSuperAdmin ? null : reqUser.tenantId;

  const copy = await templateRepo.create({
    tenant_id: tenant_id,
    scope: scope,
    type: existing.type,
    name: existing.name + ' (Copy)',
    description: existing.description,
    content: existing.content,
    version: 1,
    version_history: [],
    created_by: reqUser.sub,
    updated_by: reqUser.sub,
  });

  return copy;
};

// =============================================================================
// VERSIONS
// =============================================================================

export const getVersions = async (reqUser, id) => {
  const template = await templateRepo.findById(id);
  if (!template) throw AppError.notFound('Template not found');
  assertCanView(template, reqUser);

  const history = template.version_history.map((v) => ({
    version: v.version,
    content: v.content,
    updated_at: v.updated_at,
    updated_by: v.updated_by,
    current: false,
  }));

  history.push({
    version: template.version,
    content: template.content,
    updated_at: template.updated_at,
    updated_by: template.updated_by,
    current: true,
  });

  history.sort((a, b) => a.version - b.version);
  return { versions: history };
};
