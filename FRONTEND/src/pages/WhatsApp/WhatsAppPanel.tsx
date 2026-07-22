import { useEffect, useState } from 'react';
import {
  Plus, Send, Sparkles, Copy, CheckCircle2, XCircle, MessageSquare, Server, RefreshCw,
  ChevronLeft, ChevronRight,
} from 'lucide-react';
import { useStore } from '@/store/store';
import { useDb, useSettings, userName } from '@/store/hooks';
import {
  PageHeader, Card, CardHeader, Tabs, Table, Th, Td, Tr, Badge, StatusBadge, Button,
  Avatar, EmptyState, Toggle, Field, Input, Select, Modal,
} from '@/components/ui';
import { KpiCard } from '@/components/ui/KpiCard';
import { BarChartCard, LineChartCard, DonutChartCard } from '@/components/charts';
import { Inbox } from './Inbox';
import { TemplateBuilder } from './TemplateBuilder';
import { conversationsTrend } from '@/utils/calculations';
import { generateWhatsAppReply, rewriteWhatsAppMessage } from '@/services/aiService';
import { syncFromProvider } from '@/services/whatsappService';
import { formatCurrency, formatDateTime, timeAgo, percent } from '@/utils/formatters';
import { toast } from '@/store/toastStore';
import { useLeads } from '@/hooks/useLeads';
import { useWhatsAppSettings } from '@/hooks/useWhatsAppSettings';
import { PROVIDER_LABELS, IMPLEMENTED_PROVIDERS } from '@/types/whatsappSettings';
import type { WhatsAppProvider as WhatsAppProviderReal, PanelMode, WhatsAppSettingsSync } from '@/types/whatsappSettings';
import { ApiError } from '@/lib/apiClient';
import type { WhatsAppTemplate, WhatsAppProvider } from '@/types';

const TABS = [
  { id: 'inbox', label: 'Inbox' },
  { id: 'contacts', label: 'Contacts / Leads' },
  { id: 'templates', label: 'Templates' },
  { id: 'approval', label: 'Template Approval' },
  { id: 'campaigns', label: 'Campaigns' },
  { id: 'nurture', label: 'Nurture Messages' },
  { id: 'ai', label: 'AI Reply Assistant' },
  { id: 'broadcasts', label: 'Broadcasts' },
  { id: 'rules', label: 'Automation Rules' },
  { id: 'consent', label: 'Opt-Out / Consent' },
  { id: 'logs', label: 'Delivery Logs' },
  { id: 'analytics', label: 'WhatsApp Analytics' },
  { id: 'settings', label: 'WhatsApp Settings' },
];

const PROVIDERS: WhatsAppProvider[] = ['Native Meta Cloud API', 'WATI', 'Interakt', 'AiSensy', 'Gallabox', 'Twilio WhatsApp', '360dialog', 'Custom Webhook Provider', 'Simulation Mode'];

export function WhatsAppPanel() {
  const [tab, setTab] = useState('inbox');
  const [showBuilder, setShowBuilder] = useState(false);
  const [editTpl, setEditTpl] = useState<WhatsAppTemplate | null>(null);

  return (
    <div>
      <PageHeader
        title="WhatsApp Operating Panel"
        description="Native InnovateX panel + multi-provider simulation — inbox, templates, campaigns & analytics."
        breadcrumb={['Revenue', 'WhatsApp Panel']}
        actions={<Button onClick={() => setShowBuilder(true)}><Plus size={16} /> New Template</Button>}
      />
      <div className="mb-4"><Tabs tabs={TABS} active={tab} onChange={setTab} /></div>

      {tab === 'inbox' && <Inbox />}
      {tab === 'contacts' && <ContactsTab />}
      {tab === 'templates' && <TemplatesTab onNew={() => setShowBuilder(true)} onEdit={setEditTpl} />}
      {tab === 'approval' && <ApprovalTab />}
      {tab === 'campaigns' && <CampaignsTab broadcast={false} />}
      {tab === 'nurture' && <NurtureMessagesTab />}
      {tab === 'ai' && <AIAssistantTab />}
      {tab === 'broadcasts' && <CampaignsTab broadcast />}
      {tab === 'rules' && <RulesTab />}
      {tab === 'consent' && <ConsentTab />}
      {tab === 'logs' && <LogsTab />}
      {tab === 'analytics' && <AnalyticsTab />}
      {tab === 'settings' && <SettingsTab />}

      {showBuilder && <TemplateBuilder onClose={() => setShowBuilder(false)} />}
      {editTpl && <TemplateBuilder template={editTpl} onClose={() => setEditTpl(null)} />}
    </div>
  );
}

