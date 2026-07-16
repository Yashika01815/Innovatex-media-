import { create } from 'zustand';
import { generateSeed, type Database } from '@/data/seedData';
import { uid, nowISO } from '@/utils/id';
import { toast } from '@/store/toastStore';
import { sendWhatsAppMessage as adapterSend } from '@/services/whatsappService';
import type {
  Lead, Deal, Booking, CallRecord, WhatsAppMessage, WhatsAppTemplate, TemplateStatus,
  WhatsAppCampaign, CampaignStatus, Payment, TrackingEvent, TrackingEventType, Notification,
  Integration, Tenant, User, PipelineStageId, NurtureSequence, Automation, TenantSettings,
  ConversationStatus, GenericTemplate, Task,
} from '@/types';

const STORAGE_KEY = 'innovatex_db_v1';
const USER_KEY = 'innovatex_user';

function loadDB(): Database {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as Database;
  } catch {
    /* ignore */
  }
  const seed = generateSeed();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
  return seed;
}

function persist(db: Database) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  } catch {
    /* ignore quota */
  }
}

interface StoreState {
  db: Database;
  currentUserId: string | null;
  activeTenantId: string;

  // auth
  login: (email: string, password: string) => User | null;
  logout: () => void;
  switchTenant: (tenantId: string) => void;
  currentUser: () => User | undefined;

  // generic
  set: (mutator: (db: Database) => void) => void;

  // tracking + timeline
  track: (type: TrackingEventType, leadId: string | null, extra?: Partial<TrackingEvent>) => void;
  notify: (n: Pick<Notification, 'type' | 'title' | 'message' | 'icon'> & { link?: string }) => void;

  // leads
  createLead: (data: Partial<Lead>) => Lead;
  updateLead: (id: string, patch: Partial<Lead>) => void;
  archiveLead: (id: string) => void;

  // qualification
  qualifyLead: (leadId: string, result: { score: number; temperature: Lead['lead_temperature']; reason: string; nextAction: string }) => void;

  // pipeline
  moveDealStage: (dealId: string, stage: PipelineStageId) => void;
  createDeal: (data: Partial<Deal>) => Deal;
  updateDeal: (id: string, patch: Partial<Deal>) => void;
  deleteDeal: (id: string) => void;

  // bookings
  createBooking: (data: Partial<Booking>) => Booking;
  updateBooking: (id: string, patch: Partial<Booking>) => void;

  // calls
  createCall: (data: Partial<CallRecord>) => CallRecord;

  // payments
  createPayment: (data: Partial<Payment>) => Payment;
  markPaymentPaid: (id: string) => void;
  updatePayment: (id: string, patch: Partial<Payment>) => void;

  // whatsapp
  sendMessage: (conversationId: string, body: string, opts?: { templateId?: string; campaignId?: string }) => void;
  simulateInbound: (conversationId: string) => void;
  updateConversation: (id: string, patch: Partial<import('@/types').WhatsAppConversation>) => void;
  setConversationStatus: (id: string, status: ConversationStatus) => void;

  // templates
  createTemplate: (data: Partial<WhatsAppTemplate>) => WhatsAppTemplate;
  updateTemplate: (id: string, patch: Partial<WhatsAppTemplate>) => void;
  transitionTemplate: (id: string, status: TemplateStatus, comment?: string) => void;

  // campaigns
  createCampaign: (data: Partial<WhatsAppCampaign>) => WhatsAppCampaign;
  transitionCampaign: (id: string, status: CampaignStatus) => void;
  sendCampaign: (id: string) => void;

  // marketing campaigns
  createMarketingCampaign: (data: Partial<import('@/types').Campaign>) => void;

  // nurture
  assignSequence: (sequenceId: string, leadId: string) => void;
  createSequence: (data: Partial<NurtureSequence>) => void;
  toggleSequence: (id: string) => void;

  // automations
  toggleAutomation: (id: string) => void;
  simulateAutomation: (id: string) => void;
  createAutomation: (data: Partial<Automation>) => void;

  // generic templates
  createGenericTemplate: (data: Partial<GenericTemplate>) => void;
  deleteGenericTemplate: (id: string) => void;

  // tasks
  toggleTask: (id: string) => void;
  createTask: (data: Partial<Task>) => void;

  // integrations
  toggleIntegration: (id: string) => void;
  syncIntegration: (id: string) => void;
  updateIntegrationConfig: (id: string, config: Record<string, string>) => void;

