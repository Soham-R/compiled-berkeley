import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

// In-memory fallback cache in case backend is offline
const memoryStore = new Map<string, { profile?: any; events: any[]; summary: any }>();

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { childId, profile, events } = body;

    if (!childId) {
      return NextResponse.json({ error: "Missing childId" }, { status: 400 });
    }

    const existing = memoryStore.get(childId) || {
      events: [],
      summary: { practiceWords: ["through", "think", "there"], greeting: "" },
    };

    if (profile) {
      existing.profile = profile;

      // Transform profile to match FastAPI ChildProfile schema
      const fastApiProfile = {
        id: childId,
        priors: {
          name: profile.name || "Learner",
          age: parseInt(profile.age, 10) || 7,
          grade_band: "early-2",
          diagnoses: profile.primary_diagnoses || [],
          iep_accommodations: profile.parent_goals || [],
          interests: profile.hyperfixations || ["dinosaurs", "Biscuit"],
          sensitivities: profile.known_triggers || [],
          known_difficulties: ["decoding th- blends", "hesitation"],
        },
        behavioral: {
          baseline_latency_ms: profile.benchmark?.reactionMs || 3500.0,
          attention_window_minutes: 8.0,
          preferred_modality: "story",
          mastered_words: ["duck", "pond"],
          struggled_words: ["through", "think", "there"],
          accepted_presentation_offers: ["Atkinson Hyperlegible"],
          frustration_index: 0.1,
        },
      };

      // Sync to FastAPI in background
      fetch(`${BACKEND_URL}/api/v1/profile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fastApiProfile),
      }).catch((err) => console.warn("[MemoryRoute] Failed to sync profile to FastAPI:", err.message));
    }

    if (Array.isArray(events) && events.length > 0) {
      existing.events.push(...events);

      // Extract newly practiced/stumbled words
      for (const ev of events) {
        if (ev.practice && Array.isArray(ev.practice)) {
          existing.summary.practiceWords = Array.from(
            new Set([...existing.summary.practiceWords, ...ev.practice])
          ).slice(-6);
        }
      }

      // Sync telemetry events to FastAPI in background
      const batch = {
        session_id: `sess_${childId}_${Date.now().toString(36)}`,
        child_id: childId,
        events: events.map((e) => ({
          event_type: e.type === "stumble" ? "word_stumble" : "word_read",
          timestamp: e.at || new Date().toISOString(),
          word: e.word || e.practice?.[0] || null,
          duration_ms: e.latency || null,
          metadata: e,
        })),
      };

      fetch(`${BACKEND_URL}/api/v1/telemetry`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(batch),
      }).catch((err) => console.warn("[MemoryRoute] Failed to sync telemetry to FastAPI:", err.message));
    }

    // Set a warm, personalized greeting if profile name exists
    if (existing.profile?.name) {
      const interests = existing.profile.hyperfixations?.[0] || "stories";
      existing.summary.greeting = `Welcome back, ${existing.profile.name}! Ready for more adventures with ${interests}?`;
    }

    memoryStore.set(childId, existing);

    return NextResponse.json({ status: "ok", received: events?.length || 0 });
  } catch (err: any) {
    console.error("[MemoryRoute] POST error:", err);
    return NextResponse.json({ error: err.message || "Failed to process memory" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const childId = searchParams.get("childId") || "default";

  // Try fetching profile and state from FastAPI
  try {
    const res = await fetch(`${BACKEND_URL}/api/v1/profile/${childId}`, {
      signal: AbortSignal.timeout(2000),
    });

    if (res.ok) {
      const backendProfile = await res.json();
      const practiceWords = backendProfile.behavioral?.struggled_words || ["through", "think", "there"];
      const childName = backendProfile.priors?.name || "Learner";
      const interests = backendProfile.priors?.interests?.[0] || "fun stories";

      return NextResponse.json({
        childId,
        summary: {
          practiceWords,
          greeting: `Welcome back, ${childName}! Ready to explore more with ${interests}?`,
        },
        profile: backendProfile,
      });
    }
  } catch {
    // If backend isn't answering, fallback to local store
  }

  const cached = memoryStore.get(childId) || {
    summary: {
      practiceWords: ["through", "think", "there"],
      greeting: "Welcome to Wren! Let's read together today.",
    },
    profile: null,
  };

  return NextResponse.json({
    childId,
    summary: cached.summary,
    profile: cached.profile,
  });
}
