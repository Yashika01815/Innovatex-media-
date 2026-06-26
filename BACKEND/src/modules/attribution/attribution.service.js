/**
 * Attribution Service — business logic for attribution page + event emission.
 *
 * FILE: src/modules/attribution/attribution.service.js
 *
 * TWO RESPONSIBILITIES:
 *
 * 1. EMIT TRACKING EVENTS — called by all other modules
 *    booking.service.js → emitTrackingEvent() was console.log placeholder
 *    call.service.js    → same
 *    qualification.service.js → same
 *    NOW they all call: createTrackingEvent(data) from this service
 *
 * 2. ATTRIBUTION PAGE DATA — powers all charts, KPIs, tables on /attribution
 *    SOURCE: FRONTEND_SPEC §11 Attribution page
 *
 * Connected modules (all read from TrackingEvent collection):
 *   Lead        → LEAD_CREATED event on createLead()
 *   Booking     → BOOKING_CREATED event on createBooking()
 *   Call        → CALL_COMPLETED event on createCall()
 *   Qualification → AI_QUALIFIED event on applyResult()
 *   Pipeline    → PIPELINE_STAGE_CHANGED, DEAL_WON, DEAL_LOST events
 *   WhatsApp    → WHATSAPP_INBOUND, WHATSAPP_OUTBOUND, WHATSAPP_CLICK events
 *   Payments    → PAYMENT_CREATED, PAYMENT_COMPLETED events (future module)
 */

import * as attrRepo from './attribution.repository.js';
import { AppError, paginationMeta } from '../../shared/helpers/lead.helpers.js';
import { TRACKING_EVENT_TYPE } from './attribution.constants.js';

// ── Import Lead model to enrich events with UTM data ─────────────────────────
import { Lead } from '../leads/lead/lead.model.js';

// =============================================================================
// CREATE TRACKING EVENT — called by all modules
// =============================================================================

/**
 * createTrackingEvent — writes a tracking event to the database.
 *
 * REPLACES the console.log placeholder in:
 *   - booking.service.js  → emitTrackingEvent()
 *   - call.service.js     → emitTrackingEvent()
 *   - qualification.service.js → emitTrackingEvent()
 *
 * Auto-enriches source/utm from the Lead document if not provided.
 * Non-blocking wrapper — never throws into the caller's flow.
 *
 * @param {Object} data
 *   { tenant_id, event_type, lead_id?, source?, medium?, campaign?,
 *     utm_*, provider_name?, lifecycle_stage?, revenue?, metadata?, created_by? }
 */
export const createTrackingEvent = async (data) => {
  try {
    let enriched = { ...data };

    // Auto-enrich source/utm from lead if not provided and lead_id exists
    if (data.lead_id && !data.source) {
      const lead = await Lead.findOne({
        _id:       data.lead_id,
        tenant_id: data.tenant_id,
      }).select('source medium campaign utm_source utm_medium utm_campaign utm_content utm_term');

      if (lead) {
        enriched.source       = lead.source       || null;
        enriched.medium       = lead.medium       || null;
        enriched.campaign     = lead.campaign     || null;
        enriched.utm_source   = lead.utm_source   || null;
        enriched.utm_medium   = lead.utm_medium   || null;
        enriched.utm_campaign = lead.utm_campaign || null;
        enriched.utm_content  = lead.utm_content  || null;
        enriched.utm_term     = lead.utm_term     || null;
      }
    }

    return await attrRepo.create(enriched);
  } catch (err) {
    // Non-blocking — tracking failure never crashes the parent operation
    console.warn(`[attribution] tracking event failed: ${err.message}`, {
      event_type: data.event_type,
      lead_id:    data.lead_id,
    });
    return null;
  }
};

// =============================================================================
// ATTRIBUTION PAGE — KPI SUMMARY
// =============================================================================

/**
 * getKpiSummary — 4 KPI cards on the attribution page.
 * SOURCE: FRONTEND_SPEC §11 KPI cards:
 *   Total Events | Attributed Revenue | Top Source | Unique Sources
 */
export const getKpiSummary = (tenantId, filter = {}) =>
  attrRepo.getKpiCounts(tenantId, filter);

// =============================================================================
// ATTRIBUTION PAGE — CHARTS
// =============================================================================

