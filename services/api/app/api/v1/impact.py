from typing import List, Optional
from fastapi import APIRouter, HTTPException, status
from app.schemas.impact import (
    ImpactSummaryResponse,
    ESGCertificateRequest,
    ESGCertificateResponse,
)
from app.services.impact import (
    calculate_verified_impact_summary,
    generate_verified_esg_certificate,
    get_all_esg_certificates,
    get_esg_certificate_by_id,
)

router = APIRouter(prefix="/impact", tags=["Verified Impact Engine"])


@router.get("/summary", response_model=ImpactSummaryResponse)
async def get_impact_summary() -> ImpactSummaryResponse:
    """
    Publicly accessible summary of genuine, verified meals delivered.
    Grounded strictly on physical handover confirmations and FSSAI inspection acknowledgments.
    """
    return calculate_verified_impact_summary()


@router.post("/certificate", response_model=ESGCertificateResponse)
async def create_esg_certificate(req: ESGCertificateRequest) -> ESGCertificateResponse:
    """
    AnnaSetu AI — Generate verifiable ESG Food Rescue & Carbon Credit Certificate.
    Includes SHA-256 cryptographic verification seal and QR code payload.
    """
    return generate_verified_esg_certificate(req)


@router.get("/certificates", response_model=List[ESGCertificateResponse])
async def list_esg_certificates() -> List[ESGCertificateResponse]:
    """List all issued ESG Food Rescue & Carbon Credit Certificates."""
    return get_all_esg_certificates()


@router.get("/certificate/{certificate_id}", response_model=ESGCertificateResponse)
async def get_esg_certificate(certificate_id: str) -> ESGCertificateResponse:
    """Retrieve an ESG Certificate by its unique Certificate ID."""
    cert = get_esg_certificate_by_id(certificate_id)
    if not cert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Certificate '{certificate_id}' not found.",
        )
    return cert

