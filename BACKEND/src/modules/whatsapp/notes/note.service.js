import { AppError } from '../../../shared/helpers/lead.helpers.js';
import { noteRepository } from './note.repository.js';
import { conversationRepository } from '../conversations/conversation.repository.js';

function toDTO(doc) {
  if (!doc) return null;
  const o = typeof doc.toObject === 'function' ? doc.toObject() : doc;
  const { _id, ...rest } = o;
  return { id: String(_id ?? o.id), ...rest };
}

async function ensureConversation(ctx, conversationId) {
  const conversation = await conversationRepository.findById(ctx.tenantId, conversationId);
  if (!conversation) throw AppError.notFound('Conversation not found');
  return conversation;
}

export const noteService = {
  async addNote(ctx, conversationId, body) {
    if (!body || !String(body).trim()) {
      throw AppError.badRequest('Validation failed', [
        { field: 'body', message: 'body is required' },
      ]);
    }
    await ensureConversation(ctx, conversationId);

    const note = await noteRepository.create({
      tenant_id: ctx.tenantId,
      conversation_id: conversationId,
      body: String(body).trim(),
      created_by: ctx.userId,
    });
    return toDTO(note);
  },

  async getNotes(ctx, conversationId) {
    await ensureConversation(ctx, conversationId);
    const notes = await noteRepository.findByConversation(ctx.tenantId, conversationId);
    return notes.map(toDTO);
  },
};
