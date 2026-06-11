import { asyncHandler } from '../../../shared/helpers/lead.helpers.js';
import { assignmentService } from './assignment.service.js';
import { toLeadDTO } from '../../../shared/mappers/lead.mappers.js';

export const assignmentController = {
  // POST /api/leads/:id/assign  { userId }
  assign: asyncHandler(async (req, res) => {
    const lead = await assignmentService.assign(
      req.context,
      req.params.id,
      req.body?.userId,
    );
    res.json(toLeadDTO(lead));
  }),

  // POST /api/leads/:id/unassign
  unassign: asyncHandler(async (req, res) => {
    const lead = await assignmentService.unassign(req.context, req.params.id);
    res.json(toLeadDTO(lead));
  }),

  // POST /api/leads/:id/assign/auto  { candidates: [] }
  autoAssign: asyncHandler(async (req, res) => {
    const lead = await assignmentService.autoAssign(
      req.context,
      req.params.id,
      req.body?.candidates,
    );
    res.json(toLeadDTO(lead));
  }),

  // POST /api/leads/assign/bulk  { leadIds: [], userId }
  bulkAssign: asyncHandler(async (req, res) => {
    const results = await assignmentService.bulkAssign(
      req.context,
      req.body?.leadIds,
      req.body?.userId,
    );
    res.json({ results });
  }),
};
