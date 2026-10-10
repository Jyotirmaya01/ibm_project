import uuid
from typing import List, Dict, Any
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from app.schemas.auth import (
    AuthUser,
    UserRole,
    OrganizationCreate,
    OrganizationResponse,
)
from app.security.auth import get_current_user, require_role
from app.services.audit import record_audit_event

router = APIRouter(prefix="/organizations", tags=["Organizations"])

# In-memory organization store for initial development / test runs
DEMO_ORGANIZATIONS: Dict[uuid.UUID, OrganizationResponse] = {
    uuid.UUID("a0000000-0000-0000-0000-000000000001"): OrganizationResponse(
        id=uuid.UUID("a0000000-0000-0000-0000-000000000001"),
        name="[DEMO] Shanti Ashram Community Kitchen",
        type="ashram",
        verification_status="verified",
        address="Demo Street 1, Bengaluru",
        latitude=12.9716,
        longitude=77.5946,
        created_at=datetime.now(timezone.utc),
    ),
    uuid.UUID("a0000000-0000-0000-0000-000000000002"): OrganizationResponse(
        id=uuid.UUID("a0000000-0000-0000-0000-000000000002"),
        name="[DEMO] Hope Child Shelter",
        type="orphanage",
        verification_status="verified",
        address="Demo Street 2, Bengaluru",
        latitude=12.9800,
        longitude=77.6000,
        created_at=datetime.now(timezone.utc),
    ),
}


@router.get("", response_model=List[OrganizationResponse])
async def list_organizations(
    current_user: AuthUser = Depends(get_current_user),
) -> List[OrganizationResponse]:
    """List organizations. Open to all authenticated users with transparent verification status."""
    return list(DEMO_ORGANIZATIONS.values())


@router.post("", response_model=OrganizationResponse, status_code=status.HTTP_201_CREATED)
async def create_organization(
    payload: OrganizationCreate,
    current_user: AuthUser = Depends(get_current_user),
) -> OrganizationResponse:
    """Register a new organization (unverified by default)."""
    org_id = uuid.uuid4()
    now = datetime.now(timezone.utc)
    org = OrganizationResponse(
        id=org_id,
        name=payload.name,
        type=payload.type,
        address=payload.address,
        latitude=payload.latitude,
        longitude=payload.longitude,
        verification_status="unverified",
        created_at=now,
    )
    DEMO_ORGANIZATIONS[org_id] = org

    await record_audit_event(
        action="ORGANIZATION_CREATED",
        resource_type="organization",
        actor_id=current_user.id,
        resource_id=org_id,
        details={"name": org.name, "type": org.type},
    )

    return org


@router.patch("/{org_id}/verify", response_model=OrganizationResponse)
async def verify_organization(
    org_id: uuid.UUID,
    verification_status: str,
    current_user: AuthUser = Depends(require_role([UserRole.COORDINATOR, UserRole.ADMIN])),
) -> OrganizationResponse:
    """
    Privileged endpoint: Authorize or reject an organization.
    Restricted strictly to authorized Coordinators and Administrators.
    """
    if org_id not in DEMO_ORGANIZATIONS:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Organization '{org_id}' not found.",
        )

    if verification_status not in ["verified", "rejected", "pending"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid status. Must be 'verified', 'rejected', or 'pending'.",
        )

    org = DEMO_ORGANIZATIONS[org_id]
    org.verification_status = verification_status

    await record_audit_event(
        action="ORGANIZATION_VERIFIED",
        resource_type="organization",
        actor_id=current_user.id,
        resource_id=org_id,
        details={"new_verification_status": verification_status},
    )

    return org
