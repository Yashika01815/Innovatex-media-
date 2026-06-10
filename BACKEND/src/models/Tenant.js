/**
 * =============================================================================
 * InnovateX Revenue OS — Tenant Model
 * =============================================================================
 *
 * SOURCE OF TRUTH: MASTER_SPEC.md, FRONTEND_SPEC.md, DEVELOPER_HANDOFF.md
 *
 * WHAT IS A TENANT?
 * ─────────────────
 * A Tenant is the root workspace entity. Every customer of InnovateX gets
 * their own completely isolated workspace. All platform data — users, leads,
 * campaigns, bookings, WhatsApp conversations, payments, reports — is owned
 * by exactly one Tenant and scoped to it via the `tenantId` foreign key.
 *
 * REAL WORLD EXAMPLES
 * ───────────────────
 * Tenant A → GrowthX Agency        (businessType: agency)
 * Tenant B → CodeMaster Academy    (businessType: edtech)
 * Tenant C → FitLife Gym           (businessType: fitness)
 * Tenant D → ABC Coaching          (businessType: coaching)
 *
 * ISOLATION RULE
 * ──────────────
 * Tenant A can NEVER access Tenant B's data.
 * Every API query filters by `tenantId` extracted from the JWT payload.
 * Only super_admin bypasses tenant isolation (via the Super Admin panel).
 *
 * REFERENCING TENANTS IN OTHER COLLECTIONS
 * ─────────────────────────────────────────
 * User        → { tenantId: ObjectId }    Booking     → { tenantId: ObjectId }
 * Lead        → { tenantId: ObjectId }    Call        → { tenantId: ObjectId }
 * Deal        → { tenantId: ObjectId }    Payment     → { tenantId: ObjectId }
 * Campaign    → { tenantId: ObjectId }    Automation  → { tenantId: ObjectId }
 * WhatsApp*   → { tenantId: ObjectId }    Notification→ { tenantId: ObjectId }
 *
 * FUTURE RESELLER / AGENCY HIERARCHY NOTE
 * ────────────────────────────────────────
 * The current architecture treats every tenant as a flat, fully isolated
 * workspace. An agency and its EdTech client are both independent tenants
 * — they cannot see each other's data, and the agency cannot log into the
 * EdTech workspace.
 *
 * A future version MAY introduce a `parentTenantId` field to model an
 * agency-reseller hierarchy (Agency → sub-tenant 1, sub-tenant 2 …).
 * This would allow an agency owner to access and manage their clients'
 * workspaces from a single login.
 *
 * DO NOT implement `parentTenantId` now. The specification does not require
 * it. Add it only when the reseller feature is formally scoped and designed.
 * Any implementation must include:
 *   - explicit permission model for cross-tenant access
 *   - data isolation guarantees for sub-tenants
 *   - billing separation logic
 *
 * SPEC REFERENCES
 * ───────────────
 * MASTER_SPEC.md §A1  — Executive Summary
 * MASTER_SPEC.md §A3  — Target Users & Use Cases (businessType values)
 * MASTER_SPEC.md §A4  — User Roles & Permission Matrix
 * MASTER_SPEC.md §B18 — Settings (10 tabs: Billing, Branding, Notifications…)
 * MASTER_SPEC.md §B19 — Super Admin Panel (tenant CRUD, suspend, MRR)
 * MASTER_SPEC.md §E1  — Entities: Tenant, TenantSettings, WhatsAppSettings
 * DEVELOPER_HANDOFF.md §7 — Seed Data (2 tenants, plan structure)
 *
 * =============================================================================
 */

import mongoose from "mongoose";

const { Schema } = mongoose;

// =============================================================================
// CONSTANTS
// =============================================================================

/**
 * Business types — derived from MASTER_SPEC.md §A3 Target Users & Use Cases.
 * Used for analytics segmentation in the Super Admin panel.
 */
export const BUSINESS_TYPES = Object.freeze({
  AGENCY:      "agency",      // Marketing / growth agencies
  EDTECH:      "edtech",      // Online education platforms
  COACHING:    "coaching",    // Coaches & consultants
  HEALTHCARE:  "healthcare",  // Clinics, wellness providers
  ECOMMERCE:   "ecommerce",   // Online stores
  REAL_ESTATE: "real_estate", // Property businesses
  FITNESS:     "fitness",     // Gyms, personal trainers
  FINANCE:     "finance",     // Financial advisors, accountants
  SAAS:        "saas",        // SaaS founders (MASTER_SPEC.md §A3)
  OTHER:       "other",       // Catch-all
});

/**
 * Subscription plans — the paid tier the tenant is on.
 *
 * IMPORTANT: "trial" is NOT a plan. It is a subscriptionStatus value.
 * A tenant on trial can be on the "free" plan (default) and will be
 * prompted to upgrade when the trial expires.
 *
 *   plan              = WHAT features/limits the tenant has
 *   subscriptionStatus = WHETHER they are currently paying / in trial / lapsed
 *
 * Source: MASTER_SPEC.md §B18 Settings → Billing tab, §B19 Super Admin.
 */
export const SUBSCRIPTION_PLANS = Object.freeze({
  FREE:       "free",       // No payment — feature-limited, for evaluation
  STARTER:    "starter",    // Small teams: up to 5 users
  GROWTH:     "growth",     // Growing businesses: full CRM + WhatsApp
  SCALE:      "scale",      // Scaling teams: advanced AI + analytics
  ENTERPRISE: "enterprise", // Large orgs: custom limits, dedicated support
});

/**
 * Subscription status — the billing lifecycle state.
 *
 * "trial"  → new tenant within the 14-day free trial window.
 *            The tenant has full access but has not paid yet.
 *            Moves to "inactive" when trialEndsAt passes (via cron).
 *            Moves to "active" when they purchase a plan.
 *
 * "active"  → paying tenant, within the current billing period.
 * "inactive"→ payment lapsed / trial expired. Grace period before suspension.
 * "suspended"→ suspended by super_admin (non-payment, violation). Blocks login.
 * "cancelled"→ deliberately cancelled. Workspace goes read-only, then deleted.
 */
export const SUBSCRIPTION_STATUS = Object.freeze({
  TRIAL:     "trial",     // Within free trial window — full access, no payment
  ACTIVE:    "active",    // Paying and within billing period
  INACTIVE:  "inactive",  // Payment lapsed; grace period before suspension
  SUSPENDED: "suspended", // Suspended by super_admin — API returns 403
  CANCELLED: "cancelled", // Cancelled by owner — workspace goes read-only
});

/**
 * Workspace status — controls actual access to the workspace.
 *
 * Intentionally separate from subscriptionStatus:
 * - A workspace can be suspended by super_admin even if subscription is "active"
 *   (e.g. ToS violation while they have prepaid billing).
 * - A workspace can be active while subscription is "inactive" (grace period).
 *
 * Auth middleware checks workspaceStatus first, then subscriptionStatus.
 */
export const WORKSPACE_STATUS = Object.freeze({
  ACTIVE:    "active",
  INACTIVE:  "inactive",
  SUSPENDED: "suspended",
});

/**
 * AI model options supported by the platform.
 * Source: DEVELOPER_HANDOFF.md §11 Services (aiService), MASTER_SPEC.md §B5.
 */
