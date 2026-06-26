export const TEMPLATE_CATEGORY = Object.freeze({
  MARKETING: 'MARKETING',
  UTILITY: 'UTILITY',
  AUTHENTICATION: 'AUTHENTICATION',
  BOOKING: 'BOOKING',
  PAYMENT: 'PAYMENT',
  FOLLOW_UP: 'FOLLOW_UP',
  REMINDER: 'REMINDER',
  SUPPORT: 'SUPPORT',
  SALES: 'SALES',
  CUSTOM: 'CUSTOM',
});
export const TEMPLATE_CATEGORY_VALUES = Object.freeze(Object.values(TEMPLATE_CATEGORY));

export const TEMPLATE_STATUS = Object.freeze({
  DRAFT: 'DRAFT',
  SUBMITTED: 'SUBMITTED',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  ACTIVE: 'ACTIVE',
  PAUSED: 'PAUSED',
  ARCHIVED: 'ARCHIVED',
});
export const TEMPLATE_STATUS_VALUES = Object.freeze(Object.values(TEMPLATE_STATUS));

export const APPROVAL_STATUS = Object.freeze({
  DRAFT: 'DRAFT',
  SUBMITTED_FOR_INTERNAL_REVIEW: 'SUBMITTED_FOR_INTERNAL_REVIEW',
  INTERNALLY_APPROVED: 'INTERNALLY_APPROVED',
  CHANGES_REQUESTED: 'CHANGES_REQUESTED',
  REJECTED_INTERNALLY: 'REJECTED_INTERNALLY',
  SUBMITTED_TO_PROVIDER: 'SUBMITTED_TO_PROVIDER',
  PROVIDER_APPROVED: 'PROVIDER_APPROVED',
  PROVIDER_REJECTED: 'PROVIDER_REJECTED',
  ACTIVE: 'ACTIVE',
  PAUSED: 'PAUSED',
  ARCHIVED: 'ARCHIVED',
  // Extended by the templateApproval module
  REJECTED: 'REJECTED',
  DISABLED: 'DISABLED',
});
export const APPROVAL_STATUS_VALUES = Object.freeze(Object.values(APPROVAL_STATUS));

export const PROVIDER = Object.freeze({
  META_CLOUD: 'META_CLOUD',
  WATI: 'WATI',
  INTERAKT: 'INTERAKT',
  AISENSY: 'AISENSY',
  GALLABOX: 'GALLABOX',
  TWILIO: 'TWILIO',
  DIALOG360: '360DIALOG',
  CUSTOM_WEBHOOK: 'CUSTOM_WEBHOOK',
  SIMULATION: 'SIMULATION',
});
export const PROVIDER_VALUES = Object.freeze(Object.values(PROVIDER));

export const PROVIDER_STATUS = Object.freeze({
  PENDING: 'PENDING',
  UNDER_REVIEW: 'UNDER_REVIEW',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  SYNCED: 'SYNCED',
  ERROR: 'ERROR',
});
export const PROVIDER_STATUS_VALUES = Object.freeze(Object.values(PROVIDER_STATUS));

export const HEADER_TYPE = Object.freeze({
  NONE: 'NONE',
  TEXT: 'TEXT',
  IMAGE: 'IMAGE',
  VIDEO: 'VIDEO',
  DOCUMENT: 'DOCUMENT',
});
export const HEADER_TYPE_VALUES = Object.freeze(Object.values(HEADER_TYPE));

export const BUTTON_TYPE = Object.freeze({
  QUICK_REPLY: 'QUICK_REPLY',
  PHONE_NUMBER: 'PHONE_NUMBER',
  URL: 'URL',
  COPY_CODE: 'COPY_CODE',
  FLOW: 'FLOW',
  CUSTOM: 'CUSTOM',
});
export const BUTTON_TYPE_VALUES = Object.freeze(Object.values(BUTTON_TYPE));

// Button types that require a value (phone number, url, code, flow id).
export const BUTTON_TYPES_REQUIRING_VALUE = Object.freeze([
  BUTTON_TYPE.PHONE_NUMBER,
  BUTTON_TYPE.URL,
  BUTTON_TYPE.COPY_CODE,
  BUTTON_TYPE.FLOW,
]);

// Content limits (aligned with WhatsApp Cloud API).
export const MAX_BUTTONS = 10;
export const MAX_BODY_LENGTH = 1024;
export const MAX_FOOTER_LENGTH = 60;
export const MAX_HEADER_TEXT_LENGTH = 60;
export const MAX_BUTTON_TEXT_LENGTH = 25;

// {{variable}} detection — letters, digits, underscore.
export const VARIABLE_PATTERN = '\\{\\{\\s*([a-zA-Z0-9_]+)\\s*\\}\\}';

export const SUPPORTED_LANGUAGES = Object.freeze([
  { code: 'en', name: 'English' },
  { code: 'en_US', name: 'English (US)' },
  { code: 'en_GB', name: 'English (UK)' },
  { code: 'hi', name: 'Hindi' },
  { code: 'hi_IN', name: 'Hindi (India)' },
  { code: 'ar', name: 'Arabic' },
  { code: 'es', name: 'Spanish' },
  { code: 'es_ES', name: 'Spanish (Spain)' },
  { code: 'fr', name: 'French' },
  { code: 'fr_FR', name: 'French (France)' },
  { code: 'pt_BR', name: 'Portuguese (Brazil)' },
  { code: 'de', name: 'German' },
]);

export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 20;
export const MAX_LIMIT = 100;

export const SEARCHABLE_FIELDS = Object.freeze(['name', 'slug', 'description', 'body']);
export const SORTABLE_FIELDS = Object.freeze([
  'createdAt',
  'updatedAt',
  'name',
  'usageCount',
  'lastUsedAt',
  'version',
]);
