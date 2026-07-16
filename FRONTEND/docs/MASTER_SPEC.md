# InnovateX Revenue OS — Master Product & Engineering Specification

> **Single source of truth** for product, design, and engineering.
> **Build status:** Working front-end prototype (no backend). React + TypeScript + Vite + Tailwind + Zustand. ~7,000 LOC, 57 files.
> **Companion docs:** `FRONTEND_SPEC.md` (per-page summary), `DEVELOPER_HANDOFF.md` (technical reference). This file supersedes/combines both for a complete handoff.

---

# Table of Contents

**PART A — PRODUCT**
- A1. Executive Summary
- A2. Vision & Positioning
- A3. Target Users & Use Cases
- A4. User Roles & Permission Matrix
- A5. Information Architecture (Sitemap)
- A6. End-to-End Revenue Workflow

**PART B — FUNCTIONAL SPECIFICATION (per module)**
- B1–B20. Every module: purpose, features, statuses, acceptance, implementation status

**PART C — UX / UI**
- C1. Design Principles · C2. Design Tokens · C3. Components · C4. States · C5. Responsive · C6. Accessibility

**PART D — TECHNICAL ARCHITECTURE**
- D1. Stack · D2. Architecture · D3. State & Actions · D4. Services · D5. Adapters · D6. Routing/Auth · D7. Persistence

**PART E — DATA MODEL**
- E1. Entities & Fields · E2. Enums · E3. Relationships · E4. Seed Data

**PART F — NON-FUNCTIONAL**
- F1. Performance · F2. Security · F3. Privacy/Consent · F4. i18n · F5. Browser Support

**PART G — QUALITY & ACCEPTANCE**
- G1. Acceptance Criteria Checklist · G2. Known Limitations · G3. Testing Strategy

**PART H — ROADMAP TO PRODUCTION**

**PART I — APPENDICES**
- I1. Glossary · I2. Enum Reference · I3. Env Vars · I4. Deploy Runbook · I5. FAQ

---

# PART A — PRODUCT

## A1. Executive Summary

InnovateX Revenue OS is an **AI-native, source-to-revenue operating system** for high-touch
businesses. It unifies lead capture, WhatsApp engagement, AI qualification, nurture, booking,
pipeline, call intelligence, payments, and attribution into one connected product — reducing
revenue leakage and giving operators a single command center.

This prototype is a **fully interactive, data-connected demo** (not a static mockup). Every primary
action performs a real local action, updates demo state, and reflects across related modules.

## A2. Vision & Positioning

- **Not** just a CRM. **Not** just a WhatsApp inbox. **Not** just an automation dashboard.
- It is the **infrastructure between ad-source and revenue** for service businesses.
- **Differentiators:** native + multi-provider WhatsApp panel, AI qualification & call intelligence,
  full source-to-revenue attribution, revenue-leakage detection, and an operator-grade UX.
- **Design north star:** HubSpot's breadth × Attio/Linear polish × Intercom's conversational core.

## A3. Target Users & Use Cases

| Segment | Primary jobs-to-be-done |
|---|---|
| Coaches & consultants | Qualify inbound, book strategy calls, collect payments via WhatsApp |
| EdTech businesses | Convert webinar leads, nurture at scale, reduce no-shows |
| SaaS founders | Track source→revenue, manage pipeline, automate follow-up |
| Ecommerce owners / agencies | Attribute ad spend, re-engage ghosted leads, recover carts |
| International local businesses | Premium global WhatsApp-first sales ops |

**Design stance:** global & premium (avoid region-specific assumptions).

## A4. User Roles & Permission Matrix

Roles: **Super Admin, Tenant Owner, Tenant Admin, Sales User, Read-Only User.**

