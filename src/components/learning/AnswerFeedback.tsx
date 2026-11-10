import { useEffect, useRef, useState, type ButtonHTMLAttributes, type HTMLAttributes } from 'react';
import type { LearningComponent } from '@/services/learningService';

type Result = boolean | null | undefined;
interface FeedbackProps {
  result: Result;
  feedbackKey: unknown;
}

/** Saved results render their colors immediately, but only a new grade animates. */
export function useAnswerAnimation(feedbackKey: unknown, result: Result) {
  const previous = useRef(feedbackKey);
  const [activeKey, setActiveKey] = useState<unknown>(null);
  useEffect(() => {
    if (!feedbackKey) {
      previous.current = feedbackKey;
      setActiveKey(null);
      return;
    }
    if (typeof result !== 'boolean') {
      setActiveKey(null);
      return;
    }
    const changed = previous.current !== feedbackKey;
    previous.current = feedbackKey;
    if (!changed) return;
    setActiveKey(feedbackKey);
    const timeout = window.setTimeout(() => setActiveKey(null), 1200);
    return () => window.clearTimeout(timeout);
  }, [feedbackKey, result]);
  return Boolean(feedbackKey && activeKey === feedbackKey && typeof result === 'boolean');
}

export function gradedAttemptKey(component: LearningComponent): string | null {
  const attempt = component.attempt;
  return attempt?.submittedAt
    ? `${component.id}:${attempt.id}:${attempt.attemptNumber}:${attempt.submittedAt}`
    : null;
}

function Particles() {
  return <span className="answer-confetti" aria-hidden="true">
    {Array.from({ length: 15 }, (_, index) => <span key={index} className="answer-confetti-dot" style={{
      left: `${(index * 37 + 9) % 100}%`, top: `${(index * 7) % 20}px`,
      backgroundColor: ['#10b981', '#3b82f6', '#f5c842'][index % 3],
      animationDelay: `${(index % 5) * 0.04}s`,
    }} />)}
  </span>;
}

function feedbackClass(active: boolean, result: Result) {
  return `answer-feedback ${active ? result ? 'answer-feedback-pop' : 'answer-feedback-shake' : ''}`;
}

export function GradedAnswerButton({ result, feedbackKey, className = '', children, ...props }:
  FeedbackProps & ButtonHTMLAttributes<HTMLButtonElement>) {
  const active = useAnswerAnimation(feedbackKey, result);
  return <button {...props} data-answer-result={typeof result === 'boolean' ? String(result) : undefined}
    className={`${className} ${feedbackClass(active, result)}`}>
    {children}{active && result === true && <Particles />}
  </button>;
}

export function GradedAnswerSurface({ result, feedbackKey, className = '', children, ...props }:
  FeedbackProps & HTMLAttributes<HTMLDivElement>) {
  const active = useAnswerAnimation(feedbackKey, result);
  return <div {...props} data-answer-result={typeof result === 'boolean' ? String(result) : undefined}
    className={`${className} ${feedbackClass(active, result)}`}>
    {children}{active && result === true && <Particles />}
  </div>;
}
