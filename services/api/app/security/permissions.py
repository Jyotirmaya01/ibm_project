from enum import Enum
from typing import Set, Dict
from app.schemas.auth import UserRole


class Permission(str, Enum):
    # Donor
    CREATE_LISTING = "listing:create"
    UPDATE_OWN_LISTING = "listing:update_own"
    VIEW_OWN_LISTINGS = "listing:view_own"
    
    # Recipient
    VIEW_AVAILABLE_LISTINGS = "listing:view_available"
    SUBMIT_CAPACITY_SNAPSHOT = "capacity:submit"
    RESPOND_ALLOCATION = "allocation:respond"
    CONFIRM_HANDOVER = "handover:confirm"
    
    # Volunteer
    VIEW_ASSIGNED_PICKUPS = "pickup:view_assigned"
    UPDATE_PICKUP_STATUS = "pickup:update_status"
    
    # Safety Reviewer
    VIEW_EVIDENCE_QUEUE = "safety:view_queue"
    CLEAR_SAFETY_REVIEW = "safety:clear_review"
    FLAG_SAFETY_HOLD = "safety:flag_hold"
    
    # Coordinator
    VIEW_OPERATIONS = "operations:view"
    VERIFY_ORGANIZATION = "org:verify"
    VIEW_ALL_ALLOCATIONS = "allocation:view_all"
    
    # Admin
    MANAGE_ROLES = "admin:manage_roles"
    VIEW_AUDIT_LOGS = "admin:view_audit"
    SYSTEM_CONFIG = "admin:config"


ROLE_PERMISSIONS: Dict[UserRole, Set[Permission]] = {
    UserRole.DONOR: {
        Permission.CREATE_LISTING,
        Permission.UPDATE_OWN_LISTING,
        Permission.VIEW_OWN_LISTINGS,
        Permission.VIEW_AVAILABLE_LISTINGS,
    },
    UserRole.RECIPIENT: {
        Permission.VIEW_AVAILABLE_LISTINGS,
        Permission.SUBMIT_CAPACITY_SNAPSHOT,
        Permission.RESPOND_ALLOCATION,
        Permission.CONFIRM_HANDOVER,
    },
    UserRole.VOLUNTEER: {
        Permission.VIEW_AVAILABLE_LISTINGS,
        Permission.VIEW_ASSIGNED_PICKUPS,
        Permission.UPDATE_PICKUP_STATUS,
    },
    UserRole.SAFETY_REVIEWER: {
        Permission.VIEW_AVAILABLE_LISTINGS,
        Permission.VIEW_EVIDENCE_QUEUE,
        Permission.CLEAR_SAFETY_REVIEW,
        Permission.FLAG_SAFETY_HOLD,
        Permission.VIEW_OPERATIONS,
    },
    UserRole.COORDINATOR: {
        Permission.VIEW_AVAILABLE_LISTINGS,
        Permission.VIEW_OPERATIONS,
        Permission.VERIFY_ORGANIZATION,
        Permission.VIEW_ALL_ALLOCATIONS,
        Permission.VIEW_EVIDENCE_QUEUE,
        Permission.CLEAR_SAFETY_REVIEW,
        Permission.FLAG_SAFETY_HOLD,
    },
    UserRole.ADMIN: set(Permission),  # All permissions
}


def role_has_permission(role: UserRole, permission: Permission) -> bool:
    """Check if a specific role possesses the requested permission."""
    return permission in ROLE_PERMISSIONS.get(role, set())
