/**
 * WhatsApp Settings — constants.
 *
 * Central configuration enums + defaults + role mappings.
 * Only ONE settings document exists per tenant.
 */
import { ROLES } from '../../../auth/constants/roles.js';

// ── Providers (mirrors the values used across templates/deliveryLogs) ─────────
export const PROVIDER = Object.freeze({
  META_CLOUD:      'META_CLOUD',
  WATI:            'WATI',
  INTERAKT:        'INTERAKT',
  AISENSY:         'AISENSY',
  GALLABOX:        'GALLABOX',
  TWILIO:          'TWILIO',
  DIALOG360:       '360DIALOG',
  CUSTOM_WEBHOOK:  'CUSTOM_WEBHOOK',
  SIMULATION:      'SIMULATION',
});
export const PROVIDER_VALUES = Object.freeze(Object.values(PROVIDER));

// ── Provider mode ──────────────────────────────────────────────────────────────
export const PROVIDER_MODE = Object.freeze({
  LIVE:       'LIVE',
  SANDBOX:    'SANDBOX',
  SIMULATION: 'SIMULATION',
});
export const PROVIDER_MODE_VALUES = Object.freeze(Object.values(PROVIDER_MODE));

// ── AI providers (mirrors aiReplyAssistant) ────────────────────────────────────
export const AI_PROVIDER = Object.freeze({
  MOCK:   'MOCK',
  OPENAI: 'OPENAI',
  GEMINI: 'GEMINI',
  CLAUDE: 'CLAUDE',
});
export const AI_PROVIDER_VALUES = Object.freeze(Object.values(AI_PROVIDER));

// ── Graph API versions accepted for Meta Cloud ─────────────────────────────────
export const GRAPH_API_VERSION_PATTERN = /^v\d{2}\.\d$/;   // e.g. v19.0, v21.0

// ── Business verticals (Meta-defined high-level categories) ────────────────────
export const BUSINESS_VERTICAL = Object.freeze({
  AUTOMOTIVE: 'AUTOMOTIVE',
  BEAUTY:     'BEAUTY',
  EDUCATION:  'EDUCATION',
  ENTERTAINMENT: 'ENTERTAINMENT',
  FINANCE:    'FINANCE',
  HEALTH:     'HEALTH',
  HOTEL:      'HOTEL',
  ECOMMERCE:  'ECOMMERCE',
  PROFESSIONAL_SERVICES: 'PROFESSIONAL_SERVICES',
  RETAIL:     'RETAIL',
  TRAVEL:     'TRAVEL',
  OTHER:      'OTHER',
});
export const BUSINESS_VERTICAL_VALUES = Object.freeze(Object.values(BUSINESS_VERTICAL));

// ── Sync entities (used by POST /settings/sync/:entity helpers) ────────────────
export const SYNC_ENTITY = Object.freeze({
  TEMPLATES: 'TEMPLATES',
  CONTACTS:  'CONTACTS',
  MESSAGES:  'MESSAGES',
  PROFILE:   'PROFILE',
});

// Fields that must NEVER be returned to clients.
export const SENSITIVE_FIELDS = Object.freeze([
  'meta.accessToken',
  'meta.appSecret',
  'meta.verifyToken',
]);

// ── Default settings document (deep-merged on create) ──────────────────────────
export const DEFAULT_SETTINGS = Object.freeze({
  provider:     PROVIDER.SIMULATION,
  providerMode: PROVIDER_MODE.SIMULATION,

  meta: {
    businessAccountId: '',
    phoneNumberId:     '',
    accessToken:       '',
    verifyToken:       '',
    appId:             '',
    appSecret:         '',
    graphApiVersion:   'v21.0',
    webhookUrl:        '',
    connected:         false,
    connectedAt:       null,
    lastVerifiedAt:    null,
  },

  businessProfile: {
    displayName:      '',
    about:            '',
    description:      '',
    email:            '',
    website:          '',
    address:          '',
    profilePicture:   '',
    vertical:         BUSINESS_VERTICAL.OTHER,
    businessCategory: '',
  },

  messaging: {
    defaultLanguage:  'en',
    defaultTemplate:  null,
    typingIndicator:  true,
    readReceipts:     true,
    deliveryReceipts: true,
    autoMarkRead:     false,
    replyDelay:       0,          // seconds
    timezone:         'Asia/Kolkata',
  },

  media: {
    maxUploadSize:     16,        // MB
    allowedExtensions: ['jpg', 'jpeg', 'png', 'pdf', 'mp4', 'mp3', 'docx'],
    imageCompression:  true,
    videoCompression:  true,
    documentPreview:   true,
    audioSupport:      true,
    stickerSupport:    true,
  },

  ai: {
    enabled:             false,
    provider:            AI_PROVIDER.MOCK,
    model:               'mock-1',
    temperature:         0.7,
    maxTokens:           1024,
    confidenceThreshold: 0.6,
    fallbackReply:       'Thanks for your message! A team member will get back to you shortly.',
    humanHandoff:        true,
  },

  automation: {
    enabled:              true,
    retryFailedMessages:  true,
    retryAttempts:        3,
    retryInterval:        5,      // minutes
    defaultExecutionDelay: 0,     // minutes
  },

  notifications: {
    campaignCompleted:     true,
    templateRejected:      true,
    providerDisconnected:  true,
    failedMessages:        true,
    quotaExceeded:         true,
    systemAlerts:          true,
  },

  security: {
    encryptAccessToken: true,
    ipWhitelist:        [],
    allowedDomains:     [],
    auditEnabled:       true,
    apiKeyRotation:     false,
  },

  sync: {
    autoSyncTemplates:       false,
    autoSyncContacts:        false,
    autoSyncMessages:        false,
    autoSyncBusinessProfile: false,
    lastSyncAt:              null,
  },

  limits: {
    dailyMessages:   1000,
    monthlyMessages: 30000,
    contacts:        10000,
    campaigns:       100,
    broadcasts:      100,
    templates:       250,
    apiRequests:     10000,
  },

  advanced: {
    simulationMode:  true,
    developerMode:   false,
    debugMode:       false,
    maintenanceMode: false,
  },
});

// ── Role permissions ──────────────────────────────────────────────────────────
export const ROLE_MIN = Object.freeze({
  READ:   ROLES.SALES_USER,     // sales/marketing can VIEW settings
  CREATE: ROLES.TENANT_OWNER,   // only owner can create/modify
  UPDATE: ROLES.TENANT_OWNER,
  TEST:   ROLES.TENANT_OWNER,
  SYNC:   ROLES.TENANT_OWNER,
  RESET:  ROLES.TENANT_OWNER,
});
