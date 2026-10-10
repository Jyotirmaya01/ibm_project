from fastapi import APIRouter
from app.core.config import settings
from app.schemas.health import HealthResponse

router = APIRouter(tags=["Health"])


@router.get("/health", response_model=HealthResponse)
async def health_check() -> HealthResponse:
    """Return health status of the AnnaSetu API service."""
    return HealthResponse(
        status="ok",
        version="0.1.0",
        environment=settings.environment,
        engine="AnnaSetu AI Core"
    )
