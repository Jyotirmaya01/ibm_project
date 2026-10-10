import uuid
from typing import Dict, Any, List
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from app.schemas.auth import AuthUser, UserRole, ProfileResponse, ProfileUpdate
from app.security.auth import get_current_user, require_role
from app.security.permissions import ROLE_PERMISSIONS, Permission
from app.services.audit import record_audit_event

router = APIRouter(prefix="/auth", tags=["Authentication & Profiles"])


@router.get("/me")
async def get_current_user_profile(
    current_user: AuthUser = Depends(get_current_user),
) -> Dict[str, Any]:
    """Retrieve current authenticated user context, role, and authorized permissions."""
    permissions = [p.value for p in ROLE_PERMISSIONS.get(current_user.role, set())]
    return {
        "id": str(current_user.id),
        "email": current_user.email,
        "role": current_user.role.value,
        "full_name": current_user.full_name,
        "permissions": permissions,
    }


@router.post("/profile", response_model=ProfileResponse)
async def update_profile(
    payload: ProfileUpdate,
    current_user: AuthUser = Depends(get_current_user),
) -> ProfileResponse:
    """Update profile information for the authenticated user."""
    # When role change is attempted, only admins can change role, or user during onboarding
    now = datetime.now(timezone.utc)
    updated_role = payload.role if payload.role else current_user.role

    if payload.role and payload.role != current_user.role and current_user.role != UserRole.ADMIN:
        # Non-admin attempting privileged role escalation
        if payload.role in [UserRole.ADMIN, UserRole.COORDINATOR, UserRole.SAFETY_REVIEWER]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Privileged roles (Admin, Coordinator, Safety Reviewer) require authorized approval.",
            )

    await record_audit_event(
        action="PROFILE_UPDATED",
        resource_type="profile",
        actor_id=current_user.id,
        resource_id=current_user.id,
        details={"new_role": updated_role.value, "full_name": payload.full_name},
    )

    return ProfileResponse(
        id=current_user.id,
        full_name=payload.full_name or current_user.full_name or "Anonymous User",
        phone_number=payload.phone_number,
        phone_verified=False,
        role=updated_role,
        created_at=now,
        updated_at=now,
    )
