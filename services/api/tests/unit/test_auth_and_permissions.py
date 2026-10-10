import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.services.audit import AUDIT_LOG_BUFFER


@pytest.mark.asyncio
async def test_unauthenticated_request_rejected():
    """Unauthenticated requests must be rejected with 401."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/v1/auth/me")
        assert response.status_code == 401
        assert "detail" in response.json()


@pytest.mark.asyncio
async def test_donor_profile_and_permissions():
    """Donor authenticated via token receives donor role and permissions."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        headers = {"Authorization": "Bearer mock-token-donor"}
        response = await client.get("/v1/auth/me", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert data["role"] == "donor"
        assert "listing:create" in data["permissions"]
        assert "org:verify" not in data["permissions"]


@pytest.mark.asyncio
async def test_coordinator_privileged_action_allowed():
    """Coordinator can verify an organization."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        headers = {"Authorization": "Bearer mock-token-coordinator"}
        org_id = "a0000000-0000-0000-0000-000000000001"
        response = await client.patch(
            f"/v1/organizations/{org_id}/verify?verification_status=verified",
            headers=headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["verification_status"] == "verified"

        # Check audit log
        assert len(AUDIT_LOG_BUFFER) > 0
        latest_audit = AUDIT_LOG_BUFFER[-1]
        assert latest_audit.action == "ORGANIZATION_VERIFIED"


@pytest.mark.asyncio
async def test_donor_cannot_verify_organization():
    """Donor attempting to verify an organization receives 403 Forbidden."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        headers = {"Authorization": "Bearer mock-token-donor"}
        org_id = "a0000000-0000-0000-0000-000000000001"
        response = await client.patch(
            f"/v1/organizations/{org_id}/verify?verification_status=verified",
            headers=headers,
        )
        assert response.status_code == 403
        assert "does not have sufficient privileges" in response.json()["detail"]


@pytest.mark.asyncio
async def test_unauthorized_role_escalation_blocked():
    """Non-admin user cannot escalate role to admin or coordinator."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        headers = {"Authorization": "Bearer mock-token-donor"}
        response = await client.post(
            "/v1/auth/profile",
            headers=headers,
            json={"role": "admin", "full_name": "Attacker"},
        )
        assert response.status_code == 403
        assert "Privileged roles" in response.json()["detail"]
