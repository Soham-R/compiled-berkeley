# Spec B: Recording the tutor's voice and the demo voiceover

Branch: `tutor-voice`. Owner: Luka (can hand off to Person C). Timebox: **20 minutes.**
Depends on spec A (`lib/tutor.ts` is on the branch). Independent of spec C.

## Context

Read `HACKATHON_CONTEXT.md`, `DECISIONS.md` and `specs/A-tutor-disposition.md` first.
`lib/tutor.ts` exports `LINES` (13 scripted lines, keyed) and `lineUrl(key)`, which maps
`soundOut.through` to `/audio/soundout-through.mp3`. `/read` plays those paths. Nothing
is recorded yet; `public/audio/` is empty.

Decisions already made: scripted lines only, no live voice model, one voice for every
line the kid hears (including the sound-out clips Person C was going to make; tell them
before they record anything). The demo narrator is a second voice, ideally a team
member's real one.

## Deliverables

1. `scripts/record-lines.ts`: generates one clip per `LINES` entry into `public/audio/`.
2. `scripts/record-voiceover.ts`: generates the narrator track into `public/audio/vo/`
   from `content/voiceover.ts` (written in the demo-script step; the script should run
   against whatever that file exports).
3. The clips themselves, committed. They are small (tens of KB each).
4. `.env.example` gains `ELEVENLABS_API_KEY=` and `ELEVENLABS_VOICE_ID=`, plus
   `OPENAI_API_KEY=` under a comment saying it's only for the TTS fallback.
5. A line in `DECISIONS.md` with the provider used and the voice ID, so nobody records a
   second voice by accident.

## Provider selection (one script, three backends)

`record-lines.ts` picks the backend from the environment, in this order:

1. **ElevenLabs** if `ELEVENLABS_API_KEY` is set.
   `POST https://api.elevenlabs.io/v1/text-to-speech/{voiceId}` with header
   `xi-api-key`, body `{ text, model_id: "eleven_multilingual_v2", voice_settings: {
   stability: 0.6, similarity_boost: 0.8, style: 0.2, speed: 0.9 } }`. Response is mp3
   bytes. Default `voiceId` from `ELEVENLABS_VOICE_ID`; pick a warm, mid-pitch premade
   voice in the dashboard (Sarah or Matilda are the usual picks; confirm the ID there,
   don't trust memory). Write the ID into `DECISIONS.md`.
2. **OpenAI TTS** if only `OPENAI_API_KEY` is set.
   `POST https://api.openai.com/v1/audio/speech`, body `{ model: "gpt-4o-mini-tts",
   voice: "nova", input, response_format: "mp3", instructions }`. The `instructions`
   string: "A calm, warm reading tutor talking to a seven-year-old. Unhurried. No
   exclamation energy. Pause clearly at the ellipses."
3. **macOS `say`** if neither key exists. `say -v Samantha -r 150 -o <tmp>.aiff "<text>"`
   then `afconvert <tmp>.aiff -f mp4f -d aac <out>.m4a`. Because the extension differs,
   `lib/tutor.ts` gets one constant `AUDIO_EXT = "mp3"` that `lineUrl` uses; set it to
   `"m4a"` when the `say` fallback is in use, and change it back when real clips land.
   Log which one is active in `DECISIONS.md`.

Print the backend at startup. Fail loudly on a non-2xx response; never write an empty
file.

## Pacing the sound-outs

The three `soundOut.*` lines are the clips the video lingers on. They must sound like
pieces, not a word said quickly. Per backend:

- ElevenLabs: replace each `...` in the text with `<break time="0.6s" />` before
  sending. ElevenLabs honors that tag.
- OpenAI: keep the ellipses; the `instructions` string already asks for pauses.
- `say`: replace `...` with `[[slnc 600]]` (Apple's inline silence command).

The replacement is one function, `pace(text, backend)`, and applies to every line, so a
pause written into any line works everywhere.

## Output rules

- Path is `lineUrl(key)` resolved under `public/`, so the script and `/read` can never
  disagree. Import `LINES` and `lineUrl` from `../lib/tutor`; do not duplicate the table.
- Skip a clip if the file already exists, unless `--force` is passed. Re-running after
  editing one line regenerates only that line (compare a hash of the text stored in
  `public/audio/manifest.json`: `{ key: { text, backend, voiceId } }`). The manifest is
  committed too; it tells the team which voice each clip was made with.
- After generating, play one clip (`afplay` on macOS) so the person running it hears the
  voice before committing 13 files.

## Voiceover script (`record-voiceover.ts`)

Same backends, same `pace()`. Reads `VOICEOVER: { id: string; text: string }[]` from
`content/voiceover.ts` and writes `public/audio/vo/<id>.mp3`. Uses `ELEVENLABS_VOICE_ID_NARRATOR`
if set, so the narrator is a different voice from Wren. If a team member records the
narration themselves, this script isn't run and that's fine; the editor uses their take.

## Acceptance

- `npx tsx scripts/record-lines.ts` prints the backend, writes 13 files at the exact
  `lineUrl()` paths, writes `manifest.json`, and plays one clip.
- Running it again writes nothing (manifest hashes match). `--force` regenerates all.
- `public/audio/soundout-through.mp3` has an audible gap between "th" and "rough".
- `/read` (pink's page) can play `lineUrl("breakOffer")` with no 404.
- `.env.local` is not committed. `git status` shows only the audio files, the manifest,
  the two scripts, `.env.example`, `lib/tutor.ts` (if `AUDIO_EXT` changed) and
  `DECISIONS.md`.

## Out of scope

Voice cloning, live or streaming voice, a voice settings UI, pronunciation tuning beyond
the ellipsis pauses, any change to `/read`.

## When done

Append to `DECISIONS.md`: backend, voice ID(s), whether the `say` fallback is still in
place. Commit by explicit path only.
