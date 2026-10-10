import uuid
from typing import Dict, List, Optional
from datetime import datetime, timezone
from app.schemas.auth import AuthUser
from app.schemas.handover import ConversationResponse, ChatMessageResponse, ChatMessageCreate
from app.integrations.notifications import dispatch_notification

CONVERSATION_DATABASE: Dict[uuid.UUID, ConversationResponse] = {}


def get_or_create_conversation(listing_id: uuid.UUID, participants: List[uuid.UUID]) -> ConversationResponse:
    """Retrieve existing conversation for a listing or create a new one."""
    for conv in CONVERSATION_DATABASE.values():
        if conv.listing_id == listing_id:
            return conv

    conv_id = uuid.uuid4()
    conv = ConversationResponse(
        id=conv_id,
        listing_id=listing_id,
        participants=participants,
        messages=[],
    )
    CONVERSATION_DATABASE[conv_id] = conv
    return conv


async def post_message_to_conversation(
    conversation_id: uuid.UUID,
    payload: ChatMessageCreate,
    current_user: AuthUser,
) -> ChatMessageResponse:
    """Post an authenticated message to an active rescue conversation."""
    conv = CONVERSATION_DATABASE.get(conversation_id)
    if not conv:
        raise KeyError(f"Conversation '{conversation_id}' not found.")

    # Authorization Check: Participant or Coordinator/Admin
    is_participant = current_user.id in conv.participants
    is_privileged = current_user.role in ["coordinator", "admin"]

    if not is_participant and not is_privileged:
        raise PermissionError("User is not authorized to message in this conversation.")

    msg = ChatMessageResponse(
        id=uuid.uuid4(),
        conversation_id=conversation_id,
        sender_id=current_user.id,
        sender_role=current_user.role,
        sender_name=current_user.full_name,
        content=payload.content,
        sent_at=datetime.now(timezone.utc),
    )
    conv.messages.append(msg)

    # Notify other participants
    for p_id in conv.participants:
        if p_id != current_user.id:
            await dispatch_notification(
                recipient_id=p_id,
                channel="PUSH",
                template_name="NEW_CHAT_MESSAGE",
                context={"sender_name": current_user.full_name, "content": payload.content[:50]},
            )

    return msg
