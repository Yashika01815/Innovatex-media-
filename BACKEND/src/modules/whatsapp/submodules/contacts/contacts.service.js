// Shared utilities (adjust path if your shared utils live elsewhere).
import { AppError } from '../../../../shared/helpers/lead.helpers.js';

// Reused activity system from the Lead module (read-only).
import { activityService } from '../../../leads/activities/activity.service.js';
import { ACTIVITY_TYPE } from '../../../leads/activities/activity.model.js';

import { contactsRepository } from './contacts.repository.js';
import {
  OPT_OUT_STATUS,
  CONSENT_STATUS,
  DEFAULT_PAGE,
  DEFAULT_LIMIT,
  MAX_LIMIT,
  SEARCHABLE_FIELDS,
  SORTABLE_FIELDS,
} from './contacts.constants.js';

function toContactDTO(doc) {
  if (!doc) return null;
  const o = typeof doc.toObject === 'function' ? doc.toObject() : doc;
  const { _id, ...rest } = o;
  return { id: String(_id ?? o.id), ...rest };
}

function escapeRegex(str = '') {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildFilter(query = {}) {
  const filter = {};
  if (query.status) filter.status = query.status;
  if (query.assignedUserId) filter.assignedUserId = query.assignedUserId;
  if (query.consentStatus) filter.consentStatus = query.consentStatus;
  if (query.optOutStatus) filter.optOutStatus = query.optOutStatus;

  if (query.tags) {
    const tags = Array.isArray(query.tags)
      ? query.tags
      : String(query.tags).split(',').map((t) => t.trim()).filter(Boolean);
    if (tags.length) filter.tags = { $all: tags };
  }

  const min = query.minScore !== undefined ? Number(query.minScore) : undefined;
  const max = query.maxScore !== undefined ? Number(query.maxScore) : undefined;
  if (Number.isFinite(min)) filter.score = { ...filter.score, $gte: min };
  if (Number.isFinite(max)) filter.score = { ...filter.score, $lte: max };

  if (query.search) {
    const rx = new RegExp(escapeRegex(query.search), 'i');
    filter.$or = SEARCHABLE_FIELDS.map((f) => ({ [f]: rx }));
  }
  return filter;
}

function buildSort(sort) {
  if (!sort) return { createdAt: -1 };
  const desc = sort.startsWith('-');
  const key = desc ? sort.slice(1) : sort;
  if (!SORTABLE_FIELDS.includes(key)) return { createdAt: -1 };
  return { [key]: desc ? -1 : 1 };
}

function paging(query = {}) {
  const page = Math.max(Number(query.page) || DEFAULT_PAGE, 1);
  const limit = Math.min(Math.max(Number(query.limit) || DEFAULT_LIMIT, 1), MAX_LIMIT);
  return { page, limit, skip: (page - 1) * limit };
}

/** Log an activity on the linked lead's timeline (only when a lead exists). */
async function logActivity(ctx, contact, type, message, meta = {}) {
  if (!contact?.leadId) return;
  await activityService.log(ctx, contact.leadId, type, {
    message,
    meta: { contactId: String(contact._id ?? contact.id), ...meta },
  });
}

export const contactsService = {
  async createContact(ctx, data) {
    const existing = await contactsRepository.findByPhone(ctx.tenantId, data.phone);
    if (existing) {
      throw new AppError(409, 'A contact with this phone already exists', {
        contactId: String(existing._id),
      });
    }

    const contact = await contactsRepository.createContact({
      ...data,
      tenantId: ctx.tenantId,
    });

    await logActivity(ctx, contact, ACTIVITY_TYPE.WHATSAPP_CONTACT_CREATED,
      `WhatsApp contact "${contact.name || contact.phone}" created`);

    return toContactDTO(contact);
  },

  async getContact(ctx, id) {
    const contact = await contactsRepository.findById(ctx.tenantId, id);
    if (!contact) throw new AppError(404, 'Contact not found');
    return toContactDTO(contact);
  },

  async listContacts(ctx, query) {
    const filter = buildFilter(query);
    const sort = buildSort(query.sort);
    const { page, limit, skip } = paging(query);

    const [items, total] = await Promise.all([
      contactsRepository.listContacts(ctx.tenantId, filter, { sort, skip, limit }),
      contactsRepository.countContacts(ctx.tenantId, filter),
    ]);

    return {
      data: items.map(toContactDTO),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 0,
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    };
  },

  // Search is the list view driven by the `search` query param.
  searchContacts(ctx, query) {
    return this.listContacts(ctx, query);
  },

  async updateContact(ctx, id, patch) {
    const existing = await contactsRepository.findById(ctx.tenantId, id);
    if (!existing) throw new AppError(404, 'Contact not found');

    const updated = await contactsRepository.updateContact(ctx.tenantId, id, patch);
    await logActivity(ctx, updated, ACTIVITY_TYPE.WHATSAPP_CONTACT_UPDATED,
      'WhatsApp contact updated', { fields: Object.keys(patch) });

    return toContactDTO(updated);
  },

  async updateConsent(ctx, id, consentStatus) {
    const existing = await contactsRepository.findById(ctx.tenantId, id);
    if (!existing) throw new AppError(404, 'Contact not found');

    const updated = await contactsRepository.updateConsentStatus(ctx.tenantId, id, consentStatus);
    await logActivity(ctx, updated, ACTIVITY_TYPE.WHATSAPP_CONTACT_CONSENT_UPDATED,
      `Consent status set to ${consentStatus}`, { from: existing.consentStatus, to: consentStatus });

    return toContactDTO(updated);
  },

  async updateOptOut(ctx, id, optOutStatus) {
    const existing = await contactsRepository.findById(ctx.tenantId, id);
    if (!existing) throw new AppError(404, 'Contact not found');

    const updated = await contactsRepository.updateOptOutStatus(ctx.tenantId, id, optOutStatus);

    if (optOutStatus === OPT_OUT_STATUS.OPTED_OUT) {
      await logActivity(ctx, updated, ACTIVITY_TYPE.WHATSAPP_CONTACT_OPTED_OUT,
        'WhatsApp contact opted out', { from: existing.optOutStatus });
    } else {
      await logActivity(ctx, updated, ACTIVITY_TYPE.WHATSAPP_CONTACT_UPDATED,
        `Opt-out status set to ${optOutStatus}`, { from: existing.optOutStatus, to: optOutStatus });
    }

    return toContactDTO(updated);
  },

  async assignContact(ctx, id, { userId, userName = null }) {
    const existing = await contactsRepository.findById(ctx.tenantId, id);
    if (!existing) throw new AppError(404, 'Contact not found');

    const updated = await contactsRepository.updateContact(ctx.tenantId, id, {
      assignedUserId: userId,
      assignedUserName: userName,
    });
    await logActivity(ctx, updated, ACTIVITY_TYPE.WHATSAPP_CONTACT_ASSIGNED,
      `Contact assigned to ${userName || userId}`, { assignedUserId: userId });

    return toContactDTO(updated);
  },

  async addTag(ctx, id, tag) {
    const existing = await contactsRepository.findById(ctx.tenantId, id);
    if (!existing) throw new AppError(404, 'Contact not found');

    const updated = await contactsRepository.addTag(ctx.tenantId, id, tag);
    await logActivity(ctx, updated, ACTIVITY_TYPE.WHATSAPP_CONTACT_TAG_ADDED,
      `Tag "${tag}" added`, { tag });

    return toContactDTO(updated);
  },

  async removeTag(ctx, id, tag) {
    const existing = await contactsRepository.findById(ctx.tenantId, id);
    if (!existing) throw new AppError(404, 'Contact not found');

    const updated = await contactsRepository.removeTag(ctx.tenantId, id, tag);
    await logActivity(ctx, updated, ACTIVITY_TYPE.WHATSAPP_CONTACT_TAG_REMOVED,
      `Tag "${tag}" removed`, { tag });

    return toContactDTO(updated);
  },

  async updateScore(ctx, id, score) {
    const existing = await contactsRepository.findById(ctx.tenantId, id);
    if (!existing) throw new AppError(404, 'Contact not found');

    const updated = await contactsRepository.updateContact(ctx.tenantId, id, { score });
    await logActivity(ctx, updated, ACTIVITY_TYPE.WHATSAPP_CONTACT_UPDATED,
      `Score updated to ${score}`, { score });

    return toContactDTO(updated);
  },

  /**
   * Business rule guard — call before sending a campaign/broadcast to a contact.
   * Blocks (and logs) any send to an opted-out contact. Returns the contact when allowed.
   */
  async assertSendable(ctx, id) {
    const contact = await contactsRepository.findById(ctx.tenantId, id);
    if (!contact) throw new AppError(404, 'Contact not found');

    if (contact.optOutStatus === OPT_OUT_STATUS.OPTED_OUT) {
      console.warn(
        `[whatsapp.contacts] blocked send to opted-out contact ${id} (tenant ${ctx.tenantId})`,
      );
      await logActivity(ctx, contact, ACTIVITY_TYPE.WHATSAPP_CONTACT_OPTED_OUT,
        'Blocked campaign send: contact has opted out', { blockedSend: true });
      throw new AppError(403, 'Contact has opted out of WhatsApp messaging');
    }
    return toContactDTO(contact);
  },
};
