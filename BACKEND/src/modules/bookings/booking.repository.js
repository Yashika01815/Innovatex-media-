import { Booking } from './booking.model.js';
import { BOOKING_STATUS } from './booking.constants.js';

/**
 * Booking Repository — the only place that touches the Booking collection.
 * No business rules, no events. All queries are tenant-scoped.
 *
 * Pattern matches leadRepository and dealRepository exactly:
 *   - All methods receive tenantId as first or second argument
 *   - Queries always include { tenant_id: tenantId }
 *   - Returns raw Mongoose documents
 */

/** findById — single booking scoped to tenant. */
export const findById = (tenantId, id) =>
  Booking.findOne({ _id: id, tenant_id: tenantId })
    .populate('lead_id',          'name email source')
    .populate('deal_id',          'stage value');

/**
 * findByTenantId — paginated booking list with filters.
 * Filters align with FRONTEND_SPEC §9 table columns.
 */
export const findByTenantId = (
  tenantId,
  filter = {},
  { sort = { meeting_date: -1, meeting_time: -1 }, skip = 0, limit = 20 } = {}
) => {
  const query = { tenant_id: tenantId };

  if (filter.status)           query.status           = filter.status;
  if (filter.assigned_user_id) query.assigned_user_id = filter.assigned_user_id;
  if (filter.meeting_type)     query.meeting_type      = filter.meeting_type;
  if (filter.source)           query.source            = filter.source;

  if (filter.date_from || filter.date_to) {
    query.meeting_date = {};
    if (filter.date_from) query.meeting_date.$gte = filter.date_from;
    if (filter.date_to)   query.meeting_date.$lte = filter.date_to;
  }

  return Booking.find(query)
    .populate('lead_id',  'name email source')
    .populate('deal_id',  'stage value')
    .sort(sort)
    .skip(skip)
    .limit(limit);
};

/** countByTenantId — total count for pagination header. */
export const countByTenantId = (tenantId, filter = {}) => {
  const query = { tenant_id: tenantId };
  if (filter.status)           query.status           = filter.status;
  if (filter.assigned_user_id) query.assigned_user_id = filter.assigned_user_id;
  if (filter.meeting_type)     query.meeting_type      = filter.meeting_type;
  return Booking.countDocuments(query);
};

/**
 * findByLead — all bookings for a specific lead.
 * Used in lead detail drawer (FRONTEND_SPEC §4 linked record counts).
 */
export const findByLead = (tenantId, leadId) =>
  Booking.find({ tenant_id: tenantId, lead_id: leadId })
    .sort({ meeting_date: -1 });

/** countByLead — booking count for a lead (for lead detail linked counts). */
export const countByLead = (tenantId, leadId) =>
  Booking.countDocuments({ tenant_id: tenantId, lead_id: leadId });

/**
 * getKpiCounts — aggregate counts for the 4 KPI cards.
 * SOURCE: FRONTEND_SPEC §9 — Total | Upcoming | Completed | No-Shows
 */
export const getKpiCounts = async (tenantId) => {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  const [total, completed, noShows, cancelled, rescheduled, upcoming] =
    await Promise.all([
      Booking.countDocuments({ tenant_id: tenantId }),
      Booking.countDocuments({ tenant_id: tenantId, status: BOOKING_STATUS.COMPLETED }),
      Booking.countDocuments({ tenant_id: tenantId, status: BOOKING_STATUS.NO_SHOW }),
      Booking.countDocuments({ tenant_id: tenantId, status: BOOKING_STATUS.CANCELLED }),
      Booking.countDocuments({ tenant_id: tenantId, status: BOOKING_STATUS.RESCHEDULED }),
      Booking.countDocuments({
        tenant_id:    tenantId,
        status:       BOOKING_STATUS.SCHEDULED,
        meeting_date: { $gte: today },
      }),
    ]);

  return { total, upcoming, completed, noShows, cancelled, rescheduled };
};

/** create — creates a new booking document. */
export const create = (data) => Booking.create(data);

/** updateById — partial update scoped to tenant, returns updated document. */
export const updateById = (tenantId, id, patch) =>
  Booking.findOneAndUpdate(
    { _id: id, tenant_id: tenantId },
    { $set: patch },
    { new: true, runValidators: true }
  );