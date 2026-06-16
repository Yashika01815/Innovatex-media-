import { normalizePaging, paginationMeta } from '../../../../shared/helpers/lead.helpers.js';
import { conversationRepository } from '../../conversations/conversation.repository.js';
import {
  buildConversationFilter,
  conversationService,
} from '../../conversations/conversation.service.js';

/**
 * Inbox = the conversation list view with search + filters.
 * Reuses the conversation filter builder so Inbox and Conversations stay
 * consistent.
 */
export const inboxService = {
  async getInbox(ctx, query) {
    const filter = buildConversationFilter(query);
    const { page, limit, skip } = normalizePaging(query);

    const [items, total] = await Promise.all([
      conversationRepository.find(ctx.tenantId, filter, {
        sort: { last_message_at: -1 },
        skip,
        limit,
      }),
      conversationRepository.count(ctx.tenantId, filter),
    ]);

    return {
      data: items.map(conversationService.toConversationDTO),
      pagination: paginationMeta({ page, limit, total }),
    };
  },
};
