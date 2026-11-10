import { useEffect, useState, type ReactNode } from 'react';
import { Mic, Square, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GradedAnswerButton } from '@/components/learning/AnswerFeedback';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';
import type { PrimaryAction, PrimaryApi, PrimaryItem, PrimarySnapshot, SpokenText, WordCue } from '@/services/primaryService';
import { usePrimaryPlayback } from './usePrimaryPlayback';

export const primarySteps = ['Learn', 'Practice', 'Talk to Zayd', 'My Real Life'];
export function primaryStepIndex(step: PrimaryItem['step']) {
  return step === 'learn' ? 0 : step === 'practice' ? 1 : step === 'talk' ? 2 : 3;
}

function highlightedText(text: string, cues: WordCue[] | undefined, time: number) {
  const cue = cues?.find(({ startMs, endMs }) => time >= startMs && time < endMs);
  if (!cue) return text;
  const end = cue.offset + cue.length;
  return <>{text.slice(0, cue.offset)}<mark className="rounded bg-yellow-200 text-inherit">{text.slice(cue.offset, end)}</mark>{text.slice(end)}</>;
}

function passageWords(text: string, vocabulary: Record<string, string>) {
  const words = Object.keys(vocabulary).map((word) => word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  return words.length ? text.split(new RegExp(`\\b(${words.join('|')})\\b`, 'gi')) : [text];
}

export function PrimaryPicture({ api, sessionId, imageKey, alt }: {
  api: PrimaryApi; sessionId: string; imageKey: string; alt: string;
}) {
  const [url, setUrl] = useState('');
  const [failed, setFailed] = useState(false);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    let objectUrl = '';
    void api.media(controller.signal, sessionId, imageKey).then((blob) => {
      if (controller.signal.aborted) return;
      objectUrl = URL.createObjectURL(blob);
      setUrl(objectUrl);
    }).catch(() => {
      if (!controller.signal.aborted) setFailed(true);
    });
    return () => {
      controller.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [api, sessionId, imageKey, retry]);

  return (
    <figure className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 sticky top-16 z-10 xl:top-20">
      {failed ? (
        <div className="grid aspect-video place-content-center gap-3 p-4 text-center text-sm">
          <p>The picture could not load.</p>
          <Button variant="outline" onClick={() => { setFailed(false); setUrl(''); setRetry(retry + 1); }}>Retry picture</Button>
        </div>
      ) : url ? (
        <img src={url} alt={alt} className="w-full max-h-[28dvh] object-contain lg:max-h-[65dvh]" onError={() => setFailed(true)} />
      ) : <div role="status" className="grid aspect-video place-content-center text-sm text-slate-600">Loading picture…</div>}
    </figure>
  );
}

type Submission = { action: PrimaryAction; value?: string } | { action: 'record'; audio: Blob; format: string };
type ActivitySnapshot = PrimarySnapshot & { item: PrimaryItem };

export function PrimaryActivity({ api, snapshot, blocked, send }: {
  api: PrimaryApi; snapshot: ActivitySnapshot; blocked: boolean; send: (submission: Submission) => void;
}) {
  const { item, sessionId, feedback, draftId, selectedModelId } = snapshot;
  const { play, stop, playback, audioError } = usePrimaryPlayback();
  const recorder = useAudioRecorder();
  const { isRecording, isStartingRecording, isProcessingRecording, recordTime, recordingError } = recorder;
  const [preparing, setPreparing] = useState(false);
  const [preview, setPreview] = useState<Blob | null>(null);
  const [captureError, setCaptureError] = useState('');
  const [vocabularyWord, setVocabularyWord] = useState<string | null>(null);
  const micBusy = isRecording || isStartingRecording || isProcessingRecording || preparing;
  const disabled = blocked || micBusy;
  const can = (action: PrimaryAction | 'record') => snapshot.allowedActions.includes(action);

  function action(action: PrimaryAction, value?: string) {
    stop();
    send({ action, value });
  }

  function playClip(key: string, confirm = false) {
    void play(key, (signal) => api.media(signal, sessionId, key), confirm && can('confirm-listen')
      ? () => send({ action: 'confirm-listen', value: key })
      : undefined);
  }

  function spoken({ text, audioKey }: SpokenText, options: {
    label?: string; confirm?: boolean; showText?: boolean; grading?: { result?: boolean; feedbackKey: number };
  } = {}) {
    const current = playback?.key === audioKey;
    const props = {
      type: 'button' as const,
      disabled,
      onClick: () => playClip(audioKey, options.confirm),
      'aria-label': options.label,
      'aria-description': options.label ? text : undefined,
      'aria-pressed': current,
      className: 'flex min-w-0 items-start gap-2 rounded-xl border border-blue-100 bg-blue-50 px-3 py-2.5 text-left text-slate-900 hover:border-blue-400 focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-60',
    };
    const label = (
      <>
        {current ? <VolumeX className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" /> : <Volume2 className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />}
        <span className="min-w-0 whitespace-pre-wrap break-words">
          {options.label && <span className="mr-2 text-sm font-semibold text-blue-700">{options.label}</span>}
          {options.showText !== false && text}
        </span>
      </>
    );
    return options.grading
      ? <GradedAnswerButton {...props} result={options.grading.result} feedbackKey={options.grading.feedbackKey}>{label}</GradedAnswerButton>
      : <button {...props}>{label}</button>;
  }

  async function finishRecording() {
    setPreparing(true);
    try {
      const recording = await recorder.stopRecording();
      if (!recording) return;
      try {
        const audio = await fetch(recording.audioUrl).then((response) => response.blob());
        if (audio.size > 8 * 1024 * 1024) {
          setCaptureError('This recording is too large. Try a shorter recording.');
          return;
        }
        setPreview(audio);
        send({ action: 'record', audio, format: recording.format });
      } finally {
        URL.revokeObjectURL(recording.audioUrl);
      }
    } catch {
      setCaptureError('Could not prepare the recording. Please try again.');
    } finally {
      setPreparing(false);
    }
  }

  useEffect(() => {
    if (isRecording && !preparing && recordTime >= 180) void finishRecording();
  }, [isRecording, preparing, recordTime]);

  let content: ReactNode;
  let readingTarget: ReactNode;
  let nextLabel = 'Next';
  switch (item.step) {
    case 'learn': {
      const paragraph = item.paragraph;
      const showPassage = Boolean(paragraph) || item.sentenceCount > 1 || Object.keys(item.slide.vocabulary).length > 0;
      const entry = vocabularyWord ? item.vocabulary[vocabularyWord] : undefined;
      const listened = !can('confirm-listen');
      if (paragraph) {
        nextLabel = item.sentenceIndex + 1 < item.sentenceCount ? 'Next sentence'
          : paragraph.index + 1 < paragraph.count ? 'Next paragraph' : 'Start Practice';
      }
      content = (
        <>
          {showPassage && (
            <>
              {paragraph && <p className="text-sm font-medium text-blue-700">Paragraph {paragraph.index + 1} of {paragraph.count}</p>}
              <p className="whitespace-pre-wrap break-words rounded-xl border border-blue-100 bg-blue-50 p-3 leading-relaxed">
                {passageWords(item.slide.text, item.slide.vocabulary).map((part, index) => {
                  const word = item.slide.vocabulary[part.toLowerCase()];
                  return word ? (
                    <button key={index} type="button" disabled={disabled} aria-expanded={vocabularyWord === word}
                      className="rounded px-0.5 font-semibold text-blue-800 underline decoration-dotted focus-visible:ring-2 focus-visible:ring-blue-500"
                      onClick={() => setVocabularyWord(vocabularyWord === word ? null : word)}>
                      {part}
                    </button>
                  ) : part;
                })}
              </p>
            </>
          )}
          {spoken({ text: item.slide.text, audioKey: item.slide.listenAudioKey }, { label: 'Listen to the passage', confirm: true, showText: !showPassage })}
          {entry && vocabularyWord && (
            <div className="grid gap-2 rounded-xl border border-slate-200 p-3" aria-label="Vocabulary">
              {spoken({ text: vocabularyWord, audioKey: entry.termAudioKey }, { label: 'Word' })}
              {spoken({ text: entry.meaning, audioKey: entry.meaningAudioKey }, { label: 'Meaning' })}
              {spoken({ text: entry.example, audioKey: entry.exampleAudioKey }, { label: 'Example' })}
            </div>
          )}
          {!listened && <p className="text-sm text-slate-600">Listen to the end to unlock recording.</p>}
        </>
      );
      if (listened) {
        const shadow = snapshot.media[item.sentence.shadowAudioKey];
        readingTarget = (
          <div className="grid gap-2 rounded-xl border border-blue-100 bg-blue-50 p-3">
            <p className="text-sm font-semibold text-blue-800">
              {showPassage ? `Sentence ${item.sentenceIndex + 1} of ${item.sentenceCount}` : 'Read this sentence aloud'}
            </p>
            <p className="break-words font-medium">
              {playback?.key === item.sentence.shadowAudioKey && shadow?.kind === 'audio'
                ? highlightedText(item.sentence.text, shadow.wordCues, playback.timeMs)
                : item.sentence.text}
            </p>
            <div className="flex flex-wrap gap-2">
              {spoken({ text: item.sentence.text, audioKey: item.sentence.shadowAudioKey }, { label: 'Repeat after Zayd', showText: false })}
              {can('record') && spoken(item.independentPrompt, { label: 'Say it alone', showText: false })}
            </div>
          </div>
        );
      }
      break;
    }
    case 'practice':
    case 'talk': {
      const practice = item.step === 'practice';
      const choices = practice ? item.options : item.models;
      const selected = practice ? undefined : choices.find((choice) => choice.id === selectedModelId);
      content = (
        <>
          {spoken(item.prompt)}
          <p className="text-sm text-slate-600">{practice ? 'Tap an answer to hear it, then choose your answer.' : 'Pick a sentence, then listen and record yourself saying it.'}</p>
          {choices.map((choice) => (
            <div key={choice.id} className="grid grid-cols-[1fr_auto] items-center gap-2">
              {spoken(choice, practice ? {
                grading: {
                  result: feedback?.selectedOptionId === choice.id ? feedback.accepted : undefined,
                  feedbackKey: snapshot.revision,
                },
              } : undefined)}
              <Button variant={choice.id === selectedModelId ? 'secondary' : 'outline'} disabled={disabled || !can(practice ? 'choose' : 'select-model') || choice.id === selectedModelId}
                aria-label={choice.id === selectedModelId ? `Selected: ${choice.text}` : `Choose: ${choice.text}`}
                onClick={() => { setPreview(null); action(practice ? 'choose' : 'select-model', choice.id); }}>
                {choice.id === selectedModelId ? 'Selected' : 'Choose'}
              </Button>
            </div>
          ))}
          {selected && spoken(selected, { label: 'Listen to your sentence', confirm: true })}
        </>
      );
      break;
    }
    case 'life-intro':
      content = (
        <>
          <h3 className="text-lg font-semibold">{item.title}</h3>
          {spoken(item.intro)}
          <Button className="justify-self-start" disabled={disabled || !can('start-conversation')} onClick={() => action('start-conversation')}>
            Start conversation
          </Button>
        </>
      );
      break;
    case 'life':
      content = (
        <>
          <p className="text-sm font-medium text-slate-600">Talking with {item.partner}</p>
          {spoken(item.prompt)}
          <p className="text-sm text-slate-600">Say your own answer. Tap the hint if you need help.</p>
          {spoken(item.hint, { label: 'Hint' })}
        </>
      );
      break;
  }

  return (
    <section className="grid min-w-0 gap-4 rounded-2xl border border-slate-200 bg-white p-4 sm:p-6" aria-labelledby="primary-step">
      <h2 id="primary-step" className="text-xl font-bold">{primarySteps[primaryStepIndex(item.step)]}</h2>
      {content}
      {feedback && (
        <div role="status" className={`grid gap-2 rounded-xl border p-3 ${feedback.accepted === false ? 'border-amber-200 bg-amber-50' : 'border-blue-100 bg-blue-50'}`}>
          {feedback.audioKey ? spoken({ text: feedback.text, audioKey: feedback.audioKey }) : <p>{feedback.text}</p>}
          {feedback.transcript && <p className="break-words text-sm"><strong>You said</strong> {feedback.transcript}</p>}
        </div>
      )}
      {audioError && <p role="alert" className="text-sm text-red-700">{audioError}</p>}
      {(captureError || recordingError) && <p role="alert" className="text-sm text-red-700">{captureError || recordingError}</p>}
      {preview && item.step !== 'learn' && (
        <Button variant="outline" className="justify-self-start" disabled={disabled} aria-pressed={playback?.key === 'recording-preview'}
          onClick={() => void play('recording-preview', async () => preview)}>
          {playback?.key === 'recording-preview' ? 'Stop playback' : 'Play my recording'}
        </Button>
      )}
      {readingTarget}
      <div className="flex flex-wrap items-center gap-2">
        {can('record') && (
          isRecording ? (
            <Button disabled={preparing} onClick={() => void finishRecording()}>
              <Square className="mr-2 h-4 w-4" aria-hidden="true" /> Stop recording ({recordTime}s)
            </Button>
          ) : (
            <Button disabled={disabled} onClick={() => { stop(); setCaptureError(''); void recorder.startRecording(); }}>
              <Mic className="mr-2 h-4 w-4" aria-hidden="true" />
              {isStartingRecording ? 'Opening microphone…' : preparing ? 'Preparing recording…' : preview || draftId ? 'Record again' : 'Record'}
            </Button>
          )
        )}
        {(isStartingRecording || (isRecording && !preparing)) && <Button variant="outline" onClick={recorder.cancelRecording}>Cancel recording</Button>}
        {can('submit') && draftId && (
          <Button disabled={disabled} onClick={() => action('submit', draftId)}>Submit recording</Button>
        )}
        {can('advance') && <Button disabled={disabled} onClick={() => action('advance')}>{nextLabel}</Button>}
      </div>
    </section>
  );
}

export type PrimarySubmission = Submission;
