import { Router } from 'express';
import { contactsController } from './contacts.controller.js';
import {
  validateCreateContact,
  validateUpdateContact,
  validateGetContact,
  validateListContacts,
  validateConsent,
  validateOptOut,
  validateAssign,
  validateAddTag,
  validateRemoveTag,
} from './contacts.validator.js';

/**
 * WhatsApp Contacts routes — mount at: app.use('/api/whatsapp/contacts', contactsRoutes)
 * (composed by whatsapp.routes.js). Auth middleware is expected upstream to
 * populate req.user (tenantId, id, name).
 */
const router = Router();

router.post('/', validateCreateContact, contactsController.create);
router.get('/', validateListContacts, contactsController.list);
router.get('/:id', validateGetContact, contactsController.get);
router.patch('/:id', validateUpdateContact, contactsController.update);
router.patch('/:id/consent', validateConsent, contactsController.updateConsent);
router.patch('/:id/opt-out', validateOptOut, contactsController.updateOptOut);
router.post('/:id/assign', validateAssign, contactsController.assign);
router.post('/:id/tags', validateAddTag, contactsController.addTag);
router.delete('/:id/tags/:tag', validateRemoveTag, contactsController.removeTag);

export default router;
