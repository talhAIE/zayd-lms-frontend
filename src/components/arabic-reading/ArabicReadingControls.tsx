import { useEffect, useId, useRef, type ReactNode } from 'react';
import { LoaderCircle, Mic, Pause, Play, RotateCcw, Send, Square, Trash2, X } from 'lucide-react';
import type { ArabicMediaRequest, ArabicReadingFeedback } from '../../types/arabic-reading.contract';
import { ARABIC_RECORDING_LIMITS } from '../../types/arabic-reading.contract';
import { arabicNumber, arabicTime, type ArabicPlayback, type ArabicReadingActions, type ArabicRecorderView } from './presentation';

export function ArabicDialog({title, children, close}: {title: string; children: ReactNode; close: () => void}) {
  const dialog = useRef<HTMLDialogElement>(null), titleId = useId();
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null, node = dialog.current; node?.showModal();
    return () => { node?.close(); previous?.focus(); };
  }, []);
  return <dialog ref={dialog} className="ar-dialog" aria-labelledby={titleId} onCancel={event => {event.preventDefault(); close();}}>
    <header><h2 id={titleId}>{title}</h2><button autoFocus type="button" className="ar-icon" aria-label="إغلاق النافذة" onClick={close}><X aria-hidden="true" /></button></header>
    {children}
  </dialog>;
}
function sameAudio(a: ArabicMediaRequest | null, b: ArabicMediaRequest) {
  return a?.kind === b.kind && (b.kind === 'passage' || (b.kind === 'chunk' && a.kind === 'chunk' && a.chunkId === b.chunkId) ||
    (b.kind === 'message' && a.kind === 'message' && a.messageId === b.messageId));
}
export function ArabicAudioControl({target, playback, actions, label, busy}: {
  target: ArabicMediaRequest; playback: ArabicPlayback; actions: ArabicReadingActions; label: string; busy?: boolean;
}) {
  const active = sameAudio(playback.target, target), state = active ? playback.state : 'idle';
  return <div className="ar-audio-control">
    <button type="button" className="ar-secondary" disabled={busy || !actions.play || state === 'loading'} onClick={() => actions.play?.(target)}
      aria-label={state === 'playing' ? `إيقاف ${label} مؤقتاً` : state === 'unavailable' ? `إعادة تحميل ${label}` : `تشغيل ${label}`}>
      {state === 'loading' ? <LoaderCircle className="ar-spin" aria-hidden="true" /> : state === 'playing' ? <Pause aria-hidden="true" /> : state === 'unavailable' ? <RotateCcw aria-hidden="true" /> : <Play aria-hidden="true" />}
      {state === 'loading' ? 'جارٍ تحميل الصوت…' : state === 'playing' ? 'إيقاف مؤقت' : state === 'unavailable' ? 'إعادة المحاولة' : label}
    </button>
    {active && state === 'unavailable' && <span className="ar-error-text" role="status">تعذر تشغيل الصوت. حاول مجدداً.</span>}
    {active && playback.duration > 0 && state !== 'unavailable' && <>
      <input type="range" className="ar-audio-range" min={0} max={playback.duration} step={1} value={Math.min(playback.duration, Math.max(0, playback.position))}
        disabled={!actions.seek || busy} onChange={event => actions.seek?.(Number(event.target.value))} aria-label={`موضع تشغيل ${label}`}
        aria-valuetext={`${arabicTime(playback.position)} من ${arabicTime(playback.duration)}`} />
      <bdi className="ar-time">{arabicTime(playback.position)} / {arabicTime(playback.duration)}</bdi>
    </>}
  </div>;
}
export function ArabicRecorder({recorder, actions, busy}: {recorder: ArabicRecorderView; actions: ArabicReadingActions; busy?: boolean}) {
  const {state} = recorder, inFlight = busy || state === 'uploading' || state === 'reconciling', text = {
    idle: 'اضغط على الميكروفون واقرأ الجملة بصوت واضح.', starting: 'جارٍ طلب الإذن باستخدام الميكروفون…',
    recording: 'جارٍ التسجيل…', ready: 'تسجيلك جاهز للإرسال.', uploading: 'جارٍ إرسال التسجيل…',
    saved: 'تسجيلك محفوظ على هذا الجهاز وجاهز لإعادة الإرسال.', reconciling: 'نتحقق من استلام التسجيل قبل إعادة الإرسال…',
    denied: 'لم يُسمح باستخدام الميكروفون. اسمح به من إعدادات المتصفح ثم حاول مجدداً.', unavailable: 'الميكروفون غير متاح. تحقق من توصيله وحاول مجدداً.',
  }[state];
  return <section className={`ar-recorder ${state === 'recording' ? 'ar-recording' : ''}`} aria-label="تسجيل القراءة">
    <div className="ar-recorder-copy"><p role={state === 'denied' || state === 'unavailable' ? 'alert' : 'status'}>{text}</p>
      <span className="ar-muted">الحد الأقصى: {arabicNumber(ARABIC_RECORDING_LIMITS.maxAssessmentSeconds)} ثانية</span>
      {(state === 'recording' || state === 'ready') && <bdi className="ar-time" aria-label={`مدة التسجيل ${arabicTime(recorder.seconds)}`}>{arabicTime(recorder.seconds)}</bdi>}
    </div>
    <div className="ar-button-row">
      {['idle','denied','unavailable'].includes(state) && <button type="button" className="ar-icon ar-microphone" aria-label="تسجيل قراءة الجملة" disabled={inFlight || !actions.record} onClick={actions.record}><Mic aria-hidden="true" /></button>}
      {state === 'starting' && <><LoaderCircle className="ar-spin" aria-hidden="true" /><button type="button" className="ar-secondary" disabled={!actions.cancel} onClick={actions.cancel}>إلغاء طلب الميكروفون</button></>}
      {state === 'recording' && <><button type="button" className="ar-danger ar-icon" aria-label="إيقاف التسجيل" disabled={!actions.stop} onClick={actions.stop}><Square aria-hidden="true" /></button>
        <button type="button" className="ar-icon" aria-label="إلغاء التسجيل" disabled={!actions.cancel} onClick={actions.cancel}><Trash2 aria-hidden="true" /></button></>}
      {state === 'ready' && <><button type="button" className="ar-primary" disabled={inFlight || !actions.send} onClick={actions.send}><Send aria-hidden="true" /> إرسال التسجيل</button>
        <button type="button" className="ar-icon" aria-label="حذف التسجيل وإعادة المحاولة" disabled={inFlight || !actions.discard} onClick={actions.discard}><Trash2 aria-hidden="true" /></button></>}
      {state === 'saved' && <><button type="button" className="ar-secondary" disabled={inFlight || !actions.resend} onClick={actions.resend}><RotateCcw aria-hidden="true" /> إعادة إرسال التسجيل</button>
        <button type="button" className="ar-secondary" disabled={inFlight || !actions.discard} onClick={actions.discard}>حذف التسجيل والمحاولة مجدداً</button></>}
      {(state === 'uploading' || state === 'reconciling') && <LoaderCircle className="ar-spin" aria-label="جارٍ المعالجة" />}
    </div>
  </section>;
}
export function ArabicFeedbackDetails({feedback}: {feedback: ArabicReadingFeedback}) {
  const assessment = feedback.assessment;
  return <div className="ar-feedback-details">
    <p className="ar-feedback-message">{feedback.text}</p>
    {!assessment.available && <p className="ar-notice">تقييم النطق غير متاح لهذا التسجيل. الملاحظات مبنية على الكلمات المسموعة فقط.</p>}
    <dl className="ar-score-grid">{(['accuracy','fluency','completeness','pronunciation'] as const).map((key, index) => <div key={key}>
      <dt>{['دقة الكلمات','الطلاقة','اكتمال القراءة','النطق'][index]}</dt>
      <dd>{assessment.available && assessment[key] !== null ? `${arabicNumber(assessment[key]!)} من ١٠٠` : 'غير متاح'}</dd>
    </div>)}</dl>
    {!!feedback.vocabulary?.words.length && <section className="ar-reviewed-words"><h3>كلمات للمراجعة</h3><ul>{feedback.vocabulary.words.map(word => <li key={word} dir="auto">{word}</li>)}</ul></section>}
  </div>;
}
