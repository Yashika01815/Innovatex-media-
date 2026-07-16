import { useState } from 'react';
import {
  Plus, Send, Sparkles, Copy, CheckCircle2, XCircle, MessageSquare, Server, RefreshCw,
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
function ContactsTab() {
  const { db, tenantId } = useDb();
  const leads = db.leads.filter((l) => l.tenant_id === tenantId && !l.archived);
  return (
    <Card>
      <CardHeader title="WhatsApp Contacts" subtitle={`${leads.length} contacts synced`} />
      <Table>
        <thead><tr><Th>Contact</Th><Th>WhatsApp</Th><Th>Consent</Th><Th>Opt-out</Th><Th>Last contacted</Th><Th>Score</Th></tr></thead>
        <tbody>
          {leads.slice(0, 25).map((l) => (
            <Tr key={l.id}>
              <Td><div className="flex items-center gap-2"><Avatar name={l.name} color="#22c55e" size={30} /><span className="font-medium">{l.name}</span></div></Td>
              <Td className="font-mono text-xs">{l.whatsapp_number}</Td>
              <Td><Badge tone={l.consent_status === 'granted' ? 'green' : 'amber'}>{l.consent_status}</Badge></Td>
              <Td>{l.opt_out_status ? <Badge tone="red">Opted out</Badge> : <Badge tone="gray">No</Badge>}</Td>
              <Td className="text-ink-500">{timeAgo(l.last_contacted_at)}</Td>
              <Td className="font-semibold">{l.qualification_score}/10</Td>
            </Tr>
          ))}
        </tbody>
      </Table>
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
function SettingsTab() {
  const settings = useSettings();
  const { updateSettings } = useStore();
  const wa = settings.whatsapp;
  const [form, setForm] = useState(wa);

  const save = () => updateSettings({ whatsapp: form });
  const sync = () => {
    const r = syncFromProvider(form.provider_name);
    toast.success('Sync complete', `${r.messages.synced} messages · ${r.templates.synced} templates · ${r.contacts.synced} contacts`);
  };

  return (
    <Card className="max-w-3xl p-6">
      <h3 className="text-sm font-semibold text-ink-900">WhatsApp Provider Settings</h3>
      <p className="mt-1 text-xs text-ink-500">Choose native InnovateX panel or a third-party BSP. All providers run in simulation mode.</p>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Field label="WhatsApp mode">
          <Select value={form.whatsapp_mode} onChange={(e) => setForm({ ...form, whatsapp_mode: e.target.value as 'native' | 'third_party' })}>
            <option value="native">Native InnovateX Panel</option>
            <option value="third_party">Third-party Provider</option>
          </Select>
        </Field>
        <Field label="Provider"><Select value={form.provider_name} onChange={(e) => setForm({ ...form, provider_name: e.target.value as WhatsAppProvider })}>{PROVIDERS.map((p) => <option key={p}>{p}</option>)}</Select></Field>
        <Field label="Default sender number"><Input value={form.default_sender_number} onChange={(e) => setForm({ ...form, default_sender_number: e.target.value })} /></Field>
        <Field label="Phone number ID"><Input value={form.phone_number_id} onChange={(e) => setForm({ ...form, phone_number_id: e.target.value })} /></Field>
        <Field label="Business account ID"><Input value={form.business_account_id} onChange={(e) => setForm({ ...form, business_account_id: e.target.value })} /></Field>
        <Field label="Access token"><Input value={form.access_token} onChange={(e) => setForm({ ...form, access_token: e.target.value })} /></Field>
        <Field label="Webhook URL"><Input value={form.webhook_url} onChange={(e) => setForm({ ...form, webhook_url: e.target.value })} /></Field>
        <Field label="Verify token"><Input value={form.verify_token} onChange={(e) => setForm({ ...form, verify_token: e.target.value })} /></Field>
      </div>

      <div className="mt-4 space-y-2 rounded-lg border border-ink-100 p-3">
        {([['sync_templates_enabled', 'Sync templates'], ['sync_messages_enabled', 'Sync messages'], ['sync_contacts_enabled', 'Sync contacts']] as const).map(([k, label]) => (
          <div key={k} className="flex items-center justify-between">
            <span className="text-sm text-ink-700">{label}</span>
            <Toggle checked={form[k]} onChange={(v) => setForm({ ...form, [k]: v })} />
          </div>
        ))}
      </div>

      <div className="mt-4 flex gap-2">
        <Button onClick={save}>Save settings</Button>
        <Button variant="secondary" onClick={sync}><RefreshCw size={15} /> Sync now</Button>
      </div>
    </Card>
  );
}
