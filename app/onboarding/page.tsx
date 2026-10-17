"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { ParentProfile } from "@/lib/types";

const DX_OPTIONS = [
  ["ADHD_traits", "ADHD traits"],
  ["Autism", "Autism"],
  ["Speech_Delay", "Speech delay"],
  ["Sensory_Seeking", "Sensory seeking"],
  ["Dyslexia_Risk", "Early reading difficulty"],
  ["Motor_Delay", "Motor delay"],
] as const;

const TRIGGER_OPTIONS = [
  ["Sudden_Loud_Sounds", "Sudden loud sounds"],
  ["Direct_Eye_Contact_Visuals", "Faces looking at them"],
  ["Time_Pressure", "Being timed"],
  ["Unexpected_Changes", "Unexpected changes"],
  ["Getting_It_Wrong", "Getting it wrong"],
] as const;

const GOAL_OPTIONS = [
  ["Two_Step", "Follow 2-step instructions"],
  ["Transitions", "Calmer transitions"],
  ["Letter_Sounds", "Learn letter sounds"],
  ["Counting", "Counting"],
  ["Focus", "Longer focus"],
] as const;

const EXAMPLE_PROFILE: ParentProfile = {
  name: "Maya",
  age: "4",
  primary_diagnoses: ["ADHD_traits", "Sensory_Seeking", "Speech_Delay"],
  communication_mode: "Verbal_Phrases",
  known_triggers: [
    "Sudden_Loud_Sounds",
    "Direct_Eye_Contact_Visuals",
    "Time_Pressure",
  ],
  hyperfixations: ["Trains", "Bugs", "Water"],
  sensory_profile: { auditory: "Over_Responsive", visual: "Under_Responsive" },
  parent_goals: ["Two_Step", "Transitions"],
  report_cadence: "weekly",
};

const STORAGE_KEY = "wren-profile";

