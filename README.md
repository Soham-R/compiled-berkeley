# Wren — a Primer for the kids the system fails

*(repo: compiled-berkeley hackathon)*

> **Living document.** This README adapts as we poke, prod, and question the idea —
> every hard question that reshapes the design gets recorded here, along with the answer.

**One-liner:** An AI tutor that builds a live, evolving model of how *your* child's
attention, memory, and motivation actually work — then reshapes every story, task, and
pacing decision around it. Built first for neurodivergent kids (ADHD, dyslexia, autism),
where "one-size-fits-most" already failed.

---

## The core insight

For these kids the bottleneck isn't explanation — it's **state**. A great special-ed
tutor doesn't explain fractions better than a video does; they *read the room*: downshift
before the meltdown, switch modality when working memory fills, convert a worksheet into
a game when motivation dies. Edtech has never been able to do that because it can't see
the child. Voice AI can — prosody alone tells you frustration, fatigue, and flow.

## How it works

1. **Serialized story as the universal wrapper.** One continuous personalized story;
   the kid is the protagonist. Skills are never drilled in the abstract — each day's
   chapter advances both the plot and the skill.
2. **The state model is the product.** Every session updates a cognitive profile:
   attention curves by time of day, frustration triggers, modality preferences,
   working-memory limits, what rewards land. Re-tuned per session, not per age group.
3. **Load-shifting, not dumbing down.** For dyslexia: decoding load can drop to zero
   (read-aloud, speech-to-text) while reasoning stays a grade level *up*. For ADHD:
   tasks chunked into story beats with stakes and a physical action between each.
4. **The parent is a user too.** Nightly 2-minute debrief: what worked, what state the
   kid was in, one concrete technique for homework time.
5. **Never punitive, always mastery-based.** Retry loops disguised as plot; the story
   never "fails."

## How the story scales to hard material

The theme (dinosaurs, Minecraft) is scaffolding, not the product. What scales to calculus
is the *mechanism*:

- **The plot mechanic must be isomorphic to the concept.** If you can swap the setting
  and the math is unchanged, the story added nothing. A flooding mine manufactures
  *authentic demand* for the instantaneous rate of change; a dragon's committed instant
  flight path *is* the tangent line. The story should make you *want the concept* before
  you have a name for it.
- **Concept first, name later — names as loot.** The kid does the limiting process
  ("scribe, record faster… faster…") across chapters before being told it's called a
  derivative.
- **The story migrates from wrapper to world.** For a 15-year-old, the "story" becomes
  real stakes they care about: their own screen-time curve, a fantasy-sports lineup, a
  viral video's spread rate. The gimmick dissolves into "tutoring through problems you
  actually care about" — which is what a great human tutor does for adults.
- **Deliberate de-wrapping.** Every arc ends with the same problem stated bare, and the
  kid led to notice: "wait, this is the dragon flood." The story is a memory anchor the
  symbol points back to, not a disguise. This kills the classic transfer problem of
  story-based math.
- **For ADHD kids specifically, plot continuity is a working-memory prosthesis.** An
  abstract symbol chain evaporates mid-chain; a scene with a shape doesn't. Symbols hang
  off remembered scenes.

---

## Open question #1 — How do we find a kid's interests without surveys?

**The question.** The story adapts to what the kid loves (dinosaurs, Minecraft…), but
asking them — or making parents fill out interest questionnaires — is odd, cumbersome,
and probably wrong anyway (kids' reported interests ≠ what actually hooks them, and
interests shift week to week).

**The answer: you already have the signal. The session itself is the survey.**

Every interaction the kid has with the tutor is a continuous, passive, honest interest
probe. No form can compete with this because the kid never knows they're answering:

1. **Spontaneous topic-foraging.** The narrator leaves open doors in conversation and
   watches which ones the kid walks through. ("…and the tunnel branched three ways" —
   does the kid ask about the cave, the machine, or the creature?) Free association,
   naturally elicited, every session.
2. **Energy asymmetry.** When the story touches X, the kid's prosody, latency, and
   unprompted elaborations spike; when it touches Y, they flatline. The tutor runs this
   comparison continuously. This measures *actual* pull, not claimed interest — which is
   exactly what surveys can't do.