| Capability | Super Admin | Tenant Owner | Tenant Admin | Sales User | Read-Only |
|---|:--:|:--:|:--:|:--:|:--:|
| View dashboards & reports | ✅ | ✅ | ✅ | ✅ | ✅ |
| Manage leads / pipeline / WhatsApp | ✅ | ✅ | ✅ | ✅ | 👁 view |
| Approve WhatsApp templates/campaigns | ✅ | ✅ | ✅ | ➖ submit | ➖ |
| Manage team & settings | ✅ | ✅ | ✅ | ➖ | ➖ |
| Manage integrations | ✅ | ✅ | ✅ | ➖ | ➖ |
| Super Admin Panel (all tenants) | ✅ | ➖ | ➖ | ➖ | ➖ |

> **Prototype note:** role-based **navigation** is enforced (Super Admin Panel is hidden for
> non-super-admins). Finer per-action permission enforcement is a development-phase item (see G2).
> The matrix above is the **intended** production model.

**Demo accounts** (password `password123`): `super@innovatex.com`, `owner@demo.com`,
`admin@demo.com`, `sales@demo.com`, `viewer@demo.com`.

## A5. Information Architecture (Sitemap)

```
Public
 ├─ /login
 └─ /capture            (UTM-tagged public lead form)

App (auth-guarded)
 ├─ REVENUE
 │   ├─ /dashboard
 │   ├─ /leads          (+ detail drawer)
 │   ├─ /whatsapp       (13 tabs)
 │   ├─ /qualification
 │   ├─ /pipeline
 │   ├─ /nurture
 │   ├─ /bookings
 │   └─ /calls
 ├─ GROWTH
 │   ├─ /attribution
 │   ├─ /campaigns
 │   ├─ /payments
 │   ├─ /reports        (9 tabs)
 │   ├─ /automations
 │   └─ /templates
 └─ ADMIN
     ├─ /team
     ├─ /integrations
     ├─ /settings       (10 tabs)
     └─ /super-admin    (Super Admin only)
```

## A6. End-to-End Revenue Workflow

```
Lead Capture (form / WhatsApp / Meta intake)
  → AI Qualification (score 1–10, Hot/Warm/Cold)
  → Lead Scoring → Nurture (multi-channel sequences)
  → Booking (call scheduled) → Pipeline (Kanban)
  → Call Intelligence (AI summary, objections, next steps)
  → Proposal / Payment → Attribution (source→revenue)
  → Reports → Dashboard
```
Each transition emits a **tracking event** and updates the lead **timeline**, pipeline, and dashboard.

---

# PART B — FUNCTIONAL SPECIFICATION (per module)

Legend: **✅ implemented (real, client-side)** · **🟡 simulated** · **🔭 development-phase**.

## B1. Authentication & Tenancy
- ✅ Mock login (email+password against seed users), role-based redirect, persisted session.
- ✅ Multi-tenant: workspace switcher in topbar; all data scoped by `tenant_id`.
- ✅ Logout, reset demo data.
- 🔭 Real auth (JWT/OAuth/SSO), password reset, invitations.

## B2. Dashboard
- ✅ **KPI cards (12):** total leads, qualified, hot, booked calls, pipeline value, revenue closed,
  conversion rate, avg response time, follow-up completion, WhatsApp conversations, pending replies,
  revenue-leakage alerts — **all computed from data**.
- ✅ **Charts:** leads by source, pipeline by stage, conversion funnel, revenue by source, booking
  trend, WhatsApp conversations over time, campaign performance.
- ✅ **Sections:** recent activity feed, top campaigns, revenue-leakage alerts, weekly AI briefing.

## B3. Leads
- ✅ Fields: name, email, phone, whatsapp_number, company, source, medium, campaign, utm_source/medium/
  campaign/content/term, status, qualification_score, lead_temperature, assigned_user_id, segment,
  notes, consent_status, opt_out_status, value, created_at, last_contacted_at.
