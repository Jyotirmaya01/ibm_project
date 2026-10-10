import uuid
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
from pydantic import BaseModel, Field


class NotificationEvent(BaseModel):
    id: uuid.UUID = Field(default_factory=uuid.uuid4)
    recipient_id: uuid.UUID
    channel: str  # PUSH, SMS, WHATSAPP
    template_name: str
    message_content: str
    recipient_contact_masked: str
    status: str = "DELIVERED"
    sent_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


# In-memory notification log
NOTIFICATION_AUDIT_LOG: List[NotificationEvent] = []


def mask_phone_number(phone: Optional[str]) -> str:
    """Mask user phone number for contact protection (e.g. +91 98XXX XXXXX)."""
    if not phone or len(phone) < 10:
        return "+91 98XXX XXXXX"
    return f"{phone[:6]}XXXX{phone[-2:]}"


async def dispatch_notification(
    recipient_id: uuid.UUID,
    channel: str,
    template_name: str,
    context: Dict[str, Any],
    raw_contact: Optional[str] = None,
) -> NotificationEvent:
    """
    Dispatch an event-driven notification via mock adapter.
    Formats contextual template and records an audit log.
    """
    masked_contact = mask_phone_number(raw_contact)
    
    if template_name == "ALLOCATION_OFFERED":
        msg = f"Surplus meal offered: {context.get('food_name', 'Food')} ({context.get('quantity_kg', 0)}kg). Please confirm within 45 mins."
    elif template_name == "DRIVER_ASSIGNED":
        msg = f"Volunteer driver assigned: Arriving in approx {context.get('eta_minutes', 20)} mins."
    elif template_name == "HANDOVER_OTP_GENERATED":
        msg = f"Your secure pickup OTP is {context.get('otp', '1234')}. Share this only after visual food inspection."
    elif template_name == "DELIVERY_CONFIRMED":
        msg = f"Handover verified: {context.get('delivered_kg', 0)}kg delivered safely to {context.get('recipient_name', 'Shelter')}."
    else:
        msg = f"AnnaSetu Alert: Notification for {template_name}."

    event = NotificationEvent(
        recipient_id=recipient_id,
        channel=channel.upper(),
        template_name=template_name,
        message_content=msg,
        recipient_contact_masked=masked_contact,
        status="DELIVERED",
    )
    NOTIFICATION_AUDIT_LOG.append(event)
    return event
