# InnovateX Revenue OS — Frontend Spec (Per Page)

This document describes **every page** of the prototype: its purpose, design/layout,
user flow, and features. It reflects what is actually implemented in the codebase.

---

## Global Design System

**Visual language:** premium, operator-grade SaaS (inspired by HubSpot / Attio / Linear / Intercom).

- **Sidebar:** dark navy (`#0b1220`), grouped nav (Revenue / Growth / Admin), active item highlighted in brand indigo.
- **Workspace:** light gray canvas (`#f1f5f9`), white rounded cards with soft shadows.
- **Accent:** electric indigo `#6366f1` with violet/teal/blue secondaries.
- **Typography:** Inter, high contrast, tight headings.
- **Reusable UI:** Button, Card, Modal, Drawer, Tabs, Table, Badge/StatusBadge, Avatar, Toggle, KpiCard, SearchInput, EmptyState, PageHeader, Toaster.
- **Charts:** Recharts wrappers — Bar, Line/Area, Donut, Funnel.
- **Feedback:** toast notifications on every meaningful action; status badges everywhere; empty states on every list.
- **Responsive:** sidebar collapses to a drawer on mobile; grids reflow to 1–2 columns.

**App shell** (`AppLayout`): fixed dark sidebar + sticky topbar (workspace switcher, global search, notification bell with unread count, profile menu with Reset Demo / Sign out). Auth-guarded — unauthenticated users redirect to `/login`.

---

## 1. Login  `/login`
- **Design:** split screen. Left = dark brand panel with value props; right = sign-in form.
- **Flow:** enter email/password → 0.5s simulated auth → toast → redirect (Super Admin → Super Admin Panel, others → Dashboard).
- **Features:** one-click demo-account chips (Super Admin / Owner / Sales), validation, invalid-credentials toast.

## 2. Public Capture Form  `/capture`
- **Design:** centered card, public (no auth), gradient background.
- **Flow:** reads UTM params from URL (`?source=&utm_source=&utm_medium=&utm_campaign=&utm_content=&utm_term=`) → user submits → creates a real lead + tracking event → success screen shows captured attribution badges → link to Leads.
- **Features:** live UTM badges, segment selector, "biggest revenue challenge" field, consent auto-granted.

## 3. Dashboard  `/dashboard`
- **Design:** greeting header, 12 KPI cards, AI briefing banner, multi-row chart grid, 3 bottom info cards.
- **Flow:** all metrics computed live from the mock DB (not hardcoded); reacts to actions elsewhere in the app.
- **Features:**
  - **KPIs:** total/qualified/hot leads, booked calls, pipeline value, revenue closed, conversion rate, response time, follow-up completion, WhatsApp conversations, pending replies, leakage alerts.
  - **Charts:** leads by source (donut), pipeline by stage (bar), conversion funnel, revenue by source, booking trend, WhatsApp conversations trend, campaign performance.
  - **Sections:** recent activity feed, top campaigns, revenue-leakage alerts (ghosted / idle proposals / booked-not-paid) with a "launch recovery" CTA.
  - **Weekly AI Briefing:** generated narrative summary.

## 4. Leads  `/leads`
- **Design:** filter bar + dense table; right-side detail **drawer**; add/edit **modal**.
- **Flow:** browse/search/filter → click row to open drawer → edit/archive/qualify/book/pay from drawer.
- **Features:**
  - Search (name/email/company/phone), filters (status, temperature, source).
  - Add/Edit modal with **duplicate detection** (email/phone) + UTM fields.
  - **Lead detail drawer:** profile, score, temperature, source & full UTM block, owner, recommended next action (AI), quick actions (WhatsApp / Qualify / Book / Payment), linked record counts (deals/bookings/calls/payments), WhatsApp message preview, notes (add note), and a full **activity timeline** (created → events → messages → bookings → calls → payments → pipeline moves).
  - Archive, CSV export.

## 5. WhatsApp Operating Panel  `/whatsapp`  *(13 tabs)*
The flagship module. Native panel + simulated multi-provider mode.

