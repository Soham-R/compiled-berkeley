"""Telemetry schemas for streaming prosody, latency, stumbles, and session dynamics."""

from datetime import datetime, timezone
from enum import Enum
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field


class InteractionType(str, Enum):
    WORD_READ = "word_read"
    WORD_STUMBLE = "word_stumble"
    HESITATION_PAUSE = "hesitation_pause"
    LINE_REREAD = "line_reread"
    PROSODY_SPIKE = "prosody_spike"
    PROSODY_FLATLINE = "prosody_flatline"
    UI_OFFER_ACCEPTED = "ui_offer_accepted"
    UI_OFFER_DECLINED = "ui_offer_declined"
    MIC_SILENCE = "mic_silence"
    QUESTION_ATTEMPT = "question_attempt"


class TelemetryEvent(BaseModel):
    event_type: InteractionType = Field(..., description="Classification of the interaction signal")
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    word: Optional[str] = Field(None, description="Related target or read word if applicable")
    duration_ms: Optional[float] = Field(None, description="Duration of pause, utterance, or latency in ms")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Additional signal context (e.g. pitch variance, confidence)")


class SessionState(BaseModel):
    session_id: str
    child_id: str
    elapsed_seconds: float = 0.0
    stumble_count: int = 0
    consecutive_pauses: int = 0
    estimated_frustration: float = Field(default=0.0, ge=0.0, le=1.0)
    current_scaffold_tier: int = Field(default=0, ge=0, le=4, description="0=unprompted, 1=narrative clue, 2=smaller step, 3=representation fade, 4=co-regulation")
    active_modality: str = Field(default="story")


class TelemetryBatch(BaseModel):
    session_id: str
    child_id: str
    events: List[TelemetryEvent] = Field(default_factory=list)