export const AI_MODELS = Object.freeze({
  GPT_4O:  "gpt-4o",
  CLAUDE:  "claude",
});

/**
 * Plan limits — default resource caps per subscription tier.
 *
 * These are the DEFAULT limits applied when a tenant is created or upgrades.
 * super_admin can override maxUsers/maxLeads/maxCampaigns per tenant for
 * custom enterprise deals (e.g. a client who negotiated 100 users on growth).
 *
 * KEYS must match the SUBSCRIPTION_PLANS values exactly.
 * Adding a new plan requires a corresponding entry here.
 *
 * Note: "free" plan limits also apply during trial (since trial is a status,
 * not a plan — new tenants default to plan="free", status="trial").
 * You may want to give trial users more generous limits than the permanent
 * free plan. Adjust free limits accordingly or introduce a separate
 * TRIAL_LIMITS constant if business requirements dictate it.
 */
export const PLAN_LIMITS = Object.freeze({
  free:       { maxUsers: 3,   maxLeads: 250,    maxCampaigns: 3   },
  starter:    { maxUsers: 5,   maxLeads: 1000,   maxCampaigns: 10  },
  growth:     { maxUsers: 15,  maxLeads: 10000,  maxCampaigns: 50  },
  scale:      { maxUsers: 50,  maxLeads: 50000,  maxCampaigns: 200 },
  enterprise: { maxUsers: 999, maxLeads: 999999, maxCampaigns: 999 },
});

// =============================================================================
// PHONE VALIDATION UTILITY
// =============================================================================

/**
 * International phone number regex.
 *
 * Accepts E.164-style international numbers:
 *   +91 9876543210   (India)
 *   +1 415 555 0132  (USA)
 *   +44 20 7946 0958 (UK)
 *
 * Rules:
 * - Must start with + followed by country code (1–3 digits)
 * - Followed by 6–14 digits (allows spaces, hyphens, parentheses)
 * - Total length: 7–17 characters (ITU-T E.164 max is 15 digits)
 *
 * Deliberately permissive on formatting (spaces/hyphens) because users
 * paste numbers in various formats. Normalise to E.164 at the service layer.
 */
const PHONE_REGEX = /^\+[1-9]\d{0,2}[\s\-.]?\(?\d{1,4}\)?[\s\-.]?\d{1,4}[\s\-.]?\d{1,9}$/;

// =============================================================================
// HEX COLOUR VALIDATION UTILITY
// =============================================================================

/**
 * Validates 3-digit or 6-digit hex colour codes.
 * Example: "#6366f1", "#fff"
 */
const HEX_COLOR_REGEX = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;

// =============================================================================
// SUB-SCHEMAS
// =============================================================================

/**
 * WhatsApp Settings Sub-Schema
 * ─────────────────────────────
 * Source: MASTER_SPEC.md §B4 WhatsApp Operating Panel → Settings tab (tab 13 of 13).
 * Stores the active provider and its credentials for this tenant's WhatsApp integration.
 *
 * Providers (9): Native Meta Cloud API, WATI, Interakt, AiSensy, Gallabox,
 * Twilio WhatsApp, 360dialog, Custom Webhook Provider, Simulation Mode.
 * Source: MASTER_SPEC.md §I2 WhatsAppProvider enum.
 *
 * ⚠️  SECURITY — CREDENTIAL FIELDS (accessToken, apiKey, webhookVerifyToken)
 * ────────────────────────────────────────────────────────────────────────────
 * These fields MUST be encrypted BEFORE being stored in MongoDB.
 * Use AES-256-GCM encryption with a server-managed key (ENCRYPTION_KEY env var).
 * Encryption/decryption must happen in a dedicated crypto service — never inline.
 *
 * These values MUST NEVER be:
 *   1. Returned in API responses (stripped in toJSON transform + select:false)
 *   2. Logged to any logging system (console, Winston, Sentry, Datadog)
 *   3. Included in error messages
 *   4. Stored in browser storage, frontend state, or JWT payloads
 *
 * If a credential is compromised, rotate it immediately via the provider dashboard
 * and update the stored encrypted value.
 */
const whatsAppSettingsSchema = new Schema(
  {
    /**
     * Operating mode:
     * - native      → InnovateX built-in Meta Cloud API adapter
     * - third_party → Delegate to a BSP (Business Solution Provider)
     * - simulation  → Mock mode for development/demo (no real messages sent)
     */
    mode: {
      type: String,
      enum: {
        values: ["native", "third_party", "simulation"],
        message: "WhatsApp mode must be: native, third_party, or simulation",
      },
      default: "simulation",
    },

    /**
     * Active provider — determines which adapter handles outbound messages.
     * Source: MASTER_SPEC.md §I2 WhatsAppProvider (9 values).
     */
    provider: {
      type: String,
      enum: {
        values: [
          "meta_cloud_api",
          "wati",
          "interakt",
          "aisensy",
          "gallabox",
          "twilio_whatsapp",
          "360dialog",
          "custom_webhook",
          "simulation",
        ],
        message: "Invalid WhatsApp provider",
      },
      default: "simulation",
    },

    // ── Meta Cloud API credentials ────────────────────────────────────────
    // ⚠️  ENCRYPT BEFORE STORAGE. NEVER RETURN IN API RESPONSES. NEVER LOG.
    phoneNumberId:      { type: String, default: null, select: false },
    wabaId:             { type: String, default: null },               // WhatsApp Business Account ID (non-secret)
    accessToken:        { type: String, default: null, select: false }, // ⚠️ ENCRYPTED
    webhookVerifyToken: { type: String, default: null, select: false }, // ⚠️ ENCRYPTED

    // ── BSP credentials (generic — maps to most BSP API shapes) ──────────
    // ⚠️  ENCRYPT BEFORE STORAGE. NEVER RETURN IN API RESPONSES. NEVER LOG.
    apiKey:             { type: String, default: null, select: false }, // ⚠️ ENCRYPTED
    apiEndpoint:        { type: String, default: null },                // Non-secret base URL

    // ── Sync preferences ──────────────────────────────────────────────────
    syncContacts:  { type: Boolean, default: false },
    syncTemplates: { type: Boolean, default: false },

    /**
     * autoOptOut — when true, incoming messages containing opt-out keywords
     * (STOP, UNSUBSCRIBE, CANCEL, NO, REMOVE — from MASTER_SPEC.md §B4 tab 10)
     * automatically update the lead's opt_out_status = true and block
     * future outbound messages to that number.
     */
    autoOptOut:   { type: Boolean, default: true },
    lastSyncedAt: { type: Date, default: null },
  },
  { _id: false }
);

/**
 * Branding Sub-Schema
 * ────────────────────
 * Source: MASTER_SPEC.md §B18 Settings → Branding tab.
 * Supports white-label customisation per tenant.
 * Design tokens from MASTER_SPEC.md §C2 (indigo/teal/violet palette).
 */
