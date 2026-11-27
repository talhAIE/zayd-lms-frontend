import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, BookOpen, Check, ChevronDown, ChevronUp, Headphones, LoaderCircle, MessageCircle, RotateCcw } from 'lucide-react';
import type { ArabicActivityId, ArabicPassageBlock, ArabicReadingFeedback, ArabicSessionView } from '../../types/arabic-reading.contract';
import { ARABIC_ACTIVITY_TITLES, ARABIC_ERROR_TEXT, arabicNumber, type ArabicPlayback, type ArabicReadingActions, type ArabicReadingScreen, type ArabicRecorderView } from './presentation';
import { ArabicAudioControl, ArabicDialog, ArabicFeedbackDetails, ArabicRecorder } from './ArabicReadingControls';
import { ArabicSourceText } from './ArabicSourceText';

const silentPlayback: ArabicPlayback = {target: null, state: 'idle', position: 0, duration: 0, passageEnded: false};
const idleRecorder: ArabicRecorderView = {state: 'idle', seconds: 0};
const steps = ['الاستماع إلى النص','القراءة بصوت عالٍ','اختبار الفهم'];
function ArabicSteps({phase}: {phase: ArabicSessionView['phase'] | 'overview'}) {
  const index = phase === 'overview' ? 0 : ['listen','reading','quiz','completed'].indexOf(phase);
  return <aside className="ar-steps" aria-label="خطوات النشاط"><h2>خطوات القراءة</h2><ol>{steps.map((title, i) =>
    <li key={title} className={i === index ? 'ar-step-active' : i < index ? 'ar-step-done' : ''} aria-current={i === index ? 'step' : undefined}>
      <span className="ar-step-number" aria-hidden="true">{i < index ? <Check /> : arabicNumber(i + 1)}</span>
      <div><span>{title}</span><small>{i < index ? 'مكتملة' : i === index ? 'الخطوة الحالية' : 'لاحقاً'}</small></div>
    </li>)}</ol></aside>;
}
function ArabicPassage({blocks, expanded, playback, actions, busy}: {blocks: ArabicPassageBlock[]; expanded: boolean; playback: ArabicPlayback; actions: ArabicReadingActions; busy?: boolean}) {
  const [open, setOpen] = useState(false), visible = expanded || open;
  return <section className="ar-card ar-passage" aria-label="نص القراءة">
    <header className="ar-section-heading"><h2><BookOpen aria-hidden="true" /> نص القراءة</h2>
      {!expanded && <button type="button" className="ar-secondary" aria-expanded={visible} onClick={() => setOpen(!open)}>{visible ? 'إخفاء النص' : 'عرض النص'}{visible ? <ChevronUp aria-hidden="true" /> : <ChevronDown aria-hidden="true" />}</button>}
    </header>
    {visible && <div className="ar-passage-text" data-ar-passage>{blocks.map(block => block.kind === 'heading'
      ? <h3 key={block.id}><ArabicSourceText text={block.text} /></h3> : <p key={block.id}>{block.marker && <span className="ar-source-marker">{block.marker} </span>}<ArabicSourceText text={block.text} /></p>)}</div>}
    <ArabicAudioControl target={{kind:'passage'}} playback={playback} actions={actions} label="الاستماع إلى النص" busy={busy} />
  </section>;
}
function ArabicQuiz({session, actions, busy}: {session: Extract<ArabicSessionView, {phase:'quiz'}>; actions: ArabicReadingActions; busy?: boolean}) {
  const firstUnchecked = session.questions.findIndex(q => !session.checkedAnswers.some(a => a.questionId === q.id && a.isCorrect));
  const [index, setIndex] = useState(Math.max(0, firstUnchecked)), question = session.questions[index];
  // Local selection is never a verdict. Only a matching server-checked answer unlocks navigation.
  const [draft, setDraft] = useState<{questionId:string; optionId:string} | null>(null);
  const title = useRef<HTMLHeadingElement>(null);
  useEffect(() => { title.current?.focus(); }, [index]);
  if (!question) return <p role="alert">تعذر تحميل السؤال. أعد تحميل النشاط.</p>;
  const checked = session.checkedAnswers.find(a => a.questionId === question.id);
  const selected = draft?.questionId === question.id ? draft.optionId : checked?.selectedOptionId ?? null;
  const result = checked?.selectedOptionId === selected ? checked : undefined;
  const allCorrect = session.questions.every(q => session.checkedAnswers.some(a => a.questionId === q.id && a.isCorrect));
  const go = (next: number) => {setDraft(null); setIndex(next);};
  return <section className="ar-card ar-quiz" aria-label="اختبار الفهم" aria-busy={busy}>
    <header className="ar-section-heading"><h2><Check aria-hidden="true" /> اختبار الفهم</h2><span className="ar-badge">السؤال {arabicNumber(index + 1)} من {arabicNumber(session.questions.length)}</span></header>
    <h3 ref={title} tabIndex={-1}>السؤال {arabicNumber(question.number)}: <ArabicSourceText text={question.prompt} /></h3>
    <fieldset className="ar-options" disabled={busy || result?.isCorrect}><legend className="ar-sr-only">اختر إجابة للسؤال {arabicNumber(question.number)}</legend>
      {question.options.map(option => <label key={option.id} className={`ar-option ${selected === option.id ? 'ar-option-selected' : ''} ${selected === option.id && result ? result.isCorrect ? 'ar-option-correct' : 'ar-option-wrong' : ''}`}>
        <input type="radio" name={`arabic-question-${question.id}`} value={option.id} checked={selected === option.id} onChange={() => setDraft({questionId:question.id, optionId:option.id})} />
        <span className="ar-option-letter" aria-hidden="true">{option.label}</span><span><ArabicSourceText text={option.text} /></span>
      </label>)}
    </fieldset>
    {result && <p className={`ar-answer-feedback ${result.isCorrect ? 'ar-success' : 'ar-error-text'}`} role="status">{result.isCorrect ? 'إجابة صحيحة. يمكنك المتابعة.' : 'الإجابة غير صحيحة. اختر إجابة أخرى ثم تحقّق منها.'}</p>}
    <div className="ar-quiz-footer"><button type="button" className="ar-secondary" disabled={index === 0 || busy} onClick={() => go(index - 1)}>السابق</button>
      {!result?.isCorrect ? <button type="button" className="ar-primary" disabled={!selected || busy || !actions.check} onClick={() => selected && actions.check?.(question.id, selected)}>تحقّق من الإجابة</button>
        : index < session.questions.length - 1 ? <button type="button" className="ar-primary" disabled={busy} onClick={() => go(index + 1)}>السؤال التالي <ArrowLeft aria-hidden="true" /></button>
        : <button type="button" className="ar-primary" disabled={busy || !allCorrect || !actions.finish} onClick={actions.finish}>إنهاء النشاط <Check aria-hidden="true" /></button>}
    </div>
    {index === session.questions.length - 1 && !allCorrect && <p className="ar-muted">أجب عن جميع الأسئلة وتحقّق من صحة إجاباتك قبل الإنهاء.</p>}
  </section>;
}
function ArabicPlayer({session, actions, playback, recorder, busy}: {session: ArabicSessionView; actions: ArabicReadingActions; playback: ArabicPlayback; recorder: ArabicRecorderView; busy?: boolean}) {
  const [feedback, setFeedback] = useState<ArabicReadingFeedback | null>(null), [retake, setRetake] = useState(false);
  return <div className="ar-workspace">
    <ArabicSteps phase={session.phase} />
    <div className="ar-player-content">
      {session.phase === 'completed' ? <section className="ar-card ar-complete" aria-label="اكتمال النشاط">
        <span className="ar-completion-icon"><Check aria-hidden="true" /></span><h2>أحسنت! أكملت نشاط القراءة.</h2>
        <p>أجبت عن {arabicNumber(session.result.correctCount)} من {arabicNumber(session.result.totalQuestions)} أسئلة إجابة صحيحة.</p>
        <div className="ar-button-row"><button type="button" className="ar-primary" disabled={busy || !actions.retake} onClick={() => setRetake(true)}><RotateCcw aria-hidden="true" /> إعادة النشاط</button>
          <button type="button" className="ar-secondary" disabled={!actions.back} onClick={actions.back}>العودة إلى النصوص</button></div>
      </section> : <>
        <ArabicPassage blocks={session.passage} expanded={session.phase === 'listen'} playback={playback} actions={actions} busy={busy || recorder.state === 'recording' || recorder.state === 'starting'} />
        {session.phase === 'listen' && <div className="ar-listen-footer"><p className="ar-muted">استمع إلى النص كاملاً قبل الانتقال إلى القراءة.</p>
          <button type="button" className="ar-primary" disabled={busy || !playback.passageEnded || !actions.listen} onClick={actions.listen}>
            {busy ? 'جارٍ الحفظ…' : playback.passageEnded ? 'التالي: القراءة بصوت عالٍ' : 'استمع إلى النص للمتابعة'}<ArrowLeft aria-hidden="true" /></button></div>}
        {session.phase === 'reading' && <>
          <section className="ar-practice" aria-label="تدريب القراءة">
            <div className="ar-notice"><h2>تدرّب على القراءة</h2><p>استمع إلى الجملة، ثم اقرأ جميع كلماتها وأعدادها بصوت واضح باستخدام الميكروفون.</p></div>
            <ol className="ar-history" aria-label="محادثة القراءة">{session.messages.map(message => <li key={message.id} className={`ar-message ar-message-${message.sender}`}>
              <span className="ar-message-label">{message.sender === 'learner' ? 'قراءتك' : 'معلّم القراءة'}</span><p dir="auto"><ArabicSourceText text={message.text} /></p>
              {message.sender === 'coach' && <div className="ar-message-actions"><ArabicAudioControl target={{kind:'message',messageId:message.id}} playback={playback} actions={actions} label="الاستماع إلى الملاحظات" busy={busy || recorder.state === 'recording' || recorder.state === 'starting'} />
                {message.feedback && <button type="button" className="ar-text-button" onClick={() => setFeedback(message.feedback)}><MessageCircle aria-hidden="true" /> عرض الملاحظات</button>}</div>}
            </li>)}</ol>
            <div className="ar-current-sentence"><div className="ar-section-heading"><h3>اقرأ الجملة التالية</h3><span className="ar-badge">{arabicNumber(session.acceptedCount + session.failedCount + 1)} من {arabicNumber(session.totalChunks)}</span></div>
              <p className="ar-sentence" dir="rtl"><ArabicSourceText text={session.currentChunk.text} /></p>
              <ArabicAudioControl target={{kind:'chunk',chunkId:session.currentChunk.id}} playback={playback} actions={actions} label="الاستماع إلى الجملة" busy={busy || recorder.state === 'recording' || recorder.state === 'starting'} />
            </div>
          </section>
          <ArabicRecorder recorder={recorder} actions={actions} busy={busy} />
        </>}
        {session.phase === 'quiz' && <ArabicQuiz key={session.id} session={session} actions={actions} busy={busy} />}
      </>}
    </div>
    {feedback && <ArabicDialog title="ملاحظات القراءة" close={() => setFeedback(null)}><ArabicFeedbackDetails feedback={feedback} /></ArabicDialog>}
    {retake && <ArabicDialog title="إعادة نشاط القراءة" close={() => setRetake(false)}><p>هل تريد بدء محاولة جديدة؟ ستبقى محاولتك السابقة محفوظة.</p>
      <div className="ar-button-row"><button type="button" className="ar-primary" disabled={busy || !actions.retake} onClick={() => {setRetake(false); actions.retake?.();}}>بدء محاولة جديدة</button><button type="button" className="ar-secondary" onClick={() => setRetake(false)}>إلغاء</button></div>
    </ArabicDialog>}
  </div>;
}

