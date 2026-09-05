import { useEffect, useRef, useState } from 'react';
import { AlertCircle, ExternalLink, Send } from 'lucide-react';
import { LearningComponent, LearningResource } from '@/services/learningService';

type Submit = (response: Record<string, unknown>) => Promise<unknown> | void;
const text = (value: unknown): string => typeof value === 'string' ? value : '';

function FullTextReview({ review }: { review: Record<string, unknown> }) {
  const [isOpen, setIsOpen] = useState(false);
  const blocks = Array.isArray(review.blocks)
    ? review.blocks
      .map((block) => typeof block === 'string' ? block : text((block as Record<string, unknown>)?.text))
      .filter(Boolean)
    : [];
  if (!blocks.length) return null;

  const buttonLabel = isOpen
    ? text(review.hideLabel) || 'Hide Full Text'
    : text(review.showLabel) || 'Show Full Text';
  return <section className="mt-5 rounded-[14px] border border-[#BFDBFE] bg-[#EFF6FF] p-4">
    <h3 className="text-sm font-bold text-[#1D4ED8]">{text(review.heading) || 'Optional Full Text Review'}</h3>
    {text(review.description) && <p className="mt-1 text-xs leading-relaxed text-[#1E3A8A]">{text(review.description)}</p>}
    <button type="button" onClick={() => setIsOpen((current) => !current)} className="mt-3 rounded-lg border border-[#60A5FA] bg-white px-3 py-2 text-xs font-bold text-[#1D4ED8] hover:bg-[#DBEAFE]">{buttonLabel}</button>
    {isOpen && <div className="mt-4 max-h-64 space-y-3 overflow-y-auto rounded-lg border border-[#DBEAFE] bg-white p-4 text-sm leading-relaxed text-[#334155]">{blocks.map((block, index) => <p key={`${block.slice(0, 24)}-${index}`}>{block}</p>)}</div>}
  </section>;
}

