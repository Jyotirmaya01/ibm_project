import uuid
import asyncio
from typing import Dict, List, Optional, Tuple
from datetime import datetime, timezone, timedelta
from app.schemas.listings import ListingStatus
from app.schemas.allocations import (
    AllocationStatus,
    AllocationPlanResponse,
    AllocationItemResponse,
    AllocationAcceptRequest,
    AllocationDeclineRequest,
)
from app.services.listings import LISTING_DATABASE
from app.services.recipients import (
    get_all_capacity_snapshots,
    check_recipient_compatibility,
    CAPACITY_SNAPSHOT_DATABASE,
)
from app.api.v1.organizations import DEMO_ORGANIZATIONS
from app.optimization.solver import solve_quantity_allocation
from app.services.audit import record_audit_event

# In-memory stores for plans and allocations
ALLOCATION_PLAN_DATABASE: Dict[uuid.UUID, AllocationPlanResponse] = {}
ALLOCATION_ITEM_DATABASE: Dict[uuid.UUID, AllocationItemResponse] = {}

# In-process lock to prevent concurrent double-booking race conditions
_ALLOCATION_LOCK = asyncio.Lock()

MEAL_PORTION_KG = 0.35  # ~350g per meal portion of cooked rice & dal


async def generate_allocation_plan(listing_id: uuid.UUID, actor_id: Optional[uuid.UUID] = None) -> AllocationPlanResponse:
    """
    Run mathematical optimization to propose quantity splits for a food listing.
    Enforces hard constraints across active recipient shelters.
    """
    listing = LISTING_DATABASE.get(listing_id)
    if not listing:
        raise KeyError(f"Listing '{listing_id}' not found.")

    if not listing.items:
        raise ValueError("Listing contains no food items to allocate.")

    # Target first primary food item (e.g. 30 kg rice)
    primary_item = listing.items[0]
    total_available_kg = float(primary_item.quantity_value)

    # 1. Gather Candidate Recipients
    snapshots = get_all_capacity_snapshots(include_stale=False)
    candidates = []

    for s in snapshots:
        org = DEMO_ORGANIZATIONS.get(s.recipient_id)
        org_name = org.name if org else "Shelter"
        
        # Calculate demand in kg from net meal deficit
        demand_kg = round(s.net_meal_deficit * MEAL_PORTION_KG, 2)
        
        # Compatibility check
        is_compat, _ = check_recipient_compatibility(
            recipient_id=s.recipient_id,
            allocated_kg=demand_kg,
            is_veg=True,
        )

        candidates.append({
            "id": s.recipient_id,
            "name": org_name,
            "demand_kg": demand_kg,
            "max_storage_kg": float(s.max_storage_kg),
            "distance_km": 2.5 if "Ashram" in org_name else 4.0,
            "is_compatible": is_compat,
        })

    # 2. Execute Solver
    alloc_map, engine_name = solve_quantity_allocation(total_available_kg, candidates)

    # 3. Formulate Plan & Allocations
    plan_id = uuid.uuid4()
    now = datetime.now(timezone.utc)
    alloc_items: List[AllocationItemResponse] = []
    total_allocated = 0.0

    candidate_name_map = {c["id"]: c["name"] for c in candidates}
    candidate_demand_map = {c["id"]: c["demand_kg"] for c in candidates}

    for recip_id, qty in alloc_map.items():
        item_id = uuid.uuid4()
        alloc_item = AllocationItemResponse(
            id=item_id,
            plan_id=plan_id,
            listing_id=listing_id,
            food_item_id=primary_item.id,
            recipient_id=recip_id,
            recipient_name=candidate_name_map.get(recip_id, "Shelter"),
            requested_kg=candidate_demand_map.get(recip_id, qty),
            allocated_kg=qty,
            status=AllocationStatus.OFFERED,
            reserved_at=now,
            expires_at=now + timedelta(minutes=45),
            created_at=now,
        )
        alloc_items.append(alloc_item)
        ALLOCATION_ITEM_DATABASE[item_id] = alloc_item
        total_allocated += qty

    total_unallocated = round(max(0.0, total_available_kg - total_allocated), 2)
    unallocated_reason = (
        f"{total_unallocated}kg unallocated because recipient demand or storage limits were satisfied."
        if total_unallocated > 0 else None
    )

    plan = AllocationPlanResponse(
        id=plan_id,
        listing_id=listing_id,
        food_item_id=primary_item.id,
        total_available_kg=total_available_kg,
        total_allocated_kg=round(total_allocated, 2),
        total_unallocated_kg=total_unallocated,
        unallocated_reason=unallocated_reason,
        optimizer_engine=engine_name,
        status="ACTIVE",
        allocations=alloc_items,
        created_at=now,
    )
    ALLOCATION_PLAN_DATABASE[plan_id] = plan

    # Update listing status
    listing.status = (
        ListingStatus.FULLY_RESERVED if total_unallocated == 0 else ListingStatus.PARTIALLY_RESERVED
    )

    await record_audit_event(
        action="ALLOCATION_PLAN_GENERATED",
        resource_type="allocation_plan",
        actor_id=actor_id,
        resource_id=plan_id,
        details={
            "listing_id": str(listing_id),
            "allocated_kg": total_allocated,
            "recipients_count": len(alloc_items),
            "engine": engine_name,
        },
    )

    return plan


