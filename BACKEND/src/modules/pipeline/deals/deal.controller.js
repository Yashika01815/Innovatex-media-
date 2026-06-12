import { asyncHandler } from '../../../shared/helpers/lead.helpers.js';
import { dealService } from './deal.service.js';

export const dealController = {
  // POST /api/deals
  create: asyncHandler(async (req, res) => {
    const deal = await dealService.createDeal(req.context, req.body);
    res.status(201).json(deal);
  }),

  // GET /api/deals
  list: asyncHandler(async (req, res) => {
    const result = await dealService.getDeals(req.context, req.query);
    res.json(result);
  }),

  // GET /api/deals/:id
  get: asyncHandler(async (req, res) => {
    const deal = await dealService.getDeal(req.context, req.params.id);
    res.json(deal);
  }),

  // PATCH /api/deals/:id
  update: asyncHandler(async (req, res) => {
    const deal = await dealService.updateDeal(req.context, req.params.id, req.body);
    res.json(deal);
  }),

  // DELETE /api/deals/:id  (soft delete)
  archive: asyncHandler(async (req, res) => {
    const deal = await dealService.archiveDeal(req.context, req.params.id);
    res.json({ message: 'Deal archived', deal });
  }),

  // PATCH /api/deals/:id/stage
  moveStage: asyncHandler(async (req, res) => {
    const deal = await dealService.moveStage(
      req.context,
      req.params.id,
      req.body.stage,
    );
    res.json(deal);
  }),

  // GET /api/pipeline  (board) — exposed via the pipeline router
  board: asyncHandler(async (req, res) => {
    const board = await dealService.getBoard(req.context, req.query);
    res.json(board);
  }),
};