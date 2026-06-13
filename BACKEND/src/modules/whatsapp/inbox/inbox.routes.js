import { Router } from 'express';
import { inboxController } from './inbox.controller.js';
import { withContext } from '../../../shared/helpers/lead.helpers.js';

const router = Router();
router.use(withContext);

// GET /api/whatsapp/inbox
router.get('/', inboxController.getInbox);

export default router;