const brandingSchema = new Schema(
  {
    primaryColor: {
      type: String,
      default: "#6366f1", // InnovateX brand indigo
      validate: {
        validator: (v) => v === null || HEX_COLOR_REGEX.test(v),
        message: "primaryColor must be a valid hex colour (e.g. #6366f1)",
      },
    },
    secondaryColor: {
      type: String,
      default: "#0d9488", // InnovateX teal
      validate: {
        validator: (v) => v === null || HEX_COLOR_REGEX.test(v),
        message: "secondaryColor must be a valid hex colour",
      },
    },
    accentColor: {
      type: String,
      default: "#7c3aed", // InnovateX violet
      validate: {
        validator: (v) => v === null || HEX_COLOR_REGEX.test(v),
        message: "accentColor must be a valid hex colour",
      },
    },
    logoUrl:      { type: String, default: null },  // S3 / Cloudinary URL
    faviconUrl:   { type: String, default: null },
    /**
     * customDomain — e.g. "crm.growthxagency.com"
     * When set, the platform can be accessed at this domain.
     * DNS verification and TLS provisioning handled at infrastructure layer.
     */
    customDomain: { type: String, default: null, trim: true, lowercase: true },
  },
  { _id: false }
);

/**
 * Notification Preferences Sub-Schema
 * ─────────────────────────────────────
 * Source: MASTER_SPEC.md §B18 Settings → Notifications tab.
 * Tenant-level defaults; individual users may have their own overrides
 * (stored on the User document in a future phase).
 *
 * 13 notification types from MASTER_SPEC.md §B20.
 */
const notificationPreferencesSchema = new Schema(
  {
    hotLeadAlert:     { type: Boolean, default: true  },
    bookingCreated:   { type: Boolean, default: true  },
    bookingCancelled: { type: Boolean, default: true  },
    paymentReceived:  { type: Boolean, default: true  },
    paymentFailed:    { type: Boolean, default: true  },
    templateApproved: { type: Boolean, default: true  },
    templateRejected: { type: Boolean, default: true  },
    campaignSent:     { type: Boolean, default: true  },
    callCompleted:    { type: Boolean, default: true  },
    leakageAlert:     { type: Boolean, default: true  },
    newLeadAssigned:  { type: Boolean, default: true  },
    dealWon:          { type: Boolean, default: true  },
    dealLost:         { type: Boolean, default: false }, // Off by default — noisy
  },
  { _id: false }
);

/**
 * Consent & Data Settings Sub-Schema
 * ────────────────────────────────────
 * Source: MASTER_SPEC.md §B18 Settings → Consent & Data tab.
 * §F3 Privacy/Consent: consent, opt-out, suppression, retention.
 */
const consentSettingsSchema = new Schema(
  {
    defaultConsentLanguage: {
      type: String,
      default: "By submitting this form, you agree to be contacted via WhatsApp.",
      maxlength: [500, "Consent language cannot exceed 500 characters"],
    },
    /**
     * dataRetentionDays — after this many days, archived leads/data are
     * eligible for permanent deletion (GDPR right-to-erasure compliance).
     * 0 = retain indefinitely. Enforced by a scheduled cleanup job.
     */
    dataRetentionDays: { type: Number, default: 365, min: 0 },
    autoGrantConsent:  { type: Boolean, default: false },
    gdprEnabled:       { type: Boolean, default: false },
  },
  { _id: false }
);

/**
 * Security Settings Sub-Schema
 * ──────────────────────────────
 * Source: MASTER_SPEC.md §B18 Settings → Security tab.
 */
const securitySettingsSchema = new Schema(
  {
    enforce2FA: { type: Boolean, default: false },
    /**
     * sessionTimeoutMinutes — idle session TTL.
     * Auth middleware should enforce this via JWT expiry or server-side
     * session tracking. 0 = no timeout (not recommended for production).
     */
    sessionTimeoutMinutes: {
      type: Number,
      default: 480,  // 8 hours
      min: [5, "Session timeout must be at least 5 minutes"],
      max: [10080, "Session timeout cannot exceed 7 days"], // 7 * 24 * 60
    },
    /**
     * ipAllowlist — empty array = allow all IPs (default).
     * When enforceIpAllowlist=true and ipAllowlist is non-empty, auth
     * middleware rejects requests from IPs not in the list.
     * Stored as CIDR notation or plain IPs: ["203.0.113.0/24", "198.51.100.5"]
     */
    ipAllowlist:         { type: [String], default: [] },
    enforceIpAllowlist:  { type: Boolean, default: false },
  },
  { _id: false }
);

/**
 * AI Configuration Sub-Schema
 * ────────────────────────────
 * Source: DEVELOPER_HANDOFF.md §11 Services (aiService.ts).
 * MASTER_SPEC.md §B5 AI Qualification.
 *
 * When aiEnabled=true and aiApiKey is set, the platform makes real AI calls
 * (OpenAI or Anthropic). Otherwise falls back to the deterministic mock.
 * This matches the isAiLive() gate in aiService.ts.
 *
 * ⚠️  SECURITY — aiApiKey
 * ────────────────────────────────────────────────────────────────────────────
 * aiApiKey MUST be encrypted BEFORE storage using AES-256-GCM.
 * It MUST NEVER be:
 *   1. Returned in API responses (select: false + stripped in toJSON)
 *   2. Logged anywhere (console, error trackers, APM tools)
 *   3. Included in client-side code, frontend state, or JWT tokens
 *   4. Stored in version control, even temporarily
 *
 * Prefer per-environment platform API keys (OPENAI_API_KEY env var) over
 * per-tenant keys unless you are building a BYOK (Bring Your Own Key) feature.
 */
const aiConfigSchema = new Schema(
  {
    aiEnabled: { type: Boolean, default: false },
    aiModel: {
      type: String,
      enum: {
        values: Object.values(AI_MODELS),
        message: `AI model must be one of: ${Object.values(AI_MODELS).join(", ")}`,
      },
      default: AI_MODELS.GPT_4O,
    },
    // ⚠️  ENCRYPTED BEFORE STORAGE. NEVER RETURN. NEVER LOG.
    aiApiKey: { type: String, default: null, select: false },
  },
  { _id: false }
);

/**
 * Scoring Rules Sub-Schema
 * ─────────────────────────
 * Source: MASTER_SPEC.md §B18 Settings → Scoring Rules tab, §B5 AI Qualification.
 * Configurable dimension weights for the lead qualification score (1–10).
 *
 * Invariant: all five weights should sum to 1.0.
 * Validation of this invariant is enforced at the service/API layer, not here,
 * because Mongoose validators run per-field and cannot easily access siblings.
 */
const scoringRulesSchema = new Schema(
  {
    fitWeight:        { type: Number, default: 0.30, min: 0, max: 1 },
    intentWeight:     { type: Number, default: 0.25, min: 0, max: 1 },
    urgencyWeight:    { type: Number, default: 0.20, min: 0, max: 1 },
    engagementWeight: { type: Number, default: 0.15, min: 0, max: 1 },
    budgetWeight:     { type: Number, default: 0.10, min: 0, max: 1 },
  },
  { _id: false }
);

// =============================================================================
// MAIN TENANT SCHEMA
// =============================================================================

