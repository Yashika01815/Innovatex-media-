/**
 * WhatsApp AI Reply Assistant — constants.
 *
 * All enums, defaults, and role mappings for the module.
 */
import { ROLES } from '../../../auth/constants/roles.js';

// ── Prompt categories ──────────────────────────────────────────────────────────
export const PROMPT_CATEGORY = Object.freeze({
  GENERAL_REPLY:  'GENERAL_REPLY',
  FOLLOW_UP:      'FOLLOW_UP',
  BOOKING:        'BOOKING',
  PAYMENT:        'PAYMENT',
  OBJECTION:      'OBJECTION',
  QUALIFICATION:  'QUALIFICATION',
  WELCOME:        'WELCOME',
  THANK_YOU:      'THANK_YOU',
  NURTURE:        'NURTURE',
  CUSTOM:         'CUSTOM',
});
export const PROMPT_CATEGORY_VALUES = Object.freeze(Object.values(PROMPT_CATEGORY));

// ── Supported tones ────────────────────────────────────────────────────────────
export const TONE = Object.freeze({
  PROFESSIONAL: 'Professional',
  FRIENDLY:     'Friendly',
  PERSUASIVE:   'Persuasive',
  FORMAL:       'Formal',
  EMPATHETIC:   'Empathetic',
  URGENT:       'Urgent',
  CASUAL:       'Casual',
});
export const TONE_VALUES = Object.freeze(Object.values(TONE));

// ── Rewrite styles ─────────────────────────────────────────────────────────────
export const REWRITE_STYLE = Object.freeze({
  SHORTER:       'SHORTER',
  LONGER:        'LONGER',
  PROFESSIONAL:  'PROFESSIONAL',
  FRIENDLY:      'FRIENDLY',
  PERSUASIVE:    'PERSUASIVE',
  FORMAL:        'FORMAL',
  EMPATHETIC:    'EMPATHETIC',
  GRAMMAR:       'GRAMMAR',
  SIMPLIFY:      'SIMPLIFY',
});
export const REWRITE_STYLE_VALUES = Object.freeze(Object.values(REWRITE_STYLE));

// ── Supported AI providers ─────────────────────────────────────────────────────
export const AI_PROVIDER = Object.freeze({
  MOCK:    'MOCK',
  OPENAI:  'OPENAI',
  GEMINI:  'GEMINI',
  CLAUDE:  'CLAUDE',
});
export const AI_PROVIDER_VALUES = Object.freeze(Object.values(AI_PROVIDER));

// Active provider — switch via env without changing any other code.
export const ACTIVE_AI_PROVIDER = process.env.AI_PROVIDER || AI_PROVIDER.MOCK;

// ── Supported variables (identical to Templates module) ───────────────────────
export const SUPPORTED_VARIABLES = Object.freeze([
  'lead_name',
  'company_name',
  'offer_name',
  'booking_link',
  'payment_link',
  'sales_rep_name',
  'call_date',
  'lead_problem',
  'campaign_name',
  'qualification_score',
]);

// ── Variable pattern (same regex as Templates) ────────────────────────────────
export const VARIABLE_PATTERN = '\\{\\{\\s*([a-zA-Z0-9_]+)\\s*\\}\\}';

// ── Pagination defaults ────────────────────────────────────────────────────────
export const DEFAULT_PAGE  = 1;
export const DEFAULT_LIMIT = 20;
export const MAX_LIMIT     = 100;

// ── Content limits ─────────────────────────────────────────────────────────────
export const MAX_PROMPT_LENGTH          = 2000;
export const MAX_GENERATED_TEXT_LENGTH  = 4000;
export const MAX_CONVERSATION_LENGTH    = 10000;

// ── Role permissions ──────────────────────────────────────────────────────────
export const ROLE_MIN = Object.freeze({
  // Prompt CRUD
  CREATE_PROMPT:    ROLES.TENANT_ADMIN,
  READ_PROMPT:      ROLES.SALES_USER,
  UPDATE_PROMPT:    ROLES.TENANT_ADMIN,
  DELETE_PROMPT:    ROLES.TENANT_ADMIN,
  // AI features
  GENERATE:         ROLES.SALES_USER,
  REWRITE:          ROLES.SALES_USER,
  SUMMARIZE:        ROLES.SALES_USER,
  SUGGESTIONS:      ROLES.SALES_USER,
  SAVE_TEMPLATE:    ROLES.TENANT_ADMIN,
  SAVE_PROMPT:      ROLES.SALES_USER,
});
