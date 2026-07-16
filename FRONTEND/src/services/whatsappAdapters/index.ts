import type { WhatsAppAdapter, WhatsAppProvider, ProviderResponse, MessageStatus } from '@/types';
import { uid } from '@/utils/id';

// A single factory builds a simulated adapter for any provider. Each provider
// has slightly different latency/quirks so the demo "feels" like real BSPs.
function makeAdapter(name: WhatsAppProvider, opts: { reliability: number; brand: string }): WhatsAppAdapter {
  const statusRoll = (): MessageStatus => {
    const r = Math.random();
    if (r > opts.reliability) return 'Failed';
    if (r > 0.7) return 'Read';
    if (r > 0.35) return 'Delivered';
    return 'Sent';
  };
  return {
    name,
    sendMessage(to, body): ProviderResponse {
      const status = statusRoll();
      return {
        ok: status !== 'Failed',
        provider: name,
        message_id: uid('wamid'),
        status,
        raw: { provider: opts.brand, to, preview: body.slice(0, 40), accepted: status !== 'Failed' },
        error: status === 'Failed' ? 'Simulated provider delivery failure' : undefined,
      };
    },
    sendTemplate(to, templateName, vars): ProviderResponse {
      const status = statusRoll();
      return {
        ok: status !== 'Failed',
        provider: name,
        message_id: uid('wamid'),
        status,
        raw: { provider: opts.brand, to, template: templateName, vars },
      };
    },
    syncMessages: () => ({ synced: Math.floor(Math.random() * 30) + 5 }),
    syncTemplates: () => ({ synced: Math.floor(Math.random() * 10) + 1 }),
    syncContacts: () => ({ synced: Math.floor(Math.random() * 50) + 10 }),
    getDeliveryStatus: () => statusRoll(),
    submitTemplate: (templateName) => ({ ok: true, status: `Submitted ${templateName} to ${opts.brand}` }),
    getTemplateStatus: () => (Math.random() > 0.2 ? 'Provider Approved' : 'Provider Pending'),
  };
}

export const metaWhatsAppAdapter = makeAdapter('Native Meta Cloud API', { reliability: 0.97, brand: 'Meta Cloud' });
export const watiAdapter = makeAdapter('WATI', { reliability: 0.95, brand: 'WATI' });
export const interaktAdapter = makeAdapter('Interakt', { reliability: 0.94, brand: 'Interakt' });
export const aisensyAdapter = makeAdapter('AiSensy', { reliability: 0.93, brand: 'AiSensy' });
export const gallaboxAdapter = makeAdapter('Gallabox', { reliability: 0.93, brand: 'Gallabox' });
export const twilioWhatsAppAdapter = makeAdapter('Twilio WhatsApp', { reliability: 0.96, brand: 'Twilio' });
export const dialog360Adapter = makeAdapter('360dialog', { reliability: 0.95, brand: '360dialog' });
export const customWebhookAdapter = makeAdapter('Custom Webhook Provider', { reliability: 0.9, brand: 'Custom Webhook' });
export const simulationWhatsAppAdapter = makeAdapter('Simulation Mode', { reliability: 1, brand: 'Simulation' });

export const adapters: Record<WhatsAppProvider, WhatsAppAdapter> = {
  'Native Meta Cloud API': metaWhatsAppAdapter,
  WATI: watiAdapter,
  Interakt: interaktAdapter,
  AiSensy: aisensyAdapter,
  Gallabox: gallaboxAdapter,
  'Twilio WhatsApp': twilioWhatsAppAdapter,
  '360dialog': dialog360Adapter,
  'Custom Webhook Provider': customWebhookAdapter,
  'Simulation Mode': simulationWhatsAppAdapter,
};

export function getAdapter(provider: WhatsAppProvider): WhatsAppAdapter {
  return adapters[provider] ?? simulationWhatsAppAdapter;
}
