import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronLeft, Clock, Check, Pause, Play, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import { useModeSession } from '@/hooks/useModeSession';
import TopicCompletionModal from '@/components/ui/TopicCompletionModal';
import { ContentPolicyWarningModal } from '@/components/ui/ContentPolicyWarningModal';
import { useLearningProgressRefresh } from '@/hooks/useLearningProgressRefresh';
import { useAudioPlayback } from '@/hooks/useAudioPlayback';
import AudioPlayer from '../AudioPlayer';

function isOptionCorrect(mcq: any, answer: number | string | undefined) {
  if (answer === undefined || answer === null || answer === -1) {
    return false;
  }

  if (typeof mcq.correct === 'number') {
    return Number(answer) === mcq.correct;
  }

  if (typeof mcq.correct === 'string') {
    if (String(answer) === mcq.correct) {
      return true;
    }
    const index = Number(answer);
    if (!isNaN(index) && Array.isArray(mcq.options) && typeof mcq.options[index] === 'string') {
      return mcq.options[index] === mcq.correct;
    }
    if (!isNaN(index) && Array.isArray(mcq.options) && typeof mcq.options[index] === 'object') {
      return (
        mcq.options[index]?.text === mcq.correct ||
        mcq.options[index]?.label === mcq.correct ||
        mcq.options[index]?.id === mcq.correct
      );
    }
    return false;
  }

  if (mcq.correctOptionId) {
    return String(answer) === String(mcq.correctOptionId);
  }

  if (Array.isArray(mcq.options)) {
    const index = Number(answer);
    if (!isNaN(index) && mcq.options[index]?.isCorrect !== undefined) {
      return Boolean(mcq.options[index].isCorrect);
    }
    const found = mcq.options.find((o: any) => o.id === answer || o.value === answer);
    if (found?.isCorrect !== undefined) {
      return Boolean(found.isCorrect);
    }
  }

  return true;
}

