/**
 * Payment controller — thin HTTP layer only.
 *
 * FILE: src/modules/payments/payment.controller.js
 * Pattern matches call.controller.js exactly.
 *
 * ENDPOINTS:
 *   GET  /api/payments/kpis           — KPI cards + donut chart data
 *   GET  /api/payments/export         — CSV export
 *   GET  /api/payments/lead/:leadId   — payments for a lead
 *   GET  /api/payments                — paginated list
 *   POST /api/payments                — create new payment link
 *   GET  /api/payments/:id            — single payment
 *   PATCH /api/payments/:id           — update payment
 *   POST /api/payments/:id/mark-paid  — Mark Paid (big action)
 *   POST /api/payments/:id/refund     — Refund
 */

import * as paymentService from './payment.service.js';
import { sendSuccess, sendCreated, sendPaginated } from '../../utils/apiResponse.js';
import asyncHandler from '../../utils/asyncHandler.js';

/**
 * getKpis — GET /api/payments/kpis
 * SOURCE: FRONTEND_SPEC §13 KPI cards + donut chart
 *   Revenue Collected | Outstanding | Paid (count) | Pending (count)
 */
export const getKpis = asyncHandler(async (req, res) => {
  const data = await paymentService.getKpiSummary(req.user.tenantId);
  return sendSuccess(res, data, 'Payment KPIs fetched');
});

/**
 * exportCsv — GET /api/payments/export
 * SOURCE: FRONTEND_SPEC §13 "Export" button
 */
export const exportCsv = asyncHandler(async (req, res) => {
  const rows = await paymentService.getExportData(req.user.tenantId);
  return sendSuccess(res, rows, 'Payment export data fetched');
});

/**
 * getPaymentsByLead — GET /api/payments/lead/:leadId
 * Used in lead detail drawer linked record counts.
 */
export const getPaymentsByLead = asyncHandler(async (req, res) => {
  const payments = await paymentService.getPaymentsByLead(
    req.user.tenantId,
    req.params.leadId
  );
  return sendSuccess(res, { payments }, 'Lead payments fetched');
});

/**
 * getPayments — GET /api/payments
 * Returns paginated payment list for the All Payments table.
 * SOURCE: FRONTEND_SPEC §13 table: Lead | Amount | Method | Status | Date | Actions
 */
export const getPayments = asyncHandler(async (req, res) => {
  const filter = {
    status:         req.query.status,
    payment_method: req.query.payment_method,
    lead_id:        req.query.lead_id,
  };
  const options = {
    page:  parseInt(req.query.page)  || 1,
    limit: parseInt(req.query.limit) || 20,
  };

  const result = await paymentService.getPayments(
    req.user.tenantId,
    filter,
    options
  );

  return sendPaginated(
    res,
    result.payments,
    result.pagination,
    'Payments fetched successfully'
  );
});

/**
 * getPayment — GET /api/payments/:id
 */
export const getPayment = asyncHandler(async (req, res) => {
  const payment = await paymentService.getPaymentById(
    req.user.tenantId,
    req.params.id
  );
  return sendSuccess(res, { payment }, 'Payment fetched successfully');
});

/**
 * createPayment — POST /api/payments
 * Creates payment record + auto-generates payment link.
 * SOURCE: FRONTEND_SPEC §13 "+ New Payment" button → modal
 * Modal fields: Lead | Amount (USD) | Method
 */
export const createPayment = asyncHandler(async (req, res) => {
  const payment = await paymentService.createPayment(req.body, req.user);
  return sendCreated(res, { payment }, 'Payment link created successfully');
});

/**
 * updatePayment — PATCH /api/payments/:id
 * Update payment fields (e.g. Pending → Sent).
 * NOTE: use /mark-paid to mark as Paid and /refund to refund.
 */
export const updatePayment = asyncHandler(async (req, res) => {
  const payment = await paymentService.updatePayment(
    req.user.tenantId,
    req.params.id,
    req.body,
    req.user
  );
  return sendSuccess(res, { payment }, 'Payment updated successfully');
});

/**
 * markPaid — POST /api/payments/:id/mark-paid
 * THE KEY ACTION — fires all connected effects:
 *   payment→Paid, lead→Won, deal→Won, tracking events, notification
 * SOURCE: MASTER_SPEC §B12 "Mark Paid → deal Won + lead Won + revenue + attribution + notify"
 * SOURCE: FRONTEND_SPEC §13 "Mark paid" button
 */
export const markPaid = asyncHandler(async (req, res) => {
  const payment = await paymentService.markPaid(
    req.params.id,
    req.user.tenantId,
    req.user
  );
  return sendSuccess(
    res,
    { payment },
    'Payment marked as Paid. Deal closed Won. Lead status updated to Won.'
  );
});

/**
 * refund — POST /api/payments/:id/refund
 * Marks a Paid payment as Refunded.
 * SOURCE: FRONTEND_SPEC §13 "Refund" button on Paid payments
 */
export const refund = asyncHandler(async (req, res) => {
  const payment = await paymentService.refundPayment(
    req.params.id,
    req.user.tenantId,
    req.body,
    req.user
  );
  return sendSuccess(res, { payment }, 'Payment refunded successfully');
});