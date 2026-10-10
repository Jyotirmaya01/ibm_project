# AnnaSetu AI --- Implementation Plan and Task Board

**Version:** 2.0. This is the canonical task list. Tasks are not
complete until their acceptance checks are verified.

## Execution protocol

For each task: inspect current state → state plan/files → implement the
smallest coherent change → run relevant tests/checks → review diff →
update this file and `memory.md`. Never mark a task complete based on
generated code alone.

## Phase 0 --- Confirm product and repository

-   [ ] Read all six documents.
-   [ ] Inspect repository tree, Git status and existing implementation.
-   [ ] Identify runtime/package-manager versions and existing
    conventions.
-   [ ] Resolve contradictions between docs and current code; record
    decisions.
-   [ ] Confirm roles, state machines and allocation acceptance
    criteria.
-   [ ] Create GitHub issues or a local task board from this plan.
-   [ ] Write a short implementation plan with risks and dependencies.

**Exit gate:** Existing repository is understood; no files have been
overwritten blindly; architecture and first vertical slice are agreed.

## Phase 1 --- Scaffold and developer experience

-   [ ] Create/confirm monorepo folders from `architecture.md`.
-   [ ] Initialize Expo mobile TypeScript app.
-   [ ] Initialize Next.js web app.
-   [ ] Initialize FastAPI service with `/health` endpoint.
-   [ ] Add workspace scripts, lockfiles and consistent
    formatting/lint/type checks.
-   [ ] Add `.gitignore` and `.env.example` placeholders.
-   [ ] Configure development Supabase project and local config.
-   [ ] Add migration workflow and synthetic seed data only.
-   [ ] Add CI for install, lint, type check, tests and build.
-   [ ] Document exact local run commands for Windows and required
    runtimes.
-   [ ] Run all apps/checks and record actual output.

**Exit gate:** Mobile, web and API start; health endpoint responds; CI
runs; no secrets committed.

## Phase 2 --- Identity, roles and authorization

-   [ ] Implement Supabase Auth and account recovery.
-   [ ] Add profiles, organizations and organization membership schema.
-   [ ] Define permission matrix for donor, recipient, collector,
    coordinator, reviewer and admin.
-   [ ] Add RLS policies and backend authorization checks.
-   [ ] Build sign-in, onboarding and role-aware navigation.
-   [ ] Add authorization tests across users and organizations.
-   [ ] Add audit events for privileged actions.

**Exit gate:** users only access authorized records; RLS tests pass.

## Phase 3 --- Listing and photo evidence

-   [ ] Add listing and food-item migrations.
-   [ ] Configure private storage and upload policy.
-   [ ] Implement compulsory photo upload and safe file validation.
-   [ ] Build draft autosave and upload retry.
-   [ ] Capture quantity/unit, food type, preparation time,
    handling/storage, location and pickup window.
-   [ ] Implement listing state machine on the server.
-   [ ] Build donor create/review/publish flow.
-   [ ] Build recipient listing feed and details view.
-   [ ] Test missing photo, missing field, upload failure and invalid
    transition.

**Exit gate:** complete listing publishes; incomplete listing cannot
become available.

## Phase 4 --- Safety evidence workflow

-   [ ] Create versioned, reviewed rules model and record sources.
-   [ ] Define typed evidence assessment output.
-   [ ] Implement deterministic completeness/rule checks.
-   [ ] Add vision provider adapter for visible observations/image
    quality only.
-   [ ] Add hold, clarification and human-review workflow.
-   [ ] Build recipient-facing evidence panel and reviewer queue.
-   [ ] Log assessment version, rule version, decision and timestamp.
-   [ ] Test missing, conflicting and known-failure cases.

**Exit gate:** image AI cannot certify safety or bypass a configured
hard rule.

## Phase 5 --- Recipient demand and capacity

-   [x] Add timestamped recipient capacity snapshots.
-   [x] Capture people served, meals, demand by food item and current
    supply.
-   [x] Capture restrictions, storage capability and collection
    availability.
