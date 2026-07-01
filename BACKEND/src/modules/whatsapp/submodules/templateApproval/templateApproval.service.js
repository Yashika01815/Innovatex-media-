/**
 * WhatsApp Template Approval — service (workflow engine).
 *
 * Owns transition validation, the approver≠submitter rule, activity logging,
 * and webhook-driven provider transitions. Operates on the existing
 * WhatsAppTemplate model via templateApprovalRepository.
 */
import { AppError } from '../../../../shared/helpers/lead.helpers.js';
import { activityService } from '../../../leads/activities/activity.service.js';
import { ACTIVITY_TYPE } from '../../../leads/activities/activity.model.js';
import { ROLES } from '../../../auth/constants/roles.js';
import { templateApprovalRepository } from './templateApproval.repository.js';
import {
  APPROVAL_STATUS,
  APPROVAL_ACTION,
  ALLOWED_TRANSITIONS,
  PROVIDER_CONTROLLED_STATUSES,
  PROVIDER_REJECTION_REASON_VALUES,
  USABLE_APPROVAL_STATUS,
  PROVIDER_ACTOR,
} from './templateApproval.constants.js';

const ENTITY_TYPE = 'whatsapp_template';

// Roles permitted to perform manager-level actions (tenant_admin and above).
const MANAGER_ROLES = [ROLES.TENANT_ADMIN, ROLES.TENANT_OWNER, ROLES.SUPER_ADMIN];

function toTemplateDTO(doc) {
  if (!doc) return null;
  const o = typeof doc.toObject === 'function' ? doc.toObject() : doc;
  const { _id, ...rest } = o;
  return { id: String(_id ?? o.id), ...rest };
}

function buildHistoryEntry(fromStatus, toStatus, action, comment, performedBy, now) {
  return { fromStatus, toStatus, action, comment: comment || '', performedBy: performedBy ?? null, performedAt: now };
}

async function logActivity(ctx, template, type, message, meta = {}) {
  await activityService.logEntity(
    ctx,
    { entityType: ENTITY_TYPE, entityId: template._id ?? template.id },
    type,
    { message, meta: { templateId: String(template._id ?? template.id), ...meta } },
  );
}

