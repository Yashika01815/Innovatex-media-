// ============================================================================
// InnovateX Revenue OS — Domain Types
// ============================================================================

export interface BaseEntity {
  id: string;
  tenant_id: string;
  created_at: string;
  updated_at: string;
}

// ---- Tenants & Users -------------------------------------------------------

export type TenantStatus = 'active' | 'suspended' | 'trial';

export interface Tenant {
  id: string;
  name: string;
  domain: string;
  plan: 'Starter' | 'Growth' | 'Scale' | 'Enterprise';
  status: TenantStatus;
  industry: string;
  region: string;
  seats: number;
  mrr: number;
  created_at: string;
  updated_at: string;
  logo_color: string;
}

export type UserRole =
  | 'Super Admin'
  | 'Tenant Owner'
  | 'Tenant Admin'
  | 'Sales User'
  | 'Read-Only User';

export interface User {
  id: string;
  tenant_id: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  status: 'active' | 'inactive';
  avatar_color: string;
  title: string;
  created_at: string;
  updated_at: string;
  last_active_at: string;
}

// ---- Leads -----------------------------------------------------------------

export type LeadStatus =
  | 'New'
  | 'Contacted'
  | 'Qualified'
  | 'Booked'
  | 'Call Completed'
  | 'Proposal Sent'
  | 'Won'
  | 'Lost'
  | 'Nurture'
  | 'Ghosted';

export type LeadTemperature = 'Hot' | 'Warm' | 'Cold';

export interface Lead extends BaseEntity {
  name: string;
  email: string;
  phone: string;
  whatsapp_number: string;
  company: string;
  source: string;
  medium: string;
  campaign: string;
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  utm_content: string;
  utm_term: string;
  status: LeadStatus;
  qualification_score: number; // 0-10
  lead_temperature: LeadTemperature;
  assigned_user_id: string | null;
  segment: string;
  notes: string;
  consent_status: 'granted' | 'pending' | 'revoked';
  opt_out_status: boolean;
  value: number;
  last_contacted_at: string | null;
  archived?: boolean;
}

// ---- Pipeline / Deals ------------------------------------------------------

export type PipelineStageId =
  | 'new_lead'
  | 'qualified'
  | 'booked_call'
  | 'call_completed'
  | 'proposal_sent'
  | 'negotiation'
  | 'won'
  | 'lost'
  | 'nurture';

export interface PipelineStage {
  id: PipelineStageId;
  name: string;
  order: number;
  color: string;
}

export interface Deal extends BaseEntity {
  title: string;
  lead_id: string;
  stage: PipelineStageId;
  value: number;
  currency: string;
  expected_close_date: string;
  assigned_user_id: string | null;
  source: string;
  campaign: string;
  probability: number;
  stage_history: { stage: PipelineStageId; at: string }[];
}

// ---- Bookings --------------------------------------------------------------

export type BookingStatus =
  | 'Scheduled'
  | 'Completed'
  | 'No Show'
  | 'Cancelled'
  | 'Rescheduled';

export interface Booking extends BaseEntity {
  lead_id: string;
  deal_id: string | null;
  meeting_date: string;
  meeting_time: string;
  meeting_type: string;
  assigned_user_id: string | null;
  status: BookingStatus;
  source: string;
  campaign: string;
  notes: string;
}

// ---- Calls -----------------------------------------------------------------

export type CallOutcome =
  | 'Interested'
  | 'Not Interested'
  | 'Needs Follow-Up'
  | 'Proposal Requested'
  | 'Closed Won'
  | 'Closed Lost'
  | 'No Show';

export interface CallRecord extends BaseEntity {
  lead_id: string;
  deal_id: string | null;
  duration_minutes: number;
  transcript: string;
  summary: string;
  objections: string[];
  next_steps: string[];
  outcome: CallOutcome;
  score: number;
  assigned_user_id: string | null;
  call_date: string;
}

// ---- WhatsApp --------------------------------------------------------------

export type WhatsAppProvider =
  | 'Native Meta Cloud API'
  | 'WATI'
  | 'Interakt'
  | 'AiSensy'
  | 'Gallabox'
  | 'Twilio WhatsApp'
  | '360dialog'
  | 'Custom Webhook Provider'
  | 'Simulation Mode';

export type ConversationStatus =
  | 'New'
  | 'Open'
  | 'Pending'
  | 'Qualified'
  | 'Booked'
  | 'Won'
  | 'Lost'
  | 'Ghosted';

export interface WhatsAppConversation extends BaseEntity {
  lead_id: string;
  status: ConversationStatus;
  assigned_user_id: string | null;
  tags: string[];
  last_message_at: string;
  unread_count: number;
  internal_notes: { author_id: string; text: string; at: string }[];
}

