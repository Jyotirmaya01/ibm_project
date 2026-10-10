# AnnaSetu AI --- Persistent Project Memory

**Purpose:** Durable context for any AI coding assistant. Read at
session start and update at session end. Keep this file factual, concise
and current. Never store secrets or credentials.

## 1. Project identity

-   Name: **AnnaSetu AI**.
-   Mission: reduce avoidable food waste through safe, need-based
    redistribution.
-   Core promise: right food, in a usable quantity, to the right
    recipient, in time.
-   Alignment: SDG 2 (Zero Hunger) and SDG 12 (Responsible Consumption
    and Production).
-   Product form: Android/iOS mobile app, responsive web operations
    dashboard/public site, shared backend and agentic workflow.
-   This is not only a directory, classifier or chatbot; the key
    capability is need-based multi-recipient allocation and real
    handover coordination.

## 2. Problem and solution

Surplus prepared food from weddings, small functions, bhandaras,
households, hotels, restaurants, caterers and events often goes unused
while nearby people and organizations need food. Informal coordination
lacks accurate demand, safe quantities, clear evidence, reliable
collection and outcome tracking.

AnnaSetu requires photos and structured details, provides a cautious
evidence assessment, lets recipients inspect listings, calculates a
feasible split based on demand/capacity/safety/timing, coordinates
contact and pickup, and records actual handover.

## 3. Locked product decisions

1.  Support all donor types above, not only bhandaras.
2.  Donors can be ordinary people or businesses; posting/donating is
    free.
3.  Photos are compulsory before listing publication.
4.  Capture food type, quantity/unit, preparation time, handling/storage
    history, applicable temperature evidence, location and pickup
    window.
5.  AI produces an evidence assessment, not a food-safety certification.
6.  AI score alone must not auto-reject a listing. Missing/uncertain
    evidence can be held for clarification/human review. Known safety
    failures block allocation under configured rules.
7.  Recipients include ashrams, orphanages, shelters, community kitchens
    and other eligible people/organizations in need.
8.  Display verification status honestly; open discovery should have
    safeguards proportionate to risk.
9.  Recipients inspect photos/details/warnings before deciding.
10. Support accept, partial accept, ask details and decline.
11. Support in-app chat and optional phone contact based on user
    preferences.
12. Support recipient collection, authorized volunteer/driver collection
    and donor delivery where feasible.
13. AI must allocate according to actual demand, current food supply,
    people served, capacity, compatibility, deadline, safety and
    collection feasibility.
14. Never split equally by default or give everything to the first
    respondent.
15. Use deterministic optimization (OR-Tools) for quantities; an LLM
    must not invent numbers.
16. Prevent duplicate reservations transactionally.
17. Replan on decline, quantity reduction, timeout or failed pickup.
18. Distinguish proposed, reserved, collected, delivered, accepted,
    rejected and unallocated quantities.
19. Count confirmed outcomes only in impact metrics.
20. Start with a supervised local pilot; never claim nationwide coverage
    or real partner access before it exists.

## 4. Locked technology direction

-   Mobile: React Native + Expo + TypeScript.
-   Web: Next.js + TypeScript + Tailwind CSS; shadcn/ui selectively.
-   API: Python + FastAPI + Pydantic.
-   Data/auth/storage: Supabase PostgreSQL, Auth and private Storage.
-   Agent orchestration: LangGraph; LangChain selectively.
-   Optimization: Google OR-Tools.
-   Realtime: Supabase Realtime where useful.
-   Maps: Google Maps Platform or Mapbox adapter.
-   Push: Expo Notifications with FCM/APNs.
-   Email/WhatsApp/calling: provider adapters; real use requires
    configuration and consent.
-   Hosting: Vercel for web; Python-compatible container host for API.
-   Version control: GitHub; monitoring: Sentry and structured logs.
-   Avoid Firebase and Supabase as duplicate core sources of truth.

## 5. Architecture and quality constraints

-   PostgreSQL is authoritative for listings, allocation, reservation
    and handover.
-   Start as a modular monolith; avoid premature microservices.
-   Backend authorization plus RLS are required.
-   Secrets never go into client bundles or Git.
-   Photos are private and accessed through short-lived signed URLs.
-   Use migrations, explicit state machines, transactions, idempotency
    and bounded retries.
-   External provider success is not proof of collection/delivery.
-   Never mark tests passed unless actually run.

## 6. Brand/design decisions

-   Emotion: humane, welcoming, dignified, trustworthy and clear; not
    luxury-oriented or cold enterprise UI.
-   Avoid generic AI aesthetics, neon gradients, excessive glassmorphism
    and robot/circuit-brain logo clichés.
