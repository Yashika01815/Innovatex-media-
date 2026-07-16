import { useState, useMemo } from 'react';
import { Download } from 'lucide-react';
import { useDb } from '@/store/hooks';
import { PageHeader, Card, CardHeader, Button, Tabs, Table, Th, Td, Tr, Badge, Select, StatusBadge } from '@/components/ui';
import { KpiCard } from '@/components/ui/KpiCard';
import { BarChartCard, DonutChartCard, LineChartCard, FunnelChartCard } from '@/components/charts';
import {
  groupCount, groupSum, leadsBySource, pipelineByStage, conversionFunnel,
  revenueBySource, conversationsTrend, bookingTrend,
} from '@/utils/calculations';
import { exportToCSV } from '@/utils/csvExport';
import { formatCurrency, formatCompact } from '@/utils/formatters';

const TABS = [
  { id: 'lead', label: 'Lead' }, { id: 'pipeline', label: 'Pipeline' }, { id: 'attribution', label: 'Attribution' },
  { id: 'whatsapp', label: 'WhatsApp' }, { id: 'campaign', label: 'Campaign' }, { id: 'revenue', label: 'Revenue' },
  { id: 'activity', label: 'Sales Activity' }, { id: 'nurture', label: 'Nurture' }, { id: 'ai', label: 'AI Qualification' },
];

export function Reports() {
  const { db, tenantId } = useDb();
  const [tab, setTab] = useState('lead');
  const [range, setRange] = useState('30');
  const [source, setSource] = useState('all');

  const leads = db.leads.filter((l) => l.tenant_id === tenantId);
  const sources = Array.from(new Set(leads.map((l) => l.source)));

  return (
    <div>
      <PageHeader title="Reports" description="Operator-grade reporting across every revenue surface." breadcrumb={['Growth', 'Reports']}
        actions={
          <>
            <Select value={range} onChange={(e) => setRange(e.target.value)} className="w-auto"><option value="7">Last 7 days</option><option value="30">Last 30 days</option><option value="90">Last 90 days</option></Select>
            <Select value={source} onChange={(e) => setSource(e.target.value)} className="w-auto"><option value="all">All sources</option>{sources.map((s) => <option key={s}>{s}</option>)}</Select>
          </>
        } />

      <div className="mb-4"><Tabs tabs={TABS} active={tab} onChange={setTab} /></div>

      {tab === 'lead' && <LeadReport db={db} tenantId={tenantId} />}
      {tab === 'pipeline' && <PipelineReport db={db} tenantId={tenantId} />}
      {tab === 'attribution' && <AttributionReport db={db} tenantId={tenantId} />}
      {tab === 'whatsapp' && <WhatsAppReport db={db} tenantId={tenantId} />}
      {tab === 'campaign' && <CampaignReport db={db} tenantId={tenantId} />}
      {tab === 'revenue' && <RevenueReport db={db} tenantId={tenantId} />}
      {tab === 'activity' && <ActivityReport db={db} tenantId={tenantId} />}
      {tab === 'nurture' && <NurtureReport db={db} tenantId={tenantId} />}
      {tab === 'ai' && <AIReport db={db} tenantId={tenantId} />}
    </div>
  );
}

type DB = ReturnType<typeof useDb>['db'];
function ExportBtn({ name, rows }: { name: string; rows: Record<string, unknown>[] }) {
  return <Button variant="secondary" onClick={() => exportToCSV(name, rows)}><Download size={16} /> Export CSV</Button>;
}

