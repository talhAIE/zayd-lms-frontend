# STEP Phase 4 production content handoff

The source content is now actually uploaded to production, rather than remaining a local package. `zayd_lms_prod` contains the STEP course, Grammar/Listening/Reading sections, Nouns/Making Plans/Ants topics, three draft versions, 68 questions, 272 choices, private keys, the Ants passage, and a Listening audio reference.

The original 95.060-second Making Plans MP3 is stored privately in production account `zaydlmsprodstore2026`, container `step-private-content`, under `step/step-v1/<source-sha256>.mp3`. Full checksum verification, signed HTTP 206 range access and anonymous HTTP 401 denial passed. No private key, transcript, source package or permanent audio URL belongs in the frontend bundle. Use the authorized short-lived audio API after rollout.

The course/topics remain inactive and all versions remain draft/academic-pending. STEP stays disabled; no accounts/enrollments were created, and the backend application code has not been deployed. Therefore current client course discovery does not expose these drafts. The eleven Nouns findings still block publication.

Package digest: `d0547580aa5d8aa0da1568a502d2464154642ad4ce50c1d92807fb3df8f299d9`. Backend `docs/step/phase4-evidence` contains the actual upload, independent verification and zero-new-record repeat-import reports. Runtime UUIDs and counts are sourced from the API; do not hardcode these operational IDs in the player.

Phase 5 implements course/section navigation and question layouts with the current LMS design. Phase 6 connects autosave/resume/submission and audio lifecycle. Phase 7 handles approved publication, deployment, enrollments and live browser testing. The existing frontend contract is unchanged and no frontend runtime UI/service code changed in Phase 4.