const tenantSchema = new Schema(
  {
    // ─── Basic Identity ────────────────────────────────────────────────────────

    /**
     * Display name of the workspace.
     * Shown in: workspace switcher, topbar, Super Admin panel, email templates.
     */
    name: {
      type: String,
      required: [true, "Tenant name is required"],
      trim: true,
      minlength: [2, "Tenant name must be at least 2 characters"],
      maxlength: [100, "Tenant name cannot exceed 100 characters"],
    },

    /**
     * URL-safe slug — canonical identifier used in routing and tracking links.
     * Auto-generated from name if not provided (see pre-validate hook).
     * Example: "GrowthX Agency" → "growthx-agency"
     *
     * Immutability note: changing a slug after creation will break any
     * existing UTM tracking links pointing to /capture?source=growthx-agency.
     * Add a slug change warning in the admin UI when this is editable.
     */
    slug: {
      type: String,
      required: [true, "Slug is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
        "Slug must be lowercase alphanumeric characters separated by hyphens",
      ],
      maxlength: [100, "Slug cannot exceed 100 characters"],
    },

    /** Logo URL — S3/Cloudinary URL. Displayed in sidebar and emails. */
    logo:    { type: String, default: null, trim: true },

    /** Business website URL. */
    website: { type: String, default: null, trim: true },

    /** Short description. Used in Super Admin panel for quick identification. */
    description: {
      type: String,
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
      default: null,
    },

    // ─── Business Classification ───────────────────────────────────────────────

    /**
     * Business type — analytics segmentation for Super Admin.
     * Source: MASTER_SPEC.md §A3 Target Users & Use Cases.
     */
    businessType: {
      type: String,
      enum: {
        values: Object.values(BUSINESS_TYPES),
        message: `businessType must be one of: ${Object.values(BUSINESS_TYPES).join(", ")}`,
      },
      default: BUSINESS_TYPES.OTHER,
    },

    /** Free-text industry. Example: "Higher Education", "Personal Training". */
    industry: { type: String, trim: true, default: null },

    // ─── Owner / Primary Contact ───────────────────────────────────────────────

    /**
     * OWNER DATA DESIGN DECISION — WHY WE STORE BOTH ownerUserId AND
     * DENORMALISED ownerName / ownerEmail / ownerPhone
     * ─────────────────────────────────────────────────────────────────────────
     * ownerUserId → links to the User document (foreign key).
     * ownerName, ownerEmail, ownerPhone → denormalised copies stored here.
     *
     * Rationale for intentional denormalisation:
     *
     * 1. SUPER ADMIN QUERIES — the Super Admin panel lists all tenants with
     *    owner details (MASTER_SPEC.md §B19). Without denormalisation, every
     *    tenant row in that list would require a JOIN/populate to the users
     *    collection, which is expensive at scale (1000+ tenants × 1 populate).
     *    Denormalised fields allow a fast single-collection scan.
     *
     * 2. BILLING & SUSPENSION COMMUNICATIONS — when a tenant is suspended or
     *    a payment fails, the system needs to email/WhatsApp the owner. If the
     *    owner's User document is deactivated (e.g. they left the company), the
     *    billing contact stored here remains reachable.
     *
     * 3. ACCOUNT RECOVERY — if the owner User document is accidentally deleted
     *    or corrupted, the Tenant document retains the contact details needed
     *    to reach the human who owns the account.
     *
     * 4. FUTURE RESELLER FLOW — if the platform introduces agency-managed
     *    sub-tenants, the billing contact on the Tenant may differ from the
     *    User who administers the workspace day-to-day.
     *
     * KEEPING THEM IN SYNC:
     * The service layer must update ownerName/ownerEmail/ownerPhone whenever
     * the ownerUserId's User document profile is updated. A Mongoose post-save
     * hook on the User model is the recommended place to do this.
     *
     * ALTERNATIVE CONSIDERED: Removing denormalised fields and always
     * populating ownerUserId. Rejected because populate has O(N) query cost
     * in list views and is fragile if the User document is deleted.
     */
    ownerUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    /** Denormalised owner display name. Keep in sync with User.fullName. */
    ownerName: { type: String, trim: true, default: null },

    /** Denormalised owner email. Keep in sync with User.email. */
    ownerEmail: {
      type: String,
      trim: true,
      lowercase: true,
      default: null,
      validate: {
        validator: (v) =>
          v === null || /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,})+$/.test(v),
        message: "ownerEmail must be a valid email address",
      },
    },

    /**
     * Denormalised owner phone. Keep in sync with User.phoneNumber.
     * Validated as international E.164 format (e.g. +91 9876543210).
     */
    ownerPhone: {
      type: String,
      trim: true,
      default: null,
      validate: {
        validator: (v) => v === null || PHONE_REGEX.test(v),
        message:
          "ownerPhone must be a valid international phone number (e.g. +91 9876543210)",
      },
    },

    // ─── Subscription & Billing ───────────────────────────────────────────────

    /**
     * Current subscription plan — determines feature access and resource limits.
     *
     * Default: "free" — new tenants start on the free plan while in trial.
     * Trial is a STATUS, not a plan. See SUBSCRIPTION_STATUS.TRIAL.
     *
     * When a tenant upgrades (starter → growth → scale → enterprise),
     * the upgradePlan() method updates plan + resource limits atomically.
     */
    plan: {
      type: String,
      enum: {
        values: Object.values(SUBSCRIPTION_PLANS),
        message: `plan must be one of: ${Object.values(SUBSCRIPTION_PLANS).join(", ")}`,
      },
      default: SUBSCRIPTION_PLANS.FREE,
    },

    /**
     * Subscription lifecycle status.
     * "trial" = new tenant within 14-day free trial. Full access, no payment.
     *
     * Transitions:
     *   trial → active    (when tenant pays / subscribes)
     *   trial → inactive  (when trialEndsAt passes without payment)
     *   active → inactive (when payment lapses)
     *   inactive → suspended (after grace period, by super_admin or cron)
     *   any → cancelled   (owner cancels subscription)
     *   suspended → active (super_admin reactivates after payment received)
     */
    subscriptionStatus: {
      type: String,
      enum: {
        values: Object.values(SUBSCRIPTION_STATUS),
        message: `subscriptionStatus must be one of: ${Object.values(SUBSCRIPTION_STATUS).join(", ")}`,
      },
      default: SUBSCRIPTION_STATUS.TRIAL,
    },

    subscriptionStartDate: { type: Date, default: null },
    subscriptionEndDate:   { type: Date, default: null },

    /**
     * trialEndsAt — when the free trial expires.
     * Set to 14 days from createdAt by pre-save hook on new documents.
     * A scheduled cron job should check this daily and move expired trial
     * tenants from subscriptionStatus="trial" to "inactive".
     */
    trialEndsAt: { type: Date, default: null },

    /**
     * Razorpay billing references.
     * These are internal billing IDs — not secrets, but should not be
     * unnecessarily exposed in API responses (stripped in toJSON).
     */
    razorpaySubscriptionId: { type: String, default: null },
    razorpayCustomerId:     { type: String, default: null },

    /**
     * Monthly Recurring Revenue — smallest currency unit (paise / cents).
     * Updated by Razorpay billing webhooks.
     * Read by Super Admin platform KPI dashboard (MASTER_SPEC.md §B19).
     */
    mrr: { type: Number, default: 0, min: 0 },

    // ─── Workspace Status ─────────────────────────────────────────────────────

    /**
     * isActive — convenience boolean for fast indexed queries.
     * Always reflects: workspaceStatus === "active"
     * Managed by pre-save Hook 4. Never set directly.
     */
    isActive: { type: Boolean, default: true },

    /**
     * workspaceStatus — controls API access to the workspace.
     * Auth middleware checks this on every request:
     *   - "suspended" → 403 with suspensionReason in error body
     *   - "inactive"  → 402 with upgrade/reactivate prompt
     *   - "active"    → proceed to subscriptionStatus check
     */
    workspaceStatus: {
      type: String,
      enum: {
        values: Object.values(WORKSPACE_STATUS),
        message: `workspaceStatus must be one of: ${Object.values(WORKSPACE_STATUS).join(", ")}`,
      },
      default: WORKSPACE_STATUS.ACTIVE,
    },

    /** Human-readable reason for suspension — shown to tenant owner on login. */
    suspensionReason: { type: String, default: null },
    suspendedAt:      { type: Date, default: null },
    suspendedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // ─── Resource Limits ──────────────────────────────────────────────────────

    /**
     * Maximum allowed resource counts per plan.
     *
     * UPGRADE BEHAVIOUR (fixed from v1):
     * These are set from PLAN_LIMITS[plan] when:
     *   a) A new tenant is created (pre-save Hook 2, isNew=true)
     *   b) The plan field is explicitly modified (upgradePlan() method)
     *
     * They are NOT auto-updated on every save — this prevents accidentally
     * overwriting custom enterprise limits that super_admin has manually set.
     *
     * Enterprise override example:
     *   await Tenant.findByIdAndUpdate(id, { maxUsers: 200 })
     *   // Plan remains "enterprise" but maxUsers is now custom-set to 200
     *
     * The upgradePlan() instance method always applies standard PLAN_LIMITS.
     * For custom enterprise overrides, update maxUsers/maxLeads/maxCampaigns
     * directly via a super_admin API endpoint.
     */
    maxUsers:     { type: Number, default: PLAN_LIMITS.free.maxUsers,     min: 1 },
    maxLeads:     { type: Number, default: PLAN_LIMITS.free.maxLeads,     min: 1 },
    maxCampaigns: { type: Number, default: PLAN_LIMITS.free.maxCampaigns, min: 1 },

    // ─── Resource Usage Counters ───────────────────────────────────────────────

    /**
     * Current usage counters — denormalised for O(1) limit checks.
     *
     * These counters MUST be updated atomically using MongoDB $inc operations:
     *
     *   // On user creation:
     *   await Tenant.findByIdAndUpdate(tenantId, { $inc: { currentUserCount: 1 } });
     *
     *   // On user deletion/deactivation:
     *   await Tenant.findByIdAndUpdate(tenantId, { $inc: { currentUserCount: -1 } });
     *
     * Using $inc prevents race conditions that would occur if you read-modify-write
     * (e.g. two simultaneous user creations both reading count=4, both writing 5).
     *
     * These counters should be periodically reconciled against actual document
     * counts via a background job to catch any drift.
     */
    currentUserCount:     { type: Number, default: 0, min: 0 },
    currentLeadCount:     { type: Number, default: 0, min: 0 },
    currentCampaignCount: { type: Number, default: 0, min: 0 },

    // ─── Integration Connection Flags ─────────────────────────────────────────

    /**
     * Flat connection status flags — quick lookups for integration badges
     * in the Super Admin panel and the tenant's Integrations page.
     * Source: MASTER_SPEC.md §B17 — 22 integration cards.
     *
     * Detailed credentials and configs live in a separate Integrations collection.
     * These flags are the lightweight summary (connected / not connected).
     */
    metaConnected:           { type: Boolean, default: false },
    googleAdsConnected:      { type: Boolean, default: false },
    whatsappConnected:       { type: Boolean, default: false },
    razorpayConnected:       { type: Boolean, default: false },
    openAIConnected:         { type: Boolean, default: false },
    googleCalendarConnected: { type: Boolean, default: false },
    twilioConnected:         { type: Boolean, default: false },

    // ─── Embedded Settings ────────────────────────────────────────────────────

    /** WhatsApp provider config. ⚠️ Contains encrypted credential fields. */
    whatsAppSettings: { type: whatsAppSettingsSchema, default: () => ({}) },

    /** UI branding — colours, logo, custom domain. */
    branding: { type: brandingSchema, default: () => ({}) },

    /** Which notification types fire for this tenant. */
    notificationPreferences: { type: notificationPreferencesSchema, default: () => ({}) },

    /** GDPR / consent and data retention preferences. */
    consentSettings: { type: consentSettingsSchema, default: () => ({}) },

    /** 2FA, session timeout, IP allowlist. */
    securitySettings: { type: securitySettingsSchema, default: () => ({}) },

    /** AI model selection and live/mock toggle. ⚠️ Contains encrypted aiApiKey. */
    aiConfig: { type: aiConfigSchema, default: () => ({}) },

    /** Lead qualification score dimension weights. */
    scoringRules: { type: scoringRulesSchema, default: () => ({}) },

    /**
     * Qualification questions — configurable discovery question set for the
     * AI Qualification engine. Source: MASTER_SPEC.md §B5, §B18 Settings.
     * Stored per-tenant to allow full customisation of the qualification flow.
     */
    qualificationQuestions: {
      type: [
        {
          _id: false,
          questionId: { type: String, required: true },
          question:   { type: String, required: true, trim: true, maxlength: 500 },
          type: {
            type: String,
            enum: ["text", "select", "rating"],
            default: "text",
          },
          options:    { type: [String], default: [] },
          order:      { type: Number, default: 0, min: 0 },
          isRequired: { type: Boolean, default: true },
        },
      ],
      default: [],
    },

    /**
     * Pipeline stage configuration — tenants can rename and reorder stages.
     * Source: MASTER_SPEC.md §B18 Settings → Pipeline Stages tab.
     * Default 9 stages from MASTER_SPEC.md §B6 and §I2 PipelineStageId enum.
     */
    pipelineStages: {
      type: [
        {
          _id: false,
          stageId:   { type: String, required: true },
          name:      { type: String, required: true, trim: true },
          order:     { type: Number, required: true, min: 1 },
          color:     {
            type: String,
            default: "#6366f1",
            validate: {
              validator: (v) => HEX_COLOR_REGEX.test(v),
              message: "Stage color must be a valid hex colour",
            },
          },
          isDefault: { type: Boolean, default: false },
        },
      ],
      default: [
        { stageId: "new_lead",       name: "New Lead",       order: 1, isDefault: true },
        { stageId: "qualified",      name: "Qualified",      order: 2, isDefault: true },
        { stageId: "booked_call",    name: "Booked Call",    order: 3, isDefault: true },
        { stageId: "call_completed", name: "Call Completed", order: 4, isDefault: true },
        { stageId: "proposal_sent",  name: "Proposal Sent",  order: 5, isDefault: true },
        { stageId: "negotiation",    name: "Negotiation",    order: 6, isDefault: true },
        { stageId: "won",            name: "Won",            order: 7, isDefault: true },
        { stageId: "lost",           name: "Lost",           order: 8, isDefault: true },
        { stageId: "nurture",        name: "Nurture",        order: 9, isDefault: true },
      ],
    },

    // ─── Soft Delete ──────────────────────────────────────────────────────────

    /**
     * SOFT DELETE DESIGN
     * ───────────────────
     * Tenants are NEVER permanently deleted from the database because:
     *
     *   1. REFERENTIAL INTEGRITY — payments, leads, bookings, audit logs, and
     *      tracking events all reference tenantId. Hard-deleting a tenant would
     *      orphan thousands of documents and break historical reports.
     *
     *   2. AUDIT & COMPLIANCE — billing history, payment records, and audit logs
     *      must be retained for regulatory/accounting purposes even after a
     *      tenant churns (typically 7 years for financial records).
     *
     *   3. RECOVERY — accidental deletion of a tenant workspace must be
     *      reversible by a super_admin within a recovery window.
     *
     * HOW SOFT DELETE WORKS:
     *   - Setting deletedAt marks the tenant as deleted.
     *   - All queries MUST filter { deletedAt: null } to exclude deleted tenants.
     *   - Use the static findActiveTenants() and findBySlug() helpers which
     *     already apply this filter.
     *   - For custom queries, always add: .where({ deletedAt: null })
     *   - A Mongoose pre-find middleware (not implemented here) can auto-apply
     *     this filter globally — recommended for production.
     *
     * WHAT HAPPENS AFTER SOFT DELETE:
     *   - workspaceStatus → "inactive" (blocks API access)
     *   - subscriptionStatus → "cancelled"
     *   - isActive → false
     *   - The workspace slug is freed after a 30-day recovery window
     *     (business logic in service layer, not enforced here).
     *
     * PERMANENT DELETION:
     *   Should only occur after the retention period expires and must be
     *   triggered by an explicit super_admin action, never automatically.
     */
    deletedAt: { type: Date, default: null },
    deletedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // ─── Audit Fields ─────────────────────────────────────────────────────────

    /**
     * createdBy — super_admin who provisioned this tenant.
     * null for future self-sign-up flows.
     */
    createdBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },

  {
    timestamps: true,

    /**
     * toJSON transform — controls API response serialisation.
     *
     * Security actions applied on every JSON serialisation:
     * 1. Rename _id → id (cleaner REST API convention)
     * 2. Remove __v (Mongoose internal versioning key)
     * 3. Strip ALL credential fields (accessToken, apiKey, aiApiKey, etc.)
     * 4. Strip internal billing IDs (razorpay*) — not needed client-side
     *
     * This is defence-in-depth. The primary protection is select:false on
     * credential fields. The toJSON strip catches anything that slips through.
     */
    toJSON: {
      virtuals: true,
      transform(doc, ret) {
        // Clean up MongoDB internals
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;

        // ⚠️ Strip ALL credential and sensitive billing fields
        // These must NEVER appear in API responses
        delete ret.razorpaySubscriptionId;
        delete ret.razorpayCustomerId;

        if (ret.whatsAppSettings) {
          delete ret.whatsAppSettings.accessToken;
          delete ret.whatsAppSettings.apiKey;
          delete ret.whatsAppSettings.webhookVerifyToken;
          delete ret.whatsAppSettings.phoneNumberId; // Internal provider ID
        }

        if (ret.aiConfig) {
          delete ret.aiConfig.aiApiKey;
        }

        return ret;
      },
    },

    toObject: {
      virtuals: true,
    },
  }
);

