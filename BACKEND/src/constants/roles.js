/**
 * =============================================================================
 * InnovateX Revenue OS — Role Constants & Permission Definitions
 * =============================================================================
 *
 * FILE: src/constants/roles.js
 *
 * SOURCE OF TRUTH
 * ───────────────
 * MASTER_SPEC.md §A4 — User Roles & Permission Matrix
 *
 * This file is the single source of truth for all role and permission logic
 * across the backend. Import from here — never hardcode role strings inline.
 *
 * ROLE ARCHITECTURE
 * ─────────────────
 * InnovateX uses a flat, ranked role hierarchy across 5 roles:
 *
 *   super_admin     → InnovateX platform administrators (cross-tenant)
 *   tenant_owner    → Business/agency owners (full tenant access)
 *   tenant_admin    → Workspace administrators (manage team, no billing)
 *   sales_user      → Sales reps (leads, pipeline, WhatsApp, bookings)
 *   read_only_user  → Reporting/view access only
 *
 * PERMISSION MODEL
 * ────────────────
 * Each role has a default set of permission strings. These are seeded on
 * the User document at creation time (see User.js DEFAULT_PERMISSIONS).
 * Middleware uses hasPermission() for action-level access checks.
 *
 * MULTI-TENANT RULE
 * ─────────────────
 * super_admin     → tenantId: null  (no tenant, cross-platform access)
 * all other roles → tenantId: required (scoped to one tenant)
 *
 * All API queries for non-super_admin users are filtered by tenantId.
 * =============================================================================
 */

// =============================================================================
// ROLES
// =============================================================================

/**
 * ROLES — all valid user role identifiers.
 *
 * These string values are stored in:
 *   - User.role (MongoDB)
 *   - JWT payload (role claim)
 *   - Request object (req.user.role) after auth middleware
 *
 * Source: MASTER_SPEC.md §A4 & §I2 UserRole enum.
 *
 * @constant {Object}
 */
export const ROLES = Object.freeze({
  /** InnovateX platform administrator. No tenantId. Cross-tenant access. */
  SUPER_ADMIN:    "super_admin",

  /** Business owner or agency owner. Full access within their tenant. */
  TENANT_OWNER:   "tenant_owner",

  /** Workspace administrator. Manages users, leads, campaigns, reports. */
  TENANT_ADMIN:   "tenant_admin",

  /** Sales representative. Manages assigned leads, pipeline, conversations. */
  SALES_USER:     "sales_user",

  /** View-only access. Cannot create, update, or delete any data. */
  READ_ONLY_USER: "read_only_user",
});

// =============================================================================
// ROLE HIERARCHY
// =============================================================================

/**
 * ROLE_HIERARCHY — numeric rank for each role.
 *
 * Higher number = more privileged.
 * Used by hasRole() to check whether a user meets a minimum role requirement.
 *
 * Example:
 *   hasRole("tenant_admin", "sales_user") → true  (3 >= 2)
 *   hasRole("sales_user", "tenant_admin") → false (2 < 3)
 *
 * Source: MASTER_SPEC.md §A4 Permission Matrix (left-to-right privilege order).
 *
 * @constant {Object}
 */
export const ROLE_HIERARCHY = Object.freeze({
  [ROLES.SUPER_ADMIN]:    5,
  [ROLES.TENANT_OWNER]:   4,
  [ROLES.TENANT_ADMIN]:   3,
  [ROLES.SALES_USER]:     2,
  [ROLES.READ_ONLY_USER]: 1,
});

// =============================================================================
// PERMISSIONS
// =============================================================================

/**
 * PERMISSIONS — all individual permission strings in the platform.
 *
 * Grouped by domain for readability. Each permission corresponds to one
 * category of operations that can be guarded in middleware and route handlers.
 *
 * Naming convention: <verb>_<resource>
 *   manage_* → full CRUD on the resource
 *   view_*   → read-only access to the resource
 *   update_* → partial write access (no create/delete)
 *   submit_* → limited write (submit for approval, not approve)
 *   approve_*→ approval authority (template/campaign workflow)
 *
 * Source: MASTER_SPEC.md §A4 Permission Matrix + module specs §B1–§B19.
 *
 * @constant {Object}
 */
