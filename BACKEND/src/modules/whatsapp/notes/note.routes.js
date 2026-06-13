import { Router } from 'express';
import { noteController } from './note.controller.js';
import { validateCreateNote } from './note.validator.js';
import { withContext } from '../../../shared/helpers/lead.helpers.js';

// mergeParams to read :id from the parent /conversations/:id mount.
const router = Router({ mergeParams: true });
router.use(withContext);

router
  .route('/')
  .get(noteController.list)   // GET  /api/whatsapp/conversations/:id/notes
  .post(validateCreateNote, noteController.create); // POST /api/whatsapp/conversations/:id/notes

export default router;