-   Typography: Plus Jakarta Sans for headings; Source Sans 3 for
    body/UI, with robust fallbacks.
-   Palette source of truth: `design.md`; forest green, sage, cream,
    marigold and high-contrast ink.
-   Logo direction: simple bridge/connection + leaf/bowl motif; review
    small-size legibility and monochrome use before finalizing.
-   Food photos must remain truthful; never retouch to make food appear
    fresher or larger.
-   Accessibility, readable text, comfortable buttons and low-bandwidth
    behavior are mandatory.

## 7. Document authority

Read and follow: - `docs/prd.md`: product vision, problem, solution,
goals, users, MVP and acceptance criteria. - `docs/architecture.md`:
technology, folder structure, data model, APIs and state machines. -
`docs/rules.md`: safety, allocation, privacy, engineering and
troubleshooting protocol. - `docs/design.md`: brand, typography,
palette, components and UX. - `docs/tasks.md`: sequential milestones and
exit gates. - `docs/memory.md`: current decisions and actual progress.

If a conflict exists, do not silently alter a locked decision. Record it
and request resolution; prioritize safety and data integrity.

## 8. Current implementation status

**Specification stage.** Documentation exists; the application must not
be described as built until code, tests and integrations have actually
been verified. The task board is not complete by default.

## 9. Required session bookkeeping

At the end of every coding session, update: - Current phase and exact
task IDs completed. - Files created/changed/deleted. - Commands/tests
actually run and their exact pass/fail outcomes. - Known bugs, blockers
and unimplemented/mocked integrations. - Decisions made and rationale. -
Database migration/schema state. - Last known working commit/hash if
available. - The single next recommended task.

Never mark a task done without evidence. Never invent test results or
claim a live integration works when mocked.

### Session log

#### 2026-10-10 --- Session summary

- **Phase/task:** Phase 0 & Phase 1 (Scaffold and developer experience)
- **Decisions:**
  - Initialized Git repository and root `.gitignore`.
  - Established canonical documentation under `docs/` and synced with `annasetu-project-docs/`.
  - Configured root npm workspace linking `apps/*` and `packages/*`.
  - Scaffolded `@annasetu/design-tokens` with exact semantic tokens from `design.md` (`brand-forest`, `brand-cream`, `brand-marigold`, etc.).
  - Scaffolded Next.js 14 operations dashboard and public landing page in `apps/web` with Tailwind CSS, Plus Jakarta Sans & Source Sans 3 typography.
  - Scaffolded React Native + Expo mobile application in `apps/mobile` with dual Donor/Recipient flow entry.
  - Implemented FastAPI backend in `services/api` with structured configuration (`app/core/config.py`), Pydantic schemas, and `/health` and `/v1/health` endpoints.
  - Created initial PostgreSQL schema migration in `supabase/migrations/20261010000001_initial_schema.sql` covering profiles, organizations, food listings, food items, safety assessments, recipient capacity snapshots, allocations, handover records, audit events, and RLS policies.
  - Added labeled synthetic seed data in `supabase/seed.sql`.
  - Created GitHub Actions CI workflow in `.github/workflows/ci.yml`.
  - Detected Windows ARM64 environment (`win_arm64`); noted OR-Tools wheel availability constraints and planned abstraction adapter for solver.
- **Files changed / created:**
  - `.gitignore`, `.env.example`, `package.json`, `README.md`
  - `.github/workflows/ci.yml`
  - `packages/design-tokens/package.json`, `packages/design-tokens/src/index.ts`
  - `services/api/requirements.txt`, `services/api/pyproject.toml`, `services/api/Dockerfile`
  - `services/api/app/main.py`, `services/api/app/core/config.py`, `services/api/app/schemas/health.py`, `services/api/app/api/v1/health.py`, `services/api/app/api/v1/router.py`
  - `services/api/tests/unit/test_health.py`
  - `supabase/config.toml`, `supabase/migrations/20261010000001_initial_schema.sql`, `supabase/seed.sql`
  - `apps/web/package.json`, `apps/web/tsconfig.json`, `apps/web/next.config.mjs`, `apps/web/postcss.config.mjs`, `apps/web/tailwind.config.ts`, `apps/web/app/globals.css`, `apps/web/app/layout.tsx`, `apps/web/app/page.tsx`, `apps/web/app/operations/page.tsx`
  - `apps/mobile/package.json`, `apps/mobile/app.json`, `apps/mobile/tsconfig.json`, `apps/mobile/src/theme/tokens.ts`, `apps/mobile/app/_layout.tsx`, `apps/mobile/app/index.tsx`
