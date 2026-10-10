import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from app.schemas.auth import AuthUser, UserRole
from app.security.auth import get_current_user, require_role, require_permission
from app.security.permissions import Permission
from app.schemas.listings import (
    FoodListingCreate,
    FoodListingResponse,
    FoodItemCreate,
    FoodItemResponse,
    FoodEvidenceCreate,
    FoodEvidenceResponse,
    PublicListingCardResponse,
    ListingStatus,
)
from app.services.listings import (
    LISTING_DATABASE,
    create_draft_listing,
    add_photo_evidence,
    add_food_item,
    transition_listing_status,
    get_available_public_listings,
    MissingEvidenceError,
    InvalidStateTransitionError,
)

router = APIRouter(prefix="/listings", tags=["Food Listings"])


@router.post("", response_model=FoodListingResponse, status_code=status.HTTP_201_CREATED)
async def create_listing(
    payload: FoodListingCreate,
    current_user: AuthUser = Depends(require_permission(Permission.CREATE_LISTING)),
) -> FoodListingResponse:
    """Create a new draft listing. Free for all donors."""
    return create_draft_listing(donor_id=current_user.id, data=payload)


@router.get("", response_model=List[PublicListingCardResponse])
async def list_public_available_listings(
    current_user: AuthUser = Depends(get_current_user),
) -> List[PublicListingCardResponse]:
    """
    Public discovery feed of available food surplus listings.
    Available to all authenticated recipients and volunteers.
    """
    return get_available_public_listings()


@router.get("/my", response_model=List[FoodListingResponse])
async def list_my_donor_listings(
    current_user: AuthUser = Depends(require_permission(Permission.VIEW_OWN_LISTINGS)),
) -> List[FoodListingResponse]:
    """Retrieve all listings created by the current donor."""
    return [
        listing for listing in LISTING_DATABASE.values()
        if listing.donor_id == current_user.id
    ]


@router.get("/{listing_id}", response_model=FoodListingResponse)
async def get_listing_detail(
    listing_id: uuid.UUID,
    current_user: AuthUser = Depends(get_current_user),
) -> FoodListingResponse:
    """Retrieve full detail of a food listing."""
    listing = LISTING_DATABASE.get(listing_id)
    if not listing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Listing '{listing_id}' not found.",
        )
    return listing


@router.post("/{listing_id}/photos", response_model=FoodEvidenceResponse, status_code=status.HTTP_201_CREATED)
async def upload_listing_photo(
    listing_id: uuid.UUID,
    payload: FoodEvidenceCreate,
    current_user: AuthUser = Depends(get_current_user),
) -> FoodEvidenceResponse:
    """Attach compulsory photo evidence to a listing."""
    listing = LISTING_DATABASE.get(listing_id)
    if not listing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Listing not found.")
    if listing.donor_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cannot upload photo to another donor's listing.")
    
    return add_photo_evidence(listing_id=listing_id, evidence=payload)


@router.post("/{listing_id}/items", response_model=FoodItemResponse, status_code=status.HTTP_201_CREATED)
async def add_item_to_listing(
    listing_id: uuid.UUID,
    payload: FoodItemCreate,
    current_user: AuthUser = Depends(get_current_user),
) -> FoodItemResponse:
    """Add a food dish item to a draft listing."""
    listing = LISTING_DATABASE.get(listing_id)
    if not listing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Listing not found.")
    if listing.donor_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cannot add item to another donor's listing.")
    
    return add_food_item(listing_id=listing_id, item=payload)


@router.post("/{listing_id}/publish", response_model=FoodListingResponse)
async def publish_listing(
    listing_id: uuid.UUID,
    current_user: AuthUser = Depends(get_current_user),
) -> FoodListingResponse:
    """
    Publish a draft listing (transitions DRAFT -> SUBMITTED).
    Strictly blocked if compulsory photos or food dishes are missing.
    """
    listing = LISTING_DATABASE.get(listing_id)
    if not listing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Listing not found.")
    if listing.donor_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cannot publish another donor's listing.")

    try:
        updated = await transition_listing_status(
            listing_id=listing_id,
            target_status=ListingStatus.SUBMITTED,
            actor_id=current_user.id,
            reason="Donor submitted for publication.",
        )
        return updated
    except MissingEvidenceError as err:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(err))
    except InvalidStateTransitionError as err:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(err))


@router.patch("/{listing_id}/status", response_model=FoodListingResponse)
async def update_listing_status(
    listing_id: uuid.UUID,
    target_status: ListingStatus,
    reason: Optional[str] = None,
    current_user: AuthUser = Depends(get_current_user),
) -> FoodListingResponse:
    """Execute authorized state transition."""
    listing = LISTING_DATABASE.get(listing_id)
    if not listing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Listing not found.")

    # Only coordinator/admin or owner can change status
    if current_user.role not in [UserRole.COORDINATOR, UserRole.ADMIN] and listing.donor_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to modify this listing status.")

    try:
        updated = await transition_listing_status(
            listing_id=listing_id,
            target_status=target_status,
            actor_id=current_user.id,
            reason=reason,
        )
        return updated
    except (MissingEvidenceError, InvalidStateTransitionError) as err:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(err))
