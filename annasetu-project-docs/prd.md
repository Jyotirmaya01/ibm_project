# AnnaSetu AI --- Product Requirements Document (PRD)

**Version:** 2.0 · **Status:** Product baseline · **Last updated:**
2026-10-10

## 1. Product overview

**AnnaSetu AI** is a mobile-first food-rescue and redistribution
platform for India. It helps people and businesses with surplus prepared
food connect with nearby people and organizations that can use it, then
coordinates a safe, need-based split, communication, collection and
verified handover.

AnnaSetu is not just a donation directory, a food classifier or a
chatbot. Its defining capability is an **agentic, need-based
distribution engine** that continuously updates allocations as
recipients respond and pickup conditions change.

**Product promise:** The right food, in a usable quantity, to the right
recipient, in time.

## 2. Problem statement

Large quantities of prepared food remain after weddings, small
functions, bhandaras, hotels, restaurants, caterers, corporate events
and household gatherings. At the same time, nearby ashrams, orphanages,
shelters, community kitchens and people experiencing food insecurity may
not know that food is available.

Current informal coordination has several gaps: - Donors do not know
which nearby recipients genuinely need each food item. - A single
recipient may be offered far more than it can use, causing further waste
or unsafe storage. - Recipients often lack timely details and clear
photos to decide whether to accept food. - Food preparation, handling,
storage and collection information may be incomplete. - Calls and
messages are fragmented; donors cannot easily track who accepted, what
quantity is reserved or whether food was actually collected. - A listing
or "match" does not guarantee a successful handover. - Manual
coordination struggles when one donation needs to be split across
several recipients or a recipient cancels.

## 3. Proposed solution

AnnaSetu provides one coordinated workflow: 1. A donor posts surplus
food with compulsory photos, quantity, preparation time,
handling/storage information and pickup window. 2. AI checks listing
completeness, image quality and visible evidence, then explains missing
information and risk indicators. It does not certify food safety from
photos. 3. Eligible nearby recipients discover the listing and see the
same food evidence, quantity, timing and warnings. 4. Recipients share
current demand, people served, other food available, storage/capacity
and collection availability. 5. A deterministic optimization engine
proposes quantities for multiple recipients based on need,
compatibility, safety eligibility, deadline and logistics. 6. Recipients
accept, request a different quantity, ask questions or decline. 7.
Reservations prevent the same quantity from being promised twice. The
agent recalculates after declines, timeouts or changed demand. 8. Donor
and recipient coordinate by in-app chat and optional phone contact;
collection ETA and status are tracked. 9. Actual collected, delivered
and accepted quantities are recorded separately, and only confirmed
outcomes count toward impact.

## 4. Mission, vision and goals

### Mission

Reduce avoidable food waste while helping people access food through
safe, transparent, need-based redistribution.

### Vision

Build a trusted local-to-national network where surplus food can be
discovered, assessed, allocated and collected with less friction and
less waste.

### Product goals

-   Make posting and donating food free for donors.
-   Make listing photos compulsory and food information clear.
-   Avoid over-allocation by considering actual recipient needs and
    capacity.
-   Enable multiple recipients to share one donation.
-   Provide transparent evidence assessment and human review for
    uncertain cases.
-   Coordinate communication and collection without promising success
    that has not occurred.
-   Build trustworthy impact data based on completed handovers.
-   Start with a small, supervised local pilot and expand based on
    evidence.

### Success metrics

-   Percentage of listings with complete required evidence.
-   Median time from listing to first suitable recipient response.
-   Percentage of allocated quantity actually collected.
-   Percentage of collected quantity accepted at handover.
-   Quantity left unallocated or rejected, with reasons.
-   Failed pickup rate.
-   Percentage of allocations within recipient demand/capacity.
-   Number of duplicate/over-quantity reservation attempts blocked.
-   Repeat donor and recipient participation.
-   Safety incidents and unresolved reports.

Do not claim "meals saved" or "waste prevented" without documented
calculation methods and evidence. Any meal conversion is an estimate and
must be labelled as such.

## 5. Target users

### Primary donors

-   Wedding and event organizers.
-   Bhandara and religious/community event organizers.
-   Hotels, restaurants, caterers and food businesses.
-   Corporate events and institutions.
-   Households and people organizing small functions.

### Primary recipients

-   Ashrams and orphanages.
-   Shelters and community kitchens.
-   Other eligible people or organizations in need.
-   Organizations serving meals to groups whose demand and capacity can
    be described.

### Supporting users

