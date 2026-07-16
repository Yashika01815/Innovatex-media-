import { useState } from 'react';
import { Send, Sparkles, FileText, Wand2, Clock, ChevronDown, X } from 'lucide-react';
import { useStore } from '@/store/store';
import { useDb } from '@/store/hooks';
import { Button } from '@/components/ui';
import { generateWhatsAppReply, rewriteWhatsAppMessage } from '@/services/aiService';
import { toast } from '@/store/toastStore';
import type { WhatsAppConversation } from '@/types';

const VARIABLES = ['{{lead_name}}', '{{company_name}}', '{{offer_name}}', '{{booking_link}}', '{{payment_link}}', '{{sales_rep_name}}', '{{call_date}}', '{{lead_problem}}', '{{campaign_name}}'];

const AI_ACTIONS = [
  { label: 'Generate reply', mode: 'default' as const },
  { label: 'Booking message', mode: 'booking' as const },
  { label: 'Payment reminder', mode: 'payment' as const },
  { label: 'Objection handling', mode: 'objection' as const },
  { label: 'Follow-up after call', mode: 'followup' as const },
];

export function Composer({ conversation }: { conversation: WhatsAppConversation }) {
  const { db } = useDb();
  const { sendMessage } = useStore();
  const [text, setText] = useState('');
  const [showTemplates, setShowTemplates] = useState(false);
  const [showVars, setShowVars] = useState(false);
  const [showAi, setShowAi] = useState(false);

  const lead = db.leads.find((l) => l.id === conversation.lead_id);
  const activeTemplates = db.templates.filter((t) => t.tenant_id === conversation.tenant_id && ['Active', 'Provider Approved'].includes(t.status));

  const insert = (s: string) => setText((t) => (t ? t + ' ' + s : s));

  const send = () => {
    if (!text.trim()) return;
    if (lead?.opt_out_status) {
      sendMessage(conversation.id, text); // store handles the block + toast
      return;
    }
    sendMessage(conversation.id, text);
    setText('');
  };

  const rewrite = (mode: 'shorter' | 'professional' | 'persuasive') => {
    if (!text.trim()) return toast.error('Write a message first');
    setText(rewriteWhatsAppMessage(text, mode));
  };

  return (
    <div className="border-t border-ink-200 bg-white p-3">
      {/* Tool row */}
      <div className="mb-2 flex flex-wrap items-center gap-1.5">
        <div className="relative">
          <button onClick={() => { setShowAi((v) => !v); setShowTemplates(false); setShowVars(false); }} className="inline-flex items-center gap-1 rounded-lg bg-brand-50 px-2.5 py-1.5 text-xs font-semibold text-brand-700 hover:bg-brand-100">
            <Sparkles size={13} /> AI Reply <ChevronDown size={12} />
          </button>
          {showAi && (
            <div className="absolute bottom-10 left-0 z-20 w-52 rounded-xl border border-ink-200 bg-white p-1.5 shadow-soft">
              {AI_ACTIONS.map((a) => (
                <button key={a.label} onClick={() => { setText(generateWhatsAppReply('', a.mode)); setShowAi(false); }} className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm hover:bg-ink-50">
                  <Sparkles size={14} className="text-brand-500" /> {a.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <button onClick={() => rewrite('shorter')} className="inline-flex items-center gap-1 rounded-lg border border-ink-200 px-2.5 py-1.5 text-xs font-medium text-ink-600 hover:bg-ink-50"><Wand2 size={13} /> Shorter</button>
        <button onClick={() => rewrite('professional')} className="rounded-lg border border-ink-200 px-2.5 py-1.5 text-xs font-medium text-ink-600 hover:bg-ink-50">Professional</button>
        <button onClick={() => rewrite('persuasive')} className="rounded-lg border border-ink-200 px-2.5 py-1.5 text-xs font-medium text-ink-600 hover:bg-ink-50">Persuasive</button>

        <div className="relative">
          <button onClick={() => { setShowTemplates((v) => !v); setShowAi(false); setShowVars(false); }} className="inline-flex items-center gap-1 rounded-lg border border-ink-200 px-2.5 py-1.5 text-xs font-medium text-ink-600 hover:bg-ink-50"><FileText size={13} /> Template</button>
          {showTemplates && (
            <div className="absolute bottom-10 left-0 z-20 max-h-60 w-64 overflow-y-auto rounded-xl border border-ink-200 bg-white p-1.5 shadow-soft">
              {activeTemplates.length === 0 && <p className="px-2.5 py-3 text-xs text-ink-400">No approved templates</p>}
              {activeTemplates.map((t) => (
                <button key={t.id} onClick={() => { setText(t.body_message); setShowTemplates(false); }} className="block w-full rounded-lg px-2.5 py-2 text-left hover:bg-ink-50">
                  <span className="block text-sm font-medium text-ink-800">{t.template_name}</span>
                  <span className="block truncate text-xs text-ink-500">{t.body_message}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="relative">
          <button onClick={() => { setShowVars((v) => !v); setShowAi(false); setShowTemplates(false); }} className="rounded-lg border border-ink-200 px-2.5 py-1.5 text-xs font-medium text-ink-600 hover:bg-ink-50">{'{ } Variables'}</button>
          {showVars && (
            <div className="absolute bottom-10 left-0 z-20 grid w-56 grid-cols-1 gap-0.5 rounded-xl border border-ink-200 bg-white p-1.5 shadow-soft">
              {VARIABLES.map((v) => (
                <button key={v} onClick={() => { insert(v); }} className="rounded px-2 py-1.5 text-left font-mono text-xs text-brand-700 hover:bg-brand-50">{v}</button>
              ))}
            </div>
          )}
        </div>
      </div>

      {lead?.opt_out_status && (
        <div className="mb-2 flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
          <X size={14} /> This contact has opted out. Messages will be blocked & logged.
        </div>
      )}

      <div className="flex items-end gap-2">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) send(); }}
          rows={2}
          placeholder="Type a message…  (⌘/Ctrl + Enter to send)"
          className="input flex-1 resize-none"
        />
        <div className="flex flex-col gap-1.5">
          <Button onClick={send}><Send size={16} /></Button>
          <button onClick={() => { toast.success('Message scheduled', 'Will send at next optimal time'); setText(''); }} title="Schedule" className="rounded-lg border border-ink-200 p-2 text-ink-500 hover:bg-ink-50"><Clock size={15} /></button>
        </div>
      </div>
    </div>
  );
}