// =============================================================================
// VIRTUAL FIELDS
// =============================================================================

/**
 * isSubscriptionActive — true if tenant is paying or in active trial.
 * Used by: auth middleware, billing UI upgrade prompts.
 */
tenantSchema.virtual("isSubscriptionActive").get(function () {
  return (
    this.subscriptionStatus === SUBSCRIPTION_STATUS.ACTIVE ||
    this.subscriptionStatus === SUBSCRIPTION_STATUS.TRIAL
  );
});

/**
 * isOnTrial — true if in trial period that has not yet expired.
 */
tenantSchema.virtual("isOnTrial").get(function () {
  return (
    this.subscriptionStatus === SUBSCRIPTION_STATUS.TRIAL &&
    this.trialEndsAt instanceof Date &&
    new Date() < this.trialEndsAt
  );
});

/**
 * trialDaysRemaining — integer days left in trial, or 0 if not on trial.
 */
tenantSchema.virtual("trialDaysRemaining").get(function () {
  if (!this.trialEndsAt || this.subscriptionStatus !== SUBSCRIPTION_STATUS.TRIAL) {
    return 0;
  }
  const diff = this.trialEndsAt.getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / 86_400_000)); // 86_400_000 ms = 1 day
});

/**
 * isDeleted — convenience flag to check soft-delete state.
 */
