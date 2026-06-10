/**
 * =============================================================================
 * InnovateX Revenue OS — User Model
 * =============================================================================
 *
 * Multi-Tenant SaaS Platform
 *
 * ARCHITECTURE OVERVIEW
 * ─────────────────────
 * Every user belongs to exactly one tenant, EXCEPT super_admin who belongs
 * to no tenant (tenantId = null). All database queries across the platform
 * are scoped using tenantId, meaning a user can never access data from
 * another tenant — this is enforced at the middleware level using the
 * tenantId stored in the JWT payload.
 *
 * TENANT ISOLATION RULE
 * ─────────────────────
 * User → belongs to one Tenant
 * Tenant → contains many Users
 *
 * super_admin    → tenantId: null  (platform-wide access, no tenant)
 * tenant_owner   → tenantId: req   (manages their own workspace)
 * tenant_admin   → tenantId: req   (workspace admin)
 * sales_user     → tenantId: req   (sales rep within a workspace)
 * read_only_user → tenantId: req   (view-only within a workspace)
 *
 * SOURCE OF TRUTH
 * ───────────────
 * Roles and permissions are derived from the InnovateX Master Specification
 * (MASTER_SPEC.md → Section A4: User Roles & Permission Matrix)
 *
 * =============================================================================
 */

import mongoose from "mongoose";
import argon2 from "argon2";

const { Schema } = mongoose;

// =============================================================================
// CONSTANTS
// =============================================================================

/**
 * All valid user roles as defined in MASTER_SPEC.md §A4 and §I2 (Enum Reference)
 * UserRole: Super Admin, Tenant Owner, Tenant Admin, Sales User, Read-Only User
 */
export const USER_ROLES = Object.freeze({
  SUPER_ADMIN:     "super_admin",
  TENANT_OWNER:    "tenant_owner",
  TENANT_ADMIN:    "tenant_admin",
  SALES_USER:      "sales_user",
  READ_ONLY_USER:  "read_only_user",
});

/**
 * Roles that MUST have a tenantId (all non-platform roles)
 */
const TENANT_SCOPED_ROLES = [
  USER_ROLES.TENANT_OWNER,
  USER_ROLES.TENANT_ADMIN,
  USER_ROLES.SALES_USER,
  USER_ROLES.READ_ONLY_USER,
];

/**
 * User status values
 * active    — can log in and use the platform
 * inactive  — account disabled by owner/admin
 * suspended — account suspended by super_admin (billing/violation)
 */
export const USER_STATUS = Object.freeze({
  ACTIVE:    "active",
  INACTIVE:  "inactive",
  SUSPENDED: "suspended",
});

/**
 * Default permissions per role.
 *
 * Derived from MASTER_SPEC.md §A4 Permission Matrix.
 * These are seeded on user creation and can be extended per tenant
 * in a future phase (custom permissions).
 */
export const DEFAULT_PERMISSIONS = Object.freeze({
  [USER_ROLES.SUPER_ADMIN]: [
    "manage_tenants",
    "manage_subscriptions",
    "manage_platform_users",
    "view_all_tenants",
    "view_platform_analytics",
    "access_super_admin_panel",
  ],
  [USER_ROLES.TENANT_OWNER]: [
    "manage_team",
    "manage_leads",
    "manage_whatsapp",
    "manage_campaigns",
    "manage_reports",
    "manage_integrations",
    "manage_settings",
    "manage_bookings",
    "manage_pipeline",
    "manage_payments",
    "approve_templates",
    "approve_campaigns",
    "view_attribution",
    "manage_automations",
  ],
  [USER_ROLES.TENANT_ADMIN]: [
    "manage_team",
    "manage_leads",
    "manage_whatsapp",
    "manage_campaigns",
    "manage_bookings",
    "manage_reports",
    "manage_pipeline",
    "approve_templates",
    "approve_campaigns",
    "view_attribution",
  ],
  [USER_ROLES.SALES_USER]: [
    "view_assigned_leads",
    "update_leads",
    "manage_conversations",
    "manage_bookings",
    "update_pipeline",
    "submit_templates",
    "send_whatsapp",
    "create_payments",
    "mark_payment_paid",
  ],
  [USER_ROLES.READ_ONLY_USER]: [
    "view_dashboards",
    "view_reports",
    "view_leads",
    "view_pipeline",
    "view_whatsapp",
    "export_csv",
  ],
});

