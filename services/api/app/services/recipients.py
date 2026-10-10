import uuid
from typing import Dict, List, Optional, Tuple
from datetime import datetime, timezone, timedelta
from app.schemas.recipients import (
    RecipientCapacityCreate,
    RecipientCapacityResponse,
    StorageCapability,
    DietaryPreference,
)
from app.services.audit import record_audit_event

STALE_DEMAND_THRESHOLD_HOURS = 24.0

# In-memory capacity snapshot repository
CAPACITY_SNAPSHOT_DATABASE: Dict[uuid.UUID, RecipientCapacityResponse] = {}

# Seed initial capacity snapshots for synthetic demo organizations
def _initialize_seed_snapshots():
    now = datetime.now(timezone.utc)
    
    # 1. Shanti Ashram: 45 meals needed, refrigerated storage, pure veg
    ashram_id = uuid.UUID("a0000000-0000-0000-0000-000000000001")
    CAPACITY_SNAPSHOT_DATABASE[ashram_id] = RecipientCapacityResponse(
        id=uuid.uuid4(),
        recipient_id=ashram_id,
        people_served=45,
        meals_needed=45,
        existing_meals_available=0,
        net_meal_deficit=45,
        storage_capability=StorageCapability.REFRIGERATED,
        max_storage_kg=40.0,
        dietary_preferences=[DietaryPreference.PURE_VEG],
        can_collect_directly=True,
        snapshot_at=now,
        is_stale=False,
        is_reviewed=True,
    )

    # 2. Hope Child Shelter: 30 meals needed, dry storage only
    hope_id = uuid.UUID("a0000000-0000-0000-0000-000000000002")
    CAPACITY_SNAPSHOT_DATABASE[hope_id] = RecipientCapacityResponse(
        id=uuid.uuid4(),
        recipient_id=hope_id,
        people_served=30,
        meals_needed=30,
        existing_meals_available=5,
        net_meal_deficit=25,
        storage_capability=StorageCapability.DRY_ONLY,
        max_storage_kg=25.0,
        dietary_preferences=[DietaryPreference.STANDARD],
        can_collect_directly=False,
        snapshot_at=now,
        is_stale=False,
        is_reviewed=True,
    )

_initialize_seed_snapshots()


async def save_recipient_capacity(
    data: RecipientCapacityCreate,
    is_reviewed: bool = False,
    actor_id: Optional[uuid.UUID] = None,
) -> RecipientCapacityResponse:
    """Save or refresh a timestamped capacity snapshot for a recipient shelter."""
    snapshot = RecipientCapacityResponse.from_input(data, is_reviewed=is_reviewed)
    CAPACITY_SNAPSHOT_DATABASE[data.recipient_id] = snapshot

    await record_audit_event(
        action="CAPACITY_SNAPSHOT_SAVED",
        resource_type="recipient_capacity",
        actor_id=actor_id,
        resource_id=snapshot.id,
        details={
            "recipient_id": str(data.recipient_id),
            "people_served": data.people_served,
            "meals_needed": data.meals_needed,
            "net_meal_deficit": snapshot.net_meal_deficit,
            "storage_capability": data.storage_capability.value,
        },
    )

    return snapshot


def get_recipient_capacity(recipient_id: uuid.UUID) -> Optional[RecipientCapacityResponse]:
    """Retrieve capacity snapshot for a specific recipient, updating staleness status."""
    snapshot = CAPACITY_SNAPSHOT_DATABASE.get(recipient_id)
    if not snapshot:
        return None

    now = datetime.now(timezone.utc)
    elapsed_hours = (now - snapshot.snapshot_at).total_seconds() / 3600.0
    snapshot.is_stale = elapsed_hours > STALE_DEMAND_THRESHOLD_HOURS
    return snapshot


def get_all_capacity_snapshots(include_stale: bool = False) -> List[RecipientCapacityResponse]:
    """Return all active snapshots. Excludes stale demand by default."""
    now = datetime.now(timezone.utc)
    results = []
    for snapshot in CAPACITY_SNAPSHOT_DATABASE.values():
        elapsed_hours = (now - snapshot.snapshot_at).total_seconds() / 3600.0
        snapshot.is_stale = elapsed_hours > STALE_DEMAND_THRESHOLD_HOURS
        if include_stale or not snapshot.is_stale:
            results.append(snapshot)
    return results


def check_recipient_compatibility(
    recipient_id: uuid.UUID,
    allocated_kg: float,
    is_veg: bool = True,
) -> Tuple[bool, str]:
    """
    Deterministic rule check verifying:
    1. Recipient demand is not stale.
    2. Allocated kilograms do not exceed recipient safe storage capacity.
    3. Dietary preferences are respected.
    """
    snapshot = get_recipient_capacity(recipient_id)
    if not snapshot:
        return False, "Recipient capacity snapshot not found."

    if snapshot.is_stale:
        return False, "Recipient demand data is stale (>24h). Cannot allocate until refreshed."

    if allocated_kg > snapshot.max_storage_kg:
        return False, (
            f"Over-capacity: Requested {allocated_kg:.1f}kg exceeds safe storage limit of {snapshot.max_storage_kg:.1f}kg."
        )

    # Dietary restriction check
    if not is_veg and DietaryPreference.PURE_VEG in snapshot.dietary_preferences:
        return False, "Incompatible: Recipient has strict pure_veg requirement."

    return True, "Compatible"
