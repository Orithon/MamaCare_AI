import uuid
from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime, timezone
from core.database import get_db
from middleware.auth_middleware import get_current_patient
from models.assistant import ChatRequest
from services.gemini import chat_response

router = APIRouter(prefix="/api/v1/assistant", tags=["Voice Assistant"])


@router.post("/chat")
async def chat(
    payload: ChatRequest,
    current_user: dict = Depends(get_current_patient)
):
    """
    Accept a message from the patient (text or transcribed voice).
    Returns AI response in the patient's chosen language.
    Saves message + response to chat_history.
    """
    db = get_db()
    uid = current_user["uid"]
    now = datetime.now(timezone.utc).isoformat()

    # Generate or reuse session ID
    session_id = payload.session_id or str(uuid.uuid4())

    # Load recent conversation history for context
    session = await db.chat_history.find_one(
        {"patient_id": uid, "session_id": session_id}
    )
    history = session["messages"] if session else []

    # Get AI response
    ai_reply = await chat_response(
        message=payload.message,
        language=payload.language,
        conversation_history=history
    )

    # Build new message entries
    user_msg = {"role": "user", "content": payload.message, "timestamp": now}
    ai_msg = {"role": "assistant", "content": ai_reply, "timestamp": now}

    # Upsert chat session
    await db.chat_history.update_one(
        {"patient_id": uid, "session_id": session_id},
        {
            "$push": {"messages": {"$each": [user_msg, ai_msg]}},
            "$set": {
                "language": payload.language,
                "updated_at": now
            },
            "$setOnInsert": {
                "patient_id": uid,
                "session_id": session_id,
                "created_at": now
            }
        },
        upsert=True
    )

    return {
        "response": ai_reply,
        "session_id": session_id,
        "language": payload.language
    }


@router.get("/history")
async def get_chat_history(
    current_user: dict = Depends(get_current_patient)
):
    """Get all chat sessions for the current patient."""
    db = get_db()
    uid = current_user["uid"]

    cursor = db.chat_history.find(
        {"patient_id": uid},
        {"_id": 0, "messages": {"$slice": -2}}  # return last message per session only for list
    ).sort("updated_at", -1).limit(20)

    sessions = []
    async for session in cursor:
        sessions.append(session)

    return {"sessions": sessions, "total": len(sessions)}


@router.get("/history/{session_id}")
async def get_session_messages(
    session_id: str,
    current_user: dict = Depends(get_current_patient)
):
    """Get full message history for a specific chat session."""
    db = get_db()
    uid = current_user["uid"]

    session = await db.chat_history.find_one(
        {"patient_id": uid, "session_id": session_id},
        {"_id": 0}
    )

    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    return session
