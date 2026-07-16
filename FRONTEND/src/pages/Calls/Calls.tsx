import { useState } from 'react';
import { Plus, Sparkles, Phone, FileText, Copy } from 'lucide-react';
import { useStore } from '@/store/store';
import { useDb, userName } from '@/store/hooks';
import { PageHeader, Card, CardHeader, Button, Badge, StatusBadge, Modal, Field, Select, Textarea, Avatar, EmptyState } from '@/components/ui';
import { KpiCard } from '@/components/ui/KpiCard';
import { summarizeCall } from '@/services/aiService';
import { formatDate } from '@/utils/formatters';
import { toast } from '@/store/toastStore';
import type { CallOutcome, CallRecord } from '@/types';

const OUTCOMES: CallOutcome[] = ['Interested', 'Not Interested', 'Needs Follow-Up', 'Proposal Requested', 'Closed Won', 'Closed Lost', 'No Show'];

export function Calls() {
  const { db, tenantId } = useDb();
  const { createCall } = useStore();
  const calls = db.calls.filter((c) => c.tenant_id === tenantId).sort((a, b) => new Date(b.call_date).getTime() - new Date(a.call_date).getTime());
  const leads = db.leads.filter((l) => l.tenant_id === tenantId && !l.archived);

  const [show, setShow] = useState(false);
  const [detail, setDetail] = useState<CallRecord | null>(null);
  const [form, setForm] = useState({ lead_id: leads[0]?.id ?? '', transcript: '', outcome: 'Interested' as CallOutcome });
  const [aiResult, setAiResult] = useState<ReturnType<typeof summarizeCall> | null>(null);

  const lead = db.leads.find((l) => l.id === form.lead_id);
  const runAi = () => {
    if (!form.transcript.trim()) return toast.error('Add a transcript first');
    setAiResult(summarizeCall(form.transcript, lead));
    toast.success('AI summary generated');
  };
  const save = () => {
    if (!lead) return;
    const r = aiResult ?? summarizeCall(form.transcript || 'No transcript', lead);
    createCall({ lead_id: lead.id, transcript: form.transcript, outcome: form.outcome, summary: r.summary, objections: r.objections, next_steps: r.nextSteps, score: r.score, deal_id: db.deals.find((d) => d.lead_id === lead.id)?.id ?? null });
    setShow(false); setForm({ lead_id: leads[0]?.id ?? '', transcript: '', outcome: 'Interested' }); setAiResult(null);
  };

  return (
    <div>
      <PageHeader title="Call Intelligence" description="Log calls, generate AI summaries, extract objections & draft follow-ups." breadcrumb={['Revenue', 'Call Intelligence']}
        actions={<Button onClick={() => setShow(true)}><Plus size={16} /> Log Call</Button>} />

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard label="Total calls" value={calls.length} icon={<Phone size={18} />} accent="#6366f1" />
        <KpiCard label="Proposals requested" value={calls.filter((c) => c.outcome === 'Proposal Requested').length} icon={<FileText size={18} />} accent="#f59e0b" />
        <KpiCard label="Closed won" value={calls.filter((c) => c.outcome === 'Closed Won').length} icon={<Phone size={18} />} accent="#10b981" />
        <KpiCard label="Avg call score" value={calls.length ? (calls.reduce((s, c) => s + c.score, 0) / calls.length).toFixed(1) : '0'} icon={<Sparkles size={18} />} accent="#8b5cf6" />
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        {calls.map((c) => {
          const l = db.leads.find((x) => x.id === c.lead_id);
          return (
            <Card key={c.id} className="cursor-pointer p-4 transition hover:shadow-soft" >
              <div className="flex items-start justify-between" onClick={() => setDetail(c)}>
                <div className="flex items-center gap-2.5">
                  <Avatar name={l?.name ?? '?'} size={36} color="#06b6d4" />
                  <div><p className="font-semibold text-ink-900">{l?.name}</p><p className="text-xs text-ink-500">{formatDate(c.call_date)} · {c.duration_minutes}min · {userName(db, c.assigned_user_id)}</p></div>
                </div>
                <div className="flex flex-col items-end gap-1"><StatusBadge status={c.outcome} /><Badge tone="violet">Score {c.score}/10</Badge></div>
              </div>
              <p className="mt-3 line-clamp-2 text-sm text-ink-600">{c.summary}</p>
              <div className="mt-2 flex flex-wrap gap-1">{c.objections.slice(0, 3).map((o, i) => <Badge key={i} tone="amber">{o}</Badge>)}</div>
            </Card>
          );
        })}
        {calls.length === 0 && <EmptyState title="No calls logged" />}
      </div>

      {show && (
        <Modal open onClose={() => setShow(false)} title="Log Call & Generate AI Summary" size="lg"
          footer={<><Button variant="secondary" onClick={() => setShow(false)}>Cancel</Button><Button onClick={save}>Save call</Button></>}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Lead"><Select value={form.lead_id} onChange={(e) => setForm({ ...form, lead_id: e.target.value })}>{leads.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}</Select></Field>
              <Field label="Outcome"><Select value={form.outcome} onChange={(e) => setForm({ ...form, outcome: e.target.value as CallOutcome })}>{OUTCOMES.map((o) => <option key={o}>{o}</option>)}</Select></Field>
            </div>
            <Field label="Transcript"><Textarea rows={5} value={form.transcript} onChange={(e) => setForm({ ...form, transcript: e.target.value })} placeholder="Paste or type the call transcript…" /></Field>
            <Button variant="secondary" onClick={runAi}><Sparkles size={15} /> Generate AI summary</Button>
            {aiResult && (
              <div className="space-y-3 rounded-xl border border-brand-200 bg-brand-50/50 p-4">
                <div><p className="label">Summary</p><p className="text-sm text-ink-700">{aiResult.summary}</p></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><p className="label">Objections</p><ul className="text-sm text-ink-700">{aiResult.objections.map((o, i) => <li key={i}>• {o}</li>)}</ul></div>
                  <div><p className="label">Next steps</p><ul className="text-sm text-ink-700">{aiResult.nextSteps.map((o, i) => <li key={i}>• {o}</li>)}</ul></div>
                </div>
                <div><p className="label">Follow-up draft</p><p className="rounded-lg bg-white p-2.5 text-sm text-ink-700">{aiResult.followUpDraft}</p></div>
              </div>
            )}
          </div>
        </Modal>
      )}

      {detail && (
        <Modal open onClose={() => setDetail(null)} title="Call Detail" size="lg">
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <MiniStat label="Outcome" value={detail.outcome} />
              <MiniStat label="Score" value={`${detail.score}/10`} />
              <MiniStat label="Duration" value={`${detail.duration_minutes}min`} />
            </div>
            <div><p className="label">AI Summary</p><p className="text-sm text-ink-700">{detail.summary}</p></div>
            <div className="grid grid-cols-2 gap-3">
              <div><p className="label">Objections</p>{detail.objections.map((o, i) => <Badge key={i} tone="amber" className="mb-1 mr-1">{o}</Badge>)}</div>
              <div><p className="label">Next steps</p><ul className="text-sm text-ink-700">{detail.next_steps.map((o, i) => <li key={i}>• {o}</li>)}</ul></div>
            </div>
            <div><p className="label">Transcript</p><p className="max-h-40 overflow-y-auto whitespace-pre-line rounded-lg bg-ink-50 p-3 text-sm text-ink-600">{detail.transcript}</p></div>
            <Button variant="secondary" onClick={() => { navigator.clipboard?.writeText(summarizeCall(detail.transcript, db.leads.find((l) => l.id === detail.lead_id)).proposalOutline); toast.success('Proposal outline copied'); }}><Copy size={14} /> Copy proposal outline</Button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg border border-ink-100 p-3 text-center"><p className="text-[11px] text-ink-400">{label}</p><p className="text-sm font-semibold text-ink-900">{value}</p></div>;
}
