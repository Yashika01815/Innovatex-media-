import { useState } from 'react';
import { Plus, Megaphone, Copy, Link2, Download } from 'lucide-react';
import { useStore } from '@/store/store';
import { useDb } from '@/store/hooks';
import { PageHeader, Card, CardHeader, Button, Badge, StatusBadge, Table, Th, Td, Tr, Modal, Field, Input, Select } from '@/components/ui';
import { KpiCard } from '@/components/ui/KpiCard';
import { BarChartCard } from '@/components/charts';
import { formatCurrency, formatCompact, formatDate } from '@/utils/formatters';
import { exportToCSV } from '@/utils/csvExport';
import { toast } from '@/store/toastStore';

const SOURCES = ['Meta Ads', 'Google Ads', 'LinkedIn', 'Webinar', 'YouTube', 'Referral'];
const TYPES = ['Paid Ads', 'Webinar', 'Email', 'Retargeting', 'ABM'];

export function Campaigns() {
  const { db, tenantId } = useDb();
  const { createMarketingCampaign } = useStore();
  const campaigns = db.marketingCampaigns.filter((c) => c.tenant_id === tenantId);

  const [show, setShow] = useState(false);
  const [form, setForm] = useState({ campaign_name: '', source: 'Meta Ads', medium: 'paid', campaign_type: 'Paid Ads', budget: 5000 });

  const create = () => {
    if (!form.campaign_name.trim()) return toast.error('Name required');
    createMarketingCampaign({ ...form, campaign_name: form.campaign_name.replace(/\s/g, '_').toLowerCase(), budget: Number(form.budget), start_date: new Date().toISOString(), end_date: new Date(Date.now() + 30 * 86400000).toISOString(), status: 'Active' });
    setShow(false); setForm({ campaign_name: '', source: 'Meta Ads', medium: 'paid', campaign_type: 'Paid Ads', budget: 5000 });
  };

  const trackingLink = (c: { campaign_name: string; source: string; medium: string }) =>
    `${window.location.origin}/capture?source=${encodeURIComponent(c.source.toLowerCase())}&utm_source=${c.source.toLowerCase().replace(/ /g, '_')}&utm_medium=${c.medium}&utm_campaign=${c.campaign_name}`;

  const copyLink = (c: { campaign_name: string; source: string; medium: string }) => {
    navigator.clipboard?.writeText(trackingLink(c));
    toast.success('Tracking link copied', 'UTM-tagged capture URL ready to share');
  };

  const perf = campaigns.map((c) => ({ name: c.campaign_name.slice(0, 12), value: c.revenue }));
  const totalSpend = campaigns.reduce((s, c) => s + c.spend, 0);
  const totalRevenue = campaigns.reduce((s, c) => s + c.revenue, 0);

  return (
    <div>
      <PageHeader title="Campaigns" description="Manage marketing campaigns, generate UTM tracking links & measure ROI." breadcrumb={['Growth', 'Campaigns']}
        actions={<><Button variant="secondary" onClick={() => exportToCSV('campaigns', campaigns.map((c) => ({ Name: c.campaign_name, Source: c.source, Type: c.campaign_type, Budget: c.budget, Spend: c.spend, Leads: c.leads_generated, Bookings: c.bookings, Revenue: c.revenue })))}><Download size={16} /> Export</Button><Button onClick={() => setShow(true)}><Plus size={16} /> New Campaign</Button></>} />

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard label="Campaigns" value={campaigns.length} icon={<Megaphone size={18} />} accent="#6366f1" />
        <KpiCard label="Total spend" value={formatCompact(totalSpend)} icon={<Megaphone size={18} />} accent="#f59e0b" />
        <KpiCard label="Total revenue" value={formatCompact(totalRevenue)} icon={<Megaphone size={18} />} accent="#10b981" />
        <KpiCard label="Blended ROAS" value={`${totalSpend ? (totalRevenue / totalSpend).toFixed(1) : 0}x`} icon={<Megaphone size={18} />} accent="#8b5cf6" />
      </div>

      <div className="mb-4"><BarChartCard title="Revenue by Campaign" data={perf} color="#10b981" /></div>

      <Card>
        <CardHeader title="All Campaigns" subtitle="Click the link icon to copy a UTM tracking URL" />
        <Table>
          <thead><tr><Th>Campaign</Th><Th>Source</Th><Th>Type</Th><Th>Status</Th><Th>Budget</Th><Th>Leads</Th><Th>Bookings</Th><Th>Revenue</Th><Th>Link</Th></tr></thead>
          <tbody>
            {campaigns.map((c) => (
              <Tr key={c.id}>
                <Td className="font-medium">{c.campaign_name}</Td>
                <Td><Badge tone="blue">{c.source}</Badge></Td>
                <Td>{c.campaign_type}</Td>
                <Td><StatusBadge status={c.status} /></Td>
                <Td>{formatCurrency(c.budget)}</Td>
                <Td>{c.leads_generated}</Td><Td>{c.bookings}</Td>
                <Td className="font-semibold text-emerald-700">{formatCurrency(c.revenue)}</Td>
                <Td><button onClick={() => copyLink(c)} className="rounded p-1.5 text-ink-400 hover:bg-brand-50 hover:text-brand-600" title="Copy tracking link"><Link2 size={15} /></button></Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      </Card>

      {show && (
        <Modal open onClose={() => setShow(false)} title="New Campaign"
          footer={<><Button variant="secondary" onClick={() => setShow(false)}>Cancel</Button><Button onClick={create}>Create campaign</Button></>}>
          <div className="space-y-4">
            <Field label="Campaign name"><Input value={form.campaign_name} onChange={(e) => setForm({ ...form, campaign_name: e.target.value })} placeholder="e.g. summer_webinar" /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Source"><Select value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })}>{SOURCES.map((s) => <option key={s}>{s}</option>)}</Select></Field>
              <Field label="Type"><Select value={form.campaign_type} onChange={(e) => setForm({ ...form, campaign_type: e.target.value })}>{TYPES.map((t) => <option key={t}>{t}</option>)}</Select></Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Medium"><Select value={form.medium} onChange={(e) => setForm({ ...form, medium: e.target.value })}>{['paid', 'organic', 'social', 'email', 'referral'].map((m) => <option key={m}>{m}</option>)}</Select></Field>
              <Field label="Budget (USD)"><Input type="number" value={form.budget} onChange={(e) => setForm({ ...form, budget: Number(e.target.value) })} /></Field>
            </div>
            {form.campaign_name && (
              <div className="rounded-lg bg-ink-50 p-3">
                <p className="label flex items-center gap-1"><Copy size={12} /> Generated tracking link</p>
                <p className="break-all font-mono text-xs text-brand-600">{trackingLink({ campaign_name: form.campaign_name.replace(/\s/g, '_').toLowerCase(), source: form.source, medium: form.medium })}</p>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
