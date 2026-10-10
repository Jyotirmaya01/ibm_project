from typing import Dict, Any, List, Optional
from uuid import UUID, uuid4
from datetime import datetime, timezone
from pydantic import BaseModel, Field


class ImpactSummaryResponse(BaseModel):
    total_listings_created: int = 0
    total_food_rescued_kg: float = Field(0.0, description="Strictly verified delivered kilograms only")
    meals_served: int = Field(0, description="Delivered meals calculated at ~350g portion per person")
    co2_mitigated_kg: float = Field(0.0, description="Estimated kg CO2 equivalent greenhouse gas emissions avoided (2.5x factor)")
    water_saved_liters: float = Field(0.0, description="Estimated liters of embedded agricultural water preserved (800L/kg)")
    active_recipient_organizations: int = 0
    active_missions_count: int = 0
    verification_rate_pct: float = Field(100.0, description="Percentage of scheduled handovers successfully inspected and accepted")
    breakdown_by_status: Dict[str, float] = Field(default_factory=dict)
    calculated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class AuditLogResponse(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    action: str
    resource_type: str
    actor_id: Optional[UUID] = None
    resource_id: Optional[UUID] = None
    details: Dict[str, Any] = Field(default_factory=dict)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
