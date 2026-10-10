from enum import Enum
from typing import Optional, List
from uuid import UUID
from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime


class UserRole(str, Enum):
    DONOR = "donor"
    RECIPIENT = "recipient"
    VOLUNTEER = "volunteer"
    COORDINATOR = "coordinator"
    SAFETY_REVIEWER = "safety_reviewer"
    ADMIN = "admin"


class ProfileBase(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=100)
    phone_number: Optional[str] = Field(None, max_length=20)
    role: UserRole = Field(default=UserRole.DONOR)


class ProfileCreate(ProfileBase):
    pass


class ProfileUpdate(BaseModel):
    full_name: Optional[str] = Field(None, min_length=2, max_length=100)
    phone_number: Optional[str] = Field(None, max_length=20)
    role: Optional[UserRole] = None


class ProfileResponse(ProfileBase):
    id: UUID
    phone_verified: bool = False
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class OrganizationBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=150)
    type: str = Field(..., description="ashram, orphanage, shelter, community_kitchen, caterer, hotel, etc.")
    address: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None


class OrganizationCreate(OrganizationBase):
    pass


class OrganizationResponse(OrganizationBase):
    id: UUID
    verification_status: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class OrganizationMemberResponse(BaseModel):
    id: UUID
    organization_id: UUID
    profile_id: UUID
    role_in_org: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AuthUser(BaseModel):
    """Authenticated user context extracted from JWT or session."""
    id: UUID
    email: Optional[str] = None
    role: UserRole = UserRole.DONOR
    full_name: Optional[str] = None
    organization_ids: List[UUID] = Field(default_factory=list)
