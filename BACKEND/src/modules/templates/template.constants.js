/**
 * =============================================================================
 * InnovateX Revenue OS — Generic Templates Constants
 * =============================================================================
 *
 * FILE: src/modules/templates/template.constants.js
 *
 * SOURCE: MASTER_SPEC.md §B15:
 *   "Email, qualification scripts, follow-ups, proposal outlines,
 *    call-summary/report formats; tenant vs global scope;
 *    create/edit/duplicate/delete/version/copy."
 *
 * SOURCE: FRONTEND_SPEC.md §16:
 *   "Design: type tabs + template card grid; create/view modal.
 *    Features: generic templates (Email, scripts, proposal outlines,
 *    call-summary/report formats, follow-ups), tenant vs global scope,
 *    duplicate, delete, copy content, versioning."
 *
 * SOURCE: DEVELOPER_HANDOFF.md §6 / §17:
 *   "GenericTemplate" entity. Actions: createGenericTemplate,
 *   deleteGenericTemplate. "Type tabs, tenant vs global, duplicate,
 *   view/copy, versioning."
 *
 * DESIGN NOTE — this is the GENERIC template library (email drafts,
 * qualification scripts, proposal outlines, call-summary formats,
 * follow-up snippets) used across the CRM. It is entirely distinct from
 * `whatsapp/submodules/templates` (WhatsAppTemplate), which is the
 * Meta-approval-workflow WhatsApp message template system. Different
 * Mongoose model name (GenericTemplate vs WhatsAppTemplate) — no collision.
 */

// ── Template type — "type tabs" in the UI, 5 values per spec wording ──────────
export const TEMPLATE_TYPE = Object.freeze({
  EMAIL:                'Email',
  QUALIFICATION_SCRIPT:  'Qualification Script',
  FOLLOW_UP:             'Follow-Up',
  PROPOSAL_OUTLINE:      'Proposal Outline',
  CALL_SUMMARY_FORMAT:   'Call Summary Format',
});
export const TEMPLATE_TYPE_VALUES = Object.freeze(Object.values(TEMPLATE_TYPE));

// ── Scope — "tenant vs global scope" ───────────────────────────────────────────
// GLOBAL templates are platform-wide (tenant_id: null, visible to every
// tenant) and can ONLY be created/edited/deleted by super_admin. TENANT
// templates are owned by one tenant and only visible to that tenant.
export const TEMPLATE_SCOPE = Object.freeze({
  TENANT: 'tenant',
  GLOBAL: 'global',
});
export const TEMPLATE_SCOPE_VALUES = Object.freeze(Object.values(TEMPLATE_SCOPE));

// ── Limits ──────────────────────────────────────────────────────────────────────
export const MAX_NAME_LENGTH        = 100;
export const MAX_DESCRIPTION_LENGTH = 500;
export const MAX_CONTENT_LENGTH     = 10000;
export const MAX_VERSIONS_STORED    = 50;

// ── Pagination defaults ────────────────────────────────────────────────────────
export const DEFAULT_PAGE  = 1;
export const DEFAULT_LIMIT = 20;
export const MAX_LIMIT     = 100;

// ── Searchable fields ──────────────────────────────────────────────────────────
export const SEARCHABLE_FIELDS = Object.freeze(['name', 'description', 'content']);
