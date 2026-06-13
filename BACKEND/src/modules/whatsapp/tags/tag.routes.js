import { Router } from 'express';
import { tagController } from './tag.controller.js';
import { validateAddTag } from './tag.validator.js';
import { withContext } from '../../../shared/helpers/lead.helpers.js';

const router = Router({ mergeParams: true });
router.use(withContext);

// POST   /api/whatsapp/conversations/:id/tags
router.post('/', validateAddTag, tagController.add);

// DELETE /api/whatsapp/conversations/:id/tags/:tag
router.delete('/:tag', tagController.remove);

export default router;
