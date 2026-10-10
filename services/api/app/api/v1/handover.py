import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from app.schemas.auth import AuthUser
from app.security.auth import get_current_user
from app.schemas.handover import (
    HandoverSessionCreate,
    HandoverSessionResponse,
    DriverDispatchRequest,
    HandoverVerifyRequest,
)
from app.services.handover import (
    create_handover_session,
    assign_volunteer_driver,
    verify_handover_outcome,
    HANDOVER_DATABASE,
)

router = APIRouter(prefix="/handover", tags=["Handover & Verification Engine"])


@router.post("/sessions", response_model=HandoverSessionResponse, status_code=status.HTTP_201_CREATED)
async def create_session(
    payload: HandoverSessionCreate,
    current_user: AuthUser = Depends(get_current_user),
) -> HandoverSessionResponse:
    """Create a scheduled handover session with secure verification OTP."""
    return await create_handover_session(payload=payload, actor_id=current_user.id)


@router.get("/sessions/{session_id}", response_model=HandoverSessionResponse)
async def get_session(
    session_id: uuid.UUID,
    current_user: AuthUser = Depends(get_current_user),
) -> HandoverSessionResponse:
    """Inspect status of a scheduled handover session."""
    session = HANDOVER_DATABASE.get(session_id)
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Handover session not found.")
    return session


@router.get("/sessions", response_model=List[HandoverSessionResponse])
async def list_sessions(
    current_user: AuthUser = Depends(get_current_user),
) -> List[HandoverSessionResponse]:
    """List all scheduled and active handover sessions."""
    return list(HANDOVER_DATABASE.values())


@router.post("/sessions/{session_id}/dispatch-driver", response_model=HandoverSessionResponse)
async def dispatch_driver(
    session_id: uuid.UUID,
    payload: DriverDispatchRequest,
    current_user: AuthUser = Depends(get_current_user),
) -> HandoverSessionResponse:
    """Assign an authorized volunteer driver for food collection and transit."""
    try:
        updated = await assign_volunteer_driver(session_id=session_id, payload=payload, actor_id=current_user.id)
        return updated
    except KeyError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Handover session not found.")


@router.post("/sessions/{session_id}/verify", response_model=HandoverSessionResponse)
async def verify_handover(
    session_id: uuid.UUID,
    payload: HandoverVerifyRequest,
    current_user: AuthUser = Depends(get_current_user),
) -> HandoverSessionResponse:
    """
    Authenticate delivery:
    1. Validates physical OTP code.
    2. Mandatory physical inspection affirmation.
    3. Confirms accepted delivered kg.
    """
    try:
        verified = await verify_handover_outcome(
            session_id=session_id,
            payload=payload,
            current_user=current_user,
        )
        return verified
    except KeyError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Handover session not found.")
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