// =============================================================================
// ARGON2 CONFIGURATION
// =============================================================================

/**
 * Argon2id is the recommended variant for password hashing (OWASP 2024).
 * Using argon2id which provides resistance against both side-channel
 * and GPU-based attacks.
 *
 * Settings are conservative defaults suitable for production SaaS:
 * - memoryCost: 64 MB  (OWASP minimum recommendation)
 * - timeCost: 3 iterations
 * - parallelism: 1 thread
 */
const ARGON2_OPTIONS = {
  type: argon2.argon2id,
  memoryCost: 65536,  // 64 MB in KiB
  timeCost: 3,
  parallelism: 1,
};

// =============================================================================
// USER SCHEMA
// =============================================================================

const userSchema = new Schema(
  {
    // ─── Identity ─────────────────────────────────────────────────────────────

    /**
     * First name — required for display across the platform.
     * Used in: notifications, email templates, UI avatars, audit logs.
     */
    firstName: {
      type: String,
      required: [true, "First name is required"],
      trim: true,
      maxlength: [50, "First name cannot exceed 50 characters"],
    },

    /**
     * Last name — required for full display name.
     */
    lastName: {
      type: String,
      required: [true, "Last name is required"],
      trim: true,
      maxlength: [50, "Last name cannot exceed 50 characters"],
    },

    /**
     * Primary email address — used as the login identifier.
     * Globally unique across the entire platform (not scoped to tenant),
     * since a user could theoretically belong to multiple tenants in future.
     */
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,})+$/,
        "Please provide a valid email address",
      ],
    },

    /**
     * Phone number — optional. Used for WhatsApp CRM and call intelligence.
     * Stored as string to preserve international format (+91..., +1...).
     */
    phoneNumber: {
      type: String,
      trim: true,
      default: null,
    },

    /**
     * Profile image — URL to uploaded avatar (e.g. S3/Cloudinary URL).
     * Displayed in: sidebar, conversation list, lead assignment, team page.
     */
    profileImage: {
      type: String,
      default: null,
    },

    // ─── Authentication ────────────────────────────────────────────────────────

    /**
     * Password — stored as an Argon2id hash. NEVER stored in plaintext.
     *
     * Security decisions:
     * - select: false → password is excluded from all queries by default.
     *   To explicitly retrieve it (e.g. for login), use .select("+password").
     * - Hashing is handled in the pre-save hook below, not here.
     * - Minimum 8 characters is validated here; frontend should enforce
     *   complexity (uppercase, number, special char) separately.
     */
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters"],
      select: false, // SECURITY: never returned in queries unless explicitly requested
    },

    /**
     * Last login timestamp — updated on every successful authentication.
     * Used in: team page "Last Active" column, security audit logs,
     * and for detecting inactive accounts.
     */
    lastLogin: {
      type: Date,
      default: null,
    },

    // ─── Role Management ──────────────────────────────────────────────────────

    /**
     * Role — determines what the user can access and do.
     *
     * Role hierarchy (highest to lowest):
     *   super_admin > tenant_owner > tenant_admin > sales_user > read_only_user
     *
     * Role-to-tenant rules:
     *   super_admin    → tenantId MUST be null
     *   all others     → tenantId MUST be provided
     *
     * Source: MASTER_SPEC.md §A4 User Roles & Permission Matrix
     */
    role: {
      type: String,
      required: [true, "Role is required"],
      enum: {
        values: Object.values(USER_ROLES),
        message: "Role must be one of: super_admin, tenant_owner, tenant_admin, sales_user, read_only_user",
      },
    },

    // ─── Tenant Association ────────────────────────────────────────────────────

    /**
     * Tenant ID — the workspace this user belongs to.
     *
     * MULTI-TENANT ISOLATION:
     * This field is the cornerstone of data isolation. Every API query
     * in the platform filters by tenantId derived from the JWT token.
     * A user can never see or modify data from another tenant.
     *
     * Rules:
     * - super_admin  → null (no tenant; has cross-tenant access via Super Admin panel)
     * - all others   → must reference a valid Tenant document
     *
     * Validated in: pre-validate hook below.
     */
    tenantId: {
      type: Schema.Types.ObjectId,
      ref: "Tenant",
      default: null,
      index: true,
    },

    // ─── User Status ──────────────────────────────────────────────────────────

    /**
     * Status — lifecycle state of the user account.
     *
     * active    → can log in and use the platform normally
     * inactive  → deactivated by tenant_owner/admin; cannot log in
     * suspended → suspended by super_admin (e.g. billing issue, violation);
     *             returns a specific 403 error on login attempt
     */
    status: {
      type: String,
      enum: {
        values: Object.values(USER_STATUS),
        message: "Status must be one of: active, inactive, suspended",
      },
      default: USER_STATUS.ACTIVE,
      index: true,
    },

    // ─── Permissions ──────────────────────────────────────────────────────────

    /**
     * Permissions — array of permission strings for this user.
     *
     * Seeded from DEFAULT_PERMISSIONS[role] on user creation via pre-save hook.
     * Can be extended in a future phase for per-user custom permissions
     * within the tenant (e.g. "can_export_data").
     *
     * Used by: RBAC middleware, RoleGuard on frontend.
     */
    permissions: {
      type: [String],
      default: [],
    },

    // ─── Activity ─────────────────────────────────────────────────────────────

    /**
     * isActive — quick boolean flag for filtering active users.
     * Mirrors status === "active" but stored separately for efficient
     * indexed queries (e.g. fetching all active sales_users for assignment).
     */
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    // ─── Audit Fields ─────────────────────────────────────────────────────────

    /**
     * createdBy — the user who created this account.
     * null for the very first super_admin (self-bootstrapped).
     * For all others: the super_admin or tenant_owner who invited them.
     */
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    /**
     * updatedBy — the user who last modified this document.
     * Should be set by the API handler on every update operation.
     */
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },

  {
    // ─── Schema Options ─────────────────────────────────────────────────────

    /**
     * timestamps: true automatically adds:
     * - createdAt: Date (set once on creation)
     * - updatedAt: Date (updated on every save)
     */
    timestamps: true,

    /**
     * toJSON transform — controls the shape of documents when serialised.
     * Used to strip sensitive fields (password) and add virtuals (fullName).
     */
    toJSON: {
      virtuals: true,
      transform(doc, ret) {
        // Always remove password from JSON output
        delete ret.password;

        // Remove internal Mongoose version key
        delete ret.__v;

        // Rename _id to id for cleaner API responses
        ret.id = ret._id;
        delete ret._id;

        return ret;
      },
    },

    /**
     * toObject transform — same as toJSON but for plain object conversions.
     * Ensures virtuals are included when using .toObject() in services.
     */
    toObject: {
      virtuals: true,
      transform(doc, ret) {
        delete ret.password;
        delete ret.__v;
        ret.id = ret._id;
        delete ret._id;
        return ret;
      },
    },
  }
);

