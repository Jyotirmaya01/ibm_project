from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from app.schemas.auth import AuthUser
from app.security.auth import get_current_user
from app.agent.graph import (
    execute_mission_workflow,
    resume_mission_after_review,
    MISSION_RUN_DATABASE,
)

router = APIRouter(prefix="/agent", tags=["Agentic Coordination Engine"])


class ResumeMissionRequest(BaseModel):
    notes: Optional[str] = "Approved by operations coordinator after secondary verification."


@router.post("/missions/start/{listing_id}")
async def start_mission(
    listing_id: str,
    current_user: AuthUser = Depends(get_current_user),
) -> Dict[str, Any]:
    """
    Launch autonomous agentic workflow for a surplus food listing.
    The LangGraph engine executes intake verification, FSSAI safety rules,
    demand discovery, mathematical optimization, and outreach coordination.
    """
    try:
        final_state = await execute_mission_workflow(listing_id)
        return final_state
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Agent workflow error: {str(e)}",
        )


@router.get("/missions/{mission_id}")
async def get_mission_status(
    mission_id: str,
    current_user: AuthUser = Depends(get_current_user),
) -> Dict[str, Any]:
    """Retrieve full execution state and step-by-step audit trace of an agent mission."""
    mission = MISSION_RUN_DATABASE.get(mission_id)
    if not mission:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Mission not found.")
    return mission


@router.get("/missions")
async def list_missions(
    current_user: AuthUser = Depends(get_current_user),
) -> List[Dict[str, Any]]:
    """List all agent missions and their current execution stages."""
    return list(MISSION_RUN_DATABASE.values())


@router.post("/missions/{mission_id}/resume")
async def resume_mission(
    mission_id: str,
    payload: ResumeMissionRequest,
    current_user: AuthUser = Depends(get_current_user),
) -> Dict[str, Any]:
    """
    Coordinator resolves a human checkpoint (e.g. overrides a safety hold or assigns transport)
    and resumes autonomous execution.
    """
    try:
        resumed = await resume_mission_after_review(mission_id, supervisor_notes=payload.notes or "")
        return resumed
    except KeyError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Mission not found.")
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
