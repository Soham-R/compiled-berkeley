"""Tutor engine schemas: adaptive presentation, active recall scaffolding, and story beat contracts."""

from enum import Enum
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class FontChoice(str, Enum):
    LEXEND = "Lexend"
    ATKINSON_HYPERLEGIBLE = "Atkinson Hyperlegible"
    OPENDYSLEXIC = "OpenDyslexic"
    SYSTEM = "System"


class ContrastMode(str, Enum):
    DEFAULT = "default"
    CALM = "calm"
    HIGH_CONTRAST = "high_contrast"
    DARK = "dark"
    DIEGETIC_SCRIPT = "diegetic_script"


class PresentationSettings(BaseModel):
    font_family: FontChoice = Field(default=FontChoice.LEXEND)
    font_size_px: int = Field(default=22, ge=14, le=48)
    letter_spacing_em: float = Field(default=0.04, ge=0.0, le=0.2)
    line_height_em: float = Field(default=1.8, ge=1.2, le=3.0)
    contrast_mode: ContrastMode = Field(default=ContrastMode.DEFAULT)
    read_aloud_enabled: bool = False
    reduced_motion: bool = False
    visual_clutter_reduced: bool = True


class EscalationRung(int, Enum):
    UNPROMPTED = 0
    NARRATIVE_CLUE = 1
    SMALLER_SUB_STEP = 2
    REPRESENTATION_FADE = 3
    CO_REGULATION = 4


class ScaffoldStep(BaseModel):
    rung: EscalationRung = Field(..., description="Current level on the escalation ladder")
    narrative_prompt: str = Field(..., description="Diegetic prompt or clue preserving cognitive rigor")
    wait_time_seconds: int = Field(default=8, description="Patience period wrapped in suspense before offering next rung")
    must_not_give_answer: bool = Field(default=True, description="Strict learning invariant")


class QuestionItem(BaseModel):
    prompt: str
    options: List[str] = Field(..., min_length=2, max_length=4)
    explanation: Optional[str] = None


class PassageRequest(BaseModel):
    day: int = Field(..., ge=1)
    stumbled_words: List[str] = Field(default_factory=list)
    flagged: bool = False
    current_rung: EscalationRung = Field(default=EscalationRung.UNPROMPTED)
    session_elapsed_minutes: float = Field(default=0.0)


class PassageResponse(BaseModel):
    day: int
    passage: str
    target_words: List[str] = Field(default_factory=list)
    question: QuestionItem
    scaffold: Optional[ScaffoldStep] = None
    presentation: Optional[PresentationSettings] = None
    source: str = Field(default="claude", description="'claude' or 'fallback'")
