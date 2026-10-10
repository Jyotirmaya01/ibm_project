# AnnaSetu AI --- Engineering and Agent Rules

This document is mandatory for human developers and AI coding agents.
Read it before implementation and whenever troubleshooting.

## 1. Order of authority

1.  Safety and applicable law/regulatory requirements.
2.  `prd.md` and approved product decisions.
3.  `architecture.md` and data contracts.
4.  This `rules.md`.
5.  `design.md`.
6.  `tasks.md` and current `memory.md`. If documents conflict, do not
    silently choose. Record the conflict in `memory.md` and ask for a
    decision or follow the safer interpretation.

## 2. Product rules

-   Support weddings, small functions, bhandaras, households, hotels,
    restaurants, caterers, corporate events and community functions.
-   Donors pay no fee to post/donate.
-   Support ashrams, orphanages, shelters, community kitchens and other
    eligible people/organizations.
-   Build the whole loop: listing → evidence → recipient needs →
    allocation → communication → collection → handover.
-   Do not fabricate real organizations, live availability, completed
    handovers or impact.
-   Clearly label synthetic/demo data and mocked integrations.

## 3. Food-safety rules

-   Photos are compulsory for listing publication.
-   Images cannot prove microbial safety or all handling conditions.
-   Never call a model score a safety certificate.
-   Collect preparation time, relevant handling/storage history and
    required temperature evidence.
-   Use reviewed, versioned rules based on applicable FSSAI requirements
    and guidance; do not invent limits.
-   Missing or conflicting critical evidence triggers hold,
    clarification or human review.
-   Known safety failures block allocation under configured rules;
    recipient acceptance cannot override them.
-   At handover, recipients inspect the actual food and may accept,
    partially accept or reject with a reason.
-   A high evidence score is not a guarantee; AI score alone must not
    auto-reject a listing.
-   Record rule source/version, assessment version, reviewer and
    timestamp.

## 4. Allocation rules

-   Never allocate more than available quantity, recipient demand or
    safe capacity.
-   Use explicit units and documented conversions.
-   Allocate by food item compatibility.
-   Consider people served, meal demand, existing food, restrictions,
    storage, deadline, distance and transport.
-   Do not split equally by default or give all food to the first
    respondent.
-   Optimize safe, usable delivered food, not just kilograms assigned.
-   Use OR-Tools or a deterministic equivalent; LLMs cannot invent
    quantities or bypass constraints.
-   Proposed allocation ≠ reservation ≠ collection ≠ confirmed handover.
-   Use transactions and idempotency to prevent double claims.
-   On decline, timeout, reduced quantity or failed pickup,
    release/revise reservation and recalculate.
-   Expand search radius only if timing and transport remain feasible.
-   If no match is feasible, report remaining food honestly.
-   Log optimizer version, inputs, constraints, result and reason.

## 5. Agent and automation rules

-   Agents use narrow, typed tools with validated inputs/outputs.
-   Backend/database rules are authoritative, not model memory.
-   Persist critical workflow state.
-   Every consequential action requires authorization and an audit
    event.
-   Use timeouts, bounded retries, backoff and idempotency.
-   Do not spam recipients or disclose contacts without
    consent/authorization.
-   Do not send calls, WhatsApp messages or dispatch drivers until
    provider, permission and operational setup are complete.
-   Provider API success does not prove a person saw a message or
    completed a pickup.
-   Agents cannot bypass safety holds, access controls or quantity
    limits.
-   If uncertain, stop safely, explain the uncertainty and request
    review instead of guessing.

## 6. Security and privacy

-   Never place secrets, service-role keys or LLM keys in client code or
    source control.
-   Enable and test RLS on user-accessible tables.
-   Enforce permissions on the backend even when the UI hides controls.
-   Keep photos private and use short-lived signed URLs.
-   Do not expose exact pickup addresses publicly by default.
-   Phone numbers are private unless the user opts into disclosure or an
    authorized handover requires it.
-   Collect minimum necessary personal data; do not collect beneficiary
    identities without a documented need.
