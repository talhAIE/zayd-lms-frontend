# Phase 4 — Arabic speech engineering handoff

Local implementation is complete. Azure/AI calls, voice selection, Arabic-teacher calibration, content publication and deployment have **not** been performed. The Phase 1 source/key/editorial/speech approval gates remain open. Engineering fixtures are synthetic; they are not teacher-reviewed pronunciation evidence.

## Isolated implementation

All runtime changes are confined to `src/modules/arabic-reading`. The English speech service, English voice/style defaults, storage providers, normal progress/analytics writers, authentication defaults and both database schemas are unchanged. The existing Arabic SQL adapter still writes only its four mode-owned tables. No client regeneration, startup hooks, database operation or content import is added.

`ArabicReadingAzure` lazily constructs its own SDK objects with `ar-SA`. It uses the reviewed session profile's Hamed or Zariyah voice consistently for passage, chunk and coach narration. SSML escapes text, rejects control characters and has no unsupported expressive style or prosody assessment. It never inherits English Tony/hopeful settings or shared credentials. The adapter constructor has no external side effects.

Dedicated configuration in `.env.example` defaults external calls off:

- `ARABIC_READING_ALLOW_EXTERNAL_SPEECH=false`, plus Arabic-only Azure speech key/region.
- `ARABIC_READING_ALLOW_AI_FEEDBACK=false`, plus Arabic-only AI endpoint/key/deployment.
- Existing `LMS_ENABLE_ARABIC_READING=false` and an empty Arabic provisioned-region setting remain unchanged.

Azure documents Arabic recognition, synthesis and pronunciation assessment, the two candidate `ar-SA` voices, and the requirement for continuous processing for recordings longer than 30 seconds. Prosody assessment is English-only. Sources checked during implementation: [language/voice support](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/language-support), [pronunciation assessment](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/how-to-pronunciation-assessment). SDK behavior is locally mocked; documentation support does not establish quality for these passages or availability on an owner's actual Azure resource.

## Recording API

`POST /api/v1/arabic-reading/sessions/:sessionId/audio`

Authenticated multipart body: one `audio` file, UUID `requestId`, integer `expectedRevision` (multipart canonical decimal), approved `chunkId`, and `format` (`webm`, `wav`, `mp3`, `mp4`, `ogg`). File extension/MIME does not establish format: header checks and a whitelisted actual decoder are used. The server chooses the reference from the frozen session, never the client. Arbitrary reference text, identities, scores, phase or verdict fields are refused by DTO validation.

Transport remains capped at 8 MiB and a 180-second recorder ceiling. **Arabic assessment accepts at most 30 decoded seconds**; the frontend must use the tighter limit exported in the safe contract. There is no partial grading. ffmpeg decodes mono 16 kHz PCM through pipes, stops at 31 seconds to bound resources, and rejects any decoded duration over 30 seconds. Actual input duration is not taken from client metadata. Codec processes have a 15-second deadline, bounded output, disabled remote/file protocols and no shell, disk recording or stderr logging. Actual generated WAV/WebM/MP3/fragmented MP4/Ogg tests verify container decoding. Silence/very short input is rejected using a provisional signal-energy check; speech validity is then checked with independent recognition. No learner recordings were used in these tests.

JWT, explicit region, role, default-off flag, current active account, current tester grant, ownership, frozen content, revision and current chunk are checked before decoding or cloud work. Cloud work happens outside SQL transactions. Authorization and session/version/revision are checked again before a short atomic commit. One operation per owner and four per service instance can be processing at once; other operations receive Arabic `AR_RATE_LIMITED`. These resource limits are per process, not a distributed billing quota.

`requestId` is the stable client attempt ID. A successful mutation receipt hashes operation, session, metadata and exact audio bytes. Retrying the identical upload returns the original safe response without regrading, even after advancement. Reusing the ID with different content conflicts. Successful grades atomically save the session revision, learner/coach messages and receipt. Silence, unclear input, overlong audio and pre-commit failures consume no validated attempt. An in-flight duplicate can receive 429; retain its ID/bytes and reconcile/retry. Competing instances can perform duplicate external work before a receipt exists, but CAS/serializable commit and receipt uniqueness allow only one state transition. No distributed exactly-once external billing claim is made.

Uploaded bytes/PCM exist only while processing and are not written to storage, URLs, logs or public assets. The successful receipt stores only its digest and safe result; transcript and safe feedback are mode-owned messages. A failed commit can require external reassessment on retry. Phase 6 implements client pending-recording persistence, unknown-outcome reconciliation and resend/discard.

## Arabic validation and retries

Independent unprompted continuous STT consumes the entire bounded recording before reference-guided pronunciation assessment. All recognized segments are retained. SDK sessions have a 45-second deadline and close streams/recognizers on success, cancellation, start error or timeout. No reference-biased PA transcript establishes content correctness.

Comparison preserves original display strings. A separate NFKC token projection handles presentation forms, diacritics/tatweel, Arabic/Persian/Western digits, decimal separators, signed numbers, percentages and punctuation. It preserves distinct letters, meaningful prefixes, negation, word order, dates/numeric values and every token. There is no English ASCII normalizer, stemming, indiscriminate alef/hamza/ya/ta-marbuta folding or borrowed fuzzy similarity threshold. A spaced single proclitic is accepted only when joining exactly reconstructs the expected token. Bounded dynamic alignment retains missing/extra/substituted tokens. Both exact display and explicitly reviewed speech equivalents are eligible references; no runtime numeric expansion or vocabulary definition is invented.

