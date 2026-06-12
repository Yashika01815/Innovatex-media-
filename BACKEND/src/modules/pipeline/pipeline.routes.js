import { Router } from 'express';

import analyticsRoutes from './analytics/analytics.routes.js';
import dealRoutes from './deals/deal.routes.js';

const pipelineRouter = Router();

pipelineRouter.use('/analytics', analyticsRoutes);
pipelineRouter.use('/deals', dealRoutes);

export default pipelineRouter;