/**
 * WhatsApp AI Reply Assistant — service.
 *
 * Contains ALL business logic:
 *   • Prompt CRUD (create, read, list, update, soft-delete, duplicate, toggle)
 *   • AI generation via provider abstraction (MOCK → plug in OpenAI/Gemini/Claude)
 *   • Rewrite, summarise, suggestions
 *   • Variable replacement
 *   • Usage tracking
 *   • Save-as-template (delegates to templatesService)
 *   • Save-as-prompt
 *
 * Provider selection: set AI_PROVIDER env var to MOCK | OPENAI | GEMINI | CLAUDE.
 * Only MOCK is implemented here; the others follow the same interface.
 */
import { AppError } from '../../../../shared/helpers/lead.helpers.js';
import { aiReplyAssistantRepository } from './aiReplyAssistant.repository.js';
import { templatesService } from '../templates/templates.service.js';
import {
  PROMPT_CATEGORY,
  TONE,
  REWRITE_STYLE,
  VARIABLE_PATTERN,
  ACTIVE_AI_PROVIDER,
  AI_PROVIDER,
  DEFAULT_PAGE,
  DEFAULT_LIMIT,
  MAX_LIMIT,
  MAX_PROMPT_LENGTH,
  MAX_GENERATED_TEXT_LENGTH,
} from './aiReplyAssistant.constants.js';

// ── Helpers ────────────────────────────────────────────────────────────────────

function toDTO(doc) {
  if (!doc) return null;
  const o = typeof doc.toObject === 'function' ? doc.toObject() : doc;
  const { _id, ...rest } = o;
  return { id: String(_id ?? o.id), ...rest };
}

// Re-export SEARCHABLE_FIELDS from constants using the same pattern as campaigns/broadcasts.
const SEARCHABLE = ['title', 'description', 'prompt'];

/** Replace {{variable}} tokens with supplied values. */
function interpolate(text, variables = {}) {
  if (!text) return '';
  const re = new RegExp(VARIABLE_PATTERN, 'g');
  return String(text).replace(re, (full, name) => {
    const val = variables[name];
    return val != null ? String(val) : full;
  });
}

/** Collect all {{variable}} names from a string. */
function extractVariableNames(text = '') {
  const re = new RegExp(VARIABLE_PATTERN, 'g');
  const found = new Set();
  let m;
  while ((m = re.exec(text)) !== null) found.add(m[1]);
  return [...found];
}

