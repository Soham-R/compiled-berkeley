"""Tutor endpoints enforcing active recall, presentation adaptations, and passage delivery."""

from fastapi import APIRouter
from ..schemas.tutor import (
    PassageRequest,
    PassageResponse,
    QuestionItem,
    ScaffoldStep,
    EscalationRung,
    PresentationSettings,
    FontChoice,
    ContrastMode,
)

router = APIRouter(prefix="/api/v1/tutor", tags=["Tutor"])

# Hardcoded fallback passages from content/passages.json
FALLBACK_PASSAGES = [
    {
        "day": 1,
        "passage": "Sam walked through the park. I think there is a duck by the pond. There it is!",
        "target_words": ["through", "think", "there"],
        "question": {
            "prompt": "Where did Sam walk?",
            "options": ["Through the park", "To the store", "Up a hill"],
        },
    },
    {
        "day": 2,
        "passage": "Biscuit ran through the grass. Do you think Biscuit found a bone? Look right there!",
        "target_words": ["through", "think", "there"],
        "question": {
            "prompt": "What did Biscuit run through?",
            "options": ["The grass", "The mud", "The door"],
        },
    },
    {
        "day": 5,
        "passage": "Biscuit and Priya walked through the tall trees. Which path do you think leads there?",
        "target_words": ["through", "think", "there", "where", "which"],
        "question": {
            "prompt": "Who walked through the trees?",
            "options": ["Biscuit and Priya", "Only Sam", "The duck"],
        },
    },
]


@router.post("/next-passage", response_model=PassageResponse)
def get_next_passage(req: PassageRequest):
    # Select appropriate passage based on day
    matched = next((p for p in FALLBACK_PASSAGES if p["day"] >= req.day), FALLBACK_PASSAGES[-1])

    # Enforce active recall escalation step if needed
    scaffold = None
    if req.current_rung == EscalationRung.NARRATIVE_CLUE:
        scaffold = ScaffoldStep(
            rung=EscalationRung.NARRATIVE_CLUE,
            narrative_prompt="Listen closely to the breeze in the park... Can you spot the 'th-' sound near the path?",
            wait_time_seconds=10,
            must_not_give_answer=True,
        )

    # Adaptive presentation based on state
    presentation = PresentationSettings(
        font_family=FontChoice.ATKINSON_HYPERLEGIBLE,
        font_size_px=24 if req.flagged else 22,
        letter_spacing_em=0.06 if req.flagged else 0.04,
        line_height_em=2.0 if req.flagged else 1.8,
        contrast_mode=ContrastMode.CALM if req.flagged else ContrastMode.DEFAULT,
        read_aloud_enabled=req.flagged,
    )

    return PassageResponse(
        day=matched["day"],
        passage=matched["passage"],
        target_words=matched["target_words"],
        question=QuestionItem(**matched["question"]),
        scaffold=scaffold,
        presentation=presentation,
        source="backend-service",
    )
