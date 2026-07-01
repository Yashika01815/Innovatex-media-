/**
 * Payment model.
 *
 * FILE: src/modules/payments/payment.model.js
 *
 * SOURCE: DEVELOPER_HANDOFF.md §6 Payment entity:
 *   "lead_id, deal_id, amount, currency,
 *    status('Pending'|'Sent'|'Paid'|'Failed'|'Refunded'),
 *    payment_method, payment_link, payment_date, source, campaign"
 *
 * SOURCE: FRONTEND_SPEC §13 table columns:
 *   Lead | Amount | Method | Status | Date | Actions
 *
 * NAMING: snake_case — matches Lead, Deal, Booking, Call, Qualification, Campaign models.
 * TIMESTAMPS: { createdAt: 'created_at', updatedAt: 'updated_at' }, versionKey: false
 * EXPORT: named export — matches all module patterns
 * COLLECTION: payments
 */

import mongoose from 'mongoose';
import {
  PAYMENT_STATUS,
  PAYMENT_STATUS_VALUES,
  PAYMENT_METHOD_VALUES,
  PAYMENT_CURRENCY_VALUES,
} from './payment.constants.js';

const { Schema } = mongoose;

const paymentSchema = new Schema(
  {
    // ── Tenant scope ──────────────────────────────────────────────────────────
    tenant_id: {
      type:     String,
      required: [true, 'tenant_id is required'],
      index:    true,
    },

    // ── Core relations ─────────────────────────────────────────────────────────

    /**
     * lead_id — the lead this payment belongs to.
     * Required — every payment is linked to a lead.
     * On Mark Paid: lead.status → 'Won'
     * SOURCE: DEVELOPER_HANDOFF.md Payment.lead_id
     */
    lead_id: {
      type:     Schema.Types.ObjectId,
      ref:      'Lead',
      required: [true, 'lead_id is required'],
      index:    true,
    },

    /**
     * deal_id — the deal linked to this payment.
     * On Mark Paid: deal.stage → 'Won'
     * SOURCE: DEVELOPER_HANDOFF.md Payment.deal_id
     */
    deal_id: {
      type:    Schema.Types.ObjectId,
      ref:     'Deal',
      default: null,
      index:   true,
    },

    // ── Payment details ────────────────────────────────────────────────────────

    /**
     * amount — payment amount.
     * SOURCE: DEVELOPER_HANDOFF.md Payment.amount
     * FRONTEND_SPEC §13 Amount column: "$40,000", "$36,000" etc.
     */
    amount: {
      type:     Number,
      required: [true, 'amount is required'],
      min:      [0.01, 'amount must be greater than 0'],
    },

    /**
     * currency — payment currency.
     * SOURCE: DEVELOPER_HANDOFF.md Payment.currency
     * FRONTEND_SPEC §13 modal "AMOUNT (USD)"
     */
    currency: {
      type:    String,
      enum:    PAYMENT_CURRENCY_VALUES,
      default: 'USD',
    },

    /**
     * payment_method — how the payment is collected.
     * SOURCE: DEVELOPER_HANDOFF.md Payment.payment_method
     * FRONTEND_SPEC §13 Method column + modal Method dropdown: Card, PayPal, Stripe
     */
    payment_method: {
      type:    String,
      enum:    PAYMENT_METHOD_VALUES,
      default: 'Card',
    },

    /**
     * status — payment lifecycle state.
     * SOURCE: MASTER_SPEC §I2 PaymentStatus (5 values)
     * FRONTEND_SPEC §13 Status badges + donut chart
     */
    status: {
      type:    String,
      enum:    PAYMENT_STATUS_VALUES,
      default: PAYMENT_STATUS.PENDING,
      index:   true,
    },

    /**
     * payment_link — generated shareable payment link.
     * SOURCE: MASTER_SPEC §B12 "Create payment link; copy link"
     * Shared with the lead via WhatsApp / email.
     * Format: <CLIENT_URL>/pay/<payment_id>
     */
    payment_link: {
      type:    String,
      default: null,
    },

    /**
     * payment_date — when payment was received (ISO date string).
     * SOURCE: DEVELOPER_HANDOFF.md Payment.payment_date
     * FRONTEND_SPEC §13 Date column: "May 27, 2026", "Jun 2, 2026" etc.
     * Set automatically when status → 'Paid'.
     */
    payment_date: {
      type:    Date,
      default: null,
    },

    // ── Attribution ───────────────────────────────────────────────────────────

    /**
     * source — lead source copied at payment creation for attribution.
     * SOURCE: DEVELOPER_HANDOFF.md Payment.source
     */
    source:   { type: String, default: null, trim: true },
    campaign: { type: String, default: null, trim: true },

    // ── Refund ────────────────────────────────────────────────────────────────

    /**
     * refunded_at — timestamp when payment was refunded.
     * SOURCE: MASTER_SPEC §B12 "refund" action
     * FRONTEND_SPEC §13 Actions column — "Refund" button for Paid payments
     */
    refunded_at:     { type: Date,   default: null },
    refund_reason:   { type: String, default: null },

    // ── Audit ─────────────────────────────────────────────────────────────────
    created_by: { type: String, default: null },
    updated_by: { type: String, default: null },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    versionKey: false,
  }
);

// ── Indexes ───────────────────────────────────────────────────────────────────
paymentSchema.index({ tenant_id: 1, status: 1 });
paymentSchema.index({ tenant_id: 1, lead_id: 1 });
paymentSchema.index({ tenant_id: 1, created_at: -1 });

export const Payment = mongoose.model('Payment', paymentSchema, 'payments');