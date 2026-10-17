"""Dynamic Cognitive State Model & Dual-Channel Profiler for Wren.

Implements the fundamental learning insight:
"The state model is the product."
Two channels:
1. Parent Channel (declared priors: diagnoses, IEP accommodations, hyperfixations, triggers)
2. Behavioral Channel (inferred: latency, stumbles, pauses, retries, frustration index)
Behavior verifies, refines, and overrides priors over time.
"""

from datetime import datetime, timezone
from typing import Dict, List, Optional, Any
from pydantic import BaseModel, Field

from ..schemas.profile import ChildProfile, ParentPriors, BehavioralProfile
from ..schemas.telemetry import InteractionType, TelemetryEvent


class MasteryRecord(BaseModel):
    concept: str
    attempts: int = 0
    successes: int = 0
    consecutive_successes: int = 0
    last_practiced: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    next_review_day: int = 1
    mastered: bool = False


class DynamicCognitiveState(BaseModel):
    child_id: str
    # Rolling cognitive signals
    frustration_index: float = Field(default=0.0, ge=0.0, le=1.0)
    attention_battery: float = Field(default=1.0, ge=0.0, le=1.0, description="1.0 = fully focused, 0.0 = depleted")
    estimated_latency_baseline_ms: float = 3500.0
    
    # Session tracking
    session_elapsed_seconds: float = 0.0
    consecutive_stumbles: int = 0
    consecutive_pauses: int = 0
    stall_count: int = 0
    active_modality: str = "story"
    current_scaffold_tier: int = 0

    # Mastery ledger
    mastery_ledger: Dict[str, MasteryRecord] = Field(default_factory=dict)
    
    # Interest energy ledger (measures actual pull vs claimed interest)
    interest_engagement_scores: Dict[str, float] = Field(default_factory=dict)
    
    # Discrepancies between parent priors and behavioral reality
    observed_discrepancies: List[str] = Field(default_factory=list)


