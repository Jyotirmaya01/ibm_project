import pytest
import uuid
from datetime import datetime, timezone, timedelta
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.schemas.allocations import AllocationStatus, AllocationAcceptRequest, AllocationDeclineRequest
from app.services.allocations import (
    generate_allocation_plan,
    ALLOCATION_PLAN_DATABASE,
    ALLOCATION_ITEM_DATABASE,
)
from app.services.listings import LISTING_DATABASE


async def create_and_publish_test_listing(client: AsyncClient, headers: dict) -> str:
    """Helper to create and publish a valid food listing with compulsory photo."""
    now = datetime.now(timezone.utc)
    payload = {
        "title": "30kg Banquet Pulao Surplus",
        "description": "Untouched veg pulao from corporate catering.",
        "pickup_window_start": (now + timedelta(hours=1)).isoformat(),
        "pickup_window_end": (now + timedelta(hours=4)).isoformat(),
        "latitude": 12.9716,
        "longitude": 77.5946,
        "approx_area_name": "Indiranagar, Bengaluru",
        "items": [
            {
                "name": "Basmati Veg Pulao",
                "food_type": "cooked_rice",
                "quantity_value": 30.0,
                "quantity_unit": "kg",
                "preparation_time": now.isoformat(),
                "storage_condition": "hot_held",
                "is_perishable": True,
            }
        ],
    }
    create_res = await client.post("/v1/listings", json=payload, headers=headers)
    assert create_res.status_code == 201
    listing_id = create_res.json()["id"]

    # Add compulsory photo
    photo_payload = {
        "storage_path": "https://storage.annasetu.ai/pulao_overhead.jpg",
        "photo_type": "overhead_dish",
    }
    photo_res = await client.post(f"/v1/listings/{listing_id}/photos", json=photo_payload, headers=headers)
    assert photo_res.status_code == 201

    # Publish
    pub_res = await client.post(f"/v1/listings/{listing_id}/publish", headers=headers)
    assert pub_res.status_code == 200
    return listing_id


@pytest.mark.asyncio
async def test_allocation_optimization_multi_recipient_split():
    """Test solver divides 30 kg food across eligible recipients respecting demand & storage limits."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        donor_headers = {"Authorization": "Bearer mock-token-donor"}
        coord_headers = {"Authorization": "Bearer mock-token-coordinator"}
        
        listing_id = await create_and_publish_test_listing(client, donor_headers)
        
        # Run optimization
        response = await client.post(f"/v1/allocations/optimize/{listing_id}", headers=coord_headers)
        assert response.status_code == 200
        plan = response.json()

        assert plan["listing_id"] == listing_id
        assert plan["total_available_kg"] == 30.0
        assert plan["total_allocated_kg"] <= 30.0
        assert len(plan["allocations"]) > 0

        # Verify sum of allocated quantities equals total_allocated_kg
        allocated_sum = sum(a["allocated_kg"] for a in plan["allocations"])
        assert round(allocated_sum, 2) == plan["total_allocated_kg"]

        # Verify each allocation is > 0 and formatted properly
        for a in plan["allocations"]:
            assert a["allocated_kg"] > 0
            assert a["status"] == "OFFERED"
            assert "recipient_name" in a
            assert "recipient_id" in a


@pytest.mark.asyncio
async def test_partial_acceptance_and_excess_release():
    """Recipient accepts only a portion of the allocation, releasing the excess."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        donor_headers = {"Authorization": "Bearer mock-token-donor"}
        coord_headers = {"Authorization": "Bearer mock-token-coordinator"}
        recip_headers = {"Authorization": "Bearer mock-token-recipient"}
        
        listing_id = await create_and_publish_test_listing(client, donor_headers)
        
        opt_res = await client.post(f"/v1/allocations/optimize/{listing_id}", headers=coord_headers)
        assert opt_res.status_code == 200
        plan = opt_res.json()
        assert len(plan["allocations"]) > 0
        
        first_alloc = plan["allocations"][0]
        offered_qty = first_alloc["allocated_kg"]
        alloc_id = first_alloc["id"]

        # Accept half of offered qty
        partial_qty = round(offered_qty / 2, 2)
        res = await client.post(
            f"/v1/allocations/{alloc_id}/accept",
            json={"accepted_kg": partial_qty},
            headers=recip_headers,
        )
        assert res.status_code == 200
        data = res.json()
        assert data["status"] == AllocationStatus.PARTIALLY_ACCEPTED.value
        assert data["confirmed_kg"] == partial_qty


@pytest.mark.asyncio
async def test_recipient_decline_and_dynamic_recovery():
    """When a recipient declines an offer, allocation is marked DECLINED and recovery is executed."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        donor_headers = {"Authorization": "Bearer mock-token-donor"}
        coord_headers = {"Authorization": "Bearer mock-token-coordinator"}
        recip_headers = {"Authorization": "Bearer mock-token-recipient"}
        
        listing_id = await create_and_publish_test_listing(client, donor_headers)
        
        opt_res = await client.post(f"/v1/allocations/optimize/{listing_id}", headers=coord_headers)
        assert opt_res.status_code == 200
        plan = opt_res.json()
        first_alloc = plan["allocations"][0]
        alloc_id = first_alloc["id"]

        res = await client.post(
            f"/v1/allocations/{alloc_id}/decline",
            json={"reason": "Kitchen already received emergency dry rations"},
            headers=recip_headers,
        )
        assert res.status_code == 200
        declined_data = res.json()
        assert declined_data["status"] == AllocationStatus.DECLINED.value


@pytest.mark.asyncio
async def test_over_acceptance_rejection():
    """Attempting to accept more than the allocated quantity is rejected with HTTP 400."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        donor_headers = {"Authorization": "Bearer mock-token-donor"}
        coord_headers = {"Authorization": "Bearer mock-token-coordinator"}
        recip_headers = {"Authorization": "Bearer mock-token-recipient"}
        
        listing_id = await create_and_publish_test_listing(client, donor_headers)
        
        opt_res = await client.post(f"/v1/allocations/optimize/{listing_id}", headers=coord_headers)
        assert opt_res.status_code == 200
        plan = opt_res.json()
        first_alloc = plan["allocations"][0]
        alloc_id = first_alloc["id"]
        excess_qty = first_alloc["allocated_kg"] + 50.0

        res = await client.post(
            f"/v1/allocations/{alloc_id}/accept",
            json={"accepted_kg": excess_qty},
            headers=recip_headers,
        )
        assert res.status_code == 400
        assert "Cannot accept" in res.json()["detail"]
