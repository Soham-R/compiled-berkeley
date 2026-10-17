"""Profile endpoints for parent intake priors and dynamic behavioral state."""

import json
from pathlib import Path
from fastapi import APIRouter, HTTPException
from ..schemas.profile import ChildProfile, ParentPriors, BehavioralProfile

router = APIRouter(prefix="/api/v1/profile", tags=["Profile"])

_PROFILES: dict[str, ChildProfile] = {}


def _load_initial_profiles():
    # Try finding content/profiles.json relative to project root
    possible_paths = [
        Path(__file__).resolve().parent.parent.parent.parent / "content" / "profiles.json",
        Path(__file__).resolve().parent.parent.parent / "content" / "profiles.json",
        Path("content/profiles.json"),
    ]

    for p in possible_paths:
        if p.exists():
            try:
                with open(p, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    for item in data:
                        prof = ChildProfile(**item)
                        _PROFILES[prof.id] = prof
                return
            except Exception as e:
                print(f"[ProfileRouter] Failed loading {p}: {e}")

    # Fallback to default Maya profile if file is not found
    _PROFILES["maya"] = ChildProfile(
        id="maya",
        priors=ParentPriors(
            name="Maya",
            age=7,
            grade_band="early-2",
            diagnoses=["Dyslexia", "ADHD"],
            iep_accommodations=["Extra processing time", "Chunked text", "Read aloud options"],
            interests=["her dog Biscuit", "dinosaurs", "her little sister Priya"],
            sensitivities=["Rapid transitions", "dense unspaced text blocks"],
            known_difficulties=["decoding th- blends", "gets frustrated fast", "attention fades after ~8 minutes"],
        ),
        behavioral=BehavioralProfile(
            baseline_latency_ms=4200.0,
            attention_window_minutes=8.0,
            preferred_modality="story",
            mastered_words=["park", "duck", "pond"],
            struggled_words=["through", "think", "there"],
            accepted_presentation_offers=["Atkinson Hyperlegible", "wider_line_spacing"],
            frustration_index=0.2,
        ),
    )


_load_initial_profiles()


@router.get("", response_model=list[ChildProfile])
def list_profiles():
    return list(_PROFILES.values())


@router.get("/{child_id}", response_model=ChildProfile)
def get_profile(child_id: str):
    profile = _PROFILES.get(child_id)
    if not profile:
        raise HTTPException(status_code=404, detail=f"Child profile '{child_id}' not found")
    return profile


@router.post("", response_model=ChildProfile)
def upsert_profile(profile: ChildProfile):
    _PROFILES[profile.id] = profile
    return profile
