import { useState } from 'react';
import { Sparkles, ArrowRight, RotateCcw, Send, Flame, CheckCircle2 } from 'lucide-react';
import { useStore } from '@/store/store';
import { useDb, useSettings } from '@/store/hooks';
import { PageHeader, Card, CardHeader, Button, Select, Badge, Avatar, Textarea, EmptyState } from '@/components/ui';
import { qualifyLead, type QualificationResult } from '@/services/aiService';
import { isAiLive } from '@/services/aiService';

export function AIQualification() {
  const { db, tenantId } = useDb();
  const settings = useSettings();
  const { qualifyLead: applyQualification } = useStore();
  const leads = db.leads.filter((l) => l.tenant_id === tenantId && !l.archived);

  const [leadId, setLeadId] = useState(leads.find((l) => ['New', 'Contacted'].includes(l.status))?.id ?? leads[0]?.id ?? '');
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<QualificationResult | null>(null);

  const lead = db.leads.find((l) => l.id === leadId);
  const questions = settings.qualification_questions;

  const run = () => {
    if (!lead) return;
    setResult(qualifyLead(lead, answers));
  };

  const apply = (route: string) => {
    if (!lead || !result) return;
    applyQualification(lead.id, { score: result.score, temperature: result.temperature, reason: result.reason, nextAction: result.nextAction });
    setResult(null);
    setAnswers({});
    void route;
  };

  return (
    <div>
      <PageHeader
        title="AI Qualification"
        description="Run AI-powered discovery, score leads 1–10, and route them to booking, nurture or sales follow-up."
        breadcrumb={['Revenue', 'AI Qualification']}
        actions={<Badge tone={isAiLive() ? 'green' : 'violet'}>{isAiLive() ? 'Live AI' : 'Mock AI engine'}</Badge>}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Questionnaire */}
        <Card>
          <CardHeader title="Qualification Session" subtitle="Answer the discovery questions" action={<RotateCcw size={16} className="cursor-pointer text-ink-400 hover:text-ink-700" onClick={() => { setAnswers({}); setResult(null); }} />} />
          <div className="space-y-4 p-5">
            <div>
              <label className="label">Lead</label>
              <Select value={leadId} onChange={(e) => { setLeadId(e.target.value); setResult(null); setAnswers({}); }}>
                {leads.map((l) => <option key={l.id} value={l.id}>{l.name} — {l.company} ({l.status})</option>)}
              </Select>
            </div>
            {lead && (
              <div className="flex items-center gap-2.5 rounded-lg bg-ink-50 p-3">
                <Avatar name={lead.name} color="#6366f1" size={36} />
                <div className="flex-1"><p className="text-sm font-semibold">{lead.name}</p><p className="text-xs text-ink-500">{lead.source} · current score {lead.qualification_score}/10</p></div>
                <Badge tone={lead.lead_temperature === 'Hot' ? 'red' : lead.lead_temperature === 'Warm' ? 'amber' : 'gray'}>{lead.lead_temperature}</Badge>
              </div>
            )}
            {questions.map((q) => (
              <div key={q}>
                <label className="mb-1 block text-sm font-medium text-ink-700">{q}</label>
                <Textarea rows={1} value={answers[q] ?? ''} onChange={(e) => setAnswers({ ...answers, [q]: e.target.value })} placeholder="Type the prospect's answer…" />
              </div>
            ))}
            <Button onClick={run} className="w-full"><Sparkles size={16} /> Run AI Qualification</Button>
          </div>
        </Card>

        {/* Result */}
        <Card>
          <CardHeader title="AI Assessment" subtitle="Fit score, intent & recommended next action" />
          <div className="p-5">
            {!result ? (
              <EmptyState title="No assessment yet" description="Fill in the discovery answers and run the AI qualification engine." icon={<Sparkles size={20} />} />
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-4 rounded-xl bg-gradient-to-r from-brand-600 to-violet-600 p-4 text-white">
                  <div className="text-center">
                    <p className="text-4xl font-bold">{result.score}</p>
                    <p className="text-xs text-brand-100">/ 10 fit</p>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2"><Flame size={16} /><span className="font-semibold">{result.temperature} · {result.quality}</span></div>
                    <p className="mt-1 text-sm text-brand-50">{result.buyingIntent}</p>
                  </div>
                </div>

                <Detail label="Reasoning" value={result.reason} />
                <div className="grid grid-cols-2 gap-3">
                  <MiniDetail label="Urgency" value={result.urgency} />
                  <MiniDetail label="Recommended offer" value={result.recommendedOffer} />
                </div>
                <div>
                  <p className="label">Pain points</p>
                  <ul className="space-y-1">{result.painPoints.map((p, i) => <li key={i} className="flex items-start gap-2 text-sm text-ink-700"><CheckCircle2 size={14} className="mt-0.5 shrink-0 text-emerald-500" /> {p}</li>)}</ul>
                </div>
                <div className="rounded-lg border border-brand-200 bg-brand-50 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">Recommended next action</p>
                  <p className="text-sm font-medium text-ink-800">{result.nextAction}</p>
                </div>
                <div>
                  <p className="label">AI follow-up draft</p>
                  <p className="rounded-lg bg-ink-50 p-3 text-sm text-ink-700">{result.followUpDraft}</p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button onClick={() => apply('booking')} className="flex-1"><Send size={15} /> Apply & route to booking</Button>
                  <Button variant="secondary" onClick={() => apply('nurture')}>Route to nurture</Button>
                  <Button variant="secondary" onClick={() => apply('sales')}>Sales follow-up</Button>
                </div>
                <p className="text-center text-xs text-ink-400">Human override available — adjust the lead score anytime from the lead profile.</p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return <div><p className="label">{label}</p><p className="text-sm text-ink-700">{value}</p></div>;
}
function MiniDetail({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg border border-ink-100 p-3"><p className="text-[11px] text-ink-400">{label}</p><p className="text-sm font-medium text-ink-800">{value}</p></div>;
}
