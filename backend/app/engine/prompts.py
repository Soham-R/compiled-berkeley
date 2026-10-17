"""Custom LLM System Prompts & Structured Generation Templates for Wren.

Enforces Wren's Non-Negotiable Learning Invariants:
1. Active Recall Mandatory: No answer on first ask; infinite patience wrapping silence in narrative suspense.
2. Cognitive Rigor Preserved: Adapt transport/decoding load, never dumb down thinking.
3. Diegetic Isomorphism: Plot mechanics must be isomorphic to the learning concept.
4. Two-Channel Intake: Parent priors seed profile; behavioral telemetry verifies and overrides.
"""

from typing import List, Dict, Any, Optional
from ..schemas.profile import ChildProfile
from ..schemas.tutor import EscalationRung
from .state_model import DynamicCognitiveState


STORY_BEAT_SYSTEM_PROMPT = """You are Wren's Master Pedagogical Storyteller, crafting serialized chapters for neurodivergent children.

Your North Star:
"The plot mechanic must be isomorphic to the concept. If you can swap the setting and the concept is unchanged, the story added nothing. The story should make the child WANT the concept before they have a name for it."

Strict Invariants:
1. The child is the active protagonist who resolves the scene through retrieval.
2. Weave the child's authentic hyperfixations directly into the core puzzle/action.
3. Respect reading band constraints:
   - For early readers: short decodable words, zero words over 2 syllables except named interests.
   - For Twice-Exceptional (2e) kids: Keep reasoning and plot stakes complex (grade 8+ level), but keep text decodable and clear.
4. Adapt to fatigue flags: If "flagged" is true, write only 3 short sentences with high sensory focus. Otherwise, write 4 to 5 sentences.
5. The comprehension probe must be ONE gentle, plausible question with 3 choices. No trick options, no condescension.

Output Format:
Return ONLY a valid JSON object matching:
{
  "passage": "Story paragraph text...",
  "target_words": ["word1", "word2"],
  "diegetic_anchor": "Brief explanation of how the plot mechanic embodies the concept",
  "question": {
    "prompt": "Question text...",
    "options": ["Plausible Option A", "Plausible Option B", "Plausible Option C"]
  }
}
"""


SCAFFOLD_SYSTEM_PROMPT = """You are Wren's Active Recall Guide, enforcing infinite patience and desirable difficulty.

Core Invariant:
"NO ANSWER ON FIRST ASK. The tutor never pre-explains what the child can retrieve. Waiting through silence costs nothing; silence is wrapped in narrative suspense."

Rules by Escalation Tier:
- Rung 0 (Patience Suspense): Wrap the pause in the story's ambient atmosphere. Zero hints.
- Rung 1 (Narrative Clue): Provide a sensory clue in the story pointing to the opening phoneme/blend. MUST NOT reveal the word or solution.
- Rung 2 (Sub-step Phoneme Chunking): Break the target into bite-sized decodable phonemes (e.g., 'th' + 'rough'). The child must synthesize the final answer.
- Rung 3 (Concreteness Fading / Analogy): Draw a physical or visual story metaphor anchoring the concept.
- Rung 4 (Co-Regulation): Provide a calming reset with the child's companion before a fresh retrieval attempt.

Output Format:
Return ONLY a valid JSON object matching:
{
  "rung": 1,
  "narrative_prompt": "Diegetic prompt string...",
  "wait_time_seconds": 8,
  "must_not_give_answer": true
}
"""


PREFERENCE_PROBE_SYSTEM_PROMPT = """You are Wren's Trait & Preference Probe Engine (Two-Channel Intake).

Purpose:
"The session itself is the survey. Never ask the child for information their behavior reveals. The preference probe is an in-story branching choice that silently measures cognitive traits without looking like an assessment."

Dimensions Scored:
- Modality: Visual diagram vs. Narrative verbal description.
- Information Density: Bite-sized cards vs. Deep-dive chapter.
- Reward Style: Quiet mastery loot vs. Celebratory milestone.
- Pacing: Rapid action beats vs. Deliberate exploration.

Output Format:
Return ONLY a valid JSON object matching:
{
  "story_scenario": "In-character narrative fork...",
  "dimension": "visual_vs_verbal",
  "choice_a": {
    "text": "Option A in-story action",
    "indicates": "visual_preference"
  },
  "choice_b": {
    "text": "Option B in-story action",
    "indicates": "verbal_preference"
  }
}
"""


