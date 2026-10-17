"""Serialized Story Beat & Curriculum Generation Engine.

Generates serialized story chapters with the child as protagonist,
diegetically weaving target phonics/words and hyperfixations.
Operates with Claude 3.5 / OpenAI if API key available, or archetype-tailored fallback.
"""

import os
import json
from typing import List, Optional, Dict, Any
import httpx

from ..schemas.profile import ChildProfile
from ..schemas.tutor import PassageResponse, QuestionItem, PresentationSettings, FontChoice, ContrastMode
from .state_model import DynamicCognitiveState
from .prompts import build_story_prompt, STORY_BEAT_SYSTEM_PROMPT


class StoryGenerator:
    """Generates personalized story beats respecting vocabulary and state constraints."""

    # Archetype-tailored offline story beats for deterministic execution and testing
    ARCHETYPE_TEMPLATES: Dict[str, Dict[int, Dict[str, Any]]] = {
        "maya": {
            1: {
                "passage": "Maya walked through the park with her loyal dog Biscuit. \"I think there is a hidden fossil by the pond,\" whispered Biscuit. Maya looked close. There it was!",
                "target_words": ["through", "think", "there"],
                "question": {
                    "prompt": "What did Maya and Biscuit look for by the pond?",
                    "options": ["A hidden fossil", "A green ball", "A lost hat"],
                },
            },
            2: {
                "passage": "Biscuit ran fast through the tall ferns. Did Priya think a small dinosaur left those tracks? Look right there under the leaf!",
                "target_words": ["through", "think", "there"],
                "question": {
                    "prompt": "What did they look for under the leaf?",
                    "options": ["Dinosaur tracks", "A toy truck", "A shiny coin"],
                },
            },
        },
        "leo": {
            1: {
                "passage": "Leo dashed across the volcanic ledge. The redstone circuit sparked bright red! As magma pressure climbed, Leo adjusted the repeater just in time.",
                "target_words": ["circuit", "pressure", "velocity"],
                "question": {
                    "prompt": "What climbed as the redstone sparked?",
                    "options": ["Magma pressure", "The cool wind", "A stone wall"],
                },
            },
            2: {
                "passage": "Leo launched the orbital escape pod. At escape velocity, the thruster circuit engaged with a steady hum! The pressure gauges stabilized at zero.",
                "target_words": ["circuit", "pressure", "velocity"],
                "question": {
                    "prompt": "What stabilized at zero when the circuit engaged?",
                    "options": ["Pressure gauges", "The star map", "The radio dials"],
                },
            },
        },
        "samira": {
            1: {
                "passage": "Samira steered the deep sub into the silent midnight trench. A gentle blue lantern jellyfish illuminated the rocky ridge. The ocean current was completely calm.",
                "target_words": ["current", "lantern", "trench"],
                "question": {
                    "prompt": "What color was the lantern jellyfish in the trench?",
                    "options": ["Gentle blue", "Bright red", "Dark purple"],
                },
            },
            2: {
                "passage": "The express train followed the coastal trench schedule precisely. Samira noted the amber lantern on track four. The electric current powered each carriage smoothly.",
                "target_words": ["current", "lantern", "trench"],
                "question": {
                    "prompt": "Where was the amber lantern positioned?",
                    "options": ["On track four", "Inside the tunnel", "On the bridge"],
                },
            },
        },
        "julian": {
            1: {
                "passage": "Julian examined the brass lock mechanism inside the archive chamber. Every piece of forensic evidence pointed to an ancient cipher. His initial hypothesis was confirmed.",
                "target_words": ["mechanism", "evidence", "hypothesis"],
                "question": {
                    "prompt": "What did the forensic evidence point toward?",
                    "options": ["An ancient cipher", "A broken key", "An open window"],
                },
            },
            2: {
                "passage": "The chimera sculpture concealed an intricate clockwork mechanism. Julian gathered the physical evidence from the stone plinth, proving his architectural hypothesis.",
                "target_words": ["mechanism", "evidence", "hypothesis"],
                "question": {
                    "prompt": "Where did Julian gather the physical evidence from?",
                    "options": ["The stone plinth", "The library floor", "The garden path"],
                },
            },
        },
    }

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv("ANTHROPIC_API_KEY")

    def generate_story_beat(
        self,
        day: int,
        profile: ChildProfile,
        state: DynamicCognitiveState,
        target_words: List[str],
        flagged: bool = False,
    ) -> PassageResponse:
        """Generates the next chapter using LLM if available, or archetype-tailored fallback."""
        if self.api_key:
            try:
                return self._generate_with_claude(day, profile, state, target_words, flagged)
            except Exception as e:
                print(f"[StoryGenerator] LLM generation fell back: {e}")

        return self._generate_offline(day, profile, state, target_words, flagged)

    def _generate_with_claude(
        self,
        day: int,
        profile: ChildProfile,
        state: DynamicCognitiveState,
        target_words: List[str],
        flagged: bool,
    ) -> PassageResponse:
        prompt_data = build_story_prompt(day, profile, state, target_words, flagged)

        headers = {
            "x-api-key": self.api_key,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json",
        }
        body = {
            "model": "claude-3-5-sonnet-20241022",
            "max_tokens": 500,
            "system": prompt_data["system"],
            "messages": [
                {
                    "role": "user",
                    "content": prompt_data["user_message"],
                }
            ],
        }

        with httpx.Client(timeout=8.0) as client:
            resp = client.post("https://api.anthropic.com/v1/messages", headers=headers, json=body)
            resp.raise_for_status()
            data = resp.json()
            text = data["content"][0]["text"]
            clean_json = text[text.find("{") : text.rfind("}") + 1]
            parsed = json.loads(clean_json)

            presentation = self._compute_presentation(profile, state, flagged)
            return PassageResponse(
                day=day,
                passage=parsed["passage"],
                target_words=parsed.get("target_words", target_words),
                question=QuestionItem(**parsed["question"]),
                presentation=presentation,
                source="claude-3-5-sonnet",
            )

    def _generate_offline(
        self,
        day: int,
        profile: ChildProfile,
        state: DynamicCognitiveState,
        target_words: List[str],
        flagged: bool,
    ) -> PassageResponse:
        cid = profile.id.lower()
        child_templates = self.ARCHETYPE_TEMPLATES.get(cid, self.ARCHETYPE_TEMPLATES["maya"])
        template = child_templates.get(day, child_templates.get(1))

        passage_text = template["passage"]
        presentation = self._compute_presentation(profile, state, flagged)

        return PassageResponse(
            day=day,
            passage=passage_text,
            target_words=template["target_words"],
            question=QuestionItem(**template["question"]),
            presentation=presentation,
            source="archetype-offline-engine",
        )

    def _compute_presentation(
        self,
        profile: ChildProfile,
        state: DynamicCognitiveState,
        flagged: bool,
    ) -> PresentationSettings:
        has_dyslexia = any("dyslexia" in d.lower() for d in profile.priors.diagnoses)
        has_sensory = any("sensory" in d.lower() or "autism" in d.lower() for d in profile.priors.diagnoses)

        font = FontChoice.ATKINSON_HYPERLEGIBLE if has_dyslexia else FontChoice.LEXEND
        contrast = ContrastMode.CALM if (flagged or has_sensory) else ContrastMode.DEFAULT

        return PresentationSettings(
            font_family=font,
            font_size_px=24 if flagged else 22,
            letter_spacing_em=0.06 if (flagged or has_dyslexia) else 0.04,
            line_height_em=2.0 if (flagged or has_dyslexia) else 1.8,
            contrast_mode=contrast,
            read_aloud_enabled=flagged,
            reduced_motion=True,
            visual_clutter_reduced=True,
        )