export type MessageDirection = 'inbound' | 'outbound';

export type MessageStatus =
  | 'Draft'
  | 'Pending Approval'
  | 'Scheduled'
  | 'Queued'
  | 'Sent'
  | 'Delivered'
  | 'Read'
  | 'Replied'
  | 'Failed'
  | 'Cancelled'
  | 'Blocked by Opt-Out'
  | 'Blocked by Template Not Approved';

export interface WhatsAppMessage extends BaseEntity {
  conversation_id: string;
  lead_id: string;
  direction: MessageDirection;
  body: string;
  status: MessageStatus;
  template_id: string | null;
  campaign_id: string | null;
  provider_name: WhatsAppProvider;
  sender: string;
  recipient: string;
  message_type: 'text' | 'template' | 'media';
}

export type TemplateCategory =
  | 'Marketing'
  | 'Utility'
  | 'Authentication'
  | 'Follow-up'
  | 'Booking'
  | 'Payment'
  | 'Reminder'
  | 'Re-engagement'
  | 'Onboarding'
  | 'Support';

export type TemplateStatus =
  | 'Draft'
  | 'Submitted for Internal Review'
  | 'Changes Requested'
  | 'Internally Approved'
  | 'Rejected Internally'
  | 'Submitted to Provider'
  | 'Provider Pending'
  | 'Provider Approved'
  | 'Provider Rejected'
  | 'Active'
  | 'Paused'
  | 'Archived';

export type ButtonType =
  | 'Quick reply'
  | 'Visit website'
  | 'Call phone number'
  | 'Copy code'
  | 'Booking link'
  | 'Payment link';

export interface TemplateButton {
  type: ButtonType;
  text: string;
  value?: string;
}

export interface WhatsAppTemplate extends BaseEntity {
  template_name: string;
  category: TemplateCategory;
  language: string;
  header_type: 'none' | 'text' | 'image' | 'video' | 'document';
  header_content: string;
  body_message: string;
  footer: string;
  buttons: TemplateButton[];
  variables: string[];
  sample_variable_values: Record<string, string>;
  status: TemplateStatus;
  rejection_reason: string;
  version: number;
  created_by: string;
  approval_comments: { author_id: string; text: string; at: string; action: string }[];
  status_history: { status: TemplateStatus; at: string }[];
}

export type CampaignStatus =
  | 'Draft'
  | 'Pending Approval'
  | 'Approved'
  | 'Scheduled'
  | 'Sending'
  | 'Sent'
  | 'Paused'
  | 'Completed'
  | 'Failed';

export interface WhatsAppCampaign extends BaseEntity {
  name: string;
  template_id: string | null;
  audience_filter: string;
  audience_count: number;
  status: CampaignStatus;
  scheduled_at: string | null;
  metrics: {
    sent: number;
    delivered: number;
    read: number;
    replied: number;
    failed: number;
    bookings: number;
    payments: number;
    revenue: number;
  };
  is_broadcast?: boolean;
}

export interface DeliveryLog extends BaseEntity {
  message_id: string;
  lead_id: string;
  conversation_id: string | null;
  template_id: string | null;
  campaign_id: string | null;
  provider_name: WhatsAppProvider;
  sender: string;
  recipient: string;
  message_type: string;
  status: MessageStatus;
  sent_at: string | null;
  delivered_at: string | null;
  read_at: string | null;
  failed_at: string | null;
  failure_reason: string;
  provider_response: string;
  retry_count: number;
}

// ---- Nurture ---------------------------------------------------------------

export type NurtureChannel = 'WhatsApp' | 'Email' | 'SMS' | 'Manual task';

export interface NurtureStep {
  id: string;
  order: number;
  channel: NurtureChannel;
  delay_days: number;
  message: string;
}

export interface NurtureSequence extends BaseEntity {
  name: string;
  description: string;
  steps: NurtureStep[];
  status: 'active' | 'paused' | 'draft';
  enrolled_count: number;
  trigger: string;
}

export interface NurtureEnrollment extends BaseEntity {
  sequence_id: string;
  lead_id: string;
  current_step: number;
  status: 'active' | 'paused' | 'completed';
  steps_sent: { step_id: string; at: string }[];
}

// ---- Marketing Campaigns ---------------------------------------------------

export interface Campaign extends BaseEntity {
  campaign_name: string;
  source: string;
  medium: string;
  campaign_type: string;
  budget: number;
  spend: number;
  start_date: string;
  end_date: string;
  status: 'Active' | 'Paused' | 'Completed' | 'Draft';
  leads_generated: number;
  bookings: number;
  revenue: number;
}

// ---- Tracking / Attribution ------------------------------------------------

