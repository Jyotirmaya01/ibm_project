from fastapi import APIRouter
from app.api.v1.health import router as health_router
from app.api.v1.auth import router as auth_router
from app.api.v1.organizations import router as org_router
from app.api.v1.listings import router as listings_router
from app.api.v1.safety import router as safety_router
from app.api.v1.recipients import router as recipients_router

api_v1_router = APIRouter()
api_v1_router.include_router(health_router)
api_v1_router.include_router(auth_router)
api_v1_router.include_router(org_router)
api_v1_router.include_router(listings_router)
api_v1_router.include_router(safety_router)
api_v1_router.include_router(recipients_router)
