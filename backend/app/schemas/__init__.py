"""Unified Pydantic v2 schemas for Wren."""

from .profile import ChildProfile, ParentPriors, BehavioralProfile
from .telemetry import TelemetryEvent, TelemetryBatch, SessionState, InteractionType
from .tutor import (
    PresentationSettings,
    FontChoice,
    ContrastMode,
    EscalationRung,
    ScaffoldStep,
    PassageRequest,
    PassageResponse,
    QuestionItem,
)

__all__ = [
    "ChildProfile",
    "ParentPriors",
    "BehavioralProfile",
    "TelemetryEvent",
    "TelemetryBatch",
    "SessionState",
    "InteractionType",
    "PresentationSettings",
    "FontChoice",
    "ContrastMode",
    "EscalationRung",
    "ScaffoldStep",
    "PassageRequest",
    "PassageResponse",
    "QuestionItem",
]
