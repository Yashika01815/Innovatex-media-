import { Router } from 'express';
import { dealController } from './deal.controller.js';
import {
  validateCreateDeal,
  validateUpdateDeal,
  validateMoveStage,
} from './deal.validator.js';
import { withContext } from '../../../shared/helpers/lead.helpers.js';
import { authorize, DEAL_ACTIONS } from '../../../shared/permissions/pipeline.permissions.js';

/**
 * Mount at: app.use('/api/deals', dealRoutes)
 *
 * "/:id/stage" is declared before "/:id" so it is not shadowed.
 */
const router = Router();

router.use(withContext);

router
  .route('/')
  .get(authorize(DEAL_ACTIONS.READ), dealController.list)
  .post(authorize(DEAL_ACTIONS.CREATE), validateCreateDeal, dealController.create);

// Most important action — declared before the generic "/:id" routes.
router.patch(
  '/:id/stage',
  authorize(DEAL_ACTIONS.MOVE),
  validateMoveStage,
  dealController.moveStage,
);

router
  .route('/:id')
  .get(authorize(DEAL_ACTIONS.READ), dealController.get)
  .patch(authorize(DEAL_ACTIONS.UPDATE), validateUpdateDeal, dealController.update)
  .delete(authorize(DEAL_ACTIONS.DELETE), dealController.archive);

export default router;