tenantSchema.virtual("isDeleted").get(function () {
  return this.deletedAt !== null && this.deletedAt !== undefined;
});

/**
 * usagePercentage — resource utilisation percentages (0–100).
 * Used in: Settings → Billing tab, Super Admin tenant rows.
 * Guards against division-by-zero when maxX is 0 (shouldn't happen, but safe).
 */
tenantSchema.virtual("usagePercentage").get(function () {
  const pct = (used, max) => (max > 0 ? Math.min(100, Math.round((used / max) * 100)) : 0);
  return {
    users:     pct(this.currentUserCount,     this.maxUsers),
    leads:     pct(this.currentLeadCount,     this.maxLeads),
    campaigns: pct(this.currentCampaignCount, this.maxCampaigns),
  };
});

// =============================================================================
// PRE-SAVE HOOKS
// =============================================================================

/**
 * HOOK 1 — Auto-generate slug from name (runs pre-validate).
 *
 * Converts "GrowthX Agency" → "growthx-agency"
 *
 * Collision handling: if the generated slug already exists in the database,
 * the unique index will reject the save with a duplicate key error (code 11000).
 * The service layer must catch this and append a short random suffix:
 *   "growthx-agency" → "growthx-agency-x4k2"
 * This is intentionally not handled here to keep the model lean.
 *
 * ⚠️  Slug immutability: changing a slug after creation breaks UTM tracking
 * links. The API should warn users and require explicit confirmation.
 */
tenantSchema.pre("validate", function (next) {
  if (!this.slug && this.name) {
    this.slug = this.name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")  // strip special characters
      .replace(/\s+/g, "-")           // spaces → hyphens
      .replace(/-+/g, "-")            // collapse consecutive hyphens
      .replace(/^-|-$/g, "");         // trim leading/trailing hyphens
  }
  next();
});

/**
 * HOOK 2 — Set plan limits on new tenant creation only.
 *
 * WHY only isNew and not on every plan change?
 * ─────────────────────────────────────────────
 * If we applied PLAN_LIMITS on every save where plan was modified, a
 * super_admin who manually set maxUsers=200 on an enterprise tenant would
 * lose that custom value the next time anything updated the document.
 *
 * Instead:
 * - New tenants: limits are set from PLAN_LIMITS[plan] (safe, no prior custom value)
 * - Plan upgrades: call the upgradePlan() method which explicitly sets limits
 * - Enterprise custom overrides: update maxUsers/maxLeads/maxCampaigns directly
 *   via a super_admin API endpoint (bypasses this hook)
 *
 * This design preserves custom limits while still auto-setting defaults.
 */