- ✅ List + search + filters (status, temperature, source); add/edit modal; archive; CSV export.
- ✅ **Duplicate detection** by email/phone.
- ✅ **Lead detail drawer:** profile, score, temperature, source/UTM, owner, **recommended next
  action (AI)**, quick actions (WhatsApp/Qualify/Book/Payment), linked counts (deals/bookings/calls/
  payments), WhatsApp message preview, notes (add), **full activity timeline**.
- ✅ **Public capture form** with UTM capture from URL + `Lead Created` tracking event.
- **Statuses:** New, Contacted, Qualified, Booked, Call Completed, Proposal Sent, Won, Lost, Nurture, Ghosted.

## B4. WhatsApp Operating Panel (native + 3rd-party mode) — **flagship**
Supports **Native InnovateX panel** and **third-party provider mode**. Providers (🟡 simulated via
adapter layer): Native Meta Cloud API, WATI, Interakt, AiSensy, Gallabox, Twilio WhatsApp, 360dialog,
Custom Webhook, Simulation Mode.

**13 tabs:**
1. **Inbox** ✅ — conversation list (search/filter), thread (bubbles, status, simulate inbound,
   assign, tags, internal notes), lead context panel (score, source/UTM, pipeline stage, payment
   status, response timer). Conversation statuses: New, Open, Pending, Qualified, Booked, Won, Lost, Ghosted.
2. **Contacts / Leads** ✅ — WA contacts with consent/opt-out/score.
3. **Templates** ✅ — create/edit/duplicate; status-aware actions.
4. **Template Approval** ✅ — full state machine (11 statuses), status timeline, approval comments.
5. **Campaigns** ✅ — audience filter + approved template + recipient count; approve/schedule/send
   (🟡 simulated metrics); metrics (sent/delivered/read/replied/failed/bookings/payments/revenue).
6. **Nurture Messages** ✅ — WA steps across sequences.
7. **AI Reply Assistant** ✅ — generate reply/booking/payment/objection/follow-up; rewrite shorter/
   professional/persuasive; copy.
8. **Broadcasts** ✅ — broadcast-flagged campaigns; exclude opted-out.
9. **Automation Rules** ✅ — WA trigger→action toggles.
10. **Opt-Out / Consent** ✅ — consent KPIs, suppression list, manual opt-out; keywords STOP/
    UNSUBSCRIBE/CANCEL/NO/REMOVE; **sending to opted-out is blocked + logged**.
11. **Delivery Logs** ✅ — per-message log (provider, recipient, status, retries, timestamps).
12. **WhatsApp Analytics** ✅ — KPIs + charts (conversations over time, reply rate by campaign,
    template performance, delivery funnel).
13. **WhatsApp Settings** ✅ — mode/provider/token/IDs/webhook/verify token/sender; sync toggles;
    "Sync now" (🟡).

**Composer** ✅: AI replies, rewrite tools, template insert, variable insert
(`{{lead_name}}`, `{{company_name}}`, `{{offer_name}}`, `{{booking_link}}`, `{{payment_link}}`,
`{{sales_rep_name}}`, `{{call_date}}`, `{{lead_problem}}`, `{{campaign_name}}`), schedule, send.
On send: append message + update conversation + lead.last_contacted_at + delivery log + tracking event + toast.

**Template Builder** ✅: name, category (10), language, header type, body (auto-detect `{{vars}}`),
footer, buttons (6 types), **live WhatsApp phone preview**.

**Template approval workflow (state machine):**
`Draft → Submitted for Internal Review → {Internally Approved | Changes Requested | Rejected Internally}
→ Submitted to Provider → {Provider Approved | Provider Rejected} → Active ↔ Paused → Archived`.
Active/Provider-Approved templates are usable in campaigns/nurture/manual/automation.

## B5. AI Qualification
- ✅ Configurable discovery questions (from settings) → AI engine → **fit score 1–10**, temperature,
  quality, buying intent, urgency, pain points, recommended offer, **next action**, follow-up draft.
