import { WhatsAppNote } from './note.model.js';

export const noteRepository = {
  create(data) {
    return WhatsAppNote.create(data);
  },

  findByConversation(tenantId, conversationId) {
    return WhatsAppNote.find({
      tenant_id: tenantId,
      conversation_id: conversationId,
    }).sort({ created_at: -1 });
  },
};