// =============================================================================
// VIRTUAL FIELDS
// =============================================================================

/**
 * fullName — computed from firstName + lastName.
 * Example: "John" + "Smith" → "John Smith"
 *
 * Used in: UI display, email templates, WhatsApp notifications,
 * activity feed, audit logs.
 *
 * Virtual fields are NOT stored in MongoDB — computed on-the-fly.
 */
userSchema.virtual("fullName").get(function () {
  return `${this.firstName} ${this.lastName}`.trim();
});

// =============================================================================
// PRE-SAVE HOOKS
// =============================================================================

/**
 * HOOK 1: Validate tenant assignment based on role.
 *
 * Business rules (MASTER_SPEC.md §A4):
 * - super_admin must NOT have a tenantId
 * - all other roles MUST have a tenantId
 *
 * This runs before validation so the error surfaces as a validation error,
 * not a raw database error.
 */
userSchema.pre("validate", function (next) {
  const isSuperAdmin = this.role === USER_ROLES.SUPER_ADMIN;
  const isTenantScoped = TENANT_SCOPED_ROLES.includes(this.role);

  if (isSuperAdmin && this.tenantId !== null) {
    return next(
      new Error("super_admin must not have a tenantId — super_admin has platform-wide access")
    );
  }

  if (isTenantScoped && !this.tenantId) {
    return next(
      new Error(`tenantId is required for role: ${this.role}`)
    );
  }

  next();
});

