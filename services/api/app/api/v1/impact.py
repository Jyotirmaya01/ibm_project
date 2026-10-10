from fastapi import APIRouter
from app.schemas.impact import ImpactSummaryResponse
from app.services.impact import calculate_verified_impact_summary

router = APIRouter(prefix="/impact", tags=["Verified Impact Engine"])


@router.get("/summary", response_model=ImpactSummaryResponse)
async def get_impact_summary() -> ImpactSummaryResponse:
    """
    Publicly accessible summary of genuine, verified meals delivered.
    Grounded strictly on physical handover confirmations and FSSAI inspection acknowledgments.
    """
    return calculate_verified_impact_summary()
