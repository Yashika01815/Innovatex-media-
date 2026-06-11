import { asyncHandler, AppError } from '../../../shared/helpers/lead.helpers.js';
import { importService } from './import.service.js';

export const importController = {
  // POST /api/leads/import
  // Body: raw text/csv, or JSON { csv: "<text>" }, or JSON { rows: [...] }.
  importCsv: asyncHandler(async (req, res) => {
    const skipDuplicates = req.query.skipDuplicates !== 'false';
    let summary;

    if (Array.isArray(req.body?.rows)) {
      summary = await importService.importRows(req.context, req.body.rows, {
        skipDuplicates,
      });
    } else {
      const csv =
        typeof req.body === 'string' ? req.body : req.body?.csv;
      if (!csv) {
        throw AppError.badRequest('Provide CSV text (body or { csv }) or { rows }');
      }
      summary = await importService.importFromCsv(req.context, csv, {
        skipDuplicates,
      });
    }

    res.status(201).json(summary);
  }),
};