/**
 * HOOK 2: Hash password with Argon2id before saving.
 *
 * Security decisions:
 * - Only hashes if the password field has been modified (isModified check
 *   prevents re-hashing an already-hashed password on unrelated saves).
 * - Uses argon2id variant with conservative memory/time settings.
 * - If hashing fails, the save is aborted and the error bubbles up.
 */
userSchema.pre("save", async function (next) {
  // Skip if password was not changed (e.g. updating email, status, etc.)
  if (!this.isModified("password")) {
    return next();
  }

  try {
    this.password = await argon2.hash(this.password, ARGON2_OPTIONS);
    next();
  } catch (error) {
    next(new Error(`Password hashing failed: ${error.message}`));
  }
});

/**
 * HOOK 3: Seed default permissions on new user creation.
 *
 * Permissions are based on role (DEFAULT_PERMISSIONS map above).
 * Only runs on new documents (isNew check) to avoid overwriting
 * custom permissions that may have been set after creation.
 */
userSchema.pre("save", function (next) {
  if (this.isNew && this.role && this.permissions.length === 0) {
    this.permissions = [...(DEFAULT_PERMISSIONS[this.role] || [])];
  }
  next();
});

/**
 * HOOK 4: Keep isActive in sync with status.
 *
 * isActive is a convenience boolean for fast indexed queries.
 * It is always derived from status — never set independently.
 */
userSchema.pre("save", function (next) {
  if (this.isModified("status")) {
    this.isActive = this.status === USER_STATUS.ACTIVE;
  }
  next();
});

// =============================================================================
// INSTANCE METHODS
// =============================================================================

/**
 * comparePassword(candidatePassword)
 * ─────────────────────────────────────────────────────────────────────────────
 * Verifies a plain-text password against the stored Argon2id hash.
 *
 * IMPORTANT: The password field uses select: false, so the calling code
 * must explicitly request it:
 *
 *   const user = await User.findOne({ email }).select("+password");
 *   const isMatch = await user.comparePassword(plainPassword);
 *
 * @param {string} candidatePassword — plain-text password from login form
 * @returns {Promise<boolean>} — true if match, false otherwise
 */
userSchema.methods.comparePassword = async function (candidatePassword) {
  try {
    return await argon2.verify(this.password, candidatePassword);
  } catch (error) {
    // Argon2 throws on malformed hash — treat as non-match for safety
    throw new Error(`Password comparison failed: ${error.message}`);
  }
};

/**
 * getPublicProfile()
 * ─────────────────────────────────────────────────────────────────────────────
 * Returns a safe, serialisable user object for API responses.
 * NEVER includes the password field, even if it was selected in the query.
 *
 * Used in:
 * - POST /auth/login response
 * - GET /api/team response
 * - JWT payload construction
 * - Notification and audit log references
 *
 * @returns {Object} — safe public profile
 */
userSchema.methods.getPublicProfile = function () {
  return {
    id:           this._id,
    firstName:    this.firstName,
    lastName:     this.lastName,
    fullName:     this.fullName,
    email:        this.email,
    phoneNumber:  this.phoneNumber,
    role:         this.role,
    tenantId:     this.tenantId,
    profileImage: this.profileImage,
    status:       this.status,
    isActive:     this.isActive,
    permissions:  this.permissions,
    lastLogin:    this.lastLogin,
    createdAt:    this.createdAt,
  };
};

