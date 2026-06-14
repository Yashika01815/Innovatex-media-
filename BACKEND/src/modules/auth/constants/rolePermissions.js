/**
 * =============================================================================
 * InnovateX Revenue OS — Role Permissions Map
 * =============================================================================
 *
 * FILE: src/modules/auth/constants/rolePermissions.js
 *
 * PURPOSE
 * ───────
 * Maps each role to its default set of permissions.
 * Answers the question: "What can this role do?"
 *
 * HOW IT FITS
 * ───────────
 * rolePermissions.js → User.js pre-save hook seeds User.permissions
 *                    → permission.middleware.js checks req.user.permissions
 *                    → auth.service.js uses getRolePermissions() on register
 *
 * SOURCE: MASTER_SPEC.md §A4 User Roles & Permission Matrix
 *
 * KEY DECISIONS
 * ─────────────
 * - tenant_admin CAN approve templates and campaigns (spec §A4 ✅)
 * - sales_user can only SUBMIT templates (spec §A4 "➖ submit")
 * - super_admin does NOT have tenant-level permissions (manage_leads etc.)
 *   because super_admin has tenantId: null and operates at the platform level.
 * - read_only_user has only view_* permissions — no writes of any kind.
 *
 * NO DATABASE — pure constants.
 * =============================================================================
 */

import { ROLES } from './roles.js';
import { PERMISSIONS } from './permissions.js';

export const DEFAULT_ROLE_PERMISSIONS = Object.freeze({

  [ROLES.SUPER_ADMIN]: Object.freeze([
    PERMISSIONS.MANAGE_TENANTS,
    PERMISSIONS.MANAGE_USERS,
    PERMISSIONS.MANAGE_SUBSCRIPTIONS,
    PERMISSIONS.MANAGE_PLATFORM,
    PERMISSIONS.VIEW_ALL_DATA,
  ]),

  [ROLES.TENANT_OWNER]: Object.freeze([
    PERMISSIONS.MANAGE_TEAM,
    PERMISSIONS.MANAGE_LEADS,
    PERMISSIONS.VIEW_LEADS,
    PERMISSIONS.MANAGE_WHATSAPP,
    PERMISSIONS.MANAGE_CONVERSATIONS,
    PERMISSIONS.APPROVE_TEMPLATES,
    PERMISSIONS.MANAGE_CAMPAIGNS,
    PERMISSIONS.APPROVE_CAMPAIGNS,
    PERMISSIONS.MANAGE_REPORTS,
    PERMISSIONS.MANAGE_INTEGRATIONS,
    PERMISSIONS.MANAGE_SETTINGS,
    PERMISSIONS.MANAGE_BOOKINGS,
    PERMISSIONS.MANAGE_CALLS,
    PERMISSIONS.MANAGE_PAYMENTS,
    PERMISSIONS.MANAGE_AUTOMATIONS,
    PERMISSIONS.MANAGE_NURTURE,
    PERMISSIONS.MANAGE_AI,
    PERMISSIONS.MANAGE_ATTRIBUTION,
    PERMISSIONS.MANAGE_TEMPLATES,
    PERMISSIONS.UPDATE_PIPELINE,
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.VIEW_ATTRIBUTION,
  ]),

  [ROLES.TENANT_ADMIN]: Object.freeze([
    PERMISSIONS.MANAGE_TEAM,
    PERMISSIONS.MANAGE_LEADS,
    PERMISSIONS.VIEW_LEADS,
    PERMISSIONS.MANAGE_WHATSAPP,
    PERMISSIONS.MANAGE_CONVERSATIONS,
    PERMISSIONS.APPROVE_TEMPLATES,
    PERMISSIONS.MANAGE_CAMPAIGNS,
    PERMISSIONS.APPROVE_CAMPAIGNS,
    PERMISSIONS.MANAGE_REPORTS,
    PERMISSIONS.MANAGE_INTEGRATIONS,
    PERMISSIONS.MANAGE_BOOKINGS,
    PERMISSIONS.MANAGE_CALLS,
    PERMISSIONS.MANAGE_PAYMENTS,
    PERMISSIONS.MANAGE_AUTOMATIONS,
    PERMISSIONS.MANAGE_NURTURE,
    PERMISSIONS.MANAGE_TEMPLATES,
    PERMISSIONS.UPDATE_PIPELINE,
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.VIEW_ATTRIBUTION,
  ]),

  [ROLES.SALES_USER]: Object.freeze([
    PERMISSIONS.VIEW_ASSIGNED_LEADS,
    PERMISSIONS.VIEW_LEADS,
    PERMISSIONS.UPDATE_LEADS,
    PERMISSIONS.MANAGE_CONVERSATIONS,
    PERMISSIONS.MANAGE_BOOKINGS,
    PERMISSIONS.MANAGE_CALLS,
    PERMISSIONS.UPDATE_PIPELINE,
    PERMISSIONS.SUBMIT_TEMPLATES,
    PERMISSIONS.MANAGE_PAYMENTS,
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.VIEW_REPORTS,
  ]),

  [ROLES.READ_ONLY_USER]: Object.freeze([
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.VIEW_LEADS,
    PERMISSIONS.VIEW_ATTRIBUTION,
  ]),

});

/**
 * getRolePermissions — returns the default permission array for a role.
 * Returns empty array for unknown roles (safe default).
 * @param {string} role
 * @returns {string[]}
 */
export const getRolePermissions = (role) =>
  DEFAULT_ROLE_PERMISSIONS[role]
    ? [...DEFAULT_ROLE_PERMISSIONS[role]]
    : [];

/**
 * hasPermission — checks if a role's defaults include a specific permission.
 * NOTE: In request handlers, always check req.user.permissions (live document),
 * not this function — individual users may have customised permissions.
 * Use this for seeding, testing, and documentation tooling only.
 * @param {string} role
 * @param {string} permission
 * @returns {boolean}
 */
export const hasPermission = (role, permission) => {
  const perms = DEFAULT_ROLE_PERMISSIONS[role];
  return perms ? perms.includes(permission) : false;
};