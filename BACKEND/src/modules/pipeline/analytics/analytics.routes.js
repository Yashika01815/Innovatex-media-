import { Router } from 'express';
import { analyticsController } from './analytics.controller.js';
import { dealController } from '../deals/deal.controller.js';
import { withContext } from '../../../shared/helpers/lead.helpers.js';
import { authorize, DEAL_ACTIONS } from '../../../shared/permissions/pipeline.permissions.js';

/**
 * Pipeline-level routes. Mount at: app.use('/api/pipeline', pipelineRoutes)
 *
 *   GET /api/pipeline        → grouped Kanban board (9 columns)
 *   GET /api/pipeline/stats  → analytics summary
 *
 * The board handler lives in the deal controller (it's grouped deals); this
 * router exposes it under the pipeline namespace.
 */
const router = Router();

router.use(withContext);

router.get('/stats', authorize(DEAL_ACTIONS.READ), analyticsController.getStats);
router.get('/', authorize(DEAL_ACTIONS.READ), dealController.board);

export default router;