function LeadReport({ db, tenantId }: { db: DB; tenantId: string }) {
  const leads = db.leads.filter((l) => l.tenant_id === tenantId);
  const byStatus = useMemo(() => groupCount(leads, (l) => l.status), [leads]);
  const byTemp = useMemo(() => groupCount(leads, (l) => l.lead_temperature), [leads]);
  return (
    <div className="space-y-4">
      <div className="flex justify-end"><ExportBtn name="lead_report" rows={leads.map((l) => ({ Name: l.name, Status: l.status, Temp: l.lead_temperature, Score: l.qualification_score, Source: l.source, Value: l.value }))} /></div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard label="Total leads" value={leads.length} icon={<span />} accent="#6366f1" />
        <KpiCard label="Hot" value={leads.filter((l) => l.lead_temperature === 'Hot').length} icon={<span />} accent="#ef4444" />
        <KpiCard label="Qualified" value={leads.filter((l) => ['Qualified', 'Booked', 'Won'].includes(l.status)).length} icon={<span />} accent="#3b82f6" />
        <KpiCard label="Won" value={leads.filter((l) => l.status === 'Won').length} icon={<span />} accent="#10b981" />
      </div>
      <div className="grid gap-4 lg:grid-cols-2"><BarChartCard title="Leads by Status" data={byStatus} /><DonutChartCard title="Leads by Temperature" data={byTemp} /></div>
      <Card><CardHeader title="Lead Detail" /><Table><thead><tr><Th>Name</Th><Th>Status</Th><Th>Temp</Th><Th>Score</Th><Th>Source</Th></tr></thead><tbody>{leads.slice(0, 15).map((l) => <Tr key={l.id}><Td className="font-medium">{l.name}</Td><Td><StatusBadge status={l.status} /></Td><Td>{l.lead_temperature}</Td><Td>{l.qualification_score}</Td><Td>{l.source}</Td></Tr>)}</tbody></Table></Card>
    </div>
  );
}

function PipelineReport({ db, tenantId }: { db: DB; tenantId: string }) {
  const deals = db.deals.filter((d) => d.tenant_id === tenantId);
  const stages = pipelineByStage(db, tenantId);
  const funnel = conversionFunnel(db, tenantId);
  const value = deals.filter((d) => !['won', 'lost'].includes(d.stage)).reduce((s, d) => s + d.value, 0);
  return (
    <div className="space-y-4">
      <div className="flex justify-end"><ExportBtn name="pipeline_report" rows={deals.map((d) => ({ Title: d.title, Stage: d.stage, Value: d.value, Probability: d.probability }))} /></div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard label="Open pipeline" value={formatCompact(value)} icon={<span />} accent="#6366f1" />
        <KpiCard label="Deals" value={deals.length} icon={<span />} accent="#8b5cf6" />
        <KpiCard label="Won" value={deals.filter((d) => d.stage === 'won').length} icon={<span />} accent="#10b981" />
        <KpiCard label="Lost" value={deals.filter((d) => d.stage === 'lost').length} icon={<span />} accent="#ef4444" />
      </div>
      <div className="grid gap-4 lg:grid-cols-2"><BarChartCard title="Pipeline by Stage" data={stages} /><FunnelChartCard title="Conversion Funnel" data={funnel} /></div>
    </div>
  );
}

function AttributionReport({ db, tenantId }: { db: DB; tenantId: string }) {
  const leads = db.leads.filter((l) => l.tenant_id === tenantId);
  const payments = db.payments.filter((p) => p.tenant_id === tenantId && p.status === 'Paid');
  return (
    <div className="space-y-4">
      <div className="flex justify-end"><ExportBtn name="attribution_report" rows={leadsBySource(db, tenantId)} /></div>
      <div className="grid gap-4 lg:grid-cols-2"><DonutChartCard title="Leads by Source" data={leadsBySource(db, tenantId)} /><BarChartCard title="Revenue by Source" data={revenueBySource(db, tenantId)} color="#10b981" /></div>
      <Card><CardHeader title="First vs Last Touch" subtitle="Simplified single-touch model" /><Table><thead><tr><Th>Source</Th><Th>Leads</Th><Th>Revenue</Th></tr></thead><tbody>{leadsBySource(db, tenantId).map((s) => <Tr key={s.name}><Td>{s.name}</Td><Td>{s.value}</Td><Td>{formatCurrency(payments.filter((p) => p.source === s.name).reduce((a, p) => a + p.amount, 0))}</Td></Tr>)}</tbody></Table></Card>
    </div>
  );
}

