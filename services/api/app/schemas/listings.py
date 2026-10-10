from enum import Enum
from typing import Optional, List
from uuid import UUID, uuid4
from datetime import datetime, timezone
from pydantic import BaseModel, Field, model_validator


class ListingStatus(str, Enum):
    DRAFT = "DRAFT"
    SUBMITTED = "SUBMITTED"
    EVIDENCE_REVIEW = "EVIDENCE_REVIEW"
    AVAILABLE = "AVAILABLE"
    ON_HOLD = "ON_HOLD"
    PARTIALLY_RESERVED = "PARTIALLY_RESERVED"
    FULLY_RESERVED = "FULLY_RESERVED"
    PICKUP_IN_PROGRESS = "PICKUP_IN_PROGRESS"
    PARTIALLY_HANDED_OVER = "PARTIALLY_HANDED_OVER"
    COMPLETED = "COMPLETED"
    EXPIRED = "EXPIRED"
    CANCELLED = "CANCELLED"
    REJECTED = "REJECTED"


class FoodUnit(str, Enum):
    KG = "kg"
    GRAMS = "grams"
    LITERS = "liters"
    PLATES = "plates"
    PACKETS = "packets"


class FoodItemBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=100, description="Name of the food dish (e.g. Steamed Rice, Dal Makhani)")
    food_type: str = Field(..., description="Category: cooked_rice, cooked_curry, bread_roti, dry_rations, etc.")
    quantity_value: float = Field(..., gt=0, description="Numerical quantity must be strictly greater than 0")
    quantity_unit: FoodUnit = Field(default=FoodUnit.KG)
    preparation_time: datetime = Field(..., description="Timestamp when the food was prepared/cooked")
    handling_history: Optional[str] = Field(None, description="History of handling, reheating or storage steps")
    storage_condition: str = Field(default="room_temperature", description="room_temperature, refrigerated, hot_held")
    is_perishable: bool = Field(default=True)


class FoodItemCreate(FoodItemBase):
    pass


class FoodItemResponse(FoodItemBase):
    id: UUID = Field(default_factory=uuid4)
    listing_id: UUID


class FoodEvidenceBase(BaseModel):
    storage_path: str = Field(..., description="Secure private storage reference or signed photo URI")
    photo_type: str = Field(default="overhead_dish", description="overhead_dish, container_label, temperature_display, storage_area")


class FoodEvidenceCreate(FoodEvidenceBase):
    pass


class FoodEvidenceResponse(FoodEvidenceBase):
    id: UUID = Field(default_factory=uuid4)
    listing_id: UUID
    uploaded_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class FoodListingBase(BaseModel):
    title: str = Field(..., min_length=3, max_length=150, description="Listing title (e.g. Wedding Surplus - Basmati Rice & Dal)")
    description: Optional[str] = None
    pickup_window_start: datetime
    pickup_window_end: datetime
    latitude: float = Field(..., ge=-90.0, le=90.0)
    longitude: float = Field(..., ge=-180.0, le=180.0)
    approx_area_name: str = Field(..., min_length=2, description="Public area label (e.g. Indiranagar, Bengaluru)")


class FoodListingCreate(FoodListingBase):
    items: List[FoodItemCreate] = Field(default_factory=list)
    
    @model_validator(mode="after")
    def validate_pickup_window(self):
        if self.pickup_window_end <= self.pickup_window_start:
            raise ValueError("pickup_window_end must be strictly later than pickup_window_start.")
        return self


class FoodListingResponse(FoodListingBase):
    id: UUID = Field(default_factory=uuid4)
    donor_id: UUID
    status: ListingStatus = ListingStatus.DRAFT
    items: List[FoodItemResponse] = Field(default_factory=list)
    photos: List[FoodEvidenceResponse] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class PublicListingCardResponse(BaseModel):
    """Redacted public card for recipients to preserve donor exact privacy until reservation."""
    id: UUID
    title: str
    description: Optional[str] = None
    status: ListingStatus
    approx_area_name: str
    pickup_window_start: datetime
    pickup_window_end: datetime
    items: List[FoodItemResponse]
    photos: List[FoodEvidenceResponse]
    created_at: datetime