  // notifications
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;

  // settings
  updateSettings: (patch: Partial<TenantSettings>) => void;

  // team
  createUser: (data: Partial<User>) => void;
  updateUser: (id: string, patch: Partial<User>) => void;

  // tenants (super admin)
  createTenant: (data: Partial<Tenant>) => void;
  updateTenant: (id: string, patch: Partial<Tenant>) => void;

  // demo reset
  resetDemo: () => void;
}

function base(tenantId: string) {
  return { id: uid(), tenant_id: tenantId, created_at: nowISO(), updated_at: nowISO() };
}

export const useStore = create<StoreState>((setState, get) => ({
  db: loadDB(),
  currentUserId: localStorage.getItem(USER_KEY),
  activeTenantId: 'tenant_alpha',

  currentUser: () => get().db.users.find((u) => u.id === get().currentUserId),

  login: (email, password) => {
    const user = get().db.users.find(
      (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password,
    );
    if (user) {
      localStorage.setItem(USER_KEY, user.id);
      setState({ currentUserId: user.id, activeTenantId: user.tenant_id });
    }
    return user ?? null;
  },

  logout: () => {
    localStorage.removeItem(USER_KEY);
    setState({ currentUserId: null });
  },

  switchTenant: (tenantId) => setState({ activeTenantId: tenantId }),

  set: (mutator) => {
    setState((s) => {
      const db = structuredCloneSafe(s.db);
      mutator(db);
      persist(db);
      return { db };
    });
  },

  track: (type, leadId, extra = {}) => {
    get().set((db) => {
      const lead = leadId ? db.leads.find((l) => l.id === leadId) : null;
      const evt: TrackingEvent = {
        ...base(get().activeTenantId),
        id: uid('evt'),
        event_type: type,
        lead_id: leadId,
        source: lead?.source ?? extra.source ?? 'Direct',
        medium: lead?.medium ?? extra.medium ?? '',
        campaign: lead?.campaign ?? extra.campaign ?? '',
        utm_source: lead?.utm_source ?? '',
        utm_medium: lead?.utm_medium ?? '',
        utm_campaign: lead?.utm_campaign ?? '',
        utm_content: lead?.utm_content ?? '',
        utm_term: lead?.utm_term ?? '',
        provider_name: extra.provider_name ?? 'Native Meta Cloud API',
        lifecycle_stage: lead?.status ?? '',
        metadata_json: extra.metadata_json ?? {},
      };
      db.trackingEvents.unshift(evt);
    });
  },

  notify: (n) => {
    get().set((db) => {
      const notif: Notification = {
        ...base(get().activeTenantId),
        id: uid('notif'),
        type: n.type,
        title: n.title,
        message: n.message,
        icon: n.icon,
        read: false,
        link: n.link ?? '/dashboard',
      };
      db.notifications.unshift(notif);
    });
  },

  // ---- Leads ----
  createLead: (data) => {
    const tenant = get().activeTenantId;
    const lead: Lead = {
      ...base(tenant),
      id: uid('lead'),
      name: data.name ?? 'Unnamed Lead',
      email: data.email ?? '',
      phone: data.phone ?? '',
      whatsapp_number: data.whatsapp_number ?? data.phone ?? '',
      company: data.company ?? '',
      source: data.source ?? 'Direct',
      medium: data.medium ?? '',
      campaign: data.campaign ?? '',
      utm_source: data.utm_source ?? '',
      utm_medium: data.utm_medium ?? '',
      utm_campaign: data.utm_campaign ?? '',
      utm_content: data.utm_content ?? '',
      utm_term: data.utm_term ?? '',
      status: data.status ?? 'New',
      qualification_score: data.qualification_score ?? 0,
      lead_temperature: data.lead_temperature ?? 'Cold',
      assigned_user_id: data.assigned_user_id ?? get().currentUserId,
      segment: data.segment ?? 'Coaches',
      notes: data.notes ?? '',
      consent_status: data.consent_status ?? 'pending',
      opt_out_status: data.opt_out_status ?? false,
      value: data.value ?? 0,
      last_contacted_at: null,
    };
    get().set((db) => {
      db.leads.unshift(lead);
    });
    get().track('Lead Created', lead.id);
    get().notify({ type: 'New lead', title: 'New lead captured', message: `${lead.name} from ${lead.source}`, icon: 'flame' });
    return lead;
  },

  updateLead: (id, patch) => {
    get().set((db) => {
      const lead = db.leads.find((l) => l.id === id);
      if (lead) Object.assign(lead, patch, { updated_at: nowISO() });
    });
  },

  archiveLead: (id) => {
    get().set((db) => {
      const lead = db.leads.find((l) => l.id === id);
      if (lead) lead.archived = true;
    });
    toast.success('Lead archived');
  },

  // ---- Qualification ----
  qualifyLead: (leadId, result) => {
    get().set((db) => {
      const lead = db.leads.find((l) => l.id === leadId);
      if (lead) {
        lead.qualification_score = result.score;
        lead.lead_temperature = result.temperature;
        lead.notes = `${lead.notes ? lead.notes + '\n' : ''}AI Qualification: ${result.reason}`.trim();
        if (lead.status === 'New' || lead.status === 'Contacted') lead.status = 'Qualified';
        lead.updated_at = nowISO();
      }
    });
    get().track('AI Qualified', leadId, { metadata_json: { score: result.score } });
    if (result.temperature === 'Hot') {
      get().notify({ type: 'Hot lead qualified', title: 'AI qualified a hot lead', message: `Score ${result.score}/10 — ${result.nextAction}`, icon: 'sparkles' });
    }
    toast.success('Lead qualified', `Score ${result.score}/10 · ${result.temperature}`);
  },

  // ---- Pipeline ----
  moveDealStage: (dealId, stage) => {
    let leadId: string | null = null;
    get().set((db) => {
      const deal = db.deals.find((d) => d.id === dealId);
      if (!deal) return;
      deal.stage = stage;
      deal.stage_history.push({ stage, at: nowISO() });
      deal.updated_at = nowISO();
      if (stage === 'won') deal.probability = 100;
      if (stage === 'lost') deal.probability = 0;
      leadId = deal.lead_id;
      const lead = db.leads.find((l) => l.id === deal.lead_id);
      if (lead) {
        const map: Partial<Record<PipelineStageId, Lead['status']>> = {
          qualified: 'Qualified', booked_call: 'Booked', call_completed: 'Call Completed',
          proposal_sent: 'Proposal Sent', won: 'Won', lost: 'Lost', nurture: 'Nurture',
        };
        if (map[stage]) lead.status = map[stage]!;
      }
    });
    get().track('Pipeline Stage Changed', leadId, { metadata_json: { stage } });
    if (stage === 'won') get().track('Deal Won', leadId);
    if (stage === 'lost') get().track('Deal Lost', leadId);
    toast.success('Deal moved', `Stage updated to ${stage.replace(/_/g, ' ')}`);
  },

  createDeal: (data) => {
    const deal: Deal = {
      ...base(get().activeTenantId), id: uid('deal'),
      title: data.title ?? 'New Deal', lead_id: data.lead_id ?? '',
      stage: data.stage ?? 'new_lead', value: data.value ?? 0, currency: 'USD',
      expected_close_date: data.expected_close_date ?? nowISO(),
      assigned_user_id: data.assigned_user_id ?? get().currentUserId,
      source: data.source ?? 'Direct', campaign: data.campaign ?? '',
      probability: data.probability ?? 30,
      stage_history: [{ stage: data.stage ?? 'new_lead', at: nowISO() }],
    };
    get().set((db) => { db.deals.unshift(deal); });
    toast.success('Deal created', deal.title);
    return deal;
  },

  updateDeal: (id, patch) => get().set((db) => {
    const d = db.deals.find((x) => x.id === id);
    if (d) Object.assign(d, patch, { updated_at: nowISO() });
  }),

  deleteDeal: (id) => {
    get().set((db) => { db.deals = db.deals.filter((d) => d.id !== id); });
    toast.success('Deal deleted');
  },

  // ---- Bookings ----
  createBooking: (data) => {
    const booking: Booking = {
      ...base(get().activeTenantId), id: uid('booking'),
      lead_id: data.lead_id ?? '', deal_id: data.deal_id ?? null,
      meeting_date: data.meeting_date ?? nowISO(), meeting_time: data.meeting_time ?? '10:00',
      meeting_type: data.meeting_type ?? 'Discovery Call',
      assigned_user_id: data.assigned_user_id ?? get().currentUserId,
      status: data.status ?? 'Scheduled', source: data.source ?? 'Direct',
      campaign: data.campaign ?? '', notes: data.notes ?? '',
    };
    get().set((db) => {
      db.bookings.unshift(booking);
      const lead = db.leads.find((l) => l.id === booking.lead_id);
      if (lead) { lead.status = 'Booked'; lead.updated_at = nowISO(); }
      // create or move a deal
      let deal = db.deals.find((d) => d.lead_id === booking.lead_id);
      if (!deal && lead) {
        deal = {
          ...base(get().activeTenantId), id: uid('deal'), title: `${lead.company || lead.name} — Revenue OS`,
          lead_id: lead.id, stage: 'booked_call', value: lead.value, currency: 'USD',
          expected_close_date: data.meeting_date ?? nowISO(), assigned_user_id: lead.assigned_user_id,
          source: lead.source, campaign: lead.campaign, probability: 40,
          stage_history: [{ stage: 'booked_call', at: nowISO() }],
        };
        db.deals.unshift(deal);
      } else if (deal) {
        deal.stage = 'booked_call';
        deal.stage_history.push({ stage: 'booked_call', at: nowISO() });
      }
    });
    get().track('Booking Created', booking.lead_id);
    const lead = get().db.leads.find((l) => l.id === booking.lead_id);
    get().notify({ type: 'Booking created', title: 'New call booked', message: `${lead?.name ?? 'Lead'} — ${booking.meeting_type}`, icon: 'calendar' });
    toast.success('Booking created', 'Lead moved to Booked & pipeline updated');
    return booking;
  },

  updateBooking: (id, patch) => get().set((db) => {
    const b = db.bookings.find((x) => x.id === id);
    if (b) Object.assign(b, patch, { updated_at: nowISO() });
  }),

  // ---- Calls ----
  createCall: (data) => {
    const call: CallRecord = {
      ...base(get().activeTenantId), id: uid('call'),
      lead_id: data.lead_id ?? '', deal_id: data.deal_id ?? null,
      duration_minutes: data.duration_minutes ?? 30, transcript: data.transcript ?? '',
      summary: data.summary ?? '', objections: data.objections ?? [], next_steps: data.next_steps ?? [],
      outcome: data.outcome ?? 'Needs Follow-Up', score: data.score ?? 5,
      assigned_user_id: data.assigned_user_id ?? get().currentUserId, call_date: data.call_date ?? nowISO(),
    };
    get().set((db) => {
      db.calls.unshift(call);
      const lead = db.leads.find((l) => l.id === call.lead_id);
      if (lead && (lead.status === 'Booked' || lead.status === 'Qualified')) lead.status = 'Call Completed';
    });
    get().track('Call Completed', call.lead_id, { metadata_json: { outcome: call.outcome } });
    get().notify({ type: 'Call completed', title: 'Call logged with AI summary', message: `Outcome: ${call.outcome}`, icon: 'phone' });
    return call;
  },

  // ---- Payments ----
  createPayment: (data) => {
    const payment: Payment = {
      ...base(get().activeTenantId), id: uid('pay'),
      lead_id: data.lead_id ?? '', deal_id: data.deal_id ?? null,
      amount: data.amount ?? 0, currency: data.currency ?? 'USD',
      status: data.status ?? 'Sent', payment_method: data.payment_method ?? 'Card',
      payment_link: data.payment_link ?? `https://pay.innovatex.com/${uid('inv')}`,
      payment_date: null, source: data.source ?? 'Direct', campaign: data.campaign ?? '',
    };
    get().set((db) => { db.payments.unshift(payment); });
    get().track('Payment Created', payment.lead_id, { metadata_json: { amount: payment.amount } });
    toast.success('Payment link created', `${payment.currency} ${payment.amount.toLocaleString()}`);
    return payment;
  },

  markPaymentPaid: (id) => {
    let leadId: string | null = null;
    let amount = 0;
    get().set((db) => {
      const pay = db.payments.find((p) => p.id === id);
      if (!pay) return;
      pay.status = 'Paid';
      pay.payment_date = nowISO();
      pay.updated_at = nowISO();
      leadId = pay.lead_id;
      amount = pay.amount;
      const lead = db.leads.find((l) => l.id === pay.lead_id);
      if (lead) { lead.status = 'Won'; lead.updated_at = nowISO(); }
      const deal = db.deals.find((d) => d.id === pay.deal_id) || db.deals.find((d) => d.lead_id === pay.lead_id);
      if (deal) {
        deal.stage = 'won';
        deal.probability = 100;
        deal.stage_history.push({ stage: 'won', at: nowISO() });
      }
    });
    get().track('Payment Completed', leadId, { metadata_json: { amount } });
    get().track('Deal Won', leadId);
    get().notify({ type: 'Payment received', title: 'Payment marked paid', message: `$${amount.toLocaleString()} received — Deal won 🎉`, icon: 'dollar-sign' });
    toast.success('Payment received', 'Deal won, revenue & attribution updated');
  },

  updatePayment: (id, patch) => get().set((db) => {
    const p = db.payments.find((x) => x.id === id);
    if (p) Object.assign(p, patch, { updated_at: nowISO() });
  }),

  // ---- WhatsApp ----
  sendMessage: (conversationId, body, opts = {}) => {
    const db = get().db;
    const conv = db.conversations.find((c) => c.id === conversationId);
    if (!conv) return;
    const lead = db.leads.find((l) => l.id === conv.lead_id);
    if (lead?.opt_out_status) {
      toast.error('Message blocked', 'This contact has opted out of WhatsApp.');
      get().set((d) => {
        d.deliveryLogs.unshift({
          ...base(get().activeTenantId), id: uid('dlog'), message_id: uid('msg'), lead_id: conv.lead_id,
          conversation_id: conv.id, template_id: opts.templateId ?? null, campaign_id: opts.campaignId ?? null,
          provider_name: db.settings[get().activeTenantId].whatsapp.provider_name,
          sender: db.settings[get().activeTenantId].whatsapp.default_sender_number, recipient: lead?.whatsapp_number ?? '',
          message_type: 'text', status: 'Blocked by Opt-Out', sent_at: null, delivered_at: null, read_at: null,
          failed_at: nowISO(), failure_reason: 'Recipient opted out', provider_response: '', retry_count: 0,
        });
      });
      return;
    }
    const settings = db.settings[get().activeTenantId].whatsapp;
    const resp = adapterSend(settings.provider_name, lead?.whatsapp_number ?? '', body);
    const msgId = uid('msg');
    get().set((d) => {
      const message: WhatsAppMessage = {
        ...base(get().activeTenantId), id: msgId, conversation_id: conversationId, lead_id: conv.lead_id,
        direction: 'outbound', body, status: resp.status, template_id: opts.templateId ?? null,
        campaign_id: opts.campaignId ?? null, provider_name: settings.provider_name,
        sender: settings.default_sender_number, recipient: lead?.whatsapp_number ?? '', message_type: opts.templateId ? 'template' : 'text',
      };
      d.messages.push(message);
      const c = d.conversations.find((x) => x.id === conversationId);
      if (c) { c.last_message_at = nowISO(); c.updated_at = nowISO(); if (c.status === 'New') c.status = 'Open'; }
      const l = d.leads.find((x) => x.id === conv.lead_id);
      if (l) l.last_contacted_at = nowISO();
      d.deliveryLogs.unshift({
        ...base(get().activeTenantId), id: uid('dlog'), message_id: msgId, lead_id: conv.lead_id,
        conversation_id: conversationId, template_id: opts.templateId ?? null, campaign_id: opts.campaignId ?? null,
        provider_name: settings.provider_name, sender: settings.default_sender_number, recipient: l?.whatsapp_number ?? '',
        message_type: 'text', status: resp.status, sent_at: nowISO(), delivered_at: nowISO(), read_at: null,
        failed_at: null, failure_reason: '', provider_response: JSON.stringify(resp.raw), retry_count: 0,
      });
    });
    get().track('WhatsApp Outbound Message', conv.lead_id);
    toast.success('Message sent', `via ${settings.provider_name}`);
  },

  simulateInbound: (conversationId) => {
    const db = get().db;
    const conv = db.conversations.find((c) => c.id === conversationId);
    if (!conv) return;
    const replies = ['Sounds great, tell me more!', 'What does pricing look like?', 'Can we book a call this week?', 'Yes please send the link.', 'I need to check with my team first.'];
    const body = replies[Math.floor(Math.random() * replies.length)];
    get().set((d) => {
      const message: WhatsAppMessage = {
        ...base(get().activeTenantId), id: uid('msg'), conversation_id: conversationId, lead_id: conv.lead_id,
        direction: 'inbound', body, status: 'Replied', template_id: null, campaign_id: null,
        provider_name: d.settings[get().activeTenantId].whatsapp.provider_name,
        sender: d.leads.find((l) => l.id === conv.lead_id)?.whatsapp_number ?? '',
        recipient: d.settings[get().activeTenantId].whatsapp.default_sender_number, message_type: 'text',
      };
      d.messages.push(message);
      const c = d.conversations.find((x) => x.id === conversationId);
      if (c) { c.last_message_at = nowISO(); c.unread_count += 1; if (c.status === 'New') c.status = 'Open'; }
    });
    get().track('WhatsApp Inbound Message', conv.lead_id);
    toast.info('Inbound message', 'Simulated reply received');
  },

  updateConversation: (id, patch) => get().set((db) => {
    const c = db.conversations.find((x) => x.id === id);
    if (c) Object.assign(c, patch, { updated_at: nowISO() });
  }),

  setConversationStatus: (id, status) => {
    get().set((db) => {
      const c = db.conversations.find((x) => x.id === id);
      if (c) { c.status = status; c.updated_at = nowISO(); }
    });
    toast.success('Conversation updated', `Status: ${status}`);
  },

  // ---- Templates ----
  createTemplate: (data) => {
    const body = data.body_message ?? '';
    const vars = Array.from(new Set((body.match(/\{\{(\w+)\}\}/g) || []).map((v) => v.replace(/[{}]/g, ''))));
    const tpl: WhatsAppTemplate = {
      ...base(get().activeTenantId), id: uid('tpl'),
      template_name: data.template_name ?? 'untitled_template', category: data.category ?? 'Marketing',
      language: data.language ?? 'en_US', header_type: data.header_type ?? 'none',
      header_content: data.header_content ?? '', body_message: body, footer: data.footer ?? '',
      buttons: data.buttons ?? [], variables: vars,
      sample_variable_values: Object.fromEntries(vars.map((v) => [v, `[${v}]`])),
      status: 'Draft', rejection_reason: '', version: 1, created_by: get().currentUserId ?? 'u_admin',
      approval_comments: [], status_history: [{ status: 'Draft', at: nowISO() }],
    };
    get().set((db) => { db.templates.unshift(tpl); });
    toast.success('Template created', tpl.template_name);
    return tpl;
  },

  updateTemplate: (id, patch) => get().set((db) => {
    const t = db.templates.find((x) => x.id === id);
    if (t) Object.assign(t, patch, { updated_at: nowISO(), version: t.version });
  }),

  transitionTemplate: (id, status, comment) => {
    get().set((db) => {
      const t = db.templates.find((x) => x.id === id);
      if (!t) return;
      t.status = status;
      t.updated_at = nowISO();
      t.status_history.push({ status, at: nowISO() });
      if (comment) t.approval_comments.push({ author_id: get().currentUserId ?? 'u_admin', text: comment, at: nowISO(), action: status });
      if (status === 'Provider Rejected') t.rejection_reason = comment || 'Rejected by provider.';
    });
    if (status === 'Provider Approved' || status === 'Active') {
      get().notify({ type: 'Template approved', title: 'Template approved', message: `Template is now ${status}`, icon: 'check-circle' });
    }
    toast.success('Template updated', `Status: ${status}`);
  },

  // ---- Campaigns ----
  createCampaign: (data) => {
    const camp: WhatsAppCampaign = {
      ...base(get().activeTenantId), id: uid('wacamp'), name: data.name ?? 'New Campaign',
      template_id: data.template_id ?? null, audience_filter: data.audience_filter ?? 'All leads',
      audience_count: data.audience_count ?? 0, status: 'Draft', scheduled_at: data.scheduled_at ?? null,
      metrics: { sent: 0, delivered: 0, read: 0, replied: 0, failed: 0, bookings: 0, payments: 0, revenue: 0 },
      is_broadcast: data.is_broadcast ?? false,
    };
    get().set((db) => { db.campaigns.unshift(camp); });
    toast.success(`${camp.is_broadcast ? 'Broadcast' : 'Campaign'} created`, camp.name);
    return camp;
  },

  transitionCampaign: (id, status) => {
    get().set((db) => {
      const c = db.campaigns.find((x) => x.id === id);
      if (c) { c.status = status; c.updated_at = nowISO(); }
    });
    if (status === 'Approved') get().notify({ type: 'Campaign approved', title: 'Campaign approved', message: 'Ready to schedule or send', icon: 'megaphone' });
    toast.success('Campaign updated', `Status: ${status}`);
  },

  sendCampaign: (id) => {
    let leadIdForTrack: string | null = null;
    get().set((db) => {
      const c = db.campaigns.find((x) => x.id === id);
      if (!c) return;
      const count = c.audience_count || 200;
      const delivered = Math.floor(count * 0.94);
      const read = Math.floor(delivered * 0.78);
      const replied = Math.floor(read * 0.2);
      c.metrics = {
        sent: count, delivered, read, replied, failed: count - delivered,
        bookings: Math.floor(replied * 0.3), payments: Math.floor(replied * 0.12),
        revenue: Math.floor(replied * 0.12) * 4500,
      };
      c.status = 'Completed';
      c.updated_at = nowISO();
      leadIdForTrack = db.leads[0]?.id ?? null;
    });
    get().track(get().db.campaigns.find((c) => c.id === id)?.is_broadcast ? 'Broadcast Sent' : 'Campaign Sent', leadIdForTrack);
    toast.success('Campaign sent', 'Simulated delivery complete — metrics updated');
  },

  createMarketingCampaign: (data) => {
    get().set((db) => {
      db.marketingCampaigns.unshift({
        ...base(get().activeTenantId), id: uid('mcamp'),
        campaign_name: data.campaign_name ?? 'new_campaign', source: data.source ?? 'Meta Ads',
        medium: data.medium ?? 'paid', campaign_type: data.campaign_type ?? 'Paid Ads',
        budget: data.budget ?? 0, spend: 0, start_date: data.start_date ?? nowISO(),
        end_date: data.end_date ?? nowISO(), status: data.status ?? 'Draft',
        leads_generated: 0, bookings: 0, revenue: 0,
      });
    });
    toast.success('Campaign created', data.campaign_name);
  },

  // ---- Nurture ----
  assignSequence: (sequenceId, leadId) => {
    get().set((db) => {
      db.nurtureEnrollments.unshift({
        ...base(get().activeTenantId), id: uid('enr'), sequence_id: sequenceId, lead_id: leadId,
        current_step: 0, status: 'active', steps_sent: [],
      });
      const seq = db.nurtureSequences.find((s) => s.id === sequenceId);
      if (seq) seq.enrolled_count += 1;
    });
    get().track('Nurture Step Sent', leadId);
    toast.success('Sequence assigned', 'Lead enrolled in nurture sequence');
  },

  createSequence: (data) => {
    get().set((db) => {
      db.nurtureSequences.unshift({
        ...base(get().activeTenantId), id: uid('seq'), name: data.name ?? 'New Sequence',
        description: data.description ?? '', steps: data.steps ?? [], status: 'draft',
        enrolled_count: 0, trigger: data.trigger ?? 'Manual',
      });
    });
    toast.success('Sequence created', data.name);
  },

  toggleSequence: (id) => {
    get().set((db) => {
      const s = db.nurtureSequences.find((x) => x.id === id);
      if (s) s.status = s.status === 'active' ? 'paused' : 'active';
    });
  },

  // ---- Automations ----
  toggleAutomation: (id) => {
    get().set((db) => {
      const a = db.automations.find((x) => x.id === id);
      if (a) a.status = a.status === 'active' ? 'inactive' : 'active';
    });
    toast.success('Automation updated');
  },

  simulateAutomation: (id) => {
    get().set((db) => {
      const a = db.automations.find((x) => x.id === id);
      if (a) {
        a.last_run = nowISO();
        a.run_count += 1;
        a.logs.unshift({ at: nowISO(), result: 'Simulated run — executed successfully' });
      }
    });
    toast.success('Automation ran', 'Simulated execution complete');
  },

  createAutomation: (data) => {
    get().set((db) => {
      db.automations.unshift({
        ...base(get().activeTenantId), id: uid('auto'), name: data.name ?? 'New Automation',
        trigger: data.trigger ?? 'New lead created', condition: data.condition ?? 'always',
        action: data.action ?? 'Create notification', status: 'active', last_run: null,
        created_by: get().currentUserId ?? 'u_admin', run_count: 0, logs: [],
      });
    });
    toast.success('Automation created', data.name);
  },

  // ---- Generic templates ----
  createGenericTemplate: (data) => {
    get().set((db) => {
      db.genericTemplates.unshift({
        ...base(get().activeTenantId), id: uid('gtpl'), name: data.name ?? 'New Template',
        type: data.type ?? 'Email', content: data.content ?? '', scope: data.scope ?? 'tenant', version: 1,
      });
    });
    toast.success('Template created', data.name);
  },

  deleteGenericTemplate: (id) => {
    get().set((db) => { db.genericTemplates = db.genericTemplates.filter((t) => t.id !== id); });
    toast.success('Template deleted');
  },

  // ---- Tasks ----
  toggleTask: (id) => get().set((db) => {
    const t = db.tasks.find((x) => x.id === id);
    if (t) t.status = t.status === 'open' ? 'done' : 'open';
  }),

  createTask: (data) => {
    get().set((db) => {
      db.tasks.unshift({
        ...base(get().activeTenantId), id: uid('task'), title: data.title ?? 'New task',
        lead_id: data.lead_id ?? null, assigned_user_id: data.assigned_user_id ?? get().currentUserId,
        due_date: data.due_date ?? nowISO(), status: 'open', priority: data.priority ?? 'medium',
      });
    });
    toast.success('Task created');
  },

  // ---- Integrations ----
  toggleIntegration: (id) => {
    get().set((db) => {
      const i = db.integrations.find((x) => x.id === id);
      if (i) {
        if (i.status === 'connected') i.status = 'disconnected';
        else { i.status = 'connected'; i.last_sync = nowISO(); }
        i.updated_at = nowISO();
      }
    });
    const intg = get().db.integrations.find((x) => x.id === id);
    toast.success(intg?.status === 'connected' ? 'Integration connected' : 'Integration disconnected', intg?.name);
  },

  syncIntegration: (id) => {
    get().set((db) => {
      const i = db.integrations.find((x) => x.id === id);
      if (i) i.last_sync = nowISO();
    });
    toast.success('Sync complete');
  },

  updateIntegrationConfig: (id, config) => {
    get().set((db) => {
      const i = db.integrations.find((x) => x.id === id);
      if (i) i.config = { ...i.config, ...config };
    });
    toast.success('Settings saved');
  },

  // ---- Notifications ----
  markNotificationRead: (id) => get().set((db) => {
    const n = db.notifications.find((x) => x.id === id);
    if (n) n.read = true;
  }),

  markAllNotificationsRead: () => get().set((db) => {
    db.notifications.forEach((n) => { n.read = true; });
  }),

  // ---- Settings ----
  updateSettings: (patch) => {
    get().set((db) => {
      db.settings[get().activeTenantId] = { ...db.settings[get().activeTenantId], ...patch };
    });
    toast.success('Settings saved');
  },

  // ---- Team ----
  createUser: (data) => {
    get().set((db) => {
      db.users.push({
        ...base(get().activeTenantId), id: uid('u'), name: data.name ?? 'New User',
        email: data.email ?? '', password: 'password123', role: data.role ?? 'Sales User',
        status: 'active', avatar_color: data.avatar_color ?? '#6366f1', title: data.title ?? '',
        last_active_at: nowISO(),
      } as User);
    });
    toast.success('User added', data.name);
  },

  updateUser: (id, patch) => {
    get().set((db) => {
      const u = db.users.find((x) => x.id === id);
      if (u) Object.assign(u, patch, { updated_at: nowISO() });
    });
    toast.success('User updated');
  },

  // ---- Tenants ----
  createTenant: (data) => {
    get().set((db) => {
      const id = uid('tenant');
      db.tenants.push({
        id, name: data.name ?? 'New Tenant', domain: data.domain ?? 'example.com',
        plan: data.plan ?? 'Starter', status: data.status ?? 'trial', industry: data.industry ?? 'SaaS',
        region: data.region ?? 'North America', seats: data.seats ?? 5, mrr: data.mrr ?? 0,
        created_at: nowISO(), updated_at: nowISO(), logo_color: data.logo_color ?? '#6366f1',
      });
      db.settings[id] = db.settings['tenant_alpha'];
    });
    toast.success('Tenant created', data.name);
  },

  updateTenant: (id, patch) => {
    get().set((db) => {
      const t = db.tenants.find((x) => x.id === id);
      if (t) Object.assign(t, patch, { updated_at: nowISO() });
    });
    toast.success('Tenant updated');
  },

  resetDemo: () => {
    localStorage.removeItem(STORAGE_KEY);
    const seed = generateSeed();
    persist(seed);
    setState({ db: seed });
    toast.success('Demo data reset', 'All data restored to seed state');
  },
}));

// structuredClone may not exist in older environments; provide fallback
function structuredCloneSafe<T>(obj: T): T {
  if (typeof structuredClone === 'function') return structuredClone(obj);
  return JSON.parse(JSON.stringify(obj)) as T;
}
