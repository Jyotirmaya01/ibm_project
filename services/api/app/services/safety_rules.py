import uuid
from typing import Dict, List, Optional
from datetime import datetime, timezone, timedelta
from app.schemas.listings import FoodListingResponse, ListingStatus
from app.schemas.safety import (
    EvidenceReviewStatus,
    SafetyAssessmentResponse,
    SafetyObservation,
    SafetyReviewDecision,
)
from app.integrations.vision_adapter import vision_adapter
from app.services.audit import record_audit_event

CURRENT_FSSAI_RULE_VERSION = "FSSAI-SURPLUS-2019-V1.2"

# In-memory safety assessment repository
ASSESSMENT_DATABASE: Dict[uuid.UUID, SafetyAssessmentResponse] = {}


async def evaluate_listing_safety(listing: FoodListingResponse) -> SafetyAssessmentResponse:
    """
    Evaluate food safety evidence deterministically against FSSAI guidelines:
    1. Check presence of compulsory photos.
    2. Check elapsed holding time against storage condition limits.
    3. Detect missing or ambiguous handling disclosures.
    """
    now = datetime.now(timezone.utc)
    observations: List[SafetyObservation] = []
    missing_fields: List[str] = []
    risk_indicators: List[str] = []
    status = EvidenceReviewStatus.ELIGIBLE_UNDER_RULES

    # 1. Compulsory photo check
    if not listing.photos:
        missing_fields.append("dish_photographs")
        risk_indicators.append("no_visual_evidence")
        status = EvidenceReviewStatus.INCOMPLETE
        observations.append(
            SafetyObservation(
                category="image_clarity",
                indicator="missing_photos",
                severity="critical",
                details="At least one dish photograph is required by rule.",
            )
        )
    else:
        photo_paths = [p.storage_path for p in listing.photos]
        vision_obs = await vision_adapter.analyze_food_photos(photo_paths)
        observations.extend(vision_obs)

    # 2. Time & Temperature Evaluation per item
    for item in listing.items:
        # Time difference from preparation to pickup window end
        prep_time = item.preparation_time
        if prep_time.tzinfo is None:
            prep_time = prep_time.replace(tzinfo=timezone.utc)
            
        elapsed_delta = listing.pickup_window_end - prep_time
        elapsed_hours = elapsed_delta.total_seconds() / 3600.0

        if item.is_perishable:
            if item.storage_condition == "room_temperature":
                # FSSAI limit: 4 hours maximum at ambient temperature for cooked food
                if elapsed_hours > 4.0:
                    risk_indicators.append(
                        f"ambient_holding_exceeded: '{item.name}' pickup window end is {elapsed_hours:.1f}h from prep (max 4h permitted)."
                    )
                    status = EvidenceReviewStatus.ON_HOLD
                    observations.append(
                        SafetyObservation(
                            category="time_window",
                            indicator="ambient_holding_limit_exceeded",
                            severity="critical",
                            details=f"Perishable dish '{item.name}' exceeds safe ambient duration (4 hours limit).",
                        )
                    )
            elif item.storage_condition == "hot_held":
                # Up to 6 hours if maintained continuously hot (> 65°C)
                if elapsed_hours > 6.0:
                    risk_indicators.append(
                        f"hot_holding_exceeded: '{item.name}' pickup window end is {elapsed_hours:.1f}h from prep (max 6h permitted)."
                    )
                    status = EvidenceReviewStatus.ON_HOLD
            elif item.storage_condition == "refrigerated":
                # Up to 24 hours if maintained chilled (< 5°C)
                if elapsed_hours > 24.0:
                    risk_indicators.append(
                        f"cold_holding_exceeded: '{item.name}' pickup window end is {elapsed_hours:.1f}h from prep."
                    )
                    status = EvidenceReviewStatus.ON_HOLD

        # Handling history disclosure
        if not item.handling_history:
            missing_fields.append(f"handling_history_for_{item.name}")
            observations.append(
                SafetyObservation(
                    category="handling_disclosure",
                    indicator="missing_handling_history",
                    severity="warning",
                    details=f"No handling or reheating history provided for '{item.name}'.",
                )
            )

    # 3. Formulate Assessment Record
    assessment_id = uuid.uuid4()
    assessment = SafetyAssessmentResponse(
        id=assessment_id,
        listing_id=listing.id,
        status=status,
        rule_version=CURRENT_FSSAI_RULE_VERSION,
        model_name="AnnaSetu-Evidence-Engine-v1",
        observations=observations,
        missing_fields=missing_fields,
        risk_indicators=risk_indicators,
        assessed_at=now,
    )
    ASSESSMENT_DATABASE[assessment_id] = assessment

    await record_audit_event(
        action="SAFETY_ASSESSMENT_COMPLETED",
        resource_type="safety_assessment",
        resource_id=assessment_id,
        details={
            "listing_id": str(listing.id),
            "status": status.value,
            "risk_count": len(risk_indicators),
        },
    )

    return assessment


async def record_human_reviewer_decision(
    assessment_id: uuid.UUID,
    decision: SafetyReviewDecision,
    reviewer_id: uuid.UUID,
) -> SafetyAssessmentResponse:
    """
    Allow an authorized food safety reviewer or coordinator to resolve holds
    or reject listings with a recorded justification.
    """
    assessment = ASSESSMENT_DATABASE.get(assessment_id)
    if not assessment:
        raise KeyError(f"Assessment '{assessment_id}' not found.")

    assessment.status = decision.decision
    assessment.reviewer_notes = decision.notes
    assessment.reviewed_by = reviewer_id

    await record_audit_event(
        action="SAFETY_REVIEW_DECIDED",
        resource_type="safety_assessment",
        actor_id=reviewer_id,
        resource_id=assessment_id,
        details={
            "new_status": decision.decision.value,
            "notes": decision.notes,
        },
    )

    return assessment


def get_pending_safety_reviews() -> List[SafetyAssessmentResponse]:
    """Retrieve all assessments currently on hold or needing clarification."""
    return [
        a for a in ASSESSMENT_DATABASE.values()
        if a.status in [EvidenceReviewStatus.ON_HOLD, EvidenceReviewStatus.NEEDS_CLARIFICATION, EvidenceReviewStatus.PENDING_HUMAN_REVIEW]
    ]