export const PERMISSIONS = Object.freeze({
  // ── Platform (super_admin only) ────────────────────────────────────────────
  MANAGE_TENANTS:       "manage_tenants",       // Create, edit, suspend, delete tenants
  MANAGE_SUBSCRIPTIONS: "manage_subscriptions", // Manage billing plans and subscription status
  MANAGE_PLATFORM:      "manage_platform",      // Global settings, global templates, platform config
  VIEW_ALL_DATA:        "view_all_data",         // Cross-tenant data access (Super Admin panel)

  // ── Team & Users ───────────────────────────────────────────────────────────
  MANAGE_USERS:         "manage_users",          // Invite, deactivate, change roles (super_admin cross-tenant)
  MANAGE_TEAM:          "manage_team",           // Invite, deactivate, change roles within own tenant

  // ── Leads & Pipeline ──────────────────────────────────────────────────────
  MANAGE_LEADS:         "manage_leads",          // Full lead CRUD, assign, archive, export
  VIEW_ASSIGNED_LEADS:  "view_assigned_leads",   // View leads assigned to this user
  UPDATE_LEADS:         "update_leads",          // Update lead status, score, notes (no delete)
  UPDATE_PIPELINE:      "update_pipeline",       // Move deal stages in Kanban

  // ── WhatsApp ───────────────────────────────────────────────────────────────
  MANAGE_WHATSAPP:      "manage_whatsapp",       // Full WhatsApp panel access (all 13 tabs)
  MANAGE_CONVERSATIONS: "manage_conversations",  // Send messages, manage inbox, assign conversations
  SUBMIT_TEMPLATES:     "submit_templates",      // Submit templates for internal review (sales_user)
  APPROVE_TEMPLATES:    "approve_templates",     // Approve/reject templates, submit to provider

  // ── Campaigns ─────────────────────────────────────────────────────────────
  MANAGE_CAMPAIGNS:     "manage_campaigns",      // Create, edit, approve, send campaigns and broadcasts
  APPROVE_CAMPAIGNS:    "approve_campaigns",     // Approve campaign before sending

  // ── Bookings & Calls ──────────────────────────────────────────────────────
  MANAGE_BOOKINGS:      "manage_bookings",       // Create, reschedule, cancel, complete bookings
  MANAGE_CALLS:         "manage_calls",          // Log calls, view AI summaries

  // ── Payments ──────────────────────────────────────────────────────────────
  MANAGE_PAYMENTS:      "manage_payments",       // Create payment links, mark paid, refund

  // ── Reports & Attribution ─────────────────────────────────────────────────
  MANAGE_REPORTS:       "manage_reports",        // Access all 9 report tabs + CSV export
  VIEW_DASHBOARD:       "view_dashboard",        // View dashboard KPIs, charts, activity feed
  VIEW_REPORTS:         "view_reports",          // View reports (read-only)
  VIEW_LEADS:           "view_leads",            // View lead list and lead details (read-only)

  // ── Settings & Integrations ───────────────────────────────────────────────
  MANAGE_INTEGRATIONS:  "manage_integrations",   // Connect/disconnect integrations, manage API keys
  MANAGE_SETTINGS:      "manage_settings",       // Edit all 10 settings tabs
  MANAGE_AUTOMATIONS:   "manage_automations",    // Create, edit, toggle automation rules

  // ── Nurture ────────────────────────────────────────────────────────────────
  MANAGE_NURTURE:       "manage_nurture",        // Create/edit sequences, enroll leads
});

// =============================================================================
// DEFAULT ROLE PERMISSIONS
// =============================================================================