-   Authorized volunteers and collectors.
-   Organization coordinators.
-   Operations administrators.
-   Appropriately qualified or authorized food-safety reviewers.

The product must not assume all recipients are registered NGOs. It
should support open discovery with transparent verification status and
proportionate safeguards. Do not falsely label an unverified person or
organization as verified.

## 6. Product surfaces

1.  **Mobile app (Android/iOS):** donor and recipient journeys, photos,
    listings, chat, pickup and handover.
2.  **Web operations dashboard:** exception review, organizations,
    allocations, incidents, audit and impact.
3.  **Public website:** mission, how it works, safety approach, partner
    onboarding and support.
4.  **Shared backend and agent workflow:** data, authorization,
    allocation, notifications and audit.

## 7. MVP scope

### Must have

-   Authentication and role/organization access.
-   Donor and recipient profiles.
-   Food listing with compulsory photo upload.
-   Structured preparation, handling/storage, quantity and pickup
    information.
-   Evidence assessment with limitations and hold/clarification flow.
-   Nearby listing discovery and recipient demand/capacity.
-   Multi-recipient, need-based allocation using a deterministic
    optimizer.
-   Transactional quantity reservations and concurrency protection.
-   Accept, partial accept, ask details and decline.
-   In-app chat and optional user-controlled phone disclosure.
-   Pickup/ETA/status and handover confirmation.
-   Operations dashboard for exceptions and oversight.
-   Audit trail and honest outcome metrics.

### Defer until the core flow works

-   Nationwide deployment.
-   Automatic driver dispatch or a company-owned fleet.
-   Complex route optimization across many vehicles.
-   Payments or donor charges.
-   Broad WhatsApp/calling automation before consent/provider setup.
-   Advanced reputation scoring.
-   Predictive demand forecasting.
-   Unreviewed automatic food-safety decisions.

## 8. Product requirements

### Donor listing

Required photo(s), food type, quantity/unit, preparation time, relevant
handling/storage details, location, availability window and
contact/collection preferences. Save drafts and retry failed uploads.

### Evidence assessment

Return structured observations, missing fields, contradictions,
uncertainty and human-review needs. Do not claim that a model score
proves food is safe. The ruleset must be versioned and reviewed against
applicable FSSAI guidance before a live pilot.

### Recipient need

Capture number of people served, meal timing, quantity requested by
item, other food available, restrictions, storage/handling capacity and
collection capability. Demand must be timestamped and refreshed.

### Allocation

Optimize safe and feasible usable delivery---not merely equal division
or kilograms assigned. Never exceed available quantity, recipient
demand/capacity, compatibility or applicable time/safety constraints.
Recalculate on decline, timeout or changed conditions.

### Communication and handover

Support in-app chat, optional phone disclosure, notifications,
collection ETA, actual quantity and recipient accept/partial
accept/reject with reason. Provider integrations require configuration
and consent.

### Admin and reporting

Review holds, incidents, organizations, allocations, failed pickups and
audit events. Keep listed, proposed, reserved, collected, delivered,
accepted, rejected and unallocated quantities distinct.

## 9. Safety and trust boundaries

-   Photo analysis cannot prove microbial safety.
-   A recipient accepting food cannot override a known safety failure.
-   Uncertain evidence can trigger hold, clarification or human review;
    AI score alone must not auto-reject.
-   Use reviewed, versioned safety rules and do not invent FSSAI limits.
-   Collect minimum personal data; protect photos, contact details and
    exact addresses.
-   Real-world pilot procedures must be reviewed with appropriate local
    stakeholders.

## 10. MVP acceptance criteria

The MVP is ready for pilot consideration when a synthetic end-to-end
test demonstrates: 1. A donor cannot publish without required photos and
mandatory fields. 2. Recipients can inspect the listing and report
current needs. 3. A donation can be split across recipients according to
demand and constraints. 4. Concurrent claims cannot reserve more than
available. 5. Declines/timeouts release quantity and trigger
recalculation. 6. Known safety failures block allocation; uncertain
cases follow hold/review flow. 7. Chat/contact preferences and pickup
status work with configured services or clearly labelled mocks. 8.
Actual handover is recorded before quantity counts as delivered. 9.
Role-based and cross-organization access tests pass. 10. Impact metrics
use confirmed records and label estimates.

## 11. Pilot plan

Start in one locality with a small number of willing donors and
recipient organizations. Use synthetic data in development. Before live
food movement, validate applicable safety rules, recipient contacts,
collection operations, privacy notices, incident handling and
escalation. Expand only after reviewing real completion and safety
metrics.