export type TrackingEventType =
  | 'Page View'
  | 'Form Submitted'
  | 'WhatsApp Click'
  | 'WhatsApp Inbound Message'
  | 'WhatsApp Outbound Message'
  | 'Lead Created'
  | 'AI Qualified'
  | 'Booking Created'
  | 'Call Completed'
  | 'Proposal Sent'
  | 'Payment Created'
  | 'Payment Completed'
  | 'Deal Won'
  | 'Deal Lost'
  | 'Nurture Step Sent'
  | 'Pipeline Stage Changed'
  | 'Campaign Sent'
  | 'Broadcast Sent';

export interface TrackingEvent extends BaseEntity {
  event_type: TrackingEventType;
  lead_id: string | null;
  source: string;
  medium: string;
  campaign: string;
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  utm_content: string;
  utm_term: string;
  provider_name: string;
  lifecycle_stage: string;
  metadata_json: Record<string, unknown>;
}

// ---- Payments --------------------------------------------------------------

export type PaymentStatus = 'Pending' | 'Sent' | 'Paid' | 'Failed' | 'Refunded';

export interface Payment extends BaseEntity {
  lead_id: string;
  deal_id: string | null;
  amount: number;
  currency: string;
  status: PaymentStatus;
  payment_method: string;
  payment_link: string;
  payment_date: string | null;
  source: string;
  campaign: string;
}

// ---- Automations -----------------------------------------------------------

export interface Automation extends BaseEntity {
  name: string;
  trigger: string;
  condition: string;
  action: string;
  status: 'active' | 'inactive';
  last_run: string | null;
  created_by: string;
  run_count: number;
  logs: { at: string; result: string }[];
}

// ---- Generic Templates -----------------------------------------------------

export interface GenericTemplate extends BaseEntity {
  name: string;
  type: string;
  content: string;
  scope: 'tenant' | 'global';
  version: number;
}

// ---- Notifications ---------------------------------------------------------

export interface Notification extends BaseEntity {
  type: string;
  title: string;
  message: string;
  read: boolean;
  icon: string;
  link: string;
}

// ---- Integrations ----------------------------------------------------------

export interface Integration extends BaseEntity {
  name: string;
  category: string;
  status: 'connected' | 'disconnected' | 'simulation';
  last_sync: string | null;
  description: string;
  logo_color: string;
  config: Record<string, string>;
  error_logs: string[];
}

// ---- Tasks -----------------------------------------------------------------

export interface Task extends BaseEntity {
  title: string;
  lead_id: string | null;
  assigned_user_id: string | null;
  due_date: string;
  status: 'open' | 'done';
  priority: 'low' | 'medium' | 'high';
}

// ---- Audit Logs ------------------------------------------------------------

export interface AuditLog extends BaseEntity {
  actor_id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  detail: string;
}

// ---- Timeline (derived) ----------------------------------------------------

export interface TimelineItem {
  id: string;
  at: string;
  type: string;
  title: string;
  description: string;
  icon: string;
}

// ---- WhatsApp Settings -----------------------------------------------------

export interface WhatsAppSettings {
  whatsapp_mode: 'native' | 'third_party';
  provider_name: WhatsAppProvider;
  provider_status: 'connected' | 'disconnected';
  access_token: string;
  business_account_id: string;
  phone_number_id: string;
  webhook_url: string;
  verify_token: string;
  default_sender_number: string;
  sync_templates_enabled: boolean;
  sync_messages_enabled: boolean;
  sync_contacts_enabled: boolean;
}

// ---- Settings --------------------------------------------------------------

export interface TenantSettings {
  company_name: string;
  company_website: string;
  accent_color: string;
  qualification_questions: string[];
  pipeline_stages: PipelineStage[];
  scoring_rules: { factor: string; weight: number }[];
  consent_required: boolean;
  data_retention_days: number;
  notification_prefs: Record<string, boolean>;
  whatsapp: WhatsAppSettings;
}

// ---- Provider Adapter ------------------------------------------------------

export interface ProviderResponse {
  ok: boolean;
  provider: WhatsAppProvider;
  message_id: string;
  status: MessageStatus;
  raw: Record<string, unknown>;
  error?: string;
}

export interface WhatsAppAdapter {
  name: WhatsAppProvider;
  sendMessage(to: string, body: string): ProviderResponse;
  sendTemplate(to: string, templateName: string, vars: Record<string, string>): ProviderResponse;
  syncMessages(): { synced: number };
  syncTemplates(): { synced: number };
  syncContacts(): { synced: number };
  getDeliveryStatus(messageId: string): MessageStatus;
  submitTemplate(templateName: string): { ok: boolean; status: string };
  getTemplateStatus(templateName: string): string;
}
