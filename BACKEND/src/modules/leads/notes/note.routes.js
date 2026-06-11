import { Router } from 'express';
import { noteController } from './note.controller.js';
import { withContext } from '../../../shared/helpers/lead.helpers.js';
import { authorize, ACTIONS } from '../../../shared/permissions/lead.permissions.js';

const router = Router({ mergeParams: true });

router.use(withContext);

router
  .route('/')
  .get(authorize(ACTIONS.READ), noteController.list) // GET  /api/leads/:id/notes
  .post(authorize(ACTIONS.UPDATE), noteController.create); // POST /api/leads/:id/notes

export default router;
