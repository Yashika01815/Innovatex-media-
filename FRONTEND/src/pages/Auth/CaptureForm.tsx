import { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Zap, CheckCircle2, ArrowRight } from 'lucide-react';
import { useStore } from '@/store/store';
import { Button, Input, Field, Select, Badge } from '@/components/ui';

/**
 * Public demo lead-capture form. Captures UTM params from the URL query string
 * and creates a real lead + tracking event in the demo database.
 * Example: /capture?source=facebook&utm_source=meta&utm_medium=paid&utm_campaign=coach_webinar
 */
export function CaptureForm() {
  const [params] = useSearchParams();
  const createLead = useStore((s) => s.createLead);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', company: '', segment: 'Coaches', problem: '' });

  const utm = {
    source: params.get('source') || params.get('utm_source') || 'Direct',
    medium: params.get('utm_medium') || params.get('medium') || 'organic',
    campaign: params.get('utm_campaign') || params.get('campaign') || '',
    utm_source: params.get('utm_source') || '',
    utm_medium: params.get('utm_medium') || '',
    utm_campaign: params.get('utm_campaign') || '',
    utm_content: params.get('utm_content') || '',
    utm_term: params.get('utm_term') || '',
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    createLead({
      name: form.name, email: form.email, phone: form.phone, whatsapp_number: form.phone,
      company: form.company, segment: form.segment, notes: form.problem ? `Problem: ${form.problem}` : '',
      source: utm.source, medium: utm.medium, campaign: utm.campaign,
      utm_source: utm.utm_source, utm_medium: utm.utm_medium, utm_campaign: utm.utm_campaign,
      utm_content: utm.utm_content, utm_term: utm.utm_term, consent_status: 'granted',
    });
    setSubmitted(true);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-ink-50 to-brand-50 p-4">
      <div className="w-full max-w-md">
        <div className="mb-6 flex items-center justify-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-violet-500 text-white">
            <Zap size={20} fill="white" />
          </div>
          <div>
            <p className="font-bold text-ink-900">InnovateX Revenue OS</p>
            <p className="text-xs text-ink-500">Book your free strategy session</p>
          </div>
        </div>

        <div className="card p-6">
          {submitted ? (
            <div className="py-6 text-center">
              <CheckCircle2 size={48} className="mx-auto text-emerald-500" />
              <h2 className="mt-4 text-xl font-bold text-ink-900">You're in! 🎉</h2>
              <p className="mt-2 text-sm text-ink-500">Your details were captured and a lead was created in the demo CRM with full source attribution.</p>
              <div className="mt-4 flex flex-wrap justify-center gap-1.5">
                <Badge tone="blue">source: {utm.source}</Badge>
                {utm.campaign && <Badge tone="violet">campaign: {utm.campaign}</Badge>}
                {utm.utm_medium && <Badge tone="teal">medium: {utm.utm_medium}</Badge>}
              </div>
              <Link to="/leads" className="mt-6 inline-flex">
                <Button>View captured lead <ArrowRight size={16} /></Button>
              </Link>
            </div>
          ) : (
            <>
              <h2 className="text-lg font-bold text-ink-900">Tell us about your business</h2>
              <p className="mt-1 text-sm text-ink-500">We'll match you with the right revenue plan.</p>
              {utm.source !== 'Direct' && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <Badge tone="blue">source: {utm.source}</Badge>
                  {utm.campaign && <Badge tone="violet">{utm.campaign}</Badge>}
                </div>
              )}
              <form onSubmit={submit} className="mt-4 space-y-3.5">
                <Field label="Full name"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></Field>
                <Field label="Work email"><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /></Field>
                <Field label="WhatsApp number"><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+1 415 555 0100" required /></Field>
                <Field label="Company"><Input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} /></Field>
                <Field label="I am a…">
                  <Select value={form.segment} onChange={(e) => setForm({ ...form, segment: e.target.value })}>
                    {['Coaches', 'EdTech', 'SaaS Founders', 'Ecommerce', 'Agencies', 'Consultants'].map((s) => <option key={s}>{s}</option>)}
                  </Select>
                </Field>
                <Field label="What's your biggest revenue challenge?">
                  <Input value={form.problem} onChange={(e) => setForm({ ...form, problem: e.target.value })} placeholder="e.g. slow lead follow-up" />
                </Field>
                <Button type="submit" className="w-full">Get my free session <ArrowRight size={16} /></Button>
              </form>
            </>
          )}
        </div>
        <p className="mt-4 text-center text-xs text-ink-400">
          <Link to="/login" className="font-medium text-brand-600 hover:underline">← Back to sign in</Link>
        </p>
      </div>
    </div>
  );
}
