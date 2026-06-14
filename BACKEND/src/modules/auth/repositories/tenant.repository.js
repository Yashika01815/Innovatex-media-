/**
 * =============================================================================
 * InnovateX Revenue OS — Tenant Repository
 * =============================================================================
 *
 * FILE: src/modules/auth/repositories/tenant.repository.js
 * =============================================================================
 */

import Tenant from '../models/Tenant.js';

export const findById        = (id)   => Tenant.findById(id);
export const findBySlug      = (slug) => Tenant.findBySlug(slug);
export const findActiveTenants       = ()    => Tenant.findActiveTenants();

export const create = (data) => Tenant.create(data);

export const updateById = (id, update) =>
  Tenant.findByIdAndUpdate(id, update, { new: true, runValidators: true });

export const existsBySlug = (slug) =>
  Tenant.exists({ slug: slug.toLowerCase().trim(), deletedAt: null });

/**
 * incrementUsageCounter — atomically increments a usage counter.
 * Use $inc to prevent race conditions.
 * @param {string} tenantId
 * @param {string} field — 'currentUserCount' | 'currentLeadCount' | 'currentCampaignCount'
 * @param {number} delta — 1 or -1
 */
export const incrementUsageCounter = (tenantId, field, delta = 1) =>
  Tenant.findByIdAndUpdate(tenantId, { $inc: { [field]: delta } }, { new: true });

export const findAll = (filter = {}) =>
  Tenant.find({ deletedAt: null, ...filter }).sort({ createdAt: -1 });