/**
 * getLeadsBySource — data for "Leads by Source" pie chart.
 * SOURCE: FRONTEND_SPEC §11
 */
export const getLeadsBySource = (tenantId, filter = {}) =>
  attrRepo.getLeadsBySource(tenantId, filter);

/**
 * getRevenueBySource — data for "Revenue by Source" bar chart.
 * SOURCE: FRONTEND_SPEC §11
 */
export const getRevenueBySource = (tenantId, filter = {}) =>
  attrRepo.getRevenueBySource(tenantId, filter);

/**
 * getBookingsBySource — data for "Bookings by Source" bar chart.
 * SOURCE: FRONTEND_SPEC §11
 */
export const getBookingsBySource = (tenantId, filter = {}) =>
  attrRepo.getBookingsBySource(tenantId, filter);

/**
 * getEventsByType — data for "Tracking Events by Type" chart.
 * SOURCE: FRONTEND_SPEC §11
 */
export const getEventsByType = (tenantId, filter = {}) =>
  attrRepo.getEventsByType(tenantId, filter);

// =============================================================================
// ATTRIBUTION PAGE — SOURCE TO REVENUE BREAKDOWN TABLE
// =============================================================================

/**
 * getSourceToRevenueBreakdown — per-source funnel table.
 * SOURCE: FRONTEND_SPEC §11 "Source-to-Revenue breakdown":
 *   Source | Leads | Qualified | Booked | Calls | Booking Conv% | Revenue
 */
export const getSourceToRevenueBreakdown = (tenantId, filter = {}) =>
  attrRepo.getSourceToRevenueBreakdown(tenantId, filter);

// =============================================================================
// ATTRIBUTION PAGE — RECENT TRACKING EVENTS TABLE
// =============================================================================

/**
 * getRecentEvents — paginated recent events table.
 * SOURCE: FRONTEND_SPEC §11 "Recent Tracking Events" table:
 *   Event | Lead | Source | Campaign | Provider | Time
 */
export const getRecentEvents = async (tenantId, filter = {}, options = {}) => {
  const { page = 1, limit = 20 } = options;
  const skip = (page - 1) * limit;

  const [events, total] = await Promise.all([
    attrRepo.getRecentEvents(tenantId, filter, { skip, limit }),
    attrRepo.countRecentEvents(tenantId, filter),
  ]);

  return {
    events,
    pagination: paginationMeta({ page, limit, total }),
  };
};

// =============================================================================
// GET ALL ATTRIBUTION DATA — single call for full page load
// =============================================================================

/**
 * getAttributionDashboard — fetches all data for the attribution page in parallel.
 * SOURCE: FRONTEND_SPEC §11 — entire attribution page
 *
 * Returns: { kpis, leadsBySource, revenueBySource, bookingsBySource,
 *             eventsByType, sourceToRevenue, recentEvents }
 */
export const getAttributionDashboard = async (tenantId, filter = {}) => {
  const [
    kpis,
    leadsBySource,
    revenueBySource,
    bookingsBySource,
    eventsByType,
    sourceToRevenue,
    recentEventsResult,
  ] = await Promise.all([
    attrRepo.getKpiCounts(tenantId, filter),
    attrRepo.getLeadsBySource(tenantId, filter),
    attrRepo.getRevenueBySource(tenantId, filter),
    attrRepo.getBookingsBySource(tenantId, filter),
    attrRepo.getEventsByType(tenantId, filter),
    attrRepo.getSourceToRevenueBreakdown(tenantId, filter),
    attrRepo.getRecentEvents(tenantId, filter, { skip: 0, limit: 20 }),
  ]);

  return {
    kpis,
    leadsBySource,
    revenueBySource,
    bookingsBySource,
    eventsByType,
    sourceToRevenue,
    recentEvents: recentEventsResult,
  };
};

// =============================================================================
// CSV EXPORT DATA
// =============================================================================

/**
 * getExportData — returns all tracking events for CSV export.
 * SOURCE: MASTER_SPEC §B10 "CSV" + FRONTEND_SPEC §11 export button
 */
export const getExportData = (tenantId, filter = {}) =>
  attrRepo.getRecentEvents(tenantId, filter, { skip: 0, limit: 10000 });