export default function OnboardingPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<ParentProfile>(EXAMPLE_PROFILE);
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      if (saved && saved.name) setProfile(saved);
    } catch {
      // corrupted storage — start fresh with the example
    }
    setReady(true);
  }, []);

  function save() {
    if (!profile.name.trim()) {
      setError("Add your child's first name so we can personalize their space.");
      return;
    }
    const cleaned: ParentProfile = {
      ...profile,
      name: profile.name.trim(),
      hyperfixations: profile.hyperfixations
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned));
    } catch {
      // storage unavailable — continue without persistence
    }
    router.push("/read");
  }

  function toggle(list: string[], value: string): string[] {
    return list.includes(value)
      ? list.filter((v) => v !== value)
      : [...list, value];
  }

  if (!ready) return null;

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 p-8">
      <header className="flex flex-col gap-2">
        <p className="text-sm uppercase tracking-wide opacity-60">Get started</p>
        <h1 className="text-3xl font-semibold">Tell us about your child</h1>
        <p className="text-lg opacity-80">
          Takes about five minutes. Every answer changes how Wren teaches.
        </p>
        <ul className="text-sm opacity-60">
          <li>No diagnosis needed</li>
          <li>You can change answers later</li>
        </ul>
      </header>

      <form
        className="flex flex-col gap-6"
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
      >
        <div className="grid grid-cols-2 gap-4">
          <label className="flex flex-col gap-1 text-lg">
            Child&apos;s first name
            <input
              type="text"
              value={profile.name}
              onChange={(e) =>
                setProfile({ ...profile, name: e.target.value })
              }
              placeholder="e.g. Maya"
              autoComplete="off"
              className="rounded-lg border border-black/10 bg-white/70 px-3 py-2"
            />
          </label>
          <label className="flex flex-col gap-1 text-lg">
            Age
            <select
              value={profile.age}
              onChange={(e) => setProfile({ ...profile, age: e.target.value })}
              className="rounded-lg border border-black/10 bg-white/70 px-3 py-2"
            >
              <option value="3">3 years</option>
              <option value="4">4 years</option>
              <option value="5">5 years</option>
              <option value="6">6 years</option>
            </select>
          </label>
        </div>

        <fieldset className="flex flex-col gap-2">
          <legend className="text-lg">Does your child have any of these?</legend>
          <p className="text-sm opacity-60">Diagnosed or suspected. Leave blank if none.</p>
          <div className="flex flex-wrap gap-2">
            {DX_OPTIONS.map(([value, label]) => (
              <Chip
                key={value}
                label={label}
                checked={profile.primary_diagnoses.includes(value)}
                onChange={() =>
                  setProfile({
                    ...profile,
                    primary_diagnoses: toggle(profile.primary_diagnoses, value),
                  })
                }
              />
            ))}
          </div>
        </fieldset>

        <label className="flex flex-col gap-1 text-lg">
          How does your child usually communicate?
          <select
            value={profile.communication_mode}
            onChange={(e) =>
              setProfile({
                ...profile,
                communication_mode: e.target
                  .value as ParentProfile["communication_mode"],
              })
            }
            className="rounded-lg border border-black/10 bg-white/70 px-3 py-2"
          >
            <option value="Non_Verbal">
              No words yet (gestures, sounds, pointing)
            </option>
            <option value="Single_Words">Single words</option>
            <option value="Verbal_Phrases">Short phrases</option>
            <option value="Sentences">Full sentences</option>
          </select>
        </label>

        <fieldset className="flex flex-col gap-2">
          <legend className="text-lg">What tends to upset them?</legend>
          <div className="flex flex-wrap gap-2">
            {TRIGGER_OPTIONS.map(([value, label]) => (
              <Chip
                key={value}
                label={label}
                checked={profile.known_triggers.includes(value)}
                onChange={() =>
                  setProfile({
                    ...profile,
                    known_triggers: toggle(profile.known_triggers, value),
                  })
                }
              />
            ))}
          </div>
        </fieldset>

        <label className="flex flex-col gap-1 text-lg">
          What do they love right now?
          <p className="text-sm opacity-60">
            We&apos;ll build lessons around these. Separate with commas.
          </p>
          <input
            type="text"
            value={profile.hyperfixations.join(", ")}
            onChange={(e) =>
              setProfile({ ...profile, hyperfixations: e.target.value })
            }
            placeholder="e.g. trains, bugs, water"
            autoComplete="off"
            className="rounded-lg border border-black/10 bg-white/70 px-3 py-2"
          />
        </label>

        <fieldset className="flex flex-col gap-2">
          <legend className="text-lg">Senses</legend>
          <div className="grid grid-cols-2 gap-4">
            <label className="flex flex-col gap-1">
              Sounds
              <select
                value={profile.sensory_profile.auditory}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    sensory_profile: {
                      ...profile.sensory_profile,
                      auditory: e.target.value as ParentProfile["sensory_profile"]["auditory"],
                    },
                  })
                }
                className="rounded-lg border border-black/10 bg-white/70 px-3 py-2"
              >
                <option value="Typical">No strong reaction</option>
                <option value="Over_Responsive">Easily bothered by sound</option>
                <option value="Under_Responsive">Loves loud sounds</option>
              </select>
            </label>
            <label className="flex flex-col gap-1">
              Visuals
              <select
                value={profile.sensory_profile.visual}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    sensory_profile: {
                      ...profile.sensory_profile,
                      visual: e.target.value as ParentProfile["sensory_profile"]["visual"],
                    },
                  })
                }
                className="rounded-lg border border-black/10 bg-white/70 px-3 py-2"
              >
                <option value="Typical">No strong reaction</option>
                <option value="Over_Responsive">Overwhelmed by busy screens</option>
                <option value="Under_Responsive">
                  Drawn to bold color and motion
                </option>
              </select>
            </label>
          </div>
        </fieldset>

        <fieldset className="flex flex-col gap-2">
          <legend className="text-lg">What would you most like help with?</legend>
          <div className="flex flex-wrap gap-2">
            {GOAL_OPTIONS.map(([value, label]) => (
              <Chip
                key={value}
                label={label}
                checked={profile.parent_goals.includes(value)}
                onChange={() =>
                  setProfile({
                    ...profile,
                    parent_goals: toggle(profile.parent_goals, value),
                  })
                }
              />
            ))}
          </div>
        </fieldset>

        <label className="flex flex-col gap-1 text-lg">
          How often should we send you a progress report?
          <select
            value={profile.report_cadence}
            onChange={(e) =>
              setProfile({
                ...profile,
                report_cadence: e.target.value as ParentProfile["report_cadence"],
              })
            }
            className="rounded-lg border border-black/10 bg-white/70 px-3 py-2"
          >
            <option value="weekly">Every week</option>
            <option value="daily">Every day</option>
          </select>
        </label>

        {error && <p className="text-red-600">{error}</p>}

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setProfile(EXAMPLE_PROFILE)}
            className="rounded-lg border border-black/20 px-4 py-2"
          >
            Use an example
          </button>
          <button
            type="submit"
            className="rounded-lg bg-black px-4 py-2 text-white"
          >
            Create my child&apos;s plan
          </button>
        </div>
        <small className="opacity-60">
          By continuing you agree that Wren is a learning tool and does not give
          medical advice.
        </small>
      </form>
    </main>
  );
}

function Chip({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label
      className={`cursor-pointer rounded-full border px-3 py-1.5 text-base ${
        checked
          ? "border-black bg-black text-white"
          : "border-black/20 bg-white/70"
      }`}
    >
      <input type="checkbox" checked={checked} onChange={onChange} className="sr-only" />
      {label}
    </label>
  );
}
