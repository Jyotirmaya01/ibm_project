import uuid
from datetime import datetime, timezone
from typing import Dict, Any
from app.agent.state import FoodRescueState, MissionStage
from app.services.listings import LISTING_DATABASE
from app.services.safety_rules import evaluate_listing_safety
from app.services.recipients import get_all_capacity_snapshots, check_recipient_compatibility
from app.api.v1.organizations import DEMO_ORGANIZATIONS
from app.optimization.solver import solve_quantity_allocation
from app.services.allocations import generate_allocation_plan


def _log_event(state: FoodRescueState, step: str, message: str, metadata: Dict[str, Any] = None) -> None:
    """Helper to append an entry to the mission's audit trail."""
    entry = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "step": step,
        "message": message,
        "metadata": metadata or {},
    }
    state["audit_trail"].append(entry)


async def intake_validation_node(state: FoodRescueState) -> FoodRescueState:
    """Validates that listing exists, contains food items, and includes compulsory photographic evidence."""
    listing_id_str = state["listing_id"]
    try:
        listing_uuid = uuid.UUID(listing_id_str)
        listing = LISTING_DATABASE.get(listing_uuid)
    except Exception:
        listing = None

    if not listing:
        state["stage"] = MissionStage.HUMAN_CHECKPOINT.value
        state["requires_human_review"] = True
        state["human_checkpoint_reason"] = f"Listing '{listing_id_str}' not found in active database."
        _log_event(state, "INTAKE_VALIDATION", "Listing not found, routed to human checkpoint.")
        return state

    state["title"] = listing.title
    state["pickup_address"] = listing.approx_area_name
    
    if not listing.items:
        state["stage"] = MissionStage.HUMAN_CHECKPOINT.value
        state["requires_human_review"] = True
        state["human_checkpoint_reason"] = "Listing has no food items registered."
        _log_event(state, "INTAKE_VALIDATION", "No food items, routed to human checkpoint.")
        return state

    primary_item = listing.items[0]
    state["food_name"] = primary_item.name
    state["total_quantity_kg"] = float(primary_item.quantity_value)
    state["has_photo_evidence"] = len(listing.photos) > 0

    if not state["has_photo_evidence"]:
        state["stage"] = MissionStage.HUMAN_CHECKPOINT.value
        state["requires_human_review"] = True
        state["human_checkpoint_reason"] = "Compulsory food photos missing. Listing held per safety protocol."
        _log_event(state, "INTAKE_VALIDATION", "Missing compulsory photo evidence.")
        return state

    state["stage"] = MissionStage.SAFETY_EVALUATION.value
    _log_event(state, "INTAKE_VALIDATION", f"Listing validated: {state['total_quantity_kg']}kg {state['food_name']}.")
    return state


async def safety_evaluation_node(state: FoodRescueState) -> FoodRescueState:
    """Executes FSSAI surplus safety rules and photo evidence assessment."""
    listing_uuid = uuid.UUID(state["listing_id"])
    listing = LISTING_DATABASE.get(listing_uuid)
    if not listing:
        state["stage"] = MissionStage.HUMAN_CHECKPOINT.value
        state["requires_human_review"] = True
        state["human_checkpoint_reason"] = "Listing missing during safety evaluation."
        return state

    assessment = await evaluate_listing_safety(listing)
    
    state["safety_rule_version"] = assessment.rule_version
    
    if assessment.status == "ON_HOLD":
        state["stage"] = MissionStage.HUMAN_CHECKPOINT.value
        state["safety_cleared"] = False
        state["requires_human_review"] = True
        indicators = ", ".join(assessment.risk_indicators)
        state["safety_hold_reason"] = f"FSSAI threshold hold: {indicators}"
        state["human_checkpoint_reason"] = state["safety_hold_reason"]
        _log_event(state, "SAFETY_EVALUATION", f"Safety hold triggered: {indicators}", {"risk_indicators": assessment.risk_indicators})
        return state

    state["safety_cleared"] = True
    state["stage"] = MissionStage.DEMAND_DISCOVERY.value
    _log_event(state, "SAFETY_EVALUATION", f"Listing cleared under {assessment.rule_version}.")
    return state


