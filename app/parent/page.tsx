import Link from "next/link";
import { Suspense } from "react";
import profile from "@/content/profile.json";
import sessions from "@/content/sessions.json";
import { generateParentNote } from "@/lib/parentNote";
import { reportDue, type WeekFacts } from "@/lib/summary";

const DEFAULT_DAY = 7;
const MAX_DAY = 60;

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

function pickDay(raw: string | string[] | undefined): number {
  const n = Number(Array.isArray(raw) ? raw[0] : raw);
  return Number.isInteger(n) && n >= 1 && n <= MAX_DAY ? n : DEFAULT_DAY;
}

function nextNoteDay(after: number): number {
  let d = after + 1;
  while (!reportDue(d)) d++;
  return d;
}

// "through, think, there and which"
function joinWords(words: string[]): string {
  if (words.length <= 1) return words.join("");
  return `${words.slice(0, -1).join(", ")} and ${words[words.length - 1]}`;
}

function longDate(isoDate: string): string {
  return new Date(`${isoDate}T00:00:00Z`).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

// The date of the latest session at or before `day`, from the seeded week.
function lastSessionDate(day: number): string {
  const week = (sessions as { day: number; date: string }[]).filter((s) => s.day <= day);
  return week.length ? week[week.length - 1].date : sessions[0].date;
}

function trendSentence(facts: WeekFacts, expected: number): string {
  const { timeToBreak, trend, vsExpected } = facts;
  if (timeToBreak.length === 0) return "She has not needed a break yet.";
  if (timeToBreak.length === 1) return "That is the starting number we measure from.";
  const first = timeToBreak[0].weekday;
  const lead = trend === "up" ? `Up from ${first},` : trend === "down" ? `Down from ${first},` : "Holding steady,";
  const tail =
    vsExpected === "above"
      ? `and past the ${expected} minutes we expected for her age.`
      : vsExpected === "near"
        ? `and close to the ${expected} minutes we expected for her age.`
        : `and still short of the ${expected} minutes we expected for her age, which is normal this early.`;
  return `${lead} ${tail}`;
}

// Mihika's .pcard: white, 24px radius, 2px edge border.
function Card({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <section className="grid gap-2 rounded-[24px] border-2 border-edge bg-white p-6">
      {title && <h2 className="font-display text-[1.3rem] font-extrabold">{title}</h2>}
      {children}
    </section>
  );
}

// Everything that depends on runtime data (the day, the generated note)
// streams in inside the Suspense boundary; the shell above it prerenders.
async function Report({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const day = pickDay(params.day);
  const { facts, note, due, source } = await generateParentNote(day, { fresh: params.fresh === "1" });
  const latestDate = facts.sessionsCount ? longDate(lastSessionDate(day)) : null;

  return (
    <>
      <header className="mx-auto w-full max-w-[640px] px-5 pb-8">
        <h1 className="font-display text-[2.4rem] font-extrabold leading-[1.08] text-balance">
          {profile.name}, day {day}
        </h1>
        {latestDate && <p className="mt-2 text-[1.05rem] text-dim">{latestDate}</p>}
      </header>

      <div className="mx-auto grid w-full max-w-[640px] gap-5 px-5 pb-16">
        <Card>
          <p className="font-display text-sm font-bold text-accent">
            From Alder
            {source === "fallback" && <span className="ml-2 font-sans font-normal text-dim">(pre-written note)</span>}
          </p>
          <p className="whitespace-pre-line text-[1.05rem] leading-[1.65] text-ink">{note}</p>
        </Card>

        <Card title="Words that clicked">
          <p className="text-dim">
            {facts.mastered.length ? joinWords(facts.mastered) : "Nothing yet. That is normal for the first days."}
          </p>
        </Card>

        <Card title="Working on">
          <p className="text-dim">
            {facts.workingOn.length ? joinWords(facts.workingOn) : "Nothing is slowing her down right now."}
          </p>
        </Card>

        <Card title="Time before a break">
          {facts.timeToBreak.length > 0 && (
            <ul className="grid gap-1 text-ink">
              {facts.timeToBreak.map((t) => (
                <li key={t.day}>
                  {t.weekday}: {t.minutes} minutes
                </li>
              ))}
            </ul>
          )}
          <p className="text-dim">{trendSentence(facts, profile.thresholds.expectedAttentionMin)}</p>
        </Card>

        <p className="text-sm text-dim">
          Notes arrive after day 1, 3 and 7, then every week.
          {!due && ` Next note after day ${nextNoteDay(day)}.`}
        </p>
      </div>
    </>
  );
}

function ReportSkeleton() {
  return (
    <div className="mx-auto grid w-full max-w-[640px] gap-5 px-5 pb-16">
      <div className="h-10 w-48 rounded-full bg-tint" />
      <div className="h-48 rounded-[24px] border-2 border-edge bg-white" />
      <div className="h-24 rounded-[24px] border-2 border-edge bg-white" />
    </div>
  );
}

export default function ParentPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <main className="min-h-screen bg-white text-ink">
      <div className="bg-gradient-to-b from-tint to-white">
        <div className="mx-auto flex w-full max-w-[640px] items-center justify-between px-5 py-4">
          <Link href="/" className="font-display text-2xl font-extrabold text-ink no-underline">
            Alder
          </Link>
          <Link href="/" className="text-sm font-medium text-dim hover:text-ink">
            Back to Alder
          </Link>
        </div>
        <div className="mx-auto w-full max-w-[640px] px-5 pb-3 pt-6">
          <span className="inline-block rounded-full bg-[#e7f0ff] px-3.5 py-1 font-display text-[0.95rem] font-bold text-accent">
            For parents
          </span>
        </div>
        <Suspense fallback={<ReportSkeleton />}>
          <Report searchParams={searchParams} />
        </Suspense>
      </div>
    </main>
  );
}
