import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from app.schemas.auth import AuthUser
from app.security.auth import get_current_user
from app.schemas.allocations import (
    AllocationPlanResponse,
    AllocationItemResponse,
    AllocationAcceptRequest,
    AllocationDeclineRequest,
)
from app.services.allocations import (
    generate_allocation_plan,
    process_recipient_acceptance,
    process_recipient_decline,
    ALLOCATION_PLAN_DATABASE,
    ALLOCATION_ITEM_DATABASE,
)

router = APIRouter(prefix="/allocations", tags=["Distribution & Allocations Engine"])


@router.post("/optimize/{listing_id}", response_model=AllocationPlanResponse)
async def create_allocation_plan(
    listing_id: uuid.UUID,
    current_user: AuthUser = Depends(get_current_user),
) -> AllocationPlanResponse:
    """
    Run mathematical optimization on a food listing to divide surplus meals
    across eligible nearby shelters and community kitchens without over-allocation.
    """
    try:
        plan = await generate_allocation_plan(listing_id=listing_id, actor_id=current_user.id)
        return plan
    except KeyError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Listing not found.")
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/plans/{plan_id}", response_model=AllocationPlanResponse)
async def get_allocation_plan(
    plan_id: uuid.UUID,
    current_user: AuthUser = Depends(get_current_user),
) -> AllocationPlanResponse:
    """Retrieve full details of an allocation plan."""
    plan = ALLOCATION_PLAN_DATABASE.get(plan_id)
    if not plan:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Allocation plan not found.")
    return plan


@router.get("/listing/{listing_id}", response_model=List[AllocationPlanResponse])
async def get_listing_allocation_plans(
    listing_id: uuid.UUID,
    current_user: AuthUser = Depends(get_current_user),
) -> List[AllocationPlanResponse]:
    """Retrieve all allocation plans associated with a food listing."""
    return [p for p in ALLOCATION_PLAN_DATABASE.values() if p.listing_id == listing_id]


@router.post("/{allocation_id}/accept", response_model=AllocationItemResponse)
async def accept_allocation(
    allocation_id: uuid.UUID,
    payload: AllocationAcceptRequest,
    current_user: AuthUser = Depends(get_current_user),
) -> AllocationItemResponse:
    """Recipient confirms or partially accepts proposed quantity."""
    try:
        updated = await process_recipient_acceptance(
            allocation_id=allocation_id,
            payload=payload,
            actor_id=current_user.id,
        )
        return updated
    except KeyError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Allocation not found.")
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/{allocation_id}/decline", response_model=AllocationItemResponse)
async def decline_allocation(
    allocation_id: uuid.UUID,
    payload: AllocationDeclineRequest,
    current_user: AuthUser = Depends(get_current_user),
) -> AllocationItemResponse:
    """
    Recipient declines allocation.
    The system atomically releases the reserved portion and dynamically re-optimizes remaining supply!
    """
    try:
        declined_item, _ = await process_recipient_decline(
            allocation_id=allocation_id,
            payload=payload,
            actor_id=current_user.id,
        )
        return declined_item
    except KeyError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Allocation not found.")
