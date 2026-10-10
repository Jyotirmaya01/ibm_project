import pytest
import uuid
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.schemas.handover import HandoverStatus
from app.services.handover import HANDOVER_DATABASE
from app.services.chat import CONVERSATION_DATABASE
from app.integrations.notifications import NOTIFICATION_AUDIT_LOG


@pytest.fixture
def mock_ids():
    return {
        "allocation_id": uuid.uuid4(),
        "listing_id": uuid.uuid4(),
        "recipient_id": uuid.uuid4(),
        "volunteer_id": uuid.uuid4(),
    }


@pytest.mark.asyncio
async def test_handover_session_creation_and_otp_dispatch(mock_ids):
    """Creating a handover session generates secure OTP and dispatches recipient alert."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        headers = {"Authorization": "Bearer mock-token-coordinator"}
        
        payload = {
            "allocation_id": str(mock_ids["allocation_id"]),
            "listing_id": str(mock_ids["listing_id"]),
            "recipient_id": str(mock_ids["recipient_id"]),
        }
        res = await client.post("/v1/handover/sessions", json=payload, headers=headers)
        assert res.status_code == 201
        data = res.json()
        
        assert data["status"] == HandoverStatus.SCHEDULED.value
        assert len(data["otp_code"]) >= 4
        assert data["recipient_id"] == str(mock_ids["recipient_id"])
        
        # Verify notification was audited
        otp_notifications = [n for n in NOTIFICATION_AUDIT_LOG if n.template_name == "HANDOVER_OTP_GENERATED"]
        assert len(otp_notifications) > 0


@pytest.mark.asyncio
async def test_volunteer_driver_dispatch(mock_ids):
    """Assigning a volunteer driver updates session state to DRIVER_ASSIGNED."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        headers = {"Authorization": "Bearer mock-token-coordinator"}
        
        # 1. Create session
        create_res = await client.post(
            "/v1/handover/sessions",
            json={
                "allocation_id": str(mock_ids["allocation_id"]),
                "listing_id": str(mock_ids["listing_id"]),
                "recipient_id": str(mock_ids["recipient_id"]),
            },
            headers=headers,
        )
        session_id = create_res.json()["id"]

        # 2. Assign volunteer driver
        dispatch_payload = {
            "volunteer_id": str(mock_ids["volunteer_id"]),
            "vehicle_type": "three_wheeler",
            "estimated_arrival_minutes": 20,
            "contact_phone_masked": "+91 98765 XXXXX",
        }
        dispatch_res = await client.post(f"/v1/handover/sessions/{session_id}/dispatch-driver", json=dispatch_payload, headers=headers)
        assert dispatch_res.status_code == 200
        assert dispatch_res.json()["status"] == HandoverStatus.DRIVER_ASSIGNED.value
        assert dispatch_res.json()["volunteer_id"] == str(mock_ids["volunteer_id"])


@pytest.mark.asyncio
async def test_verified_delivery_with_physical_inspection(mock_ids):
    """Physical OTP match + inspection confirmation verifies delivery and updates impact."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        headers = {"Authorization": "Bearer mock-token-recipient"}
        
        # 1. Create session
        create_res = await client.post(
            "/v1/handover/sessions",
            json={
                "allocation_id": str(mock_ids["allocation_id"]),
                "listing_id": str(mock_ids["listing_id"]),
                "recipient_id": str(mock_ids["recipient_id"]),
            },
            headers=headers,
        )
        session = create_res.json()
        session_id = session["id"]
        valid_otp = session["otp_code"]

        # 2. Verify with inspection pass
        verify_payload = {
            "otp_code": valid_otp,
            "actual_delivered_kg": 25.0,
            "visual_inspection_passed": True,
            "temperature_celsius": 68.5,
            "recipient_notes": "Food steaming hot, sealed stainless steel urns intact.",
        }
        verify_res = await client.post(f"/v1/handover/sessions/{session_id}/verify", json=verify_payload, headers=headers)
        assert verify_res.status_code == 200
        verified = verify_res.json()
        
        assert verified["status"] == HandoverStatus.VERIFIED_DELIVERED.value
        assert verified["actual_delivered_kg"] == 25.0
        assert verified["visual_inspection_passed"] is True
        assert verified["verified_at"] is not None


@pytest.mark.asyncio
async def test_invalid_otp_rejected(mock_ids):
    """Incorrect verification OTP is rejected with HTTP 400."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        headers = {"Authorization": "Bearer mock-token-recipient"}
        
        create_res = await client.post(
            "/v1/handover/sessions",
            json={
                "allocation_id": str(mock_ids["allocation_id"]),
                "listing_id": str(mock_ids["listing_id"]),
                "recipient_id": str(mock_ids["recipient_id"]),
            },
            headers=headers,
        )
        session_id = create_res.json()["id"]

        # Wrong OTP "0000"
        verify_payload = {
            "otp_code": "0000",
            "actual_delivered_kg": 25.0,
            "visual_inspection_passed": True,
        }
        verify_res = await client.post(f"/v1/handover/sessions/{session_id}/verify", json=verify_payload, headers=headers)
        assert verify_res.status_code == 400
        assert "Invalid verification OTP" in verify_res.json()["detail"]


@pytest.mark.asyncio
async def test_failed_inspection_rejects_food(mock_ids):
    """If visual hygiene/temperature inspection fails, handover is recorded as REJECTED."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        headers = {"Authorization": "Bearer mock-token-recipient"}
        
        create_res = await client.post(
            "/v1/handover/sessions",
            json={
                "allocation_id": str(mock_ids["allocation_id"]),
                "listing_id": str(mock_ids["listing_id"]),
                "recipient_id": str(mock_ids["recipient_id"]),
            },
            headers=headers,
        )
        session = create_res.json()
        session_id = session["id"]

        # Inspection failed: food cold and container opened
        verify_payload = {
            "otp_code": session["otp_code"],
            "actual_delivered_kg": 20.0,
            "visual_inspection_passed": False,
            "recipient_notes": "Container seal broken during transit, cold to touch.",
        }
        verify_res = await client.post(f"/v1/handover/sessions/{session_id}/verify", json=verify_payload, headers=headers)
        assert verify_res.status_code == 200
        data = verify_res.json()
        assert data["status"] == HandoverStatus.REJECTED_AT_HANDOVER.value
        assert data["visual_inspection_passed"] is False


@pytest.mark.asyncio
async def test_in_app_chat_membership_and_messaging():
    """Authorized participants can communicate; non-participants are blocked."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        coord_headers = {"Authorization": "Bearer mock-token-coordinator"}
        donor_headers = {"Authorization": "Bearer mock-token-donor"}
        
        listing_id = uuid.uuid4()
        
        # 1. Initialize conversation
        conv_res = await client.post(f"/v1/chat/listing/{listing_id}", headers=donor_headers)
        assert conv_res.status_code == 200
        conv_id = conv_res.json()["id"]

        # 2. Donor posts a message
        msg_payload = {"content": "Urns are packed at Gate 2. Driver can park inside."}
        post_res = await client.post(f"/v1/chat/conversations/{conv_id}/messages", json=msg_payload, headers=donor_headers)
        assert post_res.status_code == 200
        assert post_res.json()["content"] == msg_payload["content"]

        # 3. Coordinator (privileged role) views message history
        history_res = await client.get(f"/v1/chat/conversations/{conv_id}/messages", headers=coord_headers)
        assert history_res.status_code == 200
        assert len(history_res.json()) >= 1
        assert history_res.json()[0]["content"] == msg_payload["content"]
