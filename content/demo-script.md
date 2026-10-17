# Alder demo script

**Total runtime:** about 1:32. **Narration:** 164 words, about 70 s at a calm pace. The other 20 s belong to Alder's voice, the reader, and holds.

Everything on screen is Mihika's site served at `http://localhost:3000/` (the kid world's **Story time**), plus `/parent?day=7`. Alder's voice on the site is live ElevenLabs (Jessica) through `/api/tts`; run the whole flow once before recording so every line is cached and plays instantly. Pages come live from Claude (`/api/next-page`) as long as `ANTHROPIC_API_KEY` is in `.env.local`; the first story carries the practice words through, think, there from the memory engine, so Day 1 has the three target words without any setup.

## Before you record

1. `npm run dev`, open Chrome at `http://localhost:3000/`, allow the microphone when asked.
2. Scroll to "Tell us about your child", click **Use an example**, set the name to Maya, finish the four steps. That opens the kid world.
3. Do one full rehearsal: Story time → read a page with three stumbles → answer the question → Next story → read it → hold the Grown-ups button. This caches the voice lines and proves the mic works on this laptop.
4. Full-screen Chrome (⌃⌘F), hide the bookmarks bar, 1080p QuickTime screen recording, system sounds on so Alder's voice is in the take.

## Shot list

| Start | Secs | On screen | Off-camera action | Alder says | Narration |
|---|---|---|---|---|---|
| 0:00 | 5 | Black. One centered line in white: "One-on-one tutoring was always for the few." Nothing else. | Editor card. Fade in over half a second, hold, hard cut. | nothing | One-on-one tutoring was always for the few. |
| 0:05 | 9 | Kid world dashboard: mascot, "Hi there, Maya!", the four cards. Clicker taps **Story time** (teal). "Finding a story for you… It will have your practice words: through think there", then the story screen: speaker button, "Read the story out loud!", "Practice words in this story: **through think there**", the passage in big rounded type, mic button, "Tap the microphone and start reading." Lower-third: "Day 1 · Monday". | Clicker taps Story time, then the mic. Reader starts sentence 1 at a seven-year-old's pace, ducked under the narrator. The words she has read turn to the "read" style one by one; the current word is highlighted. | "Read it out loud." (once, when the page opens) | Maya is seven. Decoding is slow; attention fades by minute eight. For kids like her, the bottleneck isn't explanation. It's state. |
| 0:14 | 3 | Highlight parks on **through**. After the silence the help box appears under the passage: "th + rough = through" with a **Hear it again** button. The state line says "Listen…". Nothing turns red; no counter changes. | Reader goes quiet right before "through" and stays quiet so the stall timer fires (4.5 to 7 s on this profile; trim the hold to about 1 s in the edit). No clicks. If the mic misses the stall, tap the word "through": same box, same voice. | "Let's sound it out together. th… rough… through! Now you try." | |
| 0:17 | 4 | The help box stays while Alder sounds it out, then the state line says "Your turn. I'm listening…" and the highlight moves on. | Reader waits for the line, says "through" clearly (not ducked), keeps reading. | (the sound-out, finishing) | |
| 0:21 | 5 | Highlight runs on through the next sentence. "through" now looks like every other read word. | Reader reads on, ducked. | nothing | Nothing is marked. Alder shows the pieces, says them once, moves on. |
| 0:26 | 4 | Highlight parks on **think**; help box: "th + ink = think". | Reader stops before "think", waits, says it, continues. | "Let's sound it out together. th… ink… think! Now you try." | |
| 0:30 | 3 | Highlight parks on **there**; help box: "th + ere = there". Third stumble of the page. | Reader stops before "there"; after the line, reads to the end of the page, ducked. | "Let's sound it out together. th… ere… there! Now you try." | |
| 0:33 | 6 | End of page: "You read the whole story, Maya!", then "Tricky words today. Tap one to hear it again:" with three chips **through · think · there**, "Your next story will use these words so you can practice them.", then the question and three equal buttons. No score, no X. | Clicker taps any answer on "continues", then **Next story**. Cut on the click; the Day 2 take is a separate recording, so the cut hides the load. | nothing | Three stumbles: working memory is full. Alder downshifts before the meltdown. Any answer continues. |
| 0:39 | 8 | Story time, next page: "Finding a story for you… It will have your practice words: through think there", then a visibly shorter page about Biscuit, the three practice words bolded above it. Lower-third: "Day 2 · Tuesday". | Clicker is already past the loading overlay when the take starts. Reader starts under the narration so the first "through" lands as it ends. | "Read it out loud." | One Claude call writes her next page around the words she missed, in a Biscuit story that picks up where yesterday's left off. |
| 0:47 | 5 | Highlight parks on the first **through**; help box "th + rough = through". | Reader pauses before "through", waits for the pieces, then reads "through" herself, clear, not ducked. If you want the beat without the full sound-out, tap the word and keep reading over the line; the edit keeps the box, cuts the voice. | sound-out (cut short in the edit) | Just the pieces this time. She does the rest. |
| 0:52 | 3 | Highlight glides across "I think he saw a frog there." with no help box. | Reader reads the sentence clean and clear, not ducked. | nothing | |
| 0:55 | 9 | Highlight runs clean to the end. Summary: "You read every word without help. Wow!" (or one chip if she stumbled once), the question, **Next story**. | Reader finishes clean, ducked. Clicker taps an answer and Next story on the last word of the narration. Cut. | nothing | Today's signal is a word that comes a few seconds late. Prosody, frustration in her voice, is the roadmap, not this demo. |
| 1:04 | 8 | Story time, Day 5: a longer Priya-and-Biscuit page, practice words **where which** bolded above it. Lower-third: "Day 5 · Friday". Highlight runs clean past where, through, think, which, there. No help box. Two or three jump cuts so it moves. The summary appears in the last 2 s. | Reader reads a little quicker, ducked; leave the last sentence audible. | nothing (summary line if it plays) | Day five. No stumbles. Two new words sit beside words she already owns. |
| 1:12 | 7 | Clicker presses and **holds** the "Grown-ups · hold" button (bottom of the kid world) for about a second. The page changes to `/parent?day=7`: "For parents", "Maya, day 7", the "From Alder" note, then the three cards: "Words that clicked: through, think, there and which" / "Working on: where" / "Time before a break: Monday: 6 minutes · Wednesday: 9 minutes · Friday: 11 minutes", "Up from Monday, and past the 8 minutes we expected for her age." | One slow scroll to the three cards. No other clicks. (Alternative B-roll: the same page on a phone held over the table.) | nothing | For the parent: what clicked, what's next, how long before a break. Six minutes Monday. Eleven by Friday. |
| 1:19 | 5 | B-roll: laptop open on a kitchen table, the Day 5 page glowing on it, a hand resting by the trackpad, a mug in frame. No face needed. | None. | nothing | Edtech never did this. It couldn't hear the kid. Now it can. |
| 1:24 | 8 | Hold the kitchen table through "The book learned her.", then cut at about 1:28 to the title card on white: **Alder** large in Baloo, "A reading tutor that reads the room." beneath, the team: Luka Abrams · Zishaan M · Soham R · Mihika Garg, the repo name compiled-berkeley. Hold 1.5 s after the voice ends. | None. | nothing | She never typed a word. The book learned her. Built for the kids one-size-fits-most already failed. |

