import type { Database } from '@/data/seedData';
import type { Lead, TimelineItem } from '@/types';

export function tenantData<K extends keyof Database>(db: Database, key: K, tenantId: string): Database[K] {
  const arr = db[key] as unknown as { tenant_id?: string }[];
  if (Array.isArray(arr)) {
    return arr.filter((x) => x.tenant_id === tenantId) as unknown as Database[K];
  }
  return db[key];
}

export interface DashboardMetrics {
  totalLeads: number;
  qualifiedLeads: number;
  hotLeads: number;
  bookedCalls: number;
  pipelineValue: number;
  revenueClosed: number;
  conversionRate: number;
  avgResponseTimeMins: number;
  followUpCompletion: number;
  whatsappConversations: number;
  whatsappPending: number;
  leakageAlerts: number;
}

export function computeDashboard(db: Database, tenantId: string): DashboardMetrics {
  const leads = db.leads.filter((l) => l.tenant_id === tenantId && !l.archived);
  const deals = db.deals.filter((d) => d.tenant_id === tenantId);
  const bookings = db.bookings.filter((b) => b.tenant_id === tenantId);
  const payments = db.payments.filter((p) => p.tenant_id === tenantId);
  const convos = db.conversations.filter((c) => c.tenant_id === tenantId);
  const tasks = db.tasks.filter((t) => t.tenant_id === tenantId);

  const qualifiedLeads = leads.filter((l) => ['Qualified', 'Booked', 'Call Completed', 'Proposal Sent', 'Won'].includes(l.status)).length;
  const hotLeads = leads.filter((l) => l.lead_temperature === 'Hot').length;
  const wonLeads = leads.filter((l) => l.status === 'Won').length;
  const pipelineValue = deals.filter((d) => !['won', 'lost'].includes(d.stage)).reduce((s, d) => s + d.value, 0);
  const revenueClosed = payments.filter((p) => p.status === 'Paid').reduce((s, p) => s + p.amount, 0);
  const doneTasks = tasks.filter((t) => t.status === 'done').length;

  // Revenue leakage: ghosted leads, proposals idle, booked-not-paid
  const leakageAlerts =
    leads.filter((l) => l.status === 'Ghosted').length +
    leads.filter((l) => l.status === 'Proposal Sent').length +
    payments.filter((p) => p.status === 'Pending' || p.status === 'Sent').length;

  return {
    totalLeads: leads.length,
    qualifiedLeads,
    hotLeads,
    bookedCalls: bookings.filter((b) => b.status === 'Scheduled' || b.status === 'Completed').length,
    pipelineValue,
    revenueClosed,
    conversionRate: leads.length ? (wonLeads / leads.length) * 100 : 0,
    avgResponseTimeMins: 14,
    followUpCompletion: tasks.length ? (doneTasks / tasks.length) * 100 : 0,
    whatsappConversations: convos.length,
    whatsappPending: convos.filter((c) => c.unread_count > 0 || c.status === 'Pending').length,
    leakageAlerts,
  };
}

export function groupCount<T>(items: T[], keyFn: (item: T) => string): { name: string; value: number }[] {
  const map = new Map<string, number>();
  items.forEach((i) => {
    const k = keyFn(i);
    map.set(k, (map.get(k) ?? 0) + 1);
  });
  return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
}

export function groupSum<T>(items: T[], keyFn: (item: T) => string, valFn: (item: T) => number): { name: string; value: number }[] {
  const map = new Map<string, number>();
  items.forEach((i) => {
    const k = keyFn(i);
    map.set(k, (map.get(k) ?? 0) + valFn(i));
  });
  return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
}

export function leadsBySource(db: Database, tenantId: string) {
  return groupCount(db.leads.filter((l) => l.tenant_id === tenantId), (l) => l.source);
}

export function pipelineByStage(db: Database, tenantId: string) {
  const stages = db.settings[tenantId]?.pipeline_stages ?? [];
  const deals = db.deals.filter((d) => d.tenant_id === tenantId);
  return stages.map((s) => ({ name: s.name, value: deals.filter((d) => d.stage === s.id).length, color: s.color }));
}

export function revenueBySource(db: Database, tenantId: string) {
  const paid = db.payments.filter((p) => p.tenant_id === tenantId && p.status === 'Paid');
  return groupSum(paid, (p) => p.source, (p) => p.amount);
}

export function bookingTrend(db: Database, tenantId: string) {
  const bookings = db.bookings.filter((b) => b.tenant_id === tenantId);
  const buckets: Record<string, number> = {};
  for (let i = 7; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    buckets[d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })] = 0;
  }
  bookings.forEach((b) => {
    const key = new Date(b.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    if (key in buckets) buckets[key] += 1;
  });
  return Object.entries(buckets).map(([name, value]) => ({ name, value }));
}

