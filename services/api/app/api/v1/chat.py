import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from app.schemas.auth import AuthUser
from app.security.auth import get_current_user
from app.schemas.handover import (
    ConversationResponse,
    ChatMessageResponse,
    ChatMessageCreate,
)
from app.services.chat import (
    get_or_create_conversation,
    post_message_to_conversation,
    CONVERSATION_DATABASE,
)

router = APIRouter(prefix="/chat", tags=["Realtime Coordination Chat"])


@router.post("/listing/{listing_id}", response_model=ConversationResponse)
async def start_or_get_conversation(
    listing_id: uuid.UUID,
    current_user: AuthUser = Depends(get_current_user),
) -> ConversationResponse:
    """Get or initialize in-app conversation thread for a food listing."""
    # Ensure current user is included in participants
    conv = get_or_create_conversation(listing_id=listing_id, participants=[current_user.id])
    if current_user.id not in conv.participants:
        conv.participants.append(current_user.id)
    return conv


@router.get("/conversations/{conversation_id}/messages", response_model=List[ChatMessageResponse])
async def list_messages(
    conversation_id: uuid.UUID,
    current_user: AuthUser = Depends(get_current_user),
) -> List[ChatMessageResponse]:
    """Retrieve message history for an authorized conversation."""
    conv = CONVERSATION_DATABASE.get(conversation_id)
    if not conv:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found.")

    is_participant = current_user.id in conv.participants
    is_privileged = current_user.role in ["coordinator", "admin"]
    if not is_participant and not is_privileged:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to view messages.")

    return conv.messages


@router.post("/conversations/{conversation_id}/messages", response_model=ChatMessageResponse)
async def send_message(
    conversation_id: uuid.UUID,
    payload: ChatMessageCreate,
    current_user: AuthUser = Depends(get_current_user),
) -> ChatMessageResponse:
    """Post an authenticated message to the rescue conversation."""
    try:
        msg = await post_message_to_conversation(
            conversation_id=conversation_id,
            payload=payload,
            current_user=current_user,
        )
        return msg
    except KeyError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found.")
    except PermissionError:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to message in this conversation.")
