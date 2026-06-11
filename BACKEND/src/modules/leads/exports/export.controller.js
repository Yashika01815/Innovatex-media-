import { asyncHandler } from '../../../shared/helpers/lead.helpers.js';
import { exportService } from './export.service.js';

export const exportController = {
  // GET /api/leads/export
  exportCsv: asyncHandler(async (req, res) => {
    const csv = await exportService.exportLeadsCsv(req.context, req.query);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="leads.csv"');
    res.status(200).send(csv);
  }),
};
