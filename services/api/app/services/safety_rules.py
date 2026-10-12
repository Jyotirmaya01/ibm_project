import uuid
from typing import Dict, List, Optional
from datetime import datetime, timezone, timedelta
from app.schemas.listings import FoodListingResponse, ListingStatus
from app.schemas.safety import (
    EvidenceReviewStatus,
    SafetyAssessmentResponse,
    SafetyObservation,
    SafetyReviewDecision,
    SpoilagePredictRequest,
    SpoilagePredictResponse,
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


def predict_bio_thermal_spoilage(req: SpoilagePredictRequest) -> SpoilagePredictResponse:
    """
    AnnaRakshak AI — Bio-Thermal Food Spoilage Decay & Microbe Risk Engine.
    Grounds safety calculations on FSSAI Surplus Food Regulations (2019) &
    Arrhenius microbial kinetics in tropical Indian ambient conditions.
    """
    category = req.food_category.lower()
    temp = req.ambient_temp_celsius
    storage = req.storage_condition.upper()
    hours_elapsed = max(0.0, req.hours_since_prep)

    # Base shelf life in hours under ideal conditions
    if "dairy" in category or "paneer" in category or "gravy" in category:
        base_shelf_life_hours = 4.0
        vulnerability_factor = 1.6
    elif "dal" in category or "lentil" in category:
        base_shelf_life_hours = 5.0
        vulnerability_factor = 1.3
    elif "rice" in category or "grain" in category:
        base_shelf_life_hours = 5.5
        vulnerability_factor = 1.2
    elif "sweet" in category or "dessert" in category:
        base_shelf_life_hours = 7.0
        vulnerability_factor = 1.0
    elif "snack" in category or "dry" in category or "fried" in category:
        base_shelf_life_hours = 12.0
        vulnerability_factor = 0.6
    else:
        base_shelf_life_hours = 4.5
        vulnerability_factor = 1.2

    # Storage condition temperature modification
    danger_zone = False
    effective_temp = temp

    if "HOT" in storage or "INSULATED" in storage:
        effective_temp = 65.0
        danger_zone = False
        decay_multiplier = 0.45  # Pathogens inhibited above 63°C
        max_holding_limit = 6.0
    elif "COLD" in storage or "REFRIGERATED" in storage:
        effective_temp = 4.0
        danger_zone = False
        decay_multiplier = 0.25  # Psychrotrophic growth slowed
        max_holding_limit = 18.0
    else:  # ROOM_TEMPERATURE
        danger_zone = 5.0 <= temp <= 60.0
        # Danger zone accelerates exponentially when temp > 25°C
        if temp >= 32.0:
            decay_multiplier = 1.8 * vulnerability_factor
        elif temp >= 25.0:
            decay_multiplier = 1.3 * vulnerability_factor
        else:
            decay_multiplier = 1.0 * vulnerability_factor
        max_holding_limit = base_shelf_life_hours / decay_multiplier

    # Calculate effective consumed hours and remaining minutes
    effective_consumed_hours = hours_elapsed * decay_multiplier
    remaining_hours = max_holding_limit - effective_consumed_hours
    remaining_minutes = max(0, int(round(remaining_hours * 60)))

    # Compute microbial risk score (0 to 100)
    risk_score = min(100.0, round((effective_consumed_hours / max(0.1, max_holding_limit)) * 100.0, 1))

    if remaining_minutes <= 0:
        decay_risk = "EXPIRED"
        risk_score = 100.0
        max_radius_km = 0.0
        recommendation = "Do NOT distribute. Food has exceeded the safe microbial limit. Divert to biogas or composting."
    elif risk_score >= 75.0 or remaining_minutes < 45:
        decay_risk = "CRITICAL"
        max_radius_km = round(min(5.0, (remaining_minutes / 60) * 15.0), 1)
        recommendation = "Immediate priority dispatch required. Limit transit to hyper-local radius (<5 km). Reheat to >75°C prior to consumption."
    elif risk_score >= 40.0 or remaining_minutes < 120:
        decay_risk = "MODERATE"
        max_radius_km = round(min(12.0, (remaining_minutes / 60) * 20.0), 1)
        recommendation = "Safe for distribution. Dispatch within 30 minutes. Maintain covered, hygienic transit."
    else:
        decay_risk = "OPTIMAL"
        max_radius_km = round(min(25.0, (remaining_minutes / 60) * 25.0), 1)
        recommendation = "High freshness grade. Safe for standard dispatch and multi-ashram allocation."

    return SpoilagePredictResponse(
        food_category=req.food_category,
        ambient_temp_celsius=req.ambient_temp_celsius,
        storage_condition=req.storage_condition,
        hours_since_prep=req.hours_since_prep,
        safe_window_minutes_remaining=remaining_minutes,
        decay_risk_level=decay_risk,
        microbial_risk_score=risk_score,
        danger_zone_active=danger_zone,
        max_recommended_transit_radius_km=max_radius_km,
        fssai_guideline_reference="FSSAI Surplus Food Regs Section 4.2 (Temp Danger Zone: 5°C - 60°C)",
        recommended_action=recommendation,
    )

