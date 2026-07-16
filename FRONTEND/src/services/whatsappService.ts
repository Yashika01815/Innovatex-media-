import { getAdapter } from '@/services/whatsappAdapters';
import type { WhatsAppProvider, ProviderResponse } from '@/types';

/**
 * Common entry point that routes a WhatsApp message through the correct
 * provider adapter based on the tenant's configured provider. The store calls
 * this, then persists the resulting message + delivery log + tracking event.
 */
export function sendWhatsAppMessage(provider: WhatsAppProvider, to: string, body: string): ProviderResponse {
  const adapter = getAdapter(provider);
  return adapter.sendMessage(to, body);
}

export function sendWhatsAppTemplate(
  provider: WhatsAppProvider,
  to: string,
  templateName: string,
  vars: Record<string, string>,
): ProviderResponse {
  return getAdapter(provider).sendTemplate(to, templateName, vars);
}

export function submitTemplateToProvider(provider: WhatsAppProvider, templateName: string) {
  return getAdapter(provider).submitTemplate(templateName);
}

export function syncFromProvider(provider: WhatsAppProvider) {
  const adapter = getAdapter(provider);
  return {
    messages: adapter.syncMessages(),
    templates: adapter.syncTemplates(),
    contacts: adapter.syncContacts(),
  };
}

export const OPT_OUT_KEYWORDS = ['STOP', 'UNSUBSCRIBE', 'CANCEL', 'NO', 'REMOVE'];

export function isOptOutMessage(body: string): boolean {
  return OPT_OUT_KEYWORDS.includes(body.trim().toUpperCase());
}
