/**
 * WhatsApp Analytics — service.
 *
 * Contains ALL business logic: percentage calculations, KPI assembly,
 * dashboard formatting, trend chart shaping, average computations.
 * Runs independent aggregations in parallel with Promise.all().
 *
 * Tenant isolation: ctx.tenantId is passed to every repository call.
 */
import { whatsappAnalyticsRepository as repo } from './whatsappAnalytics.repository.js';
import {
  TREND_DATE_FORMAT,
  TREND_PERIOD,
  CLOSED_CONVERSATION_STATUSES,
  ACTIVE_CONVERSATION_STATUSES,
  DELIVERY_STATUS,
  CONSENT_STATUS,
  TOP_TEMPLATES_LIMIT,
} from './whatsappAnalytics.constants.js';

// ── Math helpers ───────────────────────────────────────────────────────────────

/** Safe percentage with fixed precision; returns a Number. */
function pct(part, whole, digits = 2) {
  if (!whole || whole <= 0) return 0;
  return Number(((part / whole) * 100).toFixed(digits));
}

/** Convert a [{ _id, count }] aggregation into a plain { id: count } map. */
function toMap(rows = [], key = '_id', val = 'count') {
  const out = {};
  for (const r of rows) out[r[key]] = r[val];
  return out;
}

function first(rows = []) {
  return Array.isArray(rows) && rows.length ? rows[0] : {};
}

function pickFilters(query = {}) {
  return {
    dateFrom:    query.dateFrom,
    dateTo:      query.dateTo,
    provider:    query.provider,
    campaignId:  query.campaignId,
    broadcastId: query.broadcastId,
    templateId:  query.templateId,
    agentId:     query.agentId,
    status:      query.status,
    messageType: query.messageType,
  };
}

// ── Service ────────────────────────────────────────────────────────────────────