function escapeRegex(str = '') {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildFilter(query = {}) {
  const filter = {};
  if (query.category) filter.category = query.category;
  if (query.tone)     filter.tone = query.tone;
  if (query.isSystem !== undefined) filter.isSystem = query.isSystem === true || query.isSystem === 'true';
  // Default: only show active prompts unless explicitly asked for inactive.
  if (query.active !== undefined) {
    filter.isActive = query.active === true || query.active === 'true';
  } else {
    filter.isActive = true;
  }
  if (query.search) {
    const rx = new RegExp(escapeRegex(query.search), 'i');
    filter.$or = SEARCHABLE.map((f) => ({ [f]: rx }));
  }
  return filter;
}

function buildSort(sort) {
  const valid = ['createdAt', 'updatedAt', 'usageCount', 'title'];
  if (!sort) return { createdAt: -1 };
  const desc = sort.startsWith('-');
  const key  = desc ? sort.slice(1) : sort;
  return valid.includes(key) ? { [key]: desc ? -1 : 1 } : { createdAt: -1 };
}

function paging(query = {}) {
  const page  = Math.max(Number(query.page)  || DEFAULT_PAGE, 1);
  const limit = Math.min(Math.max(Number(query.limit) || DEFAULT_LIMIT, 1), MAX_LIMIT);
  return { page, limit, skip: (page - 1) * limit };
}

// ── AI Provider Abstraction ────────────────────────────────────────────────────
//
// Each provider exposes the same interface:
//   generate(params)     → { text, provider, confidence, tokens, latency }
//   rewrite(params)      → { text, provider, tokens, latency }
//   summarize(params)    → { summary, provider, tokens, latency }
//   suggestions(params)  → { nextAction, bookingSuggestion, paymentSuggestion, followUp, provider }
//
// To add OpenAI: create providers/openai.js with the same exports and import
// it in the factory below.

const mockProvider = {
  async generate({ conversation = [], lead = {}, goal = '', tone = 'Professional', language = 'en' }) {
    const start = Date.now();
    const leadName = lead.name || 'there';
    const company  = lead.company || 'your company';

    const toneMap = {
      Professional: `I hope this message finds you well.`,
      Friendly:     `Hey ${leadName}! Hope you're doing great!`,
      Persuasive:   `${leadName}, this is an opportunity you don't want to miss.`,
      Formal:       `Dear ${leadName}, I am writing to follow up.`,
      Empathetic:   `${leadName}, I completely understand your concerns.`,
      Urgent:       `${leadName}, time is running out — act now!`,
      Casual:       `Hey ${leadName}, just checking in!`,
    };

    const goalMap = {
      follow_up:   `Following up on our last conversation about ${company}.`,
      booking:     `I'd love to schedule a quick 15-minute call. Are you available this week?`,
      payment:     `Your payment link is ready. Please complete the payment at your earliest convenience.`,
      objection:   `I hear you, ${leadName}. Let me address that concern directly.`,
      qualification:`To better understand your needs, could you share a bit more about your current setup?`,
    };

    const opener = toneMap[tone] || toneMap['Professional'];
    const body   = goalMap[goal] || `Thank you for your interest in InnovateX.`;

    const text = `${opener}\n\n${body}\n\nLooking forward to hearing from you, ${leadName}!`;

    return {
      text,
      provider:    AI_PROVIDER.MOCK,
      confidence:  0.87,
      tokens:      text.split(' ').length * 1.3 | 0,
      latency:     Date.now() - start,
    };
  },

  async rewrite({ text = '', style = 'PROFESSIONAL' }) {
    const start = Date.now();
    const styleTransformations = {
      SHORTER:      (t) => t.split('. ').slice(0, 2).join('. ') + '.',
      LONGER:       (t) => `${t}\n\nI'd be happy to elaborate further and provide additional details at your convenience. Please don't hesitate to reach out.`,
      PROFESSIONAL: (t) => t.replace(/hey|hi there|sup/gi, 'Hello').replace(/!/g, '.'),
      FRIENDLY:     (t) => t.replace(/Dear|Good day/gi, 'Hi') + ' 😊',
      PERSUASIVE:   (t) => `${t}\n\nThis is a limited-time opportunity — don't miss out!`,
      FORMAL:       (t) => `Dear valued contact,\n\n${t}\n\nYours sincerely,`,
      EMPATHETIC:   (t) => `I completely understand where you're coming from. ${t}`,
      GRAMMAR:      (t) => t.trim().replace(/\s+/g, ' ').replace(/([.?!])([A-Z])/g, '$1 $2'),
      SIMPLIFY:     (t) => t.replace(/utilise/gi, 'use').replace(/commence/gi, 'start').replace(/terminate/gi, 'end'),
    };
    const transform = styleTransformations[style] || styleTransformations['PROFESSIONAL'];
    const rewritten = transform(text);
    return {
      text:      rewritten,
      provider:  AI_PROVIDER.MOCK,
      tokens:    rewritten.split(' ').length | 0,
      latency:   Date.now() - start,
    };
  },

  async summarize({ conversation = [], lead = {} }) {
    const start       = Date.now();
    const msgCount    = Array.isArray(conversation) ? conversation.length : 0;
    const leadName    = lead.name || 'the lead';
    const lastMessage = Array.isArray(conversation) && conversation.length > 0
      ? conversation[conversation.length - 1]?.content || ''
      : '';

    const summary = `Conversation with ${leadName} — ${msgCount} message(s). `
      + (lastMessage ? `Last message: "${String(lastMessage).slice(0, 100)}..."` : 'No messages yet.')
      + ` Overall sentiment appears positive. Recommended next step: follow up within 24 hours.`;

    return {
      summary,
      provider: AI_PROVIDER.MOCK,
      tokens:   summary.split(' ').length | 0,
      latency:  Date.now() - start,
    };
  },

  async suggestions({ conversation = [], lead = {} }) {
    const start    = Date.now();
    const leadName = lead.name || 'the lead';
    return {
      nextAction:         `Send a personalised follow-up to ${leadName} within 24 hours.`,
      bookingSuggestion:  `Schedule a 15-minute discovery call with ${leadName} to understand their requirements better.`,
      paymentSuggestion:  `Send the payment link to ${leadName} and follow up if not completed within 48 hours.`,
      followUp:           `Hi ${leadName}! Just checking in — were you able to review the information I sent? Happy to jump on a quick call!`,
      provider:           AI_PROVIDER.MOCK,
      latency:            Date.now() - start,
    };
  },
};

/**
 * Provider factory.
 * Add new providers here — the rest of the service is unchanged.
 */
function getProvider(name = ACTIVE_AI_PROVIDER) {
  switch (name) {
    case AI_PROVIDER.MOCK:
      return mockProvider;
    // case AI_PROVIDER.OPENAI:
    //   return openaiProvider;   // import and implement in providers/openai.js
    // case AI_PROVIDER.GEMINI:
    //   return geminiProvider;
    // case AI_PROVIDER.CLAUDE:
    //   return claudeProvider;
    default:
      return mockProvider;
  }
}

// ── Service ────────────────────────────────────────────────────────────────────

export const aiReplyAssistantService = {
  // ── Prompt CRUD ────────────────────────────────────────────────────────────

  async createPrompt(ctx, data) {
    const prompt = await aiReplyAssistantRepository.createPrompt({
      ...data,
      tenantId:  ctx.tenantId,
      isSystem:  data.isSystem === true ? true : false,
      isActive:  true,
      usageCount: 0,
      createdBy: ctx.userId,
      updatedBy: ctx.userId,
    });
    return toDTO(prompt);
  },

  async getPrompt(ctx, id) {
    const prompt = await aiReplyAssistantRepository.findPromptById(ctx.tenantId, id);
    if (!prompt) throw new AppError(404, 'Prompt not found');
    return toDTO(prompt);
  },

  async listPrompts(ctx, query) {
    const filter = buildFilter(query);
    const sort   = buildSort(query.sort);
    const { page, limit, skip } = paging(query);
    const [items, total] = await Promise.all([
      aiReplyAssistantRepository.listPrompts(ctx.tenantId, filter, { sort, skip, limit }),
      aiReplyAssistantRepository.countPrompts(ctx.tenantId, filter),
    ]);
    return {
      data: items.map(toDTO),
      pagination: {
        page, limit, total,
        totalPages: Math.ceil(total / limit) || 0,
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    };
  },

  async updatePrompt(ctx, id, patch) {
    const existing = await aiReplyAssistantRepository.findPromptById(ctx.tenantId, id);
    if (!existing) throw new AppError(404, 'Prompt not found');
    patch.updatedBy = ctx.userId;
    const updated = await aiReplyAssistantRepository.updatePrompt(ctx.tenantId, id, patch);
    return toDTO(updated);
  },

  async deletePrompt(ctx, id) {
    const existing = await aiReplyAssistantRepository.findPromptById(ctx.tenantId, id);
    if (!existing) throw new AppError(404, 'Prompt not found');
    if (existing.isSystem) throw new AppError(403, 'System prompts cannot be deleted');
    await aiReplyAssistantRepository.softDeletePrompt(ctx.tenantId, id);
    return { id: String(existing._id), deleted: true };
  },

  async duplicatePrompt(ctx, id) {
    const source = await aiReplyAssistantRepository.findPromptById(ctx.tenantId, id);
    if (!source) throw new AppError(404, 'Prompt not found');
    const src = source.toObject ? source.toObject() : source;
    const clone = await aiReplyAssistantRepository.createPrompt({
      tenantId:     ctx.tenantId,
      title:        `${src.title} (Copy)`,
      description:  src.description,
      category:     src.category,
      prompt:       src.prompt,
      tone:         src.tone,
      languageCode: src.languageCode,
      isSystem:     false,   // copies are never system prompts
      isActive:     true,
      usageCount:   0,
      createdBy:    ctx.userId,
      updatedBy:    ctx.userId,
    });
    return toDTO(clone);
  },

  async togglePrompt(ctx, id) {
    const existing = await aiReplyAssistantRepository.findPromptById(ctx.tenantId, id);
    if (!existing) throw new AppError(404, 'Prompt not found');
    const newState = !existing.isActive;
    const updated  = await aiReplyAssistantRepository.toggleActive(ctx.tenantId, id, newState);
    return toDTO(updated);
  },

  async usePrompt(ctx, id) {
    const existing = await aiReplyAssistantRepository.findPromptById(ctx.tenantId, id);
    if (!existing) throw new AppError(404, 'Prompt not found');
    if (!existing.isActive) throw new AppError(409, 'Prompt is inactive');
    const updated = await aiReplyAssistantRepository.incrementUsageCount(ctx.tenantId, id);
    return toDTO(updated);
  },

  // ── Variable replacement ───────────────────────────────────────────────────

  replaceVariables(text, variables = {}) {
    return interpolate(text, variables);
  },

  extractVariables(text) {
    return extractVariableNames(text);
  },

  // ── AI Generation ──────────────────────────────────────────────────────────

  async generateReply(ctx, { conversation, lead, goal, tone, language, variables = {} }) {
    const provider = getProvider();
    const result   = await provider.generate({ conversation, lead, goal, tone, language });
    // Replace variables in the generated text.
    result.text = interpolate(result.text, { ...this._leadVariables(lead), ...variables });
    result.generatedReply = result.text;
    delete result.text;
    return result;
  },

  async rewriteText(ctx, { text, style, variables = {} }) {
    const provider  = getProvider();
    const result    = await provider.rewrite({ text, style });
    result.rewritten = interpolate(result.text, variables);
    delete result.text;
    return result;
  },

  async summarizeConversation(ctx, { conversation, lead }) {
    const provider = getProvider();
    return provider.summarize({ conversation, lead });
  },

  async generateSuggestions(ctx, { conversation, lead, variables = {} }) {
    const provider = getProvider();
    const result   = await provider.suggestions({ conversation, lead });
    // Interpolate variables into all text fields.
    const vars = { ...this._leadVariables(lead), ...variables };
    result.nextAction        = interpolate(result.nextAction, vars);
    result.bookingSuggestion = interpolate(result.bookingSuggestion, vars);
    result.paymentSuggestion = interpolate(result.paymentSuggestion, vars);
    result.followUp          = interpolate(result.followUp, vars);
    return result;
  },

  // ── Save-as-template (delegates to Templates service) ──────────────────────

  async saveAsTemplate(ctx, { generatedReply, templateData = {} }) {
    if (!generatedReply) throw new AppError(400, 'generatedReply is required');
    const data = {
      name:         templateData.name        || 'AI Generated Reply',
      category:     templateData.category    || 'MARKETING',
      languageCode: templateData.languageCode || 'en',
      body:         generatedReply,
      description:  templateData.description  || 'Created from AI Reply Assistant',
      provider:     templateData.provider     || 'SIMULATION',
      ...templateData,
    };
    return templatesService.createTemplate(ctx, data);
  },

  // ── Save-as-prompt (creates a prompt from a generated reply) ───────────────

  async saveAsPrompt(ctx, { text, title, category, tone, languageCode, description }) {
    if (!text)  throw new AppError(400, 'text is required');
    if (!title) throw new AppError(400, 'title is required');
    return this.createPrompt(ctx, {
      title,
      description: description || '',
      category:    category    || PROMPT_CATEGORY.CUSTOM,
      prompt:      text,
      tone:        tone        || TONE.PROFESSIONAL,
      languageCode: languageCode || 'en',
    });
  },

  // ── Internal helper: build variable map from a lead object ─────────────────

  _leadVariables(lead = {}) {
    return {
      lead_name:          lead.name         || lead.lead_name        || '',
      company_name:       lead.company      || lead.company_name     || '',
      sales_rep_name:     lead.salesRep     || lead.sales_rep_name   || '',
      lead_problem:       lead.problem      || lead.lead_problem     || '',
      qualification_score: lead.score       || lead.qualification_score || '',
    };
  },
};
