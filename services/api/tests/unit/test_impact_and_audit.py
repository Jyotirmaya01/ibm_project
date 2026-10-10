import pytest
import uuid
from datetime import datetime, timezone
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.schemas.handover import HandoverStatus, HandoverSessionResponse
from app.services.handover import HANDOVER_DATABASE
from app.services.audit import record_audit_event


@pytest.mark.asyncio
async def test_impact_summary_public_access():
    """Impact summary is publicly accessible and provides verified statistics."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.get("/v1/impact/summary")
        assert res.status_code == 200
        data = res.json()
        
        assert "total_food_rescued_kg" in data
        assert "meals_served" in data
        assert "co2_mitigated_kg" in data
        assert "water_saved_liters" in data
        assert data["total_food_rescued_kg"] > 0
        assert data["meals_served"] > 0


@pytest.mark.asyncio
async def test_unverified_and_rejected_food_excluded_from_impact():
    """Proposed, scheduled, or rejected food is NEVER counted in delivered impact metrics."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Initial baseline
        initial_res = await client.get("/v1/impact/summary")
        initial_kg = initial_res.json()["total_food_rescued_kg"]

        # 1. Add rejected handover session (50kg)
        now = datetime.now(timezone.utc)
        rejected_id = uuid.uuid4()
        HANDOVER_DATABASE[rejected_id] = HandoverSessionResponse(
            id=rejected_id,
            allocation_id=uuid.uuid4(),
            listing_id=uuid.uuid4(),
            recipient_id=uuid.uuid4(),
            status=HandoverStatus.REJECTED_AT_HANDOVER,
            otp_code="1111",
            scheduled_time=now,
            actual_delivered_kg=50.0,
            visual_inspection_passed=False,
        )

        after_reject_res = await client.get("/v1/impact/summary")
        # Rejected food must NOT increment verified rescued food!
        assert after_reject_res.json()["total_food_rescued_kg"] == initial_kg

        # 2. Add verified delivery session (30kg)
        verified_id = uuid.uuid4()
        HANDOVER_DATABASE[verified_id] = HandoverSessionResponse(
            id=verified_id,
            allocation_id=uuid.uuid4(),
            listing_id=uuid.uuid4(),
            recipient_id=uuid.uuid4(),
            status=HandoverStatus.VERIFIED_DELIVERED,
            otp_code="2222",
            scheduled_time=now,
            actual_delivered_kg=30.0,
            visual_inspection_passed=True,
        )

        after_verify_res = await client.get("/v1/impact/summary")
        # Verified food MUST increment rescued food by exactly 30kg
        assert after_verify_res.json()["total_food_rescued_kg"] == round(initial_kg + 30.0, 2)


@pytest.mark.asyncio
async def test_co2_and_water_savings_formulas():
    """Verify standard environmental metrics multipliers (2.5x CO2e, 800L water/kg)."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.get("/v1/impact/summary")
        data = res.json()
        rescued_kg = data["total_food_rescued_kg"]

        expected_co2 = round(rescued_kg * 2.5, 2)
        expected_water = round(rescued_kg * 800.0, 2)

        assert data["co2_mitigated_kg"] == expected_co2
        assert data["water_saved_liters"] == expected_water


@pytest.mark.asyncio
async def test_audit_log_access_controlled():
    """Audit logs are protected: donors are forbidden; coordinators have access."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        donor_headers = {"Authorization": "Bearer mock-token-donor"}
        coord_headers = {"Authorization": "Bearer mock-token-coordinator"}

        # Record test event
        await record_audit_event(
            action="TEST_SECURITY_CHECK",
            resource_type="system",
            details={"test": "access_control"},
        )

        # Donor forbidden
        donor_res = await client.get("/v1/audit/logs", headers=donor_headers)
        assert donor_res.status_code == 403

        # Coordinator authorized
        coord_res = await client.get("/v1/audit/logs", headers=coord_headers)
        assert coord_res.status_code == 200
        logs = coord_res.json()
        assert len(logs) > 0
        assert any(l["action"] == "TEST_SECURITY_CHECK" for l in logs)