// ---- Contacts --------------------------------------------------------------
/**
 * ContactsTab -- per DEVELOPER_HANDOFF.md's entity list, there is NO
 * separate WhatsAppContact entity in spec. Tab #2 is literally named
 * "Contacts / Leads" -- every field it needs (whatsapp_number,
 * consent_status, opt_out_status, last_contacted_at, qualification_score)
 * already lives on the real Lead entity. This reuses useLeads() (the same
 * hook the Leads page uses) rather than a separate WhatsApp-specific
 * collection, matching the mock's own db.leads-based implementation.
 *
 * NOTE: the backend still has a separate WhatsAppContact model used
 * internally by Campaigns/Broadcasts/Analytics for audience targeting --
 * that's a deliberate, deferred decision (see conversation), not something
 * this tab depends on.
 */
function ContactsTab() {
  const [page, setPage] = useState(1);
  const { leads, pagination, loading, error } = useLeads({ page, limit: 20 });

  return (
    <Card>
      <CardHeader title="WhatsApp Contacts" subtitle={pagination ? `${pagination.total} contacts synced` : 'Loading…'} />
      {error ? (
        <EmptyState title="Couldn't load contacts" description={error} />
      ) : loading && leads.length === 0 ? (
        <p className="p-8 text-center text-sm text-ink-400">Loading contacts…</p>
      ) : leads.length === 0 ? (
        <EmptyState title="No contacts yet" description="Leads with a WhatsApp number will appear here." />
      ) : (
        <>
          <Table>
            <thead><tr><Th>Contact</Th><Th>WhatsApp</Th><Th>Consent</Th><Th>Opt-out</Th><Th>Last contacted</Th><Th>Score</Th></tr></thead>
            <tbody>
              {leads.map((l) => (
                <Tr key={l.id}>
                  <Td><div className="flex items-center gap-2"><Avatar name={l.name} color="#22c55e" size={30} /><span className="font-medium">{l.name}</span></div></Td>
                  <Td className="font-mono text-xs">{l.whatsapp_number || l.phone}</Td>
                  <Td><Badge tone={l.consent_status === 'granted' ? 'green' : 'amber'}>{l.consent_status}</Badge></Td>
                  <Td>{l.opt_out_status ? <Badge tone="red">Opted out</Badge> : <Badge tone="gray">No</Badge>}</Td>
                  <Td className="text-ink-500">{timeAgo(l.last_contacted_at)}</Td>
                  <Td className="font-semibold">{l.qualification_score}/10</Td>
                </Tr>
              ))}
            </tbody>
          </Table>
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-ink-100 px-4 py-3">
              <p className="text-xs text-ink-500">Page {pagination.page} of {pagination.totalPages} · {pagination.total} total</p>
              <div className="flex gap-1.5">
                <Button variant="secondary" disabled={!pagination.hasPrev} onClick={() => setPage((p) => p - 1)}><ChevronLeft size={15} /> Prev</Button>
                <Button variant="secondary" disabled={!pagination.hasNext} onClick={() => setPage((p) => p + 1)}>Next <ChevronRight size={15} /></Button>
              </div>
            </div>
          )}
        </>
      )}
    </Card>
  );
}

// ---- Templates -------------------------------------------------------------
function TemplatesTab({ onNew, onEdit }: { onNew: () => void; onEdit: (t: WhatsAppTemplate) => void }) {
  const { db, tenantId } = useDb();
  const { transitionTemplate, createTemplate } = useStore();
  const templates = db.templates.filter((t) => t.tenant_id === tenantId);

  const duplicate = (t: WhatsAppTemplate) => createTemplate({ ...t, template_name: t.template_name + '_copy' });

  return (
    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
      {templates.map((t) => (
        <Card key={t.id} className="flex flex-col p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-semibold text-ink-900">{t.template_name}</p>
              <div className="mt-1 flex gap-1.5"><Badge tone="violet">{t.category}</Badge><Badge tone="gray">{t.language}</Badge></div>
            </div>
            <StatusBadge status={t.status} />
          </div>
          <p className="mt-3 line-clamp-3 flex-1 rounded-lg bg-ink-50 p-2.5 text-sm text-ink-600">{t.body_message}</p>
          {t.variables.length > 0 && <div className="mt-2 flex flex-wrap gap-1">{t.variables.map((v) => <span key={v} className="font-mono text-[11px] text-brand-600">{`{{${v}}}`}</span>)}</div>}
          <div className="mt-3 flex flex-wrap gap-1.5">
            <Button variant="secondary" className="px-2.5 py-1 text-xs" onClick={() => onEdit(t)}>Edit</Button>
            <Button variant="ghost" className="px-2.5 py-1 text-xs" onClick={() => duplicate(t)}><Copy size={12} /> Duplicate</Button>
            {t.status === 'Draft' && <Button className="px-2.5 py-1 text-xs" onClick={() => transitionTemplate(t.id, 'Submitted for Internal Review')}>Submit for review</Button>}
            {t.status === 'Provider Approved' && <Button className="px-2.5 py-1 text-xs" onClick={() => transitionTemplate(t.id, 'Active')}>Activate</Button>}
            {t.status === 'Active' && <Button variant="secondary" className="px-2.5 py-1 text-xs" onClick={() => transitionTemplate(t.id, 'Paused')}>Pause</Button>}
            {t.status === 'Paused' && <Button className="px-2.5 py-1 text-xs" onClick={() => transitionTemplate(t.id, 'Active')}>Resume</Button>}
          </div>
        </Card>
      ))}
      <button onClick={onNew} className="flex min-h-[180px] flex-col items-center justify-center rounded-xl border-2 border-dashed border-ink-200 text-ink-400 transition hover:border-brand-300 hover:text-brand-600">
        <Plus size={24} /><span className="mt-2 text-sm font-medium">New template</span>
      </button>
    </div>
  );
}

