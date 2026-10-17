"""Session endpoints exposing Wren's cognitive state and tutoring engine."""

import uuid
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from ..schemas.telemetry import InteractionType
from ..schemas.tutor import PassageResponse
from .profile import _PROFILES
from ..engine.session_manager import TutoringSession, ParentDebrief

router = APIRouter(prefix="/api/v1/session", tags=["Session Engine"])

# Active session store
_ACTIVE_SESSIONS: Dict[str, TutoringSession] = {}


class StartSessionRequest(BaseModel):
    child_id: str
    day: int = 1
    target_words: Optional[List[str]] = None


class SessionTurnRequest(BaseModel):
    session_id: str
    event_type: InteractionType
    word: Optional[str] = None
    latency_ms: Optional[float] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)


@router.post("/start")
def start_session(req: StartSessionRequest):
    profile = _PROFILES.get(req.child_id)
    if not profile:
        raise HTTPException(status_code=404, detail=f"Child profile '{req.child_id}' not found")

    session_id = f"sess_{uuid.uuid4().hex[:8]}"
    session = TutoringSession(session_id=session_id, profile=profile, day=req.day)
    passage = session.start(primary_targets=req.target_words)

    _ACTIVE_SESSIONS[session_id] = session

    return {
        "session_id": session_id,
        "child_id": req.child_id,
        "day": req.day,
        "passage": passage.model_dump(),
        "initial_state": session.engine.state.model_dump(),
    }


@router.post("/turn")
def process_session_turn(req: SessionTurnRequest):
    session = _ACTIVE_SESSIONS.get(req.session_id)
    if not session:
        raise HTTPException(status_code=404, detail=f"Active session '{req.session_id}' not found")

    turn_result = session.process_turn(
        event_type=req.event_type,
        latency_ms=req.latency_ms,
        word=req.word,
        metadata=req.metadata,
    )
    return turn_result


@router.get("/{session_id}/debrief", response_model=ParentDebrief)
def get_session_debrief(session_id: str):
    session = _ACTIVE_SESSIONS.get(session_id)
    if not session:
        raise HTTPException(status_code=404, detail=f"Session '{session_id}' not found")

    return session.generate_nightly_debrief()
