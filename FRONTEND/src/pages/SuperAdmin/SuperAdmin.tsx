import { useState } from 'react';
import { Plus, ShieldCheck, Building2, Users, Activity, Server } from 'lucide-react';
import { useStore } from '@/store/store';
import { PageHeader, Card, CardHeader, Button, Badge, StatusBadge, Tabs, Table, Th, Td, Tr, Modal, Field, Input, Select } from '@/components/ui';
import { KpiCard } from '@/components/ui/KpiCard';
import { formatCurrency, timeAgo, formatDate } from '@/utils/formatters';
import { toast } from '@/store/toastStore';
import type { Tenant } from '@/types';

const TABS = [
  { id: 'tenants', label: 'Tenants' }, { id: 'users', label: 'All Users' },
  { id: 'health', label: 'Integration Health' }, { id: 'activity', label: 'Global Activity' },
  { id: 'templates', label: 'Global Templates' },
];

export function SuperAdmin() {
  const db = useStore((s) => s.db);
  const { createTenant, updateTenant } = useStore();
  const [tab, setTab] = useState('tenants');
  const [show, setShow] = useState(false);
  const [edit, setEdit] = useState<Tenant | null>(null);
  const [form, setForm] = useState({ name: '', domain: '', plan: 'Starter' as Tenant['plan'], industry: 'SaaS', region: 'North America' });

  const create = () => {
    if (!form.name.trim()) return toast.error('Name required');
    createTenant(form);
    setShow(false); setForm({ name: '', domain: '', plan: 'Starter', industry: 'SaaS', region: 'North America' });
  };

  const totalMrr = db.tenants.reduce((s, t) => s + t.mrr, 0);

  return (
    <div>
      <PageHeader title="Super Admin Panel" description="Platform-level control across all tenants." breadcrumb={['Admin', 'Super Admin']}
        actions={<Button onClick={() => setShow(true)}><Plus size={16} /> New Tenant</Button>} />

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard label="Tenants" value={db.tenants.length} icon={<Building2 size={18} />} accent="#6366f1" />
        <KpiCard label="Total users" value={db.users.length} icon={<Users size={18} />} accent="#8b5cf6" />
        <KpiCard label="Platform MRR" value={formatCurrency(totalMrr)} icon={<Server size={18} />} accent="#10b981" />
        <KpiCard label="Active tenants" value={db.tenants.filter((t) => t.status === 'active').length} icon={<ShieldCheck size={18} />} accent="#f59e0b" />
      </div>

      <div className="mb-4"><Tabs tabs={TABS} active={tab} onChange={setTab} /></div>

      {tab === 'tenants' && (
        <Card>
          <CardHeader title="All Tenants" />
          <Table>
            <thead><tr><Th>Tenant</Th><Th>Plan</Th><Th>Status</Th><Th>Industry</Th><Th>Region</Th><Th>Seats</Th><Th>MRR</Th><Th>Actions</Th></tr></thead>
            <tbody>
              {db.tenants.map((t) => (
                <Tr key={t.id}>
                  <Td><div className="flex items-center gap-2"><span className="flex h-7 w-7 items-center justify-center rounded-md text-xs font-bold text-white" style={{ background: t.logo_color }}>{t.name[0]}</span><span className="font-medium">{t.name}</span></div></Td>
                  <Td><Badge tone="violet">{t.plan}</Badge></Td>
                  <Td><StatusBadge status={t.status} /></Td>
                  <Td>{t.industry}</Td><Td>{t.region}</Td><Td>{t.seats}</Td>
                  <Td className="font-medium">{formatCurrency(t.mrr)}</Td>
                  <Td>
                    <div className="flex gap-1.5">
                      <Button variant="secondary" className="px-2.5 py-1 text-xs" onClick={() => setEdit(t)}>Edit</Button>
                      <Button variant="ghost" className="px-2.5 py-1 text-xs text-amber-600" onClick={() => updateTenant(t.id, { status: t.status === 'suspended' ? 'active' : 'suspended' })}>{t.status === 'suspended' ? 'Reactivate' : 'Suspend'}</Button>
                    </div>
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        </Card>
      )}

      {tab === 'users' && (
        <Card>
          <CardHeader title="All Platform Users" />
          <Table>
            <thead><tr><Th>User</Th><Th>Email</Th><Th>Role</Th><Th>Tenant</Th><Th>Status</Th></tr></thead>
            <tbody>
              {db.users.map((u) => (
                <Tr key={u.id}><Td className="font-medium">{u.name}</Td><Td>{u.email}</Td><Td><Badge tone="blue">{u.role}</Badge></Td><Td>{db.tenants.find((t) => t.id === u.tenant_id)?.name ?? '—'}</Td><Td><Badge tone={u.status === 'active' ? 'green' : 'gray'}>{u.status}</Badge></Td></Tr>
              ))}
            </tbody>
          </Table>
        </Card>
      )}

      {tab === 'health' && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {db.integrations.filter((i) => i.tenant_id === db.tenants[0].id).map((i) => (
            <Card key={i.id} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2"><span className="flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold text-white" style={{ background: i.logo_color }}>{i.name[0]}</span><span className="text-sm font-semibold">{i.name}</span></div>
                <Badge tone={i.status === 'connected' ? 'green' : i.status === 'simulation' ? 'amber' : 'gray'}>{i.status}</Badge>
              </div>
              <p className="mt-2 text-xs text-ink-400">Uptime: {i.status === 'disconnected' ? '—' : '99.9%'} · Last sync {timeAgo(i.last_sync)}</p>
            </Card>
          ))}
        </div>
      )}

      {tab === 'activity' && (
        <Card>
          <CardHeader title="Global Activity Log" />
          <Table>
            <thead><tr><Th>Actor</Th><Th>Action</Th><Th>Entity</Th><Th>Time</Th></tr></thead>
            <tbody>
              {db.auditLogs.map((a) => (
                <Tr key={a.id}><Td className="font-medium">{db.users.find((u) => u.id === a.actor_id)?.name ?? '—'}</Td><Td>{a.action}</Td><Td><Badge tone="gray">{a.entity_type}</Badge></Td><Td className="text-ink-500">{timeAgo(a.created_at)}</Td></Tr>
              ))}
            </tbody>
          </Table>
        </Card>
      )}

      {tab === 'templates' && (
        <Card>
          <CardHeader title="Global Templates" subtitle="Available across all tenants" />
          <Table>
            <thead><tr><Th>Name</Th><Th>Type</Th><Th>Scope</Th><Th>Version</Th></tr></thead>
            <tbody>
              {db.genericTemplates.filter((t) => t.scope === 'global').map((t) => (
                <Tr key={t.id}><Td className="font-medium">{t.name}</Td><Td>{t.type}</Td><Td><Badge tone="violet">global</Badge></Td><Td>v{t.version}</Td></Tr>
              ))}
            </tbody>
          </Table>
        </Card>
      )}

      {(show || edit) && (
        <Modal open onClose={() => { setShow(false); setEdit(null); }} title={edit ? `Edit ${edit.name}` : 'Create Tenant'}
          footer={<><Button variant="secondary" onClick={() => { setShow(false); setEdit(null); }}>Cancel</Button><Button onClick={() => { if (edit) { updateTenant(edit.id, edit); setEdit(null); } else create(); }}>{edit ? 'Save' : 'Create tenant'}</Button></>}>
          {edit ? (
            <div className="space-y-4">
              <Field label="Name"><Input value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} /></Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Plan"><Select value={edit.plan} onChange={(e) => setEdit({ ...edit, plan: e.target.value as Tenant['plan'] })}>{['Starter', 'Growth', 'Scale', 'Enterprise'].map((p) => <option key={p}>{p}</option>)}</Select></Field>
                <Field label="Seats"><Input type="number" value={edit.seats} onChange={(e) => setEdit({ ...edit, seats: Number(e.target.value) })} /></Field>
              </div>
              <Field label="MRR (USD)"><Input type="number" value={edit.mrr} onChange={(e) => setEdit({ ...edit, mrr: Number(e.target.value) })} /></Field>
            </div>
          ) : (
            <div className="space-y-4">
              <Field label="Tenant name"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
              <Field label="Domain"><Input value={form.domain} onChange={(e) => setForm({ ...form, domain: e.target.value })} placeholder="acme.com" /></Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Plan"><Select value={form.plan} onChange={(e) => setForm({ ...form, plan: e.target.value as Tenant['plan'] })}>{['Starter', 'Growth', 'Scale', 'Enterprise'].map((p) => <option key={p}>{p}</option>)}</Select></Field>
                <Field label="Region"><Select value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })}>{['North America', 'Europe', 'Asia Pacific', 'Latin America', 'Middle East'].map((r) => <option key={r}>{r}</option>)}</Select></Field>
              </div>
              <Field label="Industry"><Input value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })} /></Field>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}