class CognitiveProfileEngine:
    """Manages profile evolution, applying behavioral telemetry to update the state model."""

    def __init__(self, profile: ChildProfile):
        self.profile = profile
        self.state = DynamicCognitiveState(
            child_id=profile.id,
            estimated_latency_baseline_ms=profile.behavioral.baseline_latency_ms,
            frustration_index=profile.behavioral.frustration_index,
        )
        self._init_mastery_ledger()
        self._init_interest_scores()

    def _init_mastery_ledger(self):
        for word in self.profile.behavioral.mastered_words:
            self.state.mastery_ledger[word] = MasteryRecord(
                concept=word,
                attempts=5,
                successes=5,
                consecutive_successes=3,
                mastered=True,
                next_review_day=7,
            )
        for word in self.profile.behavioral.struggled_words:
            self.state.mastery_ledger[word] = MasteryRecord(
                concept=word,
                attempts=3,
                successes=1,
                consecutive_successes=0,
                mastered=False,
                next_review_day=1,
            )

    def _init_interest_scores(self):
        for interest in self.profile.priors.interests:
            # Seed interest energy with declared prior of 0.5 (neutral positive)
            self.state.interest_engagement_scores[interest] = 0.5

    def update_from_interaction(
        self,
        event_type: InteractionType,
        latency_ms: Optional[float] = None,
        word: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> DynamicCognitiveState:
        """Processes real-time interaction signals and updates the cognitive state."""
        meta = metadata or {}

        # 1. Update attention battery based on elapsed time and diagnoses
        # Kids with ADHD have steeper initial decay unless re-anchored by high-interest stimuli
        has_adhd = any("adhd" in d.lower() for d in self.profile.priors.diagnoses)
        decay_rate = 0.0008 if has_adhd else 0.0004
        self.state.attention_battery = max(0.05, self.state.attention_battery - decay_rate * (latency_ms or 1000) / 1000)

        # 2. Process interaction event
        if event_type == InteractionType.WORD_READ:
            self._handle_successful_read(word, latency_ms)
        elif event_type == InteractionType.WORD_STUMBLE:
            self._handle_stumble(word, latency_ms)
        elif event_type == InteractionType.HESITATION_PAUSE:
            self._handle_hesitation(word, latency_ms)
        elif event_type == InteractionType.QUESTION_ATTEMPT:
            is_correct = meta.get("correct", False)
            self._handle_question_attempt(word, is_correct)
        elif event_type == InteractionType.UI_OFFER_ACCEPTED:
            offer = meta.get("offer", "presentation_tweak")
            if offer not in self.profile.behavioral.accepted_presentation_offers:
                self.profile.behavioral.accepted_presentation_offers.append(offer)
            # Accepted offers de-escalate frustration
            self.state.frustration_index = max(0.0, self.state.frustration_index - 0.15)

        # 3. Synchronize living profile with state
        self.profile.behavioral.frustration_index = round(self.state.frustration_index, 3)
        self.profile.behavioral.baseline_latency_ms = round(self.state.estimated_latency_baseline_ms, 1)
        self.profile.updated_at = datetime.now(timezone.utc)

        return self.state

    def _handle_successful_read(self, word: Optional[str], latency_ms: Optional[float]):
        self.state.consecutive_stumbles = 0
        self.state.consecutive_pauses = 0
        # Gentle recovery from frustration upon success
        self.state.frustration_index = max(0.0, self.state.frustration_index - 0.05)
        self.state.current_scaffold_tier = 0

        # Update latency baseline using moving average
        if latency_ms and latency_ms > 500:
            self.state.estimated_latency_baseline_ms = (
                0.85 * self.state.estimated_latency_baseline_ms + 0.15 * latency_ms
            )

        if word:
            rec = self.state.mastery_ledger.setdefault(word, MasteryRecord(concept=word))
            rec.attempts += 1
            rec.successes += 1
            rec.consecutive_successes += 1
            rec.last_practiced = datetime.now(timezone.utc)
            if rec.consecutive_successes >= 3:
                rec.mastered = True
                if word not in self.profile.behavioral.mastered_words:
                    self.profile.behavioral.mastered_words.append(word)
                if word in self.profile.behavioral.struggled_words:
                    self.profile.behavioral.struggled_words.remove(word)

    def _handle_stumble(self, word: Optional[str], latency_ms: Optional[float]):
        self.state.consecutive_stumbles += 1
        # Frustration ramps up with consecutive stumbles
        delta = 0.10 + (0.05 * self.state.consecutive_stumbles)
        self.state.frustration_index = min(1.0, self.state.frustration_index + delta)

        if word:
            rec = self.state.mastery_ledger.setdefault(word, MasteryRecord(concept=word))
            rec.attempts += 1
            rec.consecutive_successes = 0
            rec.mastered = False
            rec.last_practiced = datetime.now(timezone.utc)
            if word not in self.profile.behavioral.struggled_words:
                self.profile.behavioral.struggled_words.append(word)

    def _handle_hesitation(self, word: Optional[str], latency_ms: Optional[float]):
        self.state.consecutive_pauses += 1
        dur = latency_ms or 4000.0
        
        # Check if pause exceeds the kid's baseline latency margin
        if dur > self.state.estimated_latency_baseline_ms * 1.5:
            self.state.stall_count += 1
            # Modest frustration increment; silence is respected
            self.state.frustration_index = min(1.0, self.state.frustration_index + 0.04)

    def _handle_question_attempt(self, concept: Optional[str], is_correct: bool):
        if is_correct:
            self.state.frustration_index = max(0.0, self.state.frustration_index - 0.1)
        else:
            self.state.frustration_index = min(1.0, self.state.frustration_index + 0.15)

    def record_interest_response(self, interest: str, energy_delta: float):
        """Records behavioral energy towards a topic (OQ #1 in README)."""
        score = self.state.interest_engagement_scores.get(interest, 0.5)
        new_score = max(0.0, min(1.0, score + energy_delta))
        self.state.interest_engagement_scores[interest] = round(new_score, 2)

        # Check for discrepancy: parent claimed high interest, but kid shows flatline
        if interest in self.profile.priors.interests and new_score < 0.25:
            disc = f"Parent declared high interest in '{interest}', but measured engagement flatlined at {new_score}."
            if disc not in self.state.observed_discrepancies:
                self.state.observed_discrepancies.append(disc)

    def get_effective_modality(self) -> str:
        """Dynamically decides modality based on state invariants."""
        # When attention battery is critically low (<0.2) or frustration high (>0.65), switch to micro-game or audio
        if self.state.frustration_index >= 0.65:
            return "audio_co_regulation"
        if self.state.attention_battery <= 0.25:
            return "visual_micro_game"
        return "story"
