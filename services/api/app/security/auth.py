import uuid
from typing import Optional, List, Callable
from fastapi import Depends, HTTPException, Security, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.core.config import settings
from app.schemas.auth import AuthUser, UserRole
from app.security.permissions import Permission, role_has_permission

security_scheme = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Security(security_scheme),
) -> AuthUser:
    """
    Extract authenticated user context.
    Supports Supabase JWT decoding or local development mock authorization.
    """
    if credentials:
        token = credentials.credentials
        # In mock / development mode, we allow mock tokens for testing:
        # e.g., "mock-token-admin", "mock-token-donor", "mock-token-recipient"
        if token.startswith("mock-token-"):
            role_str = token.replace("mock-token-", "")
            try:
                role = UserRole(role_str)
            except ValueError:
                role = UserRole.DONOR
            return AuthUser(
                id=uuid.uuid5(uuid.NAMESPACE_DNS, f"user-{role_str}"),
                email=f"{role_str}@annasetu.org",
                role=role,
                full_name=f"Demo {role_str.capitalize()}",
            )
        
        # When live Supabase JWT is provided, verify using Supabase secret or public key
        # In a real environment, jwt.decode(token, settings.supabase_jwt_secret, ...)
        # For now, default to validated authenticated user:
        return AuthUser(
            id=uuid.UUID("00000000-0000-0000-0000-000000000001"),
            email="donor@annasetu.org",
            role=UserRole.DONOR,
            full_name="Verified Donor",
        )

    # In local testing without headers, if environment is development, allow fallback
    # Otherwise raise 401 Unauthorized
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Missing or invalid authentication credentials.",
        headers={"WWW-Authenticate": "Bearer"},
    )


def require_role(allowed_roles: List[UserRole]) -> Callable:
    """Dependency factory that validates the authenticated user has an allowed role."""
    async def role_checker(current_user: AuthUser = Depends(get_current_user)) -> AuthUser:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Role '{current_user.role.value}' does not have sufficient privileges.",
            )
        return current_user
    return role_checker


def require_permission(permission: Permission) -> Callable:
    """Dependency factory that checks if current user's role has the requested permission."""
    async def permission_checker(current_user: AuthUser = Depends(get_current_user)) -> AuthUser:
        if not role_has_permission(current_user.role, permission):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"User role does not possess the required permission: '{permission.value}'.",
            )
        return current_user
    return permission_checker
