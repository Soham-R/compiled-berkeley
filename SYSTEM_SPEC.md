# SYSTEM_SPEC.md — Wren System Specification & Execution Blueprint

> **Notice:** This document serves as the master specification file for autonomous CLI/agent builds (e.g., Antigravity). It details the product vision, core learning invariants, data schemas, and the exact step-by-step technical implementation plan for **Wren**.

---

## 1. Product Vision & Core Insight

**One-liner:** An AI tutor that builds a live, evolving model of how a child's attention, memory, and motivation actually work — then reshapes every story, task, and presentation decision around it. Built first for neurodivergent kids (ADHD, Dyslexia, Autism).

### The Technical Insight
For neurodivergent children, the primary bottleneck in learning is **STATE** (frustration, cognitive fatigue, working memory overload, attention drops), not explanation. 

Edtech has historically failed because it cannot read the room. Wren reads the room via voice prosody, touch/interaction latency, and response accuracy to dynamically adjust:
1. **Presentation (Transport Layer):** Fonts, spacing, contrast, visual clutter, and line heights.
2. **Modality (Engagement Layer):** Shifting between narrative stories, visual micro-games, and voice co-regulation.
3. **Pacing & Scaffolding (Cognitive Layer):** Lowering decoding friction while preserving core cognitive rigor.

---

## 2. Non-Negotiable Learning Invariants (The Science of Learning)

1. **No Answer on First Ask (Active Recall):** The AI tutor must **NEVER** supply the final answer on a first fail or long pause. It must scaffold down to a smaller step or provide a narrative clue.
2. **Cognitive Rigor Preserved:** Adapt support (decoding load, UI presentation, chunking), but **NEVER** lower the core reasoning difficulty of the task.
3. **Parent Priors Seed the Profile:** Parent intake data (diagnoses, IEP details, hyperfixations, triggers) sets the initial default system state.
4. **Behavior Overrides Priors:** Session telemetry (latency, prosody, accepted UI offers) constantly updates, overrides, and refines initial parent assumptions.
5. **Infinite Patience as a Mechanism:** The AI waiting through silence costs nothing. Silence inside a task is wrapped in narrative suspense rather than dead air or pressure.

---

## 3. Tech Stack & Architecture

- **Frontend:** Next.js 14+ (App Router), TypeScript, Tailwind CSS, Web Speech API / Web Audio API.
- **Backend:** Python (FastAPI), Pydantic v2, Async WebSockets / REST.
- **AI / LLM Engine:** Claude 3.5 Sonnet / OpenAI GPT-4o with structured JSON mode outputs.
- **Database / Memory:** Persistent JSON / Vector Store (Session-to-session memory tracking).