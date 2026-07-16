import { useState } from 'react';
import { Plus, Zap, Play, Activity } from 'lucide-react';
import { useStore } from '@/store/store';
import { useDb } from '@/store/hooks';
import { PageHeader, Card, CardHeader, Button, Badge, Toggle, Modal, Field, Input, Select, EmptyState } from '@/components/ui';
import { KpiCard } from '@/components/ui/KpiCard';
import { timeAgo } from '@/utils/formatters';
import { toast } from '@/store/toastStore';
import type { Automation } from '@/types';

const TRIGGERS = ['New lead created', 'Lead score above 7', 'WhatsApp reply received', 'Booking created', 'Payment completed', 'Lead ghosted for 14 days', 'Deal moved to proposal sent', 'Template approved', 'Campaign completed'];
const ACTIONS = ['Assign user', 'Send WhatsApp template', 'Send nurture step', 'Create task', 'Update lead status', 'Create notification', 'Add timeline event'];

export function Automations() {
  const { db, tenantId } = useDb();
  const { toggleAutomation, simulateAutomation, createAutomation } = useStore();
  const autos = db.automations.filter((a) => a.tenant_id === tenantId);

  const [show, setShow] = useState(false);
  const [detail, setDetail] = useState<Automation | null>(null);
  const [form, setForm] = useState({ name: '', trigger: TRIGGERS[0], condition: 'always', action: ACTIONS[0] });

  const create = () => {
    if (!form.name.trim()) return toast.error('Name required');
    createAutomation(form);
    setShow(false); setForm({ name: '', trigger: TRIGGERS[0], condition: 'always', action: ACTIONS[0] });
  };

  return (
    <div>
      <PageHeader title="Automations" description="Rule-based workflows: when a trigger fires, run an action automatically." breadcrumb={['Growth', 'Automations']}
        actions={<Button onClick={() => setShow(true)}><Plus size={16} /> New Automation</Button>} />

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard label="Automations" value={autos.length} icon={<Zap size={18} />} accent="#6366f1" />
        <KpiCard label="Active" value={autos.filter((a) => a.status === 'active').length} icon={<Play size={18} />} accent="#10b981" />
        <KpiCard label="Total runs" value={autos.reduce((s, a) => s + a.run_count, 0)} icon={<Activity size={18} />} accent="#8b5cf6" />
        <KpiCard label="Inactive" value={autos.filter((a) => a.status === 'inactive').length} icon={<Zap size={18} />} accent="#f59e0b" />
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        {autos.map((a) => (
          <Card key={a.id} className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600"><Zap size={18} /></span>
                <div>
                  <p className="font-semibold text-ink-900">{a.name}</p>
                  <p className="text-xs text-ink-500">Last run {timeAgo(a.last_run)} · {a.run_count} runs</p>
                </div>
              </div>
              <Toggle checked={a.status === 'active'} onChange={() => toggleAutomation(a.id)} />
            </div>
            <div className="mt-3 space-y-1.5 rounded-lg bg-ink-50 p-3 text-sm">
              <p><span className="font-semibold text-ink-500">WHEN</span> {a.trigger}</p>
              <p><span className="font-semibold text-ink-500">IF</span> {a.condition}</p>
              <p><span className="font-semibold text-ink-500">THEN</span> {a.action}</p>
            </div>
            <div className="mt-3 flex gap-2">
              <Button variant="secondary" className="px-3 py-1.5 text-xs" onClick={() => simulateAutomation(a.id)}><Play size={13} /> Simulate run</Button>
              <Button variant="ghost" className="px-3 py-1.5 text-xs" onClick={() => setDetail(a)}>View logs</Button>
            </div>
          </Card>
        ))}
        {autos.length === 0 && <EmptyState title="No automations yet" />}
      </div>

      {show && (
        <Modal open onClose={() => setShow(false)} title="New Automation" footer={<><Button variant="secondary" onClick={() => setShow(false)}>Cancel</Button><Button onClick={create}>Create</Button></>}>
          <div className="space-y-4">
            <Field label="Name"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Auto-assign hot leads" /></Field>
            <Field label="Trigger (WHEN)"><Select value={form.trigger} onChange={(e) => setForm({ ...form, trigger: e.target.value })}>{TRIGGERS.map((t) => <option key={t}>{t}</option>)}</Select></Field>
            <Field label="Condition (IF)"><Input value={form.condition} onChange={(e) => setForm({ ...form, condition: e.target.value })} placeholder="e.g. source = Meta Ads" /></Field>
            <Field label="Action (THEN)"><Select value={form.action} onChange={(e) => setForm({ ...form, action: e.target.value })}>{ACTIONS.map((a) => <option key={a}>{a}</option>)}</Select></Field>
          </div>
        </Modal>
      )}

      {detail && (
        <Modal open onClose={() => setDetail(null)} title={`Logs — ${detail.name}`}>
          <div className="space-y-2">
            {detail.logs.length === 0 && <p className="text-sm text-ink-400">No runs logged yet.</p>}
            {detail.logs.map((l, i) => (
              <div key={i} className="flex items-center justify-between rounded-lg border border-ink-100 px-3 py-2 text-sm">
                <span className="text-ink-700">{l.result}</span>
                <Badge tone="gray">{timeAgo(l.at)}</Badge>
              </div>
            ))}
          </div>
        </Modal>
      )}
    </div>
  );
}
