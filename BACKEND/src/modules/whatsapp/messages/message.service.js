import { AppError, normalizePaging, paginationMeta } from '../../../shared/helpers/lead.helpers.js';
import { activityService } from '../../leads/activities/activity.service.js';
import { ACTIVITY_TYPE } from '../../leads/activities/activity.model.js';
import { leadRepository } from '../../leads/lead/lead.repository.js';
import { Lead } from '../../leads/lead/lead.model.js';
import { createTrackingEvent } from '../../attribution/attribution.service.js';
import { TRACKING_EVENT_TYPE } from '../../attribution/attribution.constants.js';
import { emitToTenant } from '../../../realtime/socket.js';

import { messageRepository } from './message.repository.js';
import { conversationRepository } from '../conversations/conversation.repository.js';
import { deliveryLogService } from '../delivery-logs/delivery-log.service.js';
import { getProvider, resolveProvider } from '../providers/provider.factory.js';
import {
  MESSAGE_DIRECTION,
  MESSAGE_STATUS,
  MESSAGE_TYPE,
} from './message.model.js';
import { CONVERSATION_STATUS } from '../conversations/conversation.model.js';

function toMessageDTO(doc) {
  if (!doc) return null;
  const o = typeof doc.toObject === 'function' ? doc.toObject() : doc;
  const { _id, ...rest } = o;
  return { id: String(_id ?? o.id), ...rest };
}

function preview(content = '') {
  const s = String(content).trim();
  return s.length > 120 ? `${s.slice(0, 117)}...` : s;
}

async function getConversationOrThrow(ctx, conversationId) {
  const conversation = await conversationRepository.findById(ctx.tenantId, conversationId);
  if (!conversation) throw AppError.notFound('Conversation not found');
  return conversation;
}

/**
 * recordInboundMessage -- shared by simulateInbound() (manual testing) and
 * metaWebhook.service.js (real inbound messages from Meta). `transport` is
 * either SimulationProvider.simulateInbound()'s return value, or an
 * equivalent object built from Meta's real webhook payload -- both share
 * the same { provider, provider_message_id, status, received_at } shape.
 */
async function recordInboundMessage(ctx, conversation, { content, type, transport }) {
  const message = await messageRepository.create({
    tenant_id: ctx.tenantId,
    conversation_id: conversation._id,
    lead_id: conversation.lead_id,
    direction: MESSAGE_DIRECTION.INBOUND,
    type,
    content,
    sender: conversation.phone,
    recipient: ctx.userId || 'system',
    provider: transport.provider,
    status: transport.status || MESSAGE_STATUS.DELIVERED,
    provider_message_id: transport.provider_message_id,
    delivered_at: transport.received_at || new Date(),
  });

  // New → Open on first inbound; otherwise keep current status.
  const statusPatch =
    conversation.status === CONVERSATION_STATUS.NEW
      ? { status: CONVERSATION_STATUS.OPEN }
      : {};

  await conversationRepository.updateById(ctx.tenantId, conversation._id, {
    last_message_preview: preview(content),
    last_message_at: message.delivered_at,
    ...statusPatch,
  });
  const updatedConversation = await conversationRepository.incrementUnread(
    ctx.tenantId,
    conversation._id,
    1,
  );

  if (conversation.lead_id) {
    await activityService.log(ctx, conversation.lead_id, ACTIVITY_TYPE.WHATSAPP_REPLY_RECEIVED, {
      message: 'Inbound WhatsApp message received',
      meta: { conversation_id: String(conversation._id), message_id: String(message._id) },
    });
    await createTrackingEvent({
      tenant_id: ctx.tenantId,
      event_type: TRACKING_EVENT_TYPE.WHATSAPP_INBOUND,
      lead_id: conversation.lead_id,
      metadata: { conversation_id: String(conversation._id), message_id: String(message._id) },
    }).catch(() => {});
  }

  emitToTenant(ctx.tenantId, 'whatsapp:message', {
    conversationId: String(conversation._id),
    message: toMessageDTO(message),
  });
  emitToTenant(ctx.tenantId, 'whatsapp:conversation', {
    conversation: conversationService_lightDTO(updatedConversation),
  });

  return {
    message: toMessageDTO(message),
    conversation: conversationService_lightDTO(updatedConversation),
  };
}

