import { asyncHandler } from '../../../shared/helpers/lead.helpers.js';
import { messageService } from './message.service.js';

export const messageController = {
  // POST /api/whatsapp/messages/send
  send: asyncHandler(async (req, res) => {
    const result = await messageService.sendMessage(req.context, req.body);
    res.status(201).json(result);
  }),

  // POST /api/whatsapp/messages/simulate-inbound
  simulateInbound: asyncHandler(async (req, res) => {
    const result = await messageService.simulateInbound(req.context, req.body);
    res.status(201).json(result);
  }),

  // GET /api/whatsapp/conversations/:id/messages
  listForConversation: asyncHandler(async (req, res) => {
    const result = await messageService.getMessages(req.context, req.params.id, req.query);
    res.json(result);
  }),
};