// ---- Approval workflow -----------------------------------------------------
function ApprovalTab() {
  const { db, tenantId } = useDb();
  const { transitionTemplate } = useStore();
  const templates = db.templates.filter((t) => t.tenant_id === tenantId);

  const actionsFor = (t: WhatsAppTemplate) => {
    switch (t.status) {
      case 'Draft': return [{ label: 'Submit for Internal Review', to: 'Submitted for Internal Review' as const, primary: true }];
      case 'Submitted for Internal Review': return [
        { label: 'Approve internally', to: 'Internally Approved' as const, primary: true },
        { label: 'Request changes', to: 'Changes Requested' as const },
        { label: 'Reject', to: 'Rejected Internally' as const },
      ];
      case 'Changes Requested': return [{ label: 'Re-submit', to: 'Submitted for Internal Review' as const, primary: true }];
      case 'Internally Approved': return [{ label: 'Submit to provider', to: 'Submitted to Provider' as const, primary: true }];
      case 'Submitted to Provider': return [{ label: 'Simulate provider approval', to: 'Provider Approved' as const, primary: true }, { label: 'Simulate rejection', to: 'Provider Rejected' as const }];
      case 'Provider Approved': return [{ label: 'Activate', to: 'Active' as const, primary: true }];
      default: return [];
    }
  };

  return (
    <Card>
      <CardHeader title="Template Approval Workflow" subtitle="Internal review → Provider submission → Active" />
      <div className="divide-y divide-ink-100">
        {templates.map((t) => (
          <div key={t.id} className="px-5 py-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-semibold text-ink-900">{t.template_name} <span className="ml-1 text-xs font-normal text-ink-400">v{t.version}</span></p>
                <p className="mt-0.5 text-sm text-ink-500">{t.category} · {t.language}</p>
              </div>
              <StatusBadge status={t.status} />
            </div>
            {t.rejection_reason && <p className="mt-2 rounded-lg bg-red-50 px-3 py-1.5 text-xs text-red-700">Rejection: {t.rejection_reason}</p>}
            {/* Status timeline */}
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-ink-400">
              {t.status_history.map((h, i) => (
                <span key={i} className="flex items-center gap-1">{i > 0 && <span>→</span>}<span className="rounded bg-ink-100 px-1.5 py-0.5 font-medium text-ink-600">{h.status}</span></span>
              ))}
            </div>
            {t.approval_comments.length > 0 && (
              <div className="mt-2 space-y-1">
                {t.approval_comments.map((c, i) => <p key={i} className="text-xs text-ink-500">💬 <span className="font-medium">{userName(db, c.author_id)}</span> ({c.action}): {c.text}</p>)}
              </div>
            )}
            <div className="mt-3 flex flex-wrap gap-2">
              {actionsFor(t).map((a) => (
                <Button key={a.label} variant={a.primary ? 'primary' : 'secondary'} className="px-3 py-1.5 text-xs"
                  onClick={() => transitionTemplate(t.id, a.to, a.to.includes('Rejected') || a.to.includes('Changes') ? 'Reviewed via approval workflow' : undefined)}>
                  {a.primary && a.to === 'Internally Approved' && <CheckCircle2 size={13} />}
                  {a.to.includes('Rejected') && <XCircle size={13} />}
                  {a.label}
                </Button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

// ---- Campaigns / Broadcasts ------------------------------------------------
function CampaignsTab({ broadcast }: { broadcast: boolean }) {
  const { db, tenantId } = useDb();
  const { createCampaign, transitionCampaign, sendCampaign } = useStore();
  const [show, setShow] = useState(false);
  const items = db.campaigns.filter((c) => c.tenant_id === tenantId && (broadcast ? c.is_broadcast : !c.is_broadcast));
  const templates = db.templates.filter((t) => t.tenant_id === tenantId && ['Active', 'Provider Approved'].includes(t.status));
  const [form, setForm] = useState({ name: '', template_id: '', audience: 'Hot leads', count: 250 });

  const audiences = ['Hot leads', 'Webinar attendees', 'Ghosted 14d+', 'Booked but not paid', 'Proposal sent', 'Payment pending', 'No-show leads', 'All qualified'];

  const create = () => {
    if (!form.name.trim()) return toast.error('Name required');
    createCampaign({ name: form.name, template_id: form.template_id || templates[0]?.id, audience_filter: form.audience, audience_count: Number(form.count), is_broadcast: broadcast });
    setShow(false);
    setForm({ name: '', template_id: '', audience: 'Hot leads', count: 250 });
  };

  return (
    <div>
      <div className="mb-4 flex justify-end"><Button onClick={() => setShow(true)}><Plus size={16} /> New {broadcast ? 'Broadcast' : 'Campaign'}</Button></div>
      {items.length === 0 ? <EmptyState title={`No ${broadcast ? 'broadcasts' : 'campaigns'} yet`} action={<Button onClick={() => setShow(true)}><Plus size={16} /> Create</Button>} /> : (
        <div className="grid gap-3 lg:grid-cols-2">
          {items.map((c) => {
            const t = db.templates.find((x) => x.id === c.template_id);
            const m = c.metrics;
            return (
              <Card key={c.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div><p className="font-semibold text-ink-900">{c.name}</p><p className="text-xs text-ink-500">{c.audience_filter} · {c.audience_count} recipients · {t?.template_name ?? 'no template'}</p></div>
                  <StatusBadge status={c.status} />
                </div>
                <div className="mt-3 grid grid-cols-4 gap-2 text-center">
                  {[['Sent', m.sent], ['Delivered', m.delivered], ['Read', m.read], ['Replied', m.replied]].map(([k, v]) => (
                    <div key={k} className="rounded-lg bg-ink-50 py-1.5"><p className="text-sm font-bold text-ink-900">{v}</p><p className="text-[10px] text-ink-500">{k}</p></div>
                  ))}
                </div>
                <div className="mt-2 grid grid-cols-3 gap-2 text-center">
                  {[['Bookings', m.bookings], ['Payments', m.payments]].map(([k, v]) => (
                    <div key={k} className="rounded-lg bg-ink-50 py-1.5"><p className="text-sm font-bold text-ink-900">{v}</p><p className="text-[10px] text-ink-500">{k}</p></div>
                  ))}
                  <div className="rounded-lg bg-emerald-50 py-1.5"><p className="text-sm font-bold text-emerald-700">{formatCurrency(m.revenue)}</p><p className="text-[10px] text-emerald-600">Revenue</p></div>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {c.status === 'Draft' && <Button className="px-3 py-1 text-xs" onClick={() => transitionCampaign(c.id, 'Pending Approval')}>Submit for approval</Button>}
                  {c.status === 'Pending Approval' && <Button className="px-3 py-1 text-xs" onClick={() => transitionCampaign(c.id, 'Approved')}>Approve</Button>}
                  {(c.status === 'Approved' || c.status === 'Scheduled') && <Button className="px-3 py-1 text-xs" onClick={() => sendCampaign(c.id)}><Send size={12} /> Send now</Button>}
                  {c.status === 'Approved' && <Button variant="secondary" className="px-3 py-1 text-xs" onClick={() => transitionCampaign(c.id, 'Scheduled')}>Schedule</Button>}
                  {(c.status === 'Sending' || c.status === 'Scheduled') && <Button variant="secondary" className="px-3 py-1 text-xs" onClick={() => transitionCampaign(c.id, 'Paused')}>Pause</Button>}
                </div>
              </Card>
            );
          })}
        </div>
      )}
      {show && (
        <Modal open onClose={() => setShow(false)} title={`New WhatsApp ${broadcast ? 'Broadcast' : 'Campaign'}`}
          footer={<><Button variant="secondary" onClick={() => setShow(false)}>Cancel</Button><Button onClick={create}>Create</Button></>}>
          <div className="space-y-4">
            <Field label="Name"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
            <Field label="Approved template"><Select value={form.template_id} onChange={(e) => setForm({ ...form, template_id: e.target.value })}>{templates.map((t) => <option key={t.id} value={t.id}>{t.template_name}</option>)}</Select></Field>
            <Field label="Audience segment"><Select value={form.audience} onChange={(e) => setForm({ ...form, audience: e.target.value })}>{audiences.map((a) => <option key={a}>{a}</option>)}</Select></Field>
            <Field label="Estimated recipients" hint="Opted-out contacts are automatically excluded"><Input type="number" value={form.count} onChange={(e) => setForm({ ...form, count: Number(e.target.value) })} /></Field>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ---- Nurture messages ------------------------------------------------------
function NurtureMessagesTab() {
  const { db, tenantId } = useDb();
  const seqs = db.nurtureSequences.filter((s) => s.tenant_id === tenantId);
  const waSteps = seqs.flatMap((s) => s.steps.filter((st) => st.channel === 'WhatsApp').map((st) => ({ seq: s.name, ...st })));
  return (
    <Card>
      <CardHeader title="WhatsApp Nurture Messages" subtitle="WhatsApp steps across all active sequences" />
      <Table>
        <thead><tr><Th>Sequence</Th><Th>Step</Th><Th>Delay</Th><Th>Message</Th></tr></thead>
        <tbody>
          {waSteps.map((s, i) => (
            <Tr key={i}><Td className="font-medium">{s.seq}</Td><Td>Step {s.order}</Td><Td>Day {s.delay_days}</Td><Td className="max-w-md truncate text-ink-600">{s.message}</Td></Tr>
          ))}
        </tbody>
      </Table>
    </Card>
  );
}

// ---- AI assistant ----------------------------------------------------------
function AIAssistantTab() {
  const [input, setInput] = useState('Hi, I saw your webinar and I\'m interested but pricing is a concern.');
  const [output, setOutput] = useState('');
  const actions = [
    { label: 'Generate reply', mode: 'default' as const },
    { label: 'Booking message', mode: 'booking' as const },
    { label: 'Payment reminder', mode: 'payment' as const },
    { label: 'Objection handling', mode: 'objection' as const },
    { label: 'Follow-up after call', mode: 'followup' as const },
  ];
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card className="p-5">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-ink-900"><Sparkles size={16} className="text-brand-600" /> AI Reply Assistant</h3>
        <p className="mt-1 text-xs text-ink-500">Paste an inbound message and generate context-aware replies.</p>
        <textarea value={input} onChange={(e) => setInput(e.target.value)} rows={4} className="input mt-3" />
        <div className="mt-3 flex flex-wrap gap-2">
          {actions.map((a) => <Button key={a.label} variant="secondary" className="px-3 py-1.5 text-xs" onClick={() => setOutput(generateWhatsAppReply(input, a.mode))}>{a.label}</Button>)}
        </div>
        {output && (
          <div className="mt-3 flex flex-wrap gap-2">
            <Button variant="ghost" className="px-2.5 py-1 text-xs" onClick={() => setOutput(rewriteWhatsAppMessage(output, 'shorter'))}>Make shorter</Button>
            <Button variant="ghost" className="px-2.5 py-1 text-xs" onClick={() => setOutput(rewriteWhatsAppMessage(output, 'professional'))}>Professional</Button>
            <Button variant="ghost" className="px-2.5 py-1 text-xs" onClick={() => setOutput(rewriteWhatsAppMessage(output, 'persuasive'))}>Persuasive</Button>
          </div>
        )}
      </Card>
      <Card className="p-5">
        <h3 className="text-sm font-semibold text-ink-900">Generated reply</h3>
        {output ? (
          <>
            <div className="mt-3 rounded-xl rounded-tl-sm bg-brand-50 p-4 text-sm text-ink-800 whitespace-pre-line">{output}</div>
            <Button className="mt-3 text-xs" onClick={() => { navigator.clipboard?.writeText(output); toast.success('Copied to clipboard'); }}><Copy size={13} /> Copy reply</Button>
          </>
        ) : <EmptyState title="No reply generated yet" description="Choose an action on the left to generate an AI reply." icon={<Sparkles size={20} />} />}
      </Card>
    </div>
  );
}

// ---- Rules -----------------------------------------------------------------
function RulesTab() {
  const { db, tenantId } = useDb();
  const { toggleAutomation } = useStore();
  const autos = db.automations.filter((a) => a.tenant_id === tenantId);
  return (
    <Card>
      <CardHeader title="WhatsApp Automation Rules" subtitle="Trigger-based WhatsApp actions" />
      <div className="divide-y divide-ink-100">
        {autos.map((a) => (
          <div key={a.id} className="flex items-center justify-between px-5 py-3.5">
            <div>
              <p className="font-medium text-ink-900">{a.name}</p>
              <p className="text-xs text-ink-500">When <span className="font-medium text-ink-700">{a.trigger}</span> → {a.action}</p>
            </div>
            <div className="flex items-center gap-3">
              <Badge tone={a.status === 'active' ? 'green' : 'gray'}>{a.status}</Badge>
              <Toggle checked={a.status === 'active'} onChange={() => toggleAutomation(a.id)} />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

// ---- Consent ---------------------------------------------------------------
function ConsentTab() {
  const { db, tenantId } = useDb();
  const { updateLead } = useStore();
  const leads = db.leads.filter((l) => l.tenant_id === tenantId && !l.archived);
  const optedOut = leads.filter((l) => l.opt_out_status);
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard label="Opted-in" value={leads.filter((l) => l.consent_status === 'granted' && !l.opt_out_status).length} icon={<CheckCircle2 size={18} />} accent="#10b981" />
        <KpiCard label="Pending consent" value={leads.filter((l) => l.consent_status === 'pending').length} icon={<MessageSquare size={18} />} accent="#f59e0b" />
        <KpiCard label="Opted-out" value={optedOut.length} icon={<XCircle size={18} />} accent="#ef4444" />
        <KpiCard label="Opt-out rate" value={percent(leads.length ? (optedOut.length / leads.length) * 100 : 0, 1)} icon={<XCircle size={18} />} accent="#ef4444" />
      </div>
      <Card>
        <CardHeader title="Consent & Suppression List" subtitle="Opt-out keywords: STOP · UNSUBSCRIBE · CANCEL · NO · REMOVE" />
        <Table>
          <thead><tr><Th>Contact</Th><Th>Consent</Th><Th>Source</Th><Th>Status</Th><Th>Action</Th></tr></thead>
          <tbody>
            {leads.slice(0, 25).map((l) => (
              <Tr key={l.id}>
                <Td className="font-medium">{l.name}</Td>
                <Td><Badge tone={l.consent_status === 'granted' ? 'green' : 'amber'}>{l.consent_status}</Badge></Td>
                <Td>{l.source}</Td>
                <Td>{l.opt_out_status ? <Badge tone="red">Suppressed</Badge> : <Badge tone="green">Sendable</Badge>}</Td>
                <Td><Button variant="secondary" className="px-2.5 py-1 text-xs" onClick={() => updateLead(l.id, { opt_out_status: !l.opt_out_status })}>{l.opt_out_status ? 'Restore' : 'Opt out'}</Button></Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      </Card>
    </div>
  );
}

// ---- Delivery logs ---------------------------------------------------------
function LogsTab() {
  const { db, tenantId } = useDb();
  const logs = db.deliveryLogs.filter((l) => l.tenant_id === tenantId).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  return (
    <Card>
      <CardHeader title="Delivery Logs" subtitle={`${logs.length} messages tracked`} />
      <Table>
        <thead><tr><Th>Time</Th><Th>Recipient</Th><Th>Provider</Th><Th>Type</Th><Th>Status</Th><Th>Retries</Th></tr></thead>
        <tbody>
          {logs.slice(0, 40).map((l) => (
            <Tr key={l.id}>
              <Td className="text-ink-500">{formatDateTime(l.sent_at ?? l.created_at)}</Td>
              <Td className="font-mono text-xs">{l.recipient}</Td>
              <Td>{l.provider_name}</Td>
              <Td className="capitalize">{l.message_type}</Td>
              <Td><StatusBadge status={l.status} /></Td>
              <Td>{l.retry_count}</Td>
            </Tr>
          ))}
        </tbody>
      </Table>
    </Card>
  );
}

// ---- Analytics -------------------------------------------------------------
function AnalyticsTab() {
  const { db, tenantId } = useDb();
  const convos = db.conversations.filter((c) => c.tenant_id === tenantId);
  const msgs = db.messages.filter((m) => m.tenant_id === tenantId);
  const sent = msgs.filter((m) => m.direction === 'outbound').length;
  const campaigns = db.campaigns.filter((c) => c.tenant_id === tenantId);
  const totalSent = campaigns.reduce((s, c) => s + c.metrics.sent, 0);
  const totalDelivered = campaigns.reduce((s, c) => s + c.metrics.delivered, 0);
  const totalRead = campaigns.reduce((s, c) => s + c.metrics.read, 0);
  const totalReplied = campaigns.reduce((s, c) => s + c.metrics.replied, 0);
  const revenue = campaigns.reduce((s, c) => s + c.metrics.revenue, 0);

  const trend = conversationsTrend(db, tenantId);
  const replyByCampaign = campaigns.slice(0, 6).map((c) => ({ name: c.name.slice(0, 12), value: c.metrics.replied }));
  const tplPerf = db.templates.filter((t) => t.tenant_id === tenantId).slice(0, 6).map((t) => ({ name: t.template_name.slice(0, 12), value: Math.floor(Math.random() * 80) + 20 }));
  const funnel = [
    { name: 'Sent', value: totalSent }, { name: 'Delivered', value: totalDelivered },
    { name: 'Read', value: totalRead }, { name: 'Replied', value: totalReplied },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard label="Conversations" value={convos.length} icon={<MessageSquare size={18} />} accent="#22c55e" />
        <KpiCard label="Messages sent" value={sent} icon={<Send size={18} />} accent="#6366f1" />
        <KpiCard label="Delivery rate" value={percent(totalSent ? (totalDelivered / totalSent) * 100 : 0)} icon={<CheckCircle2 size={18} />} accent="#3b82f6" />
        <KpiCard label="Reply rate" value={percent(totalRead ? (totalReplied / totalRead) * 100 : 0)} icon={<MessageSquare size={18} />} accent="#8b5cf6" />
        <KpiCard label="Read rate" value={percent(totalDelivered ? (totalRead / totalDelivered) * 100 : 0)} icon={<CheckCircle2 size={18} />} accent="#06b6d4" />
        <KpiCard label="Avg response" value="14m" icon={<RefreshCw size={18} />} accent="#14b8a6" />
        <KpiCard label="WA Revenue" value={formatCurrency(revenue)} icon={<Server size={18} />} accent="#10b981" />
        <KpiCard label="Pending replies" value={convos.filter((c) => c.unread_count > 0).length} icon={<MessageSquare size={18} />} accent="#f97316" />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <LineChartCard title="Conversations over time" data={trend} color="#22c55e" area />
        <BarChartCard title="Reply rate by campaign" data={replyByCampaign} color="#8b5cf6" />
        <BarChartCard title="Template performance" data={tplPerf} color="#6366f1" />
        <DonutChartCard title="Message delivery funnel" data={funnel} />
      </div>
    </div>
  );
}

// ---- Settings --------------------------------------------------------------
/**
 * SettingsTab -- real, backend-connected WhatsApp Provider Settings.
 *
 * Phase 1 scope, confirmed with the user: only META_CLOUD + panelMode
 * NATIVE has a real, working send/receive/webhook path. Every other
 * provider is a real, valid, stored enum value with no adapter
 * implemented yet -- shown in the dropdown but disabled, not hidden, so
 * the gap is honest.
 *
 * Three fields deliberately differ from the original reference design,
 * each for a specific real-backend reason (confirmed with the user
 * beforehand):
 *   - "Default Sender Number" -> read-only, populated by Test Connection
 *     from Meta's real API response, not a typed field (there's nowhere
 *     to store a typed value distinct from phoneNumberId).
 *   - "Webhook URL" -> read-only, computed server-side from
 *     API_BASE_URL + tenantId, with a copy button. This is OUR receiving
 *     endpoint, not something a tenant invents.
 *   - "App Secret" is present here even though the original reference
 *     design didn't show it -- it's functionally required for webhook
 *     signature verification (HMAC against this exact value) to work at
 *     all; without it, real inbound messages could never be verified.
 */
function SettingsTab() {
  const { settings, loading, error, updateProvider, updateSync, testConnection, disconnect } = useWhatsAppSettings();

  const [provider, setProvider] = useState<WhatsAppProviderReal>('SIMULATION');
  const [panelMode, setPanelMode] = useState<PanelMode>('NATIVE');
  const [businessAccountId, setBusinessAccountId] = useState('');
  const [phoneNumberId, setPhoneNumberId] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [appSecret, setAppSecret] = useState('');
  const [verifyToken, setVerifyToken] = useState('');
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  useEffect(() => {
    if (!settings) return;
    setProvider(settings.provider);
    setPanelMode(settings.panelMode);
    setBusinessAccountId(settings.meta.businessAccountId);
    setPhoneNumberId(settings.meta.phoneNumberId);
  }, [settings]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateProvider({
        provider,
        // Was missing entirely before -- providerMode defaults to
        // 'SIMULATION' in the schema, and resolveProvider() checks THIS
        // before even looking at which provider is selected. Never
        // sending it meant every save silently stayed in simulation
        // regardless of the Provider dropdown. Derived automatically:
        // picking a real provider means you mean to use it for real.
        providerMode: provider === 'SIMULATION' ? 'SIMULATION' : 'LIVE',
        panelMode,
        meta: {
          businessAccountId,
          phoneNumberId,
          ...(accessToken ? { accessToken } : {}),
          ...(appSecret ? { appSecret } : {}),
          ...(verifyToken ? { verifyToken } : {}),
        },
      });
      setAccessToken('');
      setAppSecret('');
      setVerifyToken('');
      toast.success('Settings saved');
    } catch (err) {
      toast.error('Could not save settings', err instanceof ApiError ? err.message : 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    try {
      const result = await testConnection();
      toast.success('Connection verified', result.displayPhoneNumber ? `Sending as ${result.displayPhoneNumber}` : result.message);
    } catch (err) {
      toast.error('Connection test failed', err instanceof ApiError ? err.message : 'Please try again.');
    } finally {
      setTesting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!window.confirm('Disconnect WhatsApp? Sending/receiving will fall back to Simulation Mode. Your saved credentials are kept, so reconnecting later won\u2019t require re-entering them.')) return;
    setDisconnecting(true);
    try {
      await disconnect();
      toast.success('WhatsApp disconnected', 'Reverted to Simulation Mode');
    } catch (err) {
      toast.error('Could not disconnect', err instanceof ApiError ? err.message : 'Please try again.');
    } finally {
      setDisconnecting(false);
    }
  };

  const copyWebhookUrl = () => {
    if (!settings?.meta.webhookUrl) return;
    navigator.clipboard?.writeText(settings.meta.webhookUrl);
    toast.success('Webhook URL copied', 'Paste this into your Meta App\u2019s webhook configuration');
  };

  const handleSyncToggle = async (key: keyof WhatsAppSettingsSync, value: boolean) => {
    try {
      await updateSync({ [key]: value });
    } catch (err) {
      toast.error('Could not update sync setting', err instanceof ApiError ? err.message : 'Please try again.');
    }
  };

  if (loading && !settings) return <Card className="max-w-3xl p-6"><p className="text-sm text-ink-400">Loading settings…</p></Card>;
  if (error) return <Card className="max-w-3xl p-6"><p className="text-sm text-red-600">{error}</p></Card>;
  if (!settings) return null;

  return (
    <Card className="max-w-3xl p-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-ink-900">WhatsApp Provider Settings</h3>
          <p className="mt-1 text-xs text-ink-500">Choose native InnovateX panel or a third-party BSP. Only Meta Cloud API is fully connected in this phase.</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge tone={settings.meta.connected ? 'green' : 'gray'}>{settings.meta.connected ? 'Connected' : 'Not connected'}</Badge>
          {settings.meta.connected && (
            <Button variant="secondary" className="px-2.5 py-1 text-xs" onClick={() => void handleDisconnect()} disabled={disconnecting}>
              {disconnecting ? 'Disconnecting…' : 'Disconnect'}
            </Button>
          )}
        </div>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Field label="WhatsApp mode">
          <Select value={panelMode} onChange={(e) => setPanelMode(e.target.value as PanelMode)}>
            <option value="NATIVE">Native InnovateX Panel</option>
            <option value="THIRD_PARTY">Third-party Provider</option>
          </Select>
        </Field>
        <Field label="Provider">
          <Select value={provider} onChange={(e) => setProvider(e.target.value as WhatsAppProviderReal)}>
            {(Object.keys(PROVIDER_LABELS) as WhatsAppProviderReal[]).map((p) => (
              <option key={p} value={p} disabled={!IMPLEMENTED_PROVIDERS.includes(p)}>
                {PROVIDER_LABELS[p]}{!IMPLEMENTED_PROVIDERS.includes(p) ? ' (coming soon)' : ''}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Default sender number">
          <Input value={settings.meta.displayPhoneNumber || 'Not verified yet — run Test Connection'} readOnly className="bg-ink-50 text-ink-500" />
        </Field>
        <Field label="Phone number ID">
          <Input value={phoneNumberId} onChange={(e) => setPhoneNumberId(e.target.value)} placeholder="e.g. 119128780406310" />
        </Field>
        <Field label="Business account ID">
          <Input value={businessAccountId} onChange={(e) => setBusinessAccountId(e.target.value)} placeholder="e.g. 951181964646443" />
        </Field>
        <Field label="Access token">
          <Input
            type="password"
            value={accessToken}
            onChange={(e) => setAccessToken(e.target.value)}
            placeholder={settings.meta.hasAccessToken ? 'Already set — leave blank to keep' : 'Paste your Meta access token'}
          />
        </Field>
        <Field label="App secret">
          <Input
            type="password"
            value={appSecret}
            onChange={(e) => setAppSecret(e.target.value)}
            placeholder={settings.meta.hasAppSecret ? 'Already set — leave blank to keep' : 'Required to verify inbound webhook signatures'}
          />
        </Field>
        <Field label="Verify token">
          <Input
            value={verifyToken}
            onChange={(e) => setVerifyToken(e.target.value)}
            placeholder={settings.meta.hasVerifyToken ? 'Already set — leave blank to keep' : 'Choose any string, then paste it into Meta'}
          />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Webhook URL">
            <div className="flex gap-2">
              <Input value={settings.meta.webhookUrl} readOnly className="bg-ink-50 text-ink-500" />
              <Button variant="secondary" onClick={copyWebhookUrl}><Copy size={14} /> Copy</Button>
            </div>
            <p className="mt-1 text-[11px] text-ink-400">Auto-generated for your workspace — paste this into your Meta App's webhook configuration, not the other way around.</p>
          </Field>
        </div>
      </div>

      <div className="mt-4 space-y-2 rounded-lg border border-ink-100 p-3">
        {([
          ['autoSyncTemplates', 'Sync templates'],
          ['autoSyncMessages', 'Sync messages'],
          ['autoSyncContacts', 'Sync contacts'],
        ] as const).map(([k, label]) => (
          <div key={k} className="flex items-center justify-between">
            <span className="text-sm text-ink-700">{label}</span>
            <Toggle checked={settings.sync[k]} onChange={(v) => void handleSyncToggle(k, v)} />
          </div>
        ))}
      </div>

      <div className="mt-4 flex gap-2">
        <Button onClick={() => void handleSave()} disabled={saving}>{saving ? 'Saving…' : 'Save settings'}</Button>
        <Button variant="secondary" onClick={() => void handleTest()} disabled={testing}>
          <RefreshCw size={15} className={testing ? 'animate-spin' : ''} /> {testing ? 'Testing…' : 'Test Connection'}
        </Button>
      </div>
    </Card>
  );
}