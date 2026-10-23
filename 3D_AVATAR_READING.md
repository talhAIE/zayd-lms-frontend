# 3D Avatar Reading

Routes: `/student/3d-avatar` → `/student/3d-avatar/reading` → `/student/3d-avatar/reading/:topicId`.

The card is discovered through the backend's authorized availability endpoint. Enable the backend testing flag and exact username allowlist described in its `AVATAR_READING.md`; set the existing frontend `VITE_API_BASE_URL` to the local backend and sign in with that test account. The existing login mechanism is unchanged. Unenabled accounts do not receive the card and direct feature URLs deny access.

3D Reading and 3D Listening are exposed. Each mode has two backend-driven topic cards. Reading reuses `ReadingModeTopics` with an optional `avatar` presentation: Activity Steps are hidden, the avatar appears above the workspace on all screen sizes with head and hands visible, and the current passage, recording, feedback, quiz and completion components remain in use. See `3D_AVATAR_LISTENING.md` for Listening.

`AvatarReadingContext` scopes the event transport, HTTP upload endpoint and per-user recording/feedback recovery keys. Without the context, the existing Socket.IO and `/mode-sessions` upload path remain the defaults. Completion returns to the 3D topic list without querying curriculum progress. The layout excludes 3D routes from ordinary engagement heartbeats.

The authored WAV is the clock and the MP4 is muted. Both respond to the same passage play/pause controls; video timing is normalized to the audio duration. Starting practice/recording, navigation, visibility changes and errors pause coordinated playback. One audio source prevents doubled narration. This is playback synchronization, not generated lip-sync for arbitrary AI feedback.

Local checks:

```text
node dev/avatar-reading-check.cjs
node dev/reading-audio-upload-check.cjs
node dev/reading-finish-check.cjs
node dev/reading-practice-audio-check.cjs
node dev/reading-vocabulary-feedback-check.cjs
npm run build
```

For controlled browser verification, run Vite on a separate loopback port and open `/avatar-reading-harness.html`. This development-only entry uses synthetic account/API fixtures, the real app routes and authored media URLs. It never calls the backend, AI or database. Its visible passage is a short fixture, not a production-content preview. Add `?route=/student/3d-avatar/reading/<topicId>&stage=quiz` to inspect the existing quiz/completion UI, or `?disabled=true` to verify discovery denial. Do not use the harness on the same origin as an active real login: it sets synthetic localStorage auth on its dedicated local origin. Only `index.html` is part of the normal production build; this test entry is not imported by the product.
