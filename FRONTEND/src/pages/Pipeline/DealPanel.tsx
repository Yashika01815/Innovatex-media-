import { useEffect, useState } from 'react';
import { X, Building2, Mail, Phone, Tag, Clock } from 'lucide-react';
import { Badge } from '@/components/ui';
import { formatCurrency, formatDateTime, timeAgo } from '@/utils/formatters';
import { leadsApi } from '@/lib/leadsApi';
import { STAGE_COLOR } from '@/types/deal';
import type { Deal } from '@/types/deal';
import type { Lead } from '@/types/lead';

/**
 * DealPanel -- an INLINE panel (not an overlay/Drawer). Renders as a fixed-
 * width column next to the board so both are visible at once, matching the
 * reference design. Fetches the full Lead (email/phone) on demand since the
 * board's Deal object doesn't carry contact details, only lead_id.
 *
 * `nameById` resolves each history entry's OWN `movedBy` user id -- not the
 * deal's current assigned_user_id. A deal can be reassigned after a stage
 * move, so always showing the current owner on every past entry would
 * misattribute who actually made each move.
 */
export function DealPanel({ deal, nameById, onClose, onViewDetails, onEdit }: {
  deal: Deal;
  nameById: (id: string | null | undefined) => string;
  onClose: () => void;
  onViewDetails: () => void;
  onEdit: () => void;
}) {
  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    leadsApi.get(deal.lead_id)
      .then((l) => { if (!cancelled) setLead(l); })
      .catch(() => { if (!cancelled) setLead(null); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [deal.lead_id]);

  // stageHistory is real data from the backend (deal.model.js), just never
  // rendered anywhere before now. Newest first for the timeline.
  const history = [...deal.stageHistory].sort(
    (a, b) => new Date(b.movedAt).getTime() - new Date(a.movedAt).getTime(),
  );

  return (
    <div className="flex h-full w-80 shrink-0 flex-col border-l border-ink-100 bg-white">
      <div className="flex items-start justify-between border-b border-ink-100 px-4 py-3.5">
        <h3 className="pr-2 text-sm font-semibold leading-snug text-ink-900">{deal.title}</h3>
        <button onClick={onClose} className="shrink-0 rounded-lg p-1 text-ink-400 hover:bg-ink-100 hover:text-ink-700">
          <X size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="flex items-center gap-2">
          <Badge tone="green">{formatCurrency(deal.value)}</Badge>
          <Badge tone="amber">{deal.probability}% Probability</Badge>
        </div>

        {/* Contact card */}
        <div className="mt-4 space-y-2 rounded-xl border border-ink-100 p-3 text-sm">
          {loading ? (
            <p className="text-xs text-ink-400">Loading contact…</p>
          ) : lead ? (
            <>
              <div className="flex items-center gap-2 text-ink-800">
                <Building2 size={14} className="text-ink-400" /> {lead.company || '—'}
              </div>
              <div className="flex items-center gap-2 text-ink-800">
                <span className="flex h-3.5 w-3.5 items-center justify-center text-ink-400">●</span> {lead.name}
              </div>
              {lead.email && (
                <div className="flex items-center gap-2 text-ink-600">
                  <Mail size={14} className="text-ink-400" /> {lead.email}
                </div>
              )}
              {lead.phone && (
                <div className="flex items-center gap-2 text-ink-600">
                  <Phone size={14} className="text-ink-400" /> {lead.phone}
                </div>
              )}
              <div className="flex items-center gap-2 text-ink-600">
                <Tag size={14} className="text-ink-400" /> Source: {deal.source || '—'}
              </div>
            </>
          ) : (
            <p className="text-xs text-red-500">Could not load contact.</p>
          )}
        </div>

        {deal.description && (
          <div className="mt-4">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-ink-400">Notes</p>
            <p className="text-sm text-ink-700">{deal.description}</p>
          </div>
        )}

        {/* Activity timeline -- real stageHistory, not mocked */}
        <div className="mt-5">
          <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-ink-400">
            <Clock size={12} /> Activity Timeline
          </p>
          <div className="relative space-y-3 pl-5">
            <span className="absolute left-[5px] top-1 h-[calc(100%-1rem)] w-px bg-ink-200" />
            {history.map((h, i) => (
              <div key={i} className="relative">
                <span
                  className="absolute -left-5 top-1 h-2.5 w-2.5 rounded-full ring-2 ring-white"
                  style={{ background: STAGE_COLOR[h.stage] }}
                />
                <p className="text-sm font-medium text-ink-800">Moved to {h.stage}</p>
                <p className="text-xs text-ink-500">by {nameById(h.movedBy)} · {timeAgo(h.movedAt)}</p>
                <p className="text-[11px] text-ink-400">{formatDateTime(h.movedAt)}</p>
              </div>
            ))}
            {history.length === 0 && <p className="text-xs text-ink-400">No stage history recorded yet.</p>}
          </div>
        </div>
      </div>

      <div className="flex gap-2 border-t border-ink-100 p-3">
        <button
          onClick={onViewDetails}
          className="flex-1 rounded-lg border border-ink-200 py-2 text-xs font-semibold text-ink-700 hover:bg-ink-50"
        >
          View Details
        </button>
        <button
          onClick={onEdit}
          className="flex-1 rounded-lg bg-brand-600 py-2 text-xs font-semibold text-white hover:bg-brand-700"
        >
          Edit Deal
        </button>
      </div>
    </div>
  );
}