1. **Inbox** — 3-pane: conversation list (search + status filter) · chat thread (WhatsApp-style bubbles, status, simulate inbound, assign owner, change status, tags, internal notes) · lead context panel (score, source, UTM, pipeline stage, payment status, response timer, tags, notes).
2. **Contacts / Leads** — WhatsApp contact table with consent/opt-out/last-contacted/score.
3. **Templates** — card grid; create/edit/duplicate; status-aware actions (submit, activate, pause).
4. **Template Approval** — full workflow: Draft → Internal Review → (Approve / Request Changes / Reject) → Internally Approved → Submit to Provider → Provider Approved/Rejected → Active/Paused. Shows status timeline + approval comments.
5. **Campaigns** — create (audience filter + approved template + recipient count), approve, schedule, send (simulated), with sent/delivered/read/replied/bookings/payments/revenue metrics.
6. **Nurture Messages** — WhatsApp steps across all sequences.
7. **AI Reply Assistant** — paste inbound → generate reply / booking / payment / objection / follow-up; make shorter/professional/persuasive; copy.
8. **Broadcasts** — same as campaigns but broadcast-flagged.
9. **Automation Rules** — WhatsApp trigger→action rules with toggles.
10. **Opt-Out / Consent** — consent KPIs, suppression list, opt-out toggle, opt-out keywords (STOP/UNSUBSCRIBE/…). Sending to opted-out contacts is **blocked + logged**.
11. **Delivery Logs** — per-message log (provider, recipient, status, retries, timestamps).
12. **WhatsApp Analytics** — conversation/message/delivery/read/reply KPIs + charts (conversations over time, reply rate by campaign, template performance, delivery funnel).
13. **WhatsApp Settings** — mode (native/third-party), provider (9 options), tokens/IDs/webhook, sync toggles, "Sync now" (simulated).

- **Template Builder modal:** name, category, language, header type, body (auto-detects `{{variables}}`), footer, button builder, **live phone preview**.
- **Composer:** AI replies, rewrite tools, template insert, variable insert, schedule, ⌘/Ctrl+Enter to send, opt-out block warning.
- **Connected effects:** sending a message updates the conversation, lead `last_contacted_at`, delivery log, tracking event, and toast.

## 6. AI Qualification  `/qualification`
- **Design:** two columns — questionnaire (left) and AI assessment (right).
- **Flow:** pick lead → answer discovery questions → "Run AI Qualification" → assessment → apply & route (booking / nurture / sales).
- **Features:** fit score (1–10), temperature, quality, buying intent, urgency, pain points, recommended offer, next action, AI follow-up draft. Applying updates the lead score/temperature/status + timeline + (if hot) a notification. Human override supported. Live/Mock AI badge.

## 7. Pipeline  `/pipeline`
- **Design:** horizontal Kanban across 9 stages; summary KPIs on top.
- **Flow:** **drag & drop** cards between stages (or use arrow buttons); add deal via modal.
- **Features:** per-stage count + value, deal cards (value, probability, owner, source), add/delete deal, owner filter, win-rate KPI. Every stage move updates the lead status + tracking event ("Pipeline Stage Changed", plus Deal Won/Lost) + dashboard.

## 8. Nurture  `/nurture`
- **Design:** KPI row + sequence cards with step lists.
- **Flow:** create sequence (auto 3-step starter) → activate/pause → assign a lead (enroll).
- **Features:** 6 default sequences, multi-channel steps (WhatsApp/Email/SMS/Task) with delay days, enrollment count, trigger, enroll-lead modal (emits tracking event + toast).

## 9. Calendar / Bookings  `/bookings`
- **Design:** KPI row + bookings table.
- **Flow:** create booking (lead/date/time/type/owner) → status inline editable.
- **Features:** statuses (Scheduled/Completed/No Show/Cancelled/Rescheduled). Creating a booking moves the lead to **Booked**, creates/advances a pipeline deal, emits tracking event + notification.

## 10. Call Intelligence  `/calls`
- **Design:** KPI row + call cards; log-call modal; detail modal.
- **Flow:** log call (lead/outcome/transcript) → "Generate AI summary" → save.
- **Features:** AI summary, extracted objections, next steps, follow-up draft, proposal outline, call score, outcome. Saving updates lead status + timeline + notification.