export const templateApprovalService = {
  /** Throws unless `to` is a permitted successor of `from`. */
  validateTransition(fromStatus, toStatus) {
    const allowed = ALLOWED_TRANSITIONS[fromStatus] || [];
    if (!allowed.includes(toStatus)) {
      throw new AppError(409, `Invalid transition: ${fromStatus} → ${toStatus}`);
    }
  },

  /** Throws if the approver is the same user who submitted the template. */
  validateApprover(template, ctx) {
    if (template.submittedBy && ctx.userId && String(template.submittedBy) === String(ctx.userId)) {
      throw new AppError(403, 'Approver must be different from the submitter');
    }
  },

  /** Guard against users manually assigning provider-controlled statuses. */
  assertNotProviderControlled(toStatus) {
    if (PROVIDER_CONTROLLED_STATUSES.includes(toStatus)) {
      throw new AppError(403, `${toStatus} can only be set by the provider webhook`);
    }
  },

  async loadTemplate(tenantId, id) {
    const template = await templateApprovalRepository.findById(tenantId, id);
    if (!template) throw new AppError(404, 'Template not found');
    return template;
  },

  // ── User-initiated transitions ─────────────────────────────────────────
  async submitForReview(ctx, id, { comment = '' } = {}) {
    const template = await this.loadTemplate(ctx.tenantId, id);
    const from = template.approvalStatus;
    const to = APPROVAL_STATUS.SUBMITTED_FOR_INTERNAL_REVIEW;

    this.assertNotProviderControlled(to);
    this.validateTransition(from, to);

    // A sales_user may only submit templates they created; managers submit any.
    const isManager = MANAGER_ROLES.includes(ctx.role);
    if (!isManager && template.createdBy && String(template.createdBy) !== String(ctx.userId)) {
      throw new AppError(403, 'You can only submit templates you created');
    }

    // Resubmission if this template has been through review before.
    const resubmitted = (template.transitionHistory || []).some(
      (h) => h.action === APPROVAL_ACTION.SUBMIT_FOR_REVIEW,
    );

    const now = new Date();
    const entry = buildHistoryEntry(from, to, APPROVAL_ACTION.SUBMIT_FOR_REVIEW, comment, ctx.userId, now);
    const updated = await templateApprovalRepository.submitForReview(ctx.tenantId, id, {
      performedBy: ctx.userId,
      comment,
      now,
      historyEntry: entry,
    });

    await logActivity(
      ctx,
      updated,
      resubmitted ? ACTIVITY_TYPE.WHATSAPP_TEMPLATE_RESUBMITTED : ACTIVITY_TYPE.WHATSAPP_TEMPLATE_SUBMITTED,
      resubmitted ? 'Template resubmitted for internal review' : 'Template submitted for internal review',
      { from, to },
    );
    return toTemplateDTO(updated);
  },

  async requestChanges(ctx, id, { comment = '' } = {}) {
    const template = await this.loadTemplate(ctx.tenantId, id);
    const from = template.approvalStatus;
    const to = APPROVAL_STATUS.DRAFT;

    this.validateTransition(from, to);

    const now = new Date();
    const entry = buildHistoryEntry(from, to, APPROVAL_ACTION.REQUEST_CHANGES, comment, ctx.userId, now);
    const updated = await templateApprovalRepository.requestChanges(ctx.tenantId, id, {
      comment,
      historyEntry: entry,
    });

    await logActivity(ctx, updated, ACTIVITY_TYPE.WHATSAPP_TEMPLATE_CHANGES_REQUESTED,
      'Changes requested on template', { from, to, comment });
    return toTemplateDTO(updated);
  },

  async approveInternally(ctx, id, { comment = '' } = {}) {
    const template = await this.loadTemplate(ctx.tenantId, id);
    const from = template.approvalStatus;
    const to = APPROVAL_STATUS.INTERNALLY_APPROVED;

    this.validateTransition(from, to);
    this.validateApprover(template, ctx);

    const now = new Date();
    const entry = buildHistoryEntry(from, to, APPROVAL_ACTION.APPROVE, comment, ctx.userId, now);
    const updated = await templateApprovalRepository.approveInternally(ctx.tenantId, id, {
      performedBy: ctx.userId,
      comment,
      now,
      historyEntry: entry,
    });

    await logActivity(ctx, updated, ACTIVITY_TYPE.WHATSAPP_TEMPLATE_INTERNALLY_APPROVED,
      'Template internally approved', { from, to });
    return toTemplateDTO(updated);
  },

  async rejectInternally(ctx, id, { comment = '' } = {}) {
    const template = await this.loadTemplate(ctx.tenantId, id);
    const from = template.approvalStatus;
    const to = APPROVAL_STATUS.REJECTED;

    this.validateTransition(from, to);

    const now = new Date();
    const entry = buildHistoryEntry(from, to, APPROVAL_ACTION.REJECT, comment, ctx.userId, now);
    const updated = await templateApprovalRepository.rejectInternally(ctx.tenantId, id, {
      performedBy: ctx.userId,
      comment,
      now,
      historyEntry: entry,
    });

    await logActivity(ctx, updated, ACTIVITY_TYPE.WHATSAPP_TEMPLATE_REJECTED,
      'Template rejected internally', { from, to, comment });
    return toTemplateDTO(updated);
  },

  async submitToProvider(ctx, id) {
    const template = await this.loadTemplate(ctx.tenantId, id);
    const from = template.approvalStatus;
    const to = APPROVAL_STATUS.SUBMITTED_TO_PROVIDER;

    this.assertNotProviderControlled(to);
    this.validateTransition(from, to);

    const now = new Date();
    const entry = buildHistoryEntry(from, to, APPROVAL_ACTION.SUBMIT_TO_PROVIDER, '', ctx.userId, now);
    const updated = await templateApprovalRepository.submitToProvider(ctx.tenantId, id, {
      now,
      historyEntry: entry,
    });

    await logActivity(ctx, updated, ACTIVITY_TYPE.WHATSAPP_TEMPLATE_SUBMITTED_TO_PROVIDER,
      'Template submitted to provider', { from, to });
    return toTemplateDTO(updated);
  },

  // ── Provider webhook-driven transitions (no user context) ──────────────
  /**
   * Webhooks carry no authenticated user, so the template is resolved by its
   * globally-unique id and the tenant is derived from the record. Subsequent
   * writes are scoped to that tenantId.
   */
  async resolveWebhookTemplate({ templateId, providerTemplateId }) {
    let template = null;
    if (templateId) template = await templateApprovalRepository.findByIdUnscoped(templateId);
    if (!template && providerTemplateId) {
      template = await templateApprovalRepository.findByProviderTemplateId(providerTemplateId);
    }
    if (!template) throw new AppError(404, 'Template not found for webhook');
    return template;
  },

  webhookCtx(template) {
    return { tenantId: template.tenantId, userId: PROVIDER_ACTOR, role: null };
  },

  async providerApproved(payload) {
    const template = await this.resolveWebhookTemplate(payload);
    const ctx = this.webhookCtx(template);
    const from = template.approvalStatus;
    const to = APPROVAL_STATUS.PROVIDER_APPROVED;
    this.validateTransition(from, to);

    const now = new Date();
    const entry = buildHistoryEntry(from, to, APPROVAL_ACTION.PROVIDER_APPROVED, payload.providerStatus || '', PROVIDER_ACTOR, now);
    const updated = await templateApprovalRepository.providerApproved(template.tenantId, template._id, {
      now,
      providerTemplateId: payload.providerTemplateId,
      historyEntry: entry,
    });

    await logActivity(ctx, updated, ACTIVITY_TYPE.WHATSAPP_TEMPLATE_PROVIDER_APPROVED,
      'Template approved by provider', { from, to, providerTemplateId: payload.providerTemplateId });
    return toTemplateDTO(updated);
  },

  async providerRejected(payload) {
    const template = await this.resolveWebhookTemplate(payload);
    const ctx = this.webhookCtx(template);
    const from = template.approvalStatus;
    const to = APPROVAL_STATUS.PROVIDER_REJECTED;
    this.validateTransition(from, to);

    const now = new Date();
    const entry = buildHistoryEntry(from, to, APPROVAL_ACTION.PROVIDER_REJECTED, payload.providerRejectionMessage || '', PROVIDER_ACTOR, now);
    const updated = await templateApprovalRepository.providerRejected(template.tenantId, template._id, {
      now,
      reason: payload.providerRejectionReason || null,
      message: payload.providerRejectionMessage || null,
      historyEntry: entry,
    });

    await logActivity(ctx, updated, ACTIVITY_TYPE.WHATSAPP_TEMPLATE_PROVIDER_REJECTED,
      'Template rejected by provider', {
        from,
        to,
        providerRejectionReason: payload.providerRejectionReason || null,
      });
    return toTemplateDTO(updated);
  },

  async providerPaused(payload) {
    const template = await this.resolveWebhookTemplate(payload);
    const ctx = this.webhookCtx(template);
    const from = template.approvalStatus;
    const to = APPROVAL_STATUS.PAUSED;
    this.validateTransition(from, to);

    const now = new Date();
    const entry = buildHistoryEntry(from, to, APPROVAL_ACTION.PROVIDER_PAUSED, payload.providerStatus || '', PROVIDER_ACTOR, now);
    const updated = await templateApprovalRepository.providerPaused(template.tenantId, template._id, {
      now,
      historyEntry: entry,
    });

    await logActivity(ctx, updated, ACTIVITY_TYPE.WHATSAPP_TEMPLATE_PAUSED,
      'Template paused by provider (quality drop)', { from, to });
    return toTemplateDTO(updated);
  },

  async providerDisabled(payload) {
    const template = await this.resolveWebhookTemplate(payload);
    const ctx = this.webhookCtx(template);
    const from = template.approvalStatus;
    const to = APPROVAL_STATUS.DISABLED;
    this.validateTransition(from, to);

    const now = new Date();
    const entry = buildHistoryEntry(from, to, APPROVAL_ACTION.PROVIDER_DISABLED, payload.providerStatus || '', PROVIDER_ACTOR, now);
    const updated = await templateApprovalRepository.providerDisabled(template.tenantId, template._id, {
      now,
      historyEntry: entry,
    });

    await logActivity(ctx, updated, ACTIVITY_TYPE.WHATSAPP_TEMPLATE_DISABLED,
      'Template disabled by provider', { from, to });
    return toTemplateDTO(updated);
  },

  // ── Timeline + usage guard ─────────────────────────────────────────────
  async getTimeline(ctx, id) {
    const timeline = await templateApprovalRepository.getTimeline(ctx.tenantId, id);
    if (timeline === null) throw new AppError(404, 'Template not found');
    return timeline;
  },

  /**
   * Business-rule guard. A template is usable for sending (Campaigns,
   * Broadcasts, Nurture, Automation, Manual Sends) ONLY when
   * approvalStatus === PROVIDER_APPROVED.
   */
  async assertUsable(ctx, id) {
    const template = await this.loadTemplate(ctx.tenantId, id);
    if (template.approvalStatus !== USABLE_APPROVAL_STATUS) {
      throw new AppError(409, 'Template is not provider-approved and cannot be used for sending');
    }
    return toTemplateDTO(template);
  },

  isUsable(template) {
    return !!template && template.approvalStatus === USABLE_APPROVAL_STATUS;
  },

  /** Validate a provider rejection reason string (used by the validator layer). */
  isValidRejectionReason(reason) {
    return reason === undefined || reason === null || PROVIDER_REJECTION_REASON_VALUES.includes(reason);
  },
};