export default function ListeningModeTopics() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const lessonModeId = searchParams.get('modeId') || '';
  const lessonId = searchParams.get('lessonId') || '';
  const courseId = searchParams.get('courseId') || undefined;
  const unitId = searchParams.get('unitId') || undefined;
  const refreshLearningProgress = useLearningProgressRefresh();
  const { 
    isCurrentlyPlaying: isTopicPlaying, 
    loadingAudioId: topicLoadingId, 
    audioProgress: topicProgress, 
    audioDuration: topicDuration, 
    toggleAudio: toggleTopic,
    pauseAudio: pauseTopic
  } = useAudioPlayback();

  const [currentMcqIndex, setCurrentMcqIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number | string>>({});
  const [isStepsExpanded, setIsStepsExpanded] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [hasListenedToAudio, setHasListenedToAudio] = useState(false);
  const [hasStartedAudio, setHasStartedAudio] = useState(false);
  const [isJustCompleted, setIsJustCompleted] = useState(false);
  const [isNarratorTextPlaying, setIsNarratorTextPlaying] = useState(false);
  const narratorSpeechRef = useRef<SpeechSynthesisUtterance | null>(null);
  
  const {
    modeSessionId,
    listeningPayload,
    mcqList,
    mcqResult,
    isCompleted,
    isAccountBlocked,
    sessionStatus,
    isContentFilterWarningOpen,
    setIsContentFilterWarningOpen,
    contentFilterWarningData,
    startListening,
    nextListeningStage,
    submitMcqs,
    restartSession
  } = useModeSession({ 
    lessonModeId,
    onCompleted: async () => {
      await refreshLearningProgress(lessonId, { courseId, unitId });
      setIsJustCompleted(true);
      setShowCompletionModal(true);
    }
  });

  useEffect(() => {
    if (isCompleted && !isJustCompleted) {
      setShowCompletionModal(true);
    }
  }, [isCompleted, isJustCompleted]);

  const hasStartedRef = useRef(false);

  useEffect(() => {
    if (modeSessionId && !listeningPayload && !hasStartedRef.current) {
      hasStartedRef.current = true;
      startListening();
    }
  }, [modeSessionId, listeningPayload, startListening]);

  useEffect(() => {
    // A full topic-audio play is required at both listening stages. Entering
    // the question stage deliberately resets this so the learner completes a
    // second listen before the quiz can be unlocked.
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      narratorSpeechRef.current = null;
      setIsNarratorTextPlaying(false);
    }
    if (
      listeningPayload?.stage === 'initial' ||
      listeningPayload?.stage === 'question'
    ) {
      setHasListenedToAudio(false);
      setHasStartedAudio(false);
    }
  }, [listeningPayload?.stage]);

  useEffect(() => {
    setCurrentMcqIndex(0);
    setSelectedAnswers({});
  }, [listeningPayload?.stage, mcqList]);

  useEffect(() => {
    if (!mcqResult || mcqResult.passed) return;
    setCurrentMcqIndex(0);
    setSelectedAnswers({});
  }, [mcqResult]);

  useEffect(() => {
    if (isTopicPlaying || topicLoadingId) {
      setHasStartedAudio(true);
    }
  }, [isTopicPlaying, topicLoadingId]);

  useEffect(() => {
    if (modeSessionId) {
      hasStartedRef.current = false;
    }
  }, [modeSessionId]);

  useEffect(() => () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }, []);



  const getProgressPercentage = () => {
    if (isCompleted) return 100;
    if (listeningPayload?.stage === 'quiz' && mcqList && mcqList.length > 0) {
      const quizProgress = Math.floor((currentMcqIndex / mcqList.length) * 50);
      return Math.min(99, 50 + quizProgress);
    }
    if (listeningPayload?.stage === 'question') return 25;
    if (listeningPayload?.stage === 'transcript') return 75;
    if (listeningPayload?.stage === 'initial') return hasListenedToAudio ? 25 : 0;
    return 0;
  };

  const isQuestionStage = listeningPayload?.stage === 'question';
  const isTranscriptStage = listeningPayload?.stage === 'transcript';
  const topicAudioUrl = listeningPayload?.kbAudioUrl;
  const narratorText = isTranscriptStage
    ? listeningPayload?.transcript
    : isQuestionStage ? listeningPayload?.questionText : listeningPayload?.narrationText;
  const isRequiredListeningStage =
    listeningPayload?.stage === 'initial' || isQuestionStage;
  const nextStageUnlocked = isTranscriptStage || hasListenedToAudio;
  const listenNumber = isQuestionStage ? 2 : 1;
  const topicAudioTitle = isQuestionStage
    ? 'Listen Again (2 of 2)'
    : listeningPayload?.stage === 'initial'
      ? 'First Listen (1 of 2)'
      : 'Topic Audio';

  const toggleNarratorTextSpeech = () => {
    if (!narratorText) return;

    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      toast.error('Narrator text playback is not available in this browser.');
      return;
    }

    if (isNarratorTextPlaying) {
      window.speechSynthesis.cancel();
      narratorSpeechRef.current = null;
      setIsNarratorTextPlaying(false);
      return;
    }

    pauseTopic();
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(narratorText);
    utterance.lang = 'en-US';
    utterance.rate = 0.9;
    utterance.onend = () => {
      narratorSpeechRef.current = null;
      setIsNarratorTextPlaying(false);
    };
    utterance.onerror = () => {
      narratorSpeechRef.current = null;
      setIsNarratorTextPlaying(false);
    };
    narratorSpeechRef.current = utterance;
    setIsNarratorTextPlaying(true);
    window.speechSynthesis.speak(utterance);
  };

  const stopNarratorTextSpeech = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    narratorSpeechRef.current = null;
    setIsNarratorTextPlaying(false);
  };

  return (
    <div className="w-full max-w-[1207px] mx-auto bg-white rounded-none md:rounded-[24px] flex flex-col font-['Outfit',sans-serif] overflow-hidden h-[100dvh] md:h-[794px] max-h-[calc(100vh-40px)] border border-gray-100 shadow-sm relative">
      
      <TopicCompletionModal 
        isOpen={showCompletionModal}
        isJustCompleted={isJustCompleted}
        onFinish={() => {
          setShowCompletionModal(false);
          navigate(-1);
        }}
        onRetake={() => {
          setShowCompletionModal(false);
          setCurrentMcqIndex(0);
          setSelectedAnswers({});
          setHasListenedToAudio(false);
          setHasStartedAudio(false);
          setIsJustCompleted(false);
          restartSession();
        }}
      />

      <ContentPolicyWarningModal
        open={isContentFilterWarningOpen}
        data={contentFilterWarningData}
        onAcknowledge={() => setIsContentFilterWarningOpen(false)}
      />

      {/* Header Progress Group */}
      <div className="flex flex-col gap-2.5 pb-3">
        
        {/* Top Bar */}
        <div className="flex flex-row justify-between items-center px-4 md:px-6 py-4 bg-white border-b border-[#E5E7EB]">
          
          <div className="flex-1 flex justify-start">
            <button 
              onClick={() => navigate(-1)}
              className="flex justify-center items-center w-10 h-10 bg-white border border-[#E5E7EB] shadow-[0px_1px_4px_rgba(0,0,0,0.06)] rounded-full hover:bg-gray-50 transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-[#282828]" />
            </button>
          </div>
          
          <div className="flex-1 flex justify-center items-center gap-4">
            <h1 className="text-[20px] font-bold leading-[20px] tracking-[-0.3px] text-[#282828]">
              Listening Mode
            </h1>
          </div>
          
          <div className="flex-1 flex justify-end items-center gap-3">
            {sessionStatus.remainingSeconds !== null && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#F97316]/30 rounded-full">
                <Clock className="w-3.5 h-3.5 text-[#F97316]" />
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
            {getProgressPercentage()}% Complete
          </span>
        </div>
      </div>

      {/* Main Split Content */}
      <div className="flex flex-col md:flex-row px-4 md:px-8 gap-4 flex-1 min-h-0 pb-6">
        
        {/* Mode Sidebar */}
        <div className="flex flex-col py-3 md:py-4 w-full md:w-[220px] bg-white border border-[#E5E7EB] rounded-[10px] flex-shrink-0">
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
          
          {/* Step 1: Audio Narration */}
          <div className={`relative flex flex-row items-center p-[14px_14px_14px_13px] gap-2.5 ${
            listeningPayload?.stage === 'initial' && !isCompleted ? 'bg-[#5C9DFF]/10' : ''
          }`}>
            {listeningPayload?.stage === 'initial' && !isCompleted && (
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[40px] bg-[#5C9DFF] rounded-[2px]" />
            )}
            <div className={`flex justify-center items-center w-7 h-7 rounded-full font-bold text-[12px] ${
              (listeningPayload?.stage && listeningPayload.stage !== 'initial') || isCompleted ? 'bg-[#2DCD6B] text-white' : (hasStartedAudio ? 'bg-[#5C9DFF] text-white' : 'bg-[#E5E7EB] text-[#6E748F]')
            }`}>
              1
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="font-semibold text-[13px] leading-[16px] text-[#0F1450]">Audio Narration</span>
              <span className={`text-[11px] leading-[14px] font-medium ${
                (listeningPayload?.stage && listeningPayload.stage !== 'initial') || isCompleted ? 'text-[#2DCD6B]' : (hasStartedAudio ? 'text-[#5C9DFF]' : 'text-[#6E748F]')
              }`}>
                {(listeningPayload?.stage && listeningPayload.stage !== 'initial') || isCompleted ? 'Completed' : (hasStartedAudio ? 'In Progress' : 'Pending')}
              </span>
            </div>
          </div>
          <div className="w-full h-[1px] bg-[#E5E7EB]/70" />

          {/* Step 2: Comprehension Question */}
          <div className={`relative flex flex-row items-center p-[14px_14px_14px_13px] gap-2.5 ${
            listeningPayload?.stage === 'question' && !isCompleted ? 'bg-[#5C9DFF]/10' : ''
          }`}>
            {listeningPayload?.stage === 'question' && !isCompleted && (
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[40px] bg-[#5C9DFF] rounded-[2px]" />
            )}
            <div className={`flex justify-center items-center w-7 h-7 rounded-full font-bold text-[12px] ${
              listeningPayload?.stage === 'quiz' || isCompleted ? 'bg-[#2DCD6B] text-white' : (listeningPayload?.stage === 'question' ? 'bg-[#5C9DFF] text-white' : 'bg-[#E5E7EB] text-[#6E748F]')
            }`}>
              2
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="font-semibold text-[13px] leading-[16px] text-[#0F1450]">Comprehension Question</span>
              <span className={`text-[11px] leading-[14px] font-medium ${
                listeningPayload?.stage === 'quiz' || isCompleted ? 'text-[#2DCD6B]' : (listeningPayload?.stage === 'question' ? 'text-[#5C9DFF]' : 'text-[#6E748F]')
              }`}>
                {listeningPayload?.stage === 'quiz' || isCompleted ? 'Completed' : (listeningPayload?.stage === 'question' ? 'In Progress' : 'Pending')}
              </span>
            </div>
          </div>
          <div className="w-full h-[1px] bg-[#E5E7EB]/70" />

          {/* Step 3: Listening Quiz */}
          <div className={`relative flex flex-row items-center p-[14px_14px_14px_13px] gap-2.5 ${
            listeningPayload?.stage === 'quiz' && !isCompleted ? 'bg-[#5C9DFF]/10' : ''
          }`}>
            {listeningPayload?.stage === 'quiz' && !isCompleted && (
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[40px] bg-[#5C9DFF] rounded-[2px]" />
            )}
            <div className={`flex justify-center items-center w-7 h-7 rounded-full font-bold text-[12px] ${
              isCompleted ? 'bg-[#2DCD6B] text-white' : (listeningPayload?.stage === 'quiz' ? 'bg-[#5C9DFF] text-white' : 'bg-[#E5E7EB] text-[#6E748F]')
            }`}>
              3
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="font-semibold text-[13px] leading-[16px] text-[#0F1450]">Listening Quiz</span>
              <span className={`text-[11px] leading-[14px] font-medium ${
                isCompleted ? 'text-[#2DCD6B]' : (listeningPayload?.stage === 'quiz' ? 'text-[#5C9DFF]' : 'text-[#6E748F]')
              }`}>
                {isCompleted ? 'Completed' : (listeningPayload?.stage === 'quiz' ? 'In Progress' : 'Pending')}
              </span>
            </div>
          </div>
          <div className="w-full h-[1px] bg-[#E5E7EB]/70" />
          </div>

        </div>

        {/* Workspace Main */}
        <div className="flex flex-col flex-1 gap-4 min-h-0 overflow-y-auto">
          
          {/* Audio Player Card */}
          {topicAudioUrl && listeningPayload?.stage !== 'quiz' && (
            <div className="flex flex-col p-4 px-5 gap-3.5 bg-white border-2 border-[#5C9DFF] rounded-xl">
              <div className="flex flex-row justify-between items-center w-full">
                <span className="font-bold text-[14px] leading-[18px] text-[#5C9DFF]">
                  {topicAudioTitle}
                </span>
              </div>
              <AudioPlayer
                audioSrc={topicAudioUrl}
                isPlaying={isTopicPlaying}
                isLoading={!!topicLoadingId}
                progress={topicProgress}
                duration={topicDuration}
                onTogglePlay={() => {
                  stopNarratorTextSpeech();
                  toggleTopic('listening_topic_audio', topicAudioUrl, () => setHasListenedToAudio(true));
                }}
                variant="gradient"
                className="max-w-full"
                showTotal={true}
              />
              {isRequiredListeningStage && (
                <p className="text-[12px] leading-[16px] font-medium text-[#6E748F]">
                  {hasListenedToAudio
                    ? `Listen ${listenNumber} of 2 complete. You can continue.`
                    : `Finish listen ${listenNumber} of 2 to unlock the next step.`}
                </p>
              )}
            </div>
          )}
          
          {/* The backend exposes a transcript only at its approved retry stage. */}
          {narratorText && listeningPayload?.stage !== 'quiz' && (
            <div className="flex flex-col p-5 px-6 gap-2 flex-1 bg-[#F8F9FA] rounded-2xl">
              <div className="flex items-center gap-1.5 mb-1">
                <div className="w-2 h-2 bg-[#5C9DFF] rounded-full" />
                <span className="font-semibold text-[12px] leading-[15px] text-[#6E748F]">{isTranscriptStage ? 'Transcript for retry' : 'Narrator'}</span>
              </div>
              
              <div className="p-3.5 px-4 bg-white border-[1.5px] border-[#DBEAFE] shadow-[0px_2px_8px_rgba(0,0,0,0.06)] rounded-tr-xl rounded-br-xl rounded-bl-xl rounded-tl-sm w-full">
                <p className="font-normal text-[14px] leading-[22px] text-[#0F1450]">
                  {narratorText}
                </p>
                <button
                  type="button"
                  onClick={toggleNarratorTextSpeech}
                  aria-label={isNarratorTextPlaying ? 'Pause narrator text' : 'Play narrator text'}
                  className="mt-3 flex items-center text-[#0F1450] transition-colors hover:text-[#2563EB]"
                >
                  {isNarratorTextPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                </button>
            </div>
              </div>
          )}

          {/* MCQs Area (Figma Spec) */}
          {listeningPayload?.stage === 'quiz' && mcqList && mcqList.length > 0 && (
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

                        return (
                          <div
                            key={oIdx}
                            onClick={() => setSelectedAnswers(prev => ({ ...prev, [currentMcqIndex]: optVal }))}
                            className={`w-full p-[14px_16px] rounded-[10px] flex flex-row items-center gap-3 cursor-pointer transition-all ${
                              isSelected
                                ? 'bg-[#3B82F6] border border-[#3B82F6] text-white shadow-sm'
                                : 'bg-white border border-[#E5E7EB] text-[#0F1450] hover:border-[#3B82F6]/40'
                            }`}
                          >
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                              isSelected ? 'bg-white' : 'border-[1.5px] border-[#9CA3AF]'
                            }`}>
                              {isSelected && <Check className="w-2.5 h-2.5 text-[#3B82F6] stroke-[3]" />}
                            </div>
                            <span className={`text-[14px] leading-[18px] flex-1 ${isSelected ? 'font-bold text-white' : 'font-normal text-[#0F1450]'}`}>
                              {optLabel}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Action Button */}
                    <div className="flex justify-end pt-2">
                      {currentMcqIndex < mcqList.length - 1 ? (
                        <button
                          onClick={() => {
                            const isCorrect = isOptionCorrect(mcq, currentAnswer);
                            if (!isCorrect) {
                              toast.error('Incorrect answer. Please try again.');
                              return;
                            }
                            setCurrentMcqIndex(prev => prev + 1);
                          }}
                          disabled={currentAnswer === undefined || isAccountBlocked}
                          className="px-6 py-2.5 bg-[#3B82F6] text-white rounded-full font-['Outfit'] font-semibold text-[14px] hover:bg-[#2563EB] disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                        >
                          Next Question
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            const isCorrect = isOptionCorrect(mcq, currentAnswer);
                            if (!isCorrect) {
                              toast.error('Incorrect answer. Please try again.');
                              return;
                            }
                            const answers = mcqList.map((_, idx) => selectedAnswers[idx] ?? -1);
                            submitMcqs(answers);
                          }}
                          disabled={Object.keys(selectedAnswers).length < mcqList.length || isAccountBlocked}
                          className="px-6 py-2.5 bg-[#3B82F6] text-white rounded-full font-['Outfit'] font-semibold text-[14px] hover:bg-[#2563EB] disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                        >
                          Submit Answers
                        </button>
                      )}
                    </div>
                  </div>
                );
              })()}

            </div>
          )}
          
          {/* The server decides which listening stage comes next, including retry. */}
          {listeningPayload?.stage && listeningPayload.stage !== 'quiz' && listeningPayload.stage !== 'completed' && (
            <div className="flex justify-center items-center pt-2 mt-auto">
              {nextStageUnlocked ? (
                <button
                  onClick={() => nextListeningStage()}
                  disabled={isAccountBlocked}
                  className="flex justify-center items-center w-full max-w-[200px] h-[52px] bg-[#3B82F6] hover:bg-[#2563EB] disabled:bg-[#E5E7EB] disabled:text-[#9CA3AF] transition-colors rounded-full font-bold text-[16px] leading-[20px] text-white"
                >
                  {isTranscriptStage ? 'Try Quiz Again' : 'Next'}
                </button>
              ) : (
                <p className="text-center text-[13px] font-semibold text-[#6E748F]">
                  Finish the audio to continue.
                </p>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
