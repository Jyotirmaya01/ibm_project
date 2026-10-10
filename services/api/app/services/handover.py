import uuid
import random
from typing import Dict, List, Optional
from datetime import datetime, timezone, timedelta
from app.schemas.auth import AuthUser
from app.schemas.handover import (
    HandoverStatus,
    HandoverSessionCreate,
    HandoverSessionResponse,
    DriverDispatchRequest,
    HandoverVerifyRequest,
)
from app.services.allocations import ALLOCATION_ITEM_DATABASE
from app.services.listings import LISTING_DATABASE
from app.schemas.allocations import AllocationStatus
from app.schemas.listings import ListingStatus
from app.integrations.notifications import dispatch_notification
from app.services.audit import record_audit_event

HANDOVER_DATABASE: Dict[uuid.UUID, HandoverSessionResponse] = {}


def generate_secure_otp() -> str:
    """Generate 4-digit random one-time verification PIN."""
    return f"{random.randint(1000, 9999)}"


async def create_handover_session(
    payload: HandoverSessionCreate,
    actor_id: Optional[uuid.UUID] = None,
) -> HandoverSessionResponse:
    """Creates a new scheduled handover session with secure verification OTP."""
    session_id = uuid.uuid4()
    otp = generate_secure_otp()
    now = datetime.now(timezone.utc)
    scheduled_time = payload.scheduled_time or (now + timedelta(hours=1))

    session = HandoverSessionResponse(
        id=session_id,
        allocation_id=payload.allocation_id,
        listing_id=payload.listing_id,
        recipient_id=payload.recipient_id,
        volunteer_id=payload.volunteer_id,
        status=HandoverStatus.SCHEDULED,
        otp_code=otp,
        scheduled_time=scheduled_time,
        created_at=now,
    )
    HANDOVER_DATABASE[session_id] = session

    # Notify recipient of OTP
    await dispatch_notification(
        recipient_id=payload.recipient_id,
        channel="SMS",
        template_name="HANDOVER_OTP_GENERATED",
        context={"otp": otp},
    )

    await record_audit_event(
        action="HANDOVER_SESSION_CREATED",
        resource_type="handover_session",
        actor_id=actor_id,
        resource_id=session_id,
        details={"allocation_id": str(payload.allocation_id), "scheduled_time": scheduled_time.isoformat()},
    )

    return session


async def assign_volunteer_driver(
    session_id: uuid.UUID,
    payload: DriverDispatchRequest,
    actor_id: Optional[uuid.UUID] = None,
) -> HandoverSessionResponse:
    """Assigns an authorized volunteer driver for physical collection."""
    session = HANDOVER_DATABASE.get(session_id)
    if not session:
        raise KeyError(f"Handover session '{session_id}' not found.")

    session.volunteer_id = payload.volunteer_id
    session.status = HandoverStatus.DRIVER_ASSIGNED

    # Send driver assigned notification
    await dispatch_notification(
        recipient_id=session.recipient_id,
        channel="WHATSAPP",
        template_name="DRIVER_ASSIGNED",
        context={"eta_minutes": payload.estimated_arrival_minutes},
    )

    await record_audit_event(
        action="VOLUNTEER_DRIVER_ASSIGNED",
        resource_type="handover_session",
        actor_id=actor_id,
        resource_id=session_id,
        details={"volunteer_id": str(payload.volunteer_id), "vehicle_type": payload.vehicle_type},
    )

    return session


async def verify_handover_outcome(
    session_id: uuid.UUID,
    payload: HandoverVerifyRequest,
    current_user: AuthUser,
) -> HandoverSessionResponse:
    """
    Executes recipient digital handover verification:
    1. Validates OTP presented by recipient.
    2. Enforces mandatory physical inspection (visual, container cleanliness, smell).
    3. Confirms physical delivered quantity (kg) and updates impact status.
    """
    session = HANDOVER_DATABASE.get(session_id)
    if not session:
        raise KeyError(f"Handover session '{session_id}' not found.")

    # 1. OTP Verification
    if session.otp_code != payload.otp_code.strip():
        raise ValueError("Invalid verification OTP. Handover cannot be authenticated.")

    # 2. Mandatory Physical Inspection Gate
    if not payload.visual_inspection_passed:
        session.status = HandoverStatus.REJECTED_AT_HANDOVER
        session.visual_inspection_passed = False
        session.recipient_notes = payload.recipient_notes
        
        await record_audit_event(
            action="HANDOVER_REJECTED_INSPECTION_FAILED",
            resource_type="handover_session",
            actor_id=current_user.id,
            resource_id=session_id,
            details={"notes": payload.recipient_notes},
        )
        return session

    # 3. Successful Inspection & Quantity Confirmation
    now = datetime.now(timezone.utc)
    session.actual_delivered_kg = payload.actual_delivered_kg
    session.visual_inspection_passed = True
    session.temperature_celsius = payload.temperature_celsius
    session.recipient_notes = payload.recipient_notes
    session.verified_at = now

    # Determine full or partial delivery
    alloc = ALLOCATION_ITEM_DATABASE.get(session.allocation_id)
    expected_qty = alloc.allocated_kg if alloc else payload.actual_delivered_kg

    if payload.actual_delivered_kg < expected_qty:
        session.status = HandoverStatus.PARTIALLY_DELIVERED
        if alloc:
            alloc.status = AllocationStatus.PARTIALLY_ACCEPTED
            alloc.confirmed_kg = payload.actual_delivered_kg
    else:
        session.status = HandoverStatus.VERIFIED_DELIVERED
        if alloc:
            alloc.status = AllocationStatus.CONFIRMED
            alloc.confirmed_kg = payload.actual_delivered_kg

    # Update Listing Status if applicable
    listing = LISTING_DATABASE.get(session.listing_id)
    if listing:
        listing.status = (
            ListingStatus.COMPLETED
            if session.status == HandoverStatus.VERIFIED_DELIVERED
            else ListingStatus.PARTIALLY_HANDED_OVER
        )

    # Dispatch delivery confirmation notification
    await dispatch_notification(
        recipient_id=session.recipient_id,
        channel="PUSH",
        template_name="DELIVERY_CONFIRMED",
        context={"delivered_kg": payload.actual_delivered_kg},
    )

    await record_audit_event(
        action="HANDOVER_VERIFIED_COMPLETED",
        resource_type="handover_session",
        actor_id=current_user.id,
        resource_id=session_id,
        details={
            "delivered_kg": payload.actual_delivered_kg,
            "status": session.status.value,
            "inspection_passed": True,
        },
    )

    return session
