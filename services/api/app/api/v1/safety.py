import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from app.schemas.auth import AuthUser, UserRole
from app.security.auth import get_current_user, require_role, require_permission
from app.security.permissions import Permission
from app.schemas.listings import FoodListingResponse
from app.schemas.safety import (
    SafetyAssessmentResponse,
    SafetyReviewDecision,
    EvidenceReviewStatus,
    SpoilagePredictRequest,
    SpoilagePredictResponse,
)
from app.services.listings import LISTING_DATABASE
from app.services.safety_rules import (
    ASSESSMENT_DATABASE,
    evaluate_listing_safety,
    record_human_reviewer_decision,
    get_pending_safety_reviews,
    predict_bio_thermal_spoilage,
)

router = APIRouter(tags=["Safety & Evidence Assessment"])


@router.post("/listings/{listing_id}/assess", response_model=SafetyAssessmentResponse)
async def assess_listing_safety(
    listing_id: uuid.UUID,
    current_user: AuthUser = Depends(get_current_user),
) -> SafetyAssessmentResponse:
    """Run deterministic FSSAI food safety rules assessment on a listing."""
    listing = LISTING_DATABASE.get(listing_id)
    if not listing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Listing not found.")

    assessment = await evaluate_listing_safety(listing)
    return assessment


@router.get("/listings/{listing_id}/safety", response_model=SafetyAssessmentResponse)
async def get_listing_safety_assessment(
    listing_id: uuid.UUID,
    current_user: AuthUser = Depends(get_current_user),
) -> SafetyAssessmentResponse:
    """Get the safety evidence review record for a listing."""
    for assessment in ASSESSMENT_DATABASE.values():
        if assessment.listing_id == listing_id:
            return assessment

    # If not yet assessed, trigger it dynamically
    listing = LISTING_DATABASE.get(listing_id)
    if not listing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Listing not found.")

    return await evaluate_listing_safety(listing)


@router.get("/safety/review-queue", response_model=List[SafetyAssessmentResponse])
async def list_safety_review_queue(
    current_user: AuthUser = Depends(
        require_role([UserRole.SAFETY_REVIEWER, UserRole.COORDINATOR, UserRole.ADMIN])
    ),
) -> List[SafetyAssessmentResponse]:
    """Retrieve all safety assessments currently on hold or requiring manual clearance."""
    return get_pending_safety_reviews()


@router.post("/safety/reviews/{assessment_id}/decide", response_model=SafetyAssessmentResponse)
async def decide_safety_review(
    assessment_id: uuid.UUID,
    payload: SafetyReviewDecision,
    current_user: AuthUser = Depends(
        require_role([UserRole.SAFETY_REVIEWER, UserRole.COORDINATOR, UserRole.ADMIN])
    ),
) -> SafetyAssessmentResponse:
    """
    Authorized food safety specialist or coordinator action:
    Clear a safety hold, request clarification, or reject listing.
    """
    try:
        updated = await record_human_reviewer_decision(
            assessment_id=assessment_id,
            decision=payload,
            reviewer_id=current_user.id,
        )
        return updated
    except KeyError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assessment not found.")


@router.post("/safety/spoilage-predict", response_model=SpoilagePredictResponse)
async def predict_spoilage_window(
    payload: SpoilagePredictRequest,
) -> SpoilagePredictResponse:
    """
    AnnaRakshak AI — Predict dynamic bio-thermal spoilage decay, microbial growth risk,
    and safe transit radius under Indian tropical temperatures.
    """
    return predict_bio_thermal_spoilage(payload)

