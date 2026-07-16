import { useState } from 'react';
import { Plug, RefreshCw, Settings as SettingsIcon, CheckCircle2, AlertCircle } from 'lucide-react';
import { useStore } from '@/store/store';
import { useDb } from '@/store/hooks';
import { PageHeader, Card, Button, Badge, Tabs, Modal, Field, Input, cn } from '@/components/ui';
import { timeAgo } from '@/utils/formatters';
import type { Integration } from '@/types';

export function Integrations() {
  const { db, tenantId } = useDb();
  const { toggleIntegration, syncIntegration, updateIntegrationConfig } = useStore();
  const integrations = db.integrations.filter((i) => i.tenant_id === tenantId);

  const [filter, setFilter] = useState('all');
  const [config, setConfig] = useState<Integration | null>(null);
  const [logs, setLogs] = useState<Integration | null>(null);

  const categories = ['all', ...Array.from(new Set(integrations.map((i) => i.category)))];
  const filtered = filter === 'all' ? integrations : integrations.filter((i) => i.category === filter);

  return (
    <div>
      <PageHeader title="Integrations" description="Connect WhatsApp providers, payments, AI, calendars & more. All run in simulation mode." breadcrumb={['Admin', 'Integrations']}
        actions={<Badge tone="violet">{integrations.filter((i) => i.status !== 'disconnected').length} connected</Badge>} />

      <div className="mb-4"><Tabs tabs={categories.map((c) => ({ id: c, label: c === 'all' ? 'All' : c }))} active={filter} onChange={setFilter} /></div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((i) => (
          <Card key={i.id} className="flex flex-col p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl font-bold text-white" style={{ background: i.logo_color }}>{i.name[0]}</span>
                <div><p className="font-semibold text-ink-900">{i.name}</p><p className="text-xs text-ink-500">{i.category}</p></div>
              </div>
              <Badge tone={i.status === 'connected' ? 'green' : i.status === 'simulation' ? 'amber' : 'gray'}>
                {i.status === 'connected' && <CheckCircle2 size={11} />} {i.status}
              </Badge>
            </div>
            <p className="mt-3 flex-1 text-sm text-ink-500">{i.description}</p>
            {i.last_sync && <p className="mt-2 text-xs text-ink-400">Last sync: {timeAgo(i.last_sync)}</p>}
            <div className="mt-3 flex flex-wrap gap-1.5">
              <Button variant={i.status === 'disconnected' ? 'primary' : 'secondary'} className="px-3 py-1.5 text-xs" onClick={() => toggleIntegration(i.id)}>
                {i.status === 'disconnected' ? 'Connect' : 'Disconnect'}
              </Button>
              {i.status !== 'disconnected' && <Button variant="ghost" className="px-2.5 py-1.5 text-xs" onClick={() => syncIntegration(i.id)}><RefreshCw size={13} /> Sync</Button>}
              <Button variant="ghost" className="px-2.5 py-1.5 text-xs" onClick={() => setConfig(i)}><SettingsIcon size={13} /></Button>
              {i.error_logs.length > 0 && <Button variant="ghost" className="px-2.5 py-1.5 text-xs text-amber-600" onClick={() => setLogs(i)}><AlertCircle size={13} /></Button>}
            </div>
          </Card>
        ))}
      </div>

      {config && (
        <Modal open onClose={() => setConfig(null)} title={`${config.name} Settings`}
          footer={<><Button variant="secondary" onClick={() => setConfig(null)}>Close</Button><Button onClick={() => { updateIntegrationConfig(config.id, { api_key: 'configured' }); setConfig(null); }}>Save</Button></>}>
          <div className="space-y-4">
            <Field label="API Key / Token"><Input placeholder="••••••••••••sim" defaultValue={config.config.api_key ? '••••••••configured' : ''} /></Field>
            <Field label="Webhook URL"><Input defaultValue={`https://app.innovatex.com/webhooks/${config.name.toLowerCase().replace(/[^a-z]/g, '')}`} /></Field>
            <p className="text-xs text-ink-400">In this prototype, credentials are simulated. Connecting toggles status and updates the last sync time.</p>
          </div>
        </Modal>
      )}

      {logs && (
        <Modal open onClose={() => setLogs(null)} title={`${logs.name} — Error Logs`}>
          <div className="space-y-2">
            {logs.error_logs.map((l, i) => <div key={i} className="flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-700"><AlertCircle size={15} className="mt-0.5 shrink-0" /> {l}</div>)}
          </div>
        </Modal>
      )}
    </div>
  );
}
