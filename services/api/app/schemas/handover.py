from enum import Enum
from typing import Optional, List
from uuid import UUID, uuid4
from datetime import datetime, timezone
from pydantic import BaseModel, Field


class HandoverStatus(str, Enum):
    SCHEDULED = "SCHEDULED"
    DRIVER_ASSIGNED = "DRIVER_ASSIGNED"
    ARRIVED_FOR_PICKUP = "ARRIVED_FOR_PICKUP"
    INSPECTION_PENDING = "INSPECTION_PENDING"
    VERIFIED_DELIVERED = "VERIFIED_DELIVERED"
    PARTIALLY_DELIVERED = "PARTIALLY_DELIVERED"
    REJECTED_AT_HANDOVER = "REJECTED_AT_HANDOVER"
    CANCELLED = "CANCELLED"


class HandoverSessionCreate(BaseModel):
    allocation_id: UUID
    listing_id: UUID
    recipient_id: UUID
    volunteer_id: Optional[UUID] = None
    scheduled_time: Optional[datetime] = None


class DriverDispatchRequest(BaseModel):
    volunteer_id: UUID
    vehicle_type: str = Field(default="two_wheeler", description="two_wheeler, three_wheeler, auto, mini_truck")
    estimated_arrival_minutes: int = Field(default=25, ge=5, le=180)
    contact_phone_masked: str = "+91 98XXX XXXXX"


class HandoverVerifyRequest(BaseModel):
    otp_code: str = Field(..., min_length=4, max_length=6, description="4 or 6-digit one-time verification PIN")
    actual_delivered_kg: float = Field(..., gt=0, description="Actual physical quantity weighed and accepted")
    visual_inspection_passed: bool = Field(..., description="Mandatory physical confirmation of smell, cleanliness, and container integrity")
    temperature_celsius: Optional[float] = Field(None, description="Optional probe temperature reading at handover")
    recipient_notes: Optional[str] = None


class HandoverSessionResponse(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    allocation_id: UUID
    listing_id: UUID
    recipient_id: UUID
    volunteer_id: Optional[UUID] = None
    status: HandoverStatus = HandoverStatus.SCHEDULED
    otp_code: str = Field(description="One-time secure PIN generated for recipient presentation")
    scheduled_time: datetime
    actual_delivered_kg: Optional[float] = None
    visual_inspection_passed: Optional[bool] = None
    temperature_celsius: Optional[float] = None
    recipient_notes: Optional[str] = None
    verified_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class ChatMessageCreate(BaseModel):
    content: str = Field(..., min_length=1, max_length=1000)


class ChatMessageResponse(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    conversation_id: UUID
    sender_id: UUID
    sender_role: str
    sender_name: str
    content: str
    sent_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class ConversationResponse(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    listing_id: UUID
    participants: List[UUID]
    messages: List[ChatMessageResponse] = []
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
