import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from app.schemas.auth import AuthUser, UserRole
from app.security.auth import get_current_user, require_role, require_permission
from app.security.permissions import Permission
from app.schemas.recipients import (
    RecipientCapacityCreate,
    RecipientCapacityResponse,
)
from app.services.recipients import (
    save_recipient_capacity,
    get_recipient_capacity,
    get_all_capacity_snapshots,
)

router = APIRouter(prefix="/recipients", tags=["Recipient Demand & Capacity"])


@router.post("/capacity", response_model=RecipientCapacityResponse, status_code=status.HTTP_201_CREATED)
async def submit_capacity_snapshot(
    payload: RecipientCapacityCreate,
    current_user: AuthUser = Depends(get_current_user),
) -> RecipientCapacityResponse:
    """
    Submit or refresh a timestamped capacity snapshot for a recipient shelter/ashram.
    Available to recipient representatives and coordinators.
    """
    is_reviewed = current_user.role in [UserRole.COORDINATOR, UserRole.ADMIN]
    return await save_recipient_capacity(
        data=payload,
        is_reviewed=is_reviewed,
        actor_id=current_user.id,
    )


@router.get("/capacity", response_model=List[RecipientCapacityResponse])
async def list_active_capacity_snapshots(
    include_stale: bool = False,
    current_user: AuthUser = Depends(get_current_user),
) -> List[RecipientCapacityResponse]:
    """
    List current recipient demand snapshots.
    Stale demand (>24h) is filtered out by default to prevent invalid allocations.
    """
    return get_all_capacity_snapshots(include_stale=include_stale)


@router.get("/{recipient_id}/capacity", response_model=RecipientCapacityResponse)
async def get_recipient_capacity_snapshot(
    recipient_id: uuid.UUID,
    current_user: AuthUser = Depends(get_current_user),
) -> RecipientCapacityResponse:
    """Retrieve the latest capacity snapshot for a specific recipient organization."""
    snapshot = get_recipient_capacity(recipient_id)
    if not snapshot:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Capacity snapshot for recipient '{recipient_id}' not found.",
        )
    return snapshot