export function ArabicReadingView({screen, actions = {}, playback = silentPlayback, recorder = idleRecorder, busy = false}: {
  screen: ArabicReadingScreen; actions?: ArabicReadingActions; playback?: ArabicPlayback; recorder?: ArabicRecorderView; busy?: boolean;
}) {
  const heading = useRef<HTMLHeadingElement>(null);
  const focusKey = screen.kind === 'session' ? `${screen.session.id}:${screen.session.phase}` : screen.kind === 'overview' ? screen.overview.activity.id : screen.kind;
  useEffect(() => { heading.current?.focus(); }, [focusKey]);
  const title = screen.kind === 'session' ? screen.session.title : screen.kind === 'overview' ? screen.overview.activity.title : 'القراءة العربية';
  return <div className="ar-view" aria-busy={busy || screen.kind === 'loading'}>
    <div className="ar-page-heading"><div><p className="ar-eyebrow">تعلّم بالاستماع والقراءة</p><h1 ref={heading} tabIndex={-1}>{title}</h1></div>
      {actions.back && screen.kind !== 'chooser' && <button type="button" className="ar-secondary" onClick={actions.back}>العودة إلى النصوص</button>}</div>
    {screen.kind === 'loading' && <section className="ar-card ar-state" role="status"><LoaderCircle className="ar-spin" aria-hidden="true" /><p>جارٍ تحميل نشاط القراءة…</p></section>}
    {screen.kind === 'error' && <section className="ar-card ar-state" role="alert"><BookOpen aria-hidden="true" /><h2>{ARABIC_ERROR_TEXT[screen.code]}</h2>
      {actions.retry && <button type="button" className="ar-primary" onClick={actions.retry}><RotateCcw aria-hidden="true" /> إعادة المحاولة</button>}
      {screen.code === 'AR_DISABLED' && <p className="ar-muted">ستتوفر التجربة للحسابات المصرّح لها عند تفعيلها.</p>}</section>}
    {screen.kind === 'chooser' && <><p className="ar-intro">اختر نصاً، واستمع إليه، ثم تدرّب على قراءته وأجب عن أسئلته.</p><div className="ar-topic-grid">
      {(Object.keys(ARABIC_ACTIVITY_TITLES) as ArabicActivityId[]).map((id, index) => {
        const activity = screen.activities.find(a => a.id === id);
        return <article key={id} className="ar-card ar-topic"><div className={`ar-topic-art ar-topic-art-${index + 1}`} aria-hidden="true"><BookOpen /><span>{arabicNumber(index + 1)}</span></div>
          <div className="ar-topic-body"><p className="ar-eyebrow">النص {arabicNumber(index + 1)}</p><h2>{activity?.title ?? ARABIC_ACTIVITY_TITLES[id]}</h2>
            <p className="ar-muted">{arabicNumber(activity?.questionCount ?? [10,6,9][index])} أسئلة • استماع وقراءة وفهم</p>
            <button type="button" className="ar-primary" disabled={busy || !activity?.available || !actions.choose} onClick={() => actions.choose?.(id)}>
              {!activity?.available ? 'غير متاح حالياً' : activity.state === 'completed' ? 'عرض المحاولة' : activity.state === 'not_started' ? 'ابدأ القراءة' : 'متابعة القراءة'}<ArrowLeft aria-hidden="true" /></button>
          </div></article>;
      })}</div></>}
    {screen.kind === 'overview' && <div className="ar-workspace"><ArabicSteps phase="overview" /><section className="ar-card ar-overview"><Headphones className="ar-overview-icon" aria-hidden="true" /><h2>استعد للقراءة</h2>
      <ol>{screen.overview.instructions.map((instruction, i) => <li key={i}>{instruction}</li>)}</ol>
      <p className="ar-muted">يتضمن هذا النص {arabicNumber(screen.overview.activity.questionCount)} أسئلة للفهم.</p>
      <button type="button" className="ar-primary" disabled={busy || !screen.overview.activity.available || !actions.start} onClick={() => actions.start?.(screen.overview.activity.id)}>
        {busy ? 'جارٍ تحميل النص…' : 'الاستماع إلى النص'}<ArrowLeft aria-hidden="true" /></button>
    </section></div>}
    {screen.kind === 'session' && <ArabicPlayer key={screen.session.id} session={screen.session} actions={actions} playback={playback} recorder={recorder} busy={busy} />}
  </div>;
}
