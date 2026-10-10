# AnnaSetu AI — Incident Response & Safety Contingency Runbook

## 1. Severity Classification Matrix

| Level | Definition | Response SLA | Response Team |
| :--- | :--- | :--- | :--- |
| **P1 - Critical Safety Hazard** | Suspected food spoilage, recipient illness complaint, or severe temperature violation. | **Immediate (< 15 mins)** | Safety Lead, Operations Coordinator, Medical Advisor |
| **P2 - Transit / Logistics Failure** | Vehicle breakdown with perishable food onboard, transit delay exceeding 60 minutes. | **< 30 mins** | Logistics Coordinator, Backup Volunteer Pool |
| **P3 - Platform Outage** | Backend API or web console unavailable, database lock, authentication failure. | **< 45 mins** | Engineering On-Call |
| **P4 - Minor Discrepancy** | Minor weight discrepancy (< 5 kg), typographical error in donor notes. | **< 4 hours** | Support Coordinator |

---

## 2. Standard Operating Procedures (SOP)

### SOP-01: Perishable Temperature Breach or Inspection Failure
1. **Quarantine:** Recipient marks handover as `REJECTED_AT_HANDOVER` in the app.
2. **Notification:** Operations console triggers an immediate `P1` operational alert to coordinator.
3. **Disposal / Diversion:** Driver is instructed NOT to redistribute the food for human consumption. Batch is diverted to certified composting or biomethanation facilities.
4. **Zero Impact Logging:** The system records 0.0 delivered kg. No donor or recipient impact points are awarded.
5. **Donor Consultation:** Coordinator contacts donor to inspect hot/cold holding equipment at donor facility.

### SOP-02: Driver Delay or Vehicle Breakdown
1. **Threshold:** If driver is stationary or transit time exceeds 40 minutes for perishable food.
2. **Action:** Logistics coordinator triggers the in-app chat with driver.
3. **Secondary Dispatch:** If vehicle is immobilized, secondary volunteer within a 3 km radius is dispatched via `/v1/handover/sessions/{id}/dispatch-driver` to transfer sealed insulated bins.

### SOP-03: Database & Migration Rollback
1. **Migration Rollback:**
   ```bash
   # Revert recent schema migration in PostgreSQL
   psql -U postgres -d annasetu -f supabase/migrations/rollback/revert_latest.sql
   ```
2. **Backup & Restore Point-in-Time:**
   ```bash
   # Create immediate snapshot
   pg_dump -U postgres -d annasetu -Fc -f annasetu_backup_$(date +%Y%m%d_%H%M%S).dump
   # Restore snapshot
   pg_restore -U postgres -d annasetu --clean --if-exists annasetu_backup_point_in_time.dump
   ```

---

## 3. Communication & Post-Mortem Requirements
- All P1 incidents require an audit trail export within 2 hours.
- Formal Root Cause Analysis (RCA) must be finalized within 24 hours of resolution.
