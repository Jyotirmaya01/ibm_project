from enum import Enum
from typing import List, Optional, Dict, Any
from uuid import UUID, uuid4
from datetime import datetime, timezone
from pydantic import BaseModel, Field


class AllocationStatus(str, Enum):
    PROPOSED = "PROPOSED"
    OFFERED = "OFFERED"
    RESERVED = "RESERVED"
    CONFIRMED = "CONFIRMED"
    COLLECTED = "COLLECTED"
    HANDED_OVER = "HANDED_OVER"
    DECLINED = "DECLINED"
    EXPIRED = "EXPIRED"
    CANCELLED = "CANCELLED"
    FAILED = "FAILED"
    PARTIALLY_ACCEPTED = "PARTIALLY_ACCEPTED"
    REJECTED_AT_HANDOVER = "REJECTED_AT_HANDOVER"


class AllocationItemResponse(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    plan_id: UUID
    listing_id: UUID
    food_item_id: UUID
    recipient_id: UUID
    recipient_name: str
    requested_kg: float
    allocated_kg: float
    confirmed_kg: Optional[float] = None
    status: AllocationStatus = AllocationStatus.PROPOSED
    reserved_at: Optional[datetime] = None
    expires_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class AllocationPlanResponse(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    listing_id: UUID
    food_item_id: UUID
    total_available_kg: float
    total_allocated_kg: float
    total_unallocated_kg: float
    unallocated_reason: Optional[str] = None
    optimizer_engine: str = "Google-OR-Tools / Deterministic-Simplex-v1"
    status: str = "ACTIVE"
    allocations: List[AllocationItemResponse] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class AllocationAcceptRequest(BaseModel):
    accepted_kg: Optional[float] = Field(None, gt=0, description="Leave null to accept full proposed quantity, or provide smaller quantity for partial accept")
    notes: Optional[str] = None


class AllocationDeclineRequest(BaseModel):
    reason: str = Field(..., min_length=3, description="Reason for declining (e.g. food received from another source, kitchen closed)")
