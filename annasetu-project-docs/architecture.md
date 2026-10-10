# AnnaSetu AI --- System Architecture

**Version:** 2.0 · **Status:** Proposed baseline

## 1. Architecture goals

-   Reliable mobile, web and backend experience.
-   PostgreSQL is the source of truth.
-   AI agents coordinate; deterministic services enforce constraints.
-   Start with a modular monolith, not premature microservices.
-   Persist critical workflows and decisions.
-   External integrations are replaceable adapters and can be mocked.
-   Security, privacy and food-safety constraints live on the server,
    not only in the UI.

## 2. Technology decisions

### Mobile

React Native + Expo + TypeScript, Expo Router, accessible component
primitives and Expo Notifications.

### Web

Next.js + TypeScript + Tailwind CSS; shadcn/ui selectively for
accessible primitives. The public website and operations dashboard can
live in the same web app with separate route groups and authorization.

### API and agents

Python + FastAPI + Pydantic. LangGraph for durable stateful
orchestration. Use LangChain only where it reduces integration work.
Provider-independent LLM adapter and validated structured outputs.

### Data and identity

Supabase PostgreSQL, Supabase Auth, private Supabase Storage and
Supabase Realtime where appropriate. Use database migrations,
transactions, constraints and row-level security.

### Allocation

Google OR-Tools for quantity optimization and later routing constraints.
LLMs must not invent quantities.

### Integrations and deployment

Maps via Google Maps Platform or Mapbox adapter; push via Expo
Notifications with FCM/APNs; email/WhatsApp/calling via configured
providers with consent. Vercel for web, a Python-compatible container
host for API/agent service, GitHub for source control, Sentry and
structured logs for monitoring.

Do not use Firebase and Supabase as duplicate sources of truth for core
data.

## 3. Folder structure

``` text
annasetu/
├── apps/
│   ├── mobile/                      # Expo Android/iOS application
│   │   ├── app/                     # Expo Router routes and layouts
│   │   ├── src/
│   │   │   ├── components/          # Reusable mobile UI
│   │   │   ├── features/            # donor, recipient, listings, chat, pickup
│   │   │   ├── hooks/
│   │   │   ├── lib/                 # API client, auth, upload helpers
│   │   │   ├── theme/               # tokens, typography, spacing
│   │   │   ├── i18n/
│   │   │   └── types/
│   │   ├── assets/                  # app icons and local assets
│   │   ├── tests/
│   │   └── package.json
│   └── web/                         # Next.js public site + operations console
│       ├── app/
│       │   ├── (public)/
│       │   ├── (auth)/
│       │   └── (operations)/
│       ├── src/
│       │   ├── components/
│       │   ├── features/
│       │   ├── lib/
│       │   ├── theme/
│       │   └── types/
│       ├── public/
│       └── package.json
├── services/
│   └── api/                         # FastAPI backend and workflow engine
│       ├── app/
│       │   ├── main.py
│       │   ├── api/                 # versioned routes/dependencies
│       │   ├── core/                # config, auth, errors, logging
│       │   ├── models/              # domain/database models
│       │   ├── schemas/             # Pydantic request/response schemas
│       │   ├── repositories/        # data access
│       │   ├── services/            # business logic
│       │   ├── workflows/           # LangGraph orchestration
│       │   ├── agents/              # narrow agent instructions/tools
│       │   ├── optimization/        # OR-Tools model and constraints
│       │   ├── integrations/        # maps, messaging, LLM, storage adapters
│       │   ├── security/            # policy and permission helpers
│       │   └── observability/       # traces, audit, metrics
│       ├── tests/
│       │   ├── unit/
│       │   ├── integration/
│       │   └── e2e/
│       ├── pyproject.toml
│       └── Dockerfile
├── packages/
│   ├── api-client/                  # generated API client if useful
│   └── design-tokens/               # shared token source/documentation
├── supabase/
│   ├── migrations/
│   ├── seed.sql                     # synthetic data only
│   └── config.toml
├── docs/
│   ├── prd.md
│   ├── architecture.md
│   ├── rules.md
│   ├── design.md
│   ├── tasks.md
│   └── memory.md
├── scripts/                         # setup, seed, validation utilities
├── .github/workflows/               # CI checks
├── .env.example
├── .gitignore
├── package.json                    # workspace scripts if using a monorepo
└── README.md
```

Keep Python and TypeScript source separate. Generate a typed API client
from FastAPI's OpenAPI schema when useful. Do not create empty folders
for every idea unless a current task needs them.

## 4. High-level component flow