tenantSchema.pre("save", function (next) {
  if (this.isNew) {
    const limits = PLAN_LIMITS[this.plan];
    if (limits) {
      this.maxUsers     = limits.maxUsers;
      this.maxLeads     = limits.maxLeads;
      this.maxCampaigns = limits.maxCampaigns;
    }
  }
  next();
});

/**
 * HOOK 3 — Set trial expiry date on new tenant creation.
 * 14-day free trial from the moment of workspace creation.
 */
tenantSchema.pre("save", function (next) {
  if (this.isNew && !this.trialEndsAt) {
    const trialEnd = new Date();
    trialEnd.setDate(trialEnd.getDate() + 14);
    this.trialEndsAt = trialEnd;
  }
  next();
});

/**
 * HOOK 4 — Keep isActive in sync with workspaceStatus.
 * isActive is always the computed result of workspaceStatus === "active".
 * Never set isActive directly.
 */
tenantSchema.pre("save", function (next) {
  if (this.isModified("workspaceStatus") || this.isNew) {
    this.isActive = this.workspaceStatus === WORKSPACE_STATUS.ACTIVE;
  }
  next();
});

/**
 * HOOK 5 — Stamp suspendedAt timestamp when workspace is suspended.
 * Only stamps on first suspension (avoids overwriting the original timestamp
 * if the tenant is suspended, reactivated, and re-suspended).
 */
tenantSchema.pre("save", function (next) {
  if (
    this.isModified("workspaceStatus") &&
    this.workspaceStatus === WORKSPACE_STATUS.SUSPENDED &&
    !this.suspendedAt
  ) {
    this.suspendedAt = new Date();
  }
  next();
});

// =============================================================================
// INSTANCE METHODS
// =============================================================================

/**
 * canCreateUser()
 * Called by: POST /api/team/invite — before creating a new user.
 * @returns {boolean}
 */
tenantSchema.methods.canCreateUser = function () {
  return this.currentUserCount < this.maxUsers;
};

/**
 * canCreateLead()
 * Called by: POST /api/leads — before creating a new lead.
 * @returns {boolean}
 */
tenantSchema.methods.canCreateLead = function () {
  return this.currentLeadCount < this.maxLeads;
};

/**
 * canCreateCampaign()
 * Called by: POST /api/campaigns and POST /api/whatsapp/campaigns.
 * @returns {boolean}
 */
tenantSchema.methods.canCreateCampaign = function () {
  return this.currentCampaignCount < this.maxCampaigns;
};

/**
 * isSuspended()
 * Used by auth middleware to block API access with a 403 response.
 * @returns {boolean}
 */
tenantSchema.methods.isSuspended = function () {
  return this.workspaceStatus === WORKSPACE_STATUS.SUSPENDED;
};

/**
 * isAccessible()
 * Convenience method combining workspace and subscription checks.
 * Auth middleware can call this as a single gate.
 *
 * Returns { allowed: boolean, reason: string }
 * Reason is a machine-readable code for the API to translate into a
 * user-facing message on the frontend.
 */
tenantSchema.methods.isAccessible = function () {
  if (this.deletedAt) {
    return { allowed: false, reason: "WORKSPACE_DELETED" };
  }
  if (this.workspaceStatus === WORKSPACE_STATUS.SUSPENDED) {
    return { allowed: false, reason: "WORKSPACE_SUSPENDED" };
  }
  if (this.workspaceStatus === WORKSPACE_STATUS.INACTIVE) {
    return { allowed: false, reason: "WORKSPACE_INACTIVE" };
  }
  if (
    this.subscriptionStatus === SUBSCRIPTION_STATUS.INACTIVE ||
    this.subscriptionStatus === SUBSCRIPTION_STATUS.CANCELLED
  ) {
    return { allowed: false, reason: "SUBSCRIPTION_LAPSED" };
  }
  return { allowed: true, reason: null };
};

/**
 * softDelete(deletedByUserId)
 * Marks the tenant as deleted without removing it from the database.
 * Call .save() after this to persist.
 *
 * Side effects (applied here, persisted on save):
 * - deletedAt = now
 * - workspaceStatus = "inactive" (blocks API access)
 * - subscriptionStatus = "cancelled"
 * - isActive = false (via Hook 4)
 *
 * @param {ObjectId|string} deletedByUserId — super_admin performing deletion
 * @returns {Tenant} this (chainable)
 */
tenantSchema.methods.softDelete = function (deletedByUserId) {
  this.deletedAt          = new Date();
  this.deletedBy          = deletedByUserId;
  this.workspaceStatus    = WORKSPACE_STATUS.INACTIVE;
  this.subscriptionStatus = SUBSCRIPTION_STATUS.CANCELLED;
  // isActive will be set to false by Hook 4 on save
  return this;
};

/**
 * upgradePlan(newPlan)
 * Upgrades (or downgrades) the tenant to a new plan and applies the
 * corresponding resource limits from PLAN_LIMITS.
 *
 * USAGE:
 *   const tenant = await Tenant.findById(id);
 *   tenant.upgradePlan("growth");
 *   tenant.updatedBy = adminUserId;
 *   await tenant.save();
 *
 * For enterprise custom limits (different from PLAN_LIMITS defaults):
 *   await Tenant.findByIdAndUpdate(id, {
 *     plan: "enterprise",
 *     maxUsers: 200,           // custom override
 *     maxLeads: 100000,        // custom override
 *     maxCampaigns: 500,       // custom override
 *     subscriptionStatus: "active",
 *   });
 *   // Bypass upgradePlan() entirely for custom enterprise deals
 *
 * Existing usage counters (currentUserCount etc.) are NEVER reset on upgrade.
 * This is intentional: a tenant who has 12 users and upgrades from starter
 * to growth should keep their 12 users.
 *
 * @param {string} newPlan — one of SUBSCRIPTION_PLANS values
 * @returns {Tenant} this (chainable)
 */
tenantSchema.methods.upgradePlan = function (newPlan) {
  if (!Object.values(SUBSCRIPTION_PLANS).includes(newPlan)) {
    throw new Error(
      `Invalid plan "${newPlan}". Must be one of: ${Object.values(SUBSCRIPTION_PLANS).join(", ")}`
    );
  }

  const limits = PLAN_LIMITS[newPlan];
  if (!limits) {
    // This should never happen if PLAN_LIMITS is kept in sync with SUBSCRIPTION_PLANS
    throw new Error(`No PLAN_LIMITS entry found for plan "${newPlan}". Add it to PLAN_LIMITS.`);
  }

  this.plan                = newPlan;
  this.maxUsers            = limits.maxUsers;
  this.maxLeads            = limits.maxLeads;
  this.maxCampaigns        = limits.maxCampaigns;
  this.subscriptionStatus  = SUBSCRIPTION_STATUS.ACTIVE;
  this.subscriptionStartDate = new Date();

  return this;
};

/**
 * getPublicProfile()
 * Safe tenant object for API responses.
 * Excludes all credential fields, billing IDs, and sensitive settings.
 *
 * Used in:
 * - GET /api/settings response (tenant owner)
 * - Super Admin tenant list
 * - JWT payload construction (id, name, slug, plan only)
 *
 * @returns {Object}
 */
