import { useMemo } from 'react';
import { Network, Download, GitBranch } from 'lucide-react';
import { useDb } from '@/store/hooks';
import { PageHeader, Card, CardHeader, Button, Table, Th, Td, Tr, Badge, StatusBadge } from '@/components/ui';
import { KpiCard } from '@/components/ui/KpiCard';
import { BarChartCard, DonutChartCard } from '@/components/charts';
import { groupCount, groupSum } from '@/utils/calculations';
import { exportToCSV } from '@/utils/csvExport';
import { formatCurrency, formatDateTime, formatCompact } from '@/utils/formatters';

export function Attribution() {
  const { db, tenantId } = useDb();
  const leads = db.leads.filter((l) => l.tenant_id === tenantId);
  const events = db.trackingEvents.filter((e) => e.tenant_id === tenantId);
  const payments = db.payments.filter((p) => p.tenant_id === tenantId && p.status === 'Paid');
  const bookings = db.bookings.filter((b) => b.tenant_id === tenantId);

  const leadsBySource = useMemo(() => groupCount(leads, (l) => l.source), [leads]);
  const revBySource = useMemo(() => groupSum(payments, (p) => p.source, (p) => p.amount), [payments]);
  const bookingsBySource = useMemo(() => groupCount(bookings, (b) => b.source), [bookings]);
  const eventsByType = useMemo(() => groupCount(events, (e) => e.event_type), [events]);

  // Source-to-revenue table
  const sources = Array.from(new Set(leads.map((l) => l.source)));
  const rows = sources.map((src) => {
    const srcLeads = leads.filter((l) => l.source === src);
    const qualified = srcLeads.filter((l) => ['Qualified', 'Booked', 'Call Completed', 'Proposal Sent', 'Won'].includes(l.status)).length;
    const booked = bookings.filter((b) => b.source === src).length;
    const revenue = payments.filter((p) => p.source === src).reduce((s, p) => s + p.amount, 0);
    return {
      source: src, leads: srcLeads.length, qualified, booked, revenue,
      leadToBooking: srcLeads.length ? (booked / srcLeads.length) * 100 : 0,
    };
  }).sort((a, b) => b.revenue - a.revenue);

  const totalRevenue = payments.reduce((s, p) => s + p.amount, 0);

  return (
    <div>
      <PageHeader title="Attribution & Tracking" description="Source-to-revenue attribution across every lifecycle event." breadcrumb={['Growth', 'Attribution']}
        actions={<Button variant="secondary" onClick={() => exportToCSV('attribution', rows)}><Download size={16} /> Export CSV</Button>} />

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard label="Tracking events" value={events.length} icon={<Network size={18} />} accent="#6366f1" />
        <KpiCard label="Attributed revenue" value={formatCompact(totalRevenue)} icon={<GitBranch size={18} />} accent="#10b981" />
        <KpiCard label="Sources" value={sources.length} icon={<Network size={18} />} accent="#8b5cf6" />
        <KpiCard label="Top source" value={rows[0]?.source ?? '—'} icon={<Network size={18} />} accent="#f59e0b" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <DonutChartCard title="Leads by Source" subtitle="First-touch attribution" data={leadsBySource} />
        <BarChartCard title="Revenue by Source" subtitle="Closed-won attribution" data={revBySource} color="#10b981" />
        <DonutChartCard title="Bookings by Source" data={bookingsBySource} />
      </div>

      <div className="mt-4">
        <BarChartCard title="Tracking Events by Type" subtitle="Full-funnel lifecycle events" data={eventsByType} color="#8b5cf6" />
      </div>

      <Card className="mt-4">
        <CardHeader title="Source-to-Revenue Breakdown" subtitle="Conversion across the funnel by source" />
        <Table>
          <thead><tr><Th>Source</Th><Th>Leads</Th><Th>Qualified</Th><Th>Booked</Th><Th>Lead→Booking</Th><Th>Revenue</Th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <Tr key={r.source}>
                <Td><Badge tone="blue">{r.source}</Badge></Td>
                <Td>{r.leads}</Td><Td>{r.qualified}</Td><Td>{r.booked}</Td>
                <Td>{r.leadToBooking.toFixed(0)}%</Td>
                <Td className="font-semibold text-emerald-700">{formatCurrency(r.revenue)}</Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      </Card>

      <Card className="mt-4">
        <CardHeader title="Recent Tracking Events" subtitle="Native vs provider attribution" />
        <Table>
          <thead><tr><Th>Event</Th><Th>Lead</Th><Th>Source</Th><Th>Campaign</Th><Th>Provider</Th><Th>Time</Th></tr></thead>
          <tbody>
            {events.slice(0, 20).map((e) => {
              const lead = db.leads.find((l) => l.id === e.lead_id);
              return (
                <Tr key={e.id}>
                  <Td><StatusBadge status={e.event_type} /></Td>
                  <Td>{lead?.name ?? '—'}</Td><Td>{e.source}</Td><Td>{e.campaign || '—'}</Td>
                  <Td className="text-xs">{e.provider_name}</Td>
                  <Td className="text-ink-500">{formatDateTime(e.created_at)}</Td>
                </Tr>
              );
            })}
          </tbody>
        </Table>
      </Card>
    </div>
  );
}
