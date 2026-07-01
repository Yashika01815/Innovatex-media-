/**
 * WhatsApp AI Reply Assistant — repository.
 *
 * The only layer that interacts with the AIReplyPrompt collection.
 * Every query is tenant-scoped. No business logic, no formatting.
 */
import { AIReplyPrompt } from './aiReplyAssistant.model.js';

export const aiReplyAssistantRepository = {
  // ── Prompt CRUD ───────────────────────────────────────────────────────────

  createPrompt(data) {
    return AIReplyPrompt.create(data);
  },

  findPromptById(tenantId, id) {
    return AIReplyPrompt.findOne({ _id: id, tenantId });
  },

  listPrompts(tenantId, filter = {}, { sort = { createdAt: -1 }, skip = 0, limit = 20 } = {}) {
    return AIReplyPrompt.find({ tenantId, ...filter }).sort(sort).skip(skip).limit(limit);
  },

  countPrompts(tenantId, filter = {}) {
    return AIReplyPrompt.countDocuments({ tenantId, ...filter });
  },

  updatePrompt(tenantId, id, patch) {
    return AIReplyPrompt.findOneAndUpdate(
      { _id: id, tenantId },
      { $set: patch },
      { new: true, runValidators: true },
    );
  },

  /**
   * Soft delete — sets isActive=false.
   * Does NOT delete documents from the collection.
   */
  softDeletePrompt(tenantId, id) {
    return AIReplyPrompt.findOneAndUpdate(
      { _id: id, tenantId },
      { $set: { isActive: false } },
      { new: true },
    );
  },

  // ── Usage tracking ────────────────────────────────────────────────────────

  incrementUsageCount(tenantId, id) {
    return AIReplyPrompt.findOneAndUpdate(
      { _id: id, tenantId },
      { $inc: { usageCount: 1 }, $set: { lastUsedAt: new Date() } },
      { new: true },
    );
  },

  // ── Toggle isActive ───────────────────────────────────────────────────────

  toggleActive(tenantId, id, isActive) {
    return AIReplyPrompt.findOneAndUpdate(
      { _id: id, tenantId },
      { $set: { isActive } },
      { new: true },
    );
  },
};
