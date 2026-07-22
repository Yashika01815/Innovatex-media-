/**
 * Real WhatsApp Settings types -- match the backend model exactly.
 *
 * SOURCE: src/modules/whatsapp/submodules/whatsappSettings/whatsappSettings.model.js
 * Standard envelope (unlike Leads/Pipeline/Messages) -- uses request(), not requestRaw().
 *
 * SCOPED to Phase 1: the Provider Settings screen (provider connection +
 * sync toggles) -- the other 8 settings sections (business profile,
 * messaging, media, ai, automation, notifications, security, limits)
 * exist on the backend but aren't part of this screen, so they're not
 * fully typed here.
 *
 * IMPORTANT: accessToken/appSecret/verifyToken are NEVER returned by the
 * API (stripped server-side) -- only hasAccessToken/hasAppSecret/
 * hasVerifyToken booleans, so the UI can show "already set" without ever
 * seeing the real secret again. This is deliberate backend behavior, not
 * a bug to work around.
 */

export type WhatsAppProvider =
  | 'META_CLOUD' | 'WATI' | 'INTERAKT' | 'AISENSY' | 'GALLABOX'
  | 'TWILIO' | '360DIALOG' | 'CUSTOM_WEBHOOK' | 'SIMULATION';

export const PROVIDER_LABELS: Record<WhatsAppProvider, string> = {
  META_CLOUD: 'Native Meta Cloud API',
  WATI: 'WATI',
  INTERAKT: 'Interakt',
  AISENSY: 'AiSensy',
  GALLABOX: 'Gallabox',
  TWILIO: 'Twilio WhatsApp',
  '360DIALOG': '360dialog',
  CUSTOM_WEBHOOK: 'Custom Webhook Provider',
  SIMULATION: 'Simulation Mode',
};

export const IMPLEMENTED_PROVIDERS: WhatsAppProvider[] = ['META_CLOUD', 'SIMULATION'];

export type ProviderMode = 'LIVE' | 'SANDBOX' | 'SIMULATION';
export type PanelMode = 'NATIVE' | 'THIRD_PARTY';

export interface WhatsAppSettingsMeta {
  businessAccountId: string;
  phoneNumberId: string;
  graphApiVersion: string;
  webhookUrl: string;
  connected: boolean;
  connectedAt: string | null;
  lastVerifiedAt: string | null;
  displayPhoneNumber: string;
  verifiedName: string;
  hasAccessToken: boolean;
  hasAppSecret: boolean;
  hasVerifyToken: boolean;
}

export interface WhatsAppSettingsSync {
  autoSyncTemplates: boolean;
  autoSyncContacts: boolean;
  autoSyncMessages: boolean;
  autoSyncBusinessProfile: boolean;
  lastSyncAt: string | null;
}

export interface WhatsAppSettings {
  id: string;
  tenantId: string;
  provider: WhatsAppProvider;
  providerMode: ProviderMode;
  panelMode: PanelMode;
  meta: WhatsAppSettingsMeta;
  sync: WhatsAppSettingsSync;
  createdBy: string | null;
  updatedBy: string | null;
}

export interface UpdateProviderInput {
  provider?: WhatsAppProvider;
  providerMode?: ProviderMode;
  panelMode?: PanelMode;
  meta?: {
    businessAccountId?: string;
    phoneNumberId?: string;
    accessToken?: string;
    verifyToken?: string;
    appSecret?: string;
    graphApiVersion?: string;
    /** Settable directly (not just by Test Connection) -- used by the Disconnect action. */
    connected?: boolean;
  };
}

export interface UpdateSyncInput {
  autoSyncTemplates?: boolean;
  autoSyncContacts?: boolean;
  autoSyncMessages?: boolean;
  autoSyncBusinessProfile?: boolean;
}

export interface TestConnectionResult {
  connected: boolean;
  provider: WhatsAppProvider;
  displayPhoneNumber?: string;
  verifiedName?: string;
  message: string;
}