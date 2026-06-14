/**
 * =============================================================================
 * InnovateX Revenue OS — Roles
 * =============================================================================
 *
 * FILE: src/modules/auth/constants/roles.js
 *
 * PURPOSE
 * ───────
 * Defines user role identifiers and the hierarchy used to compare them.
 * Provides helper functions for role validation and comparison.
 *
 * HOW IT FITS
 * ───────────
 * roles.js → User.js  (role field enum values)
 *          → Tenant.js (ownerUserId role validation)
 *          → role.middleware.js (requireRole checks)
 *          → auth.service.js (role-based redirect logic)
 *          → rolePermissions.js (maps roles to permissions)
 *
 * NO DATABASE — pure constants.
 * =============================================================================
 */

// ─── Role Identifiers ────────────────────────────────────────────────────────

export const ROLES = Object.freeze({
  SUPER_ADMIN:    "super_admin",    // InnovateX platform admin — no tenantId
  TENANT_OWNER:   "tenant_owner",   // Business/agency owner — full tenant access
  TENANT_ADMIN:   "tenant_admin",   // Workspace admin — manage team, no billing
  SALES_USER:     "sales_user",     // Sales rep — leads, pipeline, WA, bookings
  READ_ONLY_USER: "read_only_user", // View only — cannot modify any data
});

// ─── Role Hierarchy ───────────────────────────────────────────────────────────

/**
 * Numeric rank per role. Higher = more privileged.
 * Used by hasRole() for minimum-role comparisons.
 *
 * Example:
 *   hasRole("tenant_admin", "sales_user") → true  (3 >= 2)
 *   hasRole("sales_user", "tenant_admin") → false (2 < 3)
 */
export const ROLE_HIERARCHY = Object.freeze({
  [ROLES.SUPER_ADMIN]:    5,
  [ROLES.TENANT_OWNER]:   4,
  [ROLES.TENANT_ADMIN]:   3,
  [ROLES.SALES_USER]:     2,
  [ROLES.READ_ONLY_USER]: 1,
});

// ─── Tenant-Scoped Roles ─────────────────────────────────────────────────────

/**
 * Roles that MUST have a tenantId on the User document.
 * super_admin is explicitly excluded — it has tenantId: null.
 */
export const TENANT_SCOPED_ROLES = Object.freeze([
  ROLES.TENANT_OWNER,
  ROLES.TENANT_ADMIN,
  ROLES.SALES_USER,
  ROLES.READ_ONLY_USER,
]);

// ─── Helper Functions ─────────────────────────────────────────────────────────

/**
 * isValidRole — checks if a string is one of the 5 defined roles.
 * @param {string} role
 * @returns {boolean}
 */
export const isValidRole = (role) =>
  typeof role === "string" && Object.values(ROLES).includes(role);

/**
 * hasRole — checks if userRole meets or exceeds requiredRole rank.
 * Used by role.middleware.js requireRole().
 * @param {string} userRole
 * @param {string} requiredRole
 * @returns {boolean}
 */
export const hasRole = (userRole, requiredRole) => {
  const userRank     = ROLE_HIERARCHY[userRole];
  const requiredRank = ROLE_HIERARCHY[requiredRole];
  if (userRank === undefined || requiredRank === undefined) return false;
  return userRank >= requiredRank;
};

/**
 * isTenantScopedRole — returns true if the role requires a tenantId.
 * @param {string} role
 * @returns {boolean}
 */
export const isTenantScopedRole = (role) =>
  TENANT_SCOPED_ROLES.includes(role);