async def demand_discovery_node(state: FoodRescueState) -> FoodRescueState:
    """Discovers nearby recipients with active, non-stale demand capacity snapshots."""
    snapshots = get_all_capacity_snapshots(include_stale=False)
    candidates = []

    for s in snapshots:
        org = DEMO_ORGANIZATIONS.get(s.recipient_id)
        org_name = org.name if org else "Shelter Kitchen"
        demand_kg = round(s.net_meal_deficit * 0.35, 2)

        is_compat, reason = check_recipient_compatibility(
            recipient_id=s.recipient_id,
            allocated_kg=demand_kg,
            is_veg=True,
        )

        candidates.append({
            "id": str(s.recipient_id),
            "name": org_name,
            "demand_kg": demand_kg,
            "max_storage_kg": float(s.max_storage_kg),
            "distance_km": 2.5 if "Ashram" in org_name else 4.0,
            "is_compatible": is_compat,
        })

    state["eligible_recipients"] = candidates

    if not candidates or all(not c["is_compatible"] for c in candidates):
        state["stage"] = MissionStage.HUMAN_CHECKPOINT.value
        state["requires_human_review"] = True
        state["human_checkpoint_reason"] = "No compatible recipients found within delivery zone."
        _log_event(state, "DEMAND_DISCOVERY", "Zero compatible recipient candidates found.")
        return state

    state["stage"] = MissionStage.OPTIMIZATION.value
    _log_event(state, "DEMAND_DISCOVERY", f"Found {len(candidates)} recipient candidates.", {"candidates_count": len(candidates)})
    return state


async def optimization_node(state: FoodRescueState) -> FoodRescueState:
    """Executes deterministic mathematical solver to optimize allocation splits."""
    listing_uuid = uuid.UUID(state["listing_id"])
    
    # Run the allocation service to lock plan and transactional reservations
    plan = await generate_allocation_plan(listing_uuid)
    
    state["allocation_plan_id"] = str(plan.id)
    state["allocated_kg"] = plan.total_allocated_kg
    state["unallocated_kg"] = plan.total_unallocated_kg
    state["optimizer_engine"] = plan.optimizer_engine
    state["allocations"] = [
        {
            "id": str(a.id),
            "recipient_id": str(a.recipient_id),
            "recipient_name": a.recipient_name,
            "allocated_kg": a.allocated_kg,
            "status": a.status.value,
        }
        for a in plan.allocations
    ]

    state["stage"] = MissionStage.RECIPIENT_OUTREACH.value
    _log_event(
        state,
        "OPTIMIZATION",
        f"Allocation plan generated by {plan.optimizer_engine}: {plan.total_allocated_kg}kg allocated across {len(plan.allocations)} recipients.",
        {"plan_id": str(plan.id), "engine": plan.optimizer_engine},
    )
    return state


async def recipient_outreach_node(state: FoodRescueState) -> FoodRescueState:
    """Simulates multi-recipient notification and reservation lock dispatch."""
    recip_count = len(state["allocations"])
    state["outreach_status"] = "OFFERED"
    state["stage"] = MissionStage.HANDOVER_COORDINATION.value
    _log_event(
        state,
        "RECIPIENT_OUTREACH",
        f"Dispatched digital reservation offers to {recip_count} shelters with 45min lock window.",
    )
    return state


async def handover_coordination_node(state: FoodRescueState) -> FoodRescueState:
    """Finalizes allocation plan and transitions mission to active coordination state."""
    state["stage"] = MissionStage.COMPLETED.value
    _log_event(
        state,
        "HANDOVER_COORDINATION",
        "Mission coordination established. Ready for digital OTP or driver dispatch.",
    )
    return state


async def human_checkpoint_node(state: FoodRescueState) -> FoodRescueState:
    """Pass-through node when human review is required; keeps state frozen until supervisor resolves."""
    _log_event(
        state,
        "HUMAN_CHECKPOINT",
        f"Execution held for coordinator review. Reason: {state.get('human_checkpoint_reason', 'Review required')}",
    )
    return state
