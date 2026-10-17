"""Unit tests for mock child profiles and custom structured LLM prompts."""

import json
from pathlib import Path
import pytest

from backend.app.schemas.profile import ChildProfile
from backend.app.schemas.tutor import EscalationRung
from backend.app.routers.profile import _PROFILES
from backend.app.engine.state_model import DynamicCognitiveState
from backend.app.engine.story_generator import StoryGenerator
from backend.app.engine.scaffolding import ScaffoldingLadderEngine
from backend.app.engine.prompts import (
    build_story_prompt,
    build_scaffold_prompt,
    build_preference_probe_prompt,
    build_debrief_prompt,
    STORY_BEAT_SYSTEM_PROMPT,
    SCAFFOLD_SYSTEM_PROMPT,
)


def test_all_profiles_load_and_validate():
    profiles_path = Path(__file__).resolve().parent.parent.parent / "content" / "profiles.json"
    assert profiles_path.exists(), "content/profiles.json must exist"

    with open(profiles_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    assert len(data) >= 4, "Must contain at least 4 mock profiles"
    ids = {item["id"] for item in data}
    assert {"maya", "leo", "samira", "julian"}.issubset(ids)

    # Validate each through Pydantic
    for item in data:
        profile = ChildProfile(**item)
        assert profile.priors.name
        assert len(profile.priors.interests) > 0
        assert profile.behavioral.baseline_latency_ms > 0


def test_story_prompt_builder():
    leo_profile = _PROFILES["leo"]
    state = DynamicCognitiveState(child_id="leo")
    prompt_data = build_story_prompt(
        day=1,
        profile=leo_profile,
        state=state,
        target_words=["circuit", "pressure"],
        flagged=False,
    )
    assert prompt_data["system"] == STORY_BEAT_SYSTEM_PROMPT
    assert "Leo" in prompt_data["user_message"]
    assert "Minecraft redstone engineering" in prompt_data["user_message"]
    assert "circuit" in prompt_data["user_message"]


def test_scaffold_prompt_builder_invariant():
    samira_profile = _PROFILES["samira"]
    state = DynamicCognitiveState(child_id="samira")
    prompt_data = build_scaffold_prompt(
        target_concept="trench",
        rung=EscalationRung.NARRATIVE_CLUE,
        profile=samira_profile,
        state=state,
        consecutive_failures=1,
    )
    assert prompt_data["system"] == SCAFFOLD_SYSTEM_PROMPT
    assert "trench" in prompt_data["user_message"]
    assert "requested_rung" in prompt_data["user_message"]


def test_preference_probe_builder():
    julian_profile = _PROFILES["julian"]
    probe = build_preference_probe_prompt(julian_profile, "visual_vs_verbal")
    assert "Julian" in probe["user_message"]
    assert "visual_vs_verbal" in probe["user_message"]


def test_archetype_story_generation():
    gen = StoryGenerator()
    for cid in ["maya", "leo", "samira", "julian"]:
        profile = _PROFILES[cid]
        state = DynamicCognitiveState(child_id=cid)
        passage = gen.generate_story_beat(
            day=1,
            profile=profile,
            state=state,
            target_words=profile.behavioral.struggled_words,
        )
        assert passage is not None
        assert profile.priors.name in passage.passage
        assert len(passage.question.options) == 3


def test_active_recall_invariants_across_archetypes():
    scaffold_engine = ScaffoldingLadderEngine()
    test_cases = [
        ("maya", "through"),
        ("leo", "circuit"),
        ("samira", "current"),
        ("julian", "mechanism"),
    ]

    for cid, word in test_cases:
        state = DynamicCognitiveState(child_id=cid)
        step = scaffold_engine.evaluate_step(
            target_concept=word,
            current_state=state,
            consecutive_failures=1,
        )
        # Rung 1 must never reveal the answer
        assert step.rung == EscalationRung.NARRATIVE_CLUE
        assert step.must_not_give_answer is True
        assert word.lower() not in step.narrative_prompt.lower()
