import { WhatsAppContact } from './contacts.model.js';

/**
 * Contact repository — the only layer that touches the WhatsAppContact
 * collection. Every query is scoped to a tenant; no cross-tenant access.
 */
export const contactsRepository = {
  createContact(data) {
    return WhatsAppContact.create(data);
  },

  findById(tenantId, id) {
    return WhatsAppContact.findOne({ _id: id, tenantId });
  },

  findByPhone(tenantId, phone) {
    return WhatsAppContact.findOne({ tenantId, phone });
  },

  findByLeadId(tenantId, leadId) {
    return WhatsAppContact.find({ tenantId, leadId }).sort({ createdAt: -1 });
  },

  listContacts(tenantId, filter = {}, { sort = { createdAt: -1 }, skip = 0, limit = 20 } = {}) {
    return WhatsAppContact.find({ tenantId, ...filter })
      .sort(sort)
      .skip(skip)
      .limit(limit);
  },

  countContacts(tenantId, filter = {}) {
    return WhatsAppContact.countDocuments({ tenantId, ...filter });
  },

  updateContact(tenantId, id, patch) {
    return WhatsAppContact.findOneAndUpdate(
      { _id: id, tenantId },
      { $set: patch },
      { new: true, runValidators: true },
    );
  },

  deleteContact(tenantId, id) {
    return WhatsAppContact.findOneAndDelete({ _id: id, tenantId });
  },

  updateConsentStatus(tenantId, id, consentStatus) {
    return WhatsAppContact.findOneAndUpdate(
      { _id: id, tenantId },
      { $set: { consentStatus } },
      { new: true },
    );
  },

  updateOptOutStatus(tenantId, id, optOutStatus) {
    return WhatsAppContact.findOneAndUpdate(
      { _id: id, tenantId },
      { $set: { optOutStatus } },
      { new: true },
    );
  },

  incrementMessageCounters(tenantId, id, { totalMessages = 0, unreadCount = 0 } = {}, set = {}) {
    const update = {};
    const inc = {};
    if (totalMessages) inc.totalMessages = totalMessages;
    if (unreadCount) inc.unreadCount = unreadCount;
    if (Object.keys(inc).length) update.$inc = inc;
    if (Object.keys(set).length) update.$set = set;
    return WhatsAppContact.findOneAndUpdate({ _id: id, tenantId }, update, { new: true });
  },

  updateLastContacted(tenantId, id, date = new Date()) {
    return WhatsAppContact.findOneAndUpdate(
      { _id: id, tenantId },
      { $set: { lastContactedAt: date } },
      { new: true },
    );
  },

  addTag(tenantId, id, tag) {
    return WhatsAppContact.findOneAndUpdate(
      { _id: id, tenantId },
      { $addToSet: { tags: tag } },
      { new: true },
    );
  },

  removeTag(tenantId, id, tag) {
    return WhatsAppContact.findOneAndUpdate(
      { _id: id, tenantId },
      { $pull: { tags: tag } },
      { new: true },
    );
  },
};
