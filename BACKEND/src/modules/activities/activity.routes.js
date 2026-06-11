import { Router } from 'express';
import { activityController } from './activity.controller.js';
import { withContext } from '../shared/lead.helpers.js';
import { authorize, ACTIONS } from '../shared/lead.permissions.js';

// mergeParams so :id from the parent /api/leads/:id mount is available.
const router = Router({ mergeParams: true });

router.use(withContext);

// GET /api/leads/:id/activities
router.get('/', authorize(ACTIONS.READ), activityController.getTimeline);

export default router;
