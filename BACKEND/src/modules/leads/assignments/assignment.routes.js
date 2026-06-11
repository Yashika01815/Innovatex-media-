import { Router } from 'express';
import { assignmentController } from './assignment.controller.js';
import { withContext } from '../../../shared/helpers/lead.helpers.js';
import { authorize, ACTIONS } from '../../../shared/permissions/lead.permissions.js';

// Mounted at the /api/leads base (composed by lead.routes.js).
const router = Router();

router.use(withContext);

// Bulk must be declared before "/:id/..." param routes.
router.post('/assign/bulk', authorize(ACTIONS.ASSIGN), assignmentController.bulkAssign);

router.post('/:id/assign/auto', authorize(ACTIONS.ASSIGN), assignmentController.autoAssign);
router.post('/:id/assign', authorize(ACTIONS.ASSIGN), assignmentController.assign);
router.post('/:id/unassign', authorize(ACTIONS.ASSIGN), assignmentController.unassign);

export default router;