/**
 * DEFAULT_ROLE_PERMISSIONS — the default permission set assigned to each role.
 *
 * These are seeded onto User.permissions when a user is created.
 * Source: MASTER_SPEC.md §A4 Permission Matrix.
 *
 * KEY DESIGN DECISIONS
 * ─────────────────────
 * 1. tenant_admin includes APPROVE_TEMPLATES and APPROVE_CAMPAIGNS because
 *    MASTER_SPEC.md §A4 states: "Approve WhatsApp templates/campaigns ✅"
 *    for tenant_admin. Only sales_user is limited to "submit" only.
 *
 * 2. sales_user gets SUBMIT_TEMPLATES (not APPROVE_TEMPLATES) and
 *    MANAGE_CONVERSATIONS. This matches spec: "➖ submit" for templates.
 *
 * 3. read_only_user cannot call any mutating endpoint. All their permissions
 *    are view_* only. The frontend hides all write buttons; the backend
 *    enforces the same via requirePermission middleware.
 *
 * 4. super_admin does NOT get tenant-level permissions like manage_leads or
 *    manage_whatsapp because super_admin operates at the platform level, not
 *    within any tenant. When a super_admin needs to act within a tenant,
 *    VIEW_ALL_DATA grants cross-tenant read, and platform-level actions cover
 *    the rest. Direct tenant data operations should be done by impersonation
 *    or by escalating through the tenant owner.
 *
 * @constant {Object}
 */
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
    PERMISSIONS.MANAGE_WHATSAPP,
    PERMISSIONS.MANAGE_CONVERSATIONS,
    PERMISSIONS.MANAGE_CAMPAIGNS,
    PERMISSIONS.APPROVE_TEMPLATES,
    PERMISSIONS.APPROVE_CAMPAIGNS,
    PERMISSIONS.MANAGE_REPORTS,
    PERMISSIONS.MANAGE_INTEGRATIONS,
    PERMISSIONS.MANAGE_SETTINGS,
    PERMISSIONS.MANAGE_BOOKINGS,
    PERMISSIONS.MANAGE_CALLS,
    PERMISSIONS.MANAGE_PAYMENTS,
    PERMISSIONS.MANAGE_AUTOMATIONS,
    PERMISSIONS.MANAGE_NURTURE,
    PERMISSIONS.UPDATE_PIPELINE,
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.VIEW_LEADS,
  ]),

  [ROLES.TENANT_ADMIN]: Object.freeze([
    PERMISSIONS.MANAGE_TEAM,
    PERMISSIONS.MANAGE_LEADS,
    PERMISSIONS.MANAGE_WHATSAPP,
    PERMISSIONS.MANAGE_CONVERSATIONS,
    PERMISSIONS.MANAGE_CAMPAIGNS,
    PERMISSIONS.APPROVE_TEMPLATES,
    PERMISSIONS.APPROVE_CAMPAIGNS,
    PERMISSIONS.MANAGE_REPORTS,
    PERMISSIONS.MANAGE_INTEGRATIONS,  // MASTER_SPEC.md §A4: tenant_admin ✅ manage integrations
    PERMISSIONS.MANAGE_BOOKINGS,
    PERMISSIONS.MANAGE_CALLS,
    PERMISSIONS.MANAGE_PAYMENTS,
    PERMISSIONS.MANAGE_AUTOMATIONS,
    PERMISSIONS.MANAGE_NURTURE,
    PERMISSIONS.UPDATE_PIPELINE,
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.VIEW_LEADS,
  ]),

  [ROLES.SALES_USER]: Object.freeze([
    PERMISSIONS.VIEW_ASSIGNED_LEADS,
    PERMISSIONS.UPDATE_LEADS,
    PERMISSIONS.MANAGE_CONVERSATIONS,
    PERMISSIONS.MANAGE_BOOKINGS,
    PERMISSIONS.MANAGE_CALLS,
    PERMISSIONS.UPDATE_PIPELINE,
    PERMISSIONS.SUBMIT_TEMPLATES,     // Can submit, not approve (MASTER_SPEC.md §A4: "➖ submit")
    PERMISSIONS.MANAGE_PAYMENTS,      // Create payment links, mark paid
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.VIEW_LEADS,
  ]),

  [ROLES.READ_ONLY_USER]: Object.freeze([
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.VIEW_LEADS,
  ]),
});

// =============================================================================
// TENANT-SCOPED ROLES
// =============================================================================

/**
 * TENANT_SCOPED_ROLES — roles that MUST belong to exactly one tenant.
 *
 * Used by User model pre-validate hook and tenantId validation middleware.
 * super_admin is explicitly excluded — it has tenantId: null.
 *
 * @constant {string[]}
 */
export const TENANT_SCOPED_ROLES = Object.freeze([
  ROLES.TENANT_OWNER,
  ROLES.TENANT_ADMIN,
  ROLES.SALES_USER,
  ROLES.READ_ONLY_USER,
]);

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * isValidRole
 * ─────────────────────────────────────────────────────────────────────────────
 * Checks whether a given string is a valid InnovateX role.
 * Used by: request validators, User model, JWT verification.
 *
 * @param {string} role - The role string to validate
 * @returns {boolean} true if role is one of the 5 defined roles
 *
 * @example
 * isValidRole("sales_user")     // true
 * isValidRole("super_admin")    // true
 * isValidRole("manager")        // false
 * isValidRole(undefined)        // false
 */
