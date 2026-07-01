/**
 * Payment Repository — only place that touches the payments collection.
 *
 * FILE: src/modules/payments/payment.repository.js
 * Pattern matches booking.repository.js exactly.
 */

import { Payment } from './payment.model.js';
import { PAYMENT_STATUS } from './payment.constants.js';

// ── Find single ───────────────────────────────────────────────────────────────

export const findById = (tenantId, id) =>
  Payment.findOne({ _id: id, tenant_id: tenantId })
    .populate('lead_id',  'name email company source campaign assigned_user_id')
    .populate('deal_id',  'stage value title');

// ── Find list ─────────────────────────────────────────────────────────────────

export const findByTenantId = (
  tenantId,
  filter = {},
  { sort = { created_at: -1 }, skip = 0, limit = 20 } = {}
) => {
  const query = { tenant_id: tenantId };
  if (filter.status)         query.status         = filter.status;
  if (filter.payment_method) query.payment_method = filter.payment_method;
  if (filter.lead_id)        query.lead_id        = filter.lead_id;

  return Payment.find(query)
    .populate('lead_id', 'name email company source')
    .populate('deal_id', 'stage value')
    .sort(sort)
    .skip(skip)
    .limit(limit);
};

export const countByTenantId = (tenantId, filter = {}) => {
  const query = { tenant_id: tenantId };
  if (filter.status)         query.status         = filter.status;
  if (filter.payment_method) query.payment_method = filter.payment_method;
  return Payment.countDocuments(query);
};

// ── KPI counts ────────────────────────────────────────────────────────────────

/**
 * getKpiCounts — aggregate for the 4 KPI cards.
 * SOURCE: FRONTEND_SPEC §13:
 *   Revenue Collected | Outstanding | Paid (count) | Pending (count)
 */
export const getKpiCounts = async (tenantId) => {
  const agg = await Payment.aggregate([
    { $match: { tenant_id: tenantId } },
    {
      $group: {
        _id:                null,
        revenueCollected:   { $sum: { $cond: [{ $eq: ['$status', PAYMENT_STATUS.PAID] }, '$amount', 0] } },
        outstanding:        { $sum: { $cond: [{ $in:  ['$status', [PAYMENT_STATUS.PENDING, PAYMENT_STATUS.SENT]] }, '$amount', 0] } },
        paidCount:          { $sum: { $cond: [{ $eq: ['$status', PAYMENT_STATUS.PAID] }, 1, 0] } },
        pendingCount:       { $sum: { $cond: [{ $eq: ['$status', PAYMENT_STATUS.PENDING] }, 1, 0] } },
        sentCount:          { $sum: { $cond: [{ $eq: ['$status', PAYMENT_STATUS.SENT] }, 1, 0] } },
        failedCount:        { $sum: { $cond: [{ $eq: ['$status', PAYMENT_STATUS.FAILED] }, 1, 0] } },
        refundedCount:      { $sum: { $cond: [{ $eq: ['$status', PAYMENT_STATUS.REFUNDED] }, 1, 0] } },
        totalAmount:        { $sum: '$amount' },
      },
    },
  ]);

  const r = agg[0] || {};
  return {
    revenueCollected: r.revenueCollected || 0,
    outstanding:      r.outstanding      || 0,
    paidCount:        r.paidCount        || 0,
    pendingCount:     r.pendingCount     || 0,
    sentCount:        r.sentCount        || 0,
    failedCount:      r.failedCount      || 0,
    refundedCount:    r.refundedCount    || 0,
    totalAmount:      r.totalAmount      || 0,
  };
};

/**
 * getStatusBreakdown — count per status for the donut chart.
 * SOURCE: FRONTEND_SPEC §13 "Payments by Status" donut chart
 */
export const getStatusBreakdown = (tenantId) =>
  Payment.aggregate([
    { $match: { tenant_id: tenantId } },
    { $group: { _id: '$status', count: { $sum: 1 }, amount: { $sum: '$amount' } } },
    { $sort: { count: -1 } },
    { $project: { _id: 0, status: '$_id', count: 1, amount: 1 } },
  ]);

// ── Count by lead — for lead drawer linked counts ─────────────────────────────

export const countByLead = (tenantId, leadId) =>
  Payment.countDocuments({ tenant_id: tenantId, lead_id: leadId });

export const findByLead = (tenantId, leadId) =>
  Payment.find({ tenant_id: tenantId, lead_id: leadId })
    .sort({ created_at: -1 });

// ── Create ────────────────────────────────────────────────────────────────────

export const create = (data) => Payment.create(data);

// ── Update ────────────────────────────────────────────────────────────────────

export const updateById = (tenantId, id, patch) =>
  Payment.findOneAndUpdate(
    { _id: id, tenant_id: tenantId },
    { $set: patch },
    { new: true, runValidators: true }
  );