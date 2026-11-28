/** Learner-safe Arabic Reading v1 contract. No authoring records or answer keys. */
export const ARABIC_READING_API = '/api/v1/arabic-reading' as const;
export const ARABIC_READING_ENTRY = '/student/arabic-reading' as const;
/** Arabic pilot rejects decoded recordings over 30 seconds; transport cap remains 8 MiB / 180 seconds. */
export const ARABIC_RECORDING_LIMITS = {maxBytes: 8 * 1024 * 1024, transportMaxSeconds: 180, maxAssessmentSeconds: 30} as const;
/** POST /sessions/:sessionId/media with ArabicMediaRequest returns private audio/mpeg bytes.
 * Fetch with bearer auth, then use a client-owned blob URL. No token/signed URL in routes.
 */
export const ARABIC_MEDIA_TRANSPORT = 'authenticated-post-mp3' as const;
export type ArabicActivityId = 'ar-reading-01' | 'ar-reading-02' | 'ar-reading-03';
export type ArabicRegion = 'ROW';
export type ArabicVoice = 'ar-SA-HamedNeural' | 'ar-SA-ZariyahNeural';
export type ArabicPhase = 'listen' | 'reading' | 'quiz' | 'completed';
export interface ArabicLanguageProfile {
  language: 'ar'; direction: 'rtl'; speechLocale: 'ar-SA';
  voice: ArabicVoice; speakingStyle: null; prosodySupported: false;
}
export type ArabicErrorCode =
  | 'AR_DISABLED' | 'AR_UNAUTHORIZED' | 'AR_NOT_FOUND' | 'AR_UNAVAILABLE'
  | 'AR_CONTENT_NOT_READY' | 'AR_INVALID_REQUEST' | 'AR_REVISION_CONFLICT'
  | 'AR_REQUEST_CONFLICT' | 'AR_PHASE_CONFLICT' | 'AR_NO_SPEECH'
  | 'AR_UNCLEAR_SPEECH' | 'AR_RECORDING_TOO_LARGE' | 'AR_RECORDING_TOO_LONG'
  | 'AR_SPEECH_UNAVAILABLE' | 'AR_MEDIA_UNAVAILABLE' | 'AR_RATE_LIMITED';
export interface ArabicError { code: ArabicErrorCode; message: string }
export type ArabicEnvelope<T> = { status: true; data: T } | { status: false; error: ArabicError };
export interface ArabicActivitySummary {
  id: ArabicActivityId; title: string; questionCount: number;
  state: 'not_started' | ArabicPhase; sessionId: string | null; available: boolean;
}
export interface ArabicDiscovery { profile: ArabicLanguageProfile; activities: ArabicActivitySummary[] }
export interface ArabicPassageBlock {
  id: string; kind: 'heading' | 'paragraph' | 'list-item'; text: string; marker?: string;
}
export interface ArabicChunk { id: string; text: string }
export interface ArabicActivityOverview {
  activity: ArabicActivitySummary; instructions: string[]; profile: ArabicLanguageProfile;
}
export interface ArabicQuestion {
  id: string; number: number; prompt: string;
  options: Array<{ id: string; label: 'أ' | 'ب' | 'ج' | 'د'; text: string }>;
}
export type ArabicAssessment =
  | { available: false; accuracy: null; fluency: null; completeness: null; pronunciation: null }
  | { available: true; accuracy: number | null; fluency: number | null;
      completeness: number | null; pronunciation: number | null };
export interface ArabicReadingFeedback {
  chunkId: string; status: 'correct' | 'retry' | 'incorrect'; text: string;
  assessment: ArabicAssessment;
  vocabulary: null | { words: string[]; attemptCount: 1 | 2; action: 'glow' | 'open' };
}
export interface ArabicMessage {
  id: string; sequence: number; sender: 'learner' | 'coach'; text: string;
  createdAt: string; clientAttemptId: string | null;
  feedback: ArabicReadingFeedback | null;
}
export interface ArabicCheckedAnswer {
  questionId: string; selectedOptionId: string; isCorrect: boolean; responseId: string;
}
export interface ArabicSessionBase {
  id: string; activityId: ArabicActivityId; title: string; versionId: string;
  runNumber: number; revision: number; profile: ArabicLanguageProfile;
  passage: ArabicPassageBlock[]; hasListened: boolean; startedAt: string;
  lastSavedAt: string; messages: ArabicMessage[];
}
export type ArabicSessionView = ArabicSessionBase & (
  | { phase: 'listen'; currentChunk: null; feedback: null }
  | { phase: 'reading'; currentChunk: ArabicChunk; feedback: ArabicReadingFeedback | null;
      attemptedCount: number; acceptedCount: number; failedCount: number; totalChunks: number }
  | { phase: 'quiz'; questions: ArabicQuestion[]; checkedAnswers: ArabicCheckedAnswer[] }
  | { phase: 'completed'; completedAt: string; result: { correctCount: number; totalQuestions: number } }
);
/** UUID request IDs are scoped to owner + region + activity across all operations. */
export interface ArabicMutationRequest { requestId: string; expectedRevision: number }
export interface ArabicStartRequest { requestId: string }
export interface ArabicListenRequest extends ArabicMutationRequest { playbackEnded: true }
/** POST /sessions/:sessionId/audio. Multipart `audio` file + these fields; no token in URLs.
 * requestId is the stable attempt ID: retain exact bytes/fields for unknown-outcome replay.
 * Success consumes one validated attempt; silence/unclear/too-long/provider rejection consumes none.
 */
export interface ArabicAudioRequest extends ArabicMutationRequest { chunkId: string; format: 'webm' | 'wav' | 'mp3' | 'mp4' | 'ogg' }
/** Digest-only reconciliation/cancellation of the exact multipart attempt; never a fresh grade. */
export interface ArabicAudioRecoveryRequest extends ArabicAudioRequest { audioSha256: string }
export interface ArabicAudioRecovery {
  disposition: 'unconfirmed' | 'committed' | 'discarded';
  /** Current owned session, not an old receipt snapshot. */
  session: ArabicSessionView;
}
export interface ArabicCheckRequest extends ArabicMutationRequest { questionId: string; optionId: string }
export type ArabicFinishRequest = ArabicMutationRequest;
export type ArabicRetakeRequest = ArabicMutationRequest;
export interface ArabicMediaAccess { url: string; expiresAt: string }
export type ArabicMediaRequest = { kind: 'passage' } | { kind: 'chunk'; chunkId: string } | { kind: 'message'; messageId: string };
/** Owned history is keyset-paginated, 1-50 messages. */
export interface ArabicHistory { messages: ArabicMessage[]; nextSequence: number | null }
