/**
 * WhatsApp Analytics — repository.
 *
 * AGGREGATION ONLY. No business logic, no percentage math, no formatting.
 * Reads from existing collections; never writes. Every query is tenant-scoped.
 *
 * Field-name notes (verified against the real models):
 *   • Conversation / Message use snake_case: tenant_id, created_at, etc.
 *   • DeliveryLog / Campaign / Broadcast / Consent / Template / Automation /
 *     Nurture use camelCase: tenantId, createdAt, etc.
 */
import { Conversation } from '../../conversations/conversation.model.js';
import { Message } from '../../messages/message.model.js';
import { WhatsAppContact } from '../contacts/contacts.model.js';
import { WhatsAppCampaign } from '../campaigns/campaigns.model.js';
import { WhatsAppBroadcast } from '../broadcasts/broadcasts.model.js';
import { WhatsAppTemplate } from '../templates/templates.model.js';
import { DeliveryLog } from '../deliveryLogs/deliveryLogs.model.js';
import { Consent } from '../consent/consent.model.js';
import { AutomationRule, AutomationRuleHistory } from '../automationRules/automationRules.model.js';
import { AIReplyPrompt } from '../aiReplyAssistant/aiReplyAssistant.model.js';
import { NurtureSequence, NurtureEnrollment } from '../nurtures/nurtures.model.js';

// ── Date-range helpers ─────────────────────────────────────────────────────────

/** Build a date sub-filter for camelCase collections (createdAt). */
function dateRangeCamel(field, dateFrom, dateTo) {
  if (!dateFrom && !dateTo) return {};
  const range = {};
  if (dateFrom) range.$gte = new Date(dateFrom);
  if (dateTo)   range.$lte = new Date(dateTo);
  return { [field]: range };
}

/** Build a date sub-filter for snake_case collections (created_at). */
function dateRangeSnake(field, dateFrom, dateTo) {
  return dateRangeCamel(field, dateFrom, dateTo);
}

