from typing import List
from fastapi import APIRouter, Depends, Query, HTTPException, status
from app.schemas.auth import AuthUser
from app.security.auth import get_current_user
from app.schemas.impact import AuditLogResponse
from app.services.audit import get_audit_events

router = APIRouter(prefix="/audit", tags=["Security & Operations Audit Trail"])


@router.get("/logs", response_model=List[AuditLogResponse])
async def list_audit_logs(
    limit: int = Query(default=50, ge=1, le=200),
    current_user: AuthUser = Depends(get_current_user),
) -> List[AuditLogResponse]:
    """
    Retrieve tamper-evident audit history of privileged platform actions.
    Restricted to operations coordinators and administrators.
    """
    if current_user.role not in ["coordinator", "admin", "safety_reviewer"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access restricted to operations coordinators and reviewers.",
        )
    
    events = get_audit_events(limit=limit)
    return [
        AuditLogResponse(
            id=e.id,
            action=e.action,
            resource_type=e.resource_type,
            actor_id=e.actor_id,
            resource_id=e.resource_id,
            details=e.details,
            created_at=e.timestamp,
        )
        for e in events
    ]
