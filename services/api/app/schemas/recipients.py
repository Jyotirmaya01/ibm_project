from enum import Enum
from typing import List, Optional
from uuid import UUID, uuid4
from datetime import datetime, timezone
from pydantic import BaseModel, Field, model_validator


class StorageCapability(str, Enum):
    REFRIGERATED = "refrigerated"
    DRY_ONLY = "dry_only"
    FREEZER = "freezer"
    NONE = "none"


class DietaryPreference(str, Enum):
    PURE_VEG = "pure_veg"
    NO_ONION_GARLIC = "no_onion_garlic"
    HALAL = "halal"
    STANDARD = "standard"


class RecipientCapacityBase(BaseModel):
    people_served: int = Field(..., gt=0, description="Total people served by the recipient organization")
    meals_needed: int = Field(..., ge=0, description="Gross number of meals required for current cycle")
    existing_meals_available: int = Field(default=0, ge=0, description="Meals already in stock/pantry")
    storage_capability: StorageCapability = Field(default=StorageCapability.DRY_ONLY)
    max_storage_kg: float = Field(default=50.0, gt=0, description="Maximum kilograms of food that can safely be stored")
    dietary_preferences: List[DietaryPreference] = Field(default_factory=lambda: [DietaryPreference.STANDARD])
    can_collect_directly: bool = Field(default=True, description="Whether recipient has transport/volunteers to collect")
    notes: Optional[str] = None


class RecipientCapacityCreate(RecipientCapacityBase):
    recipient_id: UUID = Field(..., description="Organization ID representing the recipient shelter/ashram")


class RecipientCapacityResponse(RecipientCapacityBase):
    id: UUID = Field(default_factory=uuid4)
    recipient_id: UUID
    net_meal_deficit: int = Field(..., description="Computed net demand: meals_needed - existing_meals_available")
    snapshot_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    is_stale: bool = False
    is_reviewed: bool = False

    @classmethod
    def from_input(cls, data: RecipientCapacityCreate, is_reviewed: bool = False):
        net_deficit = max(0, data.meals_needed - data.existing_meals_available)
        now = datetime.now(timezone.utc)
        return cls(
            id=uuid4(),
            recipient_id=data.recipient_id,
            people_served=data.people_served,
            meals_needed=data.meals_needed,
            existing_meals_available=data.existing_meals_available,
            net_meal_deficit=net_deficit,
            storage_capability=data.storage_capability,
            max_storage_kg=data.max_storage_kg,
            dietary_preferences=data.dietary_preferences,
            can_collect_directly=data.can_collect_directly,
            notes=data.notes,
            snapshot_at=now,
            is_stale=False,
            is_reviewed=is_reviewed,
        )