export const whatsappAnalyticsRepository = {
  // ── Conversations ───────────────────────────────────────────────────────────

  conversationStatusBreakdown(tenantId, { dateFrom, dateTo } = {}) {
    return Conversation.aggregate([
      { $match: { tenant_id: tenantId, ...dateRangeSnake('created_at', dateFrom, dateTo) } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);
  },

  conversationTotals(tenantId, { dateFrom, dateTo } = {}) {
    return Conversation.aggregate([
      { $match: { tenant_id: tenantId, ...dateRangeSnake('created_at', dateFrom, dateTo) } },
      {
        $group: {
          _id: null,
          total:        { $sum: 1 },
          unreadTotal:  { $sum: { $cond: [{ $gt: ['$unread_count', 0] }, 1, 0] } },
          unreadCount:  { $sum: '$unread_count' },
        },
      },
    ]);
  },

  // ── Messages ────────────────────────────────────────────────────────────────

  messageDirectionBreakdown(tenantId, { dateFrom, dateTo } = {}) {
    return Message.aggregate([
      { $match: { tenant_id: tenantId, ...dateRangeSnake('created_at', dateFrom, dateTo) } },
      { $group: { _id: '$direction', count: { $sum: 1 } } },
    ]);
  },

  messagesPerConversation(tenantId) {
    return Message.aggregate([
      { $match: { tenant_id: tenantId } },
      { $group: { _id: '$conversation_id', messageCount: { $sum: 1 } } },
      { $group: { _id: null, avgMessages: { $avg: '$messageCount' }, conversations: { $sum: 1 } } },
    ]);
  },

  // ── Delivery Logs (canonical message lifecycle) ──────────────────────────────

  deliveryStatusBreakdown(tenantId, filters = {}) {
    const match = { tenantId, ...dateRangeCamel('createdAt', filters.dateFrom, filters.dateTo) };
    if (filters.provider)   match.provider = filters.provider;
    if (filters.campaignId) match.campaignId = filters.campaignId;
    if (filters.broadcastId) match.broadcastId = filters.broadcastId;
    if (filters.templateId) match.templateId = filters.templateId;
    if (filters.messageType) match.messageType = filters.messageType;
    return DeliveryLog.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$status',
          count:    { $sum: 1 },
          retrySum: { $sum: '$retryCount' },
        },
      },
    ]);
  },

  deliveryRetryTotal(tenantId, filters = {}) {
    const match = { tenantId, ...dateRangeCamel('createdAt', filters.dateFrom, filters.dateTo) };
    return DeliveryLog.aggregate([
      { $match: match },
      { $group: { _id: null, retryTotal: { $sum: '$retryCount' } } },
    ]);
  },

  /** Average delivery time (sentAt → deliveredAt) in milliseconds. */
  averageDeliveryTime(tenantId, filters = {}) {
    const match = {
      tenantId,
      sentAt: { $ne: null },
      deliveredAt: { $ne: null },
      ...dateRangeCamel('createdAt', filters.dateFrom, filters.dateTo),
    };
    return DeliveryLog.aggregate([
      { $match: match },
      { $project: { deltaMs: { $subtract: ['$deliveredAt', '$sentAt'] } } },
      { $group: { _id: null, avgMs: { $avg: '$deltaMs' }, samples: { $sum: 1 } } },
    ]);
  },

  /** Provider-wise delivery breakdown. */
  deliveryByProvider(tenantId, filters = {}) {
    const match = { tenantId, ...dateRangeCamel('createdAt', filters.dateFrom, filters.dateTo) };
    return DeliveryLog.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$provider',
          sent:      { $sum: { $cond: [{ $eq: ['$status', 'SENT'] }, 1, 0] } },
          delivered: { $sum: { $cond: [{ $eq: ['$status', 'DELIVERED'] }, 1, 0] } },
          read:      { $sum: { $cond: [{ $eq: ['$status', 'READ'] }, 1, 0] } },
          failed:    { $sum: { $cond: [{ $eq: ['$status', 'FAILED'] }, 1, 0] } },
          retryCount:{ $sum: '$retryCount' },
          total:     { $sum: 1 },
        },
      },
      { $sort: { total: -1 } },
    ]);
  },

  /** Top templates by delivery-log volume, with status breakdown. */
  topTemplatesByDelivery(tenantId, limit, filters = {}) {
    const match = { tenantId, templateId: { $ne: null }, ...dateRangeCamel('createdAt', filters.dateFrom, filters.dateTo) };
    return DeliveryLog.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$templateId',
          sent:      { $sum: { $cond: [{ $eq: ['$status', 'SENT'] }, 1, 0] } },
          delivered: { $sum: { $cond: [{ $eq: ['$status', 'DELIVERED'] }, 1, 0] } },
          read:      { $sum: { $cond: [{ $eq: ['$status', 'READ'] }, 1, 0] } },
          failed:    { $sum: { $cond: [{ $eq: ['$status', 'FAILED'] }, 1, 0] } },
          total:     { $sum: 1 },
        },
      },
      { $sort: { total: -1 } },
      { $limit: limit },
      {
        $lookup: {
          from: WhatsAppTemplate.collection.name,
          localField: '_id',
          foreignField: '_id',
          as: 'template',
        },
      },
      { $addFields: { templateName: { $ifNull: [{ $first: '$template.name' }, 'Unknown'] } } },
      { $project: { template: 0 } },
    ]);
  },

  // ── Contacts ────────────────────────────────────────────────────────────────

  contactCount(tenantId, { dateFrom, dateTo } = {}) {
    return WhatsAppContact.countDocuments({ tenantId, ...dateRangeCamel('createdAt', dateFrom, dateTo) });
  },

  // ── Campaigns ───────────────────────────────────────────────────────────────

  campaignStatusBreakdown(tenantId, { dateFrom, dateTo } = {}) {
    return WhatsAppCampaign.aggregate([
      { $match: { tenantId, ...dateRangeCamel('createdAt', dateFrom, dateTo) } },
      {
        $group: {
          _id: '$status',
          count:        { $sum: 1 },
          recipients:   { $sum: '$metrics.recipientCount' },
          sent:         { $sum: '$metrics.sentCount' },
          delivered:    { $sum: '$metrics.deliveredCount' },
          read:         { $sum: '$metrics.readCount' },
          failed:       { $sum: '$metrics.failedCount' },
        },
      },
    ]);
  },

  campaignMetricTotals(tenantId, { dateFrom, dateTo } = {}) {
    return WhatsAppCampaign.aggregate([
      { $match: { tenantId, ...dateRangeCamel('createdAt', dateFrom, dateTo) } },
      {
        $group: {
          _id: null,
          total:      { $sum: 1 },
          recipients: { $sum: '$metrics.recipientCount' },
          delivered:  { $sum: '$metrics.deliveredCount' },
          read:       { $sum: '$metrics.readCount' },
          failed:     { $sum: '$metrics.failedCount' },
        },
      },
    ]);
  },

  // ── Broadcasts ──────────────────────────────────────────────────────────────

  broadcastStatusBreakdown(tenantId, { dateFrom, dateTo } = {}) {
    return WhatsAppBroadcast.aggregate([
      { $match: { tenantId, ...dateRangeCamel('createdAt', dateFrom, dateTo) } },
      {
        $group: {
          _id: '$status',
          count:      { $sum: 1 },
          delivered:  { $sum: '$metrics.deliveredCount' },
          read:       { $sum: '$metrics.readCount' },
          failed:     { $sum: '$metrics.failedCount' },
        },
      },
    ]);
  },

  // ── Templates ───────────────────────────────────────────────────────────────

  templateCount(tenantId) {
    return WhatsAppTemplate.countDocuments({ tenantId });
  },

  topTemplatesByUsage(tenantId, limit) {
    return WhatsAppTemplate.aggregate([
      { $match: { tenantId } },
      { $sort: { usageCount: -1 } },
      { $limit: limit },
      { $project: { name: 1, category: 1, status: 1, approvalStatus: 1, usageCount: 1 } },
    ]);
  },

  // ── Consent ─────────────────────────────────────────────────────────────────

  consentStatusBreakdown(tenantId, { dateFrom, dateTo } = {}) {
    return Consent.aggregate([
      { $match: { tenantId, ...dateRangeCamel('createdAt', dateFrom, dateTo) } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);
  },

  // ── Automation ──────────────────────────────────────────────────────────────

  automationRuleCounts(tenantId) {
    return AutomationRule.aggregate([
      { $match: { tenantId } },
      {
        $group: {
          _id: null,
          total:       { $sum: 1 },
          active:      { $sum: { $cond: [{ $eq: ['$status', 'ACTIVE'] }, 1, 0] } },
          executions:  { $sum: '$executionCount' },
        },
      },
    ]);
  },

  automationHistoryStats(tenantId, { dateFrom, dateTo } = {}) {
    return AutomationRuleHistory.aggregate([
      { $match: { tenantId, ...dateRangeCamel('startedAt', dateFrom, dateTo) } },
      {
        $group: {
          _id: null,
          executions:  { $sum: 1 },
          success:     { $sum: { $cond: [{ $eq: ['$status', 'SUCCESS'] }, 1, 0] } },
          partial:     { $sum: { $cond: [{ $eq: ['$status', 'PARTIAL'] }, 1, 0] } },
          failed:      { $sum: { $cond: [{ $eq: ['$status', 'FAILED'] }, 1, 0] } },
          avgDuration: { $avg: '$duration' },
        },
      },
    ]);
  },

  // ── AI Reply Assistant ───────────────────────────────────────────────────────
  // The AIReplyPrompt collection tracks reusable prompts + usageCount.
  // "Replies generated" is approximated by the sum of prompt usageCount.

  aiPromptStats(tenantId) {
    return AIReplyPrompt.aggregate([
      { $match: { tenantId } },
      {
        $group: {
          _id: null,
          prompts:        { $sum: 1 },
          activePrompts:  { $sum: { $cond: ['$isActive', 1, 0] } },
          repliesGenerated: { $sum: '$usageCount' },
        },
      },
    ]);
  },

  // ── Nurtures ────────────────────────────────────────────────────────────────

  nurtureSequenceStats(tenantId) {
    return NurtureSequence.aggregate([
      { $match: { tenantId } },
      {
        $group: {
          _id: null,
          total:     { $sum: 1 },
          active:    { $sum: { $cond: [{ $eq: ['$status', 'ACTIVE'] }, 1, 0] } },
          completed: { $sum: { $cond: [{ $eq: ['$status', 'COMPLETED'] }, 1, 0] } },
          enrolled:  { $sum: '$enrollmentCount' },
        },
      },
    ]);
  },

  nurtureEnrollmentStats(tenantId) {
    return NurtureEnrollment.aggregate([
      { $match: { tenantId } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);
  },

  /** Count nurture messages sent + failed from embedded executionHistory. */
  nurtureMessageStats(tenantId) {
    return NurtureEnrollment.aggregate([
      { $match: { tenantId } },
      { $unwind: { path: '$executionHistory', preserveNullAndEmptyArrays: false } },
      {
        $group: {
          _id: null,
          messagesSent: { $sum: { $cond: [{ $eq: ['$executionHistory.status', 'SENT'] }, 1, 0] } },
          failures:     { $sum: { $cond: [{ $eq: ['$executionHistory.status', 'FAILED'] }, 1, 0] } },
        },
      },
    ]);
  },

  // ── Agents (per assigned_user_id) ─────────────────────────────────────────────

  agentConversationStats(tenantId, { dateFrom, dateTo } = {}) {
    return Conversation.aggregate([
      {
        $match: {
          tenant_id: tenantId,
          assigned_user_id: { $ne: null },
          ...dateRangeSnake('created_at', dateFrom, dateTo),
        },
      },
      {
        $group: {
          _id: '$assigned_user_id',
          conversations: { $sum: 1 },
          closed: {
            $sum: { $cond: [{ $in: ['$status', ['Won', 'Lost', 'Ghosted']] }, 1, 0] },
          },
        },
      },
      { $sort: { conversations: -1 } },
    ]);
  },

  agentMessageStats(tenantId, { dateFrom, dateTo } = {}) {
    return Message.aggregate([
      {
        $match: {
          tenant_id: tenantId,
          sender: { $ne: null },
          ...dateRangeSnake('created_at', dateFrom, dateTo),
        },
      },
      {
        $group: {
          _id: '$sender',
          messagesSent:     { $sum: { $cond: [{ $eq: ['$direction', 'outbound'] }, 1, 0] } },
          messagesReceived: { $sum: { $cond: [{ $eq: ['$direction', 'inbound'] }, 1, 0] } },
        },
      },
    ]);
  },

  // ── Trends (time-bucketed) ─────────────────────────────────────────────────────

  messageTrend(tenantId, dateFormat, { dateFrom, dateTo } = {}) {
    return Message.aggregate([
      { $match: { tenant_id: tenantId, ...dateRangeSnake('created_at', dateFrom, dateTo) } },
      {
        $group: {
          _id: { $dateToString: { format: dateFormat, date: '$created_at' } },
          messages: { $sum: 1 },
          inbound:  { $sum: { $cond: [{ $eq: ['$direction', 'inbound'] }, 1, 0] } },
          outbound: { $sum: { $cond: [{ $eq: ['$direction', 'outbound'] }, 1, 0] } },
        },
      },
      { $sort: { _id: 1 } },
    ]);
  },

  conversationTrend(tenantId, dateFormat, { dateFrom, dateTo } = {}) {
    return Conversation.aggregate([
      { $match: { tenant_id: tenantId, ...dateRangeSnake('created_at', dateFrom, dateTo) } },
      {
        $group: {
          _id: { $dateToString: { format: dateFormat, date: '$created_at' } },
          conversations: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);
  },

  deliveryTrend(tenantId, dateFormat, { dateFrom, dateTo } = {}) {
    return DeliveryLog.aggregate([
      { $match: { tenantId, ...dateRangeCamel('createdAt', dateFrom, dateTo) } },
      {
        $group: {
          _id: { $dateToString: { format: dateFormat, date: '$createdAt' } },
          deliveries: { $sum: { $cond: [{ $eq: ['$status', 'DELIVERED'] }, 1, 0] } },
          reads:      { $sum: { $cond: [{ $eq: ['$status', 'READ'] }, 1, 0] } },
        },
      },
      { $sort: { _id: 1 } },
    ]);
  },

  campaignTrend(tenantId, dateFormat, { dateFrom, dateTo } = {}) {
    return WhatsAppCampaign.aggregate([
      { $match: { tenantId, ...dateRangeCamel('createdAt', dateFrom, dateTo) } },
      {
        $group: {
          _id: { $dateToString: { format: dateFormat, date: '$createdAt' } },
          campaigns: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);
  },

  broadcastTrend(tenantId, dateFormat, { dateFrom, dateTo } = {}) {
    return WhatsAppBroadcast.aggregate([
      { $match: { tenantId, ...dateRangeCamel('createdAt', dateFrom, dateTo) } },
      {
        $group: {
          _id: { $dateToString: { format: dateFormat, date: '$createdAt' } },
          broadcasts: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);
  },
};
