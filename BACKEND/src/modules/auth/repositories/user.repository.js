

import User from '../models/User.js';

/** findById — find user by ID without password. */
export const findById = (id) =>
  User.findById(id);

/**
 * findByIdWithPassword — for change-password flow only.
 * Explicitly selects password + lockout fields.
 */
export const findByIdWithPassword = (id) =>
  User.findById(id).select('+password +loginAttempts +lockUntil +isLocked');

/** findByEmail — find user by email without password. */
export const findByEmail = (email) =>
  User.findByEmail(email);

/**
 * findByEmailWithPassword — for login auth flow only.
 * NEVER use outside authentication service.
 */
export const findByEmailWithPassword = (email) =>
  User.findByEmailWithPassword(email);

/** findByEmailAndTenant — tenant-scoped email lookup. */
export const findByEmailAndTenant = (email, tenantId) =>
  User.findOne({ email: email.toLowerCase().trim(), tenantId });

/**
 * create — creates a new user document outside of a transaction.
 * Password is hashed by User.js pre-save Hook 2 automatically.
 * @param {Object} data
 * @returns {Promise<User>}
 */
export const create = (data) =>
  User.create(data);

/**
 * createWithSession — creates a user document INSIDE a MongoDB transaction.
 * Required when called from auth.service.js _registerTenantOwner() which
 * wraps Tenant + User creation in a session for atomic consistency.
 *
 * Mongoose requires passing { session } when creating inside a transaction.
 * Returns an array [user] (Mongoose session syntax returns array).
 *
 * @param {Object} data
 * @param {mongoose.ClientSession} session — active MongoDB transaction session
 * @returns {Promise<User[]>} — array with one element
 */
export const createWithSession = (data, session) =>
  User.create([data], { session });

/**
 * updateById — partial update. Returns updated document.
 */
export const updateById = (id, update) =>
  User.findByIdAndUpdate(id, update, { new: true, runValidators: true });

/** updateLastLogin — stamps lastLogin timestamp on successful login. */
export const updateLastLogin = (id) =>
  User.findByIdAndUpdate(id, { $set: { lastLogin: new Date() } });

/**
 * updatePassword — updates hashed password directly (bypasses pre-save hook).
 * Use ONLY when password is already hashed (e.g. after password reset).
 * Also stamps passwordChangedAt.
 */
export const updatePassword = (id, hashedPassword) =>
  User.findByIdAndUpdate(id, {
    $set: {
      password:          hashedPassword,
      passwordChangedAt: new Date(),
    },
  });

/** verifyEmail — marks email as verified. */
export const verifyEmail = (id) =>
  User.findByIdAndUpdate(id, {
    $set: { isEmailVerified: true, emailVerifiedAt: new Date() },
  });

/** findByTenantId — all users in a tenant with optional extra filter. */
export const findByTenantId = (tenantId, filter = {}) =>
  User.find({ tenantId, ...filter });

/** countByTenantId — count of active users in a tenant. */
export const countByTenantId = (tenantId) =>
  User.countDocuments({ tenantId, isActive: true });

/** existsByEmail — check if email is already taken globally. */
export const existsByEmail = (email) =>
  User.exists({ email: email.toLowerCase().trim() });