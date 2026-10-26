# Visible avatar and narration follow

Applies only to the three `/student/3d-avatar/:mode/:topicId` activity pages on `feat/3davatarmode`.

## Layout

The avatar remains above the learning workspace on every screen size. `useAvatarWorkspace` measures the remaining visible viewport, including mobile visual-viewport resize events. The top title/progress and avatar are outside the lower panel's scroll area. Reading's passage scrolls within its card; Listening's content/quiz and Roleplay's conversation keep their existing internal scroll behavior. The avatar does not move when those panels scroll.

Shared `.avatar-workspace-*` styles are opt-in. Very short landscape screens use a smaller avatar and compact header to preserve usable text space. The same centered video crop is retained so head and hands remain visible. Normal curriculum routes retain their original dimensions, header, step list and media behavior.

The workspace is capped at 480px on larger displays. Its avatar stage uses the same 1.42 aspect ratio on desktop and mobile (subject to short-viewport limits), preserving the portrait framing and readable line length instead of stretching into a wide desktop strip.

## Reading sentence cues

`readingNarrationCues.json` contains 13 cues for The True Story of a Boy and His Horn and 11 for Someone Has to Do It!. Timings were extracted locally from the existing authored WAVs with faster-whisper base.en, word timestamps and CPU int8. All 185 and 144 passage words respectively matched the recognition alignment, and the first/last recognized word of every sentence was checked for a positive, ordered interval. The cue boundaries are audio-derived; they are not estimates based on sentence length. This was automatic alignment/text verification, not a human listening review.

The JSON records the source audio URL, duration, SHA-256 for provenance, exact display text and sentence character ranges. The UI enables the cues only when topic, audio URL, full display text and loaded duration match. If a source is edited, re-align and check the recording; do not stretch old cues to a changed passage. Replacing audio at the same URL with identical duration still requires refreshing this metadata; runtime does not download/hash the full WAV again.

`useAvatarPassage` supplies audio time, including seek events. `AvatarNarratedPassage` highlights only the active sentence, leaving silence unhighlighted. Pause preserves the audio position, restart resets it, and completion clears the final highlight. Auto-follow scrolls the passage container only, never the page or avatar. Wheel/touch/keyboard/scrollbar input suspends following; a Follow narration button in the card header restores it. Reduced-motion preferences disable smooth scrolling.

The opt-in narration prop on ReadingPassageCard preserves vocabulary rendering. The single audible authored WAV and muted video coordination remain unchanged. No engine, assessment, quiz or progress rules changed.

Reading practice now animates the same muted video while an AI sentence recording is actually playing. Practice uses a normal-speed gesture loop; it is not exact sentence lip sync. Audio pause/end, learner recording playback, recording, completion, media errors, hidden pages and navigation stop that animation. The passage hook owns both behaviors so handing control between full narration and practice cannot leave a second video controller pausing the active one. Passage playback restores its non-looping, duration-mapped timeline.

## Listening and Roleplay

Listening topics still have no authored passage transcript. No transcript is generated or revealed. The existing instruction/narrator text is marked while its recording plays and is brought into the lower panel's view. This is a playing-text indicator, not sentence-level timing for the main listening audio.

Roleplay marks and follows the currently playing AI message, or the scenario during its playback. Student recording playback is not marked as avatar speech. Dynamic AI replies use message-level indicators, not invented sentence timestamps. Existing stop, recording, completion, visibility and navigation cleanup remain in force.

## Validation

- `node dev/avatar-narration-check.cjs`: both cue maps, complete text coverage, timestamp and text ranges, silence/end boundaries, stale text/URL/duration rejection.
- Existing `avatar-reading-check.cjs`, `avatar-listening-check.cjs`, `avatar-roleplay-check.cjs`, `reading-finish-check.cjs`, and `reading-vocabulary-feedback-check.cjs`.
- `npm run build`.
- `node dev/avatar-workspace-check.cjs` with Playwright available through Node resolution. Start Vite on loopback port 5188 first. It uses the separate development-only `avatar-workspace-harness.html`, synthetic auth and an Axios fixture; it never calls a backend or speech service. Check output defaults to the parent workspace's `outputs/avatar-workspace-qa`.

Browser checks cover 390x844, 768x1024, 1440x900 and 844x390, all three modes, both Reading recordings, internal scrolling, unchanged avatar coordinates, narration-follow control and active speech indicators. Existing downloaded WAVs under the backend's `outputs/avatar-timings/` may be used for byte-range media fixtures; otherwise public authored WAVs are fetched. Cached public avatar video may be supplied as `avatar.mp4` in the QA output folder. These private/local downloads and model dependencies are not committed.

The same browser check also asserts portrait aspect-ratio parity and exercises Reading practice play/pause/resume, learner-audio exclusion and passage/practice handoff on mobile and desktop using synthetic API responses.

Only `index.html` is a production entry. Never use the harness on the same browser origin as a real user login: it sets synthetic localStorage authentication.
