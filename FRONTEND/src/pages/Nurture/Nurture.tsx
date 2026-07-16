import { useState } from 'react';
import { Plus, Play, Pause, MessageCircle, Mail, Smartphone, CheckSquare, UserPlus } from 'lucide-react';
import { useStore } from '@/store/store';
import { useDb } from '@/store/hooks';
import { PageHeader, Card, CardHeader, Button, Badge, Modal, Field, Input, Select, Textarea, EmptyState } from '@/components/ui';
import { KpiCard } from '@/components/ui/KpiCard';
import { toast } from '@/store/toastStore';
import type { NurtureChannel, NurtureSequence } from '@/types';

const channelIcon: Record<NurtureChannel, typeof Mail> = { WhatsApp: MessageCircle, Email: Mail, SMS: Smartphone, 'Manual task': CheckSquare };

export function Nurture() {
  const { db, tenantId } = useDb();
  const { toggleSequence, createSequence, assignSequence } = useStore();
  const seqs = db.nurtureSequences.filter((s) => s.tenant_id === tenantId);
  const leads = db.leads.filter((l) => l.tenant_id === tenantId && !l.archived);
  const enrollments = db.nurtureEnrollments.filter((e) => e.tenant_id === tenantId);

  const [showCreate, setShowCreate] = useState(false);
  const [assignTo, setAssignTo] = useState<NurtureSequence | null>(null);
  const [selLead, setSelLead] = useState(leads[0]?.id ?? '');
  const [form, setForm] = useState({ name: '', description: '', trigger: 'Manual' });

  const create = () => {
    if (!form.name.trim()) return toast.error('Name required');
    createSequence({ ...form, steps: [
      { id: 's1', order: 1, channel: 'WhatsApp', delay_days: 0, message: 'Intro message' },
      { id: 's2', order: 2, channel: 'Email', delay_days: 2, message: 'Value follow-up' },
      { id: 's3', order: 3, channel: 'Manual task', delay_days: 4, message: 'Call the lead' },
    ] });
    setShowCreate(false); setForm({ name: '', description: '', trigger: 'Manual' });
  };

  return (
    <div>
      <PageHeader title="Nurture Engine" description="Automated multi-channel sequences across WhatsApp, email, SMS & tasks." breadcrumb={['Revenue', 'Nurture']}
        actions={<Button onClick={() => setShowCreate(true)}><Plus size={16} /> New Sequence</Button>} />

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard label="Active sequences" value={seqs.filter((s) => s.status === 'active').length} icon={<Play size={18} />} accent="#10b981" />
        <KpiCard label="Total enrolled" value={seqs.reduce((s, x) => s + x.enrolled_count, 0)} icon={<UserPlus size={18} />} accent="#6366f1" />
        <KpiCard label="Live enrollments" value={enrollments.length} icon={<UserPlus size={18} />} accent="#8b5cf6" />
        <KpiCard label="Sequences" value={seqs.length} icon={<MessageCircle size={18} />} accent="#06b6d4" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {seqs.map((s) => (
          <Card key={s.id} className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold text-ink-900">{s.name}</p>
                <p className="mt-0.5 text-sm text-ink-500">{s.description}</p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  <Badge tone="blue">Trigger: {s.trigger}</Badge>
                  <Badge tone="gray">{s.enrolled_count} enrolled</Badge>
                  <Badge tone={s.status === 'active' ? 'green' : s.status === 'paused' ? 'amber' : 'gray'}>{s.status}</Badge>
                </div>
              </div>
              <Button variant="secondary" className="px-2.5 py-1.5 text-xs" onClick={() => toggleSequence(s.id)}>
                {s.status === 'active' ? <><Pause size={13} /> Pause</> : <><Play size={13} /> Activate</>}
              </Button>
            </div>
            <div className="mt-4 space-y-2">
              {s.steps.map((step) => {
                const Icon = channelIcon[step.channel];
                return (
                  <div key={step.id} className="flex items-center gap-3 rounded-lg border border-ink-100 px-3 py-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-50 text-brand-600"><Icon size={14} /></span>
                    <div className="flex-1"><p className="text-sm font-medium text-ink-800">Step {step.order} · {step.channel}</p><p className="truncate text-xs text-ink-500">{step.message}</p></div>
                    <Badge tone="gray">Day {step.delay_days}</Badge>
                  </div>
                );
              })}
            </div>
            <Button variant="secondary" className="mt-3 w-full text-xs" onClick={() => setAssignTo(s)}><UserPlus size={14} /> Assign lead to sequence</Button>
          </Card>
        ))}
        {seqs.length === 0 && <EmptyState title="No sequences yet" />}
      </div>

      {showCreate && (
        <Modal open onClose={() => setShowCreate(false)} title="New Nurture Sequence" footer={<><Button variant="secondary" onClick={() => setShowCreate(false)}>Cancel</Button><Button onClick={create}>Create sequence</Button></>}>
          <div className="space-y-4">
            <Field label="Sequence name"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. VIP Onboarding" /></Field>
            <Field label="Description"><Textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
            <Field label="Trigger"><Select value={form.trigger} onChange={(e) => setForm({ ...form, trigger: e.target.value })}>{['Manual', 'Lead score above 7', 'Tag: webinar', 'Ghosted for 14 days', 'Booking status: No Show', 'Payment pending', 'Stage: Proposal Sent'].map((t) => <option key={t}>{t}</option>)}</Select></Field>
            <p className="text-xs text-ink-400">A 3-step starter sequence (WhatsApp → Email → Task) will be created. You can edit steps after.</p>
          </div>
        </Modal>
      )}

      {assignTo && (
        <Modal open onClose={() => setAssignTo(null)} title={`Assign to "${assignTo.name}"`} footer={<><Button variant="secondary" onClick={() => setAssignTo(null)}>Cancel</Button><Button onClick={() => { assignSequence(assignTo.id, selLead); setAssignTo(null); }}>Enroll lead</Button></>}>
          <Field label="Select lead"><Select value={selLead} onChange={(e) => setSelLead(e.target.value)}>{leads.map((l) => <option key={l.id} value={l.id}>{l.name} — {l.status}</option>)}</Select></Field>
        </Modal>
      )}
    </div>
  );
}