export const messageService = {
  /**
   * Send an outbound message:
   * provider transport → persist message → delivery log → update conversation
   * → touch lead → activity.
   */
  async sendMessage(ctx, { conversationId, content, type = MESSAGE_TYPE.TEXT }) {
    const conversation = await getConversationOrThrow(ctx, conversationId);

    // Opt-out guard -- DEVELOPER_HANDOFF.md's action table lists this FIRST
    // for sendMessage: "opt-out guard (blocks + logs)". Was completely
    // missing before this fix -- nothing anywhere checked opt_out_status,
    // so opted-out leads could still receive real (simulated) sends.
    if (conversation.lead_id) {
      const lead = await Lead.findOne({ _id: conversation.lead_id, tenant_id: ctx.tenantId });
      if (lead?.opt_out_status) {
        const blockedMessage = await messageRepository.create({
          tenant_id: ctx.tenantId,
          conversation_id: conversation._id,
          lead_id: conversation.lead_id,
          direction: MESSAGE_DIRECTION.OUTBOUND,
          type,
          content,
          sender: ctx.userId || 'system',
          recipient: conversation.phone,
          provider: conversation.provider,
          status: MESSAGE_STATUS.BLOCKED_BY_OPT_OUT,
        });
        await activityService.log(ctx, conversation.lead_id, ACTIVITY_TYPE.WHATSAPP_MESSAGE_SENT, {
          message: 'Outbound WhatsApp message BLOCKED -- lead has opted out',
          meta: { conversation_id: String(conversation._id), message_id: String(blockedMessage._id), blocked: true },
        });
        emitToTenant(ctx.tenantId, 'whatsapp:message', {
          conversationId: String(conversation._id),
          message: toMessageDTO(blockedMessage),
        });
        return {
          message: toMessageDTO(blockedMessage),
          conversation: conversationService_lightDTO(conversation),
          providerResponse: null,
          blocked: true,
          blockedReason: 'opt_out',
        };
      }
    }

    const provider = await resolveProvider(ctx);

    let transport;
    try {
      transport = await provider.sendMessage({
        to: conversation.phone,
        content,
        type,
      });
    } catch (sendError) {
      // A real Meta send can genuinely fail (invalid token, number not
      // opted in to receive, rate limit, etc.) -- record it as a Failed
      // message rather than letting the whole request 500, so the UI can
      // show the failure in the thread instead of a generic error toast.
      const failedMessage = await messageRepository.create({
        tenant_id: ctx.tenantId,
        conversation_id: conversation._id,
        lead_id: conversation.lead_id,
        direction: MESSAGE_DIRECTION.OUTBOUND,
        type,
        content,
        sender: ctx.userId || 'system',
        recipient: conversation.phone,
        provider: provider.name,
        status: MESSAGE_STATUS.FAILED,
      });
      emitToTenant(ctx.tenantId, 'whatsapp:message', {
        conversationId: String(conversation._id),
        message: toMessageDTO(failedMessage),
      });
      throw AppError.badRequest(`Message could not be sent: ${sendError.message}`);
    }

    const message = await messageRepository.create({
      tenant_id: ctx.tenantId,
      conversation_id: conversation._id,
      lead_id: conversation.lead_id,
      direction: MESSAGE_DIRECTION.OUTBOUND,
      type,
      content,
      sender: ctx.userId || 'system',
      recipient: conversation.phone,
      provider: transport.provider,
      status: transport.status || MESSAGE_STATUS.SENT,
      provider_message_id: transport.provider_message_id,
      sent_at: transport.sent_at || new Date(),
      delivered_at: transport.delivered_at || null,
    });

    await deliveryLogService.record(ctx, {
      conversation_id: conversation._id,
      message_id: message._id,
      provider: transport.provider,
      provider_message_id: transport.provider_message_id,
      recipient: conversation.phone,
      status: message.status,
      retries: 0,
      sent_at: message.sent_at,
      delivered_at: message.delivered_at,
    });

    const updatedConversation = await conversationRepository.updateById(
      ctx.tenantId,
      conversation._id,
      {
        last_message_preview: preview(content),
        last_message_at: message.sent_at,
      },
    );

    if (conversation.lead_id) {
      await leadRepository.updateById(ctx.tenantId, conversation.lead_id, {
        last_contacted_at: message.sent_at,
      });
      await activityService.log(ctx, conversation.lead_id, ACTIVITY_TYPE.WHATSAPP_MESSAGE_SENT, {
        message: 'Outbound WhatsApp message sent',
        meta: { conversation_id: String(conversation._id), message_id: String(message._id) },
      });
      // Real attribution tracking event -- DEVELOPER_HANDOFF.md's action
      // table explicitly requires track('WhatsApp Outbound Message') here.
      // activityService.log() above writes to the LEAD's own timeline,
      // which is a separate system from the global TrackingEvent
      // collection that powers Attribution/Reports -- this was missing
      // entirely, so WhatsApp sends never showed up in Attribution.
      await createTrackingEvent({
        tenant_id: ctx.tenantId,
        event_type: TRACKING_EVENT_TYPE.WHATSAPP_OUTBOUND,
        lead_id: conversation.lead_id,
        metadata: { conversation_id: String(conversation._id), message_id: String(message._id) },
      }).catch(() => {});
    }

    emitToTenant(ctx.tenantId, 'whatsapp:message', {
      conversationId: String(conversation._id),
      message: toMessageDTO(message),
    });
    emitToTenant(ctx.tenantId, 'whatsapp:conversation', {
      conversation: conversationService_lightDTO(updatedConversation),
    });

    return {
      message: toMessageDTO(message),
      conversation: conversationService_lightDTO(updatedConversation),
      providerResponse: transport,
    };
  },

  /**
   * Simulate an inbound message:
   * provider → persist inbound message → update conversation + unread count.
   */
  async simulateInbound(ctx, { conversationId, content, type = MESSAGE_TYPE.TEXT }) {
    const conversation = await getConversationOrThrow(ctx, conversationId);
    // Deliberately ALWAYS simulation, never resolveProvider(ctx) -- this is
    // the manual "Simulate inbound" testing button, independent of whatever
    // real provider a tenant has configured. MetaProvider.simulateInbound()
    // deliberately throws (see meta.provider.js) -- using resolveProvider()
    // here would break this button for any tenant with real credentials set.
    const provider = getProvider('simulation');

    const transport = await provider.simulateInbound({
      from: conversation.phone,
      content,
      type,
    });

    return recordInboundMessage(ctx, conversation, { content, type, transport });
  },

  /**
   * recordInboundMessage -- the REAL webhook handler (metaWebhook.service.js)
   * calls this too, with a `transport` object built from Meta's actual
   * payload instead of SimulationProvider.simulateInbound(). Extracted here
   * so both paths share the exact same message-creation, conversation-
   * update, activity-log, tracking-event, and realtime-emit logic -- not
   * duplicated between "fake" and "real" inbound messages.
   */
  async recordInboundMessage(ctx, conversation, { content, type, transport }) {
    return recordInboundMessage(ctx, conversation, { content, type, transport });
  },

  async getMessages(ctx, conversationId, query = {}) {
    await getConversationOrThrow(ctx, conversationId);
    const { page, limit, skip } = normalizePaging(query);

    const [items, total] = await Promise.all([
      messageRepository.findByConversation(ctx.tenantId, conversationId, {
        sort: { created_at: 1 },
        skip,
        limit,
      }),
      messageRepository.countByConversation(ctx.tenantId, conversationId),
    ]);

    return {
      data: items.map(toMessageDTO),
      pagination: paginationMeta({ page, limit, total }),
    };
  },
};

/** Small inline conversation DTO to avoid a circular service import. */
function conversationService_lightDTO(doc) {
  if (!doc) return null;
  const o = typeof doc.toObject === 'function' ? doc.toObject() : doc;
  return {
    id: String(o._id),
    status: o.status,
    unread_count: o.unread_count,
    last_message_preview: o.last_message_preview,
    last_message_at: o.last_message_at,
  };
}