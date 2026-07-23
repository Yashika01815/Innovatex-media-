/**
 * Meta WhatsApp Cloud API webhook -- the REAL inbound receiver.
 *
 * Per-tenant URL: /api/whatsapp/webhooks/meta/:tenantId -- each tenant's
 * own Meta App is configured to call THIS tenant's URL, so the tenantId
 * is known from the URL itself, not guessed from payload content.
 *
 * SECURITY: every POST is verified against the tenant's own appSecret
 * using Meta's documented X-Hub-Signature-256 scheme BEFORE any payload
 * content is trusted. Without this, anyone who learns/guesses a tenant's
 * webhook URL could POST fake inbound messages into their inbox.
 *
 * Confirmed with the user: an inbound message from an unknown phone
 * number auto-creates BOTH a new Lead (source: 'WhatsApp', status: 'New')
 * and a new Conversation. An already-known number reuses the existing
 * Lead/Conversation (matched via leadRepository.findByWhatsAppNumber /
 * conversationRepository.findByPhone -- see those functions for why exact
 * string matching isn't used).
 */

import crypto from 'crypto';
import { AppError } from '../../../shared/helpers/lead.helpers.js';
import { whatsappSettingsService } from '../submodules/whatsappSettings/whatsappSettings.service.js';
import { conversationRepository } from '../conversations/conversation.repository.js';
import { messageRepository } from '../messages/message.repository.js';
import { messageService } from '../messages/message.service.js';
import { MESSAGE_STATUS } from '../messages/message.model.js';
import { CONVERSATION_STATUS } from '../conversations/conversation.model.js';
import { leadRepository } from '../../leads/lead/lead.repository.js';
import { leadService } from '../../leads/lead/lead.service.js';

const META_STATUS_MAP = {
  sent: MESSAGE_STATUS.SENT,
  delivered: MESSAGE_STATUS.DELIVERED,
  read: MESSAGE_STATUS.READ,
  failed: MESSAGE_STATUS.FAILED,
};