tenantSchema.methods.getPublicProfile = function () {
  return {
    id:                   this._id,
    name:                 this.name,
    slug:                 this.slug,
    logo:                 this.logo,
    website:              this.website,
    businessType:         this.businessType,
    plan:                 this.plan,
    subscriptionStatus:   this.subscriptionStatus,
    workspaceStatus:      this.workspaceStatus,
    isActive:             this.isActive,
    isDeleted:            this.isDeleted,
    isSubscriptionActive: this.isSubscriptionActive,
    isOnTrial:            this.isOnTrial,
    trialDaysRemaining:   this.trialDaysRemaining,
    ownerName:            this.ownerName,
    ownerEmail:           this.ownerEmail,
    branding:             this.branding,
    notificationPreferences: this.notificationPreferences,
    usagePercentage:      this.usagePercentage,
    limits: {
      maxUsers:     this.maxUsers,
      maxLeads:     this.maxLeads,
      maxCampaigns: this.maxCampaigns,
    },
    usage: {
      currentUserCount:     this.currentUserCount,
      currentLeadCount:     this.currentLeadCount,
      currentCampaignCount: this.currentCampaignCount,
    },
    integrations: {
      metaConnected:           this.metaConnected,
      googleAdsConnected:      this.googleAdsConnected,
      whatsappConnected:       this.whatsappConnected,
      razorpayConnected:       this.razorpayConnected,
      openAIConnected:         this.openAIConnected,
      googleCalendarConnected: this.googleCalendarConnected,
      twilioConnected:         this.twilioConnected,
    },
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

// =============================================================================
// STATIC METHODS
// =============================================================================

/**
 * Tenant.findActiveTenants()
 * Returns all non-deleted, active tenants sorted by most recently created.
 * Used in: Super Admin panel → Tenants tab.
 *
 * Always excludes soft-deleted tenants ({ deletedAt: null }).
 */
tenantSchema.statics.findActiveTenants = function () {
  return this.find({
    deletedAt: null,
    isActive: true,
    workspaceStatus: WORKSPACE_STATUS.ACTIVE,
  }).sort({ createdAt: -1 });
};

/**
 * Tenant.findBySlug(slug)
 * Finds a non-deleted tenant by slug.
 * Used in: workspace resolution, subdomain routing.
 *
 * @param {string} slug
 * @returns {Promise<Tenant|null>}
 */
tenantSchema.statics.findBySlug = function (slug) {
  return this.findOne({
    slug: slug.toLowerCase().trim(),
    deletedAt: null,
  });
};

/**
 * Tenant.findAllIncludingDeleted()
 * Returns all tenants, including soft-deleted ones.
 * Used by: super_admin data recovery UI, compliance exports.
 * Should ONLY be called from super_admin-gated API endpoints.
 *
 * @returns {Promise<Tenant[]>}
 */
tenantSchema.statics.findAllIncludingDeleted = function () {
  return this.find().sort({ createdAt: -1 });
};

/**
 * Tenant.getPlatformKpis()
 * Aggregates platform-wide KPIs for the Super Admin dashboard.
 * Source: MASTER_SPEC.md §B19 — Platform KPIs (tenants, users, MRR, active).
 *
 * Excludes soft-deleted tenants from all counts.
 *
 * @returns {Promise<{totalTenants, activeTenants, trialTenants, paidTenants, totalMrr}>}
 */
tenantSchema.statics.getPlatformKpis = async function () {
  const result = await this.aggregate([
    { $match: { deletedAt: null } }, // exclude soft-deleted tenants
    {
      $group: {
        _id: null,
        totalTenants: { $sum: 1 },
        activeTenants: {
          $sum: { $cond: [{ $eq: ["$workspaceStatus", WORKSPACE_STATUS.ACTIVE] }, 1, 0] },
        },
        trialTenants: {
          $sum: { $cond: [{ $eq: ["$subscriptionStatus", SUBSCRIPTION_STATUS.TRIAL] }, 1, 0] },
        },
        paidTenants: {
          $sum: { $cond: [{ $eq: ["$subscriptionStatus", SUBSCRIPTION_STATUS.ACTIVE] }, 1, 0] },
        },
        totalMrr: { $sum: "$mrr" },
      },
    },
    { $project: { _id: 0 } },
  ]);

  return result[0] ?? {
    totalTenants:  0,
    activeTenants: 0,
    trialTenants:  0,
    paidTenants:   0,
    totalMrr:      0,
  };
};

// =============================================================================
// INDEXES
// =============================================================================

/**
 * INDEX STRATEGY
 * ──────────────
 * The Tenant collection is the root entity — queried by slug, by super_admin
 * filters, and by billing analytics. The collection is expected to stay small
 * (thousands of tenants, not millions), so index overhead is minimal.
 *
 * NOTES:
 * - The { slug: 1 } unique index defined in the schema field (unique:true)
 *   already creates a unique index. We do NOT re-declare it here to avoid
 *   creating a duplicate index. Mongoose deduplicates schema-level unique
 *   indexes vs. tenantSchema.index() calls, but it's safer to keep them in
 *   one place. The slug unique index is implicit from the field definition.
 *
 * - All admin/analytics queries filter { deletedAt: null } first. Including
 *   deletedAt in compound indexes would help but adds complexity. Given the
 *   small collection size, a sparse index on deletedAt alone is sufficient.
 */

// Billing communications and account recovery
// Query: "find tenant by owner email for password reset / billing webhook"
tenantSchema.index({ ownerEmail: 1 });

// Super Admin panel — filter by businessType
// Query: "show me all edtech tenants"
tenantSchema.index({ businessType: 1 });

// Subscription analytics — most common Super Admin filters
// Query: "show active growth-plan tenants"
tenantSchema.index({ plan: 1, subscriptionStatus: 1 });

// Workspace access check — hit on every authenticated request
// Query: "is this workspace active?" (auth middleware)
tenantSchema.index({ workspaceStatus: 1, isActive: 1 });

// Trial expiry cron job
// Query: "find all trial tenants where trialEndsAt < now()"
tenantSchema.index({ subscriptionStatus: 1, trialEndsAt: 1 });

// Soft delete — quickly filter out deleted tenants in list queries
// Sparse because most tenants have deletedAt: null (saves index space)
tenantSchema.index({ deletedAt: 1 }, { sparse: true });

// MRR analytics — sort by revenue in Super Admin platform KPIs
tenantSchema.index({ mrr: -1 });

// =============================================================================
// MODEL EXPORT
// =============================================================================

const Tenant = mongoose.model("Tenant", tenantSchema);

export default Tenant;

/**
 * Named exports — constants importable without the full model:
 *
 *   import Tenant, {
 *     BUSINESS_TYPES,
 *     SUBSCRIPTION_PLANS,
 *     SUBSCRIPTION_STATUS,
 *     WORKSPACE_STATUS,
 *     PLAN_LIMITS,
 *     AI_MODELS,
 *   } from "./Tenant.js";
 */
export {
  BUSINESS_TYPES,
  SUBSCRIPTION_PLANS,
  SUBSCRIPTION_STATUS,
  WORKSPACE_STATUS,
  PLAN_LIMITS,
  AI_MODELS,
};