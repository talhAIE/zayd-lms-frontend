// Local-only visual fixture. No account, network grading, storage or provider calls.
import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import MCQComponent from '../src/components/learning/modes/MCQComponent';
import TrueFalseComponent from '../src/components/learning/modes/TrueFalseComponent';
import DropdownComponent from '../src/components/learning/modes/DropdownComponent';
import MatchComponent from '../src/components/learning/modes/MatchComponent';
import { FillInTheBlankComponent } from '../src/components/learning/modes/AdditionalComponents';
import { GradedAnswerButton } from '../src/components/learning/AnswerFeedback';
import type { LearningComponent } from '../src/services/learningService';
import '../src/index.css';

if (!import.meta.env.DEV || !['localhost', '127.0.0.1'].includes(location.hostname)) throw Error('Local fixture only');
function Question({ type }: { type: string }) {
  const [response, setResponse] = useState<any>({});
  const [attempt, setAttempt] = useState<any>(null);
  const isBoolean = type === 'true_false';
  const component = {
    id: type, title: type === 'mcq' ? 'How do we divide fractions?' : type === 'fill_in_the_blank' ? 'Complete the sentence' : type === 'dropdown' ? 'Choose the operation' : 'Multiplying by the reciprocal divides fractions.',
    componentType: type, content: type === 'fill_in_the_blank' ? { fields: [{ id: 'word', sentence: 'Multiply by the ____.' }] } : { prompt: type === 'mcq' ? 'How do we divide fractions?' : isBoolean ? 'Multiplying by the reciprocal divides fractions.' : 'Choose the operation' },
    options: isBoolean ? [{ id: 'true', label: 'True', value: 'true' }, { id: 'false', label: 'False', value: 'false' }] : [{ id: 'a', label: 'A. We add the fractions' }, { id: 'b', label: 'B. We multiply by the reciprocal' }],
    attempt, matchingLeftItems: type === 'match_column' ? [{ value: 'Reciprocal' }] : [], matchingRightItems: type === 'match_column' ? [{ value: 'Flip numerator and denominator' }, { value: 'Add fractions' }] : [],
  } as unknown as LearningComponent;
  const submit = () => {
    const correct = type === 'match_column' ? response.Reciprocal === 'Flip numerator and denominator' : type === 'fill_in_the_blank' ? response.answers?.word === 'reciprocal' : response.optionId === (isBoolean ? 'true' : 'b');
    setAttempt({ id: type, attemptNumber: (attempt?.attemptNumber ?? 0) + 1, submittedAt: String(Date.now()), response, isCorrect: correct, status: correct ? 'completed' : 'submitted', feedback: { submitted: true, fieldResults: [{ id: 'word', isCorrect: correct }] } });
  };
  return <section className="space-y-3" data-fixture={type}>
    {type === 'mcq' ? <MCQComponent component={component} onAnswerChange={optionId => setResponse({ optionId })} /> :
      isBoolean ? <TrueFalseComponent component={component} onAnswerChange={optionId => setResponse({ optionId })} /> :
      type === 'dropdown' ? <DropdownComponent component={component} onAnswerChange={answers => setResponse({ optionId: Object.values(answers)[0] })} /> :
      type === 'match_column' ? <MatchComponent component={component} onAnswerChange={setResponse} isSubmitted={Boolean(attempt?.isCorrect)} /> :
      <FillInTheBlankComponent component={component} onAnswerChange={setResponse} />}
    <button className="rounded-lg bg-blue-600 px-5 py-2 text-white" onClick={submit}>Check {type}</button>
  </section>;
}
function Preview() {
  const [saved, setSaved] = useState(false);
  return <main className="mx-auto max-w-3xl space-y-8 p-6">
    <h1 className="text-2xl font-bold">Answer feedback preview</h1>
    <p>Check a wrong answer, then try the correct answer. Existing results stay static on revisit.</p>
    <Question type="mcq" /><Question type="true_false" /><Question type="fill_in_the_blank" /><Question type="dropdown" /><Question type="match_column" />
    <button onClick={() => setSaved(value => !value)}>Toggle saved correct answer</button>
    {saved && <GradedAnswerButton feedbackKey="saved" result={true} className="w-full rounded-xl border p-4">Saved correct answer (no animation)</GradedAnswerButton>}
  </main>;
}
const root = import.meta.hot?.data.root ?? createRoot(document.getElementById('root')!);
if (import.meta.hot) import.meta.hot.data.root = root;
root.render(<Preview />);