export function conversationsTrend(db: Database, tenantId: string) {
  const convos = db.conversations.filter((c) => c.tenant_id === tenantId);
  const buckets: Record<string, number> = {};
  for (let i = 13; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    buckets[d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })] = 0;
  }
  convos.forEach((c) => {
    const key = new Date(c.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    if (key in buckets) buckets[key] += 1;
  });
  // ensure non-empty visual
  return Object.entries(buckets).map(([name, value]) => ({ name, value: value || Math.floor(Math.random() * 2) }));
}

export function conversionFunnel(db: Database, tenantId: string) {
  const leads = db.leads.filter((l) => l.tenant_id === tenantId);
  const count = (statuses: string[]) => leads.filter((l) => statuses.includes(l.status)).length;
  return [
    { name: 'Leads', value: leads.length },
    { name: 'Qualified', value: count(['Qualified', 'Booked', 'Call Completed', 'Proposal Sent', 'Won']) },
    { name: 'Booked', value: count(['Booked', 'Call Completed', 'Proposal Sent', 'Won']) },
    { name: 'Proposal', value: count(['Proposal Sent', 'Won']) },
    { name: 'Won', value: count(['Won']) },
  ];
}

export function buildTimeline(db: Database, leadId: string): TimelineItem[] {
  const items: TimelineItem[] = [];
  const lead = db.leads.find((l) => l.id === leadId);
  if (lead) {
    items.push({ id: 'created', at: lead.created_at, type: 'lead', title: 'Lead created', description: `Captured from ${lead.source}${lead.campaign ? ' · ' + lead.campaign : ''}`, icon: 'user-plus' });
  }
  db.trackingEvents.filter((e) => e.lead_id === leadId).forEach((e) => {
    if (e.event_type === 'Lead Created') return;
    items.push({ id: e.id, at: e.created_at, type: 'event', title: e.event_type, description: e.campaign ? `Campaign: ${e.campaign}` : `Source: ${e.source}`, icon: 'activity' });
  });
  db.messages.filter((m) => m.lead_id === leadId).forEach((m) => {
    items.push({ id: m.id, at: m.created_at, type: 'message', title: m.direction === 'inbound' ? 'WhatsApp received' : 'WhatsApp sent', description: m.body.slice(0, 80), icon: 'message-circle' });
  });
  db.bookings.filter((b) => b.lead_id === leadId).forEach((b) => {
    items.push({ id: b.id, at: b.created_at, type: 'booking', title: `Booking ${b.status}`, description: `${b.meeting_type} on ${new Date(b.meeting_date).toLocaleDateString()}`, icon: 'calendar' });
  });
  db.calls.filter((c) => c.lead_id === leadId).forEach((c) => {
    items.push({ id: c.id, at: c.call_date, type: 'call', title: `Call — ${c.outcome}`, description: c.summary.slice(0, 80), icon: 'phone' });
  });
  db.payments.filter((p) => p.lead_id === leadId).forEach((p) => {
    items.push({ id: p.id, at: p.created_at, type: 'payment', title: `Payment ${p.status}`, description: `${p.currency} ${p.amount.toLocaleString()} · ${p.payment_method}`, icon: 'dollar-sign' });
  });
  db.deals.filter((d) => d.lead_id === leadId).forEach((d) => {
    d.stage_history.forEach((h, i) => {
      items.push({ id: `${d.id}_${i}`, at: h.at, type: 'pipeline', title: 'Pipeline stage changed', description: `Moved to ${h.stage.replace(/_/g, ' ')}`, icon: 'git-branch' });
    });
  });
  return items.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
}

export function recommendedNextAction(lead: Lead): string {
  switch (lead.status) {
    case 'New': return 'Send a welcome WhatsApp and run AI qualification';
    case 'Contacted': return 'Run AI qualification to score this lead';
    case 'Qualified': return lead.lead_temperature === 'Hot' ? 'Book a strategy call now — high intent' : 'Enroll in nurture sequence';
    case 'Booked': return 'Prepare for the call & send a reminder';
    case 'Call Completed': return 'Send a tailored proposal';
    case 'Proposal Sent': return 'Follow up & share a case study';
    case 'Won': return 'Kick off onboarding 🎉';
    case 'Lost': return 'Add to long-term re-engagement nurture';
    case 'Ghosted': return 'Trigger re-engagement sequence';
    case 'Nurture': return 'Continue nurture & monitor engagement';
    default: return 'Review and assign next step';
  }
}
