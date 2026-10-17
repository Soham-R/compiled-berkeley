"""Profile schemas combining parent intake priors and dynamic behavioral observations."""

from datetime import datetime, timezone
from typing import List, Dict, Optional
from pydantic import BaseModel, Field


class ParentPriors(BaseModel):
    name: str = Field(..., description="Child's preferred first name")
    age: int = Field(..., ge=3, le=18, description="Child's chronological age")
    grade_band: str = Field(default="early-2", description="Target reading or academic grade level")
    diagnoses: List[str] = Field(default_factory=list, description="Declared neurodivergent profiles (e.g. ADHD, Dyslexia, ASD)")
    iep_accommodations: List[str] = Field(default_factory=list, description="Accommodations noted from IEP or 504 plans")
    interests: List[str] = Field(default_factory=list, description="Hyperfixations and topics of high organic interest")
    sensitivities: List[str] = Field(default_factory=list, description="Known sensory or cognitive overload triggers")
    known_difficulties: List[str] = Field(default_factory=list, description="Specific known stumbling points (e.g. th- blends, rapid transitions)")


class BehavioralProfile(BaseModel):
    baseline_latency_ms: float = Field(default=3500.0, description="Estimated healthy processing pause before answering")
    attention_window_minutes: float = Field(default=8.0, description="Sustained attention limit before modality switch is needed")
    preferred_modality: str = Field(default="story", description="Current highest-engagement modality (story, game, audio)")
    mastered_words: List[str] = Field(default_factory=list, description="Words/concepts verified via spaced repetition")
    struggled_words: List[str] = Field(default_factory=list, description="Current targets for diegetic reinforcement")
    accepted_presentation_offers: List[str] = Field(default_factory=list, description="UI adaptations accepted by the child")
    frustration_index: float = Field(default=0.0, ge=0.0, le=1.0, description="Rolling estimate of current cognitive strain")


class ChildProfile(BaseModel):
    id: str = Field(..., description="Unique child identifier")
    priors: ParentPriors = Field(..., description="Declared parent channel priors")
    behavioral: BehavioralProfile = Field(default_factory=BehavioralProfile, description="Inferred behavioral channel state")
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
