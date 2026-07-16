# InnovateX Revenue OS

> The source-to-revenue operating system for high-touch businesses — an investor-demo-ready SaaS prototype.

InnovateX Revenue OS is an AI-native, revenue-focused platform that connects the **entire** customer journey:

**Lead Capture → WhatsApp → AI Qualification → Nurture → Booking → Pipeline → Call Intelligence → Payment → Attribution → Reports → Dashboard**

This is a fully functional, **clickable, data-connected prototype** (not a static mockup). Every module reads and writes from a shared mock database, so actions in one place ripple through the rest of the app — exactly like the real product.

---

## ✨ Highlights

- **Premium SaaS UI** — dark navy sidebar, light operator-grade workspace, charts, drawers, modals, toasts, status badges, empty/loading states.
- **Connected workflows** — create a lead → qualify with AI → book a call → move the pipeline → mark a payment paid → watch dashboard revenue & attribution update live.
- **Native WhatsApp Operating Panel** — shared inbox, AI reply assistant, template builder, full internal + provider approval workflow, campaigns, broadcasts, delivery logs, consent/opt-out, and analytics.
- **Multi-provider WhatsApp adapter layer** — Meta Cloud API, WATI, Interakt, AiSensy, Gallabox, Twilio, 360dialog, Custom Webhook & Simulation Mode (all simulated behind a clean adapter interface).
- **Mock AI layer** — qualification, scoring, reply generation, rewriting, call summaries, objection extraction, proposal drafts and weekly briefings. Structured so a real OpenAI/Claude key can be added later (`VITE_AI_API_KEY`) without breaking anything.
- **Source-to-revenue attribution** — every action emits a tracking event with full UTM lineage.
- **Multi-tenant + role-based access** — Super Admin, Tenant Owner, Tenant Admin, Sales User, Read-Only User.
- **Realistic seed data** — 2 tenants, 5 users, 40+ leads, 15 conversations, 80+ messages, 10 templates, campaigns, deals, bookings, calls, payments, nurture sequences, 80 tracking events, notifications, integrations and more.

---

## 🚀 Getting Started

```bash
# 1. Install dependencies
npm install

# 2. Start the dev server
npm run dev
```

Then open **http://localhost:5173**.

```bash
# Production build
npm run build && npm run preview

# Type-check only
npm run lint
```

> Runs anywhere Node 18+ is available (local, Replit, Codespaces). No backend or API keys required — all data is local and resettable.

---

## 🔑 Demo Accounts (password: `password123`)

| Role          | Email                  | Lands on            |
| ------------- | ---------------------- | ------------------- |
| Super Admin   | `super@innovatex.com`  | Super Admin Panel   |
| Tenant Owner  | `owner@demo.com`       | Dashboard           |
| Sales User    | `sales@demo.com`       | Dashboard           |

(There are also `admin@demo.com` and `viewer@demo.com`.) Use the one-click chips on the login screen.

The **Super Admin Panel** is only visible to the Super Admin account.

---

## 🧭 Try the Full Demo Flow

1. **Capture a lead** — open `/capture?source=facebook&utm_source=meta&utm_medium=paid&utm_campaign=coach_webinar` (the public form), submit, and watch the UTM data get attributed.
2. **Qualify it** — go to *AI Qualification*, answer the discovery questions, run the AI engine, and route the lead.
3. **Message on WhatsApp** — open the *WhatsApp Panel → Inbox*, send a message (try the AI reply assistant), simulate an inbound reply.
4. **Build & approve a template** — *WhatsApp Panel → Templates*, then walk it through *Template Approval* (internal review → provider approval → active).
5. **Move the pipeline** — drag a deal across stages in *Pipeline*.
6. **Book & log a call** — create a booking, then log a call and generate the AI summary in *Call Intelligence*.
7. **Take a payment** — mark a payment **Paid** in *Payments* and see the deal close + dashboard revenue update.
8. **See it all connected** — check the *Dashboard*, *Attribution* and *Reports* — every action you took is reflected.

Reset everything anytime from the **profile menu → Reset demo data**.

---

## 🏗️ Tech Stack

- **React 18 + TypeScript**
- **Vite** build tooling
- **Tailwind CSS** (custom premium design system)
- **React Router** for routing
- **Zustand** for state (persisted to `localStorage`)
- **Recharts** for charts
- **Lucide React** for icons

---

## 📁 Project Structure

```
src/
  components/
    layout/        # AppLayout, Sidebar, Topbar, nav config
    ui/            # Button, Card, Modal, Drawer, Table, Tabs, Toaster, KpiCard…
    charts/        # Recharts wrappers (bar, line, donut, funnel)
  pages/
    Auth/          # Login + public Capture form
    Dashboard/  Leads/  WhatsApp/  AIQualification/  Pipeline/  Nurture/
    Bookings/  Calls/  Attribution/  Campaigns/  Payments/  Reports/
    Automations/  Templates/  Team/  Integrations/  Settings/  SuperAdmin/
  data/
    seedData.ts    # deterministic realistic seed generator
  store/
    store.ts       # central store + all connected actions
    toastStore.ts  # toast notifications
    hooks.ts       # tenant-scoped selectors
  services/
    aiService.ts         # mock AI (qualify, summarize, reply, briefings…)
    whatsappService.ts   # sendWhatsAppMessage router
    whatsappAdapters/    # 9 provider adapters behind a common interface
  types/           # full domain model
  utils/           # formatters, calculations/selectors, csvExport, id
```

---

## 🧪 Notes

- **All integrations are simulated.** Connecting an integration, sending a campaign, or submitting a template to a provider runs through mock adapters with realistic responses.
- **Data persists** to `localStorage` so your demo state survives reloads. Use *Reset demo data* to restore the seed.
- The app **never breaks without an AI key** — the AI layer is fully mocked and deterministic.

---

© 2026 InnovateX. Investor demo build.