- **Tests/commands and actual results:**
  - `python -m pytest services\api\tests` -> 2 passed in 3.66s.
  - `npm --workspace=apps/web run build` -> Compiled successfully, static pages generated.
- **Database/migration state:** `20261010000001_initial_schema.sql` written with RLS policies and state machines; `supabase/seed.sql` created with synthetic organizations and demand snapshots.
- **Known issues/blockers:** PyPI does not distribute pre-built `ortools` wheels for `win_arm64`. An optimization adapter will be used so OR-Tools runs in Linux container / CI while local dev supports deterministic fallback.
- **Mocked/unconfigured integrations:** Maps, Vision AI, Push Notifications, and WhatsApp providers configured in mock mode via `.env.example`.
- **Last known working commit:** `335a24f` (Scaffold baseline).
- **Next action:** Phase 2 completed; proceed to Phase 3.

#### 2026-10-10 (Session 2) --- Phase 2 Complete: Identity, Roles & Authorization

- **Phase/task:** Phase 2 (Identity, roles and authorization)
- **Decisions:**
  - Implemented strict Permission Matrix (`services/api/app/security/permissions.py`) mapping granular capabilities for `donor`, `recipient`, `volunteer`, `coordinator`, `safety_reviewer`, and `admin`.
  - Implemented JWT / session verification dependency (`services/api/app/security/auth.py`) with `get_current_user`, `require_role`, and `require_permission`.
  - Implemented Audit Event recorder (`services/api/app/services/audit.py`) logging privileged events (`ORGANIZATION_VERIFIED`, `PROFILE_UPDATED`, etc.) into an authoritative trace buffer.
  - Added REST endpoints for profile inspection (`/v1/auth/me`), profile updates (`/v1/auth/profile`), organization listing (`/v1/organizations`), and coordinator-only verification (`/v1/organizations/{id}/verify`).
  - Added second database migration `supabase/migrations/20261010000002_auth_triggers.sql` creating the `handle_new_user()` trigger for automated profile creation upon `auth.users` sign-up, plus coordinator/admin RLS management policies.
  - Built client-side `AuthProvider` in `apps/web/src/lib/auth-context.tsx` and integrated role-switching in the Next.js Operations Console (`apps/web/app/operations/page.tsx`).
- **Files changed / created:**
  - `services/api/app/schemas/auth.py`
  - `services/api/app/security/auth.py`
  - `services/api/app/security/permissions.py`
  - `services/api/app/services/audit.py`
  - `services/api/app/api/v1/auth.py`
  - `services/api/app/api/v1/organizations.py`
  - `services/api/app/api/v1/router.py`
  - `services/api/tests/unit/test_auth_and_permissions.py`
  - `supabase/migrations/20261010000002_auth_triggers.sql`
  - `apps/web/src/lib/auth-context.tsx`
  - `apps/web/app/layout.tsx`
  - `apps/web/app/operations/page.tsx`
- **Tests/commands and actual results:**
  - `python -m pytest services\api\tests` -> 7 passed in 0.27s (testing unauthenticated rejection, role permissions, coordinator verification, unauthorized escalation prevention).
  - `npm --workspace=apps/web run build` -> Next.js 14 compiled successfully (5/5 pages generated).
- **Database/migration state:** `20261010000002_auth_triggers.sql` ready to accompany `20261010000001_initial_schema.sql`.
- **Known issues/blockers:** None.
- **Mocked/unconfigured integrations:** In local development without live Supabase cloud keys, JWT bearer handler accepts standard mock tokens (`mock-token-<role>`) to permit offline, deterministic unit testing.
- **Last known working commit:** `93ca69a` (Phase 2 identity & roles).
- **Next action:** Phase 3 completed; proceed to Phase 4.

#### 2026-10-10 (Session 3) --- Phase 3 Complete: Food Listing & Compulsory Photo Evidence

- **Phase/task:** Phase 3 (Listing and photo evidence)
- **Decisions:**
  - Implemented Pydantic domain models in `services/api/app/schemas/listings.py` enforcing strict pickup window timing (`pickup_window_end > pickup_window_start`), positive dish quantities, and explicit food unit types.
  - Implemented Private Storage adapter in `services/api/app/integrations/storage.py` validating 10MB file limit, image MIME types (JPEG, PNG, WebP), and generating isolated private storage paths.
  - Built authoritative server-side State Machine in `services/api/app/services/listings.py` (`DRAFT -> SUBMITTED -> EVIDENCE_REVIEW -> AVAILABLE`) with compulsory evidence gate: Attempting publication without photos is strictly rejected with `MissingEvidenceError`.
  - Added REST endpoints in `services/api/app/api/v1/listings.py` (`POST /v1/listings`, `GET /v1/listings`, `GET /v1/listings/my`, `POST /v1/listings/{id}/photos`, `POST /v1/listings/{id}/items`, `POST /v1/listings/{id}/publish`, `PATCH /v1/listings/{id}/status`).
  - Added recipient public card redaction to protect exact donor coordinates prior to confirmed reservation.
  - Built donor creation page (`apps/web/app/listings/create/page.tsx`) with interactive dish photo verification and live FSSAI guidance.
  - Built recipient surplus discovery feed (`apps/web/app/listings/page.tsx`) displaying photo-verified meal cards, quantities, holding conditions, and locality details.
