import pytest
import uuid
from datetime import datetime, timezone, timedelta
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.agent.state import MissionStage


async def create_listing_helper(
    client: AsyncClient,
    headers: dict,
    prep_hours_ago: float = 1.0,
    storage: str = "room_temperature",
    add_photo: bool = True,
) -> str:
    """Helper to create and configure a listing with precise food parameters."""
    now = datetime.now(timezone.utc)
    prep_time = now - timedelta(hours=prep_hours_ago)
    
    payload = {
        "title": f"Surplus Meal ({storage})",
        "description": "Prepared catering food.",
        "pickup_window_start": (now + timedelta(hours=1)).isoformat(),
        "pickup_window_end": (now + timedelta(hours=3)).isoformat(),
        "latitude": 12.9716,
        "longitude": 77.5946,
        "approx_area_name": "Indiranagar, Bengaluru",
        "items": [
            {
                "name": "Vegetable Pulao",
                "food_type": "cooked_rice",
                "quantity_value": 25.0,
                "quantity_unit": "kg",
                "preparation_time": prep_time.isoformat(),
                "storage_condition": storage,
                "is_perishable": True,
            }
        ],
    }
    res = await client.post("/v1/listings", json=payload, headers=headers)
    assert res.status_code == 201
    listing_id = res.json()["id"]

    if add_photo:
        photo_payload = {
            "storage_path": "https://storage.annasetu.ai/pulao.jpg",
            "photo_type": "overhead_dish",
        }
        p_res = await client.post(f"/v1/listings/{listing_id}/photos", json=photo_payload, headers=headers)
        assert p_res.status_code == 201
        
        pub_res = await client.post(f"/v1/listings/{listing_id}/publish", headers=headers)
        assert pub_res.status_code == 200

    return listing_id


@pytest.mark.asyncio
async def test_agent_mission_end_to_end_success():
    """Valid fresh listing executes through LangGraph nodes to COMPLETED."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        headers = {"Authorization": "Bearer mock-token-coordinator"}
        donor_headers = {"Authorization": "Bearer mock-token-donor"}
        
        listing_id = await create_listing_helper(client, donor_headers, prep_hours_ago=0.5, storage="hot_held", add_photo=True)
        
        # Trigger agent workflow
        res = await client.post(f"/v1/agent/missions/start/{listing_id}", headers=headers)
        assert res.status_code == 200
        data = res.json()
        
        assert data["stage"] == MissionStage.COMPLETED.value
        assert data["safety_cleared"] is True
        assert data["allocated_kg"] > 0
        assert data["allocation_plan_id"] is not None
        assert len(data["allocations"]) > 0
        assert len(data["audit_trail"]) >= 4  # intake, safety, demand, optimization, outreach, coordination


@pytest.mark.asyncio
async def test_agent_mission_safety_hold_halts_at_checkpoint():
    """Unsafe food (ambient perishable > 4 hours) is intercepted by LangGraph and halted at HUMAN_CHECKPOINT."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        headers = {"Authorization": "Bearer mock-token-coordinator"}
        donor_headers = {"Authorization": "Bearer mock-token-donor"}
        
        # 5 hours elapsed prep at room temperature
        listing_id = await create_listing_helper(client, donor_headers, prep_hours_ago=5.0, storage="room_temperature", add_photo=True)
        
        # Trigger agent workflow
        res = await client.post(f"/v1/agent/missions/start/{listing_id}", headers=headers)
        assert res.status_code == 200
        data = res.json()
        
        # Workflow must halt at human checkpoint
        assert data["stage"] == MissionStage.HUMAN_CHECKPOINT.value
        assert data["requires_human_review"] is True
        assert data["safety_cleared"] is False
        assert "FSSAI" in data["human_checkpoint_reason"]
        # Never allocate food when held!
        assert data["allocated_kg"] == 0.0


@pytest.mark.asyncio
async def test_agent_mission_resume_from_human_checkpoint():
    """Supervisor can override a held checkpoint and resume workflow through completion."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        headers = {"Authorization": "Bearer mock-token-coordinator"}
        donor_headers = {"Authorization": "Bearer mock-token-donor"}
        
        listing_id = await create_listing_helper(client, donor_headers, prep_hours_ago=5.0, storage="room_temperature", add_photo=True)
        
        # Start mission (enters checkpoint)
        start_res = await client.post(f"/v1/agent/missions/start/{listing_id}", headers=headers)
        mission_id = start_res.json()["mission_id"]
        assert start_res.json()["stage"] == MissionStage.HUMAN_CHECKPOINT.value
        
        # Supervisor review & resume
        resume_res = await client.post(
            f"/v1/agent/missions/{mission_id}/resume",
            json={"notes": "Cleared after thermal probe confirmed core temp > 65C."},
            headers=headers,
        )
        assert resume_res.status_code == 200
        resumed_data = resume_res.json()
        
        assert resumed_data["stage"] == MissionStage.COMPLETED.value
        assert resumed_data["human_review_resolved"] is True
        assert resumed_data["allocated_kg"] > 0