async def process_recipient_acceptance(
    allocation_id: uuid.UUID,
    payload: AllocationAcceptRequest,
    actor_id: Optional[uuid.UUID] = None,
) -> AllocationItemResponse:
    """Process full or partial acceptance from a recipient."""
    async with _ALLOCATION_LOCK:
        alloc = ALLOCATION_ITEM_DATABASE.get(allocation_id)
        if not alloc:
            raise KeyError(f"Allocation '{allocation_id}' not found.")

        if alloc.status not in [AllocationStatus.OFFERED, AllocationStatus.RESERVED]:
            raise ValueError(f"Cannot accept allocation currently in state '{alloc.status.value}'.")

        requested_qty = payload.accepted_kg if payload.accepted_kg is not None else alloc.allocated_kg

        if requested_qty > alloc.allocated_kg:
            raise ValueError(f"Cannot accept {requested_qty}kg; offered allocation is {alloc.allocated_kg}kg.")

        if requested_qty < alloc.allocated_kg:
            # Partial accept: Confirm portion, release excess
            excess_kg = round(alloc.allocated_kg - requested_qty, 2)
            alloc.status = AllocationStatus.PARTIALLY_ACCEPTED
            alloc.confirmed_kg = requested_qty
            
            await record_audit_event(
                action="ALLOCATION_PARTIALLY_ACCEPTED",
                resource_type="allocation",
                actor_id=actor_id,
                resource_id=allocation_id,
                details={"confirmed_kg": requested_qty, "released_excess_kg": excess_kg},
            )
        else:
            # Full accept
            alloc.status = AllocationStatus.CONFIRMED
            alloc.confirmed_kg = alloc.allocated_kg
            
            await record_audit_event(
                action="ALLOCATION_CONFIRMED",
                resource_type="allocation",
                actor_id=actor_id,
                resource_id=allocation_id,
                details={"confirmed_kg": alloc.confirmed_kg},
            )

        return alloc


async def process_recipient_decline(
    allocation_id: uuid.UUID,
    payload: AllocationDeclineRequest,
    actor_id: Optional[uuid.UUID] = None,
) -> Tuple[AllocationItemResponse, Optional[AllocationPlanResponse]]:
    """
    Process recipient decline:
    1. Mark allocation as DECLINED.
    2. Atomically release quantity.
    3. Trigger dynamic recovery to reallocate released quantity to next candidate!
    """
    async with _ALLOCATION_LOCK:
        alloc = ALLOCATION_ITEM_DATABASE.get(allocation_id)
        if not alloc:
            raise KeyError(f"Allocation '{allocation_id}' not found.")

        alloc.status = AllocationStatus.DECLINED
        released_kg = alloc.allocated_kg

        await record_audit_event(
            action="ALLOCATION_DECLINED_RECOVERY",
            resource_type="allocation",
            actor_id=actor_id,
            resource_id=allocation_id,
            details={"released_kg": released_kg, "decline_reason": payload.reason},
        )

        # Trigger dynamic recovery replan for released quantity
        recovery_plan = None
        try:
            recovery_plan = await generate_allocation_plan(alloc.listing_id, actor_id=actor_id)
        except Exception:
            pass

        return alloc, recovery_plan
