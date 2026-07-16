import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, UserCheck, Flame, CalendarCheck, DollarSign, TrendingUp, Percent, Timer,
  CheckSquare, MessageCircle, MailWarning, AlertTriangle, Sparkles, ArrowRight,
} from 'lucide-react';
import { useDb } from '@/store/hooks';
import { KpiCard } from '@/components/ui/KpiCard';
import { Card, CardHeader, Badge, PageHeader, Button } from '@/components/ui';
import { BarChartCard, LineChartCard, DonutChartCard, FunnelChartCard } from '@/components/charts';
import {
  computeDashboard, leadsBySource, pipelineByStage, revenueBySource, bookingTrend,
  conversationsTrend, conversionFunnel,
} from '@/utils/calculations';
import { generateWeeklyBriefing } from '@/services/aiService';
import { formatCurrency, formatCompact, timeAgo } from '@/utils/formatters';
import { useStore } from '@/store/store';

export function Dashboard() {
  const navigate = useNavigate();
  const { db, tenantId } = useDb();
  const user = useStore((s) => s.currentUser());

  const m = useMemo(() => computeDashboard(db, tenantId), [db, tenantId]);
  const sources = useMemo(() => leadsBySource(db, tenantId), [db, tenantId]);
  const stages = useMemo(() => pipelineByStage(db, tenantId), [db, tenantId]);
  const revSource = useMemo(() => revenueBySource(db, tenantId), [db, tenantId]);
  const bookings = useMemo(() => bookingTrend(db, tenantId), [db, tenantId]);
  const convoTrend = useMemo(() => conversationsTrend(db, tenantId), [db, tenantId]);
  const funnel = useMemo(() => conversionFunnel(db, tenantId), [db, tenantId]);

  const events = db.trackingEvents.filter((e) => e.tenant_id === tenantId).slice(0, 8);
  const topCampaigns = [...db.marketingCampaigns.filter((c) => c.tenant_id === tenantId)].sort((a, b) => b.revenue - a.revenue).slice(0, 4);
  const briefing = generateWeeklyBriefing({ leads: m.totalLeads, pipeline: m.pipelineValue, revenue: m.revenueClosed, hot: m.hotLeads });

  const campaignPerf = db.campaigns.filter((c) => c.tenant_id === tenantId).slice(0, 5).map((c) => ({ name: c.name.slice(0, 14), value: c.metrics.replied }));

  const leakageItems = [
    { label: 'Ghosted leads', count: db.leads.filter((l) => l.tenant_id === tenantId && l.status === 'Ghosted').length, tone: 'red' as const },
    { label: 'Proposals idle 5+ days', count: db.leads.filter((l) => l.tenant_id === tenantId && l.status === 'Proposal Sent').length, tone: 'amber' as const },
    { label: 'Booked but not paid', count: db.payments.filter((p) => p.tenant_id === tenantId && (p.status === 'Pending' || p.status === 'Sent')).length, tone: 'amber' as const },
  ];

  return (
    <div>
      <PageHeader
        title={`Good ${greeting()}, ${user?.name.split(' ')[0]} 👋`}
        description="Here's your revenue command center for today."
        actions={
          <>
            <Button variant="secondary" onClick={() => navigate('/reports')}>View reports</Button>
            <Button onClick={() => navigate('/leads')}><Users size={16} /> Manage leads</Button>
          </>
        }
      />

      {/* KPI grid */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard label="Total Leads" value={m.totalLeads} delta={12} icon={<Users size={18} />} accent="#6366f1" />
        <KpiCard label="Qualified Leads" value={m.qualifiedLeads} delta={8} icon={<UserCheck size={18} />} accent="#3b82f6" />
        <KpiCard label="Hot Leads" value={m.hotLeads} delta={21} icon={<Flame size={18} />} accent="#ef4444" />
        <KpiCard label="Booked Calls" value={m.bookedCalls} delta={5} icon={<CalendarCheck size={18} />} accent="#8b5cf6" />
        <KpiCard label="Pipeline Value" value={formatCompact(m.pipelineValue)} delta={14} icon={<TrendingUp size={18} />} accent="#06b6d4" />
        <KpiCard label="Revenue Closed" value={formatCurrency(m.revenueClosed)} delta={18} icon={<DollarSign size={18} />} accent="#10b981" />
        <KpiCard label="Conversion Rate" value={`${m.conversionRate.toFixed(1)}%`} delta={3} icon={<Percent size={18} />} accent="#f59e0b" />
        <KpiCard label="Avg Response Time" value={`${m.avgResponseTimeMins}m`} delta={-9} icon={<Timer size={18} />} accent="#14b8a6" />
        <KpiCard label="Follow-up Completion" value={`${m.followUpCompletion.toFixed(0)}%`} icon={<CheckSquare size={18} />} accent="#8b5cf6" />
        <KpiCard label="WA Conversations" value={m.whatsappConversations} icon={<MessageCircle size={18} />} accent="#22c55e" />
        <KpiCard label="WA Pending Replies" value={m.whatsappPending} hint="Awaiting response" icon={<MailWarning size={18} />} accent="#f97316" />
        <KpiCard label="Leakage Alerts" value={m.leakageAlerts} hint="Revenue at risk" icon={<AlertTriangle size={18} />} accent="#ef4444" />
      </div>

      {/* AI briefing */}
      <Card className="mt-5 overflow-hidden">
        <div className="flex flex-col gap-4 bg-gradient-to-r from-brand-600 to-violet-600 p-5 text-white sm:flex-row sm:items-center">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/15">
            <Sparkles size={22} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold">Weekly AI Briefing</p>
            <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-brand-50">{briefing}</p>
          </div>
        </div>
      </Card>

      {/* Charts row 1 */}
      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <DonutChartCard title="Leads by Source" subtitle="Where your pipeline comes from" data={sources} />
        <BarChartCard title="Pipeline by Stage" subtitle="Active deal distribution" data={stages} />
      </div>

      {/* Charts row 2 */}
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <FunnelChartCard title="Conversion Funnel" subtitle="Lead → Won" data={funnel} />
        <BarChartCard title="Revenue by Source" subtitle="Closed revenue attribution" data={revSource} color="#10b981" />
        <LineChartCard title="Booking Trend" subtitle="Last 8 days" data={bookings} color="#8b5cf6" area />
      </div>

      {/* Charts row 3 */}
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <LineChartCard title="WhatsApp Conversations" subtitle="Last 14 days" data={convoTrend} color="#22c55e" area />
        <BarChartCard title="Campaign Performance" subtitle="Replies by WhatsApp campaign" data={campaignPerf} color="#6366f1" />
      </div>

      {/* Bottom sections */}
      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        {/* Recent activity */}
        <Card className="lg:col-span-1">
          <CardHeader title="Recent Activity" subtitle="Live tracking events" />
          <div className="divide-y divide-ink-50">
            {events.map((e) => {
              const lead = db.leads.find((l) => l.id === e.lead_id);
              return (
                <div key={e.id} className="flex items-start gap-3 px-5 py-3">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-500" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink-800">{e.event_type}</p>
                    <p className="truncate text-xs text-ink-500">{lead?.name ?? 'System'} · {e.source}</p>
                  </div>
                  <span className="shrink-0 text-xs text-ink-400">{timeAgo(e.created_at)}</span>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Top campaigns */}
        <Card>
          <CardHeader title="Top Campaigns" subtitle="By closed revenue" action={<Button variant="ghost" className="px-2 py-1 text-xs" onClick={() => navigate('/campaigns')}>View all <ArrowRight size={13} /></Button>} />
          <div className="divide-y divide-ink-50">
            {topCampaigns.map((c) => (
              <div key={c.id} className="flex items-center justify-between px-5 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ink-800">{c.campaign_name}</p>
                  <p className="text-xs text-ink-500">{c.leads_generated} leads · {c.bookings} booked</p>
                </div>
                <Badge tone="green">{formatCompact(c.revenue)}</Badge>
              </div>
            ))}
          </div>
        </Card>

        {/* Revenue leakage */}
        <Card>
          <CardHeader title="Revenue Leakage Alerts" subtitle="Money at risk right now" action={<Badge tone="red">{m.leakageAlerts}</Badge>} />
          <div className="space-y-2 p-4">
            {leakageItems.map((item) => (
              <div key={item.label} className="flex items-center justify-between rounded-lg border border-ink-100 px-3 py-2.5">
                <div className="flex items-center gap-2.5">
                  <AlertTriangle size={16} className={item.tone === 'red' ? 'text-red-500' : 'text-amber-500'} />
                  <span className="text-sm text-ink-700">{item.label}</span>
                </div>
                <Badge tone={item.tone}>{item.count}</Badge>
              </div>
            ))}
            <Button variant="secondary" className="mt-1 w-full" onClick={() => navigate('/nurture')}>
              Launch recovery sequences
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 18) return 'afternoon';
  return 'evening';
}
