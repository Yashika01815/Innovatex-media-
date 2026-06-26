/**
 * Attribution controller — thin HTTP layer only.
 *
 * FILE: src/modules/attribution/attribution.controller.js
 *
 * ENDPOINTS:
 *   GET /api/attribution/dashboard     — full page data in one call
 *   GET /api/attribution/kpis          — KPI cards
 *   GET /api/attribution/leads-by-source    — pie chart
 *   GET /api/attribution/revenue-by-source  — bar chart
 *   GET /api/attribution/bookings-by-source — bar chart
 *   GET /api/attribution/events-by-type     — chart
 *   GET /api/attribution/source-to-revenue  — breakdown table
 *   GET /api/attribution/events             — recent events table (paginated)
 *   GET /api/attribution/export             — CSV export data
 *   POST /api/attribution/events            — create tracking event (internal use)
 */

import * as attrService from './attribution.service.js';
import { sendSuccess, sendCreated, sendPaginated } from '../../utils/apiResponse.js';
import asyncHandler from '../../utils/asyncHandler.js';

/**
 * getDashboard — GET /api/attribution/dashboard
 * Returns all page data in one request — used on initial page load.
 * SOURCE: FRONTEND_SPEC §11 full attribution page
 */
export const getDashboard = asyncHandler(async (req, res) => {
  const filter = buildFilter(req.query);
  const data   = await attrService.getAttributionDashboard(req.user.tenantId, filter);
  return sendSuccess(res, data, 'Attribution dashboard fetched successfully');
});

/**
 * getKpis — GET /api/attribution/kpis
 * SOURCE: FRONTEND_SPEC §11 KPI row — Total Events | Attributed Revenue | Top Source | Unique Sources
 */
export const getKpis = asyncHandler(async (req, res) => {
  const filter = buildFilter(req.query);
  const kpis   = await attrService.getKpiSummary(req.user.tenantId, filter);
  return sendSuccess(res, kpis, 'Attribution KPIs fetched');
});

/**
 * getLeadsBySource — GET /api/attribution/leads-by-source
 * SOURCE: FRONTEND_SPEC §11 "Leads by Source" pie chart
 */
export const getLeadsBySource = asyncHandler(async (req, res) => {
  const data = await attrService.getLeadsBySource(
    req.user.tenantId,
    buildFilter(req.query)
  );
  return sendSuccess(res, data, 'Leads by source fetched');
});

/**
 * getRevenueBySource — GET /api/attribution/revenue-by-source
 * SOURCE: FRONTEND_SPEC §11 "Revenue by Source" chart
 */
export const getRevenueBySource = asyncHandler(async (req, res) => {
  const data = await attrService.getRevenueBySource(
    req.user.tenantId,
    buildFilter(req.query)
  );
  return sendSuccess(res, data, 'Revenue by source fetched');
});

/**
 * getBookingsBySource — GET /api/attribution/bookings-by-source
 * SOURCE: FRONTEND_SPEC §11 "Bookings by Source" chart
 */
export const getBookingsBySource = asyncHandler(async (req, res) => {
  const data = await attrService.getBookingsBySource(
    req.user.tenantId,
    buildFilter(req.query)
  );
  return sendSuccess(res, data, 'Bookings by source fetched');
});

/**
 * getEventsByType — GET /api/attribution/events-by-type
 * SOURCE: FRONTEND_SPEC §11 "Tracking Events by Type" chart
 */
export const getEventsByType = asyncHandler(async (req, res) => {
  const data = await attrService.getEventsByType(
    req.user.tenantId,
    buildFilter(req.query)
  );
  return sendSuccess(res, data, 'Events by type fetched');
});

/**
 * getSourceToRevenue — GET /api/attribution/source-to-revenue
 * SOURCE: FRONTEND_SPEC §11 "Source-to-Revenue breakdown" table
 */
export const getSourceToRevenue = asyncHandler(async (req, res) => {
  const data = await attrService.getSourceToRevenueBreakdown(
    req.user.tenantId,
    buildFilter(req.query)
  );
  return sendSuccess(res, data, 'Source to revenue breakdown fetched');
});

/**
 * getRecentEvents — GET /api/attribution/events
 * SOURCE: FRONTEND_SPEC §11 "Recent Tracking Events" table
 * Columns: Event | Lead | Source | Campaign | Provider | Time
 */
export const getRecentEvents = asyncHandler(async (req, res) => {
  const filter  = buildFilter(req.query);
  const options = {
    page:  parseInt(req.query.page)  || 1,
    limit: parseInt(req.query.limit) || 20,
  };

  const result = await attrService.getRecentEvents(
    req.user.tenantId,
    filter,
    options
  );

  return sendPaginated(
    res,
    result.events,
    result.pagination,
    'Recent events fetched'
  );
});

/**
 * exportCsv — GET /api/attribution/export
 * Returns all events as JSON for CSV download.
 * SOURCE: MASTER_SPEC §B10 "CSV" + FRONTEND_SPEC §11 export button
 */
export const exportCsv = asyncHandler(async (req, res) => {
  const filter = buildFilter(req.query);
  const events = await attrService.getExportData(req.user.tenantId, filter);

  // Format for CSV export
  const rows = events.map((e) => ({
    event_type:    e.event_type,
    lead_name:     e.lead_id?.name || '',
    lead_email:    e.lead_id?.email || '',
    source:        e.source        || 'Direct',
    medium:        e.medium        || '',
    campaign:      e.campaign      || '',
    utm_source:    e.utm_source    || '',
    utm_medium:    e.utm_medium    || '',
    utm_campaign:  e.utm_campaign  || '',
    provider_name: e.provider_name || '',
    revenue:       e.revenue       || 0,
    created_at:    e.created_at,
  }));

  return sendSuccess(res, rows, 'Export data fetched');
});

/**
 * createEvent — POST /api/attribution/events
 * Internal endpoint for creating tracking events from other services.
 * Also used by the public capture form (POST /capture).
 */
export const createEvent = asyncHandler(async (req, res) => {
  const event = await attrService.createTrackingEvent({
    ...req.body,
    tenant_id:  req.user?.tenantId || req.body.tenant_id,
    created_by: req.user?.sub      || null,
  });
  return sendCreated(res, { event }, 'Tracking event created');
});

// =============================================================================
// PRIVATE HELPERS
// =============================================================================

/**
 * buildFilter — extracts filter params from query string.
 * Supports: event_type, source, campaign, date_from, date_to
 */
const buildFilter = (query = {}) => {
  const filter = {};
  if (query.event_type) filter.event_type = query.event_type;
  if (query.source)     filter.source     = query.source;
  if (query.campaign)   filter.campaign   = query.campaign;
  if (query.date_from)  filter.date_from  = query.date_from;
  if (query.date_to)    filter.date_to    = query.date_to;
  return filter;
};