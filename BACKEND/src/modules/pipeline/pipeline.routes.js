import { Router } from 'express';

import analyticsRoutes from './analytics/analytics.routes.js';
import dealRoutes from './deals/deal.routes.js';

const pipelineRouter = Router();

// analyticsRoutes defines '/' (board) and '/stats' itself -- mounting it at
// the pipeline root (not nested under an extra '/analytics' segment) is
// what makes GET /api/pipeline and GET /api/pipeline/stats actually work,
// matching the intent documented in analytics.routes.js's own header
// comment. The previous `pipelineRouter.use('/analytics', analyticsRoutes)`
// silently shifted both routes to /api/pipeline/analytics(/stats) instead,
// which nothing else in the codebase (docs, frontend, Postman collections)
// ever expected.
pipelineRouter.use('/', analyticsRoutes);
pipelineRouter.use('/deals', dealRoutes);

export default pipelineRouter;