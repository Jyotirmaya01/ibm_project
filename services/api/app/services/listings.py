import uuid
from typing import Dict, List, Optional
from datetime import datetime, timezone
from app.schemas.listings import (
    ListingStatus,
    FoodListingCreate,
    FoodListingResponse,
    FoodItemCreate,
    FoodItemResponse,
    FoodEvidenceCreate,
    FoodEvidenceResponse,
    PublicListingCardResponse,
)
from app.services.audit import record_audit_event


class InvalidStateTransitionError(Exception):
    pass


class MissingEvidenceError(Exception):
    pass


# Authoritative Listing State Transition Graph
VALID_TRANSITIONS = {
    ListingStatus.DRAFT: {ListingStatus.SUBMITTED, ListingStatus.CANCELLED},
    ListingStatus.SUBMITTED: {ListingStatus.EVIDENCE_REVIEW, ListingStatus.CANCELLED, ListingStatus.REJECTED},
    ListingStatus.EVIDENCE_REVIEW: {ListingStatus.AVAILABLE, ListingStatus.ON_HOLD, ListingStatus.REJECTED, ListingStatus.CANCELLED},
    ListingStatus.ON_HOLD: {ListingStatus.EVIDENCE_REVIEW, ListingStatus.CANCELLED, ListingStatus.REJECTED},
    ListingStatus.AVAILABLE: {ListingStatus.PARTIALLY_RESERVED, ListingStatus.FULLY_RESERVED, ListingStatus.EXPIRED, ListingStatus.CANCELLED},
    ListingStatus.PARTIALLY_RESERVED: {ListingStatus.AVAILABLE, ListingStatus.FULLY_RESERVED, ListingStatus.PICKUP_IN_PROGRESS, ListingStatus.CANCELLED},
    ListingStatus.FULLY_RESERVED: {ListingStatus.PICKUP_IN_PROGRESS, ListingStatus.AVAILABLE, ListingStatus.CANCELLED},
    ListingStatus.PICKUP_IN_PROGRESS: {ListingStatus.PARTIALLY_HANDED_OVER, ListingStatus.COMPLETED, ListingStatus.CANCELLED},
    ListingStatus.PARTIALLY_HANDED_OVER: {ListingStatus.COMPLETED},
    ListingStatus.COMPLETED: set(),
    ListingStatus.EXPIRED: set(),
    ListingStatus.CANCELLED: set(),
    ListingStatus.REJECTED: set(),
}

# In-memory listing repository for local development and unit tests
LISTING_DATABASE: Dict[uuid.UUID, FoodListingResponse] = {}


def create_draft_listing(donor_id: uuid.UUID, data: FoodListingCreate) -> FoodListingResponse:
    """Create a new draft listing for a donor."""
    listing_id = uuid.uuid4()
    now = datetime.now(timezone.utc)
    
    items_response = [
        FoodItemResponse(
            id=uuid.uuid4(),
            listing_id=listing_id,
            **item.model_dump()
        )
        for item in data.items
    ]

    listing = FoodListingResponse(
        id=listing_id,
        donor_id=donor_id,
        title=data.title,
        description=data.description,
        status=ListingStatus.DRAFT,
        pickup_window_start=data.pickup_window_start,
        pickup_window_end=data.pickup_window_end,
        latitude=data.latitude,
        longitude=data.longitude,
        approx_area_name=data.approx_area_name,
        items=items_response,
        photos=[],
        created_at=now,
        updated_at=now,
    )
    LISTING_DATABASE[listing_id] = listing
    return listing


def add_photo_evidence(listing_id: uuid.UUID, evidence: FoodEvidenceCreate) -> FoodEvidenceResponse:
    """Attach compulsory photo evidence to a listing."""
    listing = LISTING_DATABASE.get(listing_id)
    if not listing:
        raise KeyError(f"Listing '{listing_id}' not found.")
    
    photo_response = FoodEvidenceResponse(
        id=uuid.uuid4(),
        listing_id=listing_id,
        storage_path=evidence.storage_path,
        photo_type=evidence.photo_type,
        uploaded_at=datetime.now(timezone.utc),
    )
    listing.photos.append(photo_response)
    listing.updated_at = datetime.now(timezone.utc)
    return photo_response


def add_food_item(listing_id: uuid.UUID, item: FoodItemCreate) -> FoodItemResponse:
    """Add a food dish item to a listing."""
    listing = LISTING_DATABASE.get(listing_id)
    if not listing:
        raise KeyError(f"Listing '{listing_id}' not found.")
    
    item_response = FoodItemResponse(
        id=uuid.uuid4(),
        listing_id=listing_id,
        **item.model_dump()
    )
    listing.items.append(item_response)
    listing.updated_at = datetime.now(timezone.utc)
    return item_response


async def transition_listing_status(
    listing_id: uuid.UUID,
    target_status: ListingStatus,
    actor_id: uuid.UUID,
    reason: Optional[str] = None
) -> FoodListingResponse:
    """
    Execute a server-side validated state transition.
    Enforces that photos are compulsory before entering SUBMITTED or AVAILABLE state.
    """
    listing = LISTING_DATABASE.get(listing_id)
    if not listing:
        raise KeyError(f"Listing '{listing_id}' not found.")

    current_status = listing.status

    # Validate transition path
    if target_status not in VALID_TRANSITIONS.get(current_status, set()):
        raise InvalidStateTransitionError(
            f"Invalid transition from '{current_status.value}' to '{target_status.value}'."
        )

    # Compulsory Evidence Gate:
    # A listing attempting publication MUST have photos and at least one item
    if target_status in [ListingStatus.SUBMITTED, ListingStatus.AVAILABLE]:
        if len(listing.photos) == 0:
            raise MissingEvidenceError(
                "Publication blocked: Compulsory food photo is missing. At least one dish photo must be uploaded."
            )
        if len(listing.items) == 0:
            raise MissingEvidenceError(
                "Publication blocked: Listing must have at least one food dish specified."
            )

    # Perform transition
    listing.status = target_status
    listing.updated_at = datetime.now(timezone.utc)

    await record_audit_event(
        action="LISTING_STATUS_CHANGED",
        resource_type="food_listing",
        actor_id=actor_id,
        resource_id=listing_id,
        details={
            "from_status": current_status.value,
            "to_status": target_status.value,
            "reason": reason,
        },
    )

    return listing


def get_available_public_listings() -> List[PublicListingCardResponse]:
    """
    Return available listings for recipient discovery.
    Redacts exact coordinates and donor ID to safeguard privacy.
    """
    available_cards = []
    for listing in LISTING_DATABASE.values():
        if listing.status in [ListingStatus.AVAILABLE, ListingStatus.PARTIALLY_RESERVED]:
            available_cards.append(
                PublicListingCardResponse(
                    id=listing.id,
                    title=listing.title,
                    description=listing.description,
                    status=listing.status,
                    approx_area_name=listing.approx_area_name,
                    pickup_window_start=listing.pickup_window_start,
                    pickup_window_end=listing.pickup_window_end,
                    items=listing.items,
                    photos=listing.photos,
                    created_at=listing.created_at,
                )
            )
    return available_cards
