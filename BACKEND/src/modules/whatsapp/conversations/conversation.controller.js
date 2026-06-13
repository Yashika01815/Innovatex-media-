import { asyncHandler } from '../../../shared/helpers/lead.helpers.js';
import { conversationService } from './conversation.service.js';

export const conversationController = {
  // GET /api/whatsapp/conversations
  list: asyncHandler(async (req, res) => {
    const result = await conversationService.getConversations(req.context, req.query);
    res.json(result);
  }),

  // Only for development phase
  create: asyncHandler(async (req, res) => {
  const conversation = await conversationService.createConversation(
    req.context,
    req.body
  );

    res.status(201).json(conversation);
  }),
  // GET /api/whatsapp/conversations/:id
  details: asyncHandler(async (req, res) => {
    const result = await conversationService.getConversationDetails(req.context, req.params.id);
    res.json(result);
  }),

  // POST /api/whatsapp/conversations/:id/assign
  assign: asyncHandler(async (req, res) => {
    const conversation = await conversationService.assign(req.context, req.params.id, req.body.userId);
    res.json(conversation);
  }),

  // PATCH /api/whatsapp/conversations/:id/status
  changeStatus: asyncHandler(async (req, res) => {
    const conversation = await conversationService.changeStatus(req.context, req.params.id, req.body.status);
    res.json(conversation);
  }),
};