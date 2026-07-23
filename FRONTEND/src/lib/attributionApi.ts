import { apiClient } from '@/lib/apiClient';
import type { AttributionDashboard, AttributionFilter, AttributionExportRow } from '@/types/attribution';

/**
 * SOURCE: src/modules/attribution/attribution.controller.js
 * Note: /export returns JSON rows (sendSuccess), NOT a CSV file stream --
 * confirmed from the controller, which builds a plain array and calls
 * sendSuccess(res, rows, ...). Unlike Leads' export (a real file download),
 * this one needs exportToCSV() client-side, same pattern as Pipeline.
 */
export const attributionApi = {
  getDashboard: (filter?: AttributionFilter) =>
    apiClient.get<AttributionDashboard>('/attribution/dashboard', filter as Record<string, string | undefined>),

  exportData: (filter?: AttributionFilter) =>
    apiClient.get<AttributionExportRow[]>('/attribution/export', filter as Record<string, string | undefined>),
};