- ✅ Apply & route to booking/nurture/sales; updates lead score/temp/status + timeline + (hot) notify.
- ✅ Human override (edit score on lead). 🟡 AI is mock/deterministic; 🔭 real model via `VITE_AI_API_KEY`.

## B6. Pipeline
- ✅ 9-stage Kanban (New Lead, Qualified, Booked Call, Call Completed, Proposal Sent, Negotiation,
  Won, Lost, Nurture). **Drag-and-drop** (+ arrow fallback). Deal value, probability, owner, source.
- ✅ Add/delete deal, owner filter, per-stage totals, win-rate KPI. Each move → lead status + tracking event.

## B7. Nurture Engine
- ✅ 6 default sequences (Hot Lead, Webinar, Ghosted Re-Engagement, No-Show Recovery, Payment Reminder,
  Proposal Follow-Up). Multi-channel steps (WhatsApp/Email/SMS/Manual task) with delay days.
- ✅ Create sequence, activate/pause, **enroll lead** (→ tracking event). 🔭 real scheduled sending.

## B8. Calendar / Bookings
- ✅ Create booking (lead/date/time/type/owner); statuses Scheduled/Completed/No Show/Cancelled/
  Rescheduled (inline editable). On create: lead→Booked, create/advance deal, tracking event, notify.
- 🔭 real calendar (Calendly/Cal.com) sync.

## B9. Call Intelligence
- ✅ Log call (lead/outcome/transcript) → **AI summary**, extracted objections, next steps, follow-up
  draft, proposal outline, call score. Outcomes: Interested, Not Interested, Needs Follow-Up,
  Proposal Requested, Closed Won, Closed Lost, No Show. On save: lead status + timeline + notify.

## B10. Attribution & Tracking
- ✅ Tracking-event model with 18 event types + full UTM lineage; attribution dashboard (leads/
  bookings/revenue by source, events by type, source-to-revenue table, recent events feed); CSV.
- 🔭 **Real server-to-server tracking** (pixel, fbclid/gclid, identity stitching, Conversions API,
  ad-spend ingestion, multi-touch) — development-phase (see PART H).

## B11. Campaigns (marketing)
- ✅ Create campaign; **UTM tracking-link generator** (copyable, feeds `/capture`); budget/spend/
  leads/bookings/revenue/ROAS; CSV. 🟡 metrics seeded/simulated.

## B12. Payments
- ✅ Create payment link; statuses Pending/Sent/Paid/Failed/Refunded; copy link; refund.
- ✅ **Mark Paid** → deal Won + lead Won + revenue + attribution event + notify. 🔭 real Stripe/Razorpay + webhooks.

## B13. Reports
- ✅ 9 tabbed reports (Lead, Pipeline, Attribution, WhatsApp, Campaign, Revenue, Sales Activity,
  Nurture, AI Qualification). Each: KPIs + charts + table + **CSV export**; date/source filters.

## B14. Automations
- ✅ Rule cards (WHEN trigger / IF condition / THEN action), enable/disable, **simulate run**, logs.
  Triggers/actions per spec. 🔭 real event-driven execution engine.

## B15. Templates (generic)
- ✅ Email, qualification scripts, follow-ups, proposal outlines, call-summary/report formats;
  tenant vs global scope; create/edit/duplicate/delete/version/copy.

## B16. Team
- ✅ User list, add user modal, inline role change, activate/deactivate, assigned-lead counts, last-active.

## B17. Integrations
- ✅ 22 integration cards (WhatsApp providers, payments, AI, calendars, email, calls, CRM/ads —
  some "coming soon"). Connect/disconnect toggle, sync, settings modal, error-log modal, status badges. 🟡 simulated.

## B18. Settings
- ✅ 10 tabs: Company, Branding, Lead Fields, Pipeline Stages, Qualification Questions, Scoring Rules,
  Notifications, Consent & Data, Billing (placeholder), Security (toggles). Editable & saved to store.