``` mermaid
flowchart TD
  M[Expo Mobile App] --> API[FastAPI API]
  W[Next.js Website and Ops] --> API
  M --> AUTH[Supabase Auth]
  W --> AUTH
  API --> DB[(PostgreSQL)]
  M --> STORE[Private Photo Storage]
  STORE --> API
  API --> WF[LangGraph Workflow]
  WF --> E[Evidence Assessment]
  WF --> D[Recipient Discovery and Need]
  WF --> O[OR-Tools Allocation]
  WF --> C[Coordination and Recovery]
  O --> TX[Transactional Allocation Service]
  TX --> DB
  C --> EXT[Maps / Chat / Notification Adapters]
  DB --> RT[Realtime Events]
  RT --> M
  RT --> W
```

## 5. Core data entities

-   `profiles`, `organizations`, `organization_members`
-   `recipient_capacity_snapshots`
-   `food_listings`, `food_items`, `food_evidence`, `safety_assessments`
-   `recipient_interests`, `allocation_plans`, `allocations`,
    `reservations`
-   `conversations`, `conversation_members`, `messages`
-   `pickup_assignments`, `handover_records`
-   `notifications`, `workflow_runs`, `workflow_events`
-   `reports`, `audit_events`

Use UUIDs, UTC timestamps, explicit quantity units, foreign keys,
constraints and migrations. Store structured facts as columns/relations,
not only in free-text blobs. Use PostGIS if geo-query needs justify it.

## 6. State machines

### Listing

`DRAFT -> SUBMITTED -> EVIDENCE_REVIEW -> AVAILABLE` Other states:
`ON_HOLD`, `PARTIALLY_RESERVED`, `FULLY_RESERVED`, `PICKUP_IN_PROGRESS`,
`PARTIALLY_HANDED_OVER`, `COMPLETED`, `EXPIRED`, `CANCELLED`,
`REJECTED`.

### Allocation

`PROPOSED -> OFFERED -> RESERVED -> CONFIRMED -> COLLECTED -> HANDED_OVER`
Other states: `DECLINED`, `EXPIRED`, `CANCELLED`, `FAILED`,
`PARTIALLY_ACCEPTED`, `REJECTED_AT_HANDOVER`.

### Evidence

`INCOMPLETE`, `PENDING_ASSESSMENT`, `NEEDS_CLARIFICATION`,
`PENDING_HUMAN_REVIEW`, `ELIGIBLE_UNDER_RULES`, `ON_HOLD`,
`REJECTED_BY_RULE`, `WITHDRAWN`. "Eligible under rules" is not a
guarantee of safety.

Every transition must be validated server-side and audited.

## 7. Allocation algorithm workflow

1.  Load eligible food items and fresh recipient capacity snapshots.
2.  Exclude incompatible, unsafe, stale or infeasible candidates.
3.  Build OR-Tools optimization model with hard constraints.
4.  Optimize estimated usable delivery, then consider urgency, travel
    cost and fairness.
5.  Save the plan and input snapshot.
6.  Offer quantities and atomically reserve accepted portions.
7.  Recalculate after decline, timeout, changed demand or failed pickup.
8.  Compare proposed and actual delivered/accepted quantities.

Use transactions and idempotency to prevent double allocation. Keep
optimizer logic deterministic and testable.

## 8. API route groups

`/v1/organizations`, `/v1/recipients/capacity`, `/v1/listings`,
`/v1/listings/{id}/photos`, `/v1/listings/{id}/evidence`,
`/v1/listings/{id}/interests`, `/v1/allocations/plans`,
`/v1/allocations/{id}/accept`, `/v1/allocations/{id}/decline`,
`/v1/conversations`, `/v1/messages`, `/v1/pickups`, `/v1/handovers`,
`/v1/admin/reviews`, `/v1/impact/metrics`.

Add request validation, pagination, authorization and idempotency for
mutations. Never expose service-role credentials to client apps.

## 9. Security and reliability

-   Supabase RLS plus backend authorization.
-   Private photo buckets and short-lived signed URLs.
-   Public listings show approximate location until exact pickup details
    are needed.
-   Phone numbers private by default and disclosure controlled by user
    preference.
-   Collect minimum necessary personal data.
-   Rate-limit listing creation, messaging and repeated claims.
-   Use idempotency, bounded retries and a durable job/outbox approach
    for external side effects.
-   Provider timeouts must not imply message delivery, pickup or
    handover success.
-   Separate development, staging and production environments.
-   Keep secrets out of Git; maintain `.env.example` with placeholders
    only.

## 10. Deployment path

**Development:** local apps/API, development Supabase, synthetic seed
data and mocked providers.\
**Pilot:** secured managed database/storage/auth, deployed API
container, TLS, backups, monitoring and documented incident handling.\
**Scale:** add queues/workers or separate services only when measured
traffic and reliability needs justify them.
