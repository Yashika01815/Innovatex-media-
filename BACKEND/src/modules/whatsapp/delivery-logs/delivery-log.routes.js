import { Router } from 'express';
import { asyncHandler, withContext } from '../../../shared/helpers/lead.helpers.js';
import { deliveryLogService } from './delivery-log.service.js';

// mergeParams to read :id from the parent /conversations/:id mount.
const router = Router({ mergeParams: true });
router.use(withContext);

// GET /api/whatsapp/conversations/:id/delivery-logs
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const logs = await deliveryLogService.getByConversation(req.context, req.params.id);
    res.json(logs);
  }),
);

export default router;
