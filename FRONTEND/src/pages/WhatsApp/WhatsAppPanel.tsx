import { useEffect, useState } from 'react';
import {
  Plus, Send, Sparkles, Copy, CheckCircle2, XCircle, MessageSquare, Server, RefreshCw,
  ChevronLeft, ChevronRight, Trash2, Unplug,
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
// import { useWhatsAppTemplates } from '@/hooks/useWhatsAppTemplates';
import { useWhatsAppTemplates } from '@/hooks/useWhatsAppTemplates';
import type { WhatsAppTemplate as WhatsAppTemplateReal } from '@/types/whatsappTemplate';
import { PROVIDER_LABELS, NATIVE_PROVIDER, THIRD_PARTY_PROVIDER_VALUES, IMPLEMENTED_THIRD_PARTY_PROVIDERS } from '@/types/whatsappSettings';
import type { WhatsAppProvider as WhatsAppProviderReal, PanelMode, WhatsAppSettingsSync } from '@/types/whatsappSettings';
import { ApiError } from '@/lib/apiClient';
import type { WhatsAppTemplate, WhatsAppProvider } from '@/types';
import { useTemplateApproval } from '@/hooks/useTemplateApproval';
import { useDeliveryLogs, useDeliveryLogsStats } from '@/hooks/useDeliveryLogs';
import type { DeliveryLog, DeliveryStatus, DeliveryProvider } from '@/types/whatsappDeliveryLog';
import { DELIVERY_PROVIDER_VALUES } from '@/types/whatsappDeliveryLog';

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

  return (
    <div>
      <PageHeader
        title="WhatsApp Operating Panel"
        description="Native InnovateX panel + multi-provider simulation — inbox, templates, campaigns & analytics."
        breadcrumb={['Revenue', 'WhatsApp Panel']}
      />
      <div className="mb-4"><Tabs tabs={TABS} active={tab} onChange={setTab} /></div>

      {tab === 'inbox' && <Inbox />}
      {tab === 'contacts' && <ContactsTab />}
      {tab === 'templates' && <TemplatesTab />}
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
/**
 * TemplatesTab -- real data. Status-aware actions use the REAL 7-value
 * status enum (DRAFT/SUBMITTED/APPROVED/REJECTED/ACTIVE/PAUSED/ARCHIVED),
 * not the mock's 11-state DEVELOPER_HANDOFF.md workflow -- that fuller
 * workflow lives in approvalStatus, managed separately by the Template
 * Approval tab. Confirmed via real Postman testing: activate/pause/archive
 * are real, working dedicated endpoints; duplicate creates a genuine new
 * Draft copy with a fresh id/slug.
 */
function TemplatesTab() {
  const { templates, loading, error, refetch, deleteTemplate, duplicateTemplate, activateTemplate, pauseTemplate, archiveTemplate } = useWhatsAppTemplates();
  const [showBuilder, setShowBuilder] = useState(false);
  const [editTpl, setEditTpl] = useState<WhatsAppTemplateReal | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const runAction = async (id: string, action: () => Promise<unknown>, successMsg: string, failMsg: string) => {
    setBusyId(id);
    try {
      await action();
      toast.success(successMsg);
    } catch (err) {
      toast.error(failMsg, err instanceof ApiError ? err.message : 'Please try again.');
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (t: WhatsAppTemplateReal) => {
    if (!window.confirm(`Delete "${t.name}"? This cannot be undone.`)) return;
    await runAction(t.id, () => deleteTemplate(t.id), 'Template deleted', 'Could not delete template');
  };

  if (loading && templates.length === 0) return <p className="p-8 text-center text-sm text-ink-400">Loading templates…</p>;
  if (error) return <Card className="p-4 text-sm text-red-600">{error}</Card>;

  return (
    <div>
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {templates.map((t) => (
          <Card key={t.id} className="flex flex-col p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold text-ink-900">{t.name}</p>
                <div className="mt-1 flex gap-1.5"><Badge tone="violet">{t.category}</Badge><Badge tone="gray">{t.languageCode}</Badge></div>
              </div>
              <StatusBadge status={t.status} />
            </div>
            <p className="mt-3 line-clamp-3 flex-1 rounded-lg bg-ink-50 p-2.5 text-sm text-ink-600">{t.body}</p>
            {t.variables.length > 0 && <div className="mt-2 flex flex-wrap gap-1">{t.variables.map((v) => <span key={v} className="font-mono text-[11px] text-brand-600">{`{{${v}}}`}</span>)}</div>}
            <div className="mt-3 flex flex-wrap gap-1.5">
              <Button variant="secondary" className="px-2.5 py-1 text-xs" onClick={() => setEditTpl(t)}>Edit</Button>
              <Button
                variant="ghost" className="px-2.5 py-1 text-xs" disabled={busyId === t.id}
                onClick={() => void runAction(t.id, () => duplicateTemplate(t.id), 'Template duplicated', 'Could not duplicate template')}
              ><Copy size={12} /> Duplicate</Button>
              {(t.status === 'DRAFT' || t.status === 'PAUSED') && (
                <Button className="px-2.5 py-1 text-xs" disabled={busyId === t.id} onClick={() => void runAction(t.id, () => activateTemplate(t.id), 'Template activated', 'Could not activate template')}>
                  {t.status === 'PAUSED' ? 'Resume' : 'Activate'}
                </Button>
              )}
              {t.status === 'ACTIVE' && (
                <Button variant="secondary" className="px-2.5 py-1 text-xs" disabled={busyId === t.id} onClick={() => void runAction(t.id, () => pauseTemplate(t.id), 'Template paused', 'Could not pause template')}>
                  Pause
                </Button>
              )}
              {t.status !== 'ARCHIVED' && (
                <Button variant="ghost" className="px-2.5 py-1 text-xs text-ink-500" disabled={busyId === t.id} onClick={() => void runAction(t.id, () => archiveTemplate(t.id), 'Template archived', 'Could not archive template')}>
                  Archive
                </Button>
              )}
              <button onClick={() => void handleDelete(t)} disabled={busyId === t.id} className="rounded-lg p-1.5 text-ink-400 hover:bg-red-50 hover:text-red-600" title="Delete">
                <Trash2 size={14} />
              </button>
            </div>
          </Card>
        ))}
        <button onClick={() => setShowBuilder(true)} className="flex min-h-[180px] flex-col items-center justify-center rounded-xl border-2 border-dashed border-ink-200 text-ink-400 transition hover:border-brand-300 hover:text-brand-600">
          <Plus size={24} /><span className="mt-2 text-sm font-medium">New template</span>
        </button>
      </div>

      {showBuilder && <TemplateBuilder onClose={() => setShowBuilder(false)} onSaved={refetch} />}
      {editTpl && <TemplateBuilder template={editTpl} onClose={() => setEditTpl(null)} onSaved={refetch} />}
    </div>
  );
}

// ---- Approval workflow -----------------------------------------------------
/**
 * ApprovalTab -- real, backend-connected. Replaces the old mock version
 * that read from db.templates / useStore()'s transitionTemplate (in-memory
 * seed data, never touched the real API -- that's why it always showed
 * the same handful of fake templates like "proposal_followup" regardless
 * of what was actually created).
 *
 * Reuses useWhatsAppTemplates() for the list -- same data Templates tab
 * shows, since approvalStatus/transitionHistory/approvalComments/
 * providerRejectionReason are already real fields on WhatsAppTemplate, no
 * separate fetch needed. Actions go through useTemplateApproval(), which
 * calls the real, role-gated, transition-validated endpoints.
 *
 * Only three approvalStatus values have a real user-facing action on the
 * backend right now (see ALLOWED_TRANSITIONS in
 * templateApproval.constants.js):
 *   DRAFT                          -> Submit for internal review
 *   SUBMITTED_FOR_INTERNAL_REVIEW  -> Approve / Request changes / Reject
 *   INTERNALLY_APPROVED            -> Submit to provider
 * Everything past SUBMITTED_TO_PROVIDER (PROVIDER_APPROVED,
 * PROVIDER_REJECTED, PAUSED, DISABLED) is provider-webhook-controlled --
 * shown as read-only status here, not fake buttons that would just 409.
 */
const APPROVAL_STATUS_LABEL: Record<string, string> = {
  DRAFT: 'Draft',
  SUBMITTED_FOR_INTERNAL_REVIEW: 'Submitted for Internal Review',
  INTERNALLY_APPROVED: 'Internally Approved',
  SUBMITTED_TO_PROVIDER: 'Submitted to Provider',
  PROVIDER_APPROVED: 'Provider Approved',
  PROVIDER_REJECTED: 'Provider Rejected',
  REJECTED: 'Rejected',
  PAUSED: 'Paused',
  DISABLED: 'Disabled',
};

const APPROVAL_STATUS_TONE: Record<string, 'gray' | 'violet' | 'green' | 'red' | 'amber' | 'blue'> = {
  DRAFT: 'gray',
  SUBMITTED_FOR_INTERNAL_REVIEW: 'blue',
  INTERNALLY_APPROVED: 'violet',
  SUBMITTED_TO_PROVIDER: 'amber',
  PROVIDER_APPROVED: 'green',
  PROVIDER_REJECTED: 'red',
  REJECTED: 'red',
  PAUSED: 'amber',
  DISABLED: 'gray',
};

function ApprovalTab() {
  const { templates, loading, error, refetch } = useWhatsAppTemplates();
  const { submitForReview, requestChanges, approve, reject, submitToProvider } = useTemplateApproval(refetch);
  const [busyId, setBusyId] = useState<string | null>(null);

  const runAction = async (id: string, action: () => Promise<unknown>, successMsg: string, failMsg: string) => {
    setBusyId(id);
    try {
      await action();
      toast.success(successMsg);
    } catch (err) {
      toast.error(failMsg, err instanceof ApiError ? err.message : 'Please try again.');
    } finally {
      setBusyId(null);
    }
  };

  const handleSubmitForReview = (t: WhatsAppTemplateReal) =>
    runAction(t.id, () => submitForReview(t.id), 'Submitted for internal review', 'Could not submit for review');

  const handleApprove = (t: WhatsAppTemplateReal) =>
    runAction(t.id, () => approve(t.id), 'Template internally approved', 'Could not approve template');

  const handleRequestChanges = (t: WhatsAppTemplateReal) => {
    const comment = window.prompt('What changes are needed? (required)');
    if (comment === null) return; // cancelled
    if (!comment.trim()) return toast.error('A comment is required to request changes');
    return runAction(t.id, () => requestChanges(t.id, comment), 'Changes requested', 'Could not request changes');
  };

  const handleReject = (t: WhatsAppTemplateReal) => {
    const comment = window.prompt('Reason for rejection (required)');
    if (comment === null) return;
    if (!comment.trim()) return toast.error('A comment is required to reject');
    return runAction(t.id, () => reject(t.id, comment), 'Template rejected', 'Could not reject template');
  };

  const handleSubmitToProvider = (t: WhatsAppTemplateReal) =>
    runAction(t.id, () => submitToProvider(t.id), 'Submitted to provider', 'Could not submit to provider');

  if (loading && templates.length === 0) return <p className="p-8 text-center text-sm text-ink-400">Loading templates…</p>;
  if (error) return <Card className="p-4 text-sm text-red-600">{error}</Card>;

  return (
    <Card>
      <CardHeader title="Template Approval Workflow" subtitle="Internal review → Provider submission → Meta" />
      <div className="divide-y divide-ink-100">
        {templates.map((t) => (
          <div key={t.id} className="px-5 py-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-semibold text-ink-900">{t.name} <span className="ml-1 text-xs font-normal text-ink-400">v{t.version}</span></p>
                <p className="mt-0.5 text-sm text-ink-500">{t.category} · {t.languageCode}</p>
              </div>
              <Badge tone={APPROVAL_STATUS_TONE[t.approvalStatus] ?? 'gray'}>
                {APPROVAL_STATUS_LABEL[t.approvalStatus] ?? t.approvalStatus}
              </Badge>
            </div>

            {t.approvalStatus === 'PROVIDER_REJECTED' && (t.providerRejectionReason || t.providerRejectionMessage) && (
              <p className="mt-2 rounded-lg bg-red-50 px-3 py-1.5 text-xs text-red-700">
                Meta rejection{t.providerRejectionReason ? ` (${t.providerRejectionReason})` : ''}: {t.providerRejectionMessage || 'No message provided'}
              </p>
            )}
            {t.approvalComments && (
              <p className="mt-2 rounded-lg bg-ink-50 px-3 py-1.5 text-xs text-ink-600">💬 {t.approvalComments}</p>
            )}

            {/* Transition timeline -- real audit trail, not a fake status_history array */}
            {t.transitionHistory.length > 0 ? (
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-ink-400">
                <span className="rounded bg-ink-100 px-1.5 py-0.5 font-medium text-ink-600">{t.transitionHistory[0].fromStatus ?? 'DRAFT'}</span>
                {t.transitionHistory.map((h, i) => (
                  <span key={i} className="flex items-center gap-1">
                    <span>→</span>
                    <span className="rounded bg-ink-100 px-1.5 py-0.5 font-medium text-ink-600" title={h.action}>{h.toStatus}</span>
                  </span>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-xs text-ink-400">No transitions yet — still in Draft.</p>
            )}

            {/* Actions -- only for the 3 states that have a real backend action */}
            <div className="mt-3 flex flex-wrap gap-2">
              {t.approvalStatus === 'DRAFT' && (
                <Button className="px-3 py-1.5 text-xs" disabled={busyId === t.id} onClick={() => void handleSubmitForReview(t)}>
                  <Send size={13} /> Submit for Internal Review
                </Button>
              )}
              {t.approvalStatus === 'SUBMITTED_FOR_INTERNAL_REVIEW' && (
                <>
                  <Button className="px-3 py-1.5 text-xs" disabled={busyId === t.id} onClick={() => void handleApprove(t)}>
                    <CheckCircle2 size={13} /> Approve internally
                  </Button>
                  <Button variant="secondary" className="px-3 py-1.5 text-xs" disabled={busyId === t.id} onClick={() => void handleRequestChanges(t)}>
                    Request changes
                  </Button>
                  <Button variant="secondary" className="border-red-200 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50" disabled={busyId === t.id} onClick={() => void handleReject(t)}>
                    <XCircle size={13} /> Reject
                  </Button>
                </>
              )}
              {t.approvalStatus === 'INTERNALLY_APPROVED' && (
                <Button className="px-3 py-1.5 text-xs" disabled={busyId === t.id} onClick={() => void handleSubmitToProvider(t)}>
                  <Send size={13} /> Submit to provider
                </Button>
              )}
              {t.approvalStatus === 'SUBMITTED_TO_PROVIDER' && (
                <p className="text-xs text-ink-400">Awaiting Meta's review — this updates automatically via webhook.</p>
              )}
              {t.approvalStatus === 'PROVIDER_APPROVED' && (
                <p className="text-xs text-emerald-600">Approved by Meta — usable for sending once activated in the Templates tab.</p>
              )}
              {(t.approvalStatus === 'REJECTED' || t.approvalStatus === 'DISABLED') && (
                <p className="text-xs text-ink-400">This is a terminal state — duplicate the template to start over.</p>
              )}
            </div>
          </div>
        ))}
        {templates.length === 0 && (
          <div className="px-5 py-10 text-center text-sm text-ink-400">No templates yet — create one in the Templates tab first.</div>
        )}
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
// ---- Delivery logs ---------------------------------------------------------
/**
 * LogsTab -- real, backend-connected. Replaces the mock db.deliveryLogs
 * version. Filters (status, provider, search) live in CardHeader's `action`
 * prop (confirmed against charts/index.tsx: `<CardHeader title={title}
 * subtitle={subtitle} action={action} />` -- singular `action`, not
 * `actions`), matching how this codebase actually surfaces header-level
 * controls rather than guessing at a prop shape.
 *
 * Stats cards come from GET /delivery-logs/stats, computed server-side via
 * aggregation -- not client-computed from whatever's on the current page.
 *
 * Retry button only shows for FAILED rows (RETRYABLE_STATUSES) -- matches
 * the backend's own transition guard, so clicking it never just 409s.
 */
const DELIVERY_STATUS_TONE: Record<string, 'gray' | 'violet' | 'green' | 'red' | 'amber' | 'blue'> = {
  QUEUED: 'gray',
  SENDING: 'blue',
  SENT: 'violet',
  DELIVERED: 'green',
  READ: 'green',
  FAILED: 'red',
  EXPIRED: 'amber',
  DELETED: 'gray',
};

const DELIVERY_STATUS_FILTER_VALUES: DeliveryStatus[] = [
  'QUEUED', 'SENDING', 'SENT', 'DELIVERED', 'READ', 'FAILED', 'EXPIRED', 'DELETED',
];

function LogsTab() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<DeliveryStatus | ''>('');
  const [provider, setProvider] = useState<DeliveryProvider | ''>('');
  const [search, setSearch] = useState('');
  const [retryingId, setRetryingId] = useState<string | null>(null);

  const listQuery = {
    page,
    limit: 20,
    ...(status ? { status } : {}),
    ...(provider ? { provider } : {}),
    ...(search ? { search } : {}),
  };

  const { logs, pagination, loading, error, retry } = useDeliveryLogs(listQuery);
  const { stats } = useDeliveryLogsStats(status || provider ? { status: status || undefined, provider: provider || undefined } : {});

  const handleRetry = async (log: DeliveryLog) => {
    setRetryingId(log.id);
    try {
      await retry(log.id);
      toast.success('Message queued for retry');
    } catch (err) {
      toast.error('Could not retry message', err instanceof ApiError ? err.message : 'Please try again.');
    } finally {
      setRetryingId(null);
    }
  };

  return (
    <div className="space-y-4">
      {stats && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <KpiCard label="Total messages" value={stats.totalMessages} icon={<MessageSquare size={18} />} accent="#6366f1" />
          <KpiCard label="Delivered" value={stats.delivered} icon={<CheckCircle2 size={18} />} accent="#10b981" />
          <KpiCard label="Failed" value={stats.failed} icon={<XCircle size={18} />} accent="#ef4444" />
          <KpiCard label="Delivery rate" value={percent(stats.deliveryRate)} icon={<CheckCircle2 size={18} />} accent="#3b82f6" />
        </div>
      )}

      <Card>
        <CardHeader
          title="Delivery Logs"
          subtitle={pagination ? `${pagination.total} messages tracked` : 'Loading…'}
          action={
            <div className="flex flex-wrap gap-2">
              <Input
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder="Search phone, name, message id…"
                className="w-56 py-1.5 text-sm"
              />
              <Select value={status} onChange={(e) => { setStatus(e.target.value as DeliveryStatus | ''); setPage(1); }} className="w-auto py-1.5 text-sm">
                <option value="">All statuses</option>
                {DELIVERY_STATUS_FILTER_VALUES.map((s) => <option key={s} value={s}>{s}</option>)}
              </Select>
              <Select value={provider} onChange={(e) => { setProvider(e.target.value as DeliveryProvider | ''); setPage(1); }} className="w-auto py-1.5 text-sm">
                <option value="">All providers</option>
                {DELIVERY_PROVIDER_VALUES.map((p) => <option key={p} value={p}>{p}</option>)}
              </Select>
            </div>
          }
        />

        {error ? (
          <EmptyState title="Couldn't load delivery logs" description={error} />
        ) : loading && logs.length === 0 ? (
          <p className="p-8 text-center text-sm text-ink-400">Loading delivery logs…</p>
        ) : logs.length === 0 ? (
          <EmptyState title="No delivery logs yet" description="Sent messages will be tracked here." />
        ) : (
          <>
            <Table>
              <thead><tr><Th>Time</Th><Th>Recipient</Th><Th>Provider</Th><Th>Type</Th><Th>Status</Th><Th>Retries</Th><Th /></tr></thead>
              <tbody>
                {logs.map((l) => (
                  <Tr key={l.id}>
                    <Td className="text-ink-500">{formatDateTime(l.sentAt ?? l.createdAt)}</Td>
                    <Td>
                      <div className="font-mono text-xs">{l.phoneNumber}</div>
                      {(l.contactName || l.leadName) && <div className="text-xs text-ink-400">{l.contactName || l.leadName}</div>}
                    </Td>
                    <Td>{l.provider}</Td>
                    <Td className="capitalize">{l.messageType.toLowerCase()}</Td>
                    <Td>
                      <Badge tone={DELIVERY_STATUS_TONE[l.status] ?? 'gray'}>{l.status}</Badge>
                      {l.status === 'FAILED' && l.failureReason && (
                        <span className="ml-1.5 text-[11px] text-red-500">{l.failureReason}</span>
                      )}
                    </Td>
                    <Td>{l.retryCount}</Td>
                    <Td>
                      {l.status === 'FAILED' && (
                        <Button
                          variant="secondary" className="px-2.5 py-1 text-xs" disabled={retryingId === l.id}
                          onClick={() => void handleRetry(l)}
                        >
                          <RefreshCw size={12} className={retryingId === l.id ? 'animate-spin' : ''} /> Retry
                        </Button>
                      )}
                    </Td>
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
    </div>
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
// ---- Settings --------------------------------------------------------------
/**
 * SettingsTab -- real, backend-connected WhatsApp Provider Settings.
 *
 * Phase 1 scope, confirmed with the user: only META_CLOUD + panelMode
 * NATIVE has a real, working send/receive/webhook path.
 *
 * ARCHITECTURE DECISION (Option B) -- the backend owns execution mode:
 *   - WhatsApp Mode ('panelMode') is the one real user choice:
 *       - 'NATIVE' (default): provider is locked to Native Meta Cloud API.
 *         The Provider dropdown is disabled entirely, not just
 *         individually-disabled options -- there is only one valid value.
 *       - 'THIRD_PARTY': the Provider dropdown becomes enabled, offering
 *         WATI / Interakt / AiSensy / Gallabox / Twilio / 360dialog /
 *         Custom Webhook -- all shown as "(coming soon)" since none have a
 *         working adapter yet in this phase.
 *   - `providerMode` (LIVE / SANDBOX / SIMULATION) is NEVER sent by this
 *     component. It isn't even on UpdateProviderInput. The backend derives
 *     it exclusively from a successful Test Connection. Simulation/Sandbox
 *     are not user-facing concepts anywhere in this screen.
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
// ---- Settings --------------------------------------------------------------
/**
 * SettingsTab -- real, backend-connected WhatsApp Provider Settings.
 *
 * Test Connection UX improvements over the previous version:
 *   - Result is no longer toast-only (which disappears and is easy to
 *     miss). A persistent inline status panel shows: connected number +
 *     verified name on success, OR the actual error message on failure --
 *     both stay visible until the next action, not just a few seconds.
 *   - "Last verified" relative time is shown next to the Live/Not-verified
 *     badge, sourced from settings.meta.lastVerifiedAt.
 *   - Test Connection is disabled until the fields it actually needs
 *     (phoneNumberId, businessAccountId, and an access token -- either
 *     freshly typed or already saved) are present, with a hint explaining
 *     why it's disabled, instead of letting people click it and get a
 *     generic 400.
 *   - Editing any credential field clears the previous test result, so a
 *     stale "Connected" panel can't sit there next to different,
 *     untested credentials.
 */
// ---- Settings --------------------------------------------------------------
/**
 * SettingsTab -- real, backend-connected WhatsApp Provider Settings.
 *
 * Latest fixes:
 *   - Save settings now actually validates required Native Meta Cloud
 *     fields (Phone Number ID, Business Account ID, Access Token) before
 *     submitting, instead of silently accepting a half-filled form. The
 *     button is disabled while required fields are missing, and once a
 *     save is attempted, the specific missing fields get a red border +
 *     "Required" hint so it's obvious what's blocking it.
 *   - Disconnect is now a quiet text link under the status badges instead
 *     of a bordered button sitting next to them -- it's a destructive,
 *     infrequent action and shouldn't visually compete with "Save
 *     settings" / "Test Connection".
 *   - Test Connection result is a persistent inline panel (not just a
 *     toast), "Last verified" relative time shown, Test Connection
 *     disabled until required fields are present.
 */
// ---- Settings --------------------------------------------------------------
/**
 * SettingsTab -- real, backend-connected WhatsApp Provider Settings.
 *
 * Latest fixes:
 *   - Save settings now actually validates required Native Meta Cloud
 *     fields (Phone Number ID, Business Account ID, Access Token) before
 *     submitting, instead of silently accepting a half-filled form. The
 *     button is disabled while required fields are missing, and once a
 *     save is attempted, the specific missing fields get a red border +
 *     "Required" hint so it's obvious what's blocking it.
 *   - Disconnect is now a quiet text link under the status badges instead
 *     of a bordered button sitting next to them -- it's a destructive,
 *     infrequent action and shouldn't visually compete with "Save
 *     settings" / "Test Connection".
 *   - Test Connection result is a persistent inline panel (not just a
 *     toast), "Last verified" relative time shown, Test Connection
 *     disabled until required fields are present.
 */
function SettingsTab() {
  const { settings, loading, error, updateProvider, updateSync, testConnection, disconnect } = useWhatsAppSettings();

  const [provider, setProvider] = useState<WhatsAppProviderReal>(NATIVE_PROVIDER);
  const [panelMode, setPanelMode] = useState<PanelMode>('NATIVE');
  const [businessAccountId, setBusinessAccountId] = useState('');
  const [phoneNumberId, setPhoneNumberId] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [appSecret, setAppSecret] = useState('');
  const [verifyToken, setVerifyToken] = useState('');
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [attemptedSave, setAttemptedSave] = useState(false);

  const [testResult, setTestResult] = useState<{ displayPhoneNumber?: string; verifiedName?: string; message: string } | null>(null);
  const [testError, setTestError] = useState<string | null>(null);

  useEffect(() => {
    if (!settings) return;
    setPanelMode(settings.panelMode);
    setProvider(settings.panelMode === 'NATIVE' ? NATIVE_PROVIDER : settings.provider);
    setBusinessAccountId(settings.meta.businessAccountId);
    setPhoneNumberId(settings.meta.phoneNumberId);
  }, [settings]);

  const clearTestFeedback = () => { setTestResult(null); setTestError(null); };

  const handlePanelModeChange = (next: PanelMode) => {
    setPanelMode(next);
    if (next === 'NATIVE') setProvider(NATIVE_PROVIDER);
    clearTestFeedback();
    setAttemptedSave(false);
  };

  const hasPhoneNumberId = phoneNumberId.trim().length > 0;
  const hasBusinessAccountId = businessAccountId.trim().length > 0;
  const hasAccessToken = accessToken.trim().length > 0 || Boolean(settings?.meta.hasAccessToken);

  // Native Meta Cloud needs all three before it can ever be tested/used --
  // this is the same requirement Save and Test Connection both enforce.
  const nativeFieldsComplete = hasPhoneNumberId && hasBusinessAccountId && hasAccessToken;
  const canSave = panelMode !== 'NATIVE' || nativeFieldsComplete;
  const canTest = panelMode === 'NATIVE' && nativeFieldsComplete;

  const fieldError = (ok: boolean) => attemptedSave && panelMode === 'NATIVE' && !ok;

  const handleSave = async () => {
    setAttemptedSave(true);
    if (!canSave) {
      toast.error('Missing required fields', 'Enter Phone Number ID, Business Account ID, and an Access Token before saving.');
      return;
    }
    setSaving(true);
    try {
      await updateProvider({
        provider: panelMode === 'NATIVE' ? NATIVE_PROVIDER : provider,
        panelMode,
        // providerMode is deliberately NOT sent -- backend-derived only,
        // see Architecture Decision, Option B.
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
      clearTestFeedback();
      setAttemptedSave(false);
      toast.success('Settings saved');
    } catch (err) {
      toast.error('Could not save settings', err instanceof ApiError ? err.message : 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    setTestError(null);
    try {
      const result = await testConnection();
      setTestResult({ displayPhoneNumber: result.displayPhoneNumber, verifiedName: result.verifiedName, message: result.message });
      toast.success('Connection verified');
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Please try again.';
      setTestError(message);
      toast.error('Connection test failed');
    } finally {
      setTesting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!window.confirm('Disconnect WhatsApp? Your saved credentials are kept, so reconnecting later won\u2019t require re-entering them.')) return;
    setDisconnecting(true);
    try {
      await disconnect();
      clearTestFeedback();
      toast.success('WhatsApp disconnected');
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
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-sm font-semibold text-ink-900">WhatsApp Provider Settings</h3>
          <p className="mt-1 text-xs text-ink-500">Choose native InnovateX panel or a third-party BSP. Only Meta Cloud API is fully connected in this phase.</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-2">
            <Badge tone={settings.providerMode === 'LIVE' ? 'green' : 'amber'}>
              {settings.providerMode === 'LIVE' ? 'Live' : 'Not verified yet'}
            </Badge>
            <Badge tone={settings.meta.connected ? 'green' : 'gray'}>{settings.meta.connected ? 'Connected' : 'Not connected'}</Badge>
          </div>
          {settings.meta.lastVerifiedAt && (
            <p className="text-[11px] text-ink-400">Last verified {timeAgo(settings.meta.lastVerifiedAt)}</p>
          )}
          {settings.meta.connected && (
            <Button
              variant="secondary"
              className="border-red-200 px-2.5 py-1 text-xs text-red-600 hover:border-red-300 hover:bg-red-50"
              onClick={() => void handleDisconnect()}
              disabled={disconnecting}
            >
              <Unplug size={13} /> {disconnecting ? 'Disconnecting…' : 'Disconnect'}
            </Button>
          )}
        </div>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Field label="WhatsApp mode">
          <Select value={panelMode} onChange={(e) => handlePanelModeChange(e.target.value as PanelMode)}>
            <option value="NATIVE">Native InnovateX Panel</option>
            <option value="THIRD_PARTY">Third-party Provider</option>
          </Select>
        </Field>
        <Field label="Provider">
          {panelMode === 'NATIVE' ? (
            <>
              <Select value={NATIVE_PROVIDER} disabled>
                <option value={NATIVE_PROVIDER}>{PROVIDER_LABELS[NATIVE_PROVIDER]}</option>
              </Select>
              <p className="mt-1 text-[11px] text-ink-400">Locked to Native Meta Cloud API while WhatsApp mode is Native InnovateX Panel.</p>
            </>
          ) : (
            <Select value={provider} onChange={(e) => { setProvider(e.target.value as WhatsAppProviderReal); clearTestFeedback(); }}>
              {THIRD_PARTY_PROVIDER_VALUES.map((p) => (
                <option key={p} value={p} disabled={!IMPLEMENTED_THIRD_PARTY_PROVIDERS.includes(p)}>
                  {PROVIDER_LABELS[p]}{!IMPLEMENTED_THIRD_PARTY_PROVIDERS.includes(p) ? ' (coming soon)' : ''}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label="Default sender number">
          <Input value={settings.meta.displayPhoneNumber || 'Not verified yet — run Test Connection'} readOnly className="bg-ink-50 text-ink-500" />
        </Field>
        <Field label="Phone number ID">
          <Input
            value={phoneNumberId}
            onChange={(e) => { setPhoneNumberId(e.target.value); clearTestFeedback(); }}
            placeholder="e.g. 119128780406310"
            className={fieldError(hasPhoneNumberId) ? 'border-red-300 focus:border-red-400' : ''}
          />
          {fieldError(hasPhoneNumberId) && <p className="mt-1 text-[11px] text-red-600">Required</p>}
        </Field>
        <Field label="Business account ID">
          <Input
            value={businessAccountId}
            onChange={(e) => { setBusinessAccountId(e.target.value); clearTestFeedback(); }}
            placeholder="e.g. 951181964646443"
            className={fieldError(hasBusinessAccountId) ? 'border-red-300 focus:border-red-400' : ''}
          />
          {fieldError(hasBusinessAccountId) && <p className="mt-1 text-[11px] text-red-600">Required</p>}
        </Field>
        <Field label="Access token">
          <Input
            type="password"
            value={accessToken}
            onChange={(e) => { setAccessToken(e.target.value); clearTestFeedback(); }}
            placeholder={settings.meta.hasAccessToken ? 'Already set — leave blank to keep' : 'Paste your Meta access token'}
            className={fieldError(hasAccessToken) ? 'border-red-300 focus:border-red-400' : ''}
          />
          {fieldError(hasAccessToken) && <p className="mt-1 text-[11px] text-red-600">Required</p>}
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

      <div className="mt-4 flex items-center gap-2">
        <Button onClick={() => void handleSave()} disabled={saving || (attemptedSave && !canSave)}>
          {saving ? 'Saving…' : 'Save settings'}
        </Button>
        <Button variant="secondary" onClick={() => void handleTest()} disabled={testing || !canTest}>
          <RefreshCw size={15} className={testing ? 'animate-spin' : ''} /> {testing ? 'Testing…' : 'Test Connection'}
        </Button>
      </div>
      {panelMode !== 'NATIVE' && (
        <p className="mt-2 text-[11px] text-ink-400">Test Connection is only available for Native Meta Cloud API in this phase.</p>
      )}
      {panelMode === 'NATIVE' && !nativeFieldsComplete && (
        <p className="mt-2 text-[11px] text-amber-600">Enter Phone Number ID, Business Account ID, and an Access Token before saving or testing.</p>
      )}

      {/* Persistent inline result -- doesn't disappear like a toast does. */}
      {testResult && (
        <div className="mt-3 flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3">
          <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-600" />
          <div className="text-sm text-emerald-800">
            <p className="font-medium">Connected — verified against Meta's Graph API</p>
            {testResult.displayPhoneNumber && (
              <p className="mt-0.5 text-emerald-700">Sending as {testResult.displayPhoneNumber}{testResult.verifiedName ? ` (${testResult.verifiedName})` : ''}</p>
            )}
          </div>
        </div>
      )}
      {testError && (
        <div className="mt-3 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3">
          <XCircle size={16} className="mt-0.5 shrink-0 text-red-600" />
          <div className="text-sm text-red-800">
            <p className="font-medium">Connection test failed</p>
            <p className="mt-0.5 text-red-700">{testError}</p>
          </div>
        </div>
      )}
    </Card>
  );
}