import { asyncHandler, AppError } from '../../../../shared/helpers/lead.helpers.js';
import { sendSuccess, sendCreated, sendPaginated } from '../../../../utils/responses.js';
import { contactsService } from './contacts.service.js';

/**
 * Build the request context. The spec uses req.user.tenantId (auth middleware);
 * we also fall back to req.context (the WhatsApp module's withContext) so this
 * controller works under either setup.
 */
function buildCtx(req) {
  const user = req.user || {};
  const fallback = req.context || {};
  const tenantId = user.tenantId || fallback.tenantId;
  if (!tenantId) {
    throw new AppError(401, 'Missing tenant context');
  }
  return {
    tenantId,
    userId: user.id || user._id || fallback.userId || null,
    userName: user.name || user.fullName || null,
  };
}

export const contactsController = {
  // POST /api/whatsapp/contacts
  create: asyncHandler(async (req, res) => {
    const contact = await contactsService.createContact(buildCtx(req), req.body);
    return sendCreated(res, contact, 'Contact created');
  }),

  // GET /api/whatsapp/contacts
  list: asyncHandler(async (req, res) => {
    const { data, pagination } = await contactsService.listContacts(buildCtx(req), req.query);
    return sendPaginated(res, data, pagination);
  }),

  // GET /api/whatsapp/contacts/:id
  get: asyncHandler(async (req, res) => {
    const contact = await contactsService.getContact(buildCtx(req), req.params.id);
    return sendSuccess(res, contact);
  }),

  // PATCH /api/whatsapp/contacts/:id
  update: asyncHandler(async (req, res) => {
    const contact = await contactsService.updateContact(buildCtx(req), req.params.id, req.body);
    return sendSuccess(res, contact, 'Contact updated');
  }),

  // PATCH /api/whatsapp/contacts/:id/consent
  updateConsent: asyncHandler(async (req, res) => {
    const contact = await contactsService.updateConsent(buildCtx(req), req.params.id, req.body.consentStatus);
    return sendSuccess(res, contact, 'Consent updated');
  }),

  // PATCH /api/whatsapp/contacts/:id/opt-out
  updateOptOut: asyncHandler(async (req, res) => {
    const contact = await contactsService.updateOptOut(buildCtx(req), req.params.id, req.body.optOutStatus);
    return sendSuccess(res, contact, 'Opt-out status updated');
  }),

  // POST /api/whatsapp/contacts/:id/assign
  assign: asyncHandler(async (req, res) => {
    const contact = await contactsService.assignContact(buildCtx(req), req.params.id, {
      userId: req.body.userId,
      userName: req.body.userName,
    });
    return sendSuccess(res, contact, 'Contact assigned');
  }),

  // POST /api/whatsapp/contacts/:id/tags
  addTag: asyncHandler(async (req, res) => {
    const contact = await contactsService.addTag(buildCtx(req), req.params.id, req.body.tag);
    return sendSuccess(res, contact, 'Tag added');
  }),

  // DELETE /api/whatsapp/contacts/:id/tags/:tag
  removeTag: asyncHandler(async (req, res) => {
    const contact = await contactsService.removeTag(buildCtx(req), req.params.id, req.params.tag);
    return sendSuccess(res, contact, 'Tag removed');
  }),
};
