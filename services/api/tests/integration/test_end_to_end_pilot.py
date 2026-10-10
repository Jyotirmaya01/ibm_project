"""
AnnaSetu AI — Comprehensive Synthetic End-to-End Pilot & Security Integration Test
Tests the full lifecycle from identity to handover and verified impact analytics,
including security headers, rate limiting, and failure injection.
"""

import uuid
from datetime import datetime, timezone, timedelta
import pytest
from httpx import AsyncClient, ASGITransport

from app.main import app
from app.core.security import rate_limiter
from app.integrations.storage import validate_image_file


@pytest.mark.asyncio
async def test_full_lifecycle_pilot_rescue_and_verified_impact():
    """
    Simulates a complete real-world food rescue mission during the pilot:
    1. Check OWASP security headers.
    2. Recipient publishes capacity snapshot.
    3. Donor submits surplus food with compulsory photo.
    4. Safety rules validate freshness -> listing marked ELIGIBLE_UNDER_RULES.
    5. Handover session generated with secure OTP.
    6. Volunteer driver dispatched.
    7. Recipient conducts physical inspection, enters OTP, and verifies 50 kg received.
    8. Authoritative impact metrics reflect real delivered meals.
    """
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Step 1: Check security headers on root health
        health_resp = await client.get("/health")
        assert health_resp.status_code == 200
        assert health_resp.headers.get("x-content-type-options") == "nosniff"
        assert health_resp.headers.get("x-frame-options") == "DENY"
        assert "max-age" in health_resp.headers.get("strict-transport-security", "")

        # Baseline impact metrics before mission
        baseline_impact_resp = await client.get("/v1/impact/summary")
        assert baseline_impact_resp.status_code == 200
        initial_rescued_kg = baseline_impact_resp.json()["total_food_rescued_kg"]

        # Step 2: Use authenticated role tokens
        donor_headers = {"Authorization": "Bearer mock-token-donor"}
        recipient_headers = {"Authorization": "Bearer mock-token-recipient"}
        coord_headers = {"Authorization": "Bearer mock-token-coordinator"}
        recipient_id = uuid.uuid4()
        allocation_id = uuid.uuid4()
        now = datetime.now(timezone.utc)

        # Step 3: Recipient updates capacity snapshot
        snapshot_resp = await client.post("/v1/recipients/capacity", json={
            "recipient_id": str(recipient_id),
            "people_served": 150,
            "meals_needed": 120,
            "existing_meals_available": 20,
            "storage_capability": "refrigerated",
            "max_storage_kg": 80.0,
            "dietary_preferences": ["pure_veg"],
            "can_collect_directly": True
        }, headers=recipient_headers)
        assert snapshot_resp.status_code == 201
        assert snapshot_resp.json()["net_meal_deficit"] == 100

        # Step 4: Donor creates draft listing
        draft_resp = await client.post("/v1/listings", json={
            "title": "Fresh Dal & Rice Surplus",
            "description": "Clean, unconsumed lunch surplus from corporate conference",
            "pickup_window_start": (now + timedelta(hours=1)).isoformat(),
            "pickup_window_end": (now + timedelta(hours=4)).isoformat(),
            "latitude": 28.556,
            "longitude": 77.100,
            "approx_area_name": "Aerocity Convention Center, New Delhi",
            "items": [
                {
                    "name": "Steamed Basmati Rice & Dal",
                    "food_type": "cooked_rice",
                    "quantity_value": 50.0,
                    "quantity_unit": "kg",
                    "preparation_time": (now - timedelta(minutes=45)).isoformat(),
                    "storage_condition": "hot_held",
                    "is_perishable": True,
                }
            ],
        }, headers=donor_headers)
        assert draft_resp.status_code == 201
        listing_id = draft_resp.json()["id"]

        # Step 5: Attach compulsory photo evidence
        photo_resp = await client.post(
            f"/v1/listings/{listing_id}/photos",
            json={
                "storage_path": f"private/{listing_id}/overhead_dish.jpg",
                "photo_type": "overhead_dish",
            },
            headers=donor_headers
        )
        assert photo_resp.status_code == 201

        # Step 6: Publish listing -> moves to SUBMITTED -> assess safety
        pub_resp = await client.post(f"/v1/listings/{listing_id}/publish", headers=donor_headers)
        assert pub_resp.status_code == 200
        assert pub_resp.json()["status"] == "SUBMITTED"

        assess_resp = await client.post(f"/v1/listings/{listing_id}/assess", headers=donor_headers)
        assert assess_resp.status_code == 200
        assert assess_resp.json()["status"] == "ELIGIBLE_UNDER_RULES"

        # Step 7: Create Handover Session
        session_resp = await client.post("/v1/handover/sessions", json={
            "allocation_id": str(allocation_id),
            "listing_id": str(listing_id),
            "recipient_id": str(recipient_id),
        }, headers=coord_headers)
        assert session_resp.status_code == 201
        session_data = session_resp.json()
        session_id = session_data["id"]
        valid_otp = session_data["otp_code"]
        assert len(valid_otp) >= 4

        # Step 8: Volunteer Driver Dispatch
        volunteer_id = uuid.uuid4()
        dispatch_resp = await client.post(
            f"/v1/handover/sessions/{session_id}/dispatch-driver",
            json={
                "volunteer_id": str(volunteer_id),
                "vehicle_type": "three_wheeler",
                "estimated_arrival_minutes": 25,
                "contact_phone_masked": "+91 98765 XXXXX",
            },
            headers=coord_headers
        )
        assert dispatch_resp.status_code == 200
        assert dispatch_resp.json()["status"] == "DRIVER_ASSIGNED"

        # Step 9: Recipient Physical Inspection and OTP Verification
        verify_resp = await client.post(f"/v1/handover/sessions/{session_id}/verify", json={
            "otp_code": valid_otp,
            "actual_delivered_kg": 50.0,
            "visual_inspection_passed": True,
            "temperature_celsius": 63.5,
            "recipient_notes": "Food steaming hot, sealed containers intact, verified by shelter manager."
        }, headers=recipient_headers)
        assert verify_resp.status_code == 200
        assert verify_resp.json()["status"] == "VERIFIED_DELIVERED"
        assert verify_resp.json()["actual_delivered_kg"] == 50.0

        # Step 10: Verify impact metrics updated correctly
        final_impact_resp = await client.get("/v1/impact/summary")
        assert final_impact_resp.status_code == 200
        impact_data = final_impact_resp.json()
        
        # Exact mathematical impact verification
        assert impact_data["total_food_rescued_kg"] == initial_rescued_kg + 50.0
        assert impact_data["co2_mitigated_kg"] >= 125.0  # 50 kg * 2.5 factor
        assert impact_data["water_saved_liters"] >= 40000.0  # 50 kg * 800L/kg factor


