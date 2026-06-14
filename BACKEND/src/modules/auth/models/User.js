
import mongoose from 'mongoose';
import { hashPassword }       from '../../../utils/password.js';
import { ROLES }              from '../constants/roles.js';
import { getRolePermissions } from '../constants/rolePermissions.js';
import { USER_STATUS, ACCOUNT_LIMITS } from '../constants/auth.constants.js';

const { Schema } = mongoose;

// =============================================================================
// SCHEMA
// =============================================================================

const userSchema = new Schema(
  {
    // ── Identity ──────────────────────────────────────────────────────────────
    firstName: {
      type:      String,
      required:  [true, 'First name is required'],
      trim:      true,
      maxlength: [50, 'First name cannot exceed 50 characters'],
    },
    lastName: {
      type:      String,
      required:  [true, 'Last name is required'],
      trim:      true,
      maxlength: [50, 'Last name cannot exceed 50 characters'],
    },
    email: {
      type:      String,
      required:  [true, 'Email is required'],
      unique:    true,
      lowercase: true,
      trim:      true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,})+$/,
        'Please provide a valid email address',
      ],
    },
    phoneNumber:  { type: String, trim: true, default: null },
    profileImage: { type: String, default: null },

    // ── Authentication ────────────────────────────────────────────────────────
    password: {
      type:      String,
      required:  [true, 'Password is required'],
      minlength: [
        ACCOUNT_LIMITS.PASSWORD_MIN_LENGTH,
        `Password must be at least ${ACCOUNT_LIMITS.PASSWORD_MIN_LENGTH} characters`,
      ],
      select: false,
    },
    lastLogin:         { type: Date, default: null },
    passwordChangedAt: { type: Date, default: null },

    // ── Role ──────────────────────────────────────────────────────────────────
    role: {
      type:     String,
      required: [true, 'Role is required'],
      enum: {
        values:  Object.values(ROLES),
        message: `Role must be one of: ${Object.values(ROLES).join(', ')}`,
      },
    },

    // ── Tenant Association ────────────────────────────────────────────────────
    tenantId: {
      type:    Schema.Types.ObjectId,
      ref:     'Tenant',
      default: null,
      index:   true,
    },

    // ── Status ────────────────────────────────────────────────────────────────
    status: {
      type:    String,
      enum:    Object.values(USER_STATUS),
      default: USER_STATUS.ACTIVE,
      index:   true,
    },
    isActive: { type: Boolean, default: true, index: true },

    // ── Email Verification ────────────────────────────────────────────────────
    isEmailVerified: { type: Boolean, default: false },
    emailVerifiedAt: { type: Date,    default: null },

    // ── Permissions ───────────────────────────────────────────────────────────
    permissions: { type: [String], default: [] },

    // ── Security / Lockout ────────────────────────────────────────────────────
    loginAttempts: { type: Number,  default: 0,    select: false },
    lockUntil:     { type: Date,    default: null, select: false },
    isLocked:      { type: Boolean, default: false, select: false },

    // ── Audit ─────────────────────────────────────────────────────────────────
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        delete ret.password;
        delete ret.loginAttempts;
        delete ret.lockUntil;
        delete ret.isLocked;
        return ret;
      },
    },
    toObject: { virtuals: true },
  }
);

// =============================================================================
// VIRTUALS
// =============================================================================

userSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`.trim();
});

userSchema.virtual('isAccountLocked').get(function () {
  return !!(this.isLocked && this.lockUntil && this.lockUntil > Date.now());
});

// =============================================================================
// PRE-HOOKS — Mongoose v8 + transaction-safe pattern
// =============================================================================
//
// RULE: Every hook must be:   async function ()  with NO next parameter
//
// Why:
//   When User.create([data], { session }) is called inside a MongoDB
//   transaction, Kareem (Mongoose's hook runner) executes pre-hooks but
//   does NOT pass `next` as a parameter. Any hook declaring (next) will
//   receive undefined for next, and calling undefined() throws:
//     TypeError: next is not a function
//
//   The async function() pattern works because Mongoose v8 awaits the
//   returned Promise instead of waiting for next() to be called.
//   Throw an error to abort. Return to continue.
//
// =============================================================================

/**
 * HOOK 1 — Validate super_admin has no tenantId
 *
 * Only enforces the super_admin rule.
 * Does NOT block other roles from having null tenantId — that is handled
 * at the service layer which creates Tenant first, then passes tenantId
 * to User.create().
 */
userSchema.pre('validate', async function () {
  if (this.role === ROLES.SUPER_ADMIN && this.tenantId != null) {
    throw new Error('super_admin must not have a tenantId');
  }
});

/**
 * HOOK 2 — Hash password before save
 *
 * Skips if password was not modified (prevents re-hashing on unrelated saves).
 * hashPassword() throws on failure — Mongoose catches and propagates it.
 */
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await hashPassword(this.password);
  if (!this.isNew) {
    this.passwordChangedAt = new Date();
  }
});

/**
 * HOOK 3 — Seed default permissions on new user
 *
 * Runs only on first save (isNew).
 * Existing users keep their permissions untouched.
 */
userSchema.pre('save', async function () {
  if (this.isNew && this.role && this.permissions.length === 0) {
    this.permissions = getRolePermissions(this.role);
  }
});

/**
 * HOOK 4 — Sync isActive with status
 *
 * isActive is a denormalised boolean for fast indexed queries.
 * Always mirrors: status === 'active'
 */
userSchema.pre('save', async function () {
  if (this.isModified('status') || this.isNew) {
    this.isActive = this.status === USER_STATUS.ACTIVE;
  }
});

// =============================================================================
// INSTANCE METHODS
// =============================================================================

userSchema.methods.getPublicProfile = function () {
  return {
    id:              this._id,
    firstName:       this.firstName,
    lastName:        this.lastName,
    fullName:        this.fullName,
    email:           this.email,
    phoneNumber:     this.phoneNumber,
    role:            this.role,
    tenantId:        this.tenantId,
    profileImage:    this.profileImage,
    status:          this.status,
    isActive:        this.isActive,
    isEmailVerified: this.isEmailVerified,
    permissions:     this.permissions,
    lastLogin:       this.lastLogin,
    createdAt:       this.createdAt,
  };
};

userSchema.methods.hasPermission = function (permission) {
  return this.permissions.includes(permission);
};

userSchema.methods.isSuperAdmin = function () {
  return this.role === ROLES.SUPER_ADMIN;
};

userSchema.methods.belongsToTenant = function (tenantId) {
  if (!this.tenantId) return false;
  return this.tenantId.toString() === tenantId.toString();
};

userSchema.methods.incrementLoginAttempts = async function () {
  const newAttempts = (this.loginAttempts || 0) + 1;
  if (newAttempts >= ACCOUNT_LIMITS.MAX_LOGIN_ATTEMPTS) {
    const lockUntil = new Date(
      Date.now() + ACCOUNT_LIMITS.LOCKOUT_DURATION_MINUTES * 60 * 1000
    );
    await this.constructor.findByIdAndUpdate(this._id, {
      $set: { isLocked: true, lockUntil },
      $inc: { loginAttempts: 1 },
    });
  } else {
    await this.constructor.findByIdAndUpdate(this._id, {
      $inc: { loginAttempts: 1 },
    });
  }
};

userSchema.methods.resetLoginAttempts = async function () {
  await this.constructor.findByIdAndUpdate(this._id, {
    $set: { loginAttempts: 0, isLocked: false, lockUntil: null },
  });
};

// =============================================================================
// STATIC METHODS
// =============================================================================

userSchema.statics.findByEmail = function (email) {
  return this.findOne({ email: email.toLowerCase().trim() });
};

userSchema.statics.findByEmailWithPassword = function (email) {
  return this.findOne({ email: email.toLowerCase().trim() })
    .select('+password +loginAttempts +lockUntil +isLocked');
};

userSchema.statics.findActiveByTenant = function (tenantId) {
  return this.find({ tenantId, isActive: true, status: USER_STATUS.ACTIVE });
};

// =============================================================================
// INDEXES
// =============================================================================

userSchema.index({ email: 1 },             { unique: true });
userSchema.index({ role: 1 });
userSchema.index({ tenantId: 1, role: 1 });
userSchema.index({ tenantId: 1, status: 1 });
userSchema.index({ tenantId: 1, isActive: 1 });

// =============================================================================
// EXPORT
// =============================================================================

export default mongoose.model('User', userSchema);