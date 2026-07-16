import { useState } from 'react';
import { Plus, UserCog } from 'lucide-react';
import { useStore } from '@/store/store';
import { useDb } from '@/store/hooks';
import { PageHeader, Card, CardHeader, Button, Badge, Table, Th, Td, Tr, Modal, Field, Input, Select, Avatar } from '@/components/ui';
import { KpiCard } from '@/components/ui/KpiCard';
import { timeAgo } from '@/utils/formatters';
import { toast } from '@/store/toastStore';
import type { UserRole } from '@/types';

const ROLES: UserRole[] = ['Tenant Owner', 'Tenant Admin', 'Sales User', 'Read-Only User'];

export function Team() {
  const { db, tenantId } = useDb();
  const { createUser, updateUser } = useStore();
  const users = db.users.filter((u) => u.tenant_id === tenantId);

  const [show, setShow] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', role: 'Sales User' as UserRole, title: '' });

  const create = () => {
    if (!form.name.trim() || !form.email.trim()) return toast.error('Name and email required');
    createUser({ ...form, avatar_color: ['#6366f1', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b'][users.length % 5] });
    setShow(false); setForm({ name: '', email: '', role: 'Sales User', title: '' });
  };

  return (
    <div>
      <PageHeader title="Team" description="Manage users, roles & lead assignments." breadcrumb={['Admin', 'Team']}
        actions={<Button onClick={() => setShow(true)}><Plus size={16} /> Add User</Button>} />

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard label="Team members" value={users.length} icon={<UserCog size={18} />} accent="#6366f1" />
        <KpiCard label="Active" value={users.filter((u) => u.status === 'active').length} icon={<UserCog size={18} />} accent="#10b981" />
        <KpiCard label="Sales users" value={users.filter((u) => u.role === 'Sales User').length} icon={<UserCog size={18} />} accent="#8b5cf6" />
        <KpiCard label="Admins" value={users.filter((u) => u.role.includes('Admin') || u.role.includes('Owner')).length} icon={<UserCog size={18} />} accent="#f59e0b" />
      </div>

      <Card>
        <CardHeader title="Team Members" />
        <Table>
          <thead><tr><Th>User</Th><Th>Role</Th><Th>Status</Th><Th>Assigned leads</Th><Th>Last active</Th><Th>Actions</Th></tr></thead>
          <tbody>
            {users.map((u) => {
              const leadCount = db.leads.filter((l) => l.assigned_user_id === u.id).length;
              return (
                <Tr key={u.id}>
                  <Td>
                    <div className="flex items-center gap-2.5"><Avatar name={u.name} color={u.avatar_color} size={34} /><div><p className="font-semibold text-ink-900">{u.name}</p><p className="text-xs text-ink-500">{u.email}</p></div></div>
                  </Td>
                  <Td>
                    <Select value={u.role} onChange={(e) => updateUser(u.id, { role: e.target.value as UserRole })} className="w-auto py-1 text-xs" disabled={u.role === 'Super Admin'}>
                      {u.role === 'Super Admin' ? <option>Super Admin</option> : ROLES.map((r) => <option key={r}>{r}</option>)}
                    </Select>
                  </Td>
                  <Td><Badge tone={u.status === 'active' ? 'green' : 'gray'}>{u.status}</Badge></Td>
                  <Td>{leadCount}</Td>
                  <Td className="text-ink-500">{timeAgo(u.last_active_at)}</Td>
                  <Td><Button variant="secondary" className="px-2.5 py-1 text-xs" onClick={() => updateUser(u.id, { status: u.status === 'active' ? 'inactive' : 'active' })}>{u.status === 'active' ? 'Deactivate' : 'Activate'}</Button></Td>
                </Tr>
              );
            })}
          </tbody>
        </Table>
      </Card>

      {show && (
        <Modal open onClose={() => setShow(false)} title="Add Team Member" footer={<><Button variant="secondary" onClick={() => setShow(false)}>Cancel</Button><Button onClick={create}>Add user</Button></>}>
          <div className="space-y-4">
            <Field label="Full name"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
            <Field label="Email"><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Role"><Select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as UserRole })}>{ROLES.map((r) => <option key={r}>{r}</option>)}</Select></Field>
              <Field label="Title"><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Account Executive" /></Field>
            </div>
            <p className="text-xs text-ink-400">Default password is <code className="rounded bg-ink-100 px-1">password123</code> (demo only).</p>
          </div>
        </Modal>
      )}
    </div>
  );
}
