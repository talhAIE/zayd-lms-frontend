import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { BarChart3, ChevronLeft, Mic, Clock, Lightbulb, MessageCircle, Send, Square, Trash2, Pause, Play, LoaderCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { useModeSession } from '@/hooks/useModeSession';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';
import TopicCompletionModal from '@/components/ui/TopicCompletionModal';
import ReadingPassageCard from '@/components/ui/ReadingPassageCard';
import FeedbackModal from '@/components/ui/FeedbackModal';
import { ContentPolicyWarningModal } from '@/components/ui/ContentPolicyWarningModal';
import { useLearningProgressRefresh } from '@/hooks/useLearningProgressRefresh';
import ReactMarkdown from 'react-markdown';
import { useAudioPlayback } from '@/hooks/useAudioPlayback';
import SpeechAssessmentModal, { isSpeechAssessment, SpeechAssessment } from '@/components/ui/SpeechAssessmentModal';

export default function RolePlayModeTopics() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const lessonModeId = searchParams.get('modeId') || '';
  const lessonId = searchParams.get('lessonId') || '';
  const courseId = searchParams.get('courseId') || undefined;
  const unitId = searchParams.get('unitId') || undefined;
  const refreshLearningProgress = useLearningProgressRefresh();
  const { playingAudioId, isCurrentlyPlaying, loadingAudioId, toggleAudio, stopAudio } = useAudioPlayback();
  
  const [inputValue, setInputValue] = useState('');
  const [isScenarioExpanded, setIsScenarioExpanded] = useState(false);
  const [isStepsExpanded, setIsStepsExpanded] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [isJustCompleted, setIsJustCompleted] = useState(false);
  const [activeFeedback, setActiveFeedback] = useState<string | null>(null);
  const [activeAssessment, setActiveAssessment] = useState<SpeechAssessment | null>(null);
  const [hintOpenForMessageId, setHintOpenForMessageId] = useState<string | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

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
    roleplayProgress,
    isTyping,
    isCompleted,
    isAccountBlocked,
    sessionStatus,
    isContentFilterWarningOpen,
    setIsContentFilterWarningOpen,
    contentFilterWarningData,
    sendMessage,
    sendAudio,
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

  const step1Completed = isScenarioExpanded || (chatHistory && chatHistory.some(m => m.role === 'user'));
  const step1Active = !step1Completed;

  const [cooldown, setCooldown] = useState(false);

  const triggerCooldown = () => {
    setCooldown(true);
    setTimeout(() => {
      setCooldown(false);
    }, 2000);
  };

  const handleSend = () => {
    if (!inputValue.trim() || cooldown || isTyping || isAccountBlocked) return;
    sendMessage(inputValue);
    setInputValue('');
    triggerCooldown();
  };

  const handleStopRecording = async () => {
    if (cooldown || isTyping || isAccountBlocked) return;
    const res = await stopRecording();
    if (res) {
      sendAudio(res.audioBase64, res.format, res.audioUrl);
      triggerCooldown();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory, isTyping]);

  const getProgressPercentage = () => {
    if (isCompleted) return 100;
    if (!roleplayProgress || roleplayProgress.requiredTurns <= 0) return 0;
    return Math.min(99, Math.round((roleplayProgress.completedTurns / roleplayProgress.requiredTurns) * 100));
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
          setIsScenarioExpanded(false);
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
          
          <div className="flex-1 flex justify-center items-center gap-4">
            <h1 className="text-[20px] font-bold leading-[20px] tracking-[-0.3px] text-[#282828]">
              Roleplay Mode
            </h1>
          </div>
          
          <div className="flex-1 flex justify-end items-center gap-3">
            {sessionStatus.remainingSeconds !== null && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FEF1E8] rounded-full">
                <Clock className="w-3.5 h-3.5 text-[#F97316]" />
                <span className="font-semibold text-[13px] leading-[16px] text-[#F97316]">
                  {Math.floor(sessionStatus.remainingSeconds / 60)}:{(sessionStatus.remainingSeconds % 60).toString().padStart(2, '0')}
                </span>
              </div>
            )}
          </div>
          <div className="flex-1 flex justify-end items-center gap-2">
            {/* Optional placeholders */}
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
            {roleplayProgress
              ? `${roleplayProgress.completedTurns}/${roleplayProgress.requiredTurns} meaningful turns · ${roleplayProgress.remainingTurns} remaining`
              : `${getProgressPercentage()}% Complete`}
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
          
          {/* Step 1: Roleplay Scenario */}
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
              <span className="font-semibold text-[13px] leading-[16px] text-[#0F1450]">Roleplay Scenario</span>
              <span className={`text-[11px] leading-[14px] font-medium ${
                step1Completed ? 'text-[#2DCD6B]' : 'text-[#5C9DFF]'
              }`}>
                {step1Completed ? 'Completed' : 'In Progress'}
              </span>
            </div>
          </div>
          <div className="w-full h-[1px] bg-[#E5E7EB]/70" />

          {/* Step 2: Conversation Practice */}
          <div className={`relative flex flex-row items-center p-[14px_14px_14px_13px] gap-2.5 ${
            !step1Active && !isCompleted ? 'bg-[#5C9DFF]/10' : ''
          }`}>
            {!step1Active && !isCompleted && (
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[40px] bg-[#5C9DFF] rounded-[2px]" />
            )}
            <div className={`flex justify-center items-center w-7 h-7 rounded-full font-bold text-[12px] ${
              isCompleted 
                ? 'bg-[#2DCD6B] text-white' 
                : (step1Completed ? 'bg-[#5C9DFF] text-white' : 'bg-[#E5E7EB] text-[#6E748F]')
            }`}>
              2
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="font-semibold text-[13px] leading-[16px] text-[#0F1450]">Conversation Practice</span>
              <span className={`text-[11px] leading-[14px] font-medium ${
                isCompleted ? 'text-[#2DCD6B]' : (step1Completed ? 'text-[#5C9DFF]' : 'text-[#6E748F]')
              }`}>
                {isCompleted ? 'Completed' : (step1Completed ? 'In Progress' : 'Pending')}
              </span>
            </div>
          </div>
          <div className="w-full h-[1px] bg-[#E5E7EB]/70" />

          {/* Step 3: Session Review */}
          <div className={`relative flex flex-row items-center p-[14px_14px_14px_13px] gap-2.5 ${
            isCompleted ? 'bg-[#5C9DFF]/10' : ''
          }`}>
            {isCompleted && (
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[40px] bg-[#5C9DFF] rounded-[2px]" />
            )}
            <div className={`flex justify-center items-center w-7 h-7 rounded-full font-bold text-[12px] ${
              isCompleted ? 'bg-[#2DCD6B] text-white' : 'bg-[#E5E7EB] text-[#6E748F]'
            }`}>
              3
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="font-semibold text-[13px] leading-[16px] text-[#0F1450]">Session Completion</span>
              <span className={`text-[11px] leading-[14px] font-medium ${
                isCompleted ? 'text-[#2DCD6B]' : 'text-[#6E748F]'
              }`}>
                {isCompleted ? 'Completed' : 'Pending'}
              </span>
            </div>
          </div>
          <div className="w-full h-[1px] bg-[#E5E7EB]/70" />
          </div>

        </div>

        {/* Workspace Main */}
        <div className="flex flex-col flex-1 gap-4 min-h-0 overflow-y-auto pr-1">
          
          {/* Scenario Card */}
          {contentPayload && (contentPayload.passage || contentPayload.content || contentPayload.scenario) && (
            <div className="flex-shrink-0 flex flex-col gap-4 pl-2 mt-2">
              <ReadingPassageCard 
                title="Roleplay Scenario"
                content={contentPayload.passage || contentPayload.content || contentPayload.scenario || ''}
                audioUrl={contentPayload.contentAudioUrl || contentPayload.narrationAudioUrl || contentPayload.attachmentUrl}
                readingPresentation={contentPayload.readingPresentation}
                isPlaying={playingAudioId === 'roleplay-scenario' && isCurrentlyPlaying}
                onToggleAudio={() =>
                  toggleAudio(
                    'roleplay-scenario',
                    contentPayload.contentAudioUrl || contentPayload.narrationAudioUrl || contentPayload.attachmentUrl,
                  )
                }
                onExpand={() => setIsScenarioExpanded(true)}
                forceExpanded={step1Active}
              />
              {step1Active && (
                <div className="flex justify-end w-full pb-2">
                  <button
                    onClick={() => {
                      stopAudio();
                      setIsScenarioExpanded(true);
                    }}
                    className="px-6 py-2.5 bg-[#3B82F6] text-white rounded-full font-['Outfit'] font-semibold text-[14px] hover:bg-[#2563EB] transition-colors shadow-sm"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Chat History Area */}
          {!step1Active && (
          <div className="flex flex-col flex-1 border border-[#E5E7EB] bg-white rounded-xl min-h-0 overflow-hidden mb-2 ml-2">
            <div 
              ref={chatContainerRef}
              className="flex flex-col p-5 px-6 gap-3 flex-1 min-h-0 bg-[#F8F9FA] overflow-y-auto"
            >
            {chatHistory.map((msg, index) => (
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
                  {msg.role === 'assistant' && (msg.audioUrl || msg.feedback || msg.hint) && (
                    <div className="mt-3 flex items-center gap-4 border-t border-[#E5E7EB] pt-2.5">
                      {msg.audioUrl && (
                        <button
                          type="button"
                          onClick={() => toggleAudio(msg.id, msg.audioUrl || undefined)}
                          className="flex items-center text-[#0F1450] hover:text-[#5C9DFF] transition-colors"
                          aria-label={playingAudioId === msg.id && isCurrentlyPlaying ? 'Pause AI response' : 'Play AI response'}
                        >
                          {loadingAudioId === msg.id ? (
                            <LoaderCircle className="w-5 h-5 animate-spin" />
                          ) : playingAudioId === msg.id && isCurrentlyPlaying ? (
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
                      {msg.hint && (
                        <button
                          type="button"
                          onClick={() => setHintOpenForMessageId(hintOpenForMessageId === msg.id ? null : msg.id)}
                          className="flex items-center gap-1.5 text-[#0F766E] hover:text-[#0D9488] transition-colors font-semibold text-[12px] leading-[15px]"
                          aria-expanded={hintOpenForMessageId === msg.id}
                        >
                          <Lightbulb className="w-3.5 h-3.5" />
                          <span>Hint</span>
                        </button>
                      )}
                    </div>
                  )}
                  {msg.hint && hintOpenForMessageId === msg.id && (
                    <div className="mt-3 rounded-lg bg-[#F0FDFA] px-3 py-2.5 text-[12px] leading-[17px] text-[#115E59]">
                      <span className="font-semibold">What to say: </span>
                      {msg.hint}
                    </div>
                  )}
                </div>
                {msg.createdAt && (
                  <span className="text-[10px] leading-[13px] text-[#6E748F]/60">
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
              </div>
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

          {/* Input Bar */}
          <div className="flex flex-row items-center px-5 py-4 gap-3 bg-white border-t border-[#E5E7EB] flex-shrink-0">
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
                  placeholder={cooldown ? "Please wait..." : "Write your message..."}
                  value={inputValue}
                  disabled={cooldown || isTyping || isAccountBlocked}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="flex-1 px-4 py-3 bg-white border border-[#E5E7EB] rounded-[10px] text-[14px] text-[#282828] placeholder-[#6E748F]/60 focus:outline-none focus:border-[#5C9DFF] focus:ring-1 focus:ring-[#5C9DFF] transition-all disabled:bg-gray-50 disabled:cursor-not-allowed"
                />
                {inputValue.trim() ? (
                  <button 
                    onClick={handleSend}
                    disabled={cooldown || isTyping || isAccountBlocked}
                    className="flex justify-center items-center w-11 h-11 bg-[#5C9DFF] rounded-full text-white hover:bg-[#4A8BEB] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                ) : (
                  <button 
                    onClick={startRecording}
                    disabled={cooldown || isTyping || isAccountBlocked}
                    className="flex justify-center items-center w-11 h-11 bg-white border border-[#5C9DFF] rounded-full text-[#5C9DFF] hover:bg-[#EFF6FF] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Mic className="w-5 h-5" />
                  </button>
                )}
              </>
            )}
          </div>
          </div>
          )}

        </div>
      </div>
    </div>
  );
}
