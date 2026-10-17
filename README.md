# Alder — a Primer for the kids the system fails

*(repo: compiled-berkeley hackathon — Compiled Berkeley 2026)*

> **Living document.** This README adapts as we poke, prod, and question the idea —
> every hard question that reshapes the design gets recorded here, along with the answer.

**One-liner:** A voice-driven AI reading tutor that builds a live, evolving model of how
*your* child's attention, memory, and emotions actually work — then reshapes every
lesson, pacing decision, and even the screen's sounds and colors around it. Built first
for neurodivergent kids (ADHD, dyslexia, autism), where "one-size-fits-most" already
failed.

---

## The core insight

For these kids the bottleneck isn't explanation — it's **state**. A great special-ed
tutor doesn't explain letters better than a video does; they *read the room*: downshift
before the meltdown, switch modality when working memory fills, turn a worksheet into a
game when motivation dies. Edtech has never been able to do that because it can't see
the child. Wren can — voice gives it prosody, latency, and hesitation; the screen gives
it taps, gaze paths, and motor control. Every interaction is a measurement.

## The product surface, end to end

### 1. Parent onboarding — the declared channel

At account creation, the parent completes an initial profile about the child:
diagnoses and labels, IEP/504 plan details, sensory sensitivities, what has worked and
what has bombed before, daily schedule constraints. It stays editable forever — the
parent can amend it whenever they notice something new ("he's been bouncing off the
walls since his meds changed").

**The rule binding the two channels: the Parent Channel seeds priors; the Behavioral
Channel updates them.** Parent info is a hypothesis to verify, not ground truth — kids
with identical labels present completely differently. The label is the starting guess;
the kid is the dataset. When the two channels disagree ("he loves dinosaurs" vs. twenty
sessions of measured flatline on dinosaurs), the discrepancy is surfaced in the parent
report rather than silently resolved.

### 2. Initial benchmark — three checks, disguised as play

Before teaching begins, the child plays three short games. They experience it as play;
the app is calibrating:

- **Visual tracking & fine motor check.** Tapping moving objects on the screen.
  Measures motor control and tap accuracy — the baseline for how much visual and motor
  load a lesson beat can carry.
- **Working memory check.** "Find 2 red apples" versus "Find 1 red apple, then 1 green
  leaf." Directly tests 1-step vs. 2-step instruction limits — the measurement that
  feeds the chunker, telling the tutor exactly how long a beat can be and how many
  instructions can ride in one sentence.
- **Speech/prosody calibration.** The child mimics a sound. Captures baseline pitch,
  speech rate, and loudness — the reference signature against which every later
  frustration, fatigue, or flow detection is compared.

The benchmark seeds the profile. Every session after that updates it. Direct
measurement first, behavioral refinement forever.

### 3. Live language teaching — the heart of the product

The child reads aloud; Wren listens and helps live. Sounding out, decoding,
comprehension — with intervention arriving *at the right moment, not before*: the tutor
hears the attempt, waits through the struggle that is productive, and steps in only
when the struggle stops paying. Reading load and reasoning load are controlled
separately — for a dyslexic child, decoding support drops to zero cost (read-aloud,
speech-to-text for their writing) while comprehension stays a grade level *up*.

### 4. The tutor's disposition — patience as the core resource

Wren is the Primer's promise made concrete: an AI tutor that never runs out of patience
or time. This is not a tone nicety; it is the mechanism that fixes the special-ed
status quo, where exhausted humans hand over answers and kids learn that stalling
works:

- **No answer on first ask — ever.** One retrieval attempt before any hint, no
  exceptions. The kid's one proven strategy (stall until the adult solves it) goes
  extinct — and because the AI never gets irritated while holding the line, retrieval
  attempts never become associated with anger.
- **Silence is survivable inside a story.** The wait for a child's answer is converted
  into narrative suspense — the rope holds, the door hums — so the pause becomes the
  most gripping part of the chapter instead of dead air.
- **The escalation ladder replaces the answer.** When the child is genuinely stuck,
  Wren offers smaller steps of the *same* retrieval — never the resolution. There is
  always another rung, which makes holding the line humane for low frustration
  tolerance rather than punishing.
- **The state model decides where the line is.** Adaptivity moves the *entry point* of
  effort (chunk size, modality, decoding load) — never removes the effort itself.
  Easier is the ramp; active is the invariant.

### 5. Memory across everything — one model of one child

A single persistent profile spans every aspect of the child's information and life:
benchmark results, interest signals, state history, capability estimates, presentation
preferences, reward responsiveness. It feeds every tuning decision — beat length,
modality mix, escalation depth, screen presentation, story world — and accrues session
over session, because interests rotate monthly and abilities shift weekly. The profile
is never "filled out"; it is continuously re-estimated.

Interests themselves are discovered without surveys — the session is the survey. The
narrator leaves open doors and watches which ones the child walks through; off-script
intrusions ("did you know T-rex arms couldn't reach its mouth?") are captured as the
highest-value interest signal, not dismissed as distraction; what the child raises
first next session reveals what stuck. Never ask the *kid* for information their
behavior will reveal.

### 6. Parent reports — scheduled, honest, specific

Summaries go out to parents after the 1st, 3rd, and 7th sessions, then weekly. Each
report shows not just *what* happened but *why*: what state the child was in, which
stall patterns Wren broke that day, which presentation adjustments were made and what
triggered them — plus one concrete technique the parent can use at homework time. The
AI does the waiting so the human can afford to wait too.

### 7. Calming methods — the downshift, built in

When distress is detected, Wren has structured routines to bring the child down:
slowing the voice, shortening beats, introducing a physical action, shifting the story
to a calmer register. The goal is never to end the session in failure — the story
recedes to a gentler tempo and the session ends in mastery of something small.

### 8. The mood variable — presentation as runtime state

A backend mood variable drives live UI adaptation every frame: mute sounds, change
colors and contrast, calm the palette when signals say noise is piling up. Presentation
adapts *with consent, not by force* — changes are offered one tap away, and accepted
offers become the new baseline over time. The knobs control the *transport* of
information, never the thinking: fonts (including dyslexia-legible options), letter and
line spacing, contrast, motion, and audio are all safely adaptive because they change
how content arrives, not what the child must do with it.

---

## The science floor (non-negotiable)

Making learning *feel* easy and making learning *work* are anti-correlated — the
friction is the mechanism. So story and adaptivity may change **how effort is invited,
never whether effort happens**:

1. **Active recall is mandatory.** No answer on first ask; one retrieval attempt before
   any hint, always.
2. **Spaced repetition, invisibly.** Past material resurfaces at expanding intervals —
   diegetically, as story callbacks, so review is indistinguishable from plot.
3. **Mixed practice.** The lesson braids several skills so the child never knows which
   one a beat will demand; blocked drilling feels better and performs worse.
4. **Desirable difficulty, preserved.** Support adapts (modality, chunking, decoding
   load, presentation); the cognitive core of the task does not.
5. **Generation effect.** Child-made examples beat presented ones; the tutor critiques
   the child's inventions rather than supplying its own.
6. **Concrete → representation → abstract.** Concepts enter as lived scenes, get drawn
   or gestured, and only then receive symbols.
7. **Feedback on the attempt, not verdicts.** Immediate and specific about *what the
   child tried and where it broke* — praise lands on process and strategy, never
   confetti.

**The honest failure mode we design against:** an AI tutor that is too good is a
cheat-code machine. The state model's job is asymmetric — detect *stuck-frustrated*
(scaffold immediately) versus *struggling-productively* (protect the struggle,
narratively disguised as suspense).

---

## Team build plan (recorded 2026-10-17)

Four team members, four workstreams, one branch each — all merging to `main`, with the
shared contracts (profile schema, session-event format, UI choke point) committed
first so merge day isn't where the project dies.

| # | Component | Branch | Owns |
|---|---|---|---|
| 1 | **Live reading & teaching loop** | `feat/reading` | The core session: listen to read-alouds, sounding-out help, live intervention timing, reading/writing load-shifting |
| 2 | **Benchmark & state detection** | `feat/benchmark` | The three calibration checks (motor, working memory, prosody baseline) + the runtime signal layer: frustration/flow/fatigue detection from voice, taps, and latency |
| 3 | **Mood, calming & presentation** | `feat/mood` | The backend mood variable, calming downshift routines, and everything presentation: sounds, colors, contrast, fonts, spacing — the adaptive UI layer |
| 4 | **Memory, profile & parent reports** | `feat/memory` | The persistent profile (two intake channels + behavioral accrual), interest discovery, and the scheduled parent reports (1st/3rd/7th, then weekly) |

**Assignment:** Zishaan — emotional regulation work within `feat/mood` (the detection
side and calming routines), partnering with the presentation layer.

---

*Next open questions on deck: demo script and tech stack for the hackathon build.*
