import { Readable } from 'stream';
import csvParser from 'csv-parser';

import { asyncHandler, AppError } from '../../../shared/helpers/lead.helpers.js';
import { importService } from './import.service.js';

export const importController = {
  // POST /api/leads/import
  // Supports:
  // 1. CSV File Upload (multipart/form-data)
  // 2. JSON { rows: [...] }
  // 3. JSON { csv: "..." }
  // 4. Raw CSV text body

  importCsv: asyncHandler(async (req, res) => {
    const skipDuplicates = req.query.skipDuplicates !== 'false';

    let summary;

    /*
    |--------------------------------------------------------------------------
    | Option 1: CSV File Upload
    |--------------------------------------------------------------------------
    */

    if (req.file) {
      const rows = [];

      await new Promise((resolve, reject) => {
        Readable.from(req.file.buffer)
          .pipe(csvParser())
          .on('data', (row) => rows.push(row))
          .on('end', resolve)
          .on('error', reject);
      });

      summary = await importService.importRows(
        req.context,
        rows,
        {
          skipDuplicates,
        }
      );

      return res.status(201).json(summary);
    }

    /*
    |--------------------------------------------------------------------------
    | Option 2: JSON Rows
    |--------------------------------------------------------------------------
    */

    if (Array.isArray(req.body?.rows)) {
      summary = await importService.importRows(
        req.context,
        req.body.rows,
        {
          skipDuplicates,
        }
      );

      return res.status(201).json(summary);
    }

    /*
    |--------------------------------------------------------------------------
    | Option 3 & 4: CSV String / Raw CSV Text
    |--------------------------------------------------------------------------
    */

    const csv =
      typeof req.body === 'string'
        ? req.body
        : req.body?.csv;

    if (!csv) {
      throw AppError.badRequest(
        'Provide CSV file, CSV text ({ csv }), or rows ({ rows })'
      );
    }

    summary = await importService.importFromCsv(
      req.context,
      csv,
      {
        skipDuplicates,
      }
    );

    return res.status(201).json(summary);
  }),
};