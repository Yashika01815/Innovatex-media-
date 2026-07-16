import { useState } from 'react';
import { Plus, CreditCard, CheckCircle2, Copy, Download } from 'lucide-react';
import { useStore } from '@/store/store';
import { useDb } from '@/store/hooks';
import { PageHeader, Card, CardHeader, Button, StatusBadge, Table, Th, Td, Tr, Modal, Field, Input, Select, Avatar } from '@/components/ui';
import { KpiCard } from '@/components/ui/KpiCard';
import { DonutChartCard } from '@/components/charts';
import { groupCount } from '@/utils/calculations';
import { formatCurrency, formatCompact, formatDate } from '@/utils/formatters';
import { exportToCSV } from '@/utils/csvExport';
import { toast } from '@/store/toastStore';

export function Payments() {
  const { db, tenantId } = useDb();
  const { createPayment, markPaymentPaid, updatePayment } = useStore();
  const payments = db.payments.filter((p) => p.tenant_id === tenantId).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  const leads = db.leads.filter((l) => l.tenant_id === tenantId && !l.archived);

  const [show, setShow] = useState(false);
  const [form, setForm] = useState({ lead_id: leads[0]?.id ?? '', amount: 5000, payment_method: 'Card' });

  const create = () => {
    const lead = db.leads.find((l) => l.id === form.lead_id);
    if (!lead) return toast.error('Select a lead');
    createPayment({ lead_id: lead.id, amount: Number(form.amount), payment_method: form.payment_method, source: lead.source, campaign: lead.campaign, deal_id: db.deals.find((d) => d.lead_id === lead.id)?.id ?? null, status: 'Sent' });
    setShow(false);
  };

  const paid = payments.filter((p) => p.status === 'Paid');
  const pending = payments.filter((p) => ['Pending', 'Sent'].includes(p.status));
  const revenue = paid.reduce((s, p) => s + p.amount, 0);
  const outstanding = pending.reduce((s, p) => s + p.amount, 0);
  const byStatus = groupCount(payments, (p) => p.status);

  return (
    <div>
      <PageHeader title="Payments" description="Track payment links — marking paid auto-closes the deal & updates revenue." breadcrumb={['Growth', 'Payments']}
        actions={<><Button variant="secondary" onClick={() => exportToCSV('payments', payments.map((p) => ({ Lead: db.leads.find((l) => l.id === p.lead_id)?.name, Amount: p.amount, Status: p.status, Method: p.payment_method, Source: p.source, Date: p.payment_date })))}><Download size={16} /> Export</Button><Button onClick={() => setShow(true)}><Plus size={16} /> New Payment</Button></>} />

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard label="Revenue collected" value={formatCompact(revenue)} icon={<CheckCircle2 size={18} />} accent="#10b981" />
        <KpiCard label="Outstanding" value={formatCompact(outstanding)} icon={<CreditCard size={18} />} accent="#f59e0b" />
        <KpiCard label="Paid" value={paid.length} icon={<CheckCircle2 size={18} />} accent="#10b981" />
        <KpiCard label="Pending" value={pending.length} icon={<CreditCard size={18} />} accent="#ef4444" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <DonutChartCard title="Payments by Status" data={byStatus} />
        <Card className="lg:col-span-2">
          <CardHeader title="All Payments" />
          <Table>
            <thead><tr><Th>Lead</Th><Th>Amount</Th><Th>Method</Th><Th>Status</Th><Th>Date</Th><Th>Actions</Th></tr></thead>
            <tbody>
              {payments.map((p) => {
                const lead = db.leads.find((l) => l.id === p.lead_id);
                return (
                  <Tr key={p.id}>
                    <Td><div className="flex items-center gap-2"><Avatar name={lead?.name ?? '?'} size={28} color="#10b981" /><span className="font-medium">{lead?.name}</span></div></Td>
                    <Td className="font-semibold">{formatCurrency(p.amount, p.currency)}</Td>
                    <Td>{p.payment_method}</Td>
                    <Td><StatusBadge status={p.status} /></Td>
                    <Td className="text-ink-500">{p.payment_date ? formatDate(p.payment_date) : '—'}</Td>
                    <Td>
                      <div className="flex gap-1">
                        <button onClick={() => { navigator.clipboard?.writeText(p.payment_link); toast.success('Payment link copied'); }} className="rounded p-1.5 text-ink-400 hover:bg-ink-100" title="Copy link"><Copy size={14} /></button>
                        {p.status !== 'Paid' && p.status !== 'Refunded' && <Button className="px-2.5 py-1 text-xs" onClick={() => markPaymentPaid(p.id)}>Mark paid</Button>}
                        {p.status === 'Paid' && <Button variant="ghost" className="px-2.5 py-1 text-xs" onClick={() => updatePayment(p.id, { status: 'Refunded' })}>Refund</Button>}
                      </div>
                    </Td>
                  </Tr>
                );
              })}
            </tbody>
          </Table>
        </Card>
      </div>

      {show && (
        <Modal open onClose={() => setShow(false)} title="New Payment Link"
          footer={<><Button variant="secondary" onClick={() => setShow(false)}>Cancel</Button><Button onClick={create}>Create payment</Button></>}>
          <div className="space-y-4">
            <Field label="Lead"><Select value={form.lead_id} onChange={(e) => setForm({ ...form, lead_id: e.target.value })}>{leads.map((l) => <option key={l.id} value={l.id}>{l.name} — {l.company}</option>)}</Select></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Amount (USD)"><Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} /></Field>
              <Field label="Method"><Select value={form.payment_method} onChange={(e) => setForm({ ...form, payment_method: e.target.value })}>{['Card', 'Bank Transfer', 'Stripe', 'PayPal'].map((m) => <option key={m}>{m}</option>)}</Select></Field>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
