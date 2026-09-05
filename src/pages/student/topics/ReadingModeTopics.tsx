import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { BarChart3, ChevronLeft, Mic, Square, Trash2, Check, MessageCircle, Pause, Play, LoaderCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import { useModeSession } from '@/hooks/useModeSession';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';
import ReadingPassageCard from '@/components/ui/ReadingPassageCard';
import TopicCompletionModal from '@/components/ui/TopicCompletionModal';
import FeedbackModal from '@/components/ui/FeedbackModal';
import { ContentPolicyWarningModal } from '@/components/ui/ContentPolicyWarningModal';
import { useLearningProgressRefresh } from '@/hooks/useLearningProgressRefresh';
import { useAudioPlayback } from '@/hooks/useAudioPlayback';
import SpeechAssessmentModal, { isSpeechAssessment, SpeechAssessment } from '@/components/ui/SpeechAssessmentModal';
import ReactMarkdown from 'react-markdown';

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

export default function ReadingModeTopics() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const lessonModeId = searchParams.get('modeId') || '';
  const lessonId = searchParams.get('lessonId') || '';
  const courseId = searchParams.get('courseId') || undefined;
  const unitId = searchParams.get('unitId') || undefined;
  const refreshLearningProgress = useLearningProgressRefresh();
  
  const { playingAudioId, isCurrentlyPlaying, loadingAudioId, toggleAudio, stopAudio } = useAudioPlayback();
  const [currentMcqIndex, setCurrentMcqIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number | string>>({});
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [isJustCompleted, setIsJustCompleted] = useState(false);
  const [activeFeedback, setActiveFeedback] = useState<string | null>(null);
  const [activeAssessment, setActiveAssessment] = useState<SpeechAssessment | null>(null);
  const [isPassageExpanded, setIsPassageExpanded] = useState(false);
  const [isStepsExpanded, setIsStepsExpanded] = useState(false);
  const [fallbackSpeechMessageId, setFallbackSpeechMessageId] = useState<string | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const fallbackSpeechRef = useRef<SpeechSynthesisUtterance | null>(null);

  const {
    isRecording,
    recordTime,
    startRecording,
    stopRecording,
    cancelRecording
  } = useAudioRecorder();

  const {
    chatHistory,
    contentPayload,
    mcqList,
    readingProgress,
    isTyping,
    isCompleted,
    isAccountBlocked,
    sessionStatus,
    isContentFilterWarningOpen,
    setIsContentFilterWarningOpen,
    contentFilterWarningData,
    sendAudio,
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


  const [cooldown, setCooldown] = useState(false);

  const handleStopRecording = async () => {
    if (cooldown || isTyping || isAccountBlocked) return;
    const res = await stopRecording();
    if (res) {
      sendAudio(res.audioBase64, res.format, res.audioUrl);
      triggerCooldown();
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

  const toggleInitialReadingPromptSpeech = (messageId: string, content: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      toast.error('Audio playback is not available in this browser.');
      return;
    }

    if (fallbackSpeechMessageId === messageId) {
      window.speechSynthesis.cancel();
      setFallbackSpeechMessageId(null);
      return;
    }

    stopAudio();
    window.speechSynthesis.cancel();

    // Read the sentence itself, rather than the surrounding instruction.
    const sentence = content.match(/"([^"\n]+)"/)?.[1] || content;
    const utterance = new SpeechSynthesisUtterance(sentence);
    utterance.onend = () => setFallbackSpeechMessageId(null);
    utterance.onerror = () => setFallbackSpeechMessageId(null);
    fallbackSpeechRef.current = utterance;
    setFallbackSpeechMessageId(messageId);
    window.speechSynthesis.speak(utterance);
  };

  const getProgressPercentage = () => {
    if (isCompleted) return 100;

    const baseProgress = (isPassageExpanded || readingProgress?.isRetrying || readingProgress?.phase === 'quiz') ? 15 : 0;

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
    isPassageExpanded ||
    readingProgress?.isRetrying ||
    readingProgress?.phase === 'quiz' ||
    isCompleted,
  );
  const step1Completed = initialPassComplete;
  const step1Active = !step1Completed;
  const step2Completed = (mcqList && mcqList.length > 0) || isCompleted;
  const step2Active = step1Completed && !step2Completed;
  const step3Completed = isCompleted;
  const step3Active = step2Completed && !step3Completed;
  const progressLabel = readingProgress?.isRetrying
    ? 'Reviewing marked sentences'
    : `${getProgressPercentage()}% Complete`;

  const isChatActive = !step1Active && (!mcqList || mcqList.length === 0);

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
          setIsPassageExpanded(false);
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
        onClose={() => setActiveFeedback(null)}
      />
      <SpeechAssessmentModal
        assessment={activeAssessment}
        open={!!activeAssessment}
        onClose={() => setActiveAssessment(null)}
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
          
          <div className="flex-1 flex justify-center">
            <h1 className="text-[20px] font-bold leading-[20px] tracking-[-0.3px] text-[#282828]">
              Reading Mode
            </h1>
          </div>
          
          <div className="flex-1 flex justify-end items-center gap-3">
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

        {/* Workspace Main */}
        <div className={`flex flex-col flex-1 gap-4 min-h-0 pr-1 ${(isChatActive || step1Active) ? '' : 'overflow-y-auto'}`}>
          
          {/* Reading Passage Card */}
          {contentPayload && (contentPayload.passage || contentPayload.content || (contentPayload.sentences && contentPayload.sentences.length > 0)) && (
            <div className={`flex flex-col gap-4 min-h-0 ${step1Active ? 'flex-1' : 'flex-shrink-0'}`}>
              <ReadingPassageCard 
                content={contentPayload.passage || contentPayload.content || (contentPayload.sentences ? contentPayload.sentences.join('\n\n') : '')}
                audioUrl={contentPayload.contentAudioUrl || contentPayload.narrationAudioUrl || contentPayload.attachmentUrl}
                readingPresentation={contentPayload.readingPresentation}
                isPlaying={playingAudioId === 'reading-passage' && isCurrentlyPlaying}
                onToggleAudio={() =>
                  toggleAudio(
                    'reading-passage',
                    contentPayload.contentAudioUrl || contentPayload.narrationAudioUrl || contentPayload.attachmentUrl,
                  )
                }
                onExpand={() => setIsPassageExpanded(true)}
                forceExpanded={step1Active}
                collapsibleMode="accordion"
              />
              {step1Active && (
                <div className="flex justify-end w-full pb-2 flex-shrink-0">
                  <button
                    onClick={() => {
                      stopAudio();
                      setIsPassageExpanded(true);
                    }}
                    className="px-6 py-2.5 bg-[#3B82F6] text-white rounded-full font-['Outfit'] font-semibold text-[14px] hover:bg-[#2563EB] transition-colors shadow-sm"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Chat History Area (Shown during Chatting stage, hidden during Quiz stage to prevent squishing) */}
          {!step1Active && (!mcqList || mcqList.length === 0) && (
            <div 
              ref={chatContainerRef}
              className="flex flex-col p-5 px-6 gap-3 flex-1 min-h-[150px] bg-[#F8F9FA] rounded-2xl overflow-y-auto"
            >
              <div className="w-full bg-[#EFF6FF] border border-[#BFDBFE] rounded-xl px-4 py-3 flex items-start gap-3 text-[#1E40AF] text-[13px] leading-relaxed font-medium shadow-sm flex-shrink-0">
                <span className="text-lg leading-none">📖</span>
                <div>
                  <strong className="block text-[#1E3A8A] font-semibold text-[13px]">Practice Reading</strong>
                  Read each sentence from the passage aloud using the microphone.
                </div>
              </div>
              {chatHistory.map((msg, index) => (
                (() => {
                  const hasInitialReadingFallback =
                    msg.role === 'assistant' &&
                    !msg.audioUrl &&
                    index === 0 &&
                    msg.content.startsWith('Please read the following sentence aloud:');
                  const isFallbackSpeechPlaying = fallbackSpeechMessageId === msg.id;

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
                    <div className="text-[13px] leading-[18px] text-[#0F1450] whitespace-pre-wrap break-words">
                      <ReactMarkdown
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
                      </ReactMarkdown>
                    </div>
                  {msg.role === 'user' && msg.audioUrl && (
                    <div className="mt-3 flex items-center justify-end gap-4 border-t border-[#BFDBFE] pt-2.5">
                      <button
                        type="button"
                        onClick={() => toggleAudio(msg.id, msg.audioUrl || undefined)}
                        className="flex items-center text-[#0F1450] hover:text-[#2563EB] transition-colors"
                        aria-label={playingAudioId === msg.id && isCurrentlyPlaying ? 'Pause your recording' : 'Play your recording'}
                      >
                        {loadingAudioId === msg.id ? (
                          <LoaderCircle className="w-5 h-5 animate-spin" />
                        ) : playingAudioId === msg.id && isCurrentlyPlaying ? (
                          <Pause className="w-5 h-5" />
                        ) : (
                          <Play className="w-5 h-5" />
                        )}
                      </button>
                      {isSpeechAssessment(msg.assessments) && (
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
                  {msg.role === 'assistant' && (msg.audioUrl || msg.feedback || hasInitialReadingFallback) && (
                    <div className="mt-3 flex items-center gap-4 border-t border-[#E5E7EB] pt-2.5">
                      {(msg.audioUrl || hasInitialReadingFallback) && (
                        <button
                          type="button"
                          onClick={() => msg.audioUrl
                            ? toggleAudio(msg.id, msg.audioUrl)
                            : toggleInitialReadingPromptSpeech(msg.id, msg.content)}
                          className="flex items-center text-[#0F1450] hover:text-[#5C9DFF] transition-colors"
                          aria-label={
                            (msg.audioUrl && playingAudioId === msg.id && isCurrentlyPlaying) || isFallbackSpeechPlaying
                              ? 'Pause AI response'
                              : 'Play AI response'
                          }
                        >
                          {loadingAudioId === msg.id ? (
                            <LoaderCircle className="w-5 h-5 animate-spin" />
                          ) : (msg.audioUrl && playingAudioId === msg.id && isCurrentlyPlaying) || isFallbackSpeechPlaying ? (
                            <Pause className="w-5 h-5" />
                          ) : (
                            <Play className="w-5 h-5" />
                          )}
                        </button>
                      )}
                      {msg.feedback && (
                        <button
                          type="button"
                          onClick={() => setActiveFeedback(msg.feedback || null)}
                          className="flex items-center gap-1.5 text-[#5C9DFF] hover:text-[#4A8BEB] transition-colors font-semibold text-[12px] leading-[15px]"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>View Feedback</span>
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
                          type="button"
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

          {/* Input Bar (Shown only during Chatting stage) */}
          {!step1Active && (!mcqList || mcqList.length === 0) && (
            <div className="flex flex-row items-center px-5 py-4 gap-3 bg-white border border-[#E5E7EB] rounded-2xl flex-shrink-0">
              {isRecording ? (
                <div className="flex-1 flex items-center justify-between px-4 py-2 bg-[#FEF1E8] border border-[#F97316]/30 rounded-[10px]">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 bg-[#F97316] rounded-full animate-pulse" />
                    <span className="text-[13px] font-semibold text-[#F97316]">
                      Recording... {Math.floor(recordTime / 60)}:{(recordTime % 60).toString().padStart(2, '0')}
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
                  <input
                    type="text"
                    placeholder={cooldown ? "Please wait..." : "Record the displayed sentence aloud..."}
                    value=""
                    readOnly
                    aria-label="Reading responses must be recorded with the microphone"
                    className="flex-1 px-4 py-3 bg-white border border-[#E5E7EB] rounded-[10px] text-[14px] text-[#282828] placeholder-[#6E748F]/60 focus:outline-none focus:border-[#5C9DFF] focus:ring-1 focus:ring-[#5C9DFF] transition-all"
                  />
                  <button
                    onClick={startRecording}
                    disabled={cooldown || isTyping || isAccountBlocked}
                    className="flex justify-center items-center w-11 h-11 bg-white border border-[#5C9DFF] rounded-full text-[#5C9DFF] hover:bg-[#EFF6FF] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Mic className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
