import { useState } from 'react';
import { MessageSquarePlus, Tag, UserPlus, StickyNote, Search } from 'lucide-react';
import { useStore } from '@/store/store';
import { useDb, useUsers, userName } from '@/store/hooks';
import { Avatar, Badge, StatusBadge, Button, Select, cn } from '@/components/ui';
import { Composer } from './Composer';
import { formatCurrency, timeAgo } from '@/utils/formatters';
import type { ConversationStatus } from '@/types';

const STATUSES: ConversationStatus[] = ['New', 'Open', 'Pending', 'Qualified', 'Booked', 'Won', 'Lost', 'Ghosted'];

export function Inbox() {
  const { db, tenantId } = useDb();
  const users = useUsers();
  const { simulateInbound, setConversationStatus, updateConversation } = useStore();

  const convos = db.conversations.filter((c) => c.tenant_id === tenantId);
  const [activeId, setActiveId] = useState(convos[0]?.id ?? '');
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [tagInput, setTagInput] = useState('');
  const [showNote, setShowNote] = useState(false);
  const [noteText, setNoteText] = useState('');

  const filtered = convos.filter((c) => {
    const lead = db.leads.find((l) => l.id === c.lead_id);
    if (statusFilter !== 'all' && c.status !== statusFilter) return false;
    if (q && !lead?.name.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  }).sort((a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime());

  const active = db.conversations.find((c) => c.id === activeId);
  const activeLead = active ? db.leads.find((l) => l.id === active.lead_id) : null;
  const messages = active ? db.messages.filter((m) => m.conversation_id === active.id).sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) : [];
  const activeDeal = activeLead ? db.deals.find((d) => d.lead_id === activeLead.id) : null;
  const activePayment = activeLead ? db.payments.find((p) => p.lead_id === activeLead.id) : null;

  const addTag = () => {
    if (!tagInput.trim() || !active) return;
    updateConversation(active.id, { tags: [...active.tags, tagInput.trim()] });
    setTagInput('');
  };
  const addNote = () => {
    if (!noteText.trim() || !active) return;
    updateConversation(active.id, { internal_notes: [...active.internal_notes, { author_id: 'u_sales', text: noteText, at: new Date().toISOString() }] });
    setNoteText('');
    setShowNote(false);
  };

  return (
    <div className="grid h-[calc(100vh-13rem)] grid-cols-12 overflow-hidden rounded-xl border border-ink-200 bg-white">
      {/* Conversation list */}
      <div className="col-span-12 flex flex-col border-r border-ink-200 md:col-span-4 lg:col-span-3">
        <div className="space-y-2 border-b border-ink-100 p-3">
          <div className="relative">
            <Search size={15} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-400" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search conversations" className="input py-1.5 pl-8 text-sm" />
          </div>
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="py-1.5 text-sm">
            <option value="all">All statuses</option>
            {STATUSES.map((s) => <option key={s}>{s}</option>)}
          </Select>
        </div>
        <div className="flex-1 overflow-y-auto">
          {filtered.map((c) => {
            const lead = db.leads.find((l) => l.id === c.lead_id);
            const last = db.messages.filter((m) => m.conversation_id === c.id).slice(-1)[0];
            return (
              <button key={c.id} onClick={() => setActiveId(c.id)} className={cn('flex w-full gap-2.5 border-b border-ink-50 px-3 py-3 text-left hover:bg-ink-50', c.id === activeId && 'bg-brand-50/50')}>
                <Avatar name={lead?.name ?? '?'} color="#22c55e" size={38} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <p className="truncate text-sm font-semibold text-ink-900">{lead?.name}</p>
                    <span className="shrink-0 text-[11px] text-ink-400">{timeAgo(c.last_message_at)}</span>
                  </div>
                  <p className="truncate text-xs text-ink-500">{last?.body ?? 'No messages yet'}</p>
                  <div className="mt-1 flex items-center gap-1">
                    <StatusBadge status={c.status} />
                    {c.unread_count > 0 && <span className="ml-auto flex h-4 min-w-4 items-center justify-center rounded-full bg-emerald-500 px-1 text-[10px] font-bold text-white">{c.unread_count}</span>}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Chat thread */}
      <div className="col-span-12 flex flex-col md:col-span-8 lg:col-span-6">
        {active && activeLead ? (
          <>
            <div className="flex items-center justify-between border-b border-ink-200 px-4 py-3">
              <div className="flex items-center gap-2.5">
                <Avatar name={activeLead.name} color="#22c55e" size={36} />
                <div>
                  <p className="text-sm font-semibold text-ink-900">{activeLead.name}</p>
                  <p className="text-xs text-ink-500">{activeLead.whatsapp_number}</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <Select value={active.status} onChange={(e) => setConversationStatus(active.id, e.target.value as ConversationStatus)} className="w-auto py-1 text-xs">
                  {STATUSES.map((s) => <option key={s}>{s}</option>)}
                </Select>
                <Select value={active.assigned_user_id ?? ''} onChange={(e) => updateConversation(active.id, { assigned_user_id: e.target.value })} className="w-auto py-1 text-xs" title="Assign">
                  {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                </Select>
              </div>
            </div>

            <div className="flex-1 space-y-2 overflow-y-auto bg-ink-50/60 p-4" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, #e2e8f0 1px, transparent 0)', backgroundSize: '24px 24px' }}>
              {messages.map((m) => (
                <div key={m.id} className={cn('flex', m.direction === 'outbound' ? 'justify-end' : 'justify-start')}>
                  <div className={cn('max-w-[75%] rounded-2xl px-3.5 py-2 text-sm shadow-sm', m.direction === 'outbound' ? 'rounded-br-sm bg-brand-600 text-white' : 'rounded-bl-sm bg-white text-ink-800')}>
                    <p>{m.body}</p>
                    <p className={cn('mt-0.5 text-[10px]', m.direction === 'outbound' ? 'text-brand-200' : 'text-ink-400')}>{timeAgo(m.created_at)} · {m.status}</p>
                  </div>
                </div>
              ))}
              {messages.length === 0 && <p className="py-8 text-center text-sm text-ink-400">No messages yet — send the first one below.</p>}
            </div>

            <div className="flex items-center gap-2 border-t border-ink-100 px-3 py-2">
              <Button variant="ghost" className="px-2 py-1 text-xs" onClick={() => simulateInbound(active.id)}><MessageSquarePlus size={14} /> Simulate inbound</Button>
              <div className="ml-auto flex items-center gap-1">
                <input value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addTag()} placeholder="add tag" className="w-24 rounded-md border border-ink-200 px-2 py-1 text-xs outline-none" />
                <button onClick={addTag} className="rounded-md p-1.5 text-ink-500 hover:bg-ink-100"><Tag size={14} /></button>
                <button onClick={() => setShowNote((v) => !v)} className="rounded-md p-1.5 text-ink-500 hover:bg-ink-100"><StickyNote size={14} /></button>
              </div>
            </div>
            {showNote && (
              <div className="flex gap-2 border-t border-ink-100 px-3 py-2">
                <input value={noteText} onChange={(e) => setNoteText(e.target.value)} placeholder="Internal note (not sent to lead)" className="input py-1.5 text-sm" />
                <Button onClick={addNote} className="text-xs">Save note</Button>
              </div>
            )}
            <Composer conversation={active} />
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center text-sm text-ink-400">Select a conversation</div>
        )}
      </div>

      {/* Lead context panel */}
      <div className="hidden flex-col gap-3 overflow-y-auto border-l border-ink-200 p-4 lg:col-span-3 lg:flex">
        {active && activeLead ? (
          <>
            <div className="text-center">
              <Avatar name={activeLead.name} color="#6366f1" size={56} />
              <p className="mt-2 font-semibold text-ink-900">{activeLead.name}</p>
              <p className="text-xs text-ink-500">{activeLead.company}</p>
            </div>
            <div className="flex flex-wrap justify-center gap-1.5">
              <Badge tone={activeLead.lead_temperature === 'Hot' ? 'red' : activeLead.lead_temperature === 'Warm' ? 'amber' : 'gray'}>{activeLead.lead_temperature}</Badge>
              <Badge tone="blue">Score {activeLead.qualification_score}</Badge>
            </div>
            <Detail label="Source" value={activeLead.source} />
            <Detail label="Campaign" value={activeLead.campaign || '—'} />
            <Detail label="UTM" value={`${activeLead.utm_source || '—'} / ${activeLead.utm_medium || '—'}`} />
            <Detail label="Pipeline stage" value={activeDeal ? activeDeal.stage.replace(/_/g, ' ') : 'No deal'} />
            <Detail label="Payment" value={activePayment ? activePayment.status : 'None'} />
            <Detail label="Owner" value={userName(db, active.assigned_user_id)} />
            <Detail label="Last contacted" value={timeAgo(activeLead.last_contacted_at)} />
            <Detail label="Deal value" value={formatCurrency(activeLead.value)} />
            <div>
              <p className="mb-1 text-[11px] font-bold uppercase tracking-wide text-ink-400">Response timer</p>
              <div className="rounded-lg bg-amber-50 px-3 py-2 text-sm font-medium text-amber-700">⏱ {active.unread_count > 0 ? 'Reply pending' : 'Up to date'}</div>
            </div>
            {active.tags.length > 0 && (
              <div>
                <p className="mb-1 text-[11px] font-bold uppercase tracking-wide text-ink-400">Tags</p>
                <div className="flex flex-wrap gap-1">{active.tags.map((t, i) => <Badge key={i} tone="teal">{t}</Badge>)}</div>
              </div>
            )}
            {active.internal_notes.length > 0 && (
              <div>
                <p className="mb-1 text-[11px] font-bold uppercase tracking-wide text-ink-400">Internal notes</p>
                {active.internal_notes.map((n, i) => <p key={i} className="rounded-lg bg-ink-50 px-2.5 py-1.5 text-xs text-ink-600">{n.text}</p>)}
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center text-center text-sm text-ink-400"><UserPlus size={20} /></div>
        )}
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-ink-50 pb-1.5 text-sm">
      <span className="text-ink-400">{label}</span>
      <span className="font-medium text-ink-800">{value}</span>
    </div>
  );
}
