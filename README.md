# AnnaSetu AI (अन्नसेतु)

> **Food Rescue · Intelligent Allocation · Agentic Coordination**
> Turn surplus food into safely delivered meals through intelligent, need-based distribution.

---

## 1. Documentation

All canonical product, architectural, and design specifications live in [`docs/`](./docs/):

- [`docs/prd.md`](./docs/prd.md) — Product baseline, mission, user roles, safety boundaries, and acceptance criteria.
- [`docs/architecture.md`](./docs/architecture.md) — Monorepo layout, PostgreSQL source-of-truth, state machines, and API endpoints.
- [`docs/rules.md`](./docs/rules.md) — Order of authority, food-safety rules, allocation constraints, and troubleshooting protocol.
- [`docs/design.md`](./docs/design.md) — Brand principles, semantic color palette (`brand-forest`, `brand-cream`, `brand-marigold`), and typography.
- [`docs/tasks.md`](./docs/tasks.md) — Phased milestones with strict exit gates.
- [`docs/memory.md`](./docs/memory.md) — 20 locked product decisions, session logging rules, and verified state.

---

## 2. Monorepo Structure

```text
annasetu/
├── apps/
│   ├── mobile/                      # React Native + Expo app (Android / iOS)
│   └── web/                         # Next.js operations dashboard & public site
├── services/
│   └── api/                         # FastAPI backend, LangGraph orchestrator & OR-Tools engine
├── packages/
│   ├── api-client/                  # Shared typed API client
│   └── design-tokens/               # Shared semantic tokens, typography & theme
├── supabase/
│   ├── migrations/                  # Versioned PostgreSQL DDL & RLS policies
│   ├── seed.sql                     # Synthetic pilot test data
│   └── config.toml                  # Supabase local development configuration
├── docs/                            # Six canonical project documents
└── .env.example                     # Documented environment template
```

---

## 3. Getting Started

### Prerequisites

- **Python:** 3.12+
- **Node.js:** 20+ (Active LTS or later)
- **npm:** 10+
- **Git**

### Running the Services Locally

1. **Backend API (`services/api`):**
   ```bash
   cd services/api
   python -m venv .venv
   .venv\Scripts\activate       # Windows
   pip install -r requirements.txt
   uvicorn app.main:app --reload --port 8000
   ```
   Health check: `http://localhost:8000/health`
   API Docs: `http://localhost:8000/docs`

2. **Web Operations Console (`apps/web`):**
   ```bash
   cd apps/web
   npm install
   npm run dev
   ```
   Web interface: `http://localhost:3000`

3. **Mobile App (`apps/mobile`):**
   ```bash
   cd apps/mobile
   npm install
   npx expo start
   ```