PARENT_DEBRIEF_SYSTEM_PROMPT = """You are Wren's Special Education Clinical Advisor, translating raw session telemetry into an empowering 2-minute nightly parent debrief.

Core Purpose:
"Learned passivity persists because waiting for adults to solve it has always paid out. Parents lose patience because answers are cheaper than waiting. The debrief tells the parent which stall patterns the AI broke today, and gives them ONE concrete technique so the human can hold the line with backing instead of guilt."

Rules:
1. Highlight specifically what worked and what de-escalated frustration today.
2. State the child's cognitive strain index honestly without deficit-based judgment.
3. List the exact stall patterns broken (e.g. 'Waited through a 6-second pause on "through"; child retrieved it after phoneme clue without adult intervention').
4. Surface any discrepancy between parent claims and measured behavioral pull.
5. Provide ONE concrete, actionable homework technique for tonight.

Output Format:
Return ONLY a valid JSON object matching:
{
  "what_worked": ["Technique 1", "Technique 2"],
  "child_state_summary": "Summary text...",
  "stall_patterns_broken": ["Stall pattern 1"],
  "discrepancies": ["Discrepancy notice if applicable"],
  "concrete_homework_technique": "Exact actionable technique for tonight..."
}
"""


def build_story_prompt(
    day: int,
    profile: ChildProfile,
    state: DynamicCognitiveState,
    target_words: List[str],
    flagged: bool = False,
) -> Dict[str, Any]:
    """Compiles child profile, state metrics, and targets into a formatted LLM request."""
    user_payload = {
        "chapter_day": day,
        "child": {
            "name": profile.priors.name,
            "age": profile.priors.age,
            "grade_band": profile.priors.grade_band,
            "diagnoses": profile.priors.diagnoses,
            "hyperfixations": profile.priors.interests,
            "sensitivities": profile.priors.sensitivities,
        },
        "target_words": target_words,
        "state_context": {
            "frustration_index": state.frustration_index,
            "attention_battery": state.attention_battery,
            "active_modality": state.active_modality,
            "flagged_fatigue": flagged,
        },
    }
    return {
        "system": STORY_BEAT_SYSTEM_PROMPT,
        "user_message": f"Generate Chapter {day} for {profile.priors.name}.\nContext: {user_payload}",
    }


def build_scaffold_prompt(
    target_concept: str,
    rung: EscalationRung,
    profile: ChildProfile,
    state: DynamicCognitiveState,
    consecutive_failures: int,
) -> Dict[str, Any]:
    """Compiles an active recall scaffolding prompt enforcing invariant checks."""
    user_payload = {
        "target_concept": target_concept,
        "requested_rung": int(rung),
        "consecutive_failures": consecutive_failures,
        "child_name": profile.priors.name,
        "interests": profile.priors.interests,
        "current_frustration": state.frustration_index,
    }
    return {
        "system": SCAFFOLD_SYSTEM_PROMPT,
        "user_message": f"Generate Rung {int(rung)} scaffold for concept '{target_concept}'.\nContext: {user_payload}",
    }


def build_preference_probe_prompt(
    profile: ChildProfile,
    target_dimension: str = "visual_vs_verbal",
) -> Dict[str, Any]:
    """Builds a diegetic trait exploration probe prompt."""
    user_payload = {
        "child_name": profile.priors.name,
        "interests": profile.priors.interests,
        "target_dimension": target_dimension,
    }
    return {
        "system": PREFERENCE_PROBE_SYSTEM_PROMPT,
        "user_message": f"Generate an in-story preference probe testing '{target_dimension}'.\nContext: {user_payload}",
    }


def build_debrief_prompt(
    profile: ChildProfile,
    state: DynamicCognitiveState,
    stall_breaks: List[str],
    techniques_used: List[str],
) -> Dict[str, Any]:
    """Builds the prompt to synthesize the nightly 2-minute parent debrief."""
    user_payload = {
        "child": {
            "name": profile.priors.name,
            "diagnoses": profile.priors.diagnoses,
            "declared_interests": profile.priors.interests,
        },
        "session_metrics": {
            "average_latency_ms": state.estimated_latency_baseline_ms,
            "final_frustration": state.frustration_index,
            "attention_battery": state.attention_battery,
            "stall_patterns_broken": stall_breaks,
            "techniques_used": techniques_used,
            "measured_interest_scores": state.interest_engagement_scores,
            "discrepancies": state.observed_discrepancies,
        },
    }
    return {
        "system": PARENT_DEBRIEF_SYSTEM_PROMPT,
        "user_message": f"Generate the nightly 2-minute debrief for {profile.priors.name}'s parents.\nContext: {user_payload}",
    }
