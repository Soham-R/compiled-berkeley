"""Unit tests verifying Wren's cognitive state model and learning invariants."""

import pytest
from datetime import datetime, timezone

from backend.app.schemas.profile import ChildProfile, ParentPriors, BehavioralProfile
from backend.app.schemas.telemetry import InteractionType
from backend.app.schemas.tutor import EscalationRung, ScaffoldStep
from backend.app.engine.state_model import CognitiveProfileEngine, DynamicCognitiveState
from backend.app.engine.scaffolding import ScaffoldingLadderEngine, LearningInvariantViolation
from backend.app.engine.spaced_repetition import DiegeticSpacedRepetition
from backend.app.engine.session_manager import TutoringSession


@pytest.fixture
def sample_child_profile():
    return ChildProfile(
        id="maya",
        priors=ParentPriors(
            name="Maya",
            age=7,
            grade_band="early-2",
            diagnoses=["Dyslexia", "ADHD"],
            iep_accommodations=["Extra time"],
            interests=["Biscuit", "dinosaurs"],
            sensitivities=["loud transitions"],
            known_difficulties=["th- blends", "stalling"],
        ),
        behavioral=BehavioralProfile(
            baseline_latency_ms=4000.0,
            attention_window_minutes=8.0,
            mastered_words=["duck", "pond"],
            struggled_words=["through", "think"],
        ),
    )


def test_invariant_no_answer_on_first_ask(sample_child_profile):
    scaffold_engine = ScaffoldingLadderEngine()
    state = DynamicCognitiveState(child_id="maya")

    # First failure MUST produce Rung 1 (narrative clue) and NOT reveal answer
    step = scaffold_engine.evaluate_step(
        target_concept="through",
        current_state=state,
        consecutive_failures=1,
    )
    assert step.rung == EscalationRung.NARRATIVE_CLUE
    assert step.must_not_give_answer is True
    assert "through" not in step.narrative_prompt.lower()

    # Attempting to force an answer on Rung 1 must trigger LearningInvariantViolation
    bad_step = ScaffoldStep(
        rung=EscalationRung.NARRATIVE_CLUE,
        narrative_prompt="The word is through, say it now!",
        wait_time_seconds=5,
        must_not_give_answer=False,
    )
    with pytest.raises(LearningInvariantViolation):
        scaffold_engine.audit_invariant(bad_step, "through")


def test_state_model_frustration_and_recovery(sample_child_profile):
    engine = CognitiveProfileEngine(sample_child_profile)
    initial_frustration = engine.state.frustration_index

    # 1. Stumble increases frustration
    engine.update_from_interaction(InteractionType.WORD_STUMBLE, latency_ms=4500, word="through")
    assert engine.state.frustration_index > initial_frustration
    frustrated_level = engine.state.frustration_index

    # 2. Second stumble increases frustration further
    engine.update_from_interaction(InteractionType.WORD_STUMBLE, latency_ms=4200, word="through")
    assert engine.state.frustration_index > frustrated_level

    # 3. Successful read de-escalates frustration
    engine.update_from_interaction(InteractionType.WORD_READ, latency_ms=2000, word="through")
    assert engine.state.frustration_index < engine.state.frustration_index + 0.05


def test_diegetic_spaced_repetition(sample_child_profile):
    spaced_rep = DiegeticSpacedRepetition()
    engine = CognitiveProfileEngine(sample_child_profile)

    # Struggled words like 'through' are scheduled for review on Day 1
    due = spaced_rep.get_due_concepts(engine.state, current_day=1)
    assert "through" in due or "think" in due

    # Weaving review targets into lesson
    combined = spaced_rep.weave_review_targets(
        current_day=1,
        primary_targets=["where"],
        state=engine.state,
    )
    assert "where" in combined
    assert len(combined) > 1


def test_session_lifecycle_and_debrief(sample_child_profile):
    session = TutoringSession(session_id="test_sess", profile=sample_child_profile, day=1)
    passage = session.start()
    assert passage is not None
    assert "Biscuit" in passage.passage or "Maya" in passage.passage

    # Run a stumble and recovery
    session.process_turn(InteractionType.HESITATION_PAUSE, latency_ms=5000, word="through")
    session.process_turn(InteractionType.WORD_READ, latency_ms=2500, word="through")

    # Generate debrief
    debrief = session.generate_nightly_debrief()
    assert debrief.child_id == "maya"
    assert len(debrief.what_worked) >= 1
    assert "Maya" in debrief.child_state_summary
    assert len(debrief.concrete_homework_technique) > 20


def test_discrepancy_detection(sample_child_profile):
    engine = CognitiveProfileEngine(sample_child_profile)
    # Declared interest is "dinosaurs". If energy delta drops repeatedly:
    engine.record_interest_response("dinosaurs", -0.4)
    assert any("dinosaurs" in disc for disc in engine.state.observed_discrepancies)
