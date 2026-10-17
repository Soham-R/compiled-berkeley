"""Telemetry streaming endpoints for interaction and prosody signals."""

from fastapi import APIRouter
from ..schemas.telemetry import TelemetryBatch, SessionState

router = APIRouter(prefix="/api/v1/telemetry", tags=["Telemetry"])


@router.post("")
def record_telemetry(batch: TelemetryBatch):
    # Process interaction signals, stumbles, and prosody
    return {
        "status": "recorded",
        "session_id": batch.session_id,
        "child_id": batch.child_id,
        "events_count": len(batch.events),
    }


@router.get("/session/{session_id}", response_model=SessionState)
def get_session_state(session_id: str, child_id: str = "maya"):
    return SessionState(
        session_id=session_id,
        child_id=child_id,
        elapsed_seconds=180.0,
        stumble_count=2,
        consecutive_pauses=1,
        estimated_frustration=0.15,
        current_scaffold_tier=1,
        active_modality="story",
    )