-   Validate uploads, restrict size/type and rate-limit abuse-prone
    endpoints.
-   Define retention, deletion and account deactivation procedures.
-   Audit privileged actions and access to sensitive records.

## 7. Engineering standards

-   TypeScript strict mode for client applications.
-   Python type hints and Pydantic validation for API boundaries.
-   Keep UI, business logic, data access and integrations separate.
-   Use migrations for schema changes.
-   Use explicit state machines; do not rely on loosely related
    booleans.
-   Keep functions focused and error messages actionable.
-   Avoid premature abstractions, duplicated services and unnecessary
    microservices.
-   Add tests for business rules and error paths, not only happy paths.
-   Do not silently swallow exceptions.
-   Never claim tests passed unless actually run.

## 8. Error-handling and troubleshooting protocol

### Required protocol for every error

1.  **Reproduce:** capture the exact command/action, error message,
    timestamp and affected environment.
2.  **Classify:** identify whether it is a configuration,
    dependency/version, network/provider, database/migration,
    authorization, application logic, build or test error.
3.  **Inspect evidence:** read relevant logs, stack trace, request ID
    and surrounding code. Do not guess based on the last line alone.
4.  **Form one testable hypothesis:** state what evidence would confirm
    or disprove it.
5.  **Make the smallest fix:** avoid unrelated refactors or replacing
    working files.
6.  **Verify:** rerun the failing test/command, then relevant regression
    tests and type/lint/build checks.
7.  **Record:** document root cause, changed files, commands/results and
    any remaining risk in `memory.md`.
8.  **Escalate safely:** if the issue affects food safety, permissions,
    data integrity, secrets or live donations, stop the affected
    workflow and require review rather than applying an unverified
    workaround.

### Common troubleshooting rules

-   **Install/build error:** verify runtime version, package manager,
    lockfile and documented package compatibility before changing
    versions. Do not randomly upgrade all dependencies.
-   **Environment/config error:** compare required variables with
    `.env.example`; never print secrets into logs or chat. Restart the
    relevant process after safe config changes.
-   **Database/migration error:** inspect current schema and migration
    history first. Never delete production data or reset a shared
    database to make a migration pass. Write a forward migration and
    back up where appropriate.
-   **RLS/permission error:** inspect authenticated role, policy,
    organization membership and backend authorization. Do not "fix" it
    by making tables public or disabling RLS.
-   **Allocation/concurrency error:** inspect transaction boundaries,
    idempotency keys, reservation state and available-quantity
    calculation. Add a regression test that reproduces the race.
-   **Agent loop/timeout:** inspect workflow state, retry policy, tool
    result and correlation ID. Add bounded retries and terminal failure
    state; never create infinite loops.
-   **External provider error:** inspect provider status, credentials
    presence, consent/config and response code. Use mocks in
    development. Do not report success on timeout.
-   **Photo upload error:** check file size/type, signed URL expiry,
    network and storage policy. Preserve the draft and offer retry; do
    not bypass private storage.
-   **Test failure:** reproduce the exact test, understand whether code
    or test expectation is wrong, make a targeted change and rerun.
    Never delete a valid test just to get green CI.
-   **UI error:** inspect console/device logs, route and component
    state; verify loading, empty, error and offline states on a small
    viewport too.

## 9. AI coding-agent workflow

1.  Read all six documents before coding.
2.  Inspect the existing repository and git status first.
3.  Read the task and acceptance criteria; implement one task/milestone
    only.
4.  Before edits, list files to change and a short plan.
5.  Preserve working code; explain any necessary replacement.
6.  Implement, test, review diff and update docs.
7.  Report commands actually run and pass/fail results.
8.  Mark a task complete only when implementation and acceptance
    criteria are verified.
9.  Update `memory.md` with current phase, files, test results,
    decisions and next action.
10. If blocked or ambiguous, record the blocker and ask; do not invent a
    decision.

## 10. Definition of done

A task is done only when implementation, authorization, loading/error
states, tests, documentation and acceptance criteria are addressed. A
pretty but nonfunctional screen is not done. A mocked integration must
be labelled as mocked.
