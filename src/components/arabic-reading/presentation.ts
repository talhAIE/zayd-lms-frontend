import type { ArabicActivityId, ArabicActivityOverview, ArabicActivitySummary, ArabicErrorCode, ArabicMediaRequest, ArabicSessionView } from '../../types/arabic-reading.contract';

/** Presentation boundary only. No network, recorder, persistence or synthetic success in production. */
export type ArabicReadingScreen =
  | {kind: 'loading'}
  | {kind: 'error'; code: ArabicErrorCode}
  | {kind: 'chooser'; activities: ArabicActivitySummary[]}
  | {kind: 'overview'; overview: ArabicActivityOverview}
  | {kind: 'session'; session: ArabicSessionView};
export interface ArabicPlayback {
  target: ArabicMediaRequest | null;
  state: 'idle' | 'loading' | 'playing' | 'paused' | 'unavailable';
  position: number; duration: number; passageEnded: boolean;
}
export interface ArabicRecorderView {
  state: 'idle' | 'starting' | 'recording' | 'ready' | 'uploading' | 'saved' | 'reconciling' | 'denied' | 'unavailable';
  seconds: number;
}
export interface ArabicReadingActions {
  choose?: (activityId: ArabicActivityId) => void;
  start?: (activityId: ArabicActivityId) => void;
  back?: () => void;
  retry?: () => void;
  listen?: () => void;
  play?: (target: ArabicMediaRequest) => void;
  seek?: (seconds: number) => void;
  record?: () => void;
  stop?: () => void;
  cancel?: () => void;
  send?: () => void;
  resend?: () => void;
  discard?: () => void;
  check?: (questionId: string, optionId: string) => void;
  finish?: () => void;
  retake?: () => void;
  retryMutation?:()=>void;
}
export const ARABIC_ACTIVITY_TITLES = {
  'ar-reading-01': 'حنكة طفل', 'ar-reading-02': 'من نعم الله', 'ar-reading-03': 'السُّكَّري',
} as const;
export const ARABIC_ERROR_TEXT: Record<ArabicErrorCode, string> = {
  AR_DISABLED: 'القراءة العربية غير متاحة حالياً.', AR_UNAUTHORIZED: 'يرجى تسجيل الدخول للمتابعة.',
  AR_NOT_FOUND: 'هذا النشاط غير متاح لهذا الحساب.', AR_UNAVAILABLE: 'تعذر تحميل القراءة العربية حالياً.',
  AR_CONTENT_NOT_READY: 'هذا النص لم يصبح متاحاً للتجربة بعد.', AR_INVALID_REQUEST: 'تعذر تنفيذ الطلب. يرجى المحاولة مجدداً.',
  AR_REVISION_CONFLICT: 'تغيّرت الجلسة. حمّل المحفوظ قبل المتابعة.', AR_REQUEST_CONFLICT: 'تعذر إعادة الطلب بمحتوى مختلف.',
  AR_PHASE_CONFLICT: 'أكمل الخطوة الحالية أولاً.', AR_NO_SPEECH: 'لم يُرصد صوت واضح. سجّل الجملة مجدداً.',
  AR_UNCLEAR_SPEECH: 'اقرأ الجملة مجدداً بصوت واضح.', AR_RECORDING_TOO_LARGE: 'التسجيل أكبر من المسموح. سجّل مقطعاً أقصر.',
  AR_RECORDING_TOO_LONG: 'المدة المسموحة للتسجيل هي ٣٠ ثانية. سجّل مقطعاً أقصر.',
  AR_SPEECH_UNAVAILABLE: 'خدمة الصوت غير متاحة مؤقتاً. احتفظ بتسجيلك وحاول مجدداً.',
  AR_MEDIA_UNAVAILABLE: 'تعذر تشغيل الصوت. يرجى المحاولة مجدداً.', AR_RATE_LIMITED: 'انتظر قليلاً ثم حاول مجدداً.',
};
const number = new Intl.NumberFormat('ar-SA', {useGrouping: false, maximumFractionDigits: 0});
export const arabicNumber = (value: number) => number.format(Number.isFinite(value) ? value : 0);
export function arabicTime(value: number) {
  const seconds = Math.max(0, Math.floor(Number.isFinite(value) ? value : 0));
  return `${arabicNumber(Math.floor(seconds / 60))}:${arabicNumber(seconds % 60).padStart(2, '٠')}`;
}
/** No identity/auth grant inference. The backend remains the authority in Phase 6. */
export function arabicRouteGate(enabled: boolean, authenticated: boolean, role?: string | null): 'disabled' | 'login' | 'denied' | 'ready' {
  if (!enabled) return 'disabled';
  if (!authenticated) return 'login';
  return role?.toLowerCase() === 'student' ? 'ready' : 'denied';
}
export function arabicActivityPath(id: ArabicActivityId) { return `/student/arabic-reading/${id}`; }