## B19. Super Admin Panel (Super Admin only)
- ✅ Platform KPIs (tenants, users, MRR, active); 5 tabs: Tenants (create/edit/suspend), All Users,
  Integration Health, Global Activity Log, Global Templates.

## B20. Notifications & Timeline
- ✅ Notification bell with unread count, dropdown, mark read / mark all read; 13 notification types.
- ✅ Per-lead **timeline** aggregates lead/events/messages/bookings/calls/payments/pipeline moves.

---

# PART C — UX / UI

## C1. Design Principles
Premium, clean, enterprise-ready, AI-native, revenue-focused, operator-grade, global. Dark navy
sidebar + light workspace; rounded high-contrast cards; modern tables; status badges; modals;
drawers; toasts; empty/loading states.

## C2. Design Tokens (`tailwind.config.js`)
- **Colors:** `brand` (indigo 50–950), `ink` (slate 50–950), `sidebar` (#0b1220 + accent/hover),
  `accent` (teal #14b8a6 / violet #8b5cf6 / blue #3b82f6).
- **Shadows:** `card`, `soft`. **Animations:** `fade-in`, `slide-in`, `slide-up`. **Font:** Inter.
- **CSS classes** (`index.css`): `.btn(+variants)`, `.input`, `.label`, `.card`.

## C3. Components (`components/ui`)
Button, Card/CardHeader, Badge/StatusBadge (+`statusTone()`), Avatar, Modal (sm/md/lg/xl, Esc-close),
Drawer, Field, Input/Textarea/Select, Toggle, Tabs, SearchInput, EmptyState, PageHeader (with
breadcrumb), Table/Th/Td/Tr, KpiCard, Toaster. Charts: BarChartCard, LineChartCard, DonutChartCard,
FunnelChartCard.

## C4. States
- **Empty:** every list/grid has an `EmptyState` with CTA.
- **Loading:** simulated latency on login; instant elsewhere (local data).
- **Error:** app-wide `ErrorBoundary` → recovery card (Reload / Reset demo).
- **Feedback:** toast on every meaningful action; status badges everywhere; opt-out block warnings.

## C5. Responsive
Sidebar collapses to a drawer < lg; topbar search hides on small screens; grids reflow 4→2→1; tables
scroll horizontally; WhatsApp inbox panels stack.

## C6. Accessibility (current + gaps)
- ✅ Semantic buttons/labels, keyboard Esc on modal, focus rings via Tailwind.
- 🔭 Full ARIA roles, focus trapping in modals/drawers, screen-reader audit, color-contrast pass.

---

# PART D — TECHNICAL ARCHITECTURE

## D1. Stack
React 18.3 · TypeScript 5.6 (strict) · Vite 5 · Tailwind 3.4 · Zustand 5 · React Router 6 ·
Recharts 2 · lucide-react. **No backend.**

## D2. Architecture
Single `Database` object in a Zustand store, hydrated from `localStorage` (or seeded). Components
**read** via hooks/selectors and **write** via store actions. Each action clones → mutates →
persists → emits tracking/notification/toast. Tenancy via `activeTenantId`.

## D3. State & Actions (`store/store.ts`)
`set(mutator)` is the only mutation primitive. Helpers: `base()`, `track()`, `notify()`.
**50+ actions** (full list & side effects in `DEVELOPER_HANDOFF.md` §8): auth (`login/logout/
switchTenant`), leads (`createLead/updateLead/archiveLead/qualifyLead`), pipeline (`moveDealStage/
createDeal/updateDeal/deleteDeal`), bookings, calls, payments (`createPayment/markPaymentPaid/
updatePayment`), WhatsApp (`sendMessage/simulateInbound/updateConversation/setConversationStatus`),
templates (`createTemplate/updateTemplate/transitionTemplate`), campaigns (`createCampaign/
transitionCampaign/sendCampaign/createMarketingCampaign`), nurture, automations, generic templates,
tasks, integrations, notifications, settings, users, tenants, `resetDemo`.

## D4. Services
- `aiService.ts` (mock, deterministic; `isAiLive()` gate): `qualifyLead, generateLeadScore,
  generateWhatsAppReply, rewriteWhatsAppMessage, generateFollowUpMessage, summarizeCall,
  extractObjections, draftProposal, generateWeeklyBriefing`.
- `whatsappService.ts`: `sendWhatsAppMessage(provider,to,body)` (common router),
  `sendWhatsAppTemplate, submitTemplateToProvider, syncFromProvider`, `OPT_OUT_KEYWORDS`, `isOptOutMessage`.

## D5. WhatsApp Adapters (`services/whatsappAdapters`)
`WhatsAppAdapter` interface: `sendMessage, sendTemplate, syncMessages, syncTemplates, syncContacts,
getDeliveryStatus, submitTemplate, getTemplateStatus`. Factory creates simulated adapters per
provider; `getAdapter(provider)` resolves. **To go live:** implement real BSP calls in adapter bodies.

## D6. Routing / Auth
`App.tsx` route table; `AppLayout` guards auth; `/super-admin` role-gated; `nav.ts` filters sidebar by role.

## D7. Persistence
localStorage keys: `innovatex_db_v1` (DB), `innovatex_user` (session). No migrations — bump key on
schema change. Reset via `resetDemo()` / ErrorBoundary / `localStorage.clear()`.

---

# PART E — DATA MODEL

## E1. Entities & Fields
Full field-level definitions in `types/index.ts` and `DEVELOPER_HANDOFF.md` §6. Every major entity
extends `BaseEntity { id, tenant_id, created_at, updated_at }`. Entities: Tenant, User, Lead, Deal,
Booking, CallRecord, WhatsAppConversation, WhatsAppMessage, WhatsAppTemplate, WhatsAppCampaign,
DeliveryLog, NurtureSequence, NurtureEnrollment, Campaign, TrackingEvent, Payment, Automation,
GenericTemplate, Notification, Integration, Task, AuditLog, TenantSettings, WhatsAppSettings.

## E2. Enums (see I2 for full lists)
LeadStatus(10), LeadTemperature(3), PipelineStageId(9), BookingStatus(5), CallOutcome(7),
ConversationStatus(8), MessageStatus(12), TemplateStatus(11), TemplateCategory(10), ButtonType(6),
CampaignStatus(9), PaymentStatus(5), TrackingEventType(18), WhatsAppProvider(9), UserRole(5),
NurtureChannel(4).

## E3. Relationships
```
Tenant 1─* User
Tenant 1─* Lead 1─* Deal | Booking | CallRecord | Payment | WhatsAppConversation | TrackingEvent
WhatsAppConversation 1─* WhatsAppMessage 1─1 DeliveryLog
WhatsAppTemplate *─* WhatsAppCampaign
NurtureSequence 1─* NurtureEnrollment *─1 Lead
User 1─* (assigned) Lead | Deal | Booking | CallRecord
Tenant 1─1 TenantSettings (1─1 WhatsAppSettings)
```

## E4. Seed Data (`data/seedData.ts`, deterministic PRNG)
2 tenants · 5 users · 40 leads (+6 tenant-2) · 15 deals · 12 bookings · 6 calls · 15 conversations ·
~90 messages · 10 templates · 5 campaigns + 2 broadcasts · 40 delivery logs · 6 sequences ·
8 enrollments · 8 marketing campaigns · 80 tracking events · 6 payments · 6 automations ·
12 generic templates · 12 notifications · 22 integrations · 8 tasks · 14 audit logs · settings/tenant.

---

# PART F — NON-FUNCTIONAL

## F1. Performance
- Local data → instant interactions. Build: ~1.6 MB JS (single chunk, gzip ~370 KB). 🔭 route-based
  code-splitting (`React.lazy`) to reduce first load.

## F2. Security (current vs target)
- Current: mock auth, plaintext demo passwords (demo only), no server. **Do not ship as-is.**
- Target: hashed creds, JWT/OAuth/SSO, enforced RBAC per action, audit logging, secret management,
  rate limiting, input validation, CSRF/XSS hardening.

## F3. Privacy / Consent
- ✅ Consent status + opt-out per lead, suppression list, opt-out keywords, sending blocked for
  opted-out, consent toggle in settings, data-retention setting (placeholder).
- 🔭 Enforced retention, GDPR/CCPA flows (export/delete), audit of consent changes.

## F4. Internationalization
- Currency/date via `Intl`. Copy is English-only; multi-language WhatsApp templates supported in the
  model. 🔭 full i18n of UI copy.

## F5. Browser Support
Modern evergreen browsers (Chrome/Safari/Edge/Firefox). Uses `structuredClone` with JSON fallback.

---

# PART G — QUALITY & ACCEPTANCE

## G1. Acceptance Criteria Checklist (all ✅ in prototype)
- [x] User can log in; role-based navigation works
- [x] Dashboard loads realistic, computed metrics
- [x] Create/edit leads; UTM/source stored; duplicate detection
- [x] Lead detail shows full timeline
- [x] WhatsApp inbox works; send simulated message; AI reply (mock) works
- [x] Create WhatsApp template; internal approval; simulated provider approval
- [x] WhatsApp campaign creation; approval/send simulation
- [x] AI qualification updates lead score
- [x] Pipeline stage movement works
- [x] Booking creation updates lead/pipeline/timeline
- [x] Call summary generation works
- [x] Nurture sequence can be assigned
- [x] Payment can be marked paid (closes deal, updates revenue/attribution)
- [x] Attribution dashboard updates
- [x] Reports work + CSV export
- [x] Integrations page interactive
- [x] Settings editable
- [x] Super Admin can view/manage tenants
- [x] Notifications work
- [x] No broken pages / dead buttons / empty main modules
- [x] App runs and builds successfully

## G2. Known Limitations (be explicit with stakeholders)
- No backend; data is per-browser in localStorage.
- All integrations (WhatsApp, payments, AI, calendar, attribution events) are **simulated**.
- No real server-to-server tracking / pixel / Conversions API / ad-spend ingestion.
- RBAC is nav-level only (per-action enforcement is development-phase).
- No automated tests yet; single JS bundle (no code-splitting).
- Demo auth/passwords are not production-secure.

## G3. Testing Strategy (recommended for development phase)
- **Unit:** Vitest for `utils/calculations`, `aiService`, store actions.
- **Component:** Testing Library for key flows (login, lead create, qualify, pay).
- **E2E:** Playwright for the full demo journey.
- **Type safety:** `npm run lint` (tsc) in CI. **CI/CD:** build + tests on PR.

---

# PART H — ROADMAP TO PRODUCTION

**P0 — Backend & persistence:** API + DB (Node/Postgres or Supabase); replace localStorage store with
server state + optimistic updates; real auth + enforced RBAC.

**P1 — Real tracking (Hyros-class):** first-party pixel (visitor id, UTMs, fbclid/gclid/ttclid);
S2S event API + identity graph (click→lead→payment, cross-device); Conversions API (Meta/Google/
TikTok); ad-spend ingestion → real ROAS; multi-touch attribution.

**P1 — Real WhatsApp:** implement BSP adapter bodies (Meta Cloud first); inbound + delivery webhooks;
real template submission/approval polling.

**P1 — Real AI:** branch `aiService` on `isAiLive()` to call OpenAI/Claude; keep mock fallback.

**P2 — Payments & calendar:** Stripe/Razorpay links + webhooks; Calendly/Cal.com sync.

**P2 — Hardening:** code-splitting, tests, Sentry, analytics, accessibility, i18n, CI/CD.

---

# PART I — APPENDICES

## I1. Glossary
- **Lead temperature:** Hot/Warm/Cold derived from qualification score.
- **Tracking event:** an immutable record of a lifecycle action with source/UTM lineage.
- **BSP:** Business Solution Provider (WhatsApp gateway, e.g. WATI/Twilio).
- **Attribution:** mapping revenue back to its originating source/campaign.
- **Leakage:** revenue at risk (ghosted leads, idle proposals, booked-but-unpaid).
- **Nurture sequence:** an ordered multi-channel follow-up flow.
- **Tenant:** an isolated customer workspace.

## I2. Enum Reference
- **LeadStatus:** New, Contacted, Qualified, Booked, Call Completed, Proposal Sent, Won, Lost, Nurture, Ghosted
- **PipelineStageId:** new_lead, qualified, booked_call, call_completed, proposal_sent, negotiation, won, lost, nurture
- **BookingStatus:** Scheduled, Completed, No Show, Cancelled, Rescheduled
- **CallOutcome:** Interested, Not Interested, Needs Follow-Up, Proposal Requested, Closed Won, Closed Lost, No Show
- **ConversationStatus:** New, Open, Pending, Qualified, Booked, Won, Lost, Ghosted
- **MessageStatus:** Draft, Pending Approval, Scheduled, Queued, Sent, Delivered, Read, Replied, Failed, Cancelled, Blocked by Opt-Out, Blocked by Template Not Approved
- **TemplateStatus:** Draft, Submitted for Internal Review, Changes Requested, Internally Approved, Rejected Internally, Submitted to Provider, Provider Pending, Provider Approved, Provider Rejected, Active, Paused, Archived
- **TemplateCategory:** Marketing, Utility, Authentication, Follow-up, Booking, Payment, Reminder, Re-engagement, Onboarding, Support
- **ButtonType:** Quick reply, Visit website, Call phone number, Copy code, Booking link, Payment link
- **CampaignStatus:** Draft, Pending Approval, Approved, Scheduled, Sending, Sent, Paused, Completed, Failed
- **PaymentStatus:** Pending, Sent, Paid, Failed, Refunded
- **TrackingEventType (18):** Page View, Form Submitted, WhatsApp Click, WhatsApp Inbound Message, WhatsApp Outbound Message, Lead Created, AI Qualified, Booking Created, Call Completed, Proposal Sent, Payment Created, Payment Completed, Deal Won, Deal Lost, Nurture Step Sent, Pipeline Stage Changed, Campaign Sent, Broadcast Sent
- **WhatsAppProvider (9):** Native Meta Cloud API, WATI, Interakt, AiSensy, Gallabox, Twilio WhatsApp, 360dialog, Custom Webhook Provider, Simulation Mode
- **NurtureChannel:** WhatsApp, Email, SMS, Manual task
- **UserRole:** Super Admin, Tenant Owner, Tenant Admin, Sales User, Read-Only User

## I3. Environment Variables
- `VITE_AI_API_KEY` (optional) — when set, structured to enable real AI later. App works without it.
- No other env vars required.

## I4. Deploy Runbook (Vercel)
1. Push to `main` (Vercel production branch). 2. Vercel auto-builds (`npm run build` → `dist`).
3. `vercel.json` provides SPA rewrite. 4. Disable **Deployment Protection** for a public demo link.
5. Verify the deployed URL loads the login page; sign in with a demo account.

## I5. FAQ
- **Does it have real WhatsApp / payments / tracking?** No — all simulated; real integrations are
  development-phase (PART H).
- **Where is data stored?** Browser localStorage, per visitor; reset anytime.
- **Is it secure for production?** No — it's a prototype; production needs the P0/P1 work.
- **Can we add real AI without breaking it?** Yes — `aiService` is structured for that via `isAiLive()`.
- **How do we add a page/entity?** See `DEVELOPER_HANDOFF.md` §22 recipes.

---

*This master spec, plus `FRONTEND_SPEC.md` and `DEVELOPER_HANDOFF.md`, fully document the product.
Keep them updated as the codebase evolves.*
