import { useState } from 'react';
import { Plus, CalendarDays, Clock, Check } from 'lucide-react';
import { useStore } from '@/store/store';
import { useDb, useUsers, userName } from '@/store/hooks';
import { PageHeader, Card, CardHeader, Button, Badge, StatusBadge, Table, Th, Td, Tr, Modal, Field, Input, Select, Avatar } from '@/components/ui';
import { KpiCard } from '@/components/ui/KpiCard';
import { formatDate } from '@/utils/formatters';
import { toast } from '@/store/toastStore';
import type { BookingStatus } from '@/types';

const STATUSES: BookingStatus[] = ['Scheduled', 'Completed', 'No Show', 'Cancelled', 'Rescheduled'];

export function Bookings() {
  const { db, tenantId } = useDb();
  const users = useUsers();
  const { createBooking, updateBooking } = useStore();
  const bookings = db.bookings.filter((b) => b.tenant_id === tenantId).sort((a, b) => new Date(b.meeting_date).getTime() - new Date(a.meeting_date).getTime());
  const leads = db.leads.filter((l) => l.tenant_id === tenantId && !l.archived);

  const [show, setShow] = useState(false);
  const [form, setForm] = useState({ lead_id: leads[0]?.id ?? '', meeting_date: new Date(Date.now() + 86400000).toISOString().slice(0, 10), meeting_time: '14:00', meeting_type: 'Discovery Call', assigned_user_id: users[0]?.id ?? '' });

  const create = () => {
    const lead = db.leads.find((l) => l.id === form.lead_id);
    if (!lead) return toast.error('Select a lead');
    createBooking({ ...form, meeting_date: new Date(form.meeting_date).toISOString(), source: lead.source, campaign: lead.campaign });
    setShow(false);
  };

  const upcoming = bookings.filter((b) => b.status === 'Scheduled' && new Date(b.meeting_date) >= new Date());

  return (
    <div>
      <PageHeader title="Calendar / Bookings" description="Scheduled calls auto-update the lead status, pipeline & timeline." breadcrumb={['Revenue', 'Bookings']}
        actions={<Button onClick={() => setShow(true)}><Plus size={16} /> New Booking</Button>} />

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard label="Total bookings" value={bookings.length} icon={<CalendarDays size={18} />} accent="#6366f1" />
        <KpiCard label="Upcoming" value={upcoming.length} icon={<Clock size={18} />} accent="#8b5cf6" />
        <KpiCard label="Completed" value={bookings.filter((b) => b.status === 'Completed').length} icon={<Check size={18} />} accent="#10b981" />
        <KpiCard label="No-shows" value={bookings.filter((b) => b.status === 'No Show').length} icon={<Clock size={18} />} accent="#ef4444" />
      </div>

      <Card>
        <CardHeader title="All Bookings" subtitle="Change status to reflect call outcomes" />
        <Table>
          <thead><tr><Th>Lead</Th><Th>Type</Th><Th>Date</Th><Th>Time</Th><Th>Owner</Th><Th>Source</Th><Th>Status</Th></tr></thead>
          <tbody>
            {bookings.map((b) => {
              const lead = db.leads.find((l) => l.id === b.lead_id);
              return (
                <Tr key={b.id}>
                  <Td><div className="flex items-center gap-2"><Avatar name={lead?.name ?? '?'} size={28} color="#8b5cf6" /><span className="font-medium">{lead?.name}</span></div></Td>
                  <Td>{b.meeting_type}</Td>
                  <Td>{formatDate(b.meeting_date)}</Td>
                  <Td>{b.meeting_time}</Td>
                  <Td>{userName(db, b.assigned_user_id)}</Td>
                  <Td><Badge tone="blue">{b.source}</Badge></Td>
                  <Td>
                    <Select value={b.status} onChange={(e) => updateBooking(b.id, { status: e.target.value as BookingStatus })} className="w-auto py-1 text-xs">
                      {STATUSES.map((s) => <option key={s}>{s}</option>)}
                    </Select>
                  </Td>
                </Tr>
              );
            })}
          </tbody>
        </Table>
      </Card>

      {show && (
        <Modal open onClose={() => setShow(false)} title="New Booking" footer={<><Button variant="secondary" onClick={() => setShow(false)}>Cancel</Button><Button onClick={create}>Create booking</Button></>}>
          <div className="space-y-4">
            <Field label="Lead"><Select value={form.lead_id} onChange={(e) => setForm({ ...form, lead_id: e.target.value })}>{leads.map((l) => <option key={l.id} value={l.id}>{l.name} — {l.company}</option>)}</Select></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Date"><Input type="date" value={form.meeting_date} onChange={(e) => setForm({ ...form, meeting_date: e.target.value })} /></Field>
              <Field label="Time"><Input type="time" value={form.meeting_time} onChange={(e) => setForm({ ...form, meeting_time: e.target.value })} /></Field>
            </div>
            <Field label="Meeting type"><Select value={form.meeting_type} onChange={(e) => setForm({ ...form, meeting_type: e.target.value })}>{['Discovery Call', 'Strategy Session', 'Demo', 'Proposal Review'].map((t) => <option key={t}>{t}</option>)}</Select></Field>
            <Field label="Assigned to"><Select value={form.assigned_user_id} onChange={(e) => setForm({ ...form, assigned_user_id: e.target.value })}>{users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}</Select></Field>
            <p className="text-xs text-ink-400">Creating a booking moves the lead to <strong>Booked</strong> and updates the pipeline automatically.</p>
          </div>
        </Modal>
      )}
    </div>
  );
}
