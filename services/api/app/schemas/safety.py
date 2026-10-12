from enum import Enum
from typing import List, Optional, Dict, Any
from uuid import UUID, uuid4
from datetime import datetime, timezone
from pydantic import BaseModel, Field


class EvidenceReviewStatus(str, Enum):
    INCOMPLETE = "INCOMPLETE"
    PENDING_ASSESSMENT = "PENDING_ASSESSMENT"
    NEEDS_CLARIFICATION = "NEEDS_CLARIFICATION"
    PENDING_HUMAN_REVIEW = "PENDING_HUMAN_REVIEW"
    ELIGIBLE_UNDER_RULES = "ELIGIBLE_UNDER_RULES"
    ON_HOLD = "ON_HOLD"
    REJECTED_BY_RULE = "REJECTED_BY_RULE"
    WITHDRAWN = "WITHDRAWN"


class SafetyObservation(BaseModel):
    category: str = Field(..., description="e.g. image_clarity, container_hygiene, temperature_holding, time_window")
    indicator: str
    severity: str = Field(default="info", description="info, warning, critical")
    details: str


class SafetyAssessmentResponse(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    listing_id: UUID
    status: EvidenceReviewStatus
    rule_version: str = "FSSAI-SURPLUS-2019-V1.2"
    model_name: Optional[str] = "AnnaSetu-Vision-Adapter-v1"
    observations: List[SafetyObservation] = Field(default_factory=list)
    missing_fields: List[str] = Field(default_factory=list)
    risk_indicators: List[str] = Field(default_factory=list)
    reviewer_notes: Optional[str] = None
    reviewed_by: Optional[UUID] = None
    assessed_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    limitations_disclaimer: str = (
        "Notice: Image assessment evaluates visible completeness and indicators only. "
        "It does not and cannot certify microbiological safety. Physical inspection by recipient at handover is required."
    )


class SafetyReviewDecision(BaseModel):
    decision: EvidenceReviewStatus = Field(..., description="ELIGIBLE_UNDER_RULES, ON_HOLD, or REJECTED_BY_RULE")
    notes: str = Field(..., min_length=3, description="Reviewer justification and recorded findings")


class SpoilagePredictRequest(BaseModel):
    food_category: str = Field(default="Cooked Rice & Grains", description="Category: Cooked Rice & Grains, Dairy & Paneer Gravy, Dal & Legumes, Fried/Dry Snacks, Sweets/Desserts")
    ambient_temp_celsius: float = Field(default=28.0, ge=-10.0, le=60.0, description="Current ambient temperature in Celsius")
    storage_condition: str = Field(default="HOT_INSULATED", description="Storage: HOT_INSULATED, ROOM_TEMPERATURE, REFRIGERATED")
    hours_since_prep: float = Field(default=1.5, ge=0.0, le=48.0, description="Hours elapsed since cooking/preparation")


class SpoilagePredictResponse(BaseModel):
    food_category: str
    ambient_temp_celsius: float
    storage_condition: str
    hours_since_prep: float
    safe_window_minutes_remaining: int
    decay_risk_level: str = Field(description="OPTIMAL, MODERATE, CRITICAL, or EXPIRED")
    microbial_risk_score: float = Field(description="Risk index from 0.0 (safest) to 100.0 (spoiled)")
    danger_zone_active: bool = Field(description="True if temperature sits in FSSAI danger zone (5C - 60C)")
    max_recommended_transit_radius_km: float
    fssai_guideline_reference: str
    recommended_action: str

