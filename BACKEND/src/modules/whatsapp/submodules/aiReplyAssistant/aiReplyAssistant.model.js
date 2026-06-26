/**
 * WhatsApp AI Reply Assistant — model.
 *
 * A single collection: AIReplyPrompt.
 * Stores reusable prompt templates that drive AI generation.
 * System prompts (isSystem=true) cannot be deleted.
 */
import mongoose from 'mongoose';
import {
  PROMPT_CATEGORY_VALUES,
  PROMPT_CATEGORY,
  TONE_VALUES,
  TONE,
} from './aiReplyAssistant.constants.js';

const { Schema } = mongoose;

const aiReplyPromptSchema = new Schema(
  {
    tenantId: { type: String, required: true },

    title:       { type: String, required: true, trim: true },
    description: { type: String, default: '' },

    category: {
      type:    String,
      enum:    PROMPT_CATEGORY_VALUES,
      default: PROMPT_CATEGORY.CUSTOM,
      required: true,
    },

    /**
     * The prompt text. Supports {{variable}} tokens.
     * Example: "Write a {{tone}} follow-up for {{lead_name}} from {{company_name}}."
     */
    prompt: { type: String, required: true },

    tone: {
      type:    String,
      enum:    TONE_VALUES,
      default: TONE.PROFESSIONAL,
    },

    languageCode: { type: String, default: 'en', trim: true },

    /** System prompts are read-only and cannot be deleted. */
    isSystem: { type: Boolean, default: false },

    /** Soft delete flag. */
    isActive: { type: Boolean, default: true },

    /** Incremented each time the prompt is used via POST /:id/use. */
    usageCount: { type: Number, default: 0, min: 0 },
    lastUsedAt: { type: Date, default: null },

    createdBy: { type: String, default: null },
    updatedBy: { type: String, default: null },
  },
  {
    timestamps: true,    // createdAt + updatedAt
    versionKey: false,
  },
);

aiReplyPromptSchema.index({ tenantId: 1, isActive: 1 });
aiReplyPromptSchema.index({ tenantId: 1, category: 1 });
aiReplyPromptSchema.index({ tenantId: 1, tone: 1 });
aiReplyPromptSchema.index({ tenantId: 1, isSystem: 1 });
aiReplyPromptSchema.index({ tenantId: 1, usageCount: -1 });
aiReplyPromptSchema.index({ tenantId: 1, createdAt: -1 });

export const AIReplyPrompt = mongoose.model('AIReplyPrompt', aiReplyPromptSchema);
