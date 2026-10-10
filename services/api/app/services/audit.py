import uuid
import logging
from typing import Optional, Dict, Any
from datetime import datetime, timezone
from pydantic import BaseModel, Field

logger = logging.getLogger("annasetu.audit")


class AuditEventRecord(BaseModel):
    id: uuid.UUID = Field(default_factory=uuid.uuid4)
    actor_id: Optional[uuid.UUID] = None
    action: str
    resource_type: str
    resource_id: Optional[uuid.UUID] = None
    details: Dict[str, Any] = Field(default_factory=dict)
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


# In-memory audit sink for local testing / audit logging
AUDIT_LOG_BUFFER = []


async def record_audit_event(
    action: str,
    resource_type: str,
    actor_id: Optional[uuid.UUID] = None,
    resource_id: Optional[uuid.UUID] = None,
    details: Optional[Dict[str, Any]] = None,
) -> AuditEventRecord:
    """
    Log and record an authoritative audit event for privileged or consequential actions.
    Ensures complete traceability without relying on ephemeral client-side logs.
    """
    event = AuditEventRecord(
        actor_id=actor_id,
        action=action,
        resource_type=resource_type,
        resource_id=resource_id,
        details=details or {},
    )
    AUDIT_LOG_BUFFER.append(event)
    logger.info(
        f"AUDIT_EVENT: actor={actor_id} action={action} resource={resource_type}:{resource_id} details={details}"
    )
    return event
