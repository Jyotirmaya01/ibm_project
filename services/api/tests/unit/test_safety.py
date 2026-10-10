import pytest
from datetime import datetime, timezone, timedelta
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.schemas.safety import EvidenceReviewStatus


@pytest.mark.asyncio
async def test_fresh_food_with_photo_eligible():
    """Food within safe holding window with photo evidence evaluates as ELIGIBLE_UNDER_RULES."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        headers = {"Authorization": "Bearer mock-token-donor"}
        now = datetime.now(timezone.utc)
        
        # Create draft listing prepared 30 mins ago, pickup within 2 hours
        draft_res = await client.post(
            "/v1/listings",
            json={
                "title": "Fresh Dal & Rice",
                "pickup_window_start": (now + timedelta(hours=1)).isoformat(),
                "pickup_window_end": (now + timedelta(hours=2)).isoformat(),
                "latitude": 12.97,
                "longitude": 77.59,
                "approx_area_name": "Indiranagar",
                "items": [
                    {
                        "name": "Yellow Dal",
                        "food_type": "cooked_curry",
                        "quantity_value": 20.0,
                        "preparation_time": (now - timedelta(minutes=30)).isoformat(),
                        "storage_condition": "room_temperature",
                        "handling_history": "Transferred to clean stainless containers immediately after boiling.",
                    }
                ],
            },
            headers=headers,
        )
        assert draft_res.status_code == 201
        listing_id = draft_res.json()["id"]

        # Attach photo
        await client.post(
            f"/v1/listings/{listing_id}/photos",
            json={"storage_path": f"private/{listing_id}/dish.jpg", "photo_type": "overhead_dish"},
            headers=headers,
        )

        # Assess safety
        assess_res = await client.post(f"/v1/listings/{listing_id}/assess", headers=headers)
        assert assess_res.status_code == 200
        assessment = assess_res.json()
        assert assessment["status"] == "ELIGIBLE_UNDER_RULES"
        assert "limitations_disclaimer" in assessment


@pytest.mark.asyncio
async def test_perishable_food_exceeding_ambient_limit_held():
    """Perishable food exceeding 4 hours ambient duration triggers ON_HOLD with risk indicator."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        headers = {"Authorization": "Bearer mock-token-donor"}
        now = datetime.now(timezone.utc)
        
        # Prepared 5 hours ago, at room temperature
        draft_res = await client.post(
            "/v1/listings",
            json={
                "title": "Stale Cooked Rice",
                "pickup_window_start": (now + timedelta(hours=1)).isoformat(),
                "pickup_window_end": (now + timedelta(hours=2)).isoformat(),
                "latitude": 12.97,
                "longitude": 77.59,
                "approx_area_name": "MG Road",
                "items": [
                    {
                        "name": "Cooked Rice",
                        "food_type": "cooked_rice",
                        "quantity_value": 15.0,
                        "preparation_time": (now - timedelta(hours=5)).isoformat(),
                        "storage_condition": "room_temperature",
                    }
                ],
            },
            headers=headers,
        )
        listing_id = draft_res.json()["id"]

        # Attach photo
        await client.post(
            f"/v1/listings/{listing_id}/photos",
            json={"storage_path": f"private/{listing_id}/dish.jpg", "photo_type": "overhead_dish"},
            headers=headers,
        )

        # Assess
        assess_res = await client.post(f"/v1/listings/{listing_id}/assess", headers=headers)
        assert assess_res.status_code == 200
        assessment = assess_res.json()
        assert assessment["status"] == "ON_HOLD"
        assert any("ambient_holding_exceeded" in r for r in assessment["risk_indicators"])


@pytest.mark.asyncio
async def test_reviewer_queue_and_authorized_clearance():
    """Safety Reviewer can inspect review queue and clear a hold with recorded findings."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        donor_headers = {"Authorization": "Bearer mock-token-donor"}
        reviewer_headers = {"Authorization": "Bearer mock-token-safety_reviewer"}
        now = datetime.now(timezone.utc)

        # 1. Create a listing that goes on hold
        draft_res = await client.post(
            "/v1/listings",
            json={
                "title": "Held Buffet Stew",
                "pickup_window_start": (now + timedelta(hours=1)).isoformat(),
                "pickup_window_end": (now + timedelta(hours=2)).isoformat(),
                "latitude": 12.97,
                "longitude": 77.59,
                "approx_area_name": "Whitefield",
                "items": [
                    {
                        "name": "Paneer Stew",
                        "food_type": "cooked_curry",
                        "quantity_value": 10.0,
                        "preparation_time": (now - timedelta(hours=5)).isoformat(),
                        "storage_condition": "room_temperature",
                    }
                ],
            },
            headers=donor_headers,
        )
        listing_id = draft_res.json()["id"]
        await client.post(
            f"/v1/listings/{listing_id}/photos",
            json={"storage_path": f"private/{listing_id}/stew.jpg", "photo_type": "overhead_dish"},
            headers=donor_headers,
        )
        assess_res = await client.post(f"/v1/listings/{listing_id}/assess", headers=donor_headers)
        assessment_id = assess_res.json()["id"]

        # 2. Reviewer inspects queue
        queue_res = await client.get("/v1/safety/review-queue", headers=reviewer_headers)
        assert queue_res.status_code == 200
        queue = queue_res.json()
        assert len(queue) > 0

        # 3. Donor cannot clear review (403)
        fail_res = await client.post(
            f"/v1/safety/reviews/{assessment_id}/decide",
            json={"decision": "ELIGIBLE_UNDER_RULES", "notes": "Donor clearing self."},
            headers=donor_headers,
        )
        assert fail_res.status_code == 403

        # 4. Reviewer clears review
        clear_res = await client.post(
            f"/v1/safety/reviews/{assessment_id}/decide",
            json={
                "decision": "ELIGIBLE_UNDER_RULES",
                "notes": "Verified verified thermal reheat above 75C before packing. Approved for rapid distribution.",
            },
            headers=reviewer_headers,
        )
        assert clear_res.status_code == 200
        assert clear_res.json()["status"] == "ELIGIBLE_UNDER_RULES"
        assert "Verified verified thermal reheat" in clear_res.json()["reviewer_notes"]