/**
 * hasPermission(permission)
 * ─────────────────────────────────────────────────────────────────────────────
 * Convenience method to check if a user has a specific permission string.
 * Used by RBAC middleware for fine-grained action-level checks.
 *
 * @param {string} permission — e.g. "manage_leads", "approve_templates"
 * @returns {boolean}
 */
userSchema.methods.hasPermission = function (permission) {
  return this.permissions.includes(permission);
};

/**
 * isSuperAdmin()
 * ─────────────────────────────────────────────────────────────────────────────
 * Quick helper for super_admin checks throughout the codebase.
 * @returns {boolean}
 */
userSchema.methods.isSuperAdmin = function () {
  return this.role === USER_ROLES.SUPER_ADMIN;
};

/**
 * belongsToTenant(tenantId)
 * ─────────────────────────────────────────────────────────────────────────────
 * Validates that a user belongs to the given tenant.
 * Used in: tenant-scoped middleware before processing any request.
 *
 * @param {string|ObjectId} tenantId — tenant to check against
 * @returns {boolean}
 */
userSchema.methods.belongsToTenant = function (tenantId) {
  if (!this.tenantId) return false;
  return this.tenantId.toString() === tenantId.toString();
};

// =============================================================================
// STATIC METHODS
// =============================================================================

/**
 * User.findByEmail(email)
 * ─────────────────────────────────────────────────────────────────────────────
 * Finds a user by email without exposing the password.
 * For authentication flows, use findByEmailWithPassword() instead.
 *
 * @param {string} email
 * @returns {Promise<User|null>}
 */
userSchema.statics.findByEmail = function (email) {
  return this.findOne({ email: email.toLowerCase().trim() });
};

/**
 * User.findByEmailWithPassword(email)
 * ─────────────────────────────────────────────────────────────────────────────
 * Finds a user by email AND includes the password field.
 * ONLY used in the authentication service (login flow).
 * Never use this method outside of auth context.
 *
 * @param {string} email
 * @returns {Promise<User|null>}
 */
userSchema.statics.findByEmailWithPassword = function (email) {
  return this.findOne({ email: email.toLowerCase().trim() }).select("+password");
};

/**
 * User.findActiveByTenant(tenantId)
 * ─────────────────────────────────────────────────────────────────────────────
 * Returns all active users within a specific tenant.
 * Used in: team management page, lead assignment dropdowns.
 *
 * @param {string|ObjectId} tenantId
 * @returns {Promise<User[]>}
 */
userSchema.statics.findActiveByTenant = function (tenantId) {
  return this.find({
    tenantId,
    isActive: true,
    status: USER_STATUS.ACTIVE,
  });
};

// =============================================================================
// INDEXES
// =============================================================================

/**
 * Indexes are critical for query performance in a multi-tenant SaaS
 * where every request filters by tenantId, and auth always queries by email.
 *
 * Index strategy:
 * - email: unique, used on every login
 * - tenantId + role: compound index for fetching all sales_users in a tenant
 * - tenantId + status: compound for listing active users in team management
 * - tenantId + isActive: compound for lead assignment dropdowns
 * - role: for super_admin cross-tenant queries
 */

// Unique email index — enforced at DB level in addition to schema
userSchema.index({ email: 1 }, { unique: true });

// Role index — for cross-tenant queries by super_admin
userSchema.index({ role: 1 });

// Compound: tenant + role — most common query pattern
// Example: "get all sales_users in tenant X for lead assignment"
userSchema.index({ tenantId: 1, role: 1 });

// Compound: tenant + status — for team management page
userSchema.index({ tenantId: 1, status: 1 });

// Compound: tenant + isActive — for fast active-user lookups
userSchema.index({ tenantId: 1, isActive: 1 });

// Standalone isActive — for platform-wide active user counts (super_admin)
userSchema.index({ isActive: 1 });

// =============================================================================
// MODEL EXPORT
// =============================================================================

const User = mongoose.model("User", userSchema);

export default User;

/**
 * Named exports for constants — allows importing without the model:
 *
 *   import User, { USER_ROLES, USER_STATUS, DEFAULT_PERMISSIONS } from "./User.js";
 */
export { USER_ROLES, USER_STATUS, DEFAULT_PERMISSIONS };