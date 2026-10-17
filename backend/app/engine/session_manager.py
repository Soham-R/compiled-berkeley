"""Session Manager & Parent Debrief Orchestrator.

Orchestrates live tutoring sessions, invariant audits,
and generates the nightly 2-minute parent debrief.
"""

from datetime import datetime, timezone
from typing import Dict, List, Optional, Any
from pydantic import BaseModel, Field

from ..schemas.profile import ChildProfile
from ..schemas.telemetry import InteractionType
from ..schemas.tutor import PassageResponse, ScaffoldStep
from .state_model import CognitiveProfileEngine, DynamicCognitiveState
from .scaffolding import ScaffoldingLadderEngine
from .spaced_repetition import DiegeticSpacedRepetition
from .story_generator import StoryGenerator


class ParentDebrief(BaseModel):
    child_id: str
    session_id: str
    date: str
    what_worked: List[str]
    child_state_summary: str
    concrete_homework_technique: str
    stall_patterns_broken: List[str]
    discrepancies: List[str]
    newly_mastered_words: List[str]
    current_focus_words: List[str]


class TutoringSession:
    """Manages an active tutoring session for one child."""

    def __init__(
        self,
        session_id: str,
        profile: ChildProfile,
        day: int = 1,
        api_key: Optional[str] = None,
    ):
        self.session_id = session_id
        self.profile = profile
        self.day = day
        self.engine = CognitiveProfileEngine(profile)
        self.scaffold_engine = ScaffoldingLadderEngine()
        self.spaced_rep = DiegeticSpacedRepetition()
        self.story_gen = StoryGenerator(api_key=api_key)

        self.current_passage: Optional[PassageResponse] = None
        self.active_word_index: int = 0
        self.word_failure_counts: Dict[str, int] = {}
        self.stall_breaks: List[str] = []
        self.techniques_used: List[str] = []

    def start(self, primary_targets: Optional[List[str]] = None) -> PassageResponse:
        """Initializes the session and produces the first story beat."""
        targets = primary_targets or ["through", "think", "there"]
        # Weave spaced repetition targets into today's lesson
        final_targets = self.spaced_rep.weave_review_targets(
            self.day, targets, self.engine.state
        )

        passage = self.story_gen.generate_story_beat(
            day=self.day,
            profile=self.profile,
            state=self.engine.state,
            target_words=final_targets,
            flagged=False,
        )
        self.current_passage = passage
        return passage

    def process_turn(
        self,
        event_type: InteractionType,
        latency_ms: Optional[float] = None,
        word: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """Processes an interaction turn, updating state and returning scaffold cues if needed."""
        state = self.engine.update_from_interaction(
            event_type=event_type,
            latency_ms=latency_ms,
            word=word,
            metadata=metadata,
        )

        scaffold: Optional[ScaffoldStep] = None
        if event_type in (InteractionType.WORD_STUMBLE, InteractionType.HESITATION_PAUSE):
            target = word or "target"
            failures = self.word_failure_counts.get(target, 0) + 1
            self.word_failure_counts[target] = failures

            # Generate scaffold according to escalation ladder (Active Recall enforced)
            scaffold = self.scaffold_engine.evaluate_step(
                target_concept=target,
                current_state=state,
                consecutive_failures=failures,
            )
            state.current_scaffold_tier = int(scaffold.rung)

            if failures == 1:
                self.stall_breaks.append(
                    f"Waited through {round((latency_ms or 4000)/1000, 1)}s pause on '{target}' without revealing answer."
                )

        elif event_type == InteractionType.WORD_READ:
            if word and word in self.word_failure_counts:
                # Child solved it after previous struggle!
                self.stall_breaks.append(
                    f"Child successfully retrieved '{word}' after {self.word_failure_counts[word]} guided scaffold(s)."
                )
                self.techniques_used.append(f"Diegetic phoneme scaffolding on '{word}'")
                del self.word_failure_counts[word]

        return {
            "session_id": self.session_id,
            "state": state.model_dump(),
            "scaffold": scaffold.model_dump() if scaffold else None,
            "modality": self.engine.get_effective_modality(),
        }

    def generate_nightly_debrief(self) -> ParentDebrief:
        """Constructs the nightly 2-minute parent debrief."""
        state = self.engine.state

        # Determine what worked
        what_worked = list(self.techniques_used)
        if not what_worked:
            what_worked.append("Patience-margin wait allowed unhurried word decoding.")
        if state.frustration_index < 0.3:
            what_worked.append("Kept frustration low by pacing through serialized story beats.")

        # Summary of state
        has_adhd = any("adhd" in d.lower() for d in self.profile.priors.diagnoses)
        focus_desc = "strong sustained flow" if state.attention_battery > 0.5 else "fatigued in the final minutes"
        child_state_summary = (
            f"{self.profile.priors.name} maintained {focus_desc}. "
            f"Average response latency was {round(state.estimated_latency_baseline_ms/1000, 1)}s. "
            f"Final cognitive strain index: {round(state.frustration_index, 2)} / 1.0."
        )

        # Actionable homework technique for the parent
        technique = (
            f"When {self.profile.priors.name} pauses on a word tonight, wait a full 6 seconds of silence. "
            f"She does not need the answer — stalling is just her working-memory buffer loading. "
            f"If she asks, give the first sound '{self.profile.priors.known_difficulties[0][:3]}' rather than the whole word."
        )

        return ParentDebrief(
            child_id=self.profile.id,
            session_id=self.session_id,
            date=datetime.now(timezone.utc).strftime("%Y-%m-%d"),
            what_worked=what_worked,
            child_state_summary=child_state_summary,
            concrete_homework_technique=technique,
            stall_patterns_broken=self.stall_breaks[:3],
            discrepancies=state.observed_discrepancies,
            newly_mastered_words=self.profile.behavioral.mastered_words[-3:],
            current_focus_words=self.profile.behavioral.struggled_words,
        )
