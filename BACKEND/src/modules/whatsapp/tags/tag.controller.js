import { asyncHandler } from '../../../shared/helpers/lead.helpers.js';
import { tagService } from './tag.service.js';

export const tagController = {
  // POST /api/whatsapp/conversations/:id/tags
  add: asyncHandler(async (req, res) => {
    const conversation = await tagService.addTag(req.context, req.params.id, req.body.tag);
    res.status(201).json(conversation);
  }),

  // DELETE /api/whatsapp/conversations/:id/tags/:tag
  remove: asyncHandler(async (req, res) => {
    const conversation = await tagService.removeTag(req.context, req.params.id, req.params.tag);
    res.json(conversation);
  }),
};
