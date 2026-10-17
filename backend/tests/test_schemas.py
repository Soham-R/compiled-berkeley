"""Unit tests for Pydantic v2 schemas and invariants."""

from datetime import datetime, timezone
import pytest
from pydantic import ValidationError

from backend.app.schemas.profile import ChildProfile, ParentPriors, BehavioralProfile
from backend.app.schemas.telemetry import TelemetryEvent, InteractionType, SessionState
from backend.app.schemas.tutor import (
    PresentationSettings,
    FontChoice,
    ContrastMode,
    EscalationRung,
    ScaffoldStep,
    PassageRequest,
    PassageResponse,
    QuestionItem,
)


def test_child_profile_serialization():
    priors = ParentPriors(
        name="Maya",
        age=7,
        grade_band="early-2",
        diagnoses=["Dyslexia", "ADHD"],
        iep_accommodations=["Extra time"],
        interests=["dinosaurs", "dogs"],
        sensitivities=["noise"],
        known_difficulties=["th- blends"],
    )
    behavioral = BehavioralProfile(
        baseline_latency_ms=3000.0,
        attention_window_minutes=7.5,
        mastered_words=["cat", "dog"],
        struggled_words=["think", "through"],
    )
    profile = ChildProfile(id="child-123", priors=priors, behavioral=behavioral)

    dumped = profile.model_dump()
    assert dumped["id"] == "child-123"
    assert dumped["priors"]["name"] == "Maya"
    assert "Dyslexia" in dumped["priors"]["diagnoses"]
    assert dumped["behavioral"]["baseline_latency_ms"] == 3000.0

    # Ensure json roundtrip
    json_str = profile.model_dump_json()
    reloaded = ChildProfile.model_validate_json(json_str)
    assert reloaded.id == profile.id
    assert reloaded.priors.name == "Maya"


def test_telemetry_schema():
    event = TelemetryEvent(
        event_type=InteractionType.WORD_STUMBLE,
        word="through",
        duration_ms=4500.0,
        metadata={"prosody_strain": 0.8},
    )
    assert event.event_type == InteractionType.WORD_STUMBLE
    assert event.word == "through"
    assert event.duration_ms == 4500.0


def test_learning_invariants_scaffolding():
    # Escalation step must respect invariant
    step = ScaffoldStep(
        rung=EscalationRung.NARRATIVE_CLUE,
        narrative_prompt="Listen for the sound at the start of 'think'...",
        wait_time_seconds=10,
        must_not_give_answer=True,
    )
    assert step.must_not_give_answer is True
    assert step.rung == EscalationRung.NARRATIVE_CLUE


def test_passage_response_contract():
    resp = PassageResponse(
        day=1,
        passage="Sam walked through the park.",
        target_words=["through"],
        question=QuestionItem(prompt="Where did Sam walk?", options=["Park", "Store"]),
        source="backend-service",
    )
    assert resp.day == 1
    assert len(resp.target_words) == 1
    assert resp.question.prompt == "Where did Sam walk?"
