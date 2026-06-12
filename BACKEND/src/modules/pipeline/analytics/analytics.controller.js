import { asyncHandler } from '../../../shared/helpers/lead.helpers.js';
import { analyticsService } from './analytics.service.js';

export const analyticsController = {
  // GET /api/pipeline/stats
  getStats: asyncHandler(async (req, res) => {
    const stats = await analyticsService.getStats(req.context);
    res.json(stats);
  }),
};