import type { Profile, Session } from "./types";

// Parent notes land after session 1, 3 and 7, then every 7 after that.
export const CADENCE = [1, 3, 7];

export type WeekFacts = {
  throughDay: number;
  mastered: string[]; // stumbled in any session, and clean in the last 2 sessions it appeared in
  workingOn: string[]; // stumbled in either of the last 2 sessions
  timeToBreak: { day: number; date: string; weekday: string; minutes: number }[]; // flagged sessions only
  trend: "up" | "flat" | "down"; // last vs first timeToBreak; "flat" if < 2 entries or equal
  vsExpected: "above" | "near" | "below"; // last timeToBreak vs thresholds.expectedAttentionMin, +/- 1 min = near
  sessionsCount: number;
  cleanPages: number; // sessions with no stumbled words
};

export function reportDue(latestDay: number): boolean {
  if (!Number.isInteger(latestDay) || latestDay < 1) return false;
  return CADENCE.includes(latestDay) || latestDay % 7 === 0;
}

// Every day up to and including throughDay that gets a note. 7 -> [1, 3, 7]; 15 -> [1, 3, 7, 14].
export function reportDays(throughDay: number): number[] {
  const days: number[] = [];
  for (let d = 1; d <= throughDay; d++) {
    if (reportDue(d)) days.push(d);
  }
  return days;
}

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

// Long English weekday from a YYYY-MM-DD string, computed in UTC so the demo
// shows the same day in every timezone.
export function weekdayOf(isoDate: string): string {
  return WEEKDAYS[new Date(`${isoDate}T00:00:00Z`).getUTCDay()];
}

// `sessions` should already be sliced to day <= throughDay. Sorted here anyway
// so the result doesn't depend on the caller's ordering.
export function summarizeWeek(sessions: Session[], profile: Profile): WeekFacts {
  const ordered = [...sessions].sort((a, b) => a.day - b.day);
  const throughDay = ordered.length ? ordered[ordered.length - 1].day : 0;

  // Per word, in first-seen order: every status it has had, in session order.
  const history = new Map<string, Session["words"][number]["status"][]>();
  for (const session of ordered) {
    for (const w of session.words) {
      const key = w.word.toLowerCase();
      const statuses = history.get(key);
      if (statuses) statuses.push(w.status);
      else history.set(key, [w.status]);
    }
  }

  // Stumbled in either of the last two sessions overall. Wins over mastered.
  const recentlyStumbled = new Set<string>();
  for (const session of ordered.slice(-2)) {
    for (const w of session.words) {
      if (w.status === "stumbled") recentlyStumbled.add(w.word.toLowerCase());
    }
  }

  const mastered: string[] = [];
  const workingOn: string[] = [];
  for (const [word, statuses] of history) {
    if (recentlyStumbled.has(word)) {
      workingOn.push(word);
      continue;
    }
    const everStumbled = statuses.includes("stumbled");
    const lastTwo = statuses.slice(-2);
    const cleanLastTwo = lastTwo.length === 2 && lastTwo.every((s) => s === "clean");
    if (everStumbled && cleanLastTwo) mastered.push(word);
  }

  const timeToBreak = ordered
    .filter((s) => s.flagged && typeof s.secondsUntilFlag === "number")
    .map((s) => ({
      day: s.day,
      date: s.date,
      weekday: weekdayOf(s.date),
      minutes: Math.round((s.secondsUntilFlag as number) / 60),
    }));

  let trend: WeekFacts["trend"] = "flat";
  if (timeToBreak.length >= 2) {
    const first = timeToBreak[0].minutes;
    const last = timeToBreak[timeToBreak.length - 1].minutes;
    trend = last > first ? "up" : last < first ? "down" : "flat";
  }

  // No flagged session means she never needed a break, which is past what we
  // expected. With the seeded data day 1 is always flagged, so this only
  // matters for live data.
  let vsExpected: WeekFacts["vsExpected"] = "above";
  if (timeToBreak.length) {
    const last = timeToBreak[timeToBreak.length - 1].minutes;
    const expected = profile.thresholds.expectedAttentionMin;
    const diff = last - expected;
    vsExpected = Math.abs(diff) <= 1 ? "near" : diff > 0 ? "above" : "below";
  }

  const cleanPages = ordered.filter((s) => s.words.every((w) => w.status === "clean")).length;

  return {
    throughDay,
    mastered,
    workingOn,
    timeToBreak,
    trend,
    vsExpected,
    sessionsCount: ordered.length,
    cleanPages,
  };
}
