import { useState } from 'react';
import { Plus, Trash2, Smartphone } from 'lucide-react';
import { useStore } from '@/store/store';
import { Modal, Button, Input, Field, Select, Textarea, Badge } from '@/components/ui';
import type { WhatsAppTemplate, TemplateCategory, ButtonType, TemplateButton } from '@/types';

const CATEGORIES: TemplateCategory[] = ['Marketing', 'Utility', 'Authentication', 'Follow-up', 'Booking', 'Payment', 'Reminder', 'Re-engagement', 'Onboarding', 'Support'];
const BUTTON_TYPES: ButtonType[] = ['Quick reply', 'Visit website', 'Call phone number', 'Copy code', 'Booking link', 'Payment link'];

export function TemplateBuilder({ template, onClose }: { template?: WhatsAppTemplate; onClose: () => void }) {
  const { createTemplate, updateTemplate } = useStore();
  const isEdit = Boolean(template);
  const [form, setForm] = useState({
    template_name: template?.template_name ?? '',
    category: template?.category ?? 'Marketing' as TemplateCategory,
    language: template?.language ?? 'en_US',
    header_type: template?.header_type ?? 'none' as WhatsAppTemplate['header_type'],
    header_content: template?.header_content ?? '',
    body_message: template?.body_message ?? '',
    footer: template?.footer ?? '',
  });
  const [buttons, setButtons] = useState<TemplateButton[]>(template?.buttons ?? []);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const vars = Array.from(new Set((form.body_message.match(/\{\{(\w+)\}\}/g) || []).map((v) => v.replace(/[{}]/g, ''))));

  const preview = form.body_message.replace(/\{\{(\w+)\}\}/g, (_, v) => `[${v}]`);

  const save = () => {
    if (isEdit && template) {
      updateTemplate(template.id, { ...form, buttons, variables: vars });
    } else {
      createTemplate({ ...form, buttons });
    }
    onClose();
  };

  return (
    <Modal
      open onClose={onClose} title={isEdit ? 'Edit Template' : 'WhatsApp Template Builder'} size="xl"
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={save}>{isEdit ? 'Save template' : 'Create template'}</Button></>}
    >
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Form */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Template name"><Input value={form.template_name} onChange={(e) => set('template_name', e.target.value.replace(/\s/g, '_').toLowerCase())} placeholder="welcome_hot_lead" /></Field>
            <Field label="Language"><Select value={form.language} onChange={(e) => set('language', e.target.value)}><option value="en_US">English (US)</option><option value="en_GB">English (UK)</option><option value="es_ES">Spanish</option><option value="pt_BR">Portuguese</option></Select></Field>
          </div>
          <Field label="Category"><Select value={form.category} onChange={(e) => set('category', e.target.value)}>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</Select></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Header type"><Select value={form.header_type} onChange={(e) => set('header_type', e.target.value)}><option value="none">None</option><option value="text">Text</option><option value="image">Image</option><option value="video">Video</option><option value="document">Document</option></Select></Field>
            {form.header_type === 'text' && <Field label="Header text"><Input value={form.header_content} onChange={(e) => set('header_content', e.target.value)} /></Field>}
          </div>
          <Field label="Body message" hint="Use {{variable}} placeholders">
            <Textarea rows={5} value={form.body_message} onChange={(e) => set('body_message', e.target.value)} placeholder="Hi {{lead_name}}! Thanks for your interest…" />
          </Field>
          <Field label="Footer"><Input value={form.footer} onChange={(e) => set('footer', e.target.value)} placeholder="Reply STOP to unsubscribe" /></Field>

          {vars.length > 0 && (
            <div>
              <p className="label">Detected variables</p>
              <div className="flex flex-wrap gap-1.5">{vars.map((v) => <Badge key={v} tone="violet">{`{{${v}}}`}</Badge>)}</div>
            </div>
          )}

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <p className="label !mb-0">Buttons</p>
              <Button variant="ghost" className="px-2 py-1 text-xs" onClick={() => setButtons([...buttons, { type: 'Quick reply', text: '' }])}><Plus size={13} /> Add button</Button>
            </div>
            <div className="space-y-2">
              {buttons.map((b, i) => (
                <div key={i} className="flex gap-2">
                  <Select value={b.type} onChange={(e) => setButtons(buttons.map((x, j) => j === i ? { ...x, type: e.target.value as ButtonType } : x))} className="w-40 py-1.5 text-sm">
                    {BUTTON_TYPES.map((t) => <option key={t}>{t}</option>)}
                  </Select>
                  <Input value={b.text} onChange={(e) => setButtons(buttons.map((x, j) => j === i ? { ...x, text: e.target.value } : x))} placeholder="Button label" className="py-1.5 text-sm" />
                  <button onClick={() => setButtons(buttons.filter((_, j) => j !== i))} className="rounded-lg p-2 text-ink-400 hover:bg-red-50 hover:text-red-600"><Trash2 size={15} /></button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Preview */}
        <div>
          <p className="label">Live preview</p>
          <div className="rounded-2xl bg-gradient-to-b from-emerald-50 to-teal-50 p-4">
            <div className="mx-auto max-w-[300px] rounded-2xl bg-[#e5ddd5] p-3 shadow-inner" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(0,0,0,0.04) 1px, transparent 0)', backgroundSize: '16px 16px' }}>
              <div className="rounded-lg rounded-tl-sm bg-white p-3 shadow-sm">
                {form.header_type === 'text' && form.header_content && <p className="mb-1 font-bold text-ink-900">{form.header_content}</p>}
                {form.header_type !== 'none' && form.header_type !== 'text' && <div className="mb-2 flex h-24 items-center justify-center rounded-md bg-ink-100 text-xs text-ink-400 capitalize">{form.header_type} header</div>}
                <p className="whitespace-pre-line text-sm text-ink-800">{preview || 'Your message preview will appear here…'}</p>
                {form.footer && <p className="mt-2 text-[11px] text-ink-400">{form.footer}</p>}
                <p className="mt-1 text-right text-[10px] text-ink-400">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
              </div>
              {buttons.map((b, i) => (
                <div key={i} className="mt-1.5 rounded-lg bg-white py-2 text-center text-sm font-semibold text-brand-600 shadow-sm">{b.text || b.type}</div>
              ))}
            </div>
            <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-ink-500"><Smartphone size={13} /> WhatsApp preview · {form.category}</p>
          </div>
        </div>
      </div>
    </Modal>
  );
}