## Narration read-through

One-on-one tutoring was always for the few.

Maya is seven. Decoding is slow; attention fades by minute eight. For kids like her, the bottleneck isn't explanation. It's state.

Nothing is marked. Alder shows the pieces, says them once, moves on.

Three stumbles: working memory is full. Alder downshifts before the meltdown. Any answer continues.

One Claude call writes her next page around the words she missed, in a Biscuit story that picks up where yesterday's left off.

Just the pieces this time. She does the rest.

Today's signal is a word that comes a few seconds late. Prosody, frustration in her voice, is the roadmap, not this demo.

Day five. No stumbles. Two new words sit beside words she already owns.

For the parent: what clicked, what's next, how long before a break. Six minutes Monday. Eleven by Friday.

Edtech never did this. It couldn't hear the kid. Now it can.

She never typed a word. The book learned her. Built for the kids one-size-fits-most already failed.

## Recording notes

- **One take per day.** Record Day 1, Day 2 and Day 5 as separate recordings. Every cut between days hides the "Finding a story" load and the Claude round trip. The only click that crosses a day is Next story, and the cut lands right after it.
- **The reader.** A team member reads off-camera into the laptop mic, slowly, like a seven-year-old. To make a stumble, go silent right before the word and stay silent; the help box appears on its own. To make it happen on cue regardless of the mic, **tap the word**: it triggers the same box and the same voice. Say the word clearly after the line and keep going.
- **Pages are live.** Each "Next story" asks Claude for a page built around the practice words, so the text will differ from take to take. That's fine; the narration describes the system, not the page. If a page comes back odd, tap Next story again before you start the take.
- **The question is the break beat.** On this build the story question sits at the end of the page, after "You read the whole story." Any answer continues. (Alder also has a breathing break that appears when the mood meter climbs; it won't fire from three calm stumbles, so it isn't in the shot list.)
- **Stars and the mood pill** are at the top of the kid world. They don't change on a stumble, so leave them in frame; if the editor prefers a cleaner frame, crop the top 60 px.
- **Stalls.** Record each stall in full (4.5 to 7 s) and trim to about 1 s in the edit. Never talk over Alder's voice; duck the reader under the narrator everywhere except where the shot list says "not ducked".
- **Parent view.** The hold-to-open Grown-ups button goes straight to `/parent?day=7`. Those are the day-7 numbers from the seeded week; if you'd rather show day 5 ("Working on: where and which"), open `/parent?day=5` directly.
- **B-roll.** (1) Laptop on a kitchen table, Day 5 page on it, mug in frame, afternoon light, slow push-in. (2) A hand turning a page of a paperback beside the laptop. (3) The parent page on a phone over the table, one slow thumb scroll. A hand or a shoulder is enough. **No AI-generated child footage,** and no child on camera without a parent's yes.
- **Edit.** CapCut or iMovie. Lower-thirds "Day 1 · Monday", "Day 2 · Tuesday", "Day 5 · Friday" small, bottom left, fading after 2 s. The black open card and the title card are editor cards, not screens in the app.
- **Voiceover.** `npx tsx scripts/record-voiceover.ts --force` regenerates `public/audio/vo/<id>.mp3` from `content/voiceover.ts` once the narrator voice is chosen. If the voice mangles "Edtech", change it to "Ed tech" and re-run.

## Narrator voice: undecided

Brian was rejected. Pick one before the `--force` run:

1. **Another ElevenLabs premade voice.** Set `ELEVENLABS_VOICE_ID_NARRATOR` in `.env.local`, run the script. Audition two or three on the closing line first.
2. **A teammate's real voice.** Record the read-through above in one sitting, quiet room, calm pace, one line per file named by id. Warmest option for a hackathon video.
3. **Jessica (Alder's voice).** Set the narrator id to `cgSgspJ2msm6clMCkdW9`. One voice throughout can read as Alder narrating her own week; the fixed open and close then sound like the tutor addressing the judges. Least preferred.
