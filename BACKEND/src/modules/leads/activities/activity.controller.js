import { asyncHandler } from '../../../shared/helpers/lead.helpers.js';
import { activityService } from './activity.service.js';

export const activityController = {
  // GET /api/leads/:id/activities  (timeline)
  getTimeline: asyncHandler(async (req, res) => {
    const timeline = await activityService.getTimeline(
      req.context,
      req.params.id,
    );
    res.json(timeline);
  }),
};
