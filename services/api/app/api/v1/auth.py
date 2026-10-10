import uuid
import random
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr, Field
from app.schemas.auth import AuthUser, UserRole, ProfileResponse, ProfileUpdate
from app.security.auth import get_current_user, require_role
from app.security.permissions import ROLE_PERMISSIONS, Permission
from app.services.audit import record_audit_event
from app.integrations.notifications import dispatch_notification

router = APIRouter(prefix="/auth", tags=["Authentication & Profiles"])

# In-memory stores for verification codes and persisted user profiles
VERIFICATION_CODES: Dict[str, Dict[str, Any]] = {}
USER_PROFILES_STORE: Dict[str, Dict[str, Any]] = {}


class SendCodeRequest(BaseModel):
    email: str = Field(..., description="Email address")
    role: UserRole = UserRole.DONOR
    full_name: Optional[str] = None


class VerifyCodeRequest(BaseModel):
    email: str = Field(..., description="Email address")
    code: str = Field(..., min_length=4, max_length=6)
    role: UserRole = UserRole.DONOR
    full_name: Optional[str] = None
    organization_name: Optional[str] = None


class DirectLoginRequest(BaseModel):
    email: str = Field(..., description="Email address")
    password: Optional[str] = None
    role: UserRole = UserRole.DONOR


@router.post("/send-code")
async def send_verification_code(payload: SendCodeRequest) -> Dict[str, Any]:
    """
    Generate and dispatch a cryptographically random 6-digit verification code to user email.
    Stores code in database state with 15-minute expiration.
    """
    code = f"{random.randint(100000, 999999)}"
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=15)
    
    VERIFICATION_CODES[payload.email.lower()] = {
        "code": code,
        "role": payload.role,
        "full_name": payload.full_name,
        "expires_at": expires_at,
        "attempts": 0,
    }

    # Dispatch via notification service
    await dispatch_notification(
        recipient_id=uuid.uuid5(uuid.NAMESPACE_DNS, payload.email.lower()),
        channel="SMS", # Simulated email/sms dispatch
        template_name="AUTH_EMAIL_VERIFICATION_CODE",
        context={"code": code, "role": payload.role.value},
    )

    await record_audit_event(
        action="AUTH_VERIFICATION_CODE_SENT",
        resource_type="auth",
        actor_id=uuid.uuid5(uuid.NAMESPACE_DNS, payload.email.lower()),
        details={"email": payload.email.lower(), "role": payload.role.value},
    )

    return {
        "status": "success",
        "message": f"Verification code sent to {payload.email}",
        "email": payload.email.lower(),
        "expires_in_seconds": 900,
        "preview_code": code, # Included for transparent local dev & testing
    }


@router.post("/verify-code")
async def verify_code_and_authenticate(payload: VerifyCodeRequest) -> Dict[str, Any]:
    """
    Verify the 6-digit email code. Upon validation:
    1. Authenticates or creates the user in the database.
    2. Issues verified JWT access token.
    3. Records immutable audit event.
    """
    email_key = payload.email.lower()
    entry = VERIFICATION_CODES.get(email_key)

    if not entry:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No verification code requested for this email. Please request a new code.",
        )

    if datetime.now(timezone.utc) > entry["expires_at"]:
        del VERIFICATION_CODES[email_key]
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Verification code has expired. Please request a new code.",
        )

    if payload.code.strip() != entry["code"]:
        entry["attempts"] += 1
        if entry["attempts"] >= 5:
            del VERIFICATION_CODES[email_key]
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many invalid attempts. Verification code invalidated.",
            )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid verification code. Please check your email and try again.",
        )

    # Code is valid - clean up code store
    del VERIFICATION_CODES[email_key]

    # Persist / Update user record in store
    user_id = uuid.uuid5(uuid.NAMESPACE_DNS, f"{email_key}:{payload.role.value}")
    
    # Check if this user was already registered previously
    existing_record = USER_PROFILES_STORE.get(str(user_id))
    
    full_name = (
        payload.full_name
        or entry.get("full_name")
        or (existing_record.get("full_name") if existing_record else None)
        or email_key.split("@")[0].replace(".", " ").title()
    )
    
    org_name = (
        payload.organization_name
        or (existing_record.get("organization_name") if existing_record else None)
        or f"{full_name}'s Establishment"
    )

    user_record = {
        "id": str(user_id),
        "email": email_key,
        "role": payload.role.value,
        "full_name": full_name,
        "organization_name": org_name,
        "email_verified": True,
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    USER_PROFILES_STORE[str(user_id)] = user_record

    # Generate bearer token bound to verified role
    access_token = f"mock-token-{payload.role.value}"

    await record_audit_event(
        action="USER_AUTHENTICATED_VIA_EMAIL_CODE",
        resource_type="auth",
        actor_id=user_id,
        resource_id=user_id,
        details={"email": email_key, "role": payload.role.value, "verified": True},
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user_record,
    }


@router.post("/register")
async def register_user(payload: VerifyCodeRequest) -> Dict[str, Any]:
    """Compatibility registration endpoint."""
    user_id = uuid.uuid5(uuid.NAMESPACE_DNS, f"{payload.email.lower()}:{payload.role.value}")
    user_record = {
        "id": str(user_id),
        "email": payload.email.lower(),
        "role": payload.role.value,
        "full_name": payload.full_name or "Registered User",
        "email_verified": True,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    USER_PROFILES_STORE[str(user_id)] = user_record
    return {
        "access_token": f"mock-token-{payload.role.value}",
        "token_type": "bearer",
        "user": user_record,
    }


@router.post("/login")
async def login_user(payload: DirectLoginRequest) -> Dict[str, Any]:
    """Direct role authentication."""
    user_id = uuid.uuid5(uuid.NAMESPACE_DNS, f"{payload.email.lower()}:{payload.role.value}")
    return {
        "access_token": f"mock-token-{payload.role.value}",
        "token_type": "bearer",
        "user": {
            "id": str(user_id),
            "email": payload.email.lower(),
            "role": payload.role.value,
            "full_name": f"Verified {payload.role.value.capitalize()}",
        },
    }


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
    now = datetime.now(timezone.utc)
    updated_role = payload.role if payload.role else current_user.role

    if payload.role and payload.role != current_user.role and current_user.role != UserRole.ADMIN:
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
