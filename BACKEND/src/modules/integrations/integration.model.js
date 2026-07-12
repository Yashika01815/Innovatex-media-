/**
 * =============================================================================
 * InnovateX Revenue OS — Integration Model
 * =============================================================================
 *
 * FILE: src/modules/integrations/integration.model.js
 *
 * One document per (tenant_id, key) — every tenant gets its own copy of
 * each of the 22 catalog entries, auto-provisioned on first read (see
 * integration.service.js ensureCatalogSeeded). This mirrors the same
 * "auto-provision on first GET" pattern already used for WhatsAppSettings.
 */

import mongoose from 'mongoose';
import {
  INTEGRATION_CATEGORY_VALUES,
  INTEGRATION_STATUS_VALUES,
  INTEGRATION_STATUS,
  ERROR_LOG_SEVERITY_VALUES,
  ERROR_LOG_SEVERITY,
} from './integration.constants.js';

const { Schema } = mongoose;

/** One recorded sync/connection failure — populated by a future real sync layer. */
const errorLogSchema = new Schema(
  {
    message:     { type: String, required: true },
    severity:    { type: String, enum: ERROR_LOG_SEVERITY_VALUES, default: ERROR_LOG_SEVERITY.ERROR },
    occurred_at: { type: Date, default: Date.now },
  },
  { _id: false },
);

const integrationSchema = new Schema(
  {
    tenant_id: { type: String, required: true, index: true },

    // Stable catalog key, e.g. "wati", "stripe" — see INTEGRATION_CATALOG.
    key: { type: String, required: true },

    name:        { type: String, required: true, trim: true },
    category: {
      type:     String,
      enum:     INTEGRATION_CATEGORY_VALUES,
      required: true,
      index:    true,
    },
    description: { type: String, trim: true, default: '' },
    logo_color:  { type: String, default: '#6366F1' },

    status: {
      type:    String,
      enum:    INTEGRATION_STATUS_VALUES,
      default: INTEGRATION_STATUS.DISCONNECTED,
      index:   true,
    },

    // false = "coming soon" card — visible, cannot be connected.
    available: { type: Boolean, default: true },

    last_sync: { type: Date, default: null },

    // Free-form provider-specific settings (API keys, webhook URLs, etc.)
    // edited via the "settings modal" / updateIntegrationConfig action.
    config: { type: Schema.Types.Mixed, default: {} },

    error_logs: { type: [errorLogSchema], default: [] },

    updated_by: { type: String, default: null },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    versionKey: false,
  },
);

// One record per catalog entry per tenant — also the upsert key for seeding.
integrationSchema.index({ tenant_id: 1, key: 1 }, { unique: true });
integrationSchema.index({ tenant_id: 1, category: 1 });
integrationSchema.index({ tenant_id: 1, status: 1 });

export const Integration = mongoose.model('Integration', integrationSchema);
