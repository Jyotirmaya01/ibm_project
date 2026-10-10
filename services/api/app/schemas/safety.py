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