function emphasizedText(value: string, terms: unknown) {
  const normalizedTerms = Array.isArray(terms)
    ? [...new Set(terms.filter((term): term is string => typeof term === 'string' && !!term.trim()).map((term) => term.trim()))]
    : [];
  if (!normalizedTerms.length) return value;

  const pattern = normalizedTerms
    .sort((left, right) => right.length - left.length)
    .map((term) => term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .join('|');
  if (!pattern) return value;

  return value.split(new RegExp(`(${pattern})`, 'gi')).map((part, index) =>
    normalizedTerms.some((term) => term.toLocaleLowerCase() === part.toLocaleLowerCase())
      ? <strong key={`${part}-${index}`} className="font-bold text-[#0F172A]">{part}</strong>
      : part,
  );
}

export function TextComponent({ component }: { component: LearningComponent }) {
  const content = component.content || {};
  const heading = text(content.heading) || component.title || '';
  const body = text(content.body) || component.description || '';
  
  if (!heading && !body) return <UnavailableComponent component={component} />;

  return (
    <div className="flex flex-col gap-3 font-['Outfit',sans-serif]">
      <section className="flex overflow-hidden rounded-[14px] border border-[#E2E8F0] bg-white shadow-sm">
        <div className="flex w-12 shrink-0 items-center justify-center bg-[#EAF4FF]">
          <div className="h-5 w-4 rounded bg-[#79BFFF]" />
        </div>
        <div className="p-4 md:p-5">
          {heading && <h2 className="text-sm md:text-base font-bold text-[#0F172A]">{heading}</h2>}
          {body && <p className={`text-[13px] md:text-[14px] leading-relaxed text-[#475569] ${heading ? 'mt-1.5' : ''}`}>{body}</p>}
        </div>
      </section>
    </div>
  );
}

export function FillInTheBlankComponent({ component, onAnswerChange, onSubmit, isSubmitted }: { component: LearningComponent; onAnswerChange?: (response: Record<string, unknown>) => void; onSubmit?: Submit; isSubmitted?: boolean }) {
  const content = component.content || {};
  const fields = Array.isArray(content.fields) ? content.fields.filter((field): field is Record<string, unknown> => !!field && typeof field === 'object' && !Array.isArray(field)) : [];
  const prior = component.attempt?.response?.answers;
  const [answers, setAnswers] = useState<Record<string, string>>(() => prior && typeof prior === 'object' && !Array.isArray(prior) ? prior as Record<string, string> : {});
  const [isSubmittingLocal, setIsSubmittingLocal] = useState(false);
  
  const attemptAnswers = component.attempt?.response?.answers as Record<string, string> | undefined;
  const matchesPrior = attemptAnswers && Object.keys(answers).length === Object.keys(attemptAnswers).length && Object.keys(answers).every(key => answers[key] === attemptAnswers[key]);
  const locallySubmitted = isSubmitted || (component.attempt?.feedback?.submitted && matchesPrior);
  
  const feedback = component.attempt?.feedback;
  const fieldResults = Array.isArray(feedback?.fieldResults) ? feedback.fieldResults : [];

  const update = (id: string, value: string) => { const next = { ...answers, [id]: value }; setAnswers(next); onAnswerChange?.({ answers: next }); };
  
  const handleSubmit = async () => {
    if (!onSubmit) return;
    setIsSubmittingLocal(true);
    try {
      await onSubmit({ answers });
    } finally {
      setIsSubmittingLocal(false);
    }
  };

  if (!fields.length) return <UnavailableComponent component={component} />;
  return <section className="rounded-[18px] border border-[#E2E8F0] bg-white p-6 md:p-8 shadow-sm font-['Outfit',sans-serif]"><h2 className="text-xl font-bold text-[#0F172A]">{component.title}</h2>{text(content.instruction) && <p className="mt-2 text-sm text-[#64748B]">{text(content.instruction)}</p>}<div className="mt-5 space-y-4">{fields.map((field, index) => { 
    const id = text(field.id) || `field-${index}`; 
    const fieldRes = fieldResults.find((r: any) => r.id === id);
    let borderClass = 'border-[#CBD5E1]';
    if (locallySubmitted && fieldRes) {
      borderClass = fieldRes.isCorrect ? 'border-[#10B981] bg-[#ECFDF5] text-[#065F46]' : 'border-[#EF4444] bg-[#FEF2F2] text-[#991B1B]';
    }
    const sentence = text(field.sentence) || text(field.label) || text(field.prompt);
    return <label key={id} className="block"><span className="text-sm text-[#334155]">{emphasizedText(sentence, field.boldTerms)}</span><input value={answers[id] || ''} onChange={(event) => update(id, event.target.value)} disabled={isSubmitted || isSubmittingLocal} className={`mt-2 w-full rounded-lg border p-3 text-sm outline-none focus:border-[#4F8DFB] disabled:bg-slate-50 disabled:opacity-80 transition-colors ${borderClass}`} /></label>;
  })}</div>{onSubmit && !isSubmitted && <button type="button" onClick={handleSubmit} disabled={isSubmittingLocal || fields.some((field, index) => !answers[text(field.id) || `field-${index}`]?.trim())} className="mt-5 rounded-lg bg-[#4F8DFB] px-5 py-2.5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50 hover:bg-[#3B82F6]">{isSubmittingLocal ? 'Grading...' : text(content.submitLabel) || 'Submit answers'}</button>}
  </section>;
}

export function WritingTableComponent({ component, onAnswerChange, onDraftSave, onSubmit, onBusyChange, isSubmitted }: { component: LearningComponent; onAnswerChange?: (response: Record<string, unknown>) => void; onDraftSave?: (response: Record<string, unknown>) => void; onSubmit?: Submit; onBusyChange?: (isBusy: boolean) => void; isSubmitted?: boolean }) {
  const content = component.content || {};
  const questions = Array.isArray(content.questions) ? content.questions.filter((question): question is Record<string, unknown> => !!question && typeof question === 'object' && !Array.isArray(question)) : [];
  const fullTextReview = content.fullTextReview && typeof content.fullTextReview === 'object' && !Array.isArray(content.fullTextReview) ? content.fullTextReview as Record<string, unknown> : null;
  const [values, setValues] = useState<Record<string, string>>(() => { const rows = component.attempt?.response?.rows; return Array.isArray(rows) ? Object.fromEntries(rows.filter((row): row is Record<string, unknown> => !!row && typeof row === 'object').map((row) => [text(row.questionId), text(row.sentence)])) : {}; });
  const [isSubmittingLocal, setIsSubmittingLocal] = useState(false);
  const draftSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const response = (next = values) => ({ rows: questions.map((question, index) => ({ questionId: text(question.id) || `question-${index}`, sentence: next[text(question.id) || `question-${index}`] || '' })) });
  
  const attemptRows = component.attempt?.response?.rows as any[] | undefined;
  const matchesPrior = attemptRows && attemptRows.every((row: any) => values[row.questionId] === row.sentence);
  const locallySubmitted = isSubmitted || (component.attempt?.feedback?.submitted && matchesPrior);
  const feedback = component.attempt?.feedback;
  const fieldResults = Array.isArray(feedback?.fieldResults) ? feedback.fieldResults : [];

  useEffect(() => () => {
    if (draftSaveTimer.current) clearTimeout(draftSaveTimer.current);
  }, []);

  const queueDraftSave = (next: Record<string, string>) => {
    if (!onDraftSave) return;
    if (draftSaveTimer.current) clearTimeout(draftSaveTimer.current);
    const draftResponse = response(next);
    draftSaveTimer.current = setTimeout(() => {
      draftSaveTimer.current = null;
      onDraftSave(draftResponse);
    }, 700);
  };

  const handleSubmit = async () => {
    if (!onSubmit) return;
    if (draftSaveTimer.current) {
      clearTimeout(draftSaveTimer.current);
      draftSaveTimer.current = null;
    }
    setIsSubmittingLocal(true);
    onBusyChange?.(true);
    try {
      await onSubmit(response());
    } finally {
      setIsSubmittingLocal(false);
      onBusyChange?.(false);
    }
  };

  if (!questions.length) return <UnavailableComponent component={component} />;
  return <section className="rounded-[18px] border border-[#E2E8F0] bg-white p-6 md:p-8 shadow-sm font-['Outfit',sans-serif]"><h2 className="text-xl font-bold text-[#0F172A]">{component.title}</h2>{text(content.instruction) && <p className="mt-2 text-sm text-[#64748B]">{text(content.instruction)}</p>}{text(content.vocabularyFocus) && <p className="mt-3 rounded-lg bg-[#FFF7ED] p-3 text-sm text-[#9A3412]"><strong>Academic vocabulary focus:</strong> {text(content.vocabularyFocus)}</p>}{fullTextReview && <FullTextReview review={fullTextReview} />}<div className="mt-5 overflow-x-auto"><table className="w-full min-w-[540px] text-left"><thead><tr className="bg-[#F8FAFC]"><th className="p-3 text-sm">Prompt</th><th className="p-3 text-sm">My sentence</th></tr></thead><tbody>{questions.map((question, index) => {
    const id = text(question.id) || `question-${index}`;
    const fieldRes = fieldResults.find((r: any) => r.id === id);
    let borderClass = 'border-[#CBD5E1]';
    if (locallySubmitted && fieldRes) {
      borderClass = fieldRes.isCorrect ? 'border-[#10B981] bg-[#ECFDF5] text-[#065F46]' : 'border-[#EF4444] bg-[#FEF2F2] text-[#991B1B]';
    }
    return <tr key={id} className="border-t border-[#E2E8F0]"><td className="p-3 align-top text-sm text-[#334155]"><strong>{text(question.label)}</strong><p>{text(question.prompt)}</p>{text(question.hint) && <p className="mt-1 text-xs text-[#64748B]">Hint: {text(question.hint)}</p>}</td><td className="p-3"><textarea value={values[id] || ''} placeholder={text(question.placeholder) || text(content.studentBoxPlaceholder)} disabled={isSubmitted || isSubmittingLocal} onChange={(event) => { const next = { ...values, [id]: event.target.value }; setValues(next); const nextResponse = response(next); onAnswerChange?.(nextResponse); queueDraftSave(next); }} className={`min-h-24 w-full rounded-lg border p-3 text-sm outline-none focus:border-[#4F8DFB] disabled:bg-slate-50 transition-colors ${borderClass}`} /></td></tr>;
  })}</tbody></table></div>{onSubmit && !isSubmitted && <button type="button" onClick={handleSubmit} disabled={isSubmittingLocal || questions.some((question, index) => !values[text(question.id) || `question-${index}`]?.trim())} className="mt-5 rounded-lg bg-[#4F8DFB] px-5 py-2.5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50 hover:bg-[#3B82F6]">{isSubmittingLocal ? 'Saving...' : text(content.submitLabel) || 'Save my answers'}</button>}
  </section>;
}

export function ResourceComponent({ component, onInteract }: { component: LearningComponent; onInteract?: (resource: LearningResource, interactionType: 'opened' | 'downloaded') => void }) {
  const content = component.content || {}; const resources = component.resources || [];
  if (!resources.length) return <UnavailableComponent component={component} />;
  return <section className="rounded-[18px] border border-[#E2E8F0] bg-white p-6 md:p-8 shadow-sm font-['Outfit',sans-serif]"><h2 className="text-xl font-bold text-[#0F172A]">{text(content.heading) || component.title}</h2>{text(content.body) && <p className="mt-2 text-sm text-[#64748B]">{text(content.body)}</p>}<div className="mt-5 space-y-3">{resources.map((resource) => { const isDownload = resource.resourceType === 'download' || resource.metadata?.download === true; return <a key={resource.id} href={resource.url} target="_blank" rel="noreferrer" download={isDownload || undefined} onClick={() => onInteract?.(resource, isDownload ? 'downloaded' : 'opened')} className="flex items-center justify-between gap-4 rounded-xl border border-[#E2E8F0] p-4 hover:border-[#4F8DFB]"><span><strong className="block text-sm text-[#0F172A]">{resource.title}</strong>{resource.description && <span className="mt-1 block text-xs text-[#64748B]">{resource.description}</span>}</span><ExternalLink className="h-4 w-4 shrink-0 text-[#2563EB]" /></a>; })}</div></section>;
}

export function ReflectionComponent({ component, onSubmit, isSubmitted }: { component: LearningComponent; onSubmit?: Submit; isSubmitted?: boolean }) {
  const content = component.content || {}; const fields = Array.isArray(content.fields) ? content.fields.filter((field): field is Record<string, unknown> => !!field && typeof field === 'object' && !Array.isArray(field)) : [];
  const [answers, setAnswers] = useState<Record<string, string>>({});
  if (!fields.length) return <UnavailableComponent component={component} />;
  return <section className="rounded-[18px] border border-[#E2E8F0] bg-white p-6 md:p-8 shadow-sm font-['Outfit',sans-serif]"><h2 className="text-xl font-bold text-[#0F172A]">{text(content.heading) || component.title}</h2><div className="mt-5 space-y-4">{fields.map((field, index) => { const id = text(field.id) || `reflection-${index}`; const options = Array.isArray(field.options) ? strings(field.options) : []; return <label key={id} className="block text-sm font-semibold text-[#334155]">{text(field.label)}{options.length ? <select value={answers[id] || ''} disabled={isSubmitted} onChange={(event) => setAnswers({ ...answers, [id]: event.target.value })} className="mt-2 w-full rounded-lg border border-[#CBD5E1] p-3 font-normal"><option value="">Select…</option>{options.map((option) => <option key={option} value={option}>{option}</option>)}</select> : <textarea value={answers[id] || ''} disabled={isSubmitted} onChange={(event) => setAnswers({ ...answers, [id]: event.target.value })} className="mt-2 min-h-24 w-full rounded-lg border border-[#CBD5E1] p-3 font-normal" />}</label>; })}</div>{onSubmit && !isSubmitted && <button type="button" onClick={() => onSubmit({ answers })} className="mt-5 flex items-center gap-2 rounded-lg bg-[#4F8DFB] px-5 py-2.5 text-sm font-bold text-white"><Send className="h-4 w-4" />Submit reflection</button>}</section>;
}

export function UnavailableComponent({ component }: { component: LearningComponent }) { return <section className="rounded-[18px] border border-amber-200 bg-amber-50 p-5 font-['Outfit',sans-serif]"><div className="flex gap-3"><AlertCircle className="h-5 w-5 shrink-0 text-amber-600" /><div><h2 className="font-bold text-amber-900">This activity cannot be displayed</h2><p className="mt-1 text-sm text-amber-800">The published {component.componentType} component has no valid learner content.</p></div></div></section>; }
function strings(value: unknown): string[] { return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []; }
