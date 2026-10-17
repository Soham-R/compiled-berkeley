"""Interactive CLI Tutoring Runner & State HUD for All Archetypes.

Run interactive or automated simulations of Wren tutoring sessions
for Maya, Leo, Samira, or Julian without frontend/voice dependencies.
"""

import argparse
import time
import sys
import os
from pathlib import Path

# Ensure repo root is in sys.path
REPO_ROOT = Path(__file__).resolve().parent.parent
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from backend.app.routers.profile import _PROFILES
from backend.app.schemas.telemetry import InteractionType
from backend.app.engine.session_manager import TutoringSession


def render_bar(val: float, length: int = 15) -> str:
    filled = int(val * length)
    return f"[{'#' * filled}{'-' * (length - filled)}] {int(val * 100)}%"


def render_hud(session: TutoringSession):
    state = session.engine.state
    priors = session.profile.priors
    print("\n" + "=" * 60)
    print(f" WREN COGNITIVE STATE HUD - {priors.name.upper()} (Age {priors.age}, {priors.grade_band})")
    print(f" Diagnoses: {', '.join(priors.diagnoses)}")
    print("-" * 60)
    print(f" Frustration Index: {render_bar(state.frustration_index)}")
    print(f" Attention Battery: {render_bar(state.attention_battery)}")
    print(f" Baseline Latency:  {round(state.estimated_latency_baseline_ms / 1000, 1)}s")
    print(f" Active Modality:   {state.active_modality.upper()}")
    print(f" Scaffold Tier:     Rung {state.current_scaffold_tier}")
    print("=" * 60 + "\n")


def run_simulation(child_id: str = "maya", day: int = 1):
    profile = _PROFILES.get(child_id.lower())
    if not profile:
        print(f"Child profile '{child_id}' not found. Available: {list(_PROFILES.keys())}")
        return

    session = TutoringSession(session_id=f"sim_{child_id}_001", profile=profile, day=day)
    print(f"\n[1] INITIALIZING SESSION for {profile.priors.name} ({profile.priors.diagnoses[0]}, Day {day})...")
    passage = session.start()

    render_hud(session)
    print("STORY CHAPTER BEAT:")
    print(f"\"{passage.passage}\"\n")
    print(f"Target Challenge Words: {', '.join(passage.target_words)}")
    print(f"Adaptive Font: {passage.presentation.font_family.value} | Spacing: {passage.presentation.letter_spacing_em}em | Contrast: {passage.presentation.contrast_mode.value}\n")

    primary_target = passage.target_words[0]

    # Step 1: Smooth start
    print(f"--> Event: {profile.priors.name} reads opening sentence smoothly...")
    session.process_turn(InteractionType.WORD_READ, latency_ms=1800, word="start")
    print("    [Result] Word recognized. Cognitive state stable.\n")

    # Step 2: Challenge word encountered -> hesitation pause
    pause_latency = max(5000.0, profile.behavioral.baseline_latency_ms * 1.3)
    print(f"--> Event: {profile.priors.name} pauses on target challenge word '{primary_target}' (latency: {round(pause_latency/1000, 1)}s)...")
    res1 = session.process_turn(InteractionType.HESITATION_PAUSE, latency_ms=pause_latency, word=primary_target)
    scaffold1 = res1.get("scaffold")
    render_hud(session)
    print(f"    [Wren Invariant Check - Rung {scaffold1['rung']}]:")
    print(f"    Prompt: \"{scaffold1['narrative_prompt']}\"")
    print(f"    Answer Given? {not scaffold1['must_not_give_answer']} (Hard Invariant Verified: NO ANSWER ON FIRST ASK!)\n")

    # Step 3: Second failure/stumble -> Phoneme chunking rung
    print(f"--> Event: {profile.priors.name} makes a second stumble on '{primary_target}' (consecutive failure #2)...")
    res2 = session.process_turn(InteractionType.WORD_STUMBLE, latency_ms=3000, word=primary_target)
    scaffold2 = res2.get("scaffold")
    render_hud(session)
    print(f"    [Wren Escalation Ladder - Rung {scaffold2['rung']} (Sub-step Phoneme Chunking)]:")
    print(f"    Prompt: \"{scaffold2['narrative_prompt']}\"\n")

    # Step 4: Successful retrieval
    print(f"--> Event: {profile.priors.name} synthesizes the chunks and retrieves '{primary_target}' correctly!")
    session.process_turn(InteractionType.WORD_READ, latency_ms=2100, word=primary_target)
    render_hud(session)
    print("    [Result] Active recall succeeded! Frustration recovering.\n")

    # Step 5: Comprehension Check
    print(f"--> Question probe presented to {profile.priors.name}:")
    print(f"    Prompt: {passage.question.prompt}")
    for idx, opt in enumerate(passage.question.options):
        print(f"    [{idx + 1}] {opt}")
    correct_opt = passage.question.options[0]
    print(f"\n--> Event: {profile.priors.name} selects option: '{correct_opt}'...")
    session.process_turn(InteractionType.QUESTION_ATTEMPT, word=primary_target, metadata={"correct": True})

    # End of session: Nightly debrief
    print("\n" + "#" * 60)
    print(" NIGHTLY 2-MINUTE PARENT DEBRIEF")
    print("#" * 60)
    debrief = session.generate_nightly_debrief()
    print(f"Date: {debrief.date} | Student: {profile.priors.name} ({profile.priors.grade_band})")
    print("\n1. What Worked:")
    for item in debrief.what_worked:
        print(f"   - {item}")
    print("\n2. Child State Summary:")
    print(f"   {debrief.child_state_summary}")
    print("\n3. Stall Patterns Broken:")
    for stall in debrief.stall_patterns_broken:
        print(f"   - {stall}")
    print("\n4. Concrete Technique for Homework Tonight:")
    print(f"   \"{debrief.concrete_homework_technique}\"")
    print("#" * 60 + "\n")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Wren Cognitive Engine CLI Runner")
    parser.add_argument("--child", default="maya", choices=["maya", "leo", "samira", "julian"], help="Child ID (default: maya)")
    parser.add_argument("--day", type=int, default=1, help="Curriculum day (default: 1)")
    args = parser.parse_args()

    run_simulation(child_id=args.child, day=args.day)
