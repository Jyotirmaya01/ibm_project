import pytest
import uuid
from datetime import datetime, timezone, timedelta
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.schemas.recipients import RecipientCapacityCreate, StorageCapability, DietaryPreference
from app.services.recipients import (
    save_recipient_capacity,
    get_recipient_capacity,
    check_recipient_compatibility,
    CAPACITY_SNAPSHOT_DATABASE,
)


@pytest.mark.asyncio
async def test_submit_capacity_snapshot_and_net_deficit():
    """Verify capacity snapshot calculates net meal deficit correctly."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        headers = {"Authorization": "Bearer mock-token-recipient"}
        recipient_id = uuid.uuid4()
        
        payload = {
            "recipient_id": str(recipient_id),
            "people_served": 50,
            "meals_needed": 50,
            "existing_meals_available": 10,
            "storage_capability": "refrigerated",
            "max_storage_kg": 45.0,
            "dietary_preferences": ["pure_veg"],
            "can_collect_directly": True,
        }

        response = await client.post("/v1/recipients/capacity", json=payload, headers=headers)
        assert response.status_code == 201
        data = response.json()
        assert data["people_served"] == 50
        assert data["meals_needed"] == 50
        assert data["existing_meals_available"] == 10
        # 50 needed - 10 available = 40 net deficit
        assert data["net_meal_deficit"] == 40
        assert data["is_stale"] is False


@pytest.mark.asyncio
async def test_stale_demand_detection():
    """Demand older than 24 hours is automatically flagged as stale."""
    recipient_id = uuid.uuid4()
    old_time = datetime.now(timezone.utc) - timedelta(hours=25)
    
    # Save snapshot manually with older timestamp
    snapshot_res = await save_recipient_capacity(
        RecipientCapacityCreate(
            recipient_id=recipient_id,
            people_served=20,
            meals_needed=20,
            existing_meals_available=0,
            storage_capability=StorageCapability.DRY_ONLY,
            max_storage_kg=15.0,
            dietary_preferences=[DietaryPreference.STANDARD],
        )
    )
    # Simulate aging past threshold
    snapshot_res.snapshot_at = old_time
    CAPACITY_SNAPSHOT_DATABASE[recipient_id] = snapshot_res

    # Check capacity retrieval
    retrieved = get_recipient_capacity(recipient_id)
    assert retrieved is not None
    assert retrieved.is_stale is True

    # Compatibility check must block stale demand
    compatible, reason = check_recipient_compatibility(recipient_id, allocated_kg=10.0)
    assert compatible is False
    assert "stale" in reason.lower()


@pytest.mark.asyncio
async def test_storage_and_dietary_compatibility():
    """Verify that safe storage limits and dietary restrictions are enforced."""
    ashram_id = uuid.UUID("a0000000-0000-0000-0000-000000000001") # Seed ashram: 40kg max, pure_veg
    
    # 1. Safe quantity within 40kg, pure veg -> Compatible
    ok, _ = check_recipient_compatibility(ashram_id, allocated_kg=25.0, is_veg=True)
    assert ok is True

    # 2. Exceeding max storage (e.g. 60kg > 40kg) -> Over-capacity blocked
    over_capacity, reason = check_recipient_compatibility(ashram_id, allocated_kg=60.0, is_veg=True)
    assert over_capacity is False
    assert "Over-capacity" in reason

    # 3. Non-veg food to pure_veg ashram -> Incompatible blocked
    incompatible_diet, diet_reason = check_recipient_compatibility(ashram_id, allocated_kg=15.0, is_veg=False)
    assert incompatible_diet is False
    assert "pure_veg" in diet_reason