3. **The intrusions test.** When the kid goes off-script ("did you know T-rex arms
   couldn't even reach its mouth?"), that's not a distraction — that's the single
   highest-value interest signal in the whole session, because it's *unprompted and
   self-motivated*. The tutor captures it, and the next chapter bends toward it. The
   "distraction" becomes the curriculum.
4. **Exit-velocity.** What the kid brings up *first* next session unprompted ("is the
   dragon still there?") reveals what actually stuck and mattered.
5. **The demo trick (cold-start honesty).** For the hackathon build, a "cold-start"
   chapter is written to be deliberately genre-flexible — a mystery where the kid's
   three questions to three suspects each pull the story toward a different world
   (tech, creatures, adventure). Ten minutes of conversation later, the tutor has a
   seeded interest profile that would have taken a 40-question survey — and the kid
   experienced it as playing a game.

**Design consequence:** interest discovery isn't an onboarding step, it's a permanent
background process. The profile is never "filled out," it's *continuously re-estimated* —
which also handles the fact that a 8-year-old's obsessions rotate on a monthly basis.
A survey is a snapshot; the session stream is a live feed.

**Generalizing rule (recorded 2026-10-17):** never ask the *kid* for information their
behavior with the product will reveal. If a question feels cumbersome, that's the
design's confession that it isn't listening hard enough. (Note the refinement in
Open question #4: this rule applies to the *kid's* channel — the **parent** survey is
a legitimate, necessary intake channel for things behavior can't show, like diagnoses
and IEP details. The two-channel rule: parent declares, behavior verifies.)

## Non-negotiable: the science of learning is the floor, not a feature

There's a well-documented trap in edtech (and in AI tutors generally): making learning
*feel* easy and making learning *work* are anti-correlated. Fluency illusion, desirable
difficulty, the generation effect — the friction is the mechanism. A tool that smooths
friction away produces students who feel like experts and test like novices. So the
design constraint is: **story and state-adaptivity may only change *how* effort is
invited, never *whether* effort happens.**

Concretely, the evidence-backed methods and how Wren implements them:

1. **Active recall is mandatory.** The tutor never pre-explains what the kid can
   retrieve. Every chapter's resolution requires the kid to *produce* the answer, not
   recognize it. The LLM is allowed to ask, wait through the silence, and only then
   scaffold — the reverse of chatbot default behavior (instant answer = zero learning).
   Hard rule: **no answer on first ask.** One retrieval attempt before any hint, always.
2. **Spaced repetition, invisibly.** The scheduling engine treats mastered concepts the
   way Anki treats cards — resurfacing them at expanding intervals. But the resurfacing
   is diegetic: the flooding-mine concept from three weeks ago comes back *because the
   plot needs it* ("the well you dug in Chapter 4 is failing — why?"). Spaced repetition
   usually loses to novelty because it feels like homework; here the review is
   indistinguishable from a story callback.
3. **Mixed (interleaved) practice.** Blocked practice feels better and performs worse.
   The story structure is a natural interleaver: an arc braids 3–4 concepts, and the kid
   never knows which one a beat will demand. Where a worksheet says "ten derivative
   problems in a row," the plot says "this chapter needs yesterday's rate, last week's
   area, and a unit conversion — in what order?"
4. **Desirable difficulty, preserved.** The state model adapts *support* (modality,
   chunking, decoding load, and all presentation: fonts, spacing, contrast, motion —
   see Open question #3), never the *cognitive core* of the task. For dyslexia we
   lower the reading load, not the reasoning load. The line: the tutor may remove
   obstacles between the kid and the thinking, never the thinking itself.
5. **Generation effect.** Kid-derived examples beat presented ones. "Make up a flood
   that rises faster than this one" creates the memory trace; the tutor then critiques
   the kid's example rather than supplying its own.
6. **Concrete → representation → abstract.** Concepts always enter as lived story
   scenes, get drawn or gestured, and only then receive symbols. The de-wrapping ritual
   (see above) *is* the concreteness-fading literature, operationalized.
7. **Feedback loops, not verdicts.** Immediate, specific, on the *attempt*: what the kid
   tried, where it broke, what that reveals. No "good job!" confetti — praise lands on
   process and strategy, per the growth-mindset literature.

**The honest failure mode we design against:** an AI tutor that is too good is a
cheat-code machine. If the story gets *in the way* of the kid retrieving, it must yield —
but if it starts *retrieving for* the kid, it's poison. The state model's job is
asymmetric: detect when the kid is *stuck-frustrated* (scaffold immediately) versus
*struggling-productively* (protect the struggle, narratively disguise it as suspense).

---

## Open question #2 — The patience paradox: who holds the line when everyone else gives answers?

**The question.** There's a tension between "make learning easier" (adaptivity, lower
load) and "never let it be passive" (active recall, desirable difficulty). And it's
sharpest in special-needs education, where the human status quo is *learned passivity*:
tutors and parents — exhausted, time-pressed, heartsick — lose patience and give the
answer. The kid learns the real lesson fast: **if I stall long enough, the adult solves
it.** Prompt-dependence is one of the most documented and most destructive patterns in
special education. The tragedy is structural: the humans don't lack love, they lack
patience-margin, and answers are always cheaper than waiting.

**The reframe: this is exactly where the AI is not competing with the human tutor —
it's replacing a failure mode the human tutor can't fix in themselves.**

A human's patience depletes. The AI's does not. Wren can *always* afford the sixty
seconds of silence for a retrieval attempt; a tired parent at 8pm cannot. So the tension
dissolves if you see it correctly: Wren isn't making learning easier *instead of*
keeping it active — it's using infinite patience as the mechanism that makes active
learning *survivable* for kids who have learned that stalling works.

**Why infinite patience changes the game, not just the tone:**

1. **It removes the reward for stalling.** Learned passivity persists because waiting
   has always paid out eventually. Wren never pays out on first ask — ever, no
   exceptions — so the kid's one proven strategy goes extinct. Crucially, the AI never
   gets *irritated* while doing this, so the kid never learns that retrieval attempts
   provoke anger. Waiting costs the adult nothing; it costs the relationship nothing.
2. **Silence is survivable inside a story.** For a human, waiting through a
   special-needs kid's silence feels like cruelty under time pressure. Wren converts
   the wait into *narrative suspense* — the rope holds, the guard is coming, the door
   hums. The pause is not dead air; it's the most gripping part of the chapter. This
   is a trick no human tutor has access to, because humans can't generate stakes on
   demand.
3. **The escalation ladder replaces the answer, not the struggle.** When the kid is
   genuinely stuck, Wren gives *smaller steps of the same retrieval* — "the water rose
   4 feet in an hour. How much in HALF an hour?" — never the resolution. There is
   always another rung, so there is never a reason to jump to the answer. For kids with
   low frustration tolerance, the ladder is what makes "no answer on first ask"
   humane rather than punishing.
4. **The state model decides WHERE the line is.** This is the reconciliation of
   "easier" and "active": adaptivity moves the *entry point* of effort (chunk size,
   modality, decoding load), never removes the effort itself. Easier is the ramp;
   active is the invariant. A kid with ADHD gets a 90-second beat instead of a
   5-minute one — but the beat still ends with *them* producing the answer.
5. **Parents get their patience back.** The family dynamic improves from the other
   side: the kid who no longer stalls on Wren is measurably less prompt-dependent at
   homework time — and the nightly debrief tells the parent *which stall patterns the
   AI broke that day*, so the human can hold the same line with backing instead of
   guilt. The AI does the waiting so the human can afford to wait too.

**The line in one sentence (added to the design constraints):** the AI's patience is
the product's core resource — it is spent making *active effort survivable*, never
making effort unnecessary.

---

## Open question #3 — Presentation accessibility: fonts, spacing, color, and the "who controls the knobs" problem

**The question.** Dyslexia-friendly fonts (OpenDyslexic, Atkinson Hyperlegible), wider
letter/line spacing, adjustable contrast and dark modes, reduced-motion, calmer color
palettes — the accessibility toolkit is real, evidence-backed, and cheap to implement.
But two design traps lurk:

1. **Who decides?** Many dyslexic readers *hate* OpenDyslexic (studies are mixed; it can
   slow readers who've adapted to standard type). Auto-imposing "helpful" presentation
   is exactly the condescension this audience is tired of. Presentation must be
   *adaptive with consent*, not prescriptive.
2. **Presentation is not cognition.** These knobs sit firmly on the "support" side of
   the line from Open question #1 — they change the *transport* of information, never
   the thinking. That's why they're unambiguously safe to adapt: they're the
   load-shifting half of "load-shifting, not dumbing down."

**The design: presentation adapts from the same state model, three layers deep.**

- **Baseline layer (static, consented):** at onboarding — or rather, discovered
  passively in the first sessions, per the no-surveys rule — the tutor estimates a
  starting presentation profile: font family and size, letter/word/line spacing,
  contrast, dark/light, motion on/off. Parent sees it, kid can change it. Defaults are
  generous (high spacing, high contrast, dyslexia-legible font *available*), nothing is
  forced.
- **Reactive layer (session-time):** the state model watches session signals for
  presentation distress — re-reading the same line (decoding trouble → suggest larger
  font or read-aloud), losing place mid-line (→ increase line spacing / shorter line
  lengths), fidgeting+latency spikes (→ reduce visual noise, calm the palette). Any
  change is *offered* ("want me to read this next part aloud?"), one tap to accept.
  Over months, accepted offers become the new baseline; the profile converges without
  anyone filling a form.
- **In-story layer (diegetic):** the knobs can be story state, not UI state. "The
  ancient script is faded" = low contrast chapter, played for drama, while the actual
  text stays fully legible. The kid *feels* the difference as plot; the accessibility
  is invisible.

**Hackathon slice:** ship the reactive layer's easiest wins — an OpenDyslexic/
Atkinson Hyperlegible + spacing + contrast panel (defaulting ON for the dyslexia demo
profile, OFF for ADHD), line re-read detection flipping a "read aloud" offer, and one
diegetic contrast trick. It's visually demonstrable in seconds and grounds the "state
model, not settings menu" pitch: same lesson, three presentation profiles, zero
settings touched.

---

## Open question #4 — Information intake: two channels, one rule

**The question.** Interest discovery (OQ #1) made it sound like surveys are banned. But
some information genuinely can't be inferred from behavior — diagnosis, IEP/504 plan
contents, medications, what's already failed at school, the parent's own observations
over years. The honest design has **exactly two intake channels, with a clean rule for
what goes in each:**

1. **The Parent Channel (declared, at account creation + anytime).** The parent fills
   out an initial profile: diagnosis/labels, IEP/504 details, sensory sensitivities,
   what's worked and what's bombed before, daily schedule constraints. Editable at any
   time — the parent can amend or expand it whenever they notice something ("he's been
   bouncing off the walls since his meds changed").
2. **The Behavioral Channel (inferred, continuous).** Everything the kid's interaction
   with the app reveals: interest signals (OQ #1), state signals (frustration, flow,
   fatigue — OQ #2's asymmetry problem), presentation preferences (OQ #3), pacing
   tolerance, reward responsiveness. This is the adaptive component proper.

**The rule: the Parent Channel seeds priors; the Behavioral Channel updates them.**
Parent info is treated as a *hypothesis to verify, not ground truth* — "the IEP says
dyslexia" sets initial presentation defaults, but the session stream confirms, refines,
or surprises. (Kids with identical labels present completely differently; the label is
the starting guess, the kid is the dataset.) Neither channel overrides the other:
a parent declaring "he loves dinosaurs" doesn't win against 20 sessions of measured
flatline on dinosaurs — but it does get logged as a discrepancy worth surfacing in the
debrief.

### The "this or that" instrument — a picture-based preference probe

For the basic trait dimensions (visual vs. verbal learner, tolerance for text density,
reward style, competitive vs. cooperative framing, sensory thresholds), the instrument
is a **forced-choice picture game that the kid experiences as a game, not an
assessment:**

- Two pictures, one question in the story's voice: *"The door needs a key. Which guard
  do you ask?"* — one guard explaining with a diagram, one telling a story. The choice
  silently scores a dimension. No wrong answers, no "test" framing, and it's adaptive
  itself: each answer narrows the next question.
- **Frequency: as a recurring ritual, not a one-time onboarding block.** A few probes
  are woven into the first chapters (cold-start needs them — they *are* the demo's
  interest-seeding mystery from OQ #1, unified with trait-estimation), then they recur
  lightly: whenever the state model's confidence on a dimension drops (traits drift as
  kids develop), or a new arc opens. The kid never notices a "survey" — just another
  branching moment in the story. Think of it as a persistent, invisible item-recommendation
  system (like a streaming service's cold-start + drift-correction flow), but the items
  are learning strategies.
- **Why pictures matter specifically for this population:** text-based instruments
  measure reading ability along with the trait (confounded garbage for dyslexic kids),
  add working-memory load (garbage for ADHD), and feel like school (garbage for
  motivation). Picture forced-choice minimizes all three — and doubles as an early
  signal itself (which modality the kid *engages with fastest* while answering is data
  too).

### Behavioral mastery as the tailoring engine

Understanding the kid's behavior is the key deliverable, and it's recorded here as the
central commitment: the app's model of the student is a **living behavioral profile**
that feeds every tuning decision — chunk length, modality mix, escalation ladder rung
(OQ #2), presentation defaults (OQ #3), story world (OQ #1), and reward type. The
profile is validated the only way that matters: **does the tailored strategy outperform
the untailored one for this specific kid, measurably, over weeks?** Every adaptation is
logged with its rationale, so the parent debrief shows not just *what* changed but
*why* — and the system can A/B its own adaptations (this kid responds better to time
pressure than we thought) rather than assuming the population average.

---

*Next open questions on deck: how the tutor decides when a kid is ready for a
de-wrapping chapter; demo script and tech stack for the hackathon build.*