-   [x] Implement demand freshness/expiry policy.
-   [x] Build recipient capacity update flow.
-   [x] Distinguish self-reported vs reviewed data.
-   [x] Test stale and contradictory demand.

**Exit gate:** allocation service receives structured, current
demand/capacity.

## Phase 6 --- Need-based optimizer and reservations

-   [x] Write a clear optimization specification and units policy.
-   [x] Integrate OR-Tools.
-   [x] Filter by safety eligibility, food compatibility, deadline and
    transport.
-   [x] Implement demand/capacity constraints and fairness objective.
-   [x] Persist plans and input snapshots.
-   [x] Implement atomic reservations and idempotency.
-   [x] Implement partial acceptance and quantity adjustment.
-   [x] Implement decline/timeout release and reallocation.
-   [x] Add concurrent claim and no-overallocation tests.
-   [x] Show unallocated quantity and reasons honestly.

**Exit gate:** 30 kg can be split according to demand; concurrency
cannot reserve over 30 kg; stale/ineligible recipients are excluded.

## Phase 7 --- Agentic orchestration

-   [x] Add persistent LangGraph workflow.
-   [x] Implement intake, evidence, discovery and demand nodes.
-   [x] Expose optimizer as a validated tool.
-   [x] Implement coordination and recovery nodes.
-   [x] Add timeouts, bounded retries and idempotency.
-   [x] Add human checkpoints for configured exceptions.
-   [x] Add workflow trace/correlation IDs and operations view.
-   [x] Test declines, timeouts, stale data, tool errors and retries.

**Exit gate:** the agent can replan a failed match without corrupting
reservations or inventing completion.

## Phase 8 --- Chat, notifications and handover

-   [ ] Implement conversations and membership authorization.
-   [ ] Add realtime in-app chat.
-   [ ] Add contact disclosure preferences.
-   [ ] Add notification adapter and development mocks.
-   [ ] Integrate push notifications.
-   [ ] Add optional email/WhatsApp/calling providers only after
    setup/consent.
-   [ ] Implement pickup assignment and ETA.
-   [ ] Implement handover confirmation and reason codes.
-   [ ] Record offered, collected, delivered, accepted and rejected
    quantities.
-   [ ] Test duplicate callbacks and failed provider requests.

**Exit gate:** complete donor-to-recipient handover is accurately
recorded; no false-success states.

## Phase 9 --- Operations and impact

-   [ ] Build listing/evidence exception queue.
-   [ ] Build recipient/organization management.
-   [ ] Build allocation/reservation/pickup oversight.
-   [ ] Build reports, incidents and audit trail.
-   [ ] Build metrics from authoritative handover records.
-   [ ] Document any meal-estimate assumptions.
-   [ ] Add secure filtering, pagination and export where needed.

**Exit gate:** operators can investigate exceptions and distinguish
listings from completed rescues.

## Phase 10 --- Security, reliability and pilot

-   [ ] Test RLS and backend authorization.
-   [ ] Test rate limits and abuse cases.
-   [ ] Validate uploads and private image access.
-   [ ] Test database backup/restore and migration rollback strategy.
-   [ ] Add Sentry, structured logs and alerting for failed jobs.
-   [ ] Review retention, deletion and privacy notices.
-   [ ] Review applicable safety/operating requirements with appropriate
    stakeholders.
-   [ ] Confirm real pilot partners and collection procedures.
-   [ ] Run synthetic end-to-end and failure-injection tests.
-   [ ] Conduct a small supervised pilot.
-   [ ] Measure completed handovers, failed pickups, rejection reasons
    and time-to-match.
-   [ ] Document incident response and rollback.

**Exit gate:** pilot readiness is based on evidence and operational
approval, not just a working UI.

## First coding session --- strict scope

Do Phase 0 plus the first part of Phase 1 only: 1. Inspect repository
and Git status. 2. Report current state and planned files. 3. Scaffold
only missing pieces. 4. Add app/API health and environment examples. 5.
Run actual checks and report results. 6. Update `memory.md`.

Do not build every feature or agent in one session.