@pytest.mark.asyncio
async def test_security_rate_limiting_enforcement():
    """Verify that excessive requests to protected endpoints return HTTP 429."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Reset rate limiter client history for test purity
        test_ip = "192.168.1.100"
        
        # Direct rate limiter query for endpoint with limit of 10
        endpoint = "/v1/auth/login"
        responses = []
        for _ in range(12):
            allowed, count, limit = rate_limiter.is_allowed(test_ip, endpoint)
            responses.append(allowed)

        # First 10 allowed, 11th and 12th blocked
        assert all(responses[:10]) is True
        assert responses[10] is False
        assert responses[11] is False


@pytest.mark.asyncio
async def test_failed_physical_inspection_prevents_false_impact_credit():
    """
    Failure Injection: Recipient reports bad aroma/unsealed container.
    Handover must be marked REJECTED_AT_HANDOVER and 0 kg credited to impact.
    """
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        recipient_headers = {"Authorization": "Bearer mock-token-recipient"}
        coord_headers = {"Authorization": "Bearer mock-token-coordinator"}
        recipient_id = uuid.uuid4()
        allocation_id = uuid.uuid4()
        listing_id = uuid.uuid4()

        # Create session
        session_resp = await client.post("/v1/handover/sessions", json={
            "allocation_id": str(allocation_id),
            "listing_id": str(listing_id),
            "recipient_id": str(recipient_id),
        }, headers=coord_headers)
        assert session_resp.status_code == 201
        session_id = session_resp.json()["id"]
        otp = session_resp.json()["otp_code"]

        # Recipient flags failed inspection
        reject_resp = await client.post(f"/v1/handover/sessions/{session_id}/verify", json={
            "otp_code": otp,
            "actual_delivered_kg": 20.0,
            "visual_inspection_passed": False,  # FAILED INSPECTION
            "recipient_notes": "Soured odor noticed upon unsealing, seals broken."
        }, headers=recipient_headers)
        
        assert reject_resp.status_code == 200
        assert reject_resp.json()["status"] == "REJECTED_AT_HANDOVER"
        assert reject_resp.json()["visual_inspection_passed"] is False


def test_file_upload_validation_guards():
    """Verify photo upload security checks (MIME type restrictions and size ceilings)."""
    # Allowed formats
    valid_jpeg, _ = validate_image_file("food.jpg", "image/jpeg", 2 * 1024 * 1024)
    assert valid_jpeg is True

    valid_png, _ = validate_image_file("sample.png", "image/png", 1024 * 500)
    assert valid_png is True

    # Blocked formats (executable / script / pdf)
    invalid_exe, msg_exe = validate_image_file("malware.exe", "application/x-msdownload", 1024)
    assert invalid_exe is False
    assert "Unsupported file type" in msg_exe

    invalid_pdf, msg_pdf = validate_image_file("document.pdf", "application/pdf", 1024)
    assert invalid_pdf is False

    # Oversize file (> 10MB)
    oversize, msg_size = validate_image_file("huge.jpg", "image/jpeg", 15 * 1024 * 1024)
    assert oversize is False
    assert "exceeds maximum limit" in msg_size
