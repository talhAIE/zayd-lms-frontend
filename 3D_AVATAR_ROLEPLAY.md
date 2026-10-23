# 3D Roleplay testing flow

On `feat/3davatarmode`, sign in with the existing allowlisted test account (`qa.3d.reading` locally). Courses → 3D Avatar Mode now offers Reading, Roleplay and Listening. Roleplay offers Invitation and Morning Broadcast on Sports Day.

Routes: `/student/3d-avatar/roleplay` and `/student/3d-avatar/roleplay/:topicId`.

`RolePlayModeTopics` retains its current scenario, conversation, text input, recording, feedback, assessment, hints, completion and retake behavior. Its optional `avatar` presentation hides Activity Steps and places the responsive avatar above the existing workspace. Default curriculum presentation remains unchanged. Finishing returns to the separate Roleplay topic list and does not refresh curriculum progress.

The avatar is the existing Saudi Listening MP4, muted and looped at normal speed. `useAvatarSpeakingVideo` follows actual scenario/AI audio playback and browser speech fallback events. It pauses on audio stop/end, student recording, page visibility changes, errors, completion, retake and navigation. Playing a student's recording does not animate the avatar. This is a reusable gesture animation, not exact word-by-word lip synchronization. No HeyGen generation is involved.

The shared 3D context chooses `/3d-avatar/roleplay/actions` and distinct per-account recovery keys. Recording events are transferred as multipart binary to `/3d-avatar/roleplay/:modeSessionId/audio` (8 MB maximum), preserving stable attempt IDs. The backend deduplicates accepted attempts within isolated Roleplay state. Regular Roleplay still uses its existing Socket.IO transport.

Both topic scenarios and introductory audio are read from production. Their seven authored knowledge-base steps are mapped to the existing engine's conversationPlan and requiredTurns configuration. The seven-step completion rule is configured only in this testing adapter. No MCQs are added.

Checks:

```text
node dev/avatar-roleplay-check.cjs
node dev/avatar-reading-check.cjs
node dev/avatar-listening-check.cjs
npm run build
```

Backend tests cover content validation, actual engine text/assessed-recording flows, duplicate recording retries, rejected responses, seven-turn completion, resume/retake, ownership and separate persistent namespaces. `scripts/avatar-reading/verify-roleplay-content.cjs` verifies both production topic mappings with SELECTs only; it does not bootstrap the application or call AI services.
