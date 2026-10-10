import pytest
from datetime import datetime, timezone, timedelta
from httpx import AsyncClient, ASGITransport
from app.main import app


@pytest.mark.asyncio
async def test_create_draft_listing():
    """Donor can create a draft listing."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        headers = {"Authorization": "Bearer mock-token-donor"}
        now = datetime.now(timezone.utc)
        payload = {
            "title": "Wedding Reception Surplus Rice & Dal",
            "description": "Clean, untouched surplus from wedding feast held in banquet hall.",
            "pickup_window_start": (now + timedelta(hours=1)).isoformat(),
            "pickup_window_end": (now + timedelta(hours=4)).isoformat(),
            "latitude": 12.9716,
            "longitude": 77.5946,
            "approx_area_name": "Indiranagar, Bengaluru",
            "items": [
                {
                    "name": "Steamed Basmati Rice",
                    "food_type": "cooked_rice",
                    "quantity_value": 30.0,
                    "quantity_unit": "kg",
                    "preparation_time": now.isoformat(),
                    "storage_condition": "hot_held",
                    "is_perishable": True,
                }
            ],
        }
        response = await client.post("/v1/listings", json=payload, headers=headers)
        assert response.status_code == 201
        data = response.json()
        assert data["title"] == payload["title"]
        assert data["status"] == "DRAFT"
        assert len(data["items"]) == 1
        assert data["items"][0]["quantity_value"] == 30.0


@pytest.mark.asyncio
async def test_publish_without_photo_blocked():
    """Attempting to publish a listing without compulsory photos is strictly blocked."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        headers = {"Authorization": "Bearer mock-token-donor"}
        now = datetime.now(timezone.utc)
        # Create draft
        draft_res = await client.post(
            "/v1/listings",
            json={
                "title": "Photo-less Rice Listing",
                "pickup_window_start": (now + timedelta(hours=1)).isoformat(),
                "pickup_window_end": (now + timedelta(hours=3)).isoformat(),
                "latitude": 12.97,
                "longitude": 77.59,
                "approx_area_name": "Koramangala, Bengaluru",
                "items": [
                    {
                        "name": "Rice",
                        "food_type": "cooked_rice",
                        "quantity_value": 15.0,
                        "preparation_time": now.isoformat(),
                    }
                ],
            },
            headers=headers,
        )
        assert draft_res.status_code == 201
        listing_id = draft_res.json()["id"]

        # Try to publish directly without photos
        publish_res = await client.post(f"/v1/listings/{listing_id}/publish", headers=headers)
        assert publish_res.status_code == 400
        assert "Compulsory food photo is missing" in publish_res.json()["detail"]


@pytest.mark.asyncio
async def test_publish_with_compulsory_photo_succeeds():
    """Uploading photo evidence allows publication and advances state to SUBMITTED."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        headers = {"Authorization": "Bearer mock-token-donor"}
        now = datetime.now(timezone.utc)
        # 1. Create draft
        draft_res = await client.post(
            "/v1/listings",
            json={
                "title": "Bhandara Khichdi & Kheer",
                "pickup_window_start": (now + timedelta(hours=1)).isoformat(),
                "pickup_window_end": (now + timedelta(hours=5)).isoformat(),
                "latitude": 12.98,
                "longitude": 77.60,
                "approx_area_name": "Malleshwaram, Bengaluru",
                "items": [
                    {
                        "name": "Vegetable Khichdi",
                        "food_type": "cooked_rice",
                        "quantity_value": 25.0,
                        "preparation_time": now.isoformat(),
                    }
                ],
            },
            headers=headers,
        )
        listing_id = draft_res.json()["id"]

        # 2. Attach compulsory photo
        photo_res = await client.post(
            f"/v1/listings/{listing_id}/photos",
            json={
                "storage_path": f"private/listings/{listing_id}/overhead_dish.jpg",
                "photo_type": "overhead_dish",
            },
            headers=headers,
        )
        assert photo_res.status_code == 201
        assert "storage_path" in photo_res.json()

        # 3. Publish now succeeds
        publish_res = await client.post(f"/v1/listings/{listing_id}/publish", headers=headers)
        assert publish_res.status_code == 200
        assert publish_res.json()["status"] == "SUBMITTED"


@pytest.mark.asyncio
async def test_invalid_state_transition_rejected():
    """Attempting an invalid state transition is rejected."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        headers = {"Authorization": "Bearer mock-token-donor"}
        now = datetime.now(timezone.utc)
        draft_res = await client.post(
            "/v1/listings",
            json={
                "title": "Test Listing",
                "pickup_window_start": (now + timedelta(hours=1)).isoformat(),
                "pickup_window_end": (now + timedelta(hours=2)).isoformat(),
                "latitude": 12.95,
                "longitude": 77.55,
                "approx_area_name": "Jayanagar",
                "items": [],
            },
            headers=headers,
        )
        listing_id = draft_res.json()["id"]

        # Attempt to jump DRAFT -> COMPLETED
        jump_res = await client.patch(
            f"/v1/listings/{listing_id}/status?target_status=COMPLETED",
            headers=headers,
        )
        assert jump_res.status_code == 400
        assert "Invalid transition" in jump_res.json()["detail"]
