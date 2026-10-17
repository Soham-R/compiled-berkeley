"""Diegetic Spaced Repetition Engine.

Operationalizes invariant:
"Spaced repetition, invisibly. The scheduling engine treats mastered concepts
the way Anki treats cards — resurfacing them at expanding intervals. But the
resurfacing is diegetic: the concept from three weeks ago comes back because
the plot needs it."
"""

from typing import List, Dict, Tuple
from .state_model import DynamicCognitiveState, MasteryRecord


class DiegeticSpacedRepetition:
    """Manages expanding intervals and selects words/concepts for upcoming chapters."""

    # Fibonacci / expanding review intervals (days)
    INTERVAL_LADDER = [1, 2, 4, 7, 14, 28]

    def __init__(self):
        pass

    def schedule_next_review(self, record: MasteryRecord, success: bool, current_day: int) -> int:
        """Updates the review interval for a concept based on recall success."""
        if success:
            # Advance to next interval rung
            cur_idx = 0
            for idx, interval in enumerate(self.INTERVAL_LADDER):
                if record.next_review_day - current_day <= interval:
                    cur_idx = idx
                    break
            next_interval = self.INTERVAL_LADDER[min(cur_idx + 1, len(self.INTERVAL_LADDER) - 1)]
            record.next_review_day = current_day + next_interval
        else:
            # Fall back to immediate review interval
            record.next_review_day = current_day + 1

        return record.next_review_day

    def get_due_concepts(self, state: DynamicCognitiveState, current_day: int, max_items: int = 3) -> List[str]:
        """Returns words or concepts due for diegetic review on the current day."""
        due: List[Tuple[str, int]] = []

        for word, rec in state.mastery_ledger.items():
            if rec.next_review_day <= current_day:
                # Priority: struggled words or items overdue longest
                urgency = (current_day - rec.next_review_day) + (2 if not rec.mastered else 0)
                due.append((word, urgency))

        # Sort by urgency descending
        due.sort(key=lambda x: x[1], reverse=True)
        return [item[0] for item in due[:max_items]]

    def weave_review_targets(
        self,
        current_day: int,
        primary_targets: List[str],
        state: DynamicCognitiveState,
    ) -> List[str]:
        """Combines new lesson targets with due spaced repetition targets."""
        due_items = self.get_due_concepts(state, current_day, max_items=2)
        combined = list(primary_targets)
        for item in due_items:
            if item not in combined:
                combined.append(item)
        return combined
