from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.security import SecurityAndRateLimitMiddleware
from app.core.telemetry import logger
from app.api.v1.router import api_v1_router
from app.schemas.health import HealthResponse

app = FastAPI(
    title=settings.app_name,
    version="0.1.0",
    description="AnnaSetu AI — Backend API & Agentic Coordination Engine",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Apply OWASP security headers and rate limiting
app.add_middleware(SecurityAndRateLimitMiddleware)

# CORS configuration for web operations dashboard and mobile app clients
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Restrict to specific domains in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Root health check endpoint for container/orchestrator liveness
@app.get("/health", response_model=HealthResponse, tags=["Health"])
async def root_health_check() -> HealthResponse:
    return HealthResponse(
        status="ok",
        version="0.1.0",
        environment=settings.environment,
        engine="AnnaSetu AI Core"
    )

# Versioned API routes
app.include_router(api_v1_router, prefix="/v1")