export const whatsappAnalyticsService = {
  // ── Dashboard (top-level KPIs) ──────────────────────────────────────────────

  async getDashboard(ctx, query = {}) {
    const f = pickFilters(query);
    const [
      convStatus, convTotals, msgDir, contactCount,
      templateCount, campaignTotals, broadcastRows,
      automationCounts, nurtureSeq, deliveryStatus,
    ] = await Promise.all([
      repo.conversationStatusBreakdown(ctx.tenantId, f),
      repo.conversationTotals(ctx.tenantId, f),
      repo.messageDirectionBreakdown(ctx.tenantId, f),
      repo.contactCount(ctx.tenantId, f),
      repo.templateCount(ctx.tenantId),
      repo.campaignMetricTotals(ctx.tenantId, f),
      repo.broadcastStatusBreakdown(ctx.tenantId, f),
      repo.automationRuleCounts(ctx.tenantId),
      repo.nurtureSequenceStats(ctx.tenantId),
      repo.deliveryStatusBreakdown(ctx.tenantId, f),
    ]);

    const convMap   = toMap(convStatus);
    const totalConv = Object.values(convMap).reduce((a, b) => a + b, 0);
    const closedConv = CLOSED_CONVERSATION_STATUSES.reduce((sum, s) => sum + (convMap[s] || 0), 0);
    const activeConv = ACTIVE_CONVERSATION_STATUSES.reduce((sum, s) => sum + (convMap[s] || 0), 0);

    const dirMap   = toMap(msgDir);
    const incoming = dirMap['inbound']  || 0;
    const outgoing = dirMap['outbound'] || 0;

    const delivMap   = toMap(deliveryStatus);
    const totalSends = Object.values(delivMap).reduce((a, b) => a + b, 0);
    const delivered  = delivMap[DELIVERY_STATUS.DELIVERED] || 0;
    const read       = delivMap[DELIVERY_STATUS.READ] || 0;
    // "Delivered + Read" are both successful deliveries (READ implies delivered).
    const successful = delivered + read;

    const broadcastTotal = broadcastRows.reduce((a, b) => a + b.count, 0);
    const campaignAgg    = first(campaignTotals);
    const automationAgg  = first(automationCounts);
    const nurtureAgg     = first(nurtureSeq);

    return {
      totalConversations:   totalConv,
      activeConversations:  activeConv,
      closedConversations:  closedConv,
      totalContacts:        contactCount,
      totalMessages:        incoming + outgoing,
      incomingMessages:     incoming,
      outgoingMessages:     outgoing,
      templates:            templateCount,
      campaigns:            campaignAgg.total || 0,
      broadcasts:           broadcastTotal,
      activeAutomations:    automationAgg.active || 0,
      activeNurtures:       nurtureAgg.active || 0,
      deliverySuccessRate:  pct(successful, totalSends),
      readRate:             pct(read, totalSends),
    };
  },

  // ── Message analytics ───────────────────────────────────────────────────────

  async getMessageAnalytics(ctx, query = {}) {
    const f = pickFilters(query);
    const [statusRows, avgDelivery] = await Promise.all([
      repo.deliveryStatusBreakdown(ctx.tenantId, f),
      repo.averageDeliveryTime(ctx.tenantId, f),
    ]);

    const m = toMap(statusRows);
    const queued    = m[DELIVERY_STATUS.QUEUED] || 0;
    const sent      = m[DELIVERY_STATUS.SENT] || 0;
    const delivered = m[DELIVERY_STATUS.DELIVERED] || 0;
    const read      = m[DELIVERY_STATUS.READ] || 0;
    const failed    = m[DELIVERY_STATUS.FAILED] || 0;
    const expired   = m[DELIVERY_STATUS.EXPIRED] || 0;
    const total     = Object.values(m).reduce((a, b) => a + b, 0);

    const avgMs = first(avgDelivery).avgMs || 0;

    return {
      queued, sent, delivered, read, failed, expired,
      total,
      deliveryRate: pct(delivered + read, total),
      readRate:     pct(read, total),
      failureRate:  pct(failed, total),
      averageDeliveryTimeMs:      Math.round(avgMs),
      averageDeliveryTimeSeconds: Number((avgMs / 1000).toFixed(2)),
    };
  },

  // ── Conversation analytics ──────────────────────────────────────────────────

  async getConversationAnalytics(ctx, query = {}) {
    const f = pickFilters(query);
    const [statusRows, totals, perConv] = await Promise.all([
      repo.conversationStatusBreakdown(ctx.tenantId, f),
      repo.conversationTotals(ctx.tenantId, f),
      repo.messagesPerConversation(ctx.tenantId),
    ]);

    const m = toMap(statusRows);
    const open   = ACTIVE_CONVERSATION_STATUSES.reduce((s, k) => s + (m[k] || 0), 0);
    const closed = CLOSED_CONVERSATION_STATUSES.reduce((s, k) => s + (m[k] || 0), 0);
    const t = first(totals);
    const pc = first(perConv);

    return {
      open,
      closed,
      unread: t.unreadTotal || 0,
      statusBreakdown: m,
      // First-response & resolution time require timestamp fields not tracked on
      // the conversation model yet; reported as null until those are persisted.
      averageFirstResponseTime: null,
      averageResolutionTime:    null,
      messagesPerConversation:  Number((pc.avgMessages || 0).toFixed(2)),
    };
  },

  // ── Campaign analytics ──────────────────────────────────────────────────────

  async getCampaignAnalytics(ctx, query = {}) {
    const f = pickFilters(query);
    const rows = await repo.campaignStatusBreakdown(ctx.tenantId, f);

    const byStatus = {};
    let total = 0, recipients = 0, delivered = 0, read = 0, failed = 0;
    for (const r of rows) {
      byStatus[r._id] = r.count;
      total      += r.count;
      recipients += r.recipients || 0;
      delivered  += r.delivered || 0;
      read       += r.read || 0;
      failed     += r.failed || 0;
    }

    return {
      totalCampaigns: total,
      running:   byStatus.RUNNING || 0,
      scheduled: byStatus.SCHEDULED || 0,
      completed: byStatus.COMPLETED || 0,
      failed:    byStatus.FAILED || 0,
      recipients,
      delivered,
      read,
      failedMessages: failed,
      successRate: pct(delivered + read, recipients),
    };
  },

  // ── Broadcast analytics ─────────────────────────────────────────────────────

  async getBroadcastAnalytics(ctx, query = {}) {
    const f = pickFilters(query);
    const rows = await repo.broadcastStatusBreakdown(ctx.tenantId, f);

    const byStatus = {};
    let total = 0, delivered = 0, read = 0, failed = 0;
    for (const r of rows) {
      byStatus[r._id] = r.count;
      total     += r.count;
      delivered += r.delivered || 0;
      read      += r.read || 0;
      failed    += r.failed || 0;
    }

    return {
      totalBroadcasts: total,
      running:   byStatus.RUNNING || 0,
      completed: byStatus.COMPLETED || 0,
      delivered,
      read,
      failed,
    };
  },

  // ── Template analytics ──────────────────────────────────────────────────────

  async getTemplateAnalytics(ctx, query = {}) {
    const f = pickFilters(query);
    const [topByDelivery, topByUsage] = await Promise.all([
      repo.topTemplatesByDelivery(ctx.tenantId, TOP_TEMPLATES_LIMIT, f),
      repo.topTemplatesByUsage(ctx.tenantId, TOP_TEMPLATES_LIMIT),
    ]);

    let sent = 0, delivered = 0, read = 0, failed = 0;
    const top10 = topByDelivery.map((t) => {
      sent      += t.sent;
      delivered += t.delivered;
      read      += t.read;
      failed    += t.failed;
      return {
        templateId:   String(t._id),
        templateName: t.templateName,
        sent:      t.sent,
        delivered: t.delivered,
        read:      t.read,
        failed:    t.failed,
        total:     t.total,
        successRate: pct(t.delivered + t.read, t.total),
      };
    });

    return {
      templateUsage: topByUsage.map((t) => ({
        templateId:   String(t._id),
        templateName: t.name,
        category:     t.category,
        status:       t.status,
        usageCount:   t.usageCount,
      })),
      sent, delivered, read, failed,
      successRate: pct(delivered + read, sent + delivered + read + failed),
      top10Templates: top10,
    };
  },

  // ── AI Reply analytics ──────────────────────────────────────────────────────

  async getAIAnalytics(ctx) {
    const stats = first(await repo.aiPromptStats(ctx.tenantId));
    const generated = stats.repliesGenerated || 0;
    // Acceptance tracking is not yet persisted on the prompt collection;
    // reported as null/0 until an AIReplyLog is introduced.
    return {
      repliesGenerated:    generated,
      repliesAccepted:     null,
      repliesRejected:     null,
      acceptanceRate:      null,
      averageGenerationTime: null,
      totalPrompts:        stats.prompts || 0,
      activePrompts:       stats.activePrompts || 0,
    };
  },

  // ── Automation analytics ────────────────────────────────────────────────────

  async getAutomationAnalytics(ctx, query = {}) {
    const f = pickFilters(query);
    const [ruleCounts, history] = await Promise.all([
      repo.automationRuleCounts(ctx.tenantId),
      repo.automationHistoryStats(ctx.tenantId, f),
    ]);
    const rc = first(ruleCounts);
    const h  = first(history);

    return {
      rules:      rc.total || 0,
      executions: h.executions || rc.executions || 0,
      success:    h.success || 0,
      failed:     h.failed || 0,
      partial:    h.partial || 0,
      averageExecutionTimeMs: Math.round(h.avgDuration || 0),
      successRate: pct(h.success || 0, h.executions || 0),
    };
  },

  // ── Nurture analytics ───────────────────────────────────────────────────────

  async getNurtureAnalytics(ctx) {
    const [seqStats, enrollRows, msgStats] = await Promise.all([
      repo.nurtureSequenceStats(ctx.tenantId),
      repo.nurtureEnrollmentStats(ctx.tenantId),
      repo.nurtureMessageStats(ctx.tenantId),
    ]);
    const s = first(seqStats);
    const enrollMap = toMap(enrollRows);
    const m = first(msgStats);

    return {
      activeFlows:     s.active || 0,
      completedFlows:  s.completed || 0,
      contactsEnrolled: s.enrolled || 0,
      enrollmentBreakdown: enrollMap,
      messagesSent:    m.messagesSent || 0,
      failures:        m.failures || 0,
    };
  },

  // ── Consent analytics ───────────────────────────────────────────────────────

  async getConsentAnalytics(ctx, query = {}) {
    const f = pickFilters(query);
    const rows = await repo.consentStatusBreakdown(ctx.tenantId, f);
    const m = toMap(rows);
    const optedIn  = m[CONSENT_STATUS.OPTED_IN] || 0;
    const optedOut = m[CONSENT_STATUS.OPTED_OUT] || 0;
    const pending  = m[CONSENT_STATUS.PENDING] || 0;
    const expired  = m[CONSENT_STATUS.EXPIRED] || 0;
    const blocked  = m[CONSENT_STATUS.BLOCKED] || 0;
    const total    = optedIn + optedOut + pending + expired + blocked;

    return {
      optedIn, optedOut, pending, expired, blocked,
      total,
      consentRate: pct(optedIn, total),
    };
  },

  // ── Delivery analytics (provider-wise) ──────────────────────────────────────

  async getDeliveryAnalytics(ctx, query = {}) {
    const f = pickFilters(query);
    const rows = await repo.deliveryByProvider(ctx.tenantId, f);
    return {
      providers: rows.map((r) => ({
        provider:   r._id,
        sent:       r.sent,
        delivered:  r.delivered,
        read:       r.read,
        failed:     r.failed,
        retryCount: r.retryCount,
        total:      r.total,
        deliveryRate: pct(r.delivered + r.read, r.total),
        failureRate:  pct(r.failed, r.total),
      })),
    };
  },

  // ── Agent analytics (per user) ──────────────────────────────────────────────

  async getAgentAnalytics(ctx, query = {}) {
    const f = pickFilters(query);
    const [convRows, msgRows] = await Promise.all([
      repo.agentConversationStats(ctx.tenantId, f),
      repo.agentMessageStats(ctx.tenantId, f),
    ]);

    // Merge the two aggregations keyed by user id.
    const agents = {};
    for (const c of convRows) {
      agents[c._id] = {
        agentId:             c._id,
        conversations:       c.conversations,
        closedConversations: c.closed,
        messagesSent:        0,
        messagesReceived:    0,
        averageResponseTime: null, // requires per-message response timing
      };
    }
    for (const mrow of msgRows) {
      if (!agents[mrow._id]) {
        agents[mrow._id] = {
          agentId: mrow._id, conversations: 0, closedConversations: 0,
          messagesSent: 0, messagesReceived: 0, averageResponseTime: null,
        };
      }
      agents[mrow._id].messagesSent     = mrow.messagesSent;
      agents[mrow._id].messagesReceived = mrow.messagesReceived;
    }

    return { agents: Object.values(agents) };
  },

  // ── Trend analytics (chart-ready) ───────────────────────────────────────────

  async getTrends(ctx, query = {}) {
    const period     = query.period || TREND_PERIOD.DAILY;
    const dateFormat = TREND_DATE_FORMAT[period] || TREND_DATE_FORMAT[TREND_PERIOD.DAILY];
    const f = pickFilters(query);

    const [messages, conversations, deliveries, campaigns, broadcasts] = await Promise.all([
      repo.messageTrend(ctx.tenantId, dateFormat, f),
      repo.conversationTrend(ctx.tenantId, dateFormat, f),
      repo.deliveryTrend(ctx.tenantId, dateFormat, f),
      repo.campaignTrend(ctx.tenantId, dateFormat, f),
      repo.broadcastTrend(ctx.tenantId, dateFormat, f),
    ]);

    return {
      period,
      messages:      messages.map((r) => ({ period: r._id, total: r.messages, inbound: r.inbound, outbound: r.outbound })),
      conversations: conversations.map((r) => ({ period: r._id, total: r.conversations })),
      deliveries:    deliveries.map((r) => ({ period: r._id, delivered: r.deliveries })),
      reads:         deliveries.map((r) => ({ period: r._id, read: r.reads })),
      campaigns:     campaigns.map((r) => ({ period: r._id, total: r.campaigns })),
      broadcasts:    broadcasts.map((r) => ({ period: r._id, total: r.broadcasts })),
    };
  },

  // ── Export (CSV or JSON of the dashboard) ───────────────────────────────────

  async getExport(ctx, query = {}) {
    const format = (query.format || 'JSON').toUpperCase();
    const dashboard = await this.getDashboard(ctx, query);

    if (format === 'CSV') {
      const headers = Object.keys(dashboard);
      const values  = headers.map((h) => dashboard[h]);
      const csv = `${headers.join(',')}\n${values.join(',')}`;
      return { format: 'CSV', content: csv, filename: 'whatsapp-analytics.csv' };
    }
    return { format: 'JSON', content: dashboard, filename: 'whatsapp-analytics.json' };
  },
};
