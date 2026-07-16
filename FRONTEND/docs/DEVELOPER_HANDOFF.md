# InnovateX Revenue OS — Developer Handoff & Technical Reference

> **Audience:** Engineers taking over / extending this codebase.
> **Status:** Working front-end prototype (no backend). ~7,000 LOC across 57 TS/TSX files.
> **Goal of this doc:** Document **everything** — architecture, data model, state, services,
> every page, conventions, gotchas, and the path to production — so a new developer can be
> productive on day one.

---

## Table of Contents
1. [Product Overview](#1-product-overview)
2. [Tech Stack & Rationale](#2-tech-stack--rationale)
3. [Running, Building & Deploying](#3-running-building--deploying)
4. [Project Structure](#4-project-structure)
5. [Architecture & Data Flow](#5-architecture--data-flow)
6. [Data Model (Types)](#6-data-model-types)
7. [Seed Data](#7-seed-data)
8. [State Management — The Store](#8-state-management--the-store)
9. [Toast System](#9-toast-system)
10. [Hooks & Selectors](#10-hooks--selectors)
11. [Services Layer](#11-services-layer)
12. [WhatsApp Provider Adapters](#12-whatsapp-provider-adapters)
13. [Utilities](#13-utilities)
14. [Design System & UI Components](#14-design-system--ui-components)
15. [Charts](#15-charts)
16. [Routing, Auth & Roles](#16-routing-auth--roles)
17. [Page-by-Page Deep Dive](#17-page-by-page-deep-dive)
18. [Cross-Module "Connected" Behavior](#18-cross-module-connected-behavior)
19. [Persistence & Demo Reset](#19-persistence--demo-reset)
20. [What's Real vs Simulated](#20-whats-real-vs-simulated)
21. [Known Gotchas & Conventions](#21-known-gotchas--conventions)
22. [How to Extend (Recipes)](#22-how-to-extend-recipes)
23. [Roadmap to Production](#23-roadmap-to-production)

---

## 1. Product Overview

InnovateX Revenue OS is a **source-to-revenue operating system** for high-touch businesses
(coaches, EdTech, SaaS founders, ecommerce/agencies). It unifies the full journey:

```
Lead Capture → WhatsApp → AI Qualification → Nurture → Booking → Pipeline
→ Call Intelligence → Payment → Attribution → Reports → Dashboard
```

The prototype is **fully interactive and data-connected**: actions in one module update related
modules and the dashboard. It is multi-tenant and role-based. All external integrations
(WhatsApp providers, payments, AI, calendars) are **simulated** behind clean interfaces.

---

## 2. Tech Stack & Rationale

| Concern | Choice | Why |
|---|---|---|
| UI library | **React 18.3** | Standard, component model. |
| Language | **TypeScript 5.6** (strict) | Type safety across a large domain model. |
| Build tool | **Vite 5** | Fast dev server + simple static build. |
| Styling | **Tailwind CSS 3.4** | Utility-first; custom design tokens in `tailwind.config.js`. |
| State | **Zustand 5** | Minimal global store; localStorage persistence. |
| Routing | **React Router 6** | SPA routing. |
| Charts | **Recharts 2** | Declarative charts. |
| Icons | **lucide-react** | Consistent icon set. |

**No backend.** Data lives in the browser (`localStorage`). The codebase is structured so a real
API can replace the mock store with minimal page changes (pages call store actions, not fetch).

---

## 3. Running, Building & Deploying

```bash
npm install        # install deps
npm run dev        # dev server → http://localhost:5173
npm run build      # type-check (tsc -b) + production build → dist/
npm run preview    # preview the production build
npm run lint       # tsc --noEmit (type check only)
```

**Node:** 18+ (built/tested on Node 22).

**Environment variables:** none required. Optional `VITE_AI_API_KEY` is read by `aiService`
(`isAiLive()`); when present, code is structured to later call a real model. The app **never
breaks** if it's missing — all AI is mocked.

**Deployment (Vercel):**
- `vercel.json` sets framework=vite, build=`npm run build`, output=`dist`, and a **SPA rewrite**
  (`/(.*) → /index.html`) so client-side routes don't 404.
- **Production branch is `main`** — Vercel auto-deploys on push to `main`. (The original repo's
  `main` only had a PDF; the app code was merged into `main` so deploys work.)
- Make sure **Vercel → Settings → Deployment Protection** is disabled if the demo link must be
  publicly viewable.

---

## 4. Project Structure

```
/
├── index.html                 # Vite entry; loads Inter font
├── vite.config.ts             # @ alias → src/, dev server host/port
├── vercel.json                # Vercel build + SPA rewrite
├── tailwind.config.js         # design tokens (colors, shadows, animations)
├── postcss.config.js
├── tsconfig.json              # strict TS, @/* path alias
├── README.md                  # setup + demo flow
├── docs/
│   ├── FRONTEND_SPEC.md        # per-page design/flow/features (summary)
│   └── DEVELOPER_HANDOFF.md    # THIS FILE
└── src/
    ├── main.tsx               # React root + ErrorBoundary + Router
    ├── App.tsx                # Route table
    ├── index.css              # Tailwind layers + component classes (.btn, .input, .card…)
    ├── components/
    │   ├── ErrorBoundary.tsx  # catches render errors → recovery UI
    │   ├── layout/
    │   │   ├── AppLayout.tsx   # shell: Sidebar + Topbar + <Outlet/>, auth guard
    │   │   ├── Sidebar.tsx     # dark grouped nav, role-filtered
    │   │   ├── Topbar.tsx      # workspace switcher, search, notifications, profile
    │   │   └── nav.ts          # NAV_ITEMS config + visibleNav(role)
    │   ├── ui/
    │   │   ├── index.tsx       # Button, Card, Modal, Drawer, Tabs, Table, Badge,
    │   │   │                   #   Avatar, Toggle, Input/Select/Textarea, Field,
    │   │   │                   #   SearchInput, EmptyState, PageHeader, StatusBadge…
    │   │   ├── KpiCard.tsx
    │   │   └── Toaster.tsx
    │   └── charts/
    │       └── index.tsx       # BarChartCard, LineChartCard, DonutChartCard, FunnelChartCard
    ├── pages/                  # one folder per module (see §17)
    │   ├── Auth/  Dashboard/  Leads/  WhatsApp/  AIQualification/  Pipeline/
    │   ├── Nurture/  Bookings/  Calls/  Attribution/  Campaigns/  Payments/
    │   └── Reports/  Automations/  Templates/  Team/  Integrations/  Settings/  SuperAdmin/
    ├── data/
    │   └── seedData.ts         # Database interface + generateSeed()
    ├── store/
    │   ├── store.ts            # central Zustand store + all actions
    │   ├── toastStore.ts       # toast notifications store
    │   └── hooks.ts            # useDb, useTenant, useSettings, useUsers, userName
    ├── services/
    │   ├── aiService.ts        # mock AI functions
    │   ├── whatsappService.ts  # sendWhatsAppMessage router + opt-out helpers
    │   └── whatsappAdapters/   # 9 provider adapters + factory + getAdapter()
    ├── types/
    │   └── index.ts            # all domain types
    └── utils/
        ├── formatters.ts       # currency/date/number/timeAgo/initials/percent
        ├── calculations.ts     # dashboard metrics, grouping, timeline, funnels
        ├── csvExport.ts        # client-side CSV download
        └── id.ts               # uid(), nowISO(), daysAgo(), etc.
```

---

## 5. Architecture & Data Flow

**One source of truth:** a single `Database` object held in the Zustand store, hydrated from
`localStorage` (or seeded on first load).

```
        ┌──────────────────────────── localStorage ("innovatex_db_v1") ───────────────────────────┐
        │                                                                                          │
        ▼                                                                                          ▲
   generateSeed() ──► useStore.db (Database)  ◄──── persist() on every mutation                    │
                          ▲          │                                                              │
       components read ───┘          └──► store actions mutate (immutable clone) ──► track()/notify()
       via hooks/selectors                                              │
                                                                        └──► toast()
```

- **Reads:** components use `useDb()` / `useTenant()` / direct `useStore(selector)`.
- **Writes:** components call **store actions** (never mutate state directly). Each action clones
  the DB, mutates, persists, and (where relevant) emits a **tracking event**, **notification**,
  and **toast**.
- **Tenancy:** almost every entity has `tenant_id`. The active tenant is `activeTenantId`. Hooks
  filter by it. Switching workspace in the Topbar changes `activeTenantId`.

---

## 6. Data Model (Types)

All in `src/types/index.ts`. Every major entity extends `BaseEntity`
(`id, tenant_id, created_at, updated_at`). Full list of exported types:

`BaseEntity, TenantStatus, Tenant, UserRole, User, LeadStatus, LeadTemperature, Lead,
PipelineStageId, PipelineStage, Deal, BookingStatus, Booking, CallOutcome, CallRecord,
WhatsAppProvider, ConversationStatus, WhatsAppConversation, MessageDirection, MessageStatus,
WhatsAppMessage, TemplateCategory, TemplateStatus, ButtonType, TemplateButton, WhatsAppTemplate,
CampaignStatus, WhatsAppCampaign, DeliveryLog, NurtureChannel, NurtureStep, NurtureSequence,
NurtureEnrollment, Campaign, TrackingEventType, TrackingEvent, PaymentStatus, Payment, Automation,
GenericTemplate, Notification, Integration, Task, AuditLog, TimelineItem, WhatsAppSettings,
TenantSettings, ProviderResponse, WhatsAppAdapter`

### Key entities (fields)

**Tenant:** `id, name, domain, plan('Starter'|'Growth'|'Scale'|'Enterprise'), status('active'|'suspended'|'trial'), industry, region, seats, mrr, logo_color, created_at, updated_at`

**User:** `id, tenant_id, name, email, password, role(UserRole), status('active'|'inactive'), avatar_color, title, last_active_at, …`
**UserRole:** `'Super Admin' | 'Tenant Owner' | 'Tenant Admin' | 'Sales User' | 'Read-Only User'`

**Lead:** `name, email, phone, whatsapp_number, company, source, medium, campaign,
utm_source, utm_medium, utm_campaign, utm_content, utm_term, status(LeadStatus),
qualification_score(0–10), lead_temperature('Hot'|'Warm'|'Cold'), assigned_user_id, segment,
notes, consent_status('granted'|'pending'|'revoked'), opt_out_status(bool), value,
last_contacted_at, archived?`
**LeadStatus:** `New, Contacted, Qualified, Booked, Call Completed, Proposal Sent, Won, Lost, Nurture, Ghosted`

**Deal:** `title, lead_id, stage(PipelineStageId), value, currency, expected_close_date,
assigned_user_id, source, campaign, probability, stage_history[{stage, at}]`
**PipelineStageId:** `new_lead, qualified, booked_call, call_completed, proposal_sent, negotiation, won, lost, nurture`

**Booking:** `lead_id, deal_id, meeting_date, meeting_time, meeting_type, assigned_user_id,
status('Scheduled'|'Completed'|'No Show'|'Cancelled'|'Rescheduled'), source, campaign, notes`

**CallRecord:** `lead_id, deal_id, duration_minutes, transcript, summary, objections[], next_steps[],
outcome(CallOutcome), score, assigned_user_id, call_date`
**CallOutcome:** `Interested, Not Interested, Needs Follow-Up, Proposal Requested, Closed Won, Closed Lost, No Show`

**WhatsAppConversation:** `lead_id, status(ConversationStatus), assigned_user_id, tags[],
last_message_at, unread_count, internal_notes[{author_id, text, at}]`
**ConversationStatus:** `New, Open, Pending, Qualified, Booked, Won, Lost, Ghosted`

**WhatsAppMessage:** `conversation_id, lead_id, direction('inbound'|'outbound'), body,
status(MessageStatus), template_id, campaign_id, provider_name, sender, recipient,
message_type('text'|'template'|'media')`
**MessageStatus:** `Draft, Pending Approval, Scheduled, Queued, Sent, Delivered, Read, Replied,
Failed, Cancelled, Blocked by Opt-Out, Blocked by Template Not Approved`

**WhatsAppTemplate:** `template_name, category(TemplateCategory), language, header_type, header_content,
body_message, footer, buttons(TemplateButton[]), variables[], sample_variable_values, status(TemplateStatus),
rejection_reason, version, created_by, approval_comments[{author_id,text,at,action}], status_history[{status,at}]`
**TemplateStatus (11):** `Draft → Submitted for Internal Review → Changes Requested → Internally Approved →
Rejected Internally → Submitted to Provider → Provider Pending → Provider Approved → Provider Rejected →
Active → Paused → Archived`
**TemplateCategory:** `Marketing, Utility, Authentication, Follow-up, Booking, Payment, Reminder, Re-engagement, Onboarding, Support`
**ButtonType:** `Quick reply, Visit website, Call phone number, Copy code, Booking link, Payment link`

**WhatsAppCampaign:** `name, template_id, audience_filter, audience_count, status(CampaignStatus),
scheduled_at, metrics{sent,delivered,read,replied,failed,bookings,payments,revenue}, is_broadcast?`
**CampaignStatus:** `Draft, Pending Approval, Approved, Scheduled, Sending, Sent, Paused, Completed, Failed`

**DeliveryLog:** `message_id, lead_id, conversation_id, template_id, campaign_id, provider_name,
sender, recipient, message_type, status, sent_at, delivered_at, read_at, failed_at, failure_reason,
provider_response, retry_count`

**NurtureSequence:** `name, description, steps(NurtureStep[]), status('active'|'paused'|'draft'),
enrolled_count, trigger`  ·  **NurtureStep:** `id, order, channel('WhatsApp'|'Email'|'SMS'|'Manual task'), delay_days, message`
**NurtureEnrollment:** `sequence_id, lead_id, current_step, status, steps_sent[]`

**Campaign (marketing):** `campaign_name, source, medium, campaign_type, budget, spend, start_date,
end_date, status, leads_generated, bookings, revenue`

**TrackingEvent:** `event_type(TrackingEventType), lead_id, source, medium, campaign, utm_*,
provider_name, lifecycle_stage, metadata_json`
**TrackingEventType (18):** `Page View, Form Submitted, WhatsApp Click, WhatsApp Inbound Message,
WhatsApp Outbound Message, Lead Created, AI Qualified, Booking Created, Call Completed, Proposal Sent,
Payment Created, Payment Completed, Deal Won, Deal Lost, Nurture Step Sent, Pipeline Stage Changed,
Campaign Sent, Broadcast Sent`

**Payment:** `lead_id, deal_id, amount, currency, status('Pending'|'Sent'|'Paid'|'Failed'|'Refunded'),
payment_method, payment_link, payment_date, source, campaign`

**Automation:** `name, trigger, condition, action, status('active'|'inactive'), last_run, created_by, run_count, logs[{at,result}]`

**Integration:** `name, category, status('connected'|'disconnected'|'simulation'), last_sync, description, logo_color, config, error_logs[]`

**TenantSettings:** `company_name, company_website, accent_color, qualification_questions[],
pipeline_stages(PipelineStage[]), scoring_rules[{factor,weight}], consent_required, data_retention_days,
notification_prefs, whatsapp(WhatsAppSettings)`
**WhatsAppSettings:** `whatsapp_mode('native'|'third_party'), provider_name, provider_status, access_token,
business_account_id, phone_number_id, webhook_url, verify_token, default_sender_number,
sync_templates_enabled, sync_messages_enabled, sync_contacts_enabled`

Also: `GenericTemplate, Notification, Task, AuditLog, TimelineItem(derived), ProviderResponse, WhatsAppAdapter(interface)`.

---

## 7. Seed Data

`src/data/seedData.ts` exports the **`Database`** interface (the shape of the whole store) and
**`generateSeed(): Database`**. Uses a **deterministic PRNG** (seed=1337) so the demo data is
stable across reloads.

**Seeded volumes:** 2 tenants · 5 users (incl. Super Admin) · 40 leads (+6 for tenant 2) ·
15 deals · 12 bookings · 6 calls · 15 conversations · ~90 messages · 10 WhatsApp templates ·
5 WhatsApp campaigns + 2 broadcasts · 40 delivery logs · 6 nurture sequences · 8 enrollments ·
8 marketing campaigns · 80 tracking events · 6 payments · 6 automations · 12 generic templates ·
12 notifications · 22 integrations · 8 tasks · 14 audit logs · per-tenant settings.

**Demo accounts** (password `password123`): `super@innovatex.com` (Super Admin),
`owner@demo.com` (Tenant Owner), `admin@demo.com` (Tenant Admin), `sales@demo.com` (Sales User),
`viewer@demo.com` (Read-Only).

---

## 8. State Management — The Store

`src/store/store.ts`. A single Zustand store. **Persistence:** localStorage key
`innovatex_db_v1` (data) and `innovatex_user` (logged-in user id).

**Core internals:**
- `db: Database`, `currentUserId: string|null`, `activeTenantId: string`.
- `set(mutator)` — the **only mutation primitive**: clones db (`structuredClone` with JSON fallback),
  runs `mutator(db)`, persists, sets state. **All actions go through `set()`.**
- `base(tenantId)` helper — returns `{id, tenant_id, created_at, updated_at}` for new entities.
- `track(type, leadId, extra?)` — pushes a `TrackingEvent` (auto-fills source/UTM from the lead).
- `notify({type,title,message,icon,link?})` — pushes a `Notification`.

**All actions (with side effects):**

| Action | Signature | Side effects beyond the obvious |
|---|---|---|
| `login` | `(email,pw) → User\|null` | sets currentUserId + activeTenantId, persists user |
| `logout` | `()` | clears user |
| `switchTenant` | `(tenantId)` | changes active workspace |
| `currentUser` | `() → User?` | derived getter |
| `createLead` | `(Partial<Lead>) → Lead` | + `track('Lead Created')` + notify("New lead") |
| `updateLead` | `(id, patch)` | — |
| `archiveLead` | `(id)` | sets `archived=true` + toast |
| `qualifyLead` | `(id, {score,temperature,reason,nextAction})` | updates score/temp/status/notes + `track('AI Qualified')` + (if Hot) notify + toast |
| `moveDealStage` | `(dealId, stage)` | updates deal + stage_history + maps lead status + `track('Pipeline Stage Changed')` (+ Deal Won/Lost) + toast |
| `createDeal` / `updateDeal` / `deleteDeal` | | toast |
| `createBooking` | `(Partial<Booking>) → Booking` | lead→Booked, creates/advances deal to `booked_call`, `track('Booking Created')`, notify, toast |
| `updateBooking` | `(id, patch)` | |
| `createCall` | `(Partial<CallRecord>) → CallRecord` | lead→Call Completed, `track('Call Completed')`, notify |
| `createPayment` | `(Partial<Payment>) → Payment` | `track('Payment Created')`, toast |
| `markPaymentPaid` | `(id)` | payment→Paid, lead→Won, deal→won, `track('Payment Completed'+'Deal Won')`, notify, toast |
| `updatePayment` | `(id, patch)` | |
| `sendMessage` | `(conversationId, body, {templateId?,campaignId?})` | **opt-out guard** (blocks + logs); routes via `sendWhatsAppMessage(provider)`; appends message, updates conversation `last_message_at`, lead `last_contacted_at`, writes delivery log, `track('WhatsApp Outbound Message')`, toast |
| `simulateInbound` | `(conversationId)` | appends random inbound msg, unread++, `track('WhatsApp Inbound Message')` |
| `updateConversation` / `setConversationStatus` | | |
| `createTemplate` | `(Partial) → WhatsAppTemplate` | auto-extracts `{{vars}}`, status=Draft |
| `updateTemplate` | `(id, patch)` | |
| `transitionTemplate` | `(id, status, comment?)` | pushes status_history + approval_comments; sets rejection_reason; notify on approval; toast |
| `createCampaign` | `(Partial) → WhatsAppCampaign` | zeroed metrics |
| `transitionCampaign` | `(id, status)` | notify on approval |
| `sendCampaign` | `(id)` | computes simulated metrics (delivered/read/replied/bookings/payments/revenue), status→Completed, `track('Campaign/Broadcast Sent')` |
| `createMarketingCampaign` | `(Partial<Campaign>)` | |
| `assignSequence` | `(seqId, leadId)` | creates enrollment, enrolled_count++, `track('Nurture Step Sent')` |
| `createSequence` / `toggleSequence` | | |
| `toggleAutomation` / `simulateAutomation` / `createAutomation` | | simulate adds a log + run_count++ |
| `createGenericTemplate` / `deleteGenericTemplate` | | |
| `toggleTask` / `createTask` | | |
| `toggleIntegration` / `syncIntegration` / `updateIntegrationConfig` | | toggle flips status + sets last_sync |
| `markNotificationRead` / `markAllNotificationsRead` | | |
| `updateSettings` | `(Partial<TenantSettings>)` | merges into active tenant settings |
| `createUser` / `updateUser` | | |
| `createTenant` / `updateTenant` | | createTenant copies default settings |
| `resetDemo` | `()` | wipes localStorage, regenerates seed |

---

## 9. Toast System

`src/store/toastStore.ts` — separate Zustand store. `toast.success/error/info/warning(title, desc?)`
can be called **anywhere** (even outside React, e.g. in store actions). Auto-dismiss after 4.2s.
Rendered by `<Toaster/>` (mounted once in `App.tsx`).

---

## 10. Hooks & Selectors

`src/store/hooks.ts`:
- `useDb()` → `{ db, tenantId }`.
- `useTenant(key)` → tenant-scoped array from `db[key]`.
- `useSettings()` → active tenant's `TenantSettings`.
- `useUsers()` → tenant users (+ Super Admin).
- `userName(db, id)` → display name or "Unassigned".

`src/utils/calculations.ts` (derived data — **pure functions**, no state):
`tenantData, computeDashboard, groupCount, groupSum, leadsBySource, pipelineByStage,
revenueBySource, bookingTrend, conversationsTrend, conversionFunnel, buildTimeline,
recommendedNextAction`.
- `computeDashboard(db, tenantId)` → all 12 dashboard KPIs (incl. leakage = ghosted + idle
  proposals + unpaid).
- `buildTimeline(db, leadId)` → merges lead/events/messages/bookings/calls/payments/deal-history
  into a sorted `TimelineItem[]`.

---

## 11. Services Layer

### `aiService.ts` (mock AI — deterministic, structured for a real key later)
`isAiLive()` (reads `VITE_AI_API_KEY`), `qualifyLead(lead, answers) → QualificationResult`
(score, quality, temperature, painPoints, buyingIntent, urgency, recommendedOffer, nextAction,
reason, followUpDraft), `generateLeadScore`, `generateWhatsAppReply(ctx, mode)`,
`rewriteWhatsAppMessage(text, 'shorter'|'professional'|'persuasive')`, `generateFollowUpMessage`,
`summarizeCall(transcript, lead?) → {summary, objections, nextSteps, followUpDraft, proposalOutline, score}`,
`extractObjections`, `draftProposal`, `generateWeeklyBriefing`, `summarizeCallRecord`.

> To wire real AI later: keep these signatures, branch on `isAiLive()` to call the provider,
> fall back to the mock. Pages won't change.

### `whatsappService.ts`
`sendWhatsAppMessage(provider, to, body)` (routes to the right adapter — the **single common
entry point**), `sendWhatsAppTemplate`, `submitTemplateToProvider`, `syncFromProvider`,
`OPT_OUT_KEYWORDS` (`STOP, UNSUBSCRIBE, CANCEL, NO, REMOVE`), `isOptOutMessage`.

---

## 12. WhatsApp Provider Adapters

`src/services/whatsappAdapters/` — a **clean adapter interface** (`WhatsAppAdapter`) with one
factory producing simulated adapters per provider (varying reliability). Individual re-export
files exist per provider to match the intended structure.

**Providers:** Native Meta Cloud API, WATI, Interakt, AiSensy, Gallabox, Twilio WhatsApp, 360dialog,
Custom Webhook Provider, Simulation Mode.

**Each adapter implements:** `sendMessage, sendTemplate, syncMessages, syncTemplates, syncContacts,
getDeliveryStatus, submitTemplate, getTemplateStatus`. `getAdapter(provider)` returns the right one.

> To go live: replace a given adapter's body with real BSP API calls. The store + UI are unaffected.

---

## 13. Utilities

- `formatters.ts`: `formatCurrency, formatCompact, formatNumber, formatDate, formatDateTime,
  timeAgo, initials, percent`.
- `csvExport.ts`: `exportToCSV(filename, rows[])` — client-side CSV (proper escaping) used by Leads,
  Attribution, Campaigns, Payments, and every Reports tab.
- `id.ts`: `uid(prefix)`, `nowISO()`, `daysAgo`, `daysFromNow`, `hoursAgo`.

---

## 14. Design System & UI Components

**Tokens** (`tailwind.config.js`): `brand` (indigo scale), `ink` (slate scale), `sidebar`
(`#0b1220` + accent/hover), `accent` (teal/violet/blue), shadows (`card`, `soft`), animations
(`fade-in`, `slide-in`, `slide-up`). Font: Inter.

**Component classes** (`index.css`): `.btn`, `.btn-primary/secondary/ghost/danger`, `.input`,
`.label`, `.card`.

**UI primitives** (`components/ui/index.tsx`):
`Button(variant)`, `Card`, `CardHeader`, `Badge(tone)`, `StatusBadge(status)` + `statusTone()`
mapper, `Avatar(name,color,size)`, `Modal(size: sm|md|lg|xl, footer?)` (Esc to close),
`Drawer(width)`, `Field(label,hint)`, `Input/Textarea/Select`, `Toggle`, `Tabs(tabs,active,onChange)`,
`SearchInput`, `EmptyState`, `PageHeader(title,description,actions,breadcrumb)`,
`Table/Th/Td/Tr`, `cn()` classnames helper.
Plus `KpiCard(label,value,delta?,icon,accent,hint?)` and `Toaster`.

`StatusBadge` auto-colors **any** status string via `statusTone()` (green=success, red=danger/hot,
amber=in-progress/warm, blue=new/qualified, etc.).

---

## 15. Charts

`components/charts/index.tsx` — Recharts wrappers, all responsive, themed tooltips:
`BarChartCard(data, color, horizontal?)`, `LineChartCard(data, color, area?)`,
`DonutChartCard(data)`, `FunnelChartCard(data)`. `CHART_COLORS` palette. Data shape:
`{ name: string; value: number; color? }[]`. Empty data → built-in empty state.

---

## 16. Routing, Auth & Roles

`App.tsx` route table:
- Public: `/login`, `/capture`.
- Guarded (inside `AppLayout`): `/dashboard, /leads, /whatsapp, /qualification, /pipeline, /nurture,
  /bookings, /calls, /attribution, /campaigns, /payments, /reports, /automations, /templates, /team,
  /integrations, /settings`.
- `/super-admin` — guarded **and** role-gated (`Super Admin` only; else redirect to `/dashboard`).
- `*` → redirect to `/dashboard` (if logged in) or `/login`.

**Auth:** mock. `login()` matches email+password in seed users, persists user id. `AppLayout`
redirects to `/login` if `currentUserId` is null.

**Roles:** `Sidebar` uses `visibleNav(role)` (`nav.ts`) to hide Super-Admin-only items. (Finer-grained
per-action permissions are **not** enforced in the prototype — see roadmap.)

---

## 17. Page-by-Page Deep Dive

> Format per page: **Route · Files · State used · Actions called · Design · Flow · Features · Connected effects.**

### Login — `/login` · `pages/Auth/Login.tsx`
- **State/Actions:** `login`. **Design:** split-screen (brand left / form right). **Flow:** submit →
  500ms simulated auth → toast → role-based redirect. **Features:** demo-account quick-fill chips,
  validation.

### Capture Form — `/capture` · `pages/Auth/CaptureForm.tsx`
- **Actions:** `createLead`. **Design:** public centered card, gradient bg. **Flow:** parse UTM from
  `useSearchParams` → submit → create lead (consent granted) + `Lead Created` event → success screen.
  **Features:** live UTM badges; segment + problem fields. **Connected:** new lead appears in Leads,
  Dashboard, Attribution.

### Dashboard — `/dashboard` · `pages/Dashboard/Dashboard.tsx`
- **State:** full db via `useDb`, `currentUser`. **Helpers:** `computeDashboard, leadsBySource,
  pipelineByStage, revenueBySource, bookingTrend, conversationsTrend, conversionFunnel,
  generateWeeklyBriefing`. **Design:** greeting + 12 KPI cards + AI briefing banner + chart grid +
  3 info cards. **Features:** all metrics live; recent activity; top campaigns; leakage alerts with
  CTA. **Connected:** reflects every other module's actions.

### Leads — `/leads` · `pages/Leads/{Leads,LeadDrawer,LeadFormModal}.tsx`
- **Actions:** `createLead, updateLead, archiveLead, createBooking, createPayment` (+ navigation to
  qualify/whatsapp). **Design:** filter bar + table + detail drawer + add/edit modal. **Flow:**
  search/filter → open drawer → act. **Features:** dup detection (email/phone), UTM fields, drawer
  with score/temp/source/UTM/owner/recommended action/quick actions/linked counts/WA preview/notes/
  **full timeline** (`buildTimeline`), CSV export, archive. Reads `?q=` from URL (topbar search).

### WhatsApp Panel — `/whatsapp` · `pages/WhatsApp/{WhatsAppPanel,Inbox,Composer,TemplateBuilder}.tsx`
13 tabs (single page switches content):
- **Inbox** — `sendMessage, simulateInbound, setConversationStatus, updateConversation`. 3-pane
  (list / thread / lead context). Composer: AI replies (`generateWhatsAppReply`), rewrite
  (`rewriteWhatsAppMessage`), template/variable insert, schedule, opt-out warning, ⌘/Ctrl+Enter.
- **Contacts** — WA contact table.
- **Templates** — `createTemplate(dup), updateTemplate, transitionTemplate`. Card grid + status actions.
- **Template Approval** — `transitionTemplate`. Full 11-state workflow, status timeline, comments.
- **Campaigns / Broadcasts** — `createCampaign, transitionCampaign, sendCampaign`. Metrics grid.
- **Nurture Messages** — WA steps across sequences.
- **AI Reply Assistant** — generate/rewrite/copy.
- **Automation Rules** — `toggleAutomation`.
- **Opt-Out / Consent** — `updateLead`. Suppression list; sending to opted-out is blocked+logged.
- **Delivery Logs** — per-message logs.
- **Analytics** — KPIs + 4 charts.
- **Settings** — `updateSettings` (WhatsApp), `syncFromProvider`. Provider/token/sync config.
- **TemplateBuilder modal** — live WhatsApp phone preview, `{{var}}` auto-detect, button builder.

### AI Qualification — `/qualification` · `pages/AIQualification/AIQualification.tsx`
- **Actions:** `qualifyLead`. **Helper:** `aiService.qualifyLead`. **Flow:** pick lead → answer
  questions (from settings) → run → assessment → apply & route. **Connected:** updates lead
  score/temp/status + timeline + (hot) notification.

### Pipeline — `/pipeline` · `pages/Pipeline/Pipeline.tsx`
- **Actions:** `moveDealStage, createDeal, deleteDeal`. **Design:** 9-stage Kanban + KPIs. **Flow:**
  HTML5 drag-and-drop (or arrow buttons). **Connected:** every move updates lead status + tracking event.

### Nurture — `/nurture` · `pages/Nurture/Nurture.tsx`
- **Actions:** `createSequence, toggleSequence, assignSequence`. Sequence cards + step lists +
  enroll-lead modal.

### Bookings — `/bookings` · `pages/Bookings/Bookings.tsx`
- **Actions:** `createBooking, updateBooking`. **Connected:** create → lead Booked + pipeline + notify.

### Call Intelligence — `/calls` · `pages/Calls/Calls.tsx`
- **Actions:** `createCall`. **Helper:** `summarizeCall`. Log-call modal generates AI summary,
  objections, next steps, follow-up, proposal outline, score. Detail modal.

### Attribution — `/attribution` · `pages/Attribution/Attribution.tsx`
- **Helpers:** `groupCount, groupSum`. Charts + source-to-revenue table + events feed + CSV.
  *(Client-side simulation.)*

### Campaigns — `/campaigns` · `pages/Campaigns/Campaigns.tsx`
- **Actions:** `createMarketingCampaign`. **Feature:** generates copyable **UTM tracking links** that
  feed the `/capture` form. ROAS, CSV.

### Payments — `/payments` · `pages/Payments/Payments.tsx`
- **Actions:** `createPayment, markPaymentPaid, updatePayment`. **Connected:** Mark Paid → deal Won +
  lead Won + revenue + attribution + notify. Status donut, copy link, refund, CSV.

### Reports — `/reports` · `pages/Reports/Reports.tsx`
- 9 tabs (Lead, Pipeline, Attribution, WhatsApp, Campaign, Revenue, Sales Activity, Nurture, AI
  Qualification). Each: KPIs + charts + table + **CSV export**. Header date/source filters.

### Automations — `/automations` · `pages/Automations/Automations.tsx`
- **Actions:** `toggleAutomation, simulateAutomation, createAutomation`. WHEN/IF/THEN cards, run logs.

### Templates — `/templates` · `pages/Templates/Templates.tsx`
- **Actions:** `createGenericTemplate, deleteGenericTemplate`. Type tabs, tenant vs global, duplicate,
  view/copy, versioning.

### Team — `/team` · `pages/Team/Team.tsx`
- **Actions:** `createUser, updateUser`. Members table, inline role change, activate/deactivate,
  assigned-lead counts.

### Integrations — `/integrations` · `pages/Integrations/Integrations.tsx`
- **Actions:** `toggleIntegration, syncIntegration, updateIntegrationConfig`. 22 cards, category tabs,
  settings/error-log modals.

### Settings — `/settings` · `pages/Settings/Settings.tsx`
- **Actions:** `updateSettings`. 10 tabs (Company, Branding, Lead Fields, Pipeline Stages,
  Qualification Questions, Scoring Rules, Notifications, Consent & Data, Billing, Security). Editable,
  saved to store.

### Super Admin — `/super-admin` · `pages/SuperAdmin/SuperAdmin.tsx` *(Super Admin only)*
- **Actions:** `createTenant, updateTenant`. 5 tabs (Tenants CRUD/suspend, All Users, Integration
  Health, Global Activity Log, Global Templates). Platform MRR KPI.

---

## 18. Cross-Module "Connected" Behavior

| Trigger | Ripples to |
|---|---|
| Create lead | tracking event + Dashboard + notification + Attribution |
| Qualify lead | score/temp/status + lead timeline + (hot) notification |
| Send WhatsApp | conversation + lead.last_contacted_at + delivery log + tracking event |
| Simulate inbound | conversation unread + tracking event |
| Book call | lead→Booked + pipeline deal + notification + timeline |
| Move pipeline | lead status + tracking event + Dashboard |
| Log call | AI summary + lead→Call Completed + timeline + notification |
| Mark payment paid | deal→Won + lead→Won + revenue + attribution + notification |
| Approve template | status history + notification |
| Send campaign | simulated metrics + tracking event |
| Assign sequence | enrollment + tracking event |

---

## 19. Persistence & Demo Reset

- **localStorage keys:** `innovatex_db_v1` (entire DB), `innovatex_user` (session).
- **Reset:** profile menu → "Reset demo data" (or `resetDemo()`), or the ErrorBoundary's reset button,
  or `localStorage.clear()`. Regenerates deterministic seed.
- **Migrations:** none. If you change the `Database` shape, bump the storage key (e.g. `_v2`) or
  clear localStorage, otherwise old persisted data may miss new fields.

---

## 20. What's Real vs Simulated

**Real (front-end):** all UI, routing, RBAC nav, CRUD, computed metrics, UTM capture from URL,
tracking-event model, CSV export, localStorage persistence, drag-and-drop pipeline, template
approval state machine, opt-out blocking.

**Simulated:** WhatsApp providers, payments, AI responses, calendar, attribution events (no real
visitor tracking), campaign delivery, template provider-approval, integration connections. There is
**no backend, no server-to-server tracking, no pixel, no Conversions API, no ad-spend ingestion**
(this is development-phase work — see §23).

---

## 21. Known Gotchas & Conventions

- **⚠️ Zustand v5 selector rule (critical):** a `useStore` selector must return a **stable
  reference**. Returning a freshly-built array/object (e.g. `useStore(s => s.db.x.filter(...))`)
  triggers React's `useSyncExternalStore` "getSnapshot should be cached" → **infinite re-render /
  blank screen**. Pattern: select the **stable** slice (`useStore(s => s.db.x)`) then filter/map in
  the component body (optionally `useMemo`). This already bit us once (post-login blank screen) and is
  fixed.
- **Never mutate `db` directly** — always go through a store action / `set(mutator)` (it clones,
  persists, and keeps React in sync).
- **Always include `tenant_id`** on new entities and filter reads by `activeTenantId`.
- **ErrorBoundary** wraps the app (`main.tsx`) — render errors show a recovery card, not a blank page.
- **Bundle size:** single ~1.6 MB JS chunk (no code-splitting yet). Fine for demo; see roadmap.
- **`structuredClone`** is used with a JSON fallback for old runtimes.

---

## 22. How to Extend (Recipes)

**Add a new page/module:**
1. Create `src/pages/Foo/Foo.tsx` exporting `Foo`.
2. Add a route in `App.tsx`.
3. Add a nav item in `components/layout/nav.ts` (set `group` and optional `superAdminOnly`).
4. Read data via `useDb()/useTenant()`, write via store actions.

**Add a new entity type:**
1. Add the interface in `types/index.ts` (extend `BaseEntity`).
2. Add the array to `Database` in `seedData.ts` + seed it in `generateSeed()`.
3. Add create/update actions in `store.ts` (use `base(tenantId)`, then `track`/`notify`/`toast`).
4. Bump localStorage key if needed.

**Wire a real backend (later):** replace store actions' bodies with API calls (keep signatures);
replace `loadDB/persist` with fetch/cache; swap adapter/AI bodies for real calls.

---

## 23. Roadmap to Production

**P0 — Backend & persistence**
- Real API + DB (Node/Postgres or Supabase). Replace localStorage store with server state +
  optimistic updates. Real auth (JWT/OAuth) + enforced RBAC per action.

**P1 — Real tracking (the "Hyros" part)**
- First-party tracking script on landing pages (persistent visitor id; capture UTMs +
  `fbclid`/`gclid`/`ttclid`).
- Server-to-server event API + **identity graph** (stitch click → lead → payment by email/phone,
  cross-device).
- **Conversions API** integrations (Meta/Google/TikTok) to send verified purchases.
- Ad-spend ingestion (Meta/Google APIs) → real ROAS. Multi-touch attribution modeling.

**P1 — Real WhatsApp**
- Implement real BSP calls in the adapters (Meta Cloud API first); webhook receiver for inbound +
  delivery status; real template submission/approval polling.

**P1 — Real AI**
- Branch `aiService` on `isAiLive()` to call OpenAI/Claude; keep mock fallback.

**P2 — Real payments & calendar**
- Stripe/Razorpay payment links + webhooks; Calendly/Cal.com booking sync.

**P2 — Engineering hardening**
- Route-based code-splitting (`React.lazy`) to shrink the initial bundle.
- Unit/integration tests (Vitest + Testing Library); E2E (Playwright).
- Error monitoring (Sentry), analytics, CI/CD, accessibility pass.

---

*End of developer handoff. Keep this in sync as the codebase evolves.*