- **Files changed / created:**
  - `services/api/app/schemas/listings.py`
  - `services/api/app/integrations/storage.py`
  - `services/api/app/services/listings.py`
  - `services/api/app/api/v1/listings.py`
  - `services/api/app/api/v1/router.py`
  - `services/api/tests/unit/test_listings.py`
  - `apps/web/app/listings/create/page.tsx`
  - `apps/web/app/listings/page.tsx`
- **Tests/commands and actual results:**
  - `python -m pytest services\api\tests` -> 11 passed in 0.29s (verified draft creation, photoless rejection with 400, photo attachment, valid state transition to SUBMITTED, and invalid jump rejection).
  - `npm --workspace=apps/web run build` -> Next.js 14 compiled successfully (7/7 pages generated).
- **Database/migration state:** `20261010000001_initial_schema.sql` and `20261010000002_auth_triggers.sql`.
- **Known issues/blockers:** None.
- **Mocked/unconfigured integrations:** Image storage adapter running with signed URL generator in local dev mode.
- **Last known working commit:** `64c8abb` (Phase 3 food listing & compulsory photo evidence).
- **Next action:** Phase 4 completed; proceed to Phase 5.

#### 2026-10-10 (Session 4) --- Phase 4 Complete: Safety Evidence Workflow & Rules Engine

- **Phase/task:** Phase 4 (Safety evidence workflow)
- **Decisions:**
  - Implemented versioned FSSAI surplus food rules engine (`services/api/app/services/safety_rules.py`) with standard `FSSAI-SURPLUS-2019-V1.2`.
  - Implemented deterministic evaluation enforcing ambient perishable cooked food limits (max 4 hours elapsed between prep and pickup end) and hot-holding limits (max 6 hours).
  - Built Vision Model Adapter (`services/api/app/integrations/vision_adapter.py`) returning structured dish clarity and container hygiene observations with an explicit disclaimer that vision AI cannot certify microbiological food safety.
  - Added REST endpoints in `services/api/app/api/v1/safety.py`:
    - `POST /v1/listings/{id}/assess`: Automated evaluation of safety evidence.
    - `GET /v1/listings/{id}/safety`: Retrieve safety review panel.
    - `GET /v1/safety/review-queue`: Reviewer exception queue for coordinators & safety reviewers.
    - `POST /v1/safety/reviews/{assessment_id}/decide`: Authorized human reviewer clearance or clarification request.
  - Updated Next.js Operations Console (`apps/web/app/operations/page.tsx`) with live Safety Review Queue allowing authorized reviewers to inspect risk indicators and approve/clear holds.
- **Files changed / created:**
  - `services/api/app/schemas/safety.py`
  - `services/api/app/integrations/vision_adapter.py`
  - `services/api/app/services/safety_rules.py`
  - `services/api/app/api/v1/safety.py`
  - `services/api/app/api/v1/router.py`
  - `services/api/tests/unit/test_safety.py`
  - `apps/web/app/operations/page.tsx`
- **Tests/commands and actual results:**
  - `python -m pytest services\api\tests` -> 14 passed in 0.32s (verified fresh food eligibility, ambient holding violation triggering ON_HOLD, reviewer queue inspection, and unauthorized reviewer decision rejection).
  - `npm --workspace=apps/web run build` -> Next.js 14 compiled successfully (7/7 pages generated).
- **Database/migration state:** `20261010000001_initial_schema.sql` and `20261010000002_auth_triggers.sql`.
- **Known issues/blockers:** None.
- **Mocked/unconfigured integrations:** Vision adapter running with deterministic local inference.
- **Last known working commit:** Pending commit for Phase 4.
- **Next action:** Phase 5 (Recipient Demand and Capacity).

## 10. Immediate next action

Proceed with Phase 5 (Recipient demand and capacity):
1. Implement timestamped recipient capacity snapshots.
2. Capture people served, meals needed, demand by food item, and storage capability.
3. Implement demand freshness / expiry policy.
4. Build recipient capacity update flow and API endpoints.




