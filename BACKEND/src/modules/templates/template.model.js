/**
 * =============================================================================
 * InnovateX Revenue OS — Generic Template Model
 * =============================================================================
 *
 * FILE: src/modules/templates/template.model.js
 *
 * Registered as 'GenericTemplate' - matches the exact entity name from
 * DEVELOPER_HANDOFF.md section 6 and is fully distinct from 'WhatsAppTemplate'
 * (the WhatsApp-only Meta-approval template system). No naming collision.
 *
 * tenant_id is NULL for scope='global' templates - they are platform-wide
 * and visible to every tenant. See template.service.js for the query logic
 * that merges "my tenant's templates" + "all global templates".
 */

import mongoose from 'mongoose';
import {
  TEMPLATE_TYPE_VALUES,
  TEMPLATE_SCOPE_VALUES,
  TEMPLATE_SCOPE,
} from './template.constants.js';

const { Schema } = mongoose;

/** One historical snapshot of the template content, kept on edit. */
const versionEntrySchema = new Schema(
  {
    version:    { type: Number, required: true },
    content:    { type: String, required: true },
    updated_at: { type: Date, default: Date.now },
    updated_by: { type: String, default: null },
  },
  { _id: false },
);

const genericTemplateSchema = new Schema(
  {
    tenant_id: { type: String, default: null, index: true },

    scope: {
      type:    String,
      enum:    TEMPLATE_SCOPE_VALUES,
      default: TEMPLATE_SCOPE.TENANT,
      index:   true,
    },

    type: {
      type:     String,
      enum:     TEMPLATE_TYPE_VALUES,
      required: true,
      index:    true,
    },

    name:        { type: String, required: true, trim: true, maxlength: 100 },
    description: { type: String, trim: true, default: '' },
    content:     { type: String, required: true },

    version:         { type: Number, default: 1, min: 1 },
    version_history: { type: [versionEntrySchema], default: [] },

    created_by: { type: String, default: null },
    updated_by: { type: String, default: null },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    versionKey: false,
  },
);

genericTemplateSchema.index({ tenant_id: 1, type: 1 });
genericTemplateSchema.index({ scope: 1, type: 1 });
genericTemplateSchema.index({ tenant_id: 1, created_at: -1 });

export const GenericTemplate = mongoose.model('GenericTemplate', genericTemplateSchema);
