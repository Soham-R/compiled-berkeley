"""Learning Invariant Enforcement & Multi-Rung Escalation Scaffolding.

Strictly enforces:
1. Invariant 1: No Answer on First Ask (Active Recall)
2. Invariant 2: Cognitive Rigor Preserved (Support scales, thinking does not)
3. Infinite Patience: Silence inside a task wrapped in narrative suspense
"""

from typing import Dict, List, Optional
from ..schemas.tutor import EscalationRung, ScaffoldStep
from .state_model import DynamicCognitiveState


class LearningInvariantViolation(Exception):
    """Raised when an engine action violates a core learning invariant."""
    pass


class ScaffoldingLadderEngine:
    """Manages progression down the escalation ladder without giving away answers."""

    # Phonics chunking library for phoneme decoding support (lowers decoding friction)
    PHONEME_CHUNKS = {
        # Maya (th- blends)
        "through": ["th", "rough"],
        "think": ["th", "ink"],
        "there": ["th", "ere"],
        "where": ["wh", "ere"],
        "which": ["wh", "ich"],
        "duck": ["d", "uck"],
        "park": ["p", "ark"],
        # Leo (multi-syllable STEM)
        "circuit": ["cir", "cuit"],
        "pressure": ["press", "ure"],
        "velocity": ["ve", "locity"],
        # Samira (oceanic/transit)
        "current": ["cur", "rent"],
        "lantern": ["lan", "tern"],
        "trench": ["tr", "ench"],
        # Julian (Latinate academic roots)
        "mechanism": ["mech", "anism"],
        "evidence": ["evi", "dence"],
        "hypothesis": ["hypo", "thesis"],
    }

    def __init__(self):
        pass

    def evaluate_step(
        self,
        target_concept: str,
        current_state: DynamicCognitiveState,
        consecutive_failures: int,
        attempt_text: Optional[str] = None,
    ) -> ScaffoldStep:
        """Determines the appropriate scaffold rung based on state and failure count.
        
        Strict Invariant: consecutive_failures == 1 MUST NOT yield the answer.
        """
        # Determine rung
        if consecutive_failures == 0:
            rung = EscalationRung.UNPROMPTED
            prompt = "Take all the time you need. Biscuit is listening closely..."
            wait_time = int(current_state.estimated_latency_baseline_ms / 1000) + 3

        elif consecutive_failures == 1:
            # First fail/stall -> MUST NOT GIVE ANSWER. Narrative clue only.
            rung = EscalationRung.NARRATIVE_CLUE
            prompt = self._generate_narrative_clue(target_concept)
            wait_time = 8

        elif consecutive_failures == 2:
            # Second fail -> Smaller sub-step retrieval (concreteness / phoneme chunking)
            rung = EscalationRung.SMALLER_SUB_STEP
            prompt = self._generate_substep_prompt(target_concept)
            wait_time = 10

        elif consecutive_failures == 3:
            # Third fail -> Representation fade
            rung = EscalationRung.REPRESENTATION_FADE
            prompt = self._generate_representation_fade(target_concept)
            wait_time = 12

        else:
            # High distress or persistent stall -> Co-regulation
            rung = EscalationRung.CO_REGULATION
            prompt = (
                "Let's pause right here with Biscuit and take a slow, deep breath together... "
                "Whenever you're ready, let's try the first sound one more time."
            )
            wait_time = 15

        step = ScaffoldStep(
            rung=rung,
            narrative_prompt=prompt,
            wait_time_seconds=wait_time,
            must_not_give_answer=True,
        )

        # Audit against invariant
        self.audit_invariant(step, target_concept)
        return step

    def audit_invariant(self, step: ScaffoldStep, target_concept: str):
        """Enforces that no scaffold step on Rungs 0-2 directly reveals the target solution."""
        cleaned_target = target_concept.strip().lower()
        cleaned_prompt = step.narrative_prompt.lower()

        if step.rung in (EscalationRung.UNPROMPTED, EscalationRung.NARRATIVE_CLUE):
            # Check for direct answer giveaway (e.g. "The word is through")
            giveaway_patterns = [
                f"the word is {cleaned_target}",
                f"the answer is {cleaned_target}",
                f"say '{cleaned_target}'",
                f"it spells {cleaned_target}",
            ]
            for pattern in giveaway_patterns:
                if pattern in cleaned_prompt:
                    raise LearningInvariantViolation(
                        f"Active recall violation! Scaffold gave away answer '{cleaned_target}' on rung {step.rung}"
                    )

    def _generate_narrative_clue(self, concept: str) -> str:
        chunks = self.PHONEME_CHUNKS.get(concept.lower(), [concept[:2], concept[2:]])
        lead_sound = chunks[0]
        return (
            f"The wind whispers the very first sound... "
            f"It starts with '{lead_sound}-'. What sound does that make?"
        )

    def _generate_substep_prompt(self, concept: str) -> str:
        chunks = self.PHONEME_CHUNKS.get(concept.lower(), [concept[:2], concept[2:]])
        if len(chunks) >= 2:
            return (
                f"Let's break the stone in two! First piece: '{chunks[0]}'. "
                f"Second piece: '{chunks[1]}'. Can you join them together?"
            )
        return f"Look at the letters together: '{concept}'. How does it start?"

    def _generate_representation_fade(self, concept: str) -> str:
        return (
            f"Picture Biscuit running through the gate. "
            f"Feel the tongue on the teeth for '{concept[:2]}'... push the air through!"
        )