export const isValidRole = (role) => {
  return typeof role === "string" && Object.values(ROLES).includes(role);
};

/**
 * hasRole
 * ─────────────────────────────────────────────────────────────────────────────
 * Checks whether a user's role meets or exceeds a required minimum role,
 * based on the ROLE_HIERARCHY numeric rankings.
 *
 * Used by: requireRole() middleware, RoleGuard logic.
 *
 * @param {string} userRole     - The authenticated user's role (from JWT)
 * @param {string} requiredRole - The minimum role required to access a resource
 * @returns {boolean} true if userRole rank >= requiredRole rank
 *
 * @example
 * hasRole("tenant_owner", "tenant_admin")  // true  (4 >= 3)
 * hasRole("tenant_admin", "tenant_owner")  // false (3 < 4)
 * hasRole("super_admin",  "read_only_user")// true  (5 >= 1)
 * hasRole("sales_user",   "sales_user")    // true  (2 >= 2)
 * hasRole("unknown_role", "sales_user")    // false (undefined < 2)
 */
export const hasRole = (userRole, requiredRole) => {
  const userRank     = ROLE_HIERARCHY[userRole];
  const requiredRank = ROLE_HIERARCHY[requiredRole];

  // If either role is unrecognised, deny access
  if (userRank === undefined || requiredRank === undefined) return false;

  return userRank >= requiredRank;
};

/**
 * getRolePermissions
 * ─────────────────────────────────────────────────────────────────────────────
 * Returns the default permissions array for a given role.
 * Used by: User model pre-save hook (seed permissions on creation),
 *          permission audit tools.
 *
 * @param {string} role - A valid role string
 * @returns {string[]} Array of permission strings, or empty array if role is invalid
 *
 * @example
 * getRolePermissions("sales_user")
 * // ["view_assigned_leads", "update_leads", "manage_conversations", ...]
 *
 * getRolePermissions("invalid_role")
 * // []
 */
export const getRolePermissions = (role) => {
  return DEFAULT_ROLE_PERMISSIONS[role]
    ? [...DEFAULT_ROLE_PERMISSIONS[role]] // return a mutable copy
    : [];
};

/**
 * hasPermission
 * ─────────────────────────────────────────────────────────────────────────────
 * Checks whether a given role's default permissions include a specific permission.
 *
 * NOTE: In production, prefer checking req.user.permissions (from the User
 * document) over this function, because individual users may have had their
 * permissions customised after creation. Use this function for:
 *   - Initial permission seeding logic
 *   - Role-level capability checks (e.g. "can this role ever approve templates?")
 *   - Unit tests and documentation tooling
 *
 * For per-request permission checks, use the requirePermission() middleware
 * which reads from req.user.permissions (the live User document).
 *
 * @param {string} role       - A valid role string
 * @param {string} permission - A permission string from PERMISSIONS
 * @returns {boolean} true if the role's default permissions include the given permission
 *
 * @example
 * hasPermission("tenant_admin", "approve_templates") // true
 * hasPermission("sales_user",   "approve_templates") // false
 * hasPermission("sales_user",   "submit_templates")  // true
 * hasPermission("read_only_user", "manage_leads")    // false
 */
export const hasPermission = (role, permission) => {
  const permissions = DEFAULT_ROLE_PERMISSIONS[role];
  if (!permissions) return false;
  return permissions.includes(permission);
};

/**
 * isTenantScopedRole
 * ─────────────────────────────────────────────────────────────────────────────
 * Returns true if the role must be associated with a tenant (tenantId required).
 * Returns false only for super_admin (tenantId must be null).
 *
 * Used by: User model pre-validate hook, invitation service, JWT generation.
 *
 * @param {string} role - A valid role string
 * @returns {boolean}
 *
 * @example
 * isTenantScopedRole("tenant_owner")  // true
 * isTenantScopedRole("super_admin")   // false
 * isTenantScopedRole("sales_user")    // true
 */
export const isTenantScopedRole = (role) => {
  return TENANT_SCOPED_ROLES.includes(role);
};