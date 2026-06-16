import { asyncHandler } from '../../../../shared/helpers/lead.helpers.js';
import { inboxService } from './inbox.service.js';

export const inboxController = {
  // GET /api/whatsapp/inbox
  getInbox: asyncHandler(async (req, res) => {
    const result = await inboxService.getInbox(req.context, req.query);
    res.json(result);
  }),
};
