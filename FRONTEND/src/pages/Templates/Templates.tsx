import { useState } from 'react';
import { Plus, Copy, Trash2, FileText, Globe, Building2 } from 'lucide-react';
import { useStore } from '@/store/store';
import { useDb } from '@/store/hooks';
import { PageHeader, Card, Button, Badge, Tabs, Modal, Field, Input, Select, Textarea, EmptyState } from '@/components/ui';
import { toast } from '@/store/toastStore';
import type { GenericTemplate } from '@/types';

const TYPES = ['Email', 'Qualification script', 'Follow-up message', 'Proposal outline', 'Call summary format', 'Weekly report format', 'WhatsApp'];

export function Templates() {
  const { db, tenantId } = useDb();
  const { createGenericTemplate, deleteGenericTemplate } = useStore();
  const templates = db.genericTemplates.filter((t) => t.tenant_id === tenantId);

  const [filter, setFilter] = useState('all');
  const [show, setShow] = useState(false);
  const [edit, setEdit] = useState<GenericTemplate | null>(null);
  const [form, setForm] = useState({ name: '', type: 'Email', content: '', scope: 'tenant' as 'tenant' | 'global' });

  const types = ['all', ...Array.from(new Set(templates.map((t) => t.type)))];
  const filtered = filter === 'all' ? templates : templates.filter((t) => t.type === filter);

  const save = () => {
    if (!form.name.trim()) return toast.error('Name required');
    createGenericTemplate(form);
    setShow(false); setForm({ name: '', type: 'Email', content: '', scope: 'tenant' });
  };

  return (
    <div>
      <PageHeader title="Templates" description="Reusable content for email, scripts, proposals, summaries & reports." breadcrumb={['Growth', 'Templates']}
        actions={<Button onClick={() => setShow(true)}><Plus size={16} /> New Template</Button>} />

      <div className="mb-4"><Tabs tabs={types.map((t) => ({ id: t, label: t === 'all' ? 'All' : t }))} active={filter} onChange={setFilter} /></div>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((t) => (
          <Card key={t.id} className="flex flex-col p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600"><FileText size={15} /></span><p className="font-semibold text-ink-900">{t.name}</p></div>
              <Badge tone={t.scope === 'global' ? 'violet' : 'gray'}>{t.scope === 'global' ? <Globe size={11} /> : <Building2 size={11} />} {t.scope}</Badge>
            </div>
            <Badge tone="blue" className="mt-2 w-fit">{t.type}</Badge>
            <p className="mt-2 line-clamp-3 flex-1 rounded-lg bg-ink-50 p-2.5 text-sm text-ink-600">{t.content}</p>
            <div className="mt-3 flex gap-1.5">
              <Button variant="secondary" className="px-2.5 py-1 text-xs" onClick={() => setEdit(t)}>View</Button>
              <Button variant="ghost" className="px-2.5 py-1 text-xs" onClick={() => createGenericTemplate({ ...t, name: t.name + ' (copy)' })}><Copy size={12} /> Duplicate</Button>
              <Button variant="ghost" className="ml-auto px-2 py-1 text-xs text-red-600" onClick={() => deleteGenericTemplate(t.id)}><Trash2 size={13} /></Button>
            </div>
          </Card>
        ))}
        {filtered.length === 0 && <div className="lg:col-span-3"><EmptyState title="No templates" action={<Button onClick={() => setShow(true)}><Plus size={16} /> New Template</Button>} /></div>}
      </div>

      {(show || edit) && (
        <Modal open onClose={() => { setShow(false); setEdit(null); }} title={edit ? edit.name : 'New Template'} size="lg"
          footer={edit ? <Button onClick={() => setEdit(null)}>Close</Button> : <><Button variant="secondary" onClick={() => setShow(false)}>Cancel</Button><Button onClick={save}>Create</Button></>}>
          {edit ? (
            <div className="space-y-3">
              <div className="flex gap-2"><Badge tone="blue">{edit.type}</Badge><Badge tone="gray">v{edit.version}</Badge><Badge tone={edit.scope === 'global' ? 'violet' : 'gray'}>{edit.scope}</Badge></div>
              <p className="whitespace-pre-line rounded-lg bg-ink-50 p-4 text-sm text-ink-700">{edit.content}</p>
              <Button variant="secondary" onClick={() => { navigator.clipboard?.writeText(edit.content); toast.success('Copied'); }}><Copy size={14} /> Copy content</Button>
            </div>
          ) : (
            <div className="space-y-4">
              <Field label="Name"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Type"><Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>{TYPES.map((t) => <option key={t}>{t}</option>)}</Select></Field>
                <Field label="Scope"><Select value={form.scope} onChange={(e) => setForm({ ...form, scope: e.target.value as 'tenant' | 'global' })}><option value="tenant">Tenant</option><option value="global">Global</option></Select></Field>
              </div>
              <Field label="Content" hint="Use {{variable}} placeholders"><Textarea rows={5} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} /></Field>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}
