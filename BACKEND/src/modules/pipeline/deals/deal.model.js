import mongoose from 'mongoose';
import {
  DEAL_STAGE,
  DEAL_STAGE_VALUES,
  DEFAULT_CURRENCY,
} from './deal.constants.js';

const { Schema } = mongoose;

/**
 * Deal — a single sales opportunity in the pipeline.
 * A Lead may have MANY deals over time (1 → many), linked via lead_id.
 */
const dealSchema = new Schema(
  {
    tenant_id: { type: String, required: true, index: true },

    // Link to the originating lead (1 lead → many deals).
    lead_id: {
      type: Schema.Types.ObjectId,
      ref: 'Lead',
      required: true,
      index: true,
    },

    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: '' },

    value: { type: Number, default: 0, min: 0 },
    probability: { type: Number, default: 0, min: 0, max: 100 },

    stage: {
      type: String,
      enum: DEAL_STAGE_VALUES,
      default: DEAL_STAGE.NEW_LEAD,
      index: true,
    },

    source: { type: String, trim: true },
    assigned_user_id: { type: String, default: null, index: true },

    expected_close_date: { type: Date, default: null },
    currency: { type: String, default: DEFAULT_CURRENCY, trim: true },

    archived: { type: Boolean, default: false, index: true },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    versionKey: false,
  },
);

// Compound indexes for the common access patterns.
dealSchema.index({ tenant_id: 1, archived: 1, stage: 1 }); // board + stats
dealSchema.index({ tenant_id: 1, lead_id: 1 }); // deals for a lead

export const Deal = mongoose.model('Deal', dealSchema);