## 11. Attribution  `/attribution`
- **Design:** KPI row + charts + source-to-revenue table + recent events table.
- **Features:** leads/revenue/bookings by source, events by type, source-to-revenue breakdown with lead→booking conversion, recent tracking events (native vs provider), CSV export. *(Simulated client-side — see README on real S2S tracking being a development-phase build.)*

## 12. Campaigns  `/campaigns`
- **Design:** KPI row + revenue chart + campaign table.
- **Flow:** create campaign → auto-generates a **UTM tracking link** → copy link (one click).
- **Features:** budget/spend/leads/bookings/revenue/ROAS, status badges, tracking-link generator (`/capture?source=&utm_source=&utm_medium=&utm_campaign=`), CSV export. Links feed back into the Capture form.

## 13. Payments  `/payments`
- **Design:** KPI row + status donut + payments table.
- **Flow:** create payment link → copy link → **Mark Paid** → deal closes Won, lead → Won, revenue + attribution update + notification.
- **Features:** statuses (Pending/Sent/Paid/Failed/Refunded), method, refund action, CSV export.

## 14. Reports  `/reports`  *(9 tabs)*
- **Tabs:** Lead · Pipeline · Attribution · WhatsApp · Campaign · Revenue · Sales Activity · Nurture · AI Qualification.
- **Each tab:** summary KPI cards, charts, a data table, and **CSV export**. Date-range and source filters in the header.

## 15. Automations  `/automations`
- **Design:** KPI row + automation cards.
- **Flow:** create rule (WHEN trigger / IF condition / THEN action) → toggle active → "Simulate run" → view logs.
- **Features:** 6 seeded automations, run counts, last-run, log modal.

## 16. Templates  `/templates`
- **Design:** type tabs + template card grid; create/view modal.
- **Features:** generic templates (Email, scripts, proposal outlines, call-summary/report formats, follow-ups), tenant vs global scope, duplicate, delete, copy content, versioning.

## 17. Team  `/team`
- **Design:** KPI row + members table.
- **Features:** add user modal, inline role change, activate/deactivate, assigned-lead counts, last-active. Roles: Owner / Admin / Sales / Read-Only (Super Admin protected).

## 18. Integrations  `/integrations`
- **Design:** category tabs + integration card grid.
- **Features:** 22 integrations (WhatsApp providers, payments, AI, calendars, email, calls, CRM/ads — some "coming soon"). Connect/disconnect toggle, sync (updates last-sync), settings modal, error-log modal, status badges (connected/simulation/disconnected).

## 19. Settings  `/settings`  *(10 tabs)*
- **Tabs:** Company · Branding · Lead Fields · Pipeline Stages · Qualification Questions · Scoring Rules · Notifications · Consent & Data · Billing · Security.
- **Features:** editable & saved locally — company profile, accent color, qualification questions (add/remove), scoring weights, notification toggles, consent + retention, billing summary, security toggles.

## 20. Super Admin Panel  `/super-admin`  *(Super Admin only)*
- **Design:** platform KPI row + 5 tabs.
- **Tabs:** Tenants (create/edit/suspend) · All Users · Integration Health · Global Activity Log · Global Templates.
- **Features:** platform MRR, tenant CRUD, suspend/reactivate, cross-tenant user list, integration uptime, audit log.

---

## Cross-Page "Connected" Behavior (the demo magic)

Actions ripple across modules:

- Create lead → tracking event + dashboard + notification.
- Qualify → score/temperature/status + timeline (+ hot-lead notification).
- Send WhatsApp → conversation + delivery log + lead timeline + tracking event.
- Book call → lead = Booked + pipeline deal + notification + timeline.
- Move pipeline → lead status + tracking event + dashboard.
- Log call → AI summary + lead status + timeline.
- Mark payment paid → deal Won + lead Won + revenue + attribution + notification.
- Approve template → status + notification.
- Send campaign → simulated metrics + tracking event.

All state persists to `localStorage` and is resettable from the profile menu.
