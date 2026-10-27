import { useAvatarWorkspace } from '@/components/avatar-reading/useAvatarWorkspace';
import { readingNarration } from '@/components/avatar-reading/readingNarration';
import { readingPracticePresentation } from '@/utils/readingPracticePresentation';
import { useState, useEffect, useRef, useCallback, useContext } from 'react';
import { AvatarReadingContext } from '@/components/avatar-reading/AvatarReadingContext';
import { useAvatarPassage } from '@/components/avatar-reading/useAvatarPassage';
import { readingFeedbackAction, readingFeedbackNeedsAttention, loadViewedReadingFeedback, saveViewedReadingFeedback } from '@/utils/readingVocabularyFeedback';
import { readingPracticeSpeechText, readingPracticeAudioUrl } from '@/utils/readingPracticeAudio';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { BarChart3, ChevronLeft, Mic, Square, Trash2, Check, MessageCircle, Pause, Play, LoaderCircle, ChevronDown, ChevronUp, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { useModeSession, type ReadingFeedbackTarget } from '@/hooks/useModeSession';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';
import ReadingPassageCard from '@/components/ui/ReadingPassageCard';
import ReadingVocabularyFlashcardModal, { type ReadingVocabularyCard } from '@/components/ui/ReadingVocabularyFlashcardModal';
import TopicCompletionModal from '@/components/ui/TopicCompletionModal';
import FeedbackModal from '@/components/ui/FeedbackModal';
import { ContentPolicyWarningModal } from '@/components/ui/ContentPolicyWarningModal';
import { useLearningProgressRefresh } from '@/hooks/useLearningProgressRefresh';
import { useAudioPlayback } from '@/hooks/useAudioPlayback';
import { fetchLessonModes, fetchUnitLessons } from '@/services/learningService';
import { getLearningModePath, getNextLessonPath, isLockedLearningItem } from '@/utils/learning-navigation';
import SpeechAssessmentModal, { isSpeechAssessment, SpeechAssessment } from '@/components/ui/SpeechAssessmentModal';
import ReactMarkdown from 'react-markdown';

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const GRADE7_READING_VOCABULARY: Record<string, Omit<ReadingVocabularyCard, 'word'>> = {
  adjustments: {
    partOfSpeech: 'noun',
    definition: 'Changes made to get used to a new situation.',
    example: 'Moving to a new country requires many adjustments.',
  },
  positive: {
    partOfSpeech: 'adjective',
    definition: 'Good, helpful, or favorable.',
    example: 'Despite the challenges, his experience was positive.',
  },
  interview: {
    partOfSpeech: 'noun',
    definition: 'A meeting where someone asks questions to get information.',
    example: 'The reporter conducted an interview with Rajeet.',
  },
  announced: {
    partOfSpeech: 'verb',
    definition: 'Made an important statement publicly or clearly.',
    example: 'His father announced the big news at dinner.',
  },
  bulky: {
    partOfSpeech: 'adjective',
    definition: 'Large, heavy, and clumsy to handle.',
    example: 'The winter coat felt heavy and bulky.',
  },
  thermometer: {
    partOfSpeech: 'noun',
    definition: 'An instrument used to measure temperature.',
    example: 'He checked the thermometer to see how cold it was outside.',
  },
};

const getText = (value: unknown): string | null =>
  typeof value === 'string' && value.trim() ? value.trim() : null;

function getVocabularyCards(value: unknown): ReadingVocabularyCard[] {
  if (!Array.isArray(value)) return [];

  return value.flatMap((card: unknown) => {
    if (!card || typeof card !== 'object') return [];

    const vocabulary = card as Record<string, unknown>;
    const word = getText(vocabulary.word) ?? getText(vocabulary.term);
    if (!word) return [];

    const defaultCard = GRADE7_READING_VOCABULARY[word.toLowerCase()];
    const partOfSpeech = getText(vocabulary.partOfSpeech) ?? defaultCard?.partOfSpeech;
    const definition = getText(vocabulary.definition) ?? defaultCard?.definition;
    const example = getText(vocabulary.example) ?? defaultCard?.example;
    if (!partOfSpeech || !definition || !example) return [];

    return [{ word, partOfSpeech, definition, example }];
  });
}

function HighlightedReadingSentence({ text, vocabularyTerms, vocabularyCards, onVocabularyClick }: {
  text: string;
  vocabularyTerms: string[];
  vocabularyCards: ReadingVocabularyCard[];
  onVocabularyClick: (card: ReadingVocabularyCard) => void;
}) {
  // Authored sentences can carry emphasis independently of vocabulary metadata.
  // Normalize here so initial, resumed and feedback prompts share one renderer.
  const emphasizedTerms = [...text.matchAll(/\*\*([\s\S]+?)\*\*/g)].map(match => match[1]);
  const displayText = text.replace(/\*\*([\s\S]+?)\*\*/g, '$1');
  const terms = [...new Set([...vocabularyTerms, ...emphasizedTerms].map((term) => term.trim()).filter(Boolean))]
    .sort((left, right) => right.length - left.length);
  if (terms.length === 0) return <>{displayText}</>;

  const pattern = new RegExp(`(${terms.map(escapeRegExp).join('|')})`, 'gi');
  const termSet = new Set(terms.map((term) => term.toLowerCase()));
  const cardByTerm = new Map(vocabularyCards.map((card) => [card.word.trim().toLowerCase(), card]));
  return <>{displayText.split(pattern).map((part, index) =>
    termSet.has(part.toLowerCase())
      ? cardByTerm.get(part.toLowerCase())
        ? <button key={index} type="button" onClick={() => onVocabularyClick(cardByTerm.get(part.toLowerCase())!)} className="cursor-pointer font-semibold text-[#3B82F6] underline decoration-[#93C5FD] decoration-2 underline-offset-2 transition-colors hover:text-[#2563EB] focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/40" aria-label={`Open vocabulary flashcard for ${part}`}>{part}</button>
        : <span key={index} className="font-semibold text-[#3B82F6]">{part}</span>
      : part,
  )}</>;
}

export default function ReadingModeTopics({ avatar }: { avatar?: { topicId: string; title: string; restartCompleted?: boolean; onSessionReady?: () => void } } = {}) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const avatarWorkspaceRef = useAvatarWorkspace(Boolean(avatar));
  const lessonModeId = avatar?.topicId || searchParams.get('modeId') || '';
  const avatarTransport = useContext(AvatarReadingContext);
  const feedbackStorageKey = `${avatarTransport?.storagePrefix ?? ''}${lessonModeId}`;
  const lessonId = searchParams.get('lessonId') || '';
  const courseId = searchParams.get('courseId') || undefined;
  const unitId = searchParams.get('unitId') || undefined;
  const refreshLearningProgress = useLearningProgressRefresh();
  const allLessonsPath = avatar ? '/student/3d-avatar/reading' : courseId && unitId
    ? '/student/courses/' + courseId + '/units/' + unitId
    : '/student/courses';
  
  const { playingAudioId, isCurrentlyPlaying, loadingAudioId, toggleAudio, stopAudio } = useAudioPlayback();
  const [currentMcqIndex, setCurrentMcqIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number | string>>({});
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [isJustCompleted, setIsJustCompleted] = useState(false);
  const [activeFeedback, setActiveFeedback] = useState<string | null>(null);
  const [activeFeedbackTarget, setActiveFeedbackTarget] = useState<ReadingFeedbackTarget | undefined>();
  const [viewedFeedbackIds, setViewedFeedbackIds] = useState(() => loadViewedReadingFeedback(feedbackStorageKey));
  const openReadingFeedback = useCallback((id: string, feedback: string, target?: ReadingFeedbackTarget) => {
    setActiveFeedback(feedback);
    setActiveFeedbackTarget(target);
    setViewedFeedbackIds(previous => {
      const next = new Set(previous).add(id);
      saveViewedReadingFeedback(feedbackStorageKey, next);
      return next;
    });
  }, [feedbackStorageKey]);
  const [activeAssessment, setActiveAssessment] = useState<SpeechAssessment | null>(null);
  const [activeVocabularyCard, setActiveVocabularyCard] = useState<ReadingVocabularyCard | null>(null);
  const [hasStartedShadowReading, setHasStartedShadowReading] = useState(false);
  const [isStepsExpanded, setIsStepsExpanded] = useState(false);
  const [fallbackSpeechMessageId, setFallbackSpeechMessageId] = useState<string | null>(null);
  const [isFallbackSpeechPaused, setIsFallbackSpeechPaused] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const fallbackSpeechRef = useRef<SpeechSynthesisUtterance | null>(null);
  const {
    isRecording,
    isStartingRecording,
    recordingError,
    isProcessingRecording,
    recordTime,
    startRecording,
    stopRecording,
    cancelRecording
  } = useAudioRecorder({ detectSilence: true });

  const {
    modeSessionId,
    chatHistory,
    contentPayload,
    sessionLoadError,
    isSessionLoading,
    reloadSession,
    mcqList,
    mcqAnswerFeedback,
    isCheckingMcqAnswer,
    readingProgress,
    isTyping,
    hasPendingAudio,
    isSocketConnected,
    isReconcilingAudio,
    lastNewRecordingAttemptId,
    isCompleted,
    isAccountBlocked,
    sessionStatus,
    isContentFilterWarningOpen,
    setIsContentFilterWarningOpen,
    contentFilterWarningData,
    sendAudio,
    retryAudio,
    discardAudio,
    submitMcqs,
    checkMcqAnswer,
    clearMcqAnswerFeedback,
    markReadingPassageListened,
    retryReadingPassageAudio,
    restartSession
  } = useModeSession({ 
    lessonModeId,
    restartCompleted: avatar?.restartCompleted,
    onCompleted: async () => {
      if (!avatar) await refreshLearningProgress(lessonId, { courseId, unitId });
      setIsJustCompleted(true);
      setShowCompletionModal(true);
    }
  });

  const stopAvatarPracticeAudio = () => {
    stopAudio();
    fallbackSpeechRef.current = null;
    window.speechSynthesis?.cancel();
    setFallbackSpeechMessageId(null);
    setIsFallbackSpeechPaused(false);
  };
  useEffect(() => {
    if (modeSessionId && contentPayload && !sessionLoadError) avatar?.onSessionReady?.();
  }, [modeSessionId, contentPayload, sessionLoadError, avatar?.onSessionReady]);
  const avatarPracticeId = avatar && !isRecording && !isAccountBlocked && !showCompletionModal && !isCompleted
    ? fallbackSpeechMessageId && !isFallbackSpeechPaused ? fallbackSpeechMessageId
      : isCurrentlyPlaying && chatHistory.some(message => message.id === playingAudioId && message.role === 'assistant') ? playingAudioId : null
    : null;
  const avatarPassage = useAvatarPassage(
    avatar ? contentPayload?.contentAudioUrl : undefined,
    avatar ? contentPayload?.narrationVideoUrl : undefined,
    markReadingPassageListened,
    { id: avatarPracticeId, stop: stopAvatarPracticeAudio },
  );
  useEffect(() => {
    if (avatar && (isRecording || isAccountBlocked || showCompletionModal || isCompleted)) {
      avatarPassage.pause(); stopAvatarPracticeAudio();
    }
  }, [avatar?.topicId, isRecording, isAccountBlocked, showCompletionModal, isCompleted]);

  useEffect(() => {
    // A generic completed flag alone is not enough to show the revisit
    // decision: an interrupted Reading session must resume its saved page.
    // The backend marks `phase: completed` only after Reading itself has
    // actually finished (and normalizes older completed sessions on resume).
    if (
      isCompleted &&
      !isJustCompleted &&
      readingProgress?.phase === 'completed'
    ) {
      setShowCompletionModal(true);
    }
  }, [isCompleted, isJustCompleted, readingProgress?.phase]);

  useEffect(() => {
    setHasStartedShadowReading(false);
    setViewedFeedbackIds(loadViewedReadingFeedback(feedbackStorageKey));
  }, [lessonModeId, feedbackStorageKey]);

  useEffect(() => {
    const latest = [...chatHistory].reverse().find(message => message.role === 'assistant');
    if (latest?.feedback && readingFeedbackAction(latest.readingVocabularyFeedback, viewedFeedbackIds.has(latest.id)) === 'open') {
      openReadingFeedback(latest.id, latest.feedback, latest.readingFeedbackTarget);
    }
  }, [chatHistory, viewedFeedbackIds, openReadingFeedback]);

  useEffect(() => {
    setCurrentMcqIndex(0);
    setSelectedAnswers({});
  }, [mcqList]);


  const [cooldown, setCooldown] = useState(false);

  useEffect(() => {
    if (lastNewRecordingAttemptId) setCooldown(false);
  }, [lastNewRecordingAttemptId]);

  const handleStopRecording = async () => {
    if (cooldown || isTyping || isAccountBlocked) return;
    const res = await stopRecording();
    if (res) {
      if (await sendAudio(res.audioBase64, res.format, res.audioUrl)) triggerCooldown();
    }
  };

  const triggerCooldown = () => {
    setCooldown(true);
    setTimeout(() => {
      setCooldown(false);
    }, 2000);
  };

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory, isTyping]);

  useEffect(() => () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }, []);

  const toggleInitialReadingPromptSpeech = (
    messageId: string,
    content: string,
    onComplete?: () => void,
  ) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      toast.error('Audio playback is not available in this browser.');
      return;
    }

    if (fallbackSpeechMessageId === messageId) {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
        setIsFallbackSpeechPaused(false);
      } else {
        window.speechSynthesis.pause();
        setIsFallbackSpeechPaused(true);
      }
      return;
    }

    stopAudio();
    window.speechSynthesis.cancel();
    setIsFallbackSpeechPaused(false);

    // Callers supply the full target directly, preserving dialogue quotes.
    const utterance = new SpeechSynthesisUtterance(content);
    utterance.onend = () => {
      if (fallbackSpeechRef.current === utterance) {
        fallbackSpeechRef.current = null;
        setFallbackSpeechMessageId(null);
        setIsFallbackSpeechPaused(false);
        onComplete?.();
      }
    };
    utterance.onerror = () => {
      if (fallbackSpeechRef.current === utterance) {
        fallbackSpeechRef.current = null;
        setFallbackSpeechMessageId(null);
        setIsFallbackSpeechPaused(false);
      }
    };
    fallbackSpeechRef.current = utterance;
    setFallbackSpeechMessageId(messageId);
    window.speechSynthesis.speak(utterance);
  };

  const togglePracticeAudio = (messageId: string, audioUrl?: string | null) => {
    if (avatar) avatarPassage.pause();
    if (audioUrl) toggleStoredAudio(messageId, audioUrl);
    else toast.error('Tony Hopeful audio is unavailable. Reload this activity to retry.');
  };

  const getProgressPercentage = () => {
    if (isCompleted) return 100;

    const baseProgress = ((readingProgress?.hasListenedToPassage && hasStartedShadowReading) || readingProgress?.isRetrying || readingProgress?.phase === 'quiz') ? 15 : 0;

    if (readingProgress) {
      if (mcqList && mcqList.length > 0) {
        const quizProgress = Math.floor(((currentMcqIndex + 1) / mcqList.length) * 20);
        return Math.min(99, 80 + quizProgress);
      }
      return Math.min(80, baseProgress + Math.floor((readingProgress.percentComplete / 100) * 65));
    }

    // Fallback if no readingProgress available yet
    if (mcqList && mcqList.length > 0) {
      const quizProgress = Math.floor(((currentMcqIndex + 1) / mcqList.length) * 20);
      return Math.min(99, 80 + quizProgress);
    }
    return baseProgress;
  };

  const initialPassComplete = Boolean(
    (readingProgress?.hasListenedToPassage && hasStartedShadowReading) ||
    readingProgress?.isRetrying ||
    readingProgress?.phase === 'quiz' ||
    isCompleted,
  );
  const step1Completed = initialPassComplete;
  const step1Active = !step1Completed;
  useEffect(() => {
    if (avatar && !step1Active) avatarPassage.pause();
  }, [avatar, step1Active, avatarPassage.pause]);
  const step2Completed = (mcqList && mcqList.length > 0) || isCompleted;
  const step2Active = step1Completed && !step2Completed;
  const step3Completed = isCompleted;
  const step3Active = step2Completed && !step3Completed;
  const progressLabel = readingProgress?.isRetrying
    ? 'Reviewing marked sentences'
    : `${getProgressPercentage()}% Complete`;

  const isChatActive = !step1Active && (!mcqList || mcqList.length === 0);
  const replayingAvatarPassage = Boolean(avatar && !step1Active && avatarPassage.playing);
  useEffect(() => {
    const panel = chatContainerRef.current;
    if (!avatarPracticeId || !panel) return;
    const sentence = Array.from(panel.querySelectorAll<HTMLElement>('[data-avatar-practice-sentence]'))
      .find(node => node.dataset.avatarPracticeSentence === avatarPracticeId);
    if (!sentence) return;
    const parent = panel.getBoundingClientRect(), child = sentence.getBoundingClientRect();
    if (child.top < parent.top + 12 || child.bottom > parent.bottom - 12)
      panel.scrollTo({ top: panel.scrollTop + child.top - parent.top - 16, behavior: 'auto' });
  }, [avatarPracticeId]);
  const readingPassageText = (() => {
    const blocks = contentPayload?.readingPresentation?.blocks;
    if (Array.isArray(blocks) && blocks.length > 0) {
      return blocks
        .map((block: { speaker?: string; text?: string }) =>
          block.text ? `${block.speaker ? `${block.speaker}: ` : ''}${block.text}` : '',
        )
        .filter(Boolean)
        .join('\n');
    }

    if (typeof contentPayload?.passage === 'string') return contentPayload.passage;
    if (typeof contentPayload?.content === 'string') return contentPayload.content;
    if (Array.isArray(contentPayload?.sentences)) return contentPayload.sentences.join('\n');
    return '';
  })();

  const togglePassageAudio = () => {
    if (avatar) {
      stopAudio();
      window.speechSynthesis?.cancel();
      setFallbackSpeechMessageId(null);
      setIsFallbackSpeechPaused(false);
      void avatarPassage.toggle();
      return;
    }
    const audioUrl = contentPayload?.contentAudioUrl;
    if (audioUrl) {
      if (fallbackSpeechMessageId) {
        window.speechSynthesis.cancel();
        setFallbackSpeechMessageId(null);
        setIsFallbackSpeechPaused(false);
      }
      toggleAudio('reading-passage', audioUrl, markReadingPassageListened);
      return;
    }

    const retrying = retryReadingPassageAudio();
    toast.error(retrying
      ? 'Reading Passage audio is unavailable. Trying Tony narration again; tap Listen shortly.'
      : 'Reading Passage audio is unavailable. Reconnect and try again.');
  };

  const toggleStoredAudio = (messageId: string, audioUrl: string, onEnd?: () => void) => {
    if (avatar) avatarPassage.pause();
    if (fallbackSpeechMessageId) {
      window.speechSynthesis.cancel();
      fallbackSpeechRef.current = null;
      setFallbackSpeechMessageId(null);
      setIsFallbackSpeechPaused(false);
    }
    toggleAudio(messageId, audioUrl, onEnd);
  };

  const finishMode = async () => {
    setShowCompletionModal(false);
    if (avatar) { navigate(allLessonsPath, { replace: true }); return; }
    if (courseId && unitId && lessonId) {
      try {
        const context = { courseId, unitId, lessonId };
        const modes = await fetchLessonModes(lessonId);
        const currentIndex = modes.findIndex((mode) => mode.id === lessonModeId);
        const nextMode = currentIndex >= 0
          ? modes.slice(currentIndex + 1).find((mode) =>
            !isLockedLearningItem(mode) && mode.status !== 'completed')
          : undefined;
        if (nextMode) {
          navigate(getLearningModePath(context, nextMode), { replace: true });
          return;
        }
        const lessons = await fetchUnitLessons(unitId);
        navigate(getNextLessonPath(context, lessons), { replace: true });
        return;
      } catch {
        // The learner can still safely return to the refreshed lesson list.
      }
    }
    navigate(allLessonsPath, { replace: true });
  };

  const initialReadingSentence =
    !step1Active &&
    chatHistory.length === 0 &&
    readingProgress?.phase === 'reading' &&
    Array.isArray(contentPayload?.sentences)
      ? contentPayload.sentences[readingProgress.currentSentenceIndex] ?? null
      : null;
  const vocabularyTerms = Array.isArray(contentPayload?.readingPresentation?.vocabularyTerms)
    ? contentPayload.readingPresentation.vocabularyTerms.filter((term: unknown): term is string => typeof term === 'string')
    : [];
  // Existing Grade 7 content already stores this information in `vocabulary`.
  // Prefer the new reading-presentation cards when available, but retain this
  // fallback so published lessons become interactive immediately.
  const vocabularyCards = [
    ...getVocabularyCards(contentPayload?.readingPresentation?.vocabularyCards),
    ...getVocabularyCards(contentPayload?.vocabulary),
  ].filter((card, index, cards) =>
    cards.findIndex((candidate) => candidate.word.toLowerCase() === card.word.toLowerCase()) === index,
  );
  const cleanAvatarText = (text: string) => avatar ? text.replace(/\*\*([\s\S]*?)\*\*/g, '$1') : text;
  const passageContent = cleanAvatarText(contentPayload?.passage || contentPayload?.content || (contentPayload?.sentences ? contentPayload.sentences.join('\n\n') : ''));
  const readingPresentation = contentPayload?.readingPresentation
    ? { ...contentPayload.readingPresentation, vocabularyCards }
    : undefined;
  if (avatar && readingPresentation?.blocks) {
    readingPresentation.blocks = readingPresentation.blocks.map((block: { text?: string; heading?: string; speaker?: string }) => ({
      ...block,
      text: block.text ? cleanAvatarText(block.text) : block.text,
    }));
  }

  const showAvatarSessionState = Boolean(avatar && (isSessionLoading || sessionLoadError || !modeSessionId || !contentPayload));

  return (
    <div ref={avatarWorkspaceRef} className={`w-full mx-auto bg-white rounded-none md:rounded-[24px] flex flex-col font-['Outfit',sans-serif] overflow-hidden border border-gray-100 shadow-sm relative ${avatar ? 'avatar-workspace avatar-reading-workspace max-w-[1440px] min-w-0' : 'max-w-[1207px] h-[100dvh] md:h-[794px] max-h-[calc(100vh-40px)]'}`}>
      
      <TopicCompletionModal 
        isOpen={showCompletionModal}
        isJustCompleted={isJustCompleted}
        onFinish={() => { void finishMode(); }}
        onRetake={() => {
          if (avatar) avatarPassage.restart();
          setShowCompletionModal(false);
          setCurrentMcqIndex(0);
          setSelectedAnswers({});
          setHasStartedShadowReading(false);
          setIsJustCompleted(false);
          restartSession();
        }}
      />

      <ContentPolicyWarningModal
        open={isContentFilterWarningOpen}
        data={contentFilterWarningData}
        onAcknowledge={() => setIsContentFilterWarningOpen(false)}
      />

      <FeedbackModal 
        isOpen={!!activeFeedback}
        feedbackText={activeFeedback || ''}
        responseContext={activeFeedbackTarget && (
          <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-[#0F1450] whitespace-pre-wrap">
            <p className="mb-2 text-xs font-semibold text-[#526078]">Your attempted reading · {activeFeedbackTarget.status === 'incorrect' ? 'Incorrect' : activeFeedbackTarget.status === 'correct' ? 'Correct' : 'Try again'}</p>
            <HighlightedReadingSentence text={activeFeedbackTarget.text} vocabularyTerms={activeFeedbackTarget.words} vocabularyCards={[]} onVocabularyClick={setActiveVocabularyCard} />
          </div>
        )}
        onClose={() => setActiveFeedback(null)}
      />
      <SpeechAssessmentModal
        assessment={activeAssessment}
        open={!!activeAssessment}
        onClose={() => setActiveAssessment(null)}
      />
      <ReadingVocabularyFlashcardModal
        card={activeVocabularyCard}
        onClose={() => setActiveVocabularyCard(null)}
      />

      {/* Header Progress Group */}
      <div className={`flex flex-col shrink-0 gap-2.5 pb-3 ${avatar ? 'avatar-workspace-header' : ''}`}>
        
        {/* Top Bar */}
        <div className="flex flex-row justify-between items-center px-4 md:px-6 py-4 bg-white border-b border-[#E5E7EB]">
          
          <div className={`${avatar ? 'shrink-0' : 'flex-1'} flex justify-start`}>
            <button 
              onClick={() => navigate(allLessonsPath, { replace: true })}
              className="flex justify-center items-center w-10 h-10 bg-white border border-[#E5E7EB] shadow-[0px_1px_4px_rgba(0,0,0,0.06)] rounded-full hover:bg-gray-50 transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-[#282828]" />
            </button>
          </div>
          
          <div className={`flex-1 flex ${avatar ? 'min-w-0 px-3 sm:px-4' : 'justify-center'}`}>
            <h1 className={`${avatar ? 'text-base leading-6 sm:text-xl' : 'text-[20px] leading-[20px]'} font-bold tracking-[-0.3px] text-[#282828]`}>
              {avatar ? avatar.title : 'Reading Mode'}
            </h1>
          </div>
          
          <div className={`${avatar ? 'shrink-0' : 'flex-1'} flex justify-end items-center gap-3`}>
            {sessionStatus.remainingSeconds !== null && (
              <div className="flex flex-row items-center px-4 py-2 gap-2 bg-[#FEF1E8] rounded-full h-[42px]">
                <span className="font-semibold text-[13px] leading-[16px] text-[#F97316]">
                  {Math.floor(sessionStatus.remainingSeconds / 60)}:{(sessionStatus.remainingSeconds % 60).toString().padStart(2, '0')}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Progress Bar Container (Figma Spec) */}
        <div className="flex flex-col px-4 md:px-8 gap-2.5 pt-3 flex-shrink-0">
          <div className="w-full h-3 bg-[#E5E7EB] rounded-[6px] relative overflow-hidden">
            <div 
              className="h-full bg-[#06CCB5] rounded-[6px] transition-all duration-500 ease-out"
              style={{ width: `${getProgressPercentage()}%` }}
            />
          </div>
          <span className="font-['Outfit'] font-semibold text-[11px] leading-[14px] text-[#06CCB5]">
            {progressLabel}
          </span>
        </div>
      </div>

      {/* Main Split Content */}
      {showAvatarSessionState && (
        <div className="flex flex-1 min-h-0 flex-col items-center justify-center gap-4 p-6 text-center" role={sessionLoadError ? 'alert' : 'status'}>
          {!sessionLoadError && <LoaderCircle className="h-6 w-6 animate-spin text-blue-500" aria-hidden="true" />}
          <p>{sessionLoadError || 'Loading reading practice…'}</p>
          <div className="flex flex-wrap justify-center gap-3">
            {sessionLoadError && <button type="button" onClick={reloadSession} className="rounded-full bg-blue-500 px-6 py-2 font-semibold text-white">Retry</button>}
            <button type="button" onClick={() => navigate(allLessonsPath)} className="rounded-full border px-6 py-2">Back to topics</button>
          </div>
        </div>
      )}
      <div className={`${showAvatarSessionState ? 'hidden' : 'flex'} flex-col min-h-0 pb-6 ${avatar ? 'avatar-workspace-body flex-1 gap-2 px-2 sm:px-4' : 'md:flex-row px-4 md:px-8 gap-4 flex-1'}`}>
        
        {/* Mode Sidebar */}
        {!avatar && <div className="flex flex-col py-3 md:py-4 w-full md:w-[220px] bg-white border border-[#E5E7EB] rounded-[10px] flex-shrink-0">
          <div 
            className="px-4 pb-2 md:pb-2.5 flex justify-between items-center cursor-pointer md:cursor-default"
            onClick={() => window.innerWidth < 768 && setIsStepsExpanded(!isStepsExpanded)}
          >
            <h3 className="font-semibold text-[10px] leading-[13px] tracking-[1.2px] text-[#6E748F] uppercase">
              Activity Steps
            </h3>
            <div className="md:hidden flex items-center justify-center p-1 -mr-1 rounded-md hover:bg-gray-100">
              {isStepsExpanded ? (
                <ChevronUp className="w-4 h-4 text-[#6E748F]" />
              ) : (
                <ChevronDown className="w-4 h-4 text-[#6E748F]" />
              )}
            </div>
          </div>
          
          <div className={`flex-col ${isStepsExpanded ? 'flex' : 'hidden'} md:flex`}>
            <div className="w-full h-[1px] bg-[#E5E7EB]/70" />
            
            {/* Step 1: Reading Passage */}
            <div className={`relative flex flex-row items-center p-[14px_14px_14px_13px] gap-2.5 ${
              step1Active ? 'bg-[#5C9DFF]/10' : ''
            }`}>
              {step1Active && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[40px] bg-[#5C9DFF] rounded-[2px]" />
              )}
              <div className={`flex justify-center items-center w-7 h-7 rounded-full font-bold text-[12px] ${
                step1Completed ? 'bg-[#2DCD6B] text-white' : 'bg-[#5C9DFF] text-white'
              }`}>
                1
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="font-semibold text-[13px] leading-[16px] text-[#0F1450]">Reading Passage</span>
                <span className={`text-[11px] leading-[14px] font-medium ${
                  step1Completed ? 'text-[#2DCD6B]' : 'text-[#5C9DFF]'
                }`}>
                  {step1Completed ? 'Completed' : 'In Progress'}
                </span>
              </div>
            </div>
            <div className="w-full h-[1px] bg-[#E5E7EB]/70" />

            {/* Step 2: Practice Reading */}
            <div className={`relative flex flex-row items-center p-[14px_14px_14px_13px] gap-2.5 ${
              step2Active ? 'bg-[#5C9DFF]/10' : ''
            }`}>
              {step2Active && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[40px] bg-[#5C9DFF] rounded-[2px]" />
              )}
              <div className={`flex justify-center items-center w-7 h-7 rounded-full font-bold text-[12px] ${
                step2Completed
                  ? 'bg-[#2DCD6B] text-white'
                  : (step1Completed ? 'bg-[#5C9DFF] text-white' : 'bg-[#E5E7EB] text-[#6E748F]')
              }`}>
                2
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="font-semibold text-[13px] leading-[16px] text-[#0F1450]">Practice Reading</span>
                <span className={`text-[11px] leading-[14px] font-medium ${
                  step2Completed ? 'text-[#2DCD6B]' : (step1Completed ? 'text-[#5C9DFF]' : 'text-[#6E748F]')
                }`}>
                  {step2Completed ? 'Completed' : (step1Completed ? 'In Progress' : 'Pending')}
                </span>
              </div>
            </div>
            <div className="w-full h-[1px] bg-[#E5E7EB]/70" />

            {/* Step 3: Knowledge Quiz */}
            <div className={`relative flex flex-row items-center p-[14px_14px_14px_13px] gap-2.5 ${
              step3Active ? 'bg-[#5C9DFF]/10' : ''
            }`}>
              {step3Active && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[40px] bg-[#5C9DFF] rounded-[2px]" />
              )}
              <div className={`flex justify-center items-center w-7 h-7 rounded-full font-bold text-[12px] ${
                step3Completed
                  ? 'bg-[#2DCD6B] text-white'
                  : (step2Completed ? 'bg-[#5C9DFF] text-white' : 'bg-[#E5E7EB] text-[#6E748F]')
              }`}>
                3
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="font-semibold text-[13px] leading-[16px] text-[#0F1450]">Knowledge Quiz</span>
                <span className={`text-[11px] leading-[14px] font-medium ${
                  step3Completed
                    ? 'text-[#2DCD6B]'
                    : (step2Completed ? 'text-[#5C9DFF]' : 'text-[#6E748F]')
                }`}>
                  {step3Completed ? 'Completed' : (step2Completed ? 'In Progress' : 'Pending')}
                </span>
              </div>
            </div>
            <div className="w-full h-[1px] bg-[#E5E7EB]/70" />
          </div>

        </div>

        }
        {avatar && (
          <aside className="avatar-workspace-avatar flex w-full min-w-0 shrink-0 flex-col overflow-hidden rounded-2xl border border-[#E5E7EB] bg-[#F8FAFC]" aria-label="3D Reading avatar">
            <div className="avatar-workspace-stage relative overflow-hidden bg-gradient-to-br from-[#EFF6FF] via-white to-[#F0F7FF]">
            <video ref={avatarPassage.videoRef} src={contentPayload?.narrationVideoUrl} muted playsInline preload="auto"
              className="absolute left-1/2 top-0 aspect-video h-[145%] w-auto max-w-none -translate-x-1/2"
              aria-label={`${avatar.title} avatar narration`}
              onLoadedMetadata={avatarPassage.synchronize} />
            {avatarPassage.videoState !== 'ready' && <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#F8FAFC] p-4 text-center text-sm text-slate-600" role={avatarPassage.videoState === 'error' ? 'alert' : 'status'}>
              <p>{avatarPassage.videoState === 'error' ? 'The avatar could not load. Please try again.' : 'Loading avatar…'}</p>
              {avatarPassage.videoState === 'error' && <button type="button" onClick={avatarPassage.retryVideo} className="rounded-full border border-blue-300 bg-white px-4 py-2 font-semibold text-blue-600">Retry avatar</button>}
            </div>}
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 border-t bg-white px-3 py-2.5 sm:px-4">
              <button type="button" disabled={!contentPayload?.contentAudioUrl || isAccountBlocked}
                onClick={togglePassageAudio} className="rounded-full bg-[#3B82F6] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
                {avatarPassage.loading ? 'Loading…' : avatarPassage.playing ? 'Pause passage' : 'Play passage'}
              </button>
              <button type="button" onClick={avatarPassage.restart} className="text-sm text-[#475569]">Restart passage</button>
            </div>
          </aside>
        )}
        {/* Workspace Main */}
        <div className={`flex flex-col gap-4 min-h-0 ${avatar ? 'avatar-workspace-panel flex-1 min-w-0 rounded-2xl border border-[#E5E7EB] bg-white p-3 sm:p-4' : 'flex-1 pr-1'} ${(isChatActive || step1Active) ? avatar ? 'overflow-hidden' : '' : 'overflow-y-auto'}`}>
          
          {/* Reading Passage Card */}
          {contentPayload && (
            contentPayload.passage ||
            contentPayload.content ||
            (contentPayload.sentences && contentPayload.sentences.length > 0) ||
            (contentPayload.readingPresentation?.blocks?.length > 0)
          ) && (
            <div className={`flex flex-col gap-4 min-h-0 ${step1Active || replayingAvatarPassage ? 'flex-1' : 'flex-shrink-0'}`}>
              <ReadingPassageCard 
                content={passageContent}
                narration={avatar ? readingNarration(avatar.topicId, contentPayload.contentAudioUrl, passageContent, avatarPassage.duration, avatarPracticeId ? -1 : avatarPassage.position) : undefined}
                audioUrl={contentPayload.contentAudioUrl}
                readingPresentation={readingPresentation}
                onVocabularyClick={setActiveVocabularyCard}
                showAudioControl={!avatar && Boolean(readingPassageText)}
                isPlaying={avatar ? avatarPassage.playing : playingAudioId === 'reading-passage' && isCurrentlyPlaying}
                onToggleAudio={togglePassageAudio}
                forceExpanded={step1Active || replayingAvatarPassage}
                collapsibleMode="accordion"
              />
              {step1Active && (
                <div className="flex justify-end w-full pb-2 flex-shrink-0">
                  <button
                    onClick={() => setHasStartedShadowReading(true)}
                    disabled={!readingProgress?.hasListenedToPassage}
                    className="px-6 py-2.5 bg-[#3B82F6] text-white rounded-full font-['Outfit'] font-semibold text-[14px] hover:bg-[#2563EB] transition-colors shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {readingProgress?.hasListenedToPassage ? 'Next' : 'Listen to continue'}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Chat History Area (Shown during Chatting stage, hidden during Quiz stage to prevent squishing) */}
          {!step1Active && !replayingAvatarPassage && (!mcqList || mcqList.length === 0) && (
            <div 
              ref={chatContainerRef}
              className="reading-practice-history flex flex-col p-5 px-6 gap-3 flex-1 min-h-[150px] bg-[#F8F9FA] rounded-2xl overflow-y-auto"
            >
              <div className="w-full bg-[#EFF6FF] border border-[#BFDBFE] rounded-xl px-4 py-3 flex items-start gap-3 text-[#1E40AF] text-[13px] leading-relaxed font-medium shadow-sm flex-shrink-0">
                <span className="text-lg leading-none">📖</span>
                <div>
                  <strong className="block text-[#1E3A8A] font-semibold text-[13px]">Practice Reading</strong>
                  Read each sentence from the passage aloud using the microphone.
                </div>
              </div>
              {initialReadingSentence && (
                <div className="flex flex-col items-start gap-2 w-full mt-2">
                  <div className="px-4 py-3 max-w-[85%] text-left bg-white border border-[#E5E7EB] shadow-sm rounded-tr-xl rounded-br-xl rounded-bl-xl rounded-tl-sm">
                    <div className="text-[13px] leading-[18px] text-[#0F1450] whitespace-pre-wrap break-words">
                      <p>Please read the following sentence aloud:</p>
                      <p className="mt-2">&quot;<HighlightedReadingSentence text={initialReadingSentence} vocabularyTerms={vocabularyTerms} vocabularyCards={vocabularyCards} onVocabularyClick={setActiveVocabularyCard} />&quot;</p>
                    </div>
                    <div className="mt-3 flex items-center gap-4 border-t border-[#E5E7EB] pt-2.5">
                      <button
                        type="button"
                        onClick={() => togglePracticeAudio('reading-initial-prompt')}
                        className="flex items-center text-[#0F1450] hover:text-[#5C9DFF] transition-colors"
                        aria-label={fallbackSpeechMessageId === 'reading-initial-prompt' && !isFallbackSpeechPaused ? 'Pause initial reading prompt' : 'Play initial reading prompt'}
                      >
                        {fallbackSpeechMessageId === 'reading-initial-prompt' && !isFallbackSpeechPaused ? (
                          <Pause className="w-5 h-5" />
                        ) : (
                          <Play className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}
              {chatHistory.map((msg, index) => (
                (() => {
                  const practiceSpeechText = msg.role === 'assistant' ? readingPracticeSpeechText(msg) : null;
                  const practiceDisplay = avatar && msg.role === 'assistant' ? readingPracticePresentation(msg.content, practiceSpeechText) : null;
                  const practiceAudioUrl = msg.role === 'assistant' ? readingPracticeAudioUrl(msg) : null;
                  const hasSpeechFallback = Boolean(practiceSpeechText && !practiceAudioUrl);
                  const isFallbackSpeechPlaying = fallbackSpeechMessageId === msg.id;
                  const practiceTextPlaying = Boolean(avatar && msg.role === 'assistant' && (
                    (playingAudioId === msg.id && isCurrentlyPlaying) || (isFallbackSpeechPlaying && !isFallbackSpeechPaused)
                  ));
                  const hasSavedSpeechAssessment = isSpeechAssessment(msg.assessments);
                  const feedbackNeedsAttention = readingFeedbackNeedsAttention(msg.readingVocabularyFeedback, msg.readingFeedbackTarget, viewedFeedbackIds.has(msg.id));
                  // Browser object URLs are available only for the live
                  // attempt. On resume, use the stored recording when it is
                  // available and retain a transcript-to-speech fallback when
                  // only the persisted pronunciation assessment is available.
                  const canReplayLearnerSpeech = Boolean(msg.audioUrl) || hasSavedSpeechAssessment;

                  return (
                <div 
                  key={msg.id || index} 
                  className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} gap-1 w-full mt-2`}
                >
                  <div 
                    className={`px-4 py-3 max-w-[85%] text-left ${
                      msg.role === 'user' 
                        ? 'bg-[#DBEAFE] rounded-tl-xl rounded-bl-xl rounded-br-sm rounded-tr-xl' 
                        : 'bg-white border border-[#E5E7EB] shadow-sm rounded-tr-xl rounded-br-xl rounded-bl-xl rounded-tl-sm'
                    }`}
                  >
                    {msg.readingFeedbackTarget?.status === 'incorrect' && (
                      <p className="mb-2 text-xs font-semibold text-red-700" role="status">Sentence {msg.readingFeedbackTarget.sentenceIndex + 1}: Incorrect</p>
                    )}
                    <div className="text-[13px] leading-[18px] text-[#0F1450] whitespace-pre-wrap break-words">
                      {practiceDisplay ? (
                        <>
                          <p className="mb-2">{practiceDisplay.instruction}</p>
                          <p>"<span data-avatar-practice-sentence={msg.id}
                            aria-current={practiceTextPlaying ? 'true' : undefined}
                            className={practiceTextPlaying ? 'avatar-reading-highlight' : undefined}>
                            <HighlightedReadingSentence text={practiceDisplay.sentence} vocabularyTerms={vocabularyTerms} vocabularyCards={vocabularyCards} onVocabularyClick={setActiveVocabularyCard} />
                          </span>"</p>
                        </>
                      ) : practiceSpeechText && msg.content.endsWith(`"${practiceSpeechText}"`) ? (
                        <>
                          <p className="mb-2">{msg.content.slice(0, -practiceSpeechText.length - 2).trim()}</p>
                          <p>"<span data-avatar-practice-sentence={avatar ? msg.id : undefined}
                            aria-current={avatarPracticeId === msg.id ? 'true' : undefined}
                            className={avatarPracticeId === msg.id ? 'avatar-reading-highlight' : undefined}>
                            <HighlightedReadingSentence text={practiceSpeechText} vocabularyTerms={vocabularyTerms} vocabularyCards={vocabularyCards} onVocabularyClick={setActiveVocabularyCard} />
                          </span>"</p>
                        </>
                      ) : <ReactMarkdown
                        components={{
                          p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />,
                          ul: ({node, ...props}) => <ul className="list-disc pl-4 mb-2 last:mb-0" {...props} />,
                          ol: ({node, ...props}) => <ol className="list-decimal pl-4 mb-2 last:mb-0" {...props} />,
                          li: ({node, ...props}) => <li className="mb-1 last:mb-0" {...props} />,
                          strong: ({node, ...props}) => <strong className="font-bold" {...props} />,
                          em: ({node, ...props}) => <em className="italic" {...props} />,
                        }}
                      >
                        {msg.content}
                      </ReactMarkdown>}
                    </div>
                  {msg.role === 'user' && hasSavedSpeechAssessment && (
                    <p className="mt-1 text-[11px] text-[#526078]">Speech service transcript</p>
                  )}
                  {msg.deliveryStatus === 'sending' && (
                    <div className="mt-2 text-xs text-[#2563EB]">Sending recording...</div>
                  )}
                  {msg.deliveryStatus === 'failed' && (
                    <div className="mt-2 space-y-1">
                      <p className="text-xs text-[#475569]">
                        {isSocketConnected
                          ? isReconcilingAudio
                            ? 'Checking whether your recording was received...'
                            : 'Your recording is saved here and ready to resend.'
                          : 'Your recording is saved here. Reconnect to send it again.'}
                      </p>
                      <button type="button" onClick={retryAudio} disabled={!isSocketConnected || isReconcilingAudio} className="flex items-center gap-1 text-xs font-semibold text-red-600 disabled:cursor-not-allowed disabled:opacity-50">
                        <RotateCcw className="h-3 w-3" /> Send this recording again
                      </button>
                      <button type="button" onClick={() => void discardAudio(msg.id)} disabled={isReconcilingAudio || isTyping} className="flex items-center gap-1 text-xs font-semibold text-[#475569] disabled:cursor-not-allowed disabled:opacity-50">
                        <Trash2 className="h-3 w-3" /> Discard and record again
                      </button>
                    </div>
                  )}
                  {msg.role === 'user' && canReplayLearnerSpeech && (
                    <div className="mt-3 flex items-center justify-end gap-4 border-t border-[#BFDBFE] pt-2.5">
                      <button
                        type="button"
                        onClick={() => msg.audioUrl
                          ? toggleStoredAudio(msg.id, msg.audioUrl)
                          : toggleInitialReadingPromptSpeech(msg.id, msg.content)}
                        className="flex items-center text-[#0F1450] hover:text-[#2563EB] transition-colors"
                        aria-label={
                          (msg.audioUrl && playingAudioId === msg.id && isCurrentlyPlaying) ||
                          (isFallbackSpeechPlaying && !isFallbackSpeechPaused)
                            ? 'Pause your spoken response'
                            : 'Play your spoken response'
                        }
                      >
                        {loadingAudioId === msg.id ? (
                          <LoaderCircle className="w-5 h-5 animate-spin" />
                        ) : (msg.audioUrl && playingAudioId === msg.id && isCurrentlyPlaying) ||
                          (isFallbackSpeechPlaying && !isFallbackSpeechPaused) ? (
                          <Pause className="w-5 h-5" />
                        ) : (
                          <Play className="w-5 h-5" />
                        )}
                      </button>
                      {hasSavedSpeechAssessment && (
                        <button
                          type="button"
                          onClick={() => setActiveAssessment(msg.assessments)}
                          className="flex items-center gap-1.5 text-[#2563EB] hover:text-[#1D4ED8] transition-colors font-semibold text-[12px] leading-[15px]"
                        >
                          <BarChart3 className="h-3.5 w-3.5" />
                          <span>View Assessment</span>
                        </button>
                      )}
                    </div>
                  )}
                  {msg.role === 'assistant' && (practiceAudioUrl || msg.feedback || hasSpeechFallback) && (
                    <div className="mt-3 flex items-center gap-4 border-t border-[#E5E7EB] pt-2.5">
                      {(practiceAudioUrl || hasSpeechFallback) && (
                        <button
                          type="button"
                          onClick={() => togglePracticeAudio(msg.id, practiceAudioUrl)}
                          className="flex items-center text-[#0F1450] hover:text-[#5C9DFF] transition-colors"
                          aria-label={
                            (practiceAudioUrl && playingAudioId === msg.id && isCurrentlyPlaying) || (isFallbackSpeechPlaying && !isFallbackSpeechPaused)
                              ? 'Pause AI response'
                              : 'Play AI response'
                          }
                        >
                          {loadingAudioId === msg.id ? (
                            <LoaderCircle className="w-5 h-5 animate-spin" />
                          ) : (practiceAudioUrl && playingAudioId === msg.id && isCurrentlyPlaying) || (isFallbackSpeechPlaying && !isFallbackSpeechPaused) ? (
                            <Pause className="w-5 h-5" />
                          ) : (
                            <Play className="w-5 h-5" />
                          )}
                        </button>
                      )}
                      {msg.feedback && (
                        <button
                          type="button"
                          onClick={() => openReadingFeedback(msg.id, msg.feedback!, msg.readingFeedbackTarget)}
                          className="flex items-center gap-1.5 text-[#5C9DFF] hover:text-[#4A8BEB] transition-colors font-semibold text-[12px] leading-[15px]"
                          aria-label={feedbackNeedsAttention ? 'View feedback to correct your reading' : 'View feedback'}
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span className={feedbackNeedsAttention ? 'reading-feedback-text-pulse' : undefined}>View Feedback</span>
                        </button>
                      )}
                    </div>
                  )}
                  </div>
                  {msg.createdAt && (
                    <span className="text-[10px] leading-[13px] text-[#6E748F]/60">
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </div>
                  );
                })()
              ))}
              
              {isTyping && (
                <div className="flex flex-col items-start gap-1 w-full mt-2">
                  <div className="px-4 py-3 bg-[#F1F5F9] rounded-tr-xl rounded-br-xl rounded-bl-sm rounded-tl-xl">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* MCQs Area (Figma Spec) */}
          {mcqList && mcqList.length > 0 && (
            <div className="w-full bg-white border border-[#E5E7EB] shadow-[0px_4px_12px_rgba(0,0,0,0.04)] rounded-[12px] p-6 flex flex-col gap-6 flex-shrink-0 font-['Outfit',sans-serif]">
              
              {/* Quiz Header Row */}
              <div className="flex flex-row justify-between items-center w-full">
                <div className="flex flex-row items-center gap-4">
                  {/* Status Icon */}
                  <div className="w-9 h-9 bg-[#DBEAFE] rounded-full flex items-center justify-center flex-shrink-0">
                    <Check className="w-5 h-5 text-[#3B82F6] stroke-[2.5]" />
                  </div>
                  {/* Text Stack */}
                  <div className="flex flex-col gap-0.5">
                    <span className="font-['Outfit'] font-semibold text-[11px] leading-[14px] tracking-[1.2px] text-[#6E748F] uppercase">
                      STEP 4: QUIZ
                    </span>
                    <h3 className="font-['Outfit'] font-bold text-[18px] leading-[23px] text-[#0F1450]">
                      Test Your Knowledge
                    </h3>
                  </div>
                </div>

                {/* Progress Pill */}
                <div className="px-2.5 py-1 bg-[#F3F4F6] rounded-[20px] font-['Outfit'] font-semibold text-[11px] leading-[14px] text-[#6E748F]">
                  {currentMcqIndex + 1}/{mcqList.length}
                </div>
              </div>

              {/* Current Question */}
              {(() => {
                const mcq = mcqList[currentMcqIndex] || mcqList[0];
                const currentAnswer = selectedAnswers[currentMcqIndex];
                const answerFeedback = mcqAnswerFeedback[mcq.id];
                const hasCorrectAnswer = answerFeedback?.isCorrect === true;
                const hasCheckedAnswer = Boolean(answerFeedback);
                const allAnswersCheckedCorrectly = mcqList.every(
                  (question) => mcqAnswerFeedback[question.id]?.isCorrect === true,
                );

                return (
                  <div className="flex flex-col gap-4 w-full">
                    {/* Question Text */}
                    <h4 className="font-['Outfit'] font-bold text-[16px] leading-[24px] text-[#0F1450]">
                      {mcq.question}
                    </h4>

                    {/* Options List */}
                    <div className="flex flex-col gap-2 w-full">
                      {mcq.options.map((opt, oIdx) => {
                        const optVal = typeof opt === 'string' ? oIdx : opt.id;
                        const isSelected = currentAnswer === optVal;
                        const optLabel = typeof opt === 'string' ? opt : opt.text;
                        const isCorrectSelection = isSelected && answerFeedback?.isCorrect === true;
                        const isIncorrectSelection = isSelected && answerFeedback?.isCorrect === false;

                        return (
                          <button
                            key={oIdx}
                            type="button"
                            onClick={() => {
                              if (hasCorrectAnswer) return;
                              clearMcqAnswerFeedback(mcq.id);
                              setSelectedAnswers(prev => ({ ...prev, [currentMcqIndex]: optVal }));
                            }}
                            className={`w-full p-[14px_16px] rounded-[10px] flex flex-row items-center gap-3 cursor-pointer text-left transition-all ${
                              isCorrectSelection
                                ? 'bg-[#ECFDF3] border border-[#22C55E] text-[#166534] shadow-sm'
                                : isIncorrectSelection
                                  ? 'bg-[#FEF2F2] border border-[#EF4444] text-[#991B1B] shadow-sm'
                                  : isSelected
                                ? 'bg-[#3B82F6] border border-[#3B82F6] text-white shadow-sm'
                                : 'bg-white border border-[#E5E7EB] text-[#0F1450] hover:border-[#3B82F6]/40'
                            }`}
                          >
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                              isCorrectSelection || isIncorrectSelection || isSelected ? 'bg-white' : 'border-[1.5px] border-[#9CA3AF]'
                            }`}>
                              {isCorrectSelection ? <Check className="w-2.5 h-2.5 text-[#16A34A] stroke-[3]" /> :
                                isIncorrectSelection ? <span className="text-[13px] font-bold text-[#DC2626]">×</span> :
                                  isSelected && <Check className="w-2.5 h-2.5 text-[#3B82F6] stroke-[3]" />}
                            </div>
                            <span className={`text-[14px] leading-[18px] flex-1 ${
                              isCorrectSelection ? 'font-bold text-[#166534]' :
                                isIncorrectSelection ? 'font-bold text-[#991B1B]' :
                                  isSelected ? 'font-bold text-white' : 'font-normal text-[#0F1450]'
                            }`}>
                              {optLabel}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {hasCheckedAnswer && (
                      <div className={`rounded-[10px] px-4 py-3 text-[13px] font-semibold ${
                        hasCorrectAnswer
                          ? 'border border-[#86EFAC] bg-[#F0FDF4] text-[#166534]'
                          : 'border border-[#FECACA] bg-[#FEF2F2] text-[#991B1B]'
                      }`} role="status">
                        {answerFeedback.message}
                      </div>
                    )}

                    {/* Action Button */}
                    <div className="flex justify-between items-center pt-2">
                      {currentMcqIndex > 0 ? (
                        <button
                          type="button"
                          onClick={() => {
                            setCurrentMcqIndex(prev => Math.max(0, prev - 1));
                          }}
                          disabled={isAccountBlocked}
                          className="px-5 py-2.5 bg-white border border-[#E5E7EB] text-[#0F1450] rounded-full font-['Outfit'] font-semibold text-[14px] hover:bg-gray-50 transition-colors cursor-pointer"
                        >
                          Previous Question
                        </button>
                      ) : (
                        <div />
                      )}

                      {currentMcqIndex < mcqList.length - 1 ? (
                        <button
                          type="button"
                          onClick={() => {
                            if (hasCorrectAnswer) {
                              setCurrentMcqIndex(prev => prev + 1);
                              return;
                            }
                            if (hasCheckedAnswer) {
                              clearMcqAnswerFeedback(mcq.id);
                              return;
                            }
                            if (currentAnswer !== undefined) {
                              checkMcqAnswer(mcq.id, currentAnswer);
                            }
                          }}
                          disabled={currentAnswer === undefined || isAccountBlocked || isCheckingMcqAnswer}
                          className="px-6 py-2.5 bg-[#3B82F6] text-white rounded-full font-['Outfit'] font-semibold text-[14px] hover:bg-[#2563EB] disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                        >
                          {hasCorrectAnswer ? 'Next Question' : isCheckingMcqAnswer ? 'Checking…' : hasCheckedAnswer ? 'Choose Another Answer' : 'Check Answer'}
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            if (!hasCorrectAnswer) {
                              if (hasCheckedAnswer) {
                                clearMcqAnswerFeedback(mcq.id);
                                return;
                              }
                              if (currentAnswer !== undefined) {
                                checkMcqAnswer(mcq.id, currentAnswer);
                              }
                              return;
                            }
                            const answers = mcqList.map((_, idx) => selectedAnswers[idx] ?? -1);
                            submitMcqs(answers);
                          }}
                          disabled={currentAnswer === undefined || isAccountBlocked || isCheckingMcqAnswer || (hasCorrectAnswer && !allAnswersCheckedCorrectly)}
                          className="px-6 py-2.5 bg-[#3B82F6] text-white rounded-full font-['Outfit'] font-semibold text-[14px] hover:bg-[#2563EB] disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                        >
                          {hasCorrectAnswer && allAnswersCheckedCorrectly
                            ? 'Submit Answers'
                            : isCheckingMcqAnswer ? 'Checking…' : hasCheckedAnswer ? 'Choose Another Answer' : 'Check Answer'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })()}

            </div>
          )}

          {/* Input Bar (Shown only during Chatting stage) */}
          {!step1Active && !replayingAvatarPassage && (!mcqList || mcqList.length === 0) && (
            <div className="reading-recorder flex flex-row items-center px-5 py-4 gap-3 bg-white border border-[#E5E7EB] rounded-2xl flex-shrink-0">
              {isRecording ? (
                <div className="flex-1 flex items-center justify-between px-4 py-2 bg-[#FEF1E8] border border-[#F97316]/30 rounded-[10px]">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 bg-[#F97316] rounded-full animate-pulse" />
                    <span className="text-[13px] font-semibold text-[#F97316]">
                      Recording... {recordTime}s
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={cancelRecording}
                      className="p-1.5 text-[#6E748F] hover:text-red-500 transition-colors rounded-full"
                      title="Cancel Recording"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button> 
                    <button 
                      onClick={handleStopRecording}
                      className="flex justify-center items-center w-8 h-8 bg-[#F97316] rounded-full text-white hover:bg-[#EA580C] transition-colors shadow-sm"
                      title="Send Recording"
                    >
                      <Square className="w-3.5 h-3.5 fill-current" />
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="min-w-0 flex-1 px-4 py-3 bg-white border border-[#E5E7EB] rounded-[10px]">
                    <p id="reading-recording-instruction" aria-live="polite" className="whitespace-normal break-words text-[14px] leading-5 text-[#6E748F]">
                      {isStartingRecording ? 'Opening microphone… Allow access if your browser asks.'
                        : recordingError ? recordingError
                        : isAccountBlocked ? 'Recording is unavailable for this account.'
                        : !modeSessionId ? 'Connecting to reading practice…'
                        : isProcessingRecording ? 'Checking recording…'
                        : isReconcilingAudio ? 'Restoring your previous recording…'
                        : isTyping ? 'Assessing your recording…'
                        : hasPendingAudio ? 'Retry or discard your previous recording before recording again.'
                        : cooldown ? 'Please wait…'
                        : 'Record the sentence (up to 3 minutes)…'}
                    </p>
                  </div>
                  <button
                    onClick={() => { if (avatar) { avatarPassage.pause(); stopAudio(); } startRecording(); }}
                    disabled={isStartingRecording || !modeSessionId || cooldown || isProcessingRecording || isTyping || isAccountBlocked || hasPendingAudio}
                    aria-label={isStartingRecording ? 'Opening microphone' : 'Record your reading response'}
                    aria-busy={isStartingRecording}
                    aria-describedby="reading-recording-instruction"
                    className="flex shrink-0 justify-center items-center w-11 h-11 bg-white border border-[#5C9DFF] rounded-full text-[#5C9DFF] hover:bg-[#EFF6FF] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isStartingRecording ? <LoaderCircle className="w-5 h-5 animate-spin" aria-hidden="true" /> : <Mic className="w-5 h-5" />}
                  </button>
                  {isStartingRecording && <button type="button" onClick={cancelRecording} className="text-sm font-semibold text-[#475569]" aria-label="Cancel microphone startup">Cancel</button>}
                </>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
