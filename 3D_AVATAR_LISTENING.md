# 3D Listening — isolated testing flow

On `feat/3davatarmode`, use the existing authorized account (`qa.3d.reading` in local configuration). Login remains username-only. Under Courses → 3D Avatar Mode, select 3D Listening, then Silly Mistakes or Voices in the Broadcast Room.

Routes: `/student/3d-avatar/listening` and `/student/3d-avatar/listening/:topicId`.

The current `ListeningModeTopics` component accepts an optional `avatar` presentation. Only that presentation hides Activity Steps and displays the responsive avatar above the existing audio player, narrator, quiz, completion and retake UI. Default curriculum presentation and playback remain unchanged. Completion returns to the separate topic list without refreshing main LMS progress. Existing `StudentLayout` heartbeat exclusion covers both 3D modes.

The context's Listening transport uses `/3d-avatar/listening/actions`; normal LMS screens keep their existing Socket.IO transport. Separate backend per-account state namespaces isolate Listening from Reading and from curriculum progress. The backend's enable flag and exact username allowlist apply to all 3D routes.

`useAvatarListeningPlayback` keeps one audible recording active. The muted avatar follows passage play/pause/resume/restart, audio/video buffering, errors, page visibility, stage changes and navigation. The existing first-listen and second-listen gates unlock only after the main audio ends; instruction playback does not count as a completed listen. Switching to authored instruction audio pauses passage audio; the avatar uses normal-speed gestures during those short clips.

The supplied video and main audio durations differ: Silly Mistakes is approximately 114 seconds of video / 157 seconds of audio; Voices is 77 / 90. Video progress is mapped proportionally to passage audio so they finish together. This synchronizes playback, not exact speech/lip alignment; no new video is generated. No written transcripts are supplied for these topics.

Validation:

```text
node dev/avatar-listening-check.cjs
node dev/avatar-reading-check.cjs
node dev/reading-finish-check.cjs
npm run build
```

The dedicated playback check exercises the actual hook with controlled media, including audio/video timing, track exclusivity, pause/resume, completion, visibility cleanup and media failure. Backend engine/controller tests cover stages, failed and passed quizzes, resumed attempts, completed revisits, retakes, content validation and separate persisted state.