function verifySignature(rawBody, signatureHeader, appSecret) {
  if (!signatureHeader || !appSecret) return false;
  const expected = 'sha256=' + crypto.createHmac('sha256', appSecret).update(rawBody).digest('hex');
  const a = Buffer.from(signatureHeader);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

async function getTenantMetaConfig(tenantId) {
  const config = await whatsappSettingsService.getProviderConfig({ tenantId });
  if (!config?.meta) throw AppError.notFound('WhatsApp settings not configured for this tenant');
  return config;
}

async function findOrCreateLeadAndConversation(ctx, waId, profileName) {
  let lead = await leadRepository.findByWhatsAppNumber(ctx.tenantId, waId);
  console.log(`[WA_INBOUND_DEV] Lead lookup for ${waId}: ${lead ? 'FOUND existing lead ' + (lead.id || lead._id) : 'not found -- will create new'}`);

  if (!lead) {
    lead = await leadService.createLead(
      ctx,
      {
        name: profileName || waId,
        phone: waId,
        whatsapp_number: waId,
        source: 'WhatsApp',
        status: 'New',
        consent_status: 'granted',
      },
      { skipDuplicateCheck: true },
    );
    console.log(`[WA_INBOUND_DEV] Created new lead: ${lead.id || lead._id}`);
  }

  const leadId = lead.id || String(lead._id);
  let conversation = await conversationRepository.findByPhone(ctx.tenantId, waId);
  console.log(`[WA_INBOUND_DEV] Conversation lookup for ${waId}: ${conversation ? 'FOUND existing conversation ' + conversation._id : 'not found -- will create new'}`);

  if (!conversation) {
    conversation = await conversationRepository.create({
      tenant_id: ctx.tenantId,
      lead_id: leadId,
      phone: waId,
      contact_name: profileName || '',
      status: CONVERSATION_STATUS.NEW,
      tags: [],
      unread_count: 0,
      last_message_preview: '',
      archived: false,
    });
    console.log(`[WA_INBOUND_DEV] Created new conversation: ${conversation._id}`);
  }

  return conversation;
}

export const metaWebhookService = {
  async handleVerification(tenantId, query) {
    const config = await getTenantMetaConfig(tenantId);
    const mode = query['hub.mode'];
    const token = query['hub.verify_token'];
    const challenge = query['hub.challenge'];
    console.log(`[WA_INBOUND_DEV] handleVerification -- received token="${token}" vs saved token="${config.meta.verifyToken}" -- match=${token === config.meta.verifyToken}`);

    if (mode === 'subscribe' && token && token === config.meta.verifyToken) {
      return { verified: true, challenge };
    }
    throw AppError.forbidden('Webhook verification failed -- token mismatch');
  },

  async processPayload(tenantId, payload) {
    const ctx = { tenantId, userId: null, role: 'system' };
    const entries = payload?.entry || [];
    console.log(`[WA_INBOUND_DEV] processPayload -- ${entries.length} entr${entries.length === 1 ? 'y' : 'ies'} in payload`);

    for (const entry of entries) {
      for (const change of entry?.changes || []) {
        const value = change?.value;
        if (!value) continue;

        const profileByWaId = {};
        for (const contact of value.contacts || []) {
          if (contact?.wa_id) profileByWaId[contact.wa_id] = contact.profile?.name || '';
        }

        console.log(`[WA_INBOUND_DEV] change.value has ${(value.messages || []).length} message(s) and ${(value.statuses || []).length} status update(s)`);

        for (const msg of value.messages || []) {
          console.log(`[WA_INBOUND_DEV] Processing inbound message from ${msg.from}, type=${msg.type}, id=${msg.id}`);
          await this._handleInboundMessage(ctx, msg, profileByWaId[msg.from]);
          console.log(`[WA_INBOUND_DEV] Inbound message from ${msg.from} recorded successfully`);
        }

        for (const status of value.statuses || []) {
          console.log(`[WA_INBOUND_DEV] Processing status update: id=${status.id} status=${status.status}`);
          await this._handleStatusUpdate(ctx, status);
        }
      }
    }

    return { processed: true };
  },

  async _handleInboundMessage(ctx, msg, profileName) {
    const content = msg.type === 'text' ? (msg.text?.body || '') : `[${msg.type} message -- content type not yet supported]`;

    const conversation = await findOrCreateLeadAndConversation(ctx, msg.from, profileName);

    await messageService.recordInboundMessage(ctx, conversation, {
      content,
      type: 'text',
      transport: {
        provider: 'meta',
        provider_message_id: msg.id,
        status: MESSAGE_STATUS.DELIVERED,
        received_at: msg.timestamp ? new Date(Number(msg.timestamp) * 1000) : new Date(),
      },
    });
  },

  async _handleStatusUpdate(ctx, status) {
    const mapped = META_STATUS_MAP[status.status];
    if (!mapped) {
      console.log(`[WA_INBOUND_DEV] Unknown status value "${status.status}" -- ignoring`);
      return;
    }

    const message = await messageRepository.findByProviderMessageId(ctx.tenantId, status.id);
    if (!message) {
      console.log(`[WA_INBOUND_DEV] Status update for provider_message_id=${status.id} but no matching message found in DB -- ignoring`);
      return;
    }

    const patch = { status: mapped };
    if (mapped === MESSAGE_STATUS.DELIVERED) patch.delivered_at = new Date(Number(status.timestamp) * 1000);
    if (mapped === MESSAGE_STATUS.READ) patch.read_at = new Date(Number(status.timestamp) * 1000);

    await messageRepository.updateById(ctx.tenantId, message._id, patch);
    console.log(`[WA_INBOUND_DEV] Updated message ${message._id} status -> ${mapped}`);
  },

  verifySignature,
};