Supported score values must be finite numbers from 0–100. Missing assessment uses `{available:false, accuracy:null, fluency:null, completeness:null, pronunciation:null}`, never fake zeroes. Available evidence requires actual per-word accuracy. Lowest segment scores preserve weak segments; omitted global scores remain null. Prosody/raw provider objects are excluded. A provisional assessed acceptance requires exact independent transcript alignment, exact PA word alignment, accuracy/pronunciation at least 70 and every word at least 50. These are engineering thresholds, not calibrated Arabic standards.

If independent STT succeeds but assessment is unavailable, the pilot can validate **content matching only**. Feedback explicitly says evaluation used heard words only and pronunciation was unavailable. This does not prove exact Arabic vowels, case endings or pausal pronunciation. An undiacritized transcript is never presented as diacritic assessment. Unknown/missing word evidence and numeric errors must be included in teacher calibration. If STT itself is unavailable or unclear, no validated attempt is consumed.

An ordinary mismatch gets one retry, then the second validated mismatch advances marked incorrect. Success advances accepted. Silence/unclear audio is rejected before this count. Counts reset per chunk. The last chunk transitions to quiz; no quiz checking or completion writer is implemented in this phase. There are no approved vocabulary mappings, so vocabulary remains null and the optional keyword third attempt is not enabled. Do not invent mappings from the PDF.

Feedback is deterministic Arabic. Optional AI can select index 0 or 1 from a status-specific fixed Arabic phrase list, with a strict single-field schema, a short timeout, no retries and deterministic fallback. It receives only the status and approved phrases, never transcript, source, identifiers, private keys or recording data. It cannot change verdict, next target, retry count, scores or generate a new learner-facing claim.

## Private narration API

`POST /api/v1/arabic-reading/sessions/:sessionId/media`

JSON is exactly `{kind:"passage"}`, `{kind:"chunk",chunkId}`, or `{kind:"message",messageId}`. Unknown fields and mixed kinds are refused. Text comes from approved frozen passage/chunks or a coach message in the latest 50 owned messages; arbitrary input and learner messages cannot be synthesized.

Success is binary `audio/mpeg` with `Cache-Control: private, no-store` and `X-Content-Type-Options: nosniff`; failures use the existing Arabic envelope. Fetch using bearer auth, create a client-local blob URL and revoke it on cleanup. Do not embed bearer tokens in `<audio src>` URLs. No public/SAS URL is returned and no external object/container is provisioned.

Narration uses a private `arabic-reading/v1/` process cache, bounded to 32 MiB/64 entries and 8 MiB per audio item. Keys include frozen source-content digest, exact speech-text digest, language, locale, voice, style, encoding and implementation revision. Cache entries never overlap English. Every request reauthorizes ownership, including cache hits and a second check after synthesis; access revoked during synthesis prevents delivery. Restart/eviction only causes regeneration. Distributed persistent private caching is optional future operational work, not required for this pilot.

## Explicit opt-in calibration (prepared, not executed)

`scripts/arabic-reading/calibrate-speech.ts` defaults to an offline explanation and does not load dotenv, bootstrap Nest, access a database, read sample files or call any external service. It is not a publication tool and never changes review flags, feature flags, grants or content.

Before a future external run, obtain owner authorization and consented recordings, have an Arabic teacher review the source references, labels and expected outcomes, choose explicitly dedicated Azure resources, and set the dedicated external-call configuration. No such approval is inferred from a source-preservation instruction. Use a digest-pinned private JSON manifest:

```json
{
  "sourceSha256": "cb15678252361fc2447a554cf894235ca0ce041dfe30556851297d3f03bb95d1",
  "reviewedBy": "actual reviewer after approval",
  "consentConfirmed": true,
  "cases": [{"id":"case-1","text":"reviewed exact Arabic reference","audioFile":"samples/consented.wav","format":"wav"}]
}
```

After separate authorization, the operator supplies `--execute --external-calls-authorized --manifest=<absolute-private-manifest> --manifest-sha256=<sha256>` to the ts-node script. All local sample paths must be within the manifest directory, and all sizes/formats/decoded durations are checked before the first external call. Outputs go only into ignored `tmp/arabic-reading/calibration/<timestamp>`: both voice samples and private score/alignment evidence, with `qualityAccepted:false`, `voiceSelected:null` and `teacherReviewRequired:true`. Credentials, transcripts and audio are not printed. External failure stops with a sanitized message; completed external calls can still incur charges. The tool cannot certify itself.

Teacher acceptance must cover all three passages, original numerals/dates/percentages, the five proposed speech expansions, positive and minimal-pair negative readings, omissions/negation/prefixes, source diacritics, shadda/vowels, case endings and pausal variants, children/adults and differing microphones, silence/noise, low confidence, unavailable assessment and both narrator candidates. Compare false accepts/rejects, select/calibrate thresholds and review the transcript-only policy explicitly. Record actual locale/resource results, chosen voice, versioned fixture evidence and reviewer decision before launch; do not mark these complete using mocks. The supplied Q6/key ambiguity is unchanged.

## Local verification and remaining phases

See `PHASE4_VERIFICATION.json` for exact commands/counts. Both application type checks, safe-contract parity, source/schema seals, isolated speech/HTTP tests, actual local decoder tests and unchanged reading/STEP/NAFS/Primary service regressions are required. Full backend JS/declaration emit uses the same documented `--preserveSymlinks true` setting as Phase 3; the pre-existing default Nest declaration issue is unchanged.

Frontend Phase 4 changes only the learner-safe limits/transport contract and this handoff. UI remains Phase 5, recording/recovery integration Phase 6, and source quiz/completion writers Phase 7. No live SQL Server lock/guard execution, client speech acceptance, UI mount, account/grant operation, push or deployment is claimed.
