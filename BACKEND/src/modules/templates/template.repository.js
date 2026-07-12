/**
 * =============================================================================
 * InnovateX Revenue OS — Generic Template Repository
 * =============================================================================
 *
 * FILE: src/modules/templates/template.repository.js
 *
 * Pattern matches automation.repository.js / booking.repository.js exactly:
 *   - No business logic, no validation, no formatting
 *   - Returns raw Mongoose documents
 *
 * NOTE: unlike every other repository in this codebase, list/count queries
 * here do NOT take a bare tenantId — they take the already-built visibility
 * query from template.service.js, because "list" must return BOTH the
 * caller's own tenant templates AND all global templates (or, for
 * super_admin, everything). Building that OR-query is business logic that
 * belongs in the service; this file just executes whatever query it's given.
 */

import { GenericTemplate } from './template.model.js';
import { MAX_VERSIONS_STORED } from './template.constants.js';

// =============================================================================
// CREATE
// =============================================================================

export const create = (data) => GenericTemplate.create(data);

// =============================================================================
// READ
// =============================================================================

export const findById = (id) => GenericTemplate.findById(id);

export const list = (query, { skip = 0, limit = 20 } = {}) =>
  GenericTemplate.find(query)
    .sort({ created_at: -1 })
    .skip(skip)
    .limit(limit);

export const count = (query) => GenericTemplate.countDocuments(query);

/** Per-type counts, scoped to a visibility query — powers the "type tabs" UI. */
export const countByType = (query) =>
  GenericTemplate.aggregate([
    { $match: query },
    { $group: { _id: '$type', count: { $sum: 1 } } },
    { $project: { _id: 0, type: '$_id', count: 1 } },
  ]);

// =============================================================================
// UPDATE
// =============================================================================

export const update = (id, patch) =>
  GenericTemplate.findByIdAndUpdate(id, { $set: patch }, { new: true, runValidators: true });

/**
 * pushVersionAndUpdate — atomically archives the CURRENT content into
 * version_history, bumps `version`, and applies the rest of the patch.
 * Trims history to MAX_VERSIONS_STORED (oldest entries drop off first).
 */
export const pushVersionAndUpdate = (id, previousVersionEntry, patch, newVersion) =>
  GenericTemplate.findByIdAndUpdate(
    id,
    {
      $push: { version_history: { $each: [previousVersionEntry], $slice: -MAX_VERSIONS_STORED } },
      $set: { ...patch, version: newVersion },
    },
    { new: true, runValidators: true },
  );

// =============================================================================
// DELETE
// =============================================================================

export const remove = (id) => GenericTemplate.findByIdAndDelete(id);
