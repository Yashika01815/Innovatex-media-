import { useState } from 'react';
import { Save, Plus, Trash2 } from 'lucide-react';
import { useStore } from '@/store/store';
import { useSettings, useDb } from '@/store/hooks';
import { PageHeader, Card, CardHeader, Button, Tabs, Field, Input, Toggle, Badge } from '@/components/ui';
import { toast } from '@/store/toastStore';

const TABS = [
  { id: 'company', label: 'Company' }, { id: 'branding', label: 'Branding' },
  { id: 'fields', label: 'Lead Fields' }, { id: 'pipeline', label: 'Pipeline Stages' },
  { id: 'qualification', label: 'Qualification' }, { id: 'scoring', label: 'Scoring Rules' },
  { id: 'notifications', label: 'Notifications' }, { id: 'consent', label: 'Consent & Data' },
  { id: 'billing', label: 'Billing' }, { id: 'security', label: 'Security' },
];

export function Settings() {
  const settings = useSettings();
  const { tenantId } = useDb();
  const { updateSettings } = useStore();
  const [tab, setTab] = useState('company');

  return (
    <div>
      <PageHeader title="Settings" description="Configure your workspace — saved locally for this demo." breadcrumb={['Admin', 'Settings']} />
      <div className="grid gap-4 lg:grid-cols-[200px_1fr]">
        <div className="lg:border-r lg:border-ink-200 lg:pr-2">
          <div className="flex gap-1 overflow-x-auto lg:flex-col">
            {TABS.map((t) => (
              <button key={t.id} onClick={() => setTab(t.id)} className={`whitespace-nowrap rounded-lg px-3 py-2 text-left text-sm font-medium transition ${tab === t.id ? 'bg-brand-50 text-brand-700' : 'text-ink-600 hover:bg-ink-100'}`}>{t.label}</button>
            ))}
          </div>
        </div>
        <div>
          {tab === 'company' && <CompanyTab settings={settings} update={updateSettings} />}
          {tab === 'branding' && <BrandingTab settings={settings} update={updateSettings} />}
          {tab === 'fields' && <FieldsTab />}
          {tab === 'pipeline' && <PipelineTab settings={settings} />}
          {tab === 'qualification' && <QualificationTab settings={settings} update={updateSettings} />}
          {tab === 'scoring' && <ScoringTab settings={settings} update={updateSettings} />}
          {tab === 'notifications' && <NotificationsTab settings={settings} update={updateSettings} />}
          {tab === 'consent' && <ConsentTab settings={settings} update={updateSettings} />}
          {tab === 'billing' && <BillingTab tenantId={tenantId} />}
          {tab === 'security' && <SecurityTab />}
        </div>
      </div>
    </div>
  );
}

type S = ReturnType<typeof useSettings>;
type Upd = (p: Partial<S>) => void;

function CompanyTab({ settings, update }: { settings: S; update: Upd }) {
  const [form, setForm] = useState({ company_name: settings.company_name, company_website: settings.company_website });
  return (
    <Card className="p-6">
      <CardHeaderInline title="Company Profile" />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Company name"><Input value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })} /></Field>
        <Field label="Website"><Input value={form.company_website} onChange={(e) => setForm({ ...form, company_website: e.target.value })} /></Field>
      </div>
      <Button className="mt-4" onClick={() => update(form)}><Save size={15} /> Save</Button>
    </Card>
  );
}

function BrandingTab({ settings, update }: { settings: S; update: Upd }) {
  const [color, setColor] = useState(settings.accent_color);
  const colors = ['#6366f1', '#8b5cf6', '#14b8a6', '#3b82f6', '#ec4899', '#f59e0b', '#10b981'];
  return (
    <Card className="p-6">
      <CardHeaderInline title="Branding" />
      <Field label="Accent color">
        <div className="flex gap-2">{colors.map((c) => <button key={c} onClick={() => setColor(c)} className={`h-9 w-9 rounded-lg ${color === c ? 'ring-2 ring-offset-2 ring-ink-400' : ''}`} style={{ background: c }} />)}</div>
      </Field>
      <Button className="mt-4" onClick={() => update({ accent_color: color })}><Save size={15} /> Save</Button>
    </Card>
  );
}

function FieldsTab() {
  const fields = ['name', 'email', 'phone', 'whatsapp_number', 'company', 'source', 'campaign', 'segment', 'consent_status', 'qualification_score'];
  return (
    <Card className="p-6">
      <CardHeaderInline title="Lead Fields" subtitle="Standard fields captured for every lead" />
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">{fields.map((f) => <div key={f} className="rounded-lg border border-ink-100 px-3 py-2 text-sm text-ink-700">{f}</div>)}</div>
    </Card>
  );
}

