/**
 * Notification Service — real ES Module implementation.
 *
 * FILE: src/modules/leads/notifications/notification.service.js
 *
 * WHAT CHANGED:
 *   - Replaced CommonJS (module.exports) with ES Module (export)
 *   - Replaced console.log with real Notification.create() DB writes
 *   - Added getNotifications, markRead, markAllRead for the notification bell
 *   - All fields match notification.model.js exactly:
 *     tenantId(String), userId(ObjectId), title, body, isRead, metadata
 *
 * SOURCE: FRONTEND_SPEC §3 Dashboard:
 *   "notification bell with unread count"
 * SOURCE: MASTER_SPEC §B20:
 *   "Notification bell with unread count, dropdown, mark read / mark all read;
 *    13 notification types."
 */

import Notification   from './notification.model.js';
import { AppError }   from '../../../shared/helpers/lead.helpers.js';

// =============================================================================
// CREATE NOTIFICATION — called by booking, call, qualification, payment services
// =============================================================================

/**
 * createNotification — writes a real notification to MongoDB.
 * Non-blocking — wrapped in try/catch so caller never crashes.
 *
 * @param {Object} data
 *   { tenantId, userId, title, body, metadata? }
 */
export const createNotification = async ({
  tenantId,
  userId,
  title,
  body = '',
  metadata = {},
}) => {
  try {
    if (!tenantId || !userId || !title) return null;

    const notification = await Notification.create({
      tenantId: String(tenantId),
      userId,
      title,
      body,
      isRead:   false,
      metadata,
    });

    return notification;
  } catch (err) {
    console.warn(`[notification] createNotification failed: ${err.message}`);
    return null;
  }
};

// =============================================================================
// GET NOTIFICATIONS — for the notification bell dropdown
// =============================================================================

/**
 * getNotifications — returns paginated notifications for a user.
 * SOURCE: MASTER_SPEC §B20 "notification bell with unread count, dropdown"
 *
 * @param {string} tenantId
 * @param {string} userId
 * @param {Object} options — { page, limit, unreadOnly }
 */
export const getNotifications = async (tenantId, userId, options = {}) => {
  const { page = 1, limit = 20, unreadOnly = false } = options;
  const skip = (page - 1) * limit;

  const query = {
    tenantId: String(tenantId),
    userId,
  };
  if (unreadOnly) query.isRead = false;

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(query)
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit),
    Notification.countDocuments(query),
    Notification.countDocuments({ tenantId: String(tenantId), userId, isRead: false }),
  ]);

  return {
    notifications,
    unreadCount,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNext:    page * limit < total,
    },
  };
};

// =============================================================================
// MARK READ
// =============================================================================

/**
 * markRead — marks a single notification as read.
 * SOURCE: MASTER_SPEC §B20 "mark read"
 */
export const markRead = async (tenantId, userId, notificationId) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: notificationId, tenantId: String(tenantId), userId },
    { $set: { isRead: true } },
    { new: true }
  );
  if (!notification) throw AppError.notFound('Notification not found');
  return notification;
};

/**
 * markAllRead — marks all notifications for a user as read.
 * SOURCE: MASTER_SPEC §B20 "mark all read"
 */
export const markAllRead = async (tenantId, userId) => {
  const result = await Notification.updateMany(
    { tenantId: String(tenantId), userId, isRead: false },
    { $set: { isRead: true } }
  );
  return { modifiedCount: result.modifiedCount };
};

// =============================================================================
// GET UNREAD COUNT — for the notification bell badge
// =============================================================================

/**
 * getUnreadCount — returns unread count for the notification bell badge.
 * SOURCE: FRONTEND_SPEC §3 "notification bell with unread count"
 */
export const getUnreadCount = (tenantId, userId) =>
  Notification.countDocuments({
    tenantId: String(tenantId),
    userId,
    isRead:   false,
  });

// =============================================================================
// DEFAULT EXPORT — for backward-compat if anything imports as default
// =============================================================================

export const notificationService = {
  createNotification,
  getNotifications,
  markRead,
  markAllRead,
  getUnreadCount,
};

export default notificationService;