function WhatsAppReport({ db, tenantId }: { db: DB; tenantId: string }) {
  const campaigns = db.campaigns.filter((c) => c.tenant_id === tenantId);
  const trend = conversationsTrend(db, tenantId);
  const revenue = campaigns.reduce((s, c) => s + c.metrics.revenue, 0);
  return (
    <div className="space-y-4">
      <div className="flex justify-end"><ExportBtn name="whatsapp_report" rows={campaigns.map((c) => ({ Name: c.name, Sent: c.metrics.sent, Delivered: c.metrics.delivered, Replied: c.metrics.replied, Revenue: c.metrics.revenue }))} /></div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard label="Conversations" value={db.conversations.filter((c) => c.tenant_id === tenantId).length} icon={<span />} accent="#22c55e" />
        <KpiCard label="Messages" value={db.messages.filter((m) => m.tenant_id === tenantId).length} icon={<span />} accent="#6366f1" />
        <KpiCard label="Campaigns" value={campaigns.length} icon={<span />} accent="#8b5cf6" />
        <KpiCard label="WA Revenue" value={formatCompact(revenue)} icon={<span />} accent="#10b981" />
      </div>
      <div className="grid gap-4 lg:grid-cols-2"><LineChartCard title="Conversations over time" data={trend} color="#22c55e" area /><BarChartCard title="Replies by Campaign" data={campaigns.slice(0, 6).map((c) => ({ name: c.name.slice(0, 12), value: c.metrics.replied }))} color="#8b5cf6" /></div>
    </div>
  );
}

function CampaignReport({ db, tenantId }: { db: DB; tenantId: string }) {
  const campaigns = db.marketingCampaigns.filter((c) => c.tenant_id === tenantId);
  return (
    <div className="space-y-4">
      <div className="flex justify-end"><ExportBtn name="campaign_report" rows={campaigns.map((c) => ({ Name: c.campaign_name, Source: c.source, Budget: c.budget, Spend: c.spend, Leads: c.leads_generated, Revenue: c.revenue }))} /></div>
      <BarChartCard title="Revenue by Campaign" data={campaigns.map((c) => ({ name: c.campaign_name.slice(0, 12), value: c.revenue }))} color="#10b981" />
      <Card><CardHeader title="Campaign Performance" /><Table><thead><tr><Th>Campaign</Th><Th>Spend</Th><Th>Leads</Th><Th>Bookings</Th><Th>Revenue</Th><Th>ROAS</Th></tr></thead><tbody>{campaigns.map((c) => <Tr key={c.id}><Td className="font-medium">{c.campaign_name}</Td><Td>{formatCurrency(c.spend)}</Td><Td>{c.leads_generated}</Td><Td>{c.bookings}</Td><Td>{formatCurrency(c.revenue)}</Td><Td><Badge tone="green">{c.spend ? (c.revenue / c.spend).toFixed(1) : 0}x</Badge></Td></Tr>)}</tbody></Table></Card>
    </div>
  );
}

function RevenueReport({ db, tenantId }: { db: DB; tenantId: string }) {
  const payments = db.payments.filter((p) => p.tenant_id === tenantId);
  const paid = payments.filter((p) => p.status === 'Paid');
  const revenue = paid.reduce((s, p) => s + p.amount, 0);
  const byMethod = groupSum(paid, (p) => p.payment_method, (p) => p.amount);
  return (
    <div className="space-y-4">
      <div className="flex justify-end"><ExportBtn name="revenue_report" rows={paid.map((p) => ({ Lead: db.leads.find((l) => l.id === p.lead_id)?.name, Amount: p.amount, Method: p.payment_method, Source: p.source, Date: p.payment_date }))} /></div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard label="Revenue" value={formatCompact(revenue)} icon={<span />} accent="#10b981" />
        <KpiCard label="Avg deal" value={formatCompact(paid.length ? revenue / paid.length : 0)} icon={<span />} accent="#6366f1" />
        <KpiCard label="Outstanding" value={formatCompact(payments.filter((p) => ['Pending', 'Sent'].includes(p.status)).reduce((s, p) => s + p.amount, 0))} icon={<span />} accent="#f59e0b" />
        <KpiCard label="Refunded" value={payments.filter((p) => p.status === 'Refunded').length} icon={<span />} accent="#ef4444" />
      </div>
      <div className="grid gap-4 lg:grid-cols-2"><BarChartCard title="Revenue by Source" data={revenueBySource(db, tenantId)} color="#10b981" /><DonutChartCard title="Revenue by Method" data={byMethod} /></div>
    </div>
  );
}

function ActivityReport({ db, tenantId }: { db: DB; tenantId: string }) {
  const users = db.users.filter((u) => u.tenant_id === tenantId);
  const rows = users.map((u) => ({
    name: u.name, role: u.role,
    leads: db.leads.filter((l) => l.assigned_user_id === u.id).length,
    deals: db.deals.filter((d) => d.assigned_user_id === u.id).length,
    calls: db.calls.filter((c) => c.assigned_user_id === u.id).length,
    bookings: db.bookings.filter((b) => b.assigned_user_id === u.id).length,
  }));
  return (
    <div className="space-y-4">
      <div className="flex justify-end"><ExportBtn name="activity_report" rows={rows} /></div>
      <BarChartCard title="Leads by Owner" data={rows.map((r) => ({ name: r.name.split(' ')[0], value: r.leads }))} color="#6366f1" />
      <Card><CardHeader title="Sales Activity by Rep" /><Table><thead><tr><Th>Rep</Th><Th>Role</Th><Th>Leads</Th><Th>Deals</Th><Th>Calls</Th><Th>Bookings</Th></tr></thead><tbody>{rows.map((r) => <Tr key={r.name}><Td className="font-medium">{r.name}</Td><Td>{r.role}</Td><Td>{r.leads}</Td><Td>{r.deals}</Td><Td>{r.calls}</Td><Td>{r.bookings}</Td></Tr>)}</tbody></Table></Card>
    </div>
  );
}

function NurtureReport({ db, tenantId }: { db: DB; tenantId: string }) {
  const seqs = db.nurtureSequences.filter((s) => s.tenant_id === tenantId);
  return (
    <div className="space-y-4">
      <div className="flex justify-end"><ExportBtn name="nurture_report" rows={seqs.map((s) => ({ Name: s.name, Status: s.status, Enrolled: s.enrolled_count, Steps: s.steps.length }))} /></div>
      <BarChartCard title="Enrollments by Sequence" data={seqs.map((s) => ({ name: s.name.slice(0, 14), value: s.enrolled_count }))} color="#14b8a6" horizontal />
      <Card><CardHeader title="Sequence Performance" /><Table><thead><tr><Th>Sequence</Th><Th>Status</Th><Th>Enrolled</Th><Th>Steps</Th></tr></thead><tbody>{seqs.map((s) => <Tr key={s.id}><Td className="font-medium">{s.name}</Td><Td><Badge tone={s.status === 'active' ? 'green' : 'gray'}>{s.status}</Badge></Td><Td>{s.enrolled_count}</Td><Td>{s.steps.length}</Td></Tr>)}</tbody></Table></Card>
    </div>
  );
}

function AIReport({ db, tenantId }: { db: DB; tenantId: string }) {
  const leads = db.leads.filter((l) => l.tenant_id === tenantId);
  const scoreBuckets = [
    { name: '1-3 (Cold)', value: leads.filter((l) => l.qualification_score <= 3).length },
    { name: '4-7 (Warm)', value: leads.filter((l) => l.qualification_score > 3 && l.qualification_score <= 7).length },
    { name: '8-10 (Hot)', value: leads.filter((l) => l.qualification_score > 7).length },
  ];
  const aiEvents = db.trackingEvents.filter((e) => e.tenant_id === tenantId && e.event_type === 'AI Qualified');
  return (
    <div className="space-y-4">
      <div className="flex justify-end"><ExportBtn name="ai_qualification_report" rows={leads.map((l) => ({ Name: l.name, Score: l.qualification_score, Temp: l.lead_temperature, Status: l.status }))} /></div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard label="AI qualifications" value={aiEvents.length} icon={<span />} accent="#8b5cf6" />
        <KpiCard label="Avg score" value={(leads.reduce((s, l) => s + l.qualification_score, 0) / (leads.length || 1)).toFixed(1)} icon={<span />} accent="#6366f1" />
        <KpiCard label="Hot leads" value={leads.filter((l) => l.lead_temperature === 'Hot').length} icon={<span />} accent="#ef4444" />
        <KpiCard label="Conversion (hot)" value="34%" icon={<span />} accent="#10b981" />
      </div>
      <DonutChartCard title="Lead Score Distribution" data={scoreBuckets} />
    </div>
  );
}