function PipelineTab({ settings }: { settings: S }) {
  return (
    <Card className="p-6">
      <CardHeaderInline title="Pipeline Stages" subtitle="Stages used across the pipeline" />
      <div className="space-y-2">{settings.pipeline_stages.map((s) => <div key={s.id} className="flex items-center gap-3 rounded-lg border border-ink-100 px-3 py-2"><span className="h-3 w-3 rounded-full" style={{ background: s.color }} /><span className="text-sm font-medium text-ink-800">{s.name}</span><Badge tone="gray" className="ml-auto">#{s.order}</Badge></div>)}</div>
    </Card>
  );
}

function QualificationTab({ settings, update }: { settings: S; update: Upd }) {
  const [qs, setQs] = useState(settings.qualification_questions);
  const [newQ, setNewQ] = useState('');
  return (
    <Card className="p-6">
      <CardHeaderInline title="Qualification Questions" subtitle="Used by the AI Qualification engine" />
      <div className="space-y-2">
        {qs.map((q, i) => (
          <div key={i} className="flex items-center gap-2"><Input value={q} onChange={(e) => setQs(qs.map((x, j) => j === i ? e.target.value : x))} /><button onClick={() => setQs(qs.filter((_, j) => j !== i))} className="rounded-lg p-2 text-ink-400 hover:text-red-600"><Trash2 size={15} /></button></div>
        ))}
      </div>
      <div className="mt-2 flex gap-2"><Input value={newQ} onChange={(e) => setNewQ(e.target.value)} placeholder="Add a question…" /><Button variant="secondary" onClick={() => { if (newQ.trim()) { setQs([...qs, newQ.trim()]); setNewQ(''); } }}><Plus size={15} /></Button></div>
      <Button className="mt-4" onClick={() => update({ qualification_questions: qs })}><Save size={15} /> Save</Button>
    </Card>
  );
}

function ScoringTab({ settings, update }: { settings: S; update: Upd }) {
  const [rules, setRules] = useState(settings.scoring_rules);
  return (
    <Card className="p-6">
      <CardHeaderInline title="Scoring Rules" subtitle="Weighting factors for lead scoring (total should be 100)" />
      <div className="space-y-2">
        {rules.map((r, i) => (
          <div key={i} className="flex items-center gap-3"><span className="flex-1 text-sm text-ink-700">{r.factor}</span><Input type="number" value={r.weight} onChange={(e) => setRules(rules.map((x, j) => j === i ? { ...x, weight: Number(e.target.value) } : x))} className="w-24" /><span className="text-sm text-ink-400">%</span></div>
        ))}
      </div>
      <p className="mt-2 text-xs text-ink-400">Total: {rules.reduce((s, r) => s + r.weight, 0)}%</p>
      <Button className="mt-4" onClick={() => update({ scoring_rules: rules })}><Save size={15} /> Save</Button>
    </Card>
  );
}

function NotificationsTab({ settings, update }: { settings: S; update: Upd }) {
  const [prefs, setPrefs] = useState(settings.notification_prefs);
  return (
    <Card className="p-6">
      <CardHeaderInline title="Notification Preferences" />
      <div className="space-y-2">
        {Object.entries(prefs).map(([k, v]) => (
          <div key={k} className="flex items-center justify-between rounded-lg border border-ink-100 px-3 py-2.5"><span className="text-sm text-ink-700">{k}</span><Toggle checked={v} onChange={(nv) => setPrefs({ ...prefs, [k]: nv })} /></div>
        ))}
      </div>
      <Button className="mt-4" onClick={() => update({ notification_prefs: prefs })}><Save size={15} /> Save</Button>
    </Card>
  );
}

function ConsentTab({ settings, update }: { settings: S; update: Upd }) {
  const [consent, setConsent] = useState(settings.consent_required);
  const [retention, setRetention] = useState(settings.data_retention_days);
  return (
    <Card className="p-6">
      <CardHeaderInline title="Consent & Data Retention" />
      <div className="flex items-center justify-between rounded-lg border border-ink-100 px-3 py-2.5"><span className="text-sm text-ink-700">Require consent before messaging</span><Toggle checked={consent} onChange={setConsent} /></div>
      <Field label="Data retention (days)" hint="Placeholder — not enforced in demo"><Input type="number" value={retention} onChange={(e) => setRetention(Number(e.target.value))} className="mt-2 w-40" /></Field>
      <Button className="mt-4" onClick={() => update({ consent_required: consent, data_retention_days: retention })}><Save size={15} /> Save</Button>
    </Card>
  );
}

function BillingTab({ tenantId }: { tenantId: string }) {
  const { db } = useDb();
  const tenant = db.tenants.find((t) => t.id === tenantId);
  return (
    <Card className="p-6">
      <CardHeaderInline title="Billing" subtitle="Placeholder — managed by InnovateX platform" />
      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Plan" value={tenant?.plan ?? '—'} />
        <Stat label="Seats" value={String(tenant?.seats ?? 0)} />
        <Stat label="MRR" value={`$${tenant?.mrr ?? 0}`} />
      </div>
      <Button variant="secondary" className="mt-4" onClick={() => toast.info('Billing portal', 'Stripe billing portal would open here')}>Manage billing</Button>
    </Card>
  );
}

function SecurityTab() {
  return (
    <Card className="p-6">
      <CardHeaderInline title="Security" />
      <div className="space-y-2">
        {[['Two-factor authentication', false], ['SSO / SAML', false], ['Audit logging', true], ['IP allowlist', false]].map(([k, v]) => (
          <div key={k as string} className="flex items-center justify-between rounded-lg border border-ink-100 px-3 py-2.5"><span className="text-sm text-ink-700">{k}</span><Toggle checked={v as boolean} onChange={() => toast.info('Security setting', 'Configured at the platform level in production')} /></div>
        ))}
      </div>
    </Card>
  );
}

function CardHeaderInline({ title, subtitle }: { title: string; subtitle?: string }) {
  return <div className="mb-4"><h3 className="text-sm font-semibold text-ink-900">{title}</h3>{subtitle && <p className="mt-0.5 text-xs text-ink-500">{subtitle}</p>}</div>;
}
function Stat({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg border border-ink-100 p-3"><p className="text-xs text-ink-400">{label}</p><p className="text-lg font-bold text-ink-900">{value}</p></div>;
}
