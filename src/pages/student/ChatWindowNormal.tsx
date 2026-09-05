import React, { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";
import { io, Socket } from "socket.io-client";
import { Howl, Howler } from "howler";
import {
  Mic,
  Send,
  ChevronLeft,
  MessageCircle,
  Clock,
  BarChart2,
  Play,
  Pause,
  ArrowUp,
  X,
  LoaderPinwheel,
  Award,
  AlertTriangle,
  RotateCcw,
  Check,
  Info,
} from "lucide-react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import QuestionnaireModal from "@/components/ui/QuestionaireModal";
import { Progress } from "@/components/ui/progress";
import AudioPlayer from "./AudioPlayer";
import ReadingPassageCard, { type ReadingPassagePresentation } from "@/components/ui/ReadingPassageCard";

interface McqAnswer {
  questionId: string;
  answerIndex: number;
}

// --- Centralized Logger (Unchanged) ---
const logger = {
  log: (message: string, ...optionalParams: any[]) => {
    console.log(`[${new Date().toISOString()}] ${message}`, ...optionalParams);
  },
  emitting: (event: string, payload: any) => {
    console.log(
      `%c[Socket.IO EMIT] >> %c${event}`,
      "color: #f39c12; font-weight: bold;",
      "color: #f39c12;",
      { payload },
    );
  },
  receiving: (event: string, payload: any) => {
    console.log(
      `%c[Socket.IO RECEIVE] << %c${event}`,
      "color: #2ecc71; font-weight: bold;",
      "color: #2ecc71;",
      { payload },
    );
  },
  info: (message: string, data?: any) => {
    console.info(
      `%c[INFO] %c${message}`,
      "color: #3498db; font-weight: bold;",
      "color: inherit;",
      data || "",
    );
  },
  error: (message: string, error?: any) => {
    console.error(
      `%c[ERROR] %c${message}`,
      "color: #e74c3c; font-weight: bold;",
      "color: inherit;",
      error || "",
    );
  },
};

// --- Constants and Interfaces (Unchanged) ---
const ChatEvents = {
  RESET_CHAT: "reset_chat",
  GET_CHAT_HISTORY: "getChatHistory",
  AUDIO: "audio",
  TEXT: "text",
  SESSION_STATUS: "session_status",
  ERROR: "error",
  AI_RESPONSE: "AI_RESPONSE",
  TTS_AUDIO_URL: "TTS_AUDIO_URL",
  CHAT_HISTORY: "chat_history",
  CHAT_COMPLETED: "chat_completed",
  ATTACHMENT_URL: "attachment_url",
  SPEECH_TRANSCRIBED: "speech_transcribed",
  STREAMING_COMPLETE: "streaming_complete",
  SESSION_STATUS_UPDATE: "session_status",
  BADGE_UNLOCKED: "badge_unlocked",
  MCQ_LIST: "mcq_list",
  SUBMIT_MCQS: "submit_mcqs",
  MCQ_RESULT: "mcq_result",
  CONTENT_PAYLOAD: "content_payload",
  NEXT_STAGE: "next_stage",
  ACCOUNT_BLOCKED: "account_blocked",
  CONTENT_FILTER_WARNING: "content_filter_warning",
} as const;

interface ServerToClientEvents {
  connect: () => void;
  disconnect: () => void;
  connect_error: (err: Error) => void;
  [ChatEvents.ERROR]: (payload: { message: string; error?: any }) => void;
  [ChatEvents.RESET_CHAT]: (payload: {
    success: boolean;
    message: string;
  }) => void;
  [ChatEvents.CHAT_HISTORY]: (payload: {
    chatHistory: any[];
    chatId: string;
  }) => void;
  [ChatEvents.CHAT_COMPLETED]: (payload: { message: string }) => void;
  [ChatEvents.ATTACHMENT_URL]: (payload: { attachment: string }) => void;
  [ChatEvents.SPEECH_TRANSCRIBED]: (payload: {
    textMessage: string;
    assessments: any;
  }) => void;
  [ChatEvents.SESSION_STATUS_UPDATE]: (payload: {
    remainingSeconds: number;
  }) => void;
  [ChatEvents.AI_RESPONSE]: (payload: {
    ai_response: string;
    feedback: string;
  }) => void;
  [ChatEvents.TTS_AUDIO_URL]: (payload: { tts_audio_url: string }) => void;
  [ChatEvents.STREAMING_COMPLETE]: (payload: {
    isCompleted: boolean;
    ai_response: string;
    feedback: string;
    ttsAudioUrl: string;
    [key: string]: any;
  }) => void;
  [ChatEvents.BADGE_UNLOCKED]: (payload: {
    userId: string;
    key: string;
    name: string;
    description: string;
    iconUrl: string;
    pointValue: number;
  }) => void;
  [ChatEvents.CONTENT_PAYLOAD]: (payload: {
    contentPayload: {
      content: string;
      contentAudioUrl: string;
      readingPresentation?: ReadingPassagePresentation;
    };
  }) => void;
  [ChatEvents.ACCOUNT_BLOCKED]: (payload: {
    message: string;
    violationCount: number;
    accountStatus: string;
  }) => void;
  [ChatEvents.CONTENT_FILTER_WARNING]: (payload: {
    message: string;
    violationType: string;
    severity: string;
    violationCount: number;
    remainingWarnings: number;
  }) => void;
  next_stage: (payload: {
    userId: string;
    topicId: string;
    chatId: string | null;
  }) => void;
}

interface ClientToServerEvents {
  [ChatEvents.RESET_CHAT]: (payload: {
    userId: string;
    topicId: string;
  }) => void;
  [ChatEvents.GET_CHAT_HISTORY]: (payload: {
    userId: string;
    topicId: string;
  }) => void;
  [ChatEvents.AUDIO]: (payload: {
    userId: string;
    chatId: string | null;
    audioBuffer: string;
    format: string;
  }) => void;
  [ChatEvents.TEXT]: (payload: {
    userId: string;
    chatId: string | null;
    textMessage: string;
  }) => void;
  [ChatEvents.SESSION_STATUS]: (payload: { userId: string }) => void;
  [ChatEvents.SUBMIT_MCQS]: (payload: {
    chatId: string;
    answers: McqAnswer[];
  }) => void;
  no_user_response: (payload: {
    userId: string;
    topicId: string;
    chatId: string;
  }) => void;
  [ChatEvents.CONTENT_PAYLOAD]: (payload: {
    userId: string;
    topicId: string;
    chatId: string;
  }) => void;
  [ChatEvents.NEXT_STAGE]: (payload: {
    userId: string;
    topicId: string;
    chatId: string | null;
  }) => void;
  next_listening_stage: (payload: { chatId: string }) => void;
}

interface Message {
  id: string;
  messageType: "text" | "audio" | "loading";
  text?: string;
  type: "sent" | "received";
  feedback?: any;
  audioUrl?: string;
  audioURL?: string;
  audioPlayed?: boolean;
  hasFeedback?: boolean;
  hasAssessment?: boolean;
  assessments?: any;
  loading?: boolean;
}

interface ChatWindowProps {
  onShowFeedback: (feedback: { type: string; content: any }) => void;
  onTopicImage: (imageUrl: string) => void;
  onUserAction?: () => void;
}

function findLastIndex<T>(
  array: T[],
  predicate: (value: T) => boolean,
): number {
  for (let i = array.length - 1; i >= 0; i--) {
    if (predicate(array[i])) return i;
  }
  return -1;
}

const ChatWindow: React.FC<ChatWindowProps> = ({
  onShowFeedback,
  onTopicImage,
  onUserAction,
}) => {
  const HintBubble = ({
    title,
    content,
    icon: Icon,
    timestamp,
    onClick,
    children,
  }: {
    title?: string;
    content: React.ReactNode;
    icon?: any;
    timestamp: string;
    onClick?: () => void;
    children?: React.ReactNode;
  }) => {
    return (
      <div
        className="flex flex-col items-start p-2 px-3 gap-2 w-full max-w-[341px] bg-[#5FB8FB80] shadow-[0px_4px_4px_rgba(0,0,0,0.25)] rounded-[0px_16px_16px_16px] mt-2 relative overflow-hidden cursor-pointer hover:bg-[#A9D8FD] transition-colors"
        style={{ opacity: 0.8 }}
        onClick={onClick}
      >
        {title && Icon && (
          <div className="flex flex-row items-center gap-[10px] h-6">
            <Icon className="w-6 h-6 text-[#065FF0]" />
            <span className="font-['Outfit'] font-medium text-base leading-5 flex items-center text-[#003DC2]">
              {title}
            </span>
          </div>
        )}
        <div className="w-full font-['Outfit'] font-normal text-sm leading-[18px] flex items-center text-[#434343] self-stretch break-words">
          {content}
        </div>
        {children}
        <div className="flex flex-row justify-end items-center w-full h-[18px] self-stretch mt-1">
          <span className="font-['Poppins'] font-normal text-[12px] leading-[18px] flex items-center text-right capitalize text-[#949494]">
            {timestamp}
          </span>
        </div>
      </div>
    );
  };

  const getDisplayTime = () => {
    const now = new Date();
    let hours = now.getHours();
    const minutes = now.getMinutes();
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12;
    hours = hours ? hours : 12;
    const strMinutes = minutes < 10 ? "0" + minutes : minutes;
    const strHours = hours < 10 ? "0" + hours : hours;
    return strHours + ":" + strMinutes + " " + ampm;
  };


  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordTime, setRecordTime] = useState(0);
  const [chatId, setChatId] = useState<string | null>(null);
  const [sessionTimeRemaining, setSessionTimeRemaining] = useState<
    number | null
  >(null);
  const sessionTimerBaseRef = useRef<{
    remainingSeconds: number;
    receivedAt: number;
  } | null>(null);
  const sessionTimerLastEmittedRef = useRef<number | null>(null);
  const [_sessionLimitReached, _setSessionLimitReached] = useState(false);
  const [chatCompleted, setChatCompleted] = useState(false);
  const isSessionExpired = _sessionLimitReached || sessionTimeRemaining === 0;
  const emitSessionRemaining = useCallback((next: number | null) => {
    setSessionTimeRemaining(next);
  }, []);

  useEffect(() => {
    const tick = () => {
      const base = sessionTimerBaseRef.current;
      if (!base) return;
      const elapsedSeconds = Math.floor((Date.now() - base.receivedAt) / 1000);
      const nextRemaining = Math.max(0, base.remainingSeconds - elapsedSeconds);
      if (sessionTimerLastEmittedRef.current !== nextRemaining) {
        sessionTimerLastEmittedRef.current = nextRemaining;
        _setSessionLimitReached(nextRemaining === 0);
        emitSessionRemaining(nextRemaining);
      }
    };

    const intervalId = setInterval(tick, 1000);
    return () => clearInterval(intervalId);
  }, [emitSessionRemaining]);

  useEffect(() => {
    if (isSessionExpired) {
      _setSessionLimitReached(true);
      if (isRecording) {
        stopRecording(true);
      }
      return;
    }

    if (sessionTimeRemaining !== null && sessionTimeRemaining > 0) {
      _setSessionLimitReached(false);
    }
  }, [isRecording, isSessionExpired, sessionTimeRemaining]);

  // --- MODIFIED: Simplified audio state management
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [loadingAudioId, setLoadingAudioId] = useState<string | null>(null);
  const [isCurrentlyPlaying, setIsCurrentlyPlaying] = useState(false);
  const soundRef = useRef<Howl | null>(null);
  const [isAudioUnlocked, setIsAudioUnlocked] = useState(false);
  // const [autoplayFailed, setAutoplayFailed] = useState(false);
  // --- END MODIFICATION

  const [topicImage, setTopicImage] = useState<string | null>(null);
  const [isInactiveDialogOpen, setIsInactiveDialogOpen] = useState(false);
  const [isCompleteDialogOpen, setIsCompleteDialogOpen] = useState(false);
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const [isQueationnaireOpen, setIsQuestionnaireOpen] = React.useState(false);
  const [mcqList, setMcqList] = useState<any[]>([]);
  const [audioProgress, setAudioProgress] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [contentPayload, setContentPayload] = useState<{
    content: string;
    audioUrl: string;
    readingPresentation?: ReadingPassagePresentation;
  } | null>(null);
  const [isContentExpanded, setIsContentExpanded] = useState(false);
  const [shouldShowExpandButton, setShouldShowExpandButton] = useState(false);
  const contentRef = useRef<HTMLParagraphElement>(null);

  const [unlockedBadgeInfo, setUnlockedBadgeInfo] = useState<{
    name: string;
    description: string;
    iconUrl: string;
    pointValue: number;
  } | null>(null);
  const [isBadgeModalOpen, setIsBadgeModalOpen] = useState(false);
  const [isDuplicateConnectionModalOpen, setIsDuplicateConnectionModalOpen] =
    useState(false);
  const [isContentFilterWarningOpen, setIsContentFilterWarningOpen] =
    useState(false);
  const [contentFilterWarningData, setContentFilterWarningData] = useState<{
    message: string;
    violationType: string;
    severity: string;
    violationCount: number;
    remainingWarnings: number;
  } | null>(null);
  const [isAccountBlockedOpen, setIsAccountBlockedOpen] = useState(false);
  const [accountBlockedData, setAccountBlockedData] = useState<{
    message: string;
    violationCount: number;
    accountStatus: string;
  } | null>(null);

  // --- Listening Mode State ---
  const [progress, setProgress] = React.useState(30);
  const [listeningStage, setListeningStage] = useState<string | null>(null);
  const [listeningData, setListeningData] = useState<any>(null);
  const [currentMcqIndex, setCurrentMcqIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showReplayPopup, setShowReplayPopup] = useState(false);
  const [mcqAnswers, setMcqAnswers] = useState<{ [key: string]: number }>({});
  // const [barCount, setBarCount] = useState(0);
  const [listeningSteps, setListeningSteps] = useState(1);
  // --- End Listening Mode State ---

  const [isContextCompleted, setIsContextCompleted] = useState(false);
  const [hasStartedContextAudio, setHasStartedContextAudio] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [isWaitingForResponse, setIsWaitingForResponse] = useState(false);

  const clickLocked = React.useRef(false);
  const onEndCalledRef = useRef(false);

  // Add new states for audio completion tracking
  const [_hasCompletedNarration, _setHasCompletedNarration] = useState(false);
  const [_hasCompletedQuestion, _setHasCompletedQuestion] = useState(false);
  const [hasAutoplayedStage, setHasAutoplayedStage] = useState<string | null>(
    null,
  );
  const [_hasCompletedKbAudio, _setHasCompletedKbAudio] = useState(false);

  const socketRef = useRef<Socket<
    ServerToClientEvents,
    ClientToServerEvents
  > | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const activityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const isCanceledRef = useRef(false);
  const recordTimerRef = useRef<NodeJS.Timeout | null>(null);

  const { topicId } = useParams<{ topicId: string }>();
  if (!topicId) throw new Error("Topic ID is required");
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const mode = searchParams.get("mode");
  const userData = JSON.parse(localStorage.getItem("AiTutorUser") || "{}");
  const userId = userData?.id;
  const SOCKET_URL = import.meta.env.VITE_API_BASE_URL;
  const resetActivityTimer = useCallback(() => {
    if (activityTimerRef.current) clearTimeout(activityTimerRef.current);
    activityTimerRef.current = setTimeout(
      () => {
        logger.info("User inactive, disconnecting socket.");
        socketRef.current?.disconnect();
        setIsInactiveDialogOpen(true);
      },
      5 * 60 * 1000,
    );
  }, []);

  const isIOS = () =>
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1) ||
    (navigator.userAgent.includes("Mac") && "ontouchend" in document);

  // Check if user is one of the unlimited session demo accounts (3d-student-01 to 3d-student-10)
  const hasUnlimitedSessions = () => {
    const username = userData?.username;
    if (!username) return false;
    return /^3d-student-(0[1-9]|10)$/.test(username);
  };

  // --- MODIFIED: Universal Audio Unlocker ---
  const unlockAudio = useCallback(() => {
    if (isAudioUnlocked) return;

    const unlock = () => {
      if (Howler.ctx && Howler.ctx.state !== "running") {
        Howler.ctx.resume().then(() => {
          logger.info("Audio context unlocked successfully by user gesture.");
          setIsAudioUnlocked(true);
          document.removeEventListener("touchstart", unlock, true);
          document.removeEventListener("touchend", unlock, true);
          document.removeEventListener("click", unlock, true);
        });
      } else {
        setIsAudioUnlocked(true);
        document.removeEventListener("touchstart", unlock, true);
        document.removeEventListener("touchend", unlock, true);
        document.removeEventListener("click", unlock, true);
      }
    };

    logger.info("Setting up audio unlock listeners...");
    document.addEventListener("touchstart", unlock, true);
    document.addEventListener("touchend", unlock, true);
    document.addEventListener("click", unlock, true);

    return () => {
      document.removeEventListener("touchstart", unlock, true);
      document.removeEventListener("touchend", unlock, true);
      document.removeEventListener("click", unlock, true);
    };
  }, [isAudioUnlocked]);

  useEffect(() => {
    const cleanup = unlockAudio();
    if (cleanup) return cleanup;
  }, [unlockAudio]);
  // --- END MODIFICATION

  // Check if content needs expansion button
  useEffect(() => {
    if (contentPayload && contentRef.current) {
      // Reset expansion state when content changes
      setIsContentExpanded(false);

      // Temporarily remove line-clamp to measure full height
      const element = contentRef.current;
      const originalClass = element.className;
      element.className = originalClass.replace(
        "line-clamp-3",
        "line-clamp-none",
      );

      const fullHeight = element.scrollHeight;

      // Restore original class
      element.className = originalClass;

      // Calculate height of 3 lines (approximate)
      const lineHeight = parseFloat(getComputedStyle(element).lineHeight) || 24;
      const maxHeight = lineHeight * 3;

      setShouldShowExpandButton(fullHeight > maxHeight);
    }
  }, [contentPayload]);

  const getSupportedMimeType = () => {
    const types = [
      "audio/mp4",
      "audio/webm;codecs=opus",
      "audio/webm",
      "audio/ogg",
    ];
    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) return type;
    }
    return undefined;
  };

  const lastRecordingEndTimeRef = useRef<number | null>(null);

  useEffect(() => {
    if (!userId) {
      toast.error("User information is missing.");
      logger.error("User ID is missing, cannot establish connection.");
      navigate(-1);
      return;
    }

    logger.info("Initializing Socket.IO connection...");
    const accessToken = localStorage.getItem("accessToken");
    const socket = io(SOCKET_URL, {
      reconnectionAttempts: 5,
      reconnectionDelay: 5000,
      auth: {
        token: accessToken,
        userId: userId,
      },
      extraHeaders: { "ngrok-skip-browser-warning": "true" },
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      logger.info(`Socket connected with ID: ${socket.id}`);
      setIsSocketConnected(true);
      toast.success("Connection established.");

      if (mode === "listening-mode") {
        logger.emitting("start_listening", { userId, topicId });
        socket.emit("start_listening", { userId, topicId });
      } else {
        const historyPayload = { userId, topicId };
        logger.emitting(ChatEvents.GET_CHAT_HISTORY, historyPayload);
        socket.emit(ChatEvents.GET_CHAT_HISTORY, historyPayload);

        if (
          mode === "reading-mode" ||
          mode === "roleplay-mode" ||
          mode === "debate-mode"
        ) {
          const payload = { userId, topicId };
          logger.emitting(ChatEvents.CONTENT_PAYLOAD, payload);
          socket.emit(ChatEvents.CONTENT_PAYLOAD, payload);
        }
      }

      const sessionPayload = { userId };
      logger.emitting(ChatEvents.SESSION_STATUS, sessionPayload);
      socket.emit(ChatEvents.SESSION_STATUS, sessionPayload);

      resetActivityTimer();
    });

    socket.on("listening_payload", ({ chatId: newChatId, ...data }) => {
      setChatId(newChatId);
      setListeningData(data);
      setProgress(30);
      setListeningSteps(1);

      let currentStage: string | null = null;
      if (data.narrationText) {
        currentStage = "initial";
      } else if (data.questionText) {
        currentStage = "question_text";
        setProgress(65);
        setListeningSteps(2);
      } else if (data.mcqs) {
        currentStage = "quiz";
        setMcqList(data.mcqs);
        setCurrentMcqIndex(0);
        setProgress(100);
        setListeningSteps(3);
      }

      setListeningStage(currentStage);
      logger.info(`Listening mode stage inferred: ${currentStage}`, data);
    });

    socket.on("next_listening_stage", () => {
      setProgress(2);
    });

    socket.on("listening_completed", () => {
      setChatCompleted(true);
      setIsCompleteDialogOpen(true);
      toast.success("🎉 Listening session completed!");
    });

    socket.on("disconnect", (reason: Socket.DisconnectReason) => {
      logger.error(`Socket disconnected. Reason: ${reason}`);
      setIsSocketConnected(false);
      setIsWaitingForResponse(false);

      if (reason === "ping timeout" || reason === "transport close") {
        if (!isInactiveDialogOpen) {
          toast.warning("Connection lost. Trying to reconnect...");
        }
      } else if (reason === "io server disconnect") {
        toast.error("You have been disconnected by the server.");
      } else if (reason === "io client disconnect") {
        logger.info("Client-side disconnection initiated. No toast needed.");
      }
    });

    socket.on("connect_error", (err) => {
      logger.error("Socket connection error:", err);

      // Handle authentication errors
      if (err.message.includes("401") || err.message.includes("Unauthorized")) {
        toast.error("Authentication failed. Please log in again.");
        // Clear auth data and redirect to login
        localStorage.removeItem("AiTutorUser");
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        navigate("/login");
        return;
      }

      toast.error(`Connection failed: ${err.message}`);
    });

    // Handle authentication errors from server
    socket.on("auth_error", (error) => {
      logger.error("WebSocket authentication error:", error);
      toast.error("Authentication failed. Please log in again.");
      // Clear auth data and redirect to login
      localStorage.removeItem("AiTutorUser");
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      navigate("/login");
    });

    socket.on(ChatEvents.CHAT_HISTORY, (payload: any) => {
      logger.receiving(ChatEvents.CHAT_HISTORY, payload);

      const { chatHistory, chatId: newChatId } = payload;
      const formatted = chatHistory.map((msg: any) => ({
        id: msg.id,
        messageType: "text",
        text: msg.content,
        type: msg.sender === "ai" ? "received" : "sent",
        audioUrl: msg.audioUrl,
        audioPlayed: true,
        assessments: msg.assessments,
        hasAssessment: !!msg.assessments,
        feedback: msg.feedback,
        hasFeedback: !!msg.feedback,
      }));
      setMessages(formatted);
      setChatId(newChatId);

      if (formatted.length > 0) {
        const lastMsg = formatted[formatted.length - 1];
        if (lastMsg.type === "received" && lastMsg.messageType === "text") {
          startInactivityTimer();
        }
      }

      if (chatHistory.some((m: any) => m.isCompleted)) {
        if (mode !== "reading-mode") {
          setChatCompleted(true);
          setIsCompleteDialogOpen(true);
        }
      }
    });

    socket.on(ChatEvents.SPEECH_TRANSCRIBED, (payload) => {
      logger.receiving(ChatEvents.SPEECH_TRANSCRIBED, payload);
      const { textMessage, assessments } = payload;
      removeLoadingMessage();
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          type: "sent",
          messageType: "text",
          text: textMessage,
          assessments,
          hasAssessment: !!assessments,
        },
      ]);

      sendPlaceholder();
    });

    socket.on(ChatEvents.STREAMING_COMPLETE, (payload) => {
      logger.receiving(ChatEvents.STREAMING_COMPLETE, payload);
      const { ai_response, feedback, ttsAudioUrl, isCompleted } = payload;
      setIsWaitingForResponse(false);
      setMessages((prev) => {
        const newMessages = [...prev];
        const i = newMessages.findIndex((msg) => msg.loading === true);
        if (i !== -1) {
          newMessages[i] = {
            ...newMessages[i],
            loading: false,
            messageType: "text",
            type: "received",
            text: ai_response,
            feedback,
            hasFeedback: !!feedback,
            audioUrl: ttsAudioUrl,
            audioPlayed: false,
          };
        }
        return newMessages;
      });
      if (isCompleted) {
        if (mode !== "reading-mode") {
          setChatCompleted(true);
          setIsCompleteDialogOpen(true);
        }
      }
    });

    socket.on(ChatEvents.TTS_AUDIO_URL, (payload) => {
      logger.receiving(ChatEvents.TTS_AUDIO_URL, payload);
      const { tts_audio_url } = payload;
      setMessages((prev) => {
        const newMessages = [...prev];
        const i = findLastIndex(newMessages, (msg) => msg.type === "received");
        if (i !== -1) {
          newMessages[i] = {
            ...newMessages[i],
            audioUrl: tts_audio_url,
            audioPlayed: false,
          };
        }
        return newMessages;
      });
    });

    socket.on(ChatEvents.STREAMING_COMPLETE, (payload) => {
      logger.receiving(ChatEvents.STREAMING_COMPLETE, payload);
      const { ai_response, feedback, ttsAudioUrl, isCompleted } = payload;
      setIsWaitingForResponse(false);
      setMessages((prev) => {
        const newMessages = [...prev];
        const i = newMessages.findIndex((msg) => msg.loading === true);
        if (i !== -1) {
          newMessages[i] = {
            id: newMessages[i].id,
            loading: false,
            messageType: "text",
            type: "received",
            text: ai_response,
            feedback,
            hasFeedback: !!feedback,
            audioUrl: ttsAudioUrl,
            audioPlayed: false,
          };
        }
        return newMessages;
      });
      if (isCompleted) {
        if (mode !== "reading-mode") {
          setChatCompleted(true);
          setIsCompleteDialogOpen(true);
        }
      }
    });

    socket.on(ChatEvents.SESSION_STATUS_UPDATE, (payload) => {
      logger.receiving(ChatEvents.SESSION_STATUS_UPDATE, payload);

      // Skip session limit for unlimited demo accounts
      if (hasUnlimitedSessions()) {
        sessionTimerBaseRef.current = null;
        sessionTimerLastEmittedRef.current = null;
        _setSessionLimitReached(false);
        emitSessionRemaining(null);
        return;
      }

      const rawRemaining = payload?.remainingSeconds;
      if (typeof rawRemaining !== "number" || Number.isNaN(rawRemaining)) {
        sessionTimerBaseRef.current = null;
        sessionTimerLastEmittedRef.current = null;
        _setSessionLimitReached(false);
        emitSessionRemaining(null);
        return;
      }
      const normalizedRemaining = Math.max(0, Math.floor(rawRemaining));
      sessionTimerBaseRef.current = {
        remainingSeconds: normalizedRemaining,
        receivedAt: Date.now(),
      };
      sessionTimerLastEmittedRef.current = normalizedRemaining;
      _setSessionLimitReached(normalizedRemaining === 0);
      emitSessionRemaining(normalizedRemaining);
    });

    socket.on(ChatEvents.CONTENT_PAYLOAD, (payload) => {
      logger.receiving(ChatEvents.CONTENT_PAYLOAD, payload);
      const { contentPayload: data } = payload;
      if (data) {
        const { content, contentAudioUrl, readingPresentation } = data;
        if (
          (mode === "reading-mode" ||
            mode === "roleplay-mode" ||
            mode === "debate-mode") &&
          content &&
          contentAudioUrl
        ) {
          setContentPayload({ content, audioUrl: contentAudioUrl, readingPresentation });
        }
      }
    });

    socket.on(ChatEvents.MCQ_LIST, (payload) => {
      logger.receiving(ChatEvents.MCQ_LIST, payload);
      console.log("Received MCQ List:", payload);
      if (mode === "reading-mode") {
        setMcqList(payload.questions);
        setChatId(payload.chatId);
        setIsQuestionnaireOpen(true);
      } else if (mode === "listening-mode" && payload.mcqs) {
        setListeningStage("quiz");
        setMcqList(payload.mcqs);
        setChatId(payload.chatId);
        setListeningData((prevData: any) => ({ ...prevData, ...payload }));
        setCurrentMcqIndex(0);
      }
    });

    socket.on(ChatEvents.MCQ_RESULT, (payload) => {
      logger.receiving(ChatEvents.MCQ_RESULT, payload);
      const { correctCount, required, message } = payload;
      const isSuccess = correctCount >= required;

      if (mode !== "listening-mode") {
        if (isSuccess) {
          toast.success("🎉 Quiz Passed!", {
            description: `Great job! You got ${correctCount} correct answers.`,
            duration: 4000,
          });
        } else {
          toast.error("❌ Try Again", {
            description: message,
            duration: 4000,
          });
        }
      }
    });

    socket.on("listening_payload", ({ chatId: newChatId, ...data }) => {
      setChatId(newChatId);
      setListeningData(data);

      let currentStage: string | null = null;
      if (data.narrationText) {
        currentStage = "initial";
        setMessages([
          {
            id: "narration-audio", // Use a fixed ID for narration
            messageType: "text",
            type: "received",
            text: data.narrationText,
            audioUrl: data.narrationAudioUrl,
            audioPlayed: false,
          },
        ]);
      } else if (data.questionText) {
        currentStage = "question_text";
        setMessages([
          {
            id: "question-audio", // Use a fixed ID for question
            messageType: "text",
            type: "received",
            text: data.questionText,
            audioUrl: data.questionAudioUrl,
            audioPlayed: false,
          },
        ]);
      } else if (data.mcqs) {
        currentStage = "quiz";
        setMessages([]); // Clear messages for quiz stage
        setMcqList(data.mcqs);
        setCurrentMcqIndex(0);
      }

      setListeningStage(currentStage);
      logger.info(`Listening mode stage inferred: ${currentStage}`, data);
    });

    socket.on(ChatEvents.ERROR, (payload) => {
      logger.receiving(ChatEvents.ERROR, payload);
      setIsWaitingForResponse(false);
      removeLoadingMessage();

      const errorMessage = (payload.message || "").toLowerCase();
      const errorCode = payload.code;

      console.log(errorMessage, "error Message");
      console.log(errorCode, "error Code");

      if (
        errorCode === "DUPLICATE_CONNECTION" ||
        errorMessage.includes("already connected from another session")
      ) {
        setIsDuplicateConnectionModalOpen(true);
      } else if (errorMessage.includes("daily session limit")) {
        // Skip session limit for unlimited demo accounts
        if (hasUnlimitedSessions()) {
          return;
        }
        _setSessionLimitReached(true);
        toast.error("You have reached your daily session limit.");
      } else if (errorMessage.includes("user not found")) {
        toast.error("User authentication failed. Please log in again.");
        setTimeout(() => navigate("/login"), 3000);
      } else if (errorMessage.includes("chat has been completed")) {
        toast.info("This conversation has already ended.");
      } else if (errorMessage.includes("no speech recognized")) {
        toast.info("No speech recognized. Please speak clearly.");
      } else {
        toast.error(
          "An internal server error occurred. Please try again later.",
        );
        logger.error(
          "Unhandled Internal Server Error:",
          payload.error || payload,
        );
      }
    });
    socket.on(ChatEvents.CHAT_COMPLETED, (payload) => {
      logger.receiving(ChatEvents.CHAT_COMPLETED, payload);
      setChatCompleted(true);
      setIsCompleteDialogOpen(true);
      toast.info(payload.message);
    });
    socket.on(ChatEvents.ATTACHMENT_URL, (payload) => {
      logger.receiving(ChatEvents.ATTACHMENT_URL, payload);
      setTopicImage(payload.attachment);
      onTopicImage(payload.attachment);
    });

    socket.on(ChatEvents.BADGE_UNLOCKED, (payload) => {
      logger.receiving(ChatEvents.BADGE_UNLOCKED, payload);
      setUnlockedBadgeInfo({
        name: payload.name,
        description: payload.description,
        iconUrl: payload.iconUrl,
        pointValue: payload.pointValue,
      });
      setIsBadgeModalOpen(true);
      toast.success(`🎉 New Badge Unlocked: ${payload.name}!`);
    });

    socket.on(ChatEvents.ACCOUNT_BLOCKED, (payload) => {
      logger.receiving(ChatEvents.ACCOUNT_BLOCKED, payload);
      removeLoadingMessage();
      setAccountBlockedData({
        message: payload.message,
        violationCount: payload.violationCount,
        accountStatus: payload.accountStatus,
      });
      setIsAccountBlockedOpen(true);
    });

    socket.on(ChatEvents.CONTENT_FILTER_WARNING, (payload) => {
      logger.receiving(ChatEvents.CONTENT_FILTER_WARNING, payload);
      removeLoadingMessage();
      logger.info("Content filter warning received. Disconnecting socket.");
      socketRef.current?.disconnect();
      setContentFilterWarningData({
        message: payload.message,
        violationType: payload.violationType,
        severity: payload.severity,
        violationCount: payload.violationCount,
        remainingWarnings: payload.remainingWarnings,
      });
      setIsContentFilterWarningOpen(true);
    });

    return () => {
      logger.info("Component unmounting. Disconnecting socket.");
      if (activityTimerRef.current) clearTimeout(activityTimerRef.current);
      socket.disconnect();
      if (soundRef.current) {
        soundRef.current.unload();
      }
    };
  }, [userId, topicId, navigate, resetActivityTimer, onTopicImage]);

  useEffect(() => {
    if (listeningStage === "question_text" && mode === "listening-mode") {
      setIsContextCompleted(false);
      setHasStartedContextAudio(false);
    }
  }, [listeningStage, mode]);

  const scrollToBottom = () =>
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendPlaceholder = () => {
    logger.info("Adding AI thinking placeholder to UI.");
    setMessages((prev) => [
      ...prev,
      {
        id: `loading-${Date.now()}`,
        loading: true,
        messageType: "loading",
        type: "received",
      },
    ]);
  };
  const removeLoadingMessage = () => {
    logger.info("Removing AI thinking placeholder from UI.");
    setMessages((prev) => prev.filter((m) => !m.loading));
  };

  const blobToBase64 = (blob: Blob): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () =>
        reader.result
          ? resolve((reader.result as string).split(",")[1])
          : reject("Blob read failed");
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });

  const cleanupRecording = () => {
    if (recordTimerRef.current) clearInterval(recordTimerRef.current);
    if (streamRef.current)
      streamRef.current.getTracks().forEach((track) => track.stop());
    setIsRecording(false);
    setRecordTime(0);
    streamRef.current = null;
    mediaRecorderRef.current = null;
    lastRecordingEndTimeRef.current = Date.now();
  };

  const startRecording = async () => {
    logger.info("Start recording requested.");
    // Reset inactivity timer when user starts recording
    resetInactivityTimer();

    if (chatCompleted || isSessionExpired) {
      toast.warning(
        isSessionExpired
          ? "Session time is over. You cannot send more messages."
          : "Cannot record: The chat session is complete.",
      );
      return;
    }

    if (isIOS() && lastRecordingEndTimeRef.current) {
      const timeSinceLast = Date.now() - lastRecordingEndTimeRef.current;
      if (timeSinceLast < 1000) {
        logger.info(`iOS cooldown active: waiting ${1000 - timeSinceLast}ms`);
        await new Promise((resolve) =>
          setTimeout(resolve, 1000 - timeSinceLast),
        );
      }
    }

    try {
      logger.info("Requesting user media...");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType = getSupportedMimeType();
      if (!mimeType) {
        toast.error(
          "Your browser does not support any of the required audio formats.",
        );
        logger.error("No supported MIME type found for MediaRecorder.");
        cleanupRecording();
        return;
      }
      logger.info(`Using supported MIME type: ${mimeType}`);

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];
      isCanceledRef.current = false;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = async () => {
        const wasCanceled = isCanceledRef.current;
        cleanupRecording();

        if (wasCanceled) {
          logger.info("Recording canceled by user.");
          return;
        }
        if (audioChunksRef.current.length === 0) {
          logger.error("No audio chunks recorded, stopping.");
          toast.error("No audio was captured. Please try again.");
          return;
        }

        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        if (audioBlob.size < 200) {
          logger.error(`Recorded blob is too small (${audioBlob.size} bytes).`);
          toast.error("Recording was too short. Please try again.");
          return;
        }

        const audioURL = URL.createObjectURL(audioBlob);
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            type: "sent",
            messageType: "audio",
            audioURL,
          },
        ]);

        sendPlaceholder();
        setIsWaitingForResponse(true);
        const audioBase64 = await blobToBase64(audioBlob);
        const format = mimeType.split("/")[1].split(";")[0];
        const payload = { userId, chatId, audioBuffer: audioBase64, format };
        socketRef.current?.emit(ChatEvents.AUDIO, payload);
        resetActivityTimer();
        resetInactivityTimer();
        if (onUserAction) onUserAction();
      };

      recorder.onerror = (event) => {
        logger.error("MediaRecorder error:", event);
        toast.error("An unknown error occurred during recording.");
        cleanupRecording();
      };

      recorder.start();
      setIsRecording(true);
      recordTimerRef.current = setInterval(
        () => setRecordTime((t) => t + 1),
        1000,
      );
    } catch (err: any) {
      logger.error("CRITICAL: Error starting recording:", {
        name: err.name,
        message: err.message,
      });
      let errorMessage = "An unknown microphone error occurred.";
      if (
        err.name === "NotAllowedError" ||
        err.name === "PermissionDeniedError"
      ) {
        errorMessage =
          "Microphone access denied. Please enable it in your browser settings.";
      } else if (
        err.name === "NotFoundError" ||
        err.name === "DevicesNotFoundError"
      ) {
        errorMessage =
          "No microphone found. Please connect a microphone and try again.";
      } else if (
        err.name === "NotReadableError" ||
        err.name === "TrackStartError"
      ) {
        errorMessage =
          "Your microphone is already in use by another application.";
      }
      toast.error(errorMessage);
      cleanupRecording();
    }
  };

  const submitFinalAnswers = (finalAnswers: { [key: string]: number }) => {
    if (!socketRef.current || !chatId) {
      toast.error("Connection issue, cannot submit final answers.");
      return;
    }

    const answers: McqAnswer[] = Object.entries(finalAnswers).map(
      ([questionId, answerIndex]) => ({
        questionId,
        answerIndex,
      }),
    );

    const payload = { chatId, answers };
    logger.emitting(ChatEvents.SUBMIT_MCQS, payload);
    socketRef.current.emit(ChatEvents.SUBMIT_MCQS, payload);
  };

  const handleSubmitAnswer = () => {
    // Reset inactivity timer when user submits MCQ answer
    resetInactivityTimer();

    if (selectedAnswer === null) {
      toast.warning("Please select an answer.");
      return;
    }
    const currentQuestion = mcqList[currentMcqIndex];
    if (!currentQuestion) {
      toast.error("An error occurred. Could not find current question.");
      return;
    }

    const isCorrect = selectedAnswer === currentQuestion.correct;

    if (isCorrect) {
      toast.success("Correct!", { duration: 2000 });
      const newAnswers = {
        ...mcqAnswers,
        [currentQuestion.id]: selectedAnswer,
      };
      setMcqAnswers(newAnswers);
      setSelectedAnswer(null);

      // move to next question or finish
      if (currentMcqIndex < mcqList.length - 1) {
        setCurrentMcqIndex(currentMcqIndex + 1);
      } else {
        // Last question answered correctly
        submitFinalAnswers(newAnswers);
        toast.success("🎉 Listening practice completed!", {
          description: "Great job!",
          duration: 4000,
        });
        setChatCompleted(true);
        setIsCompleteDialogOpen(true);
      }
    } else {
      // incorrect answer
      toast.error("Not quite, try again!", {
        description: "Listen to the audio again for a hint.",
        duration: 3000,
      });
      setShowReplayPopup(true);
    }
  };

  const handleQuestionnaireSubmit = (answers: {
    [questionId: string]: number;
  }) => {
    // Reset inactivity timer when user submits questionnaire
    resetInactivityTimer();

    const mcqAnswers: McqAnswer[] = Object.entries(answers).map(
      ([questionId, answerIndex]) => ({
        questionId,
        answerIndex,
      }),
    );
    if (!chatId) {
      console.log("Chat ID is not available. Cannot submit MCQs.");
      return;
    }
    const payload = { chatId, answers: mcqAnswers };
    logger.emitting(ChatEvents.SUBMIT_MCQS, payload);
    socketRef.current?.emit(ChatEvents.SUBMIT_MCQS, payload);
  };

  const stopRecording = async (cancel = false) => {
    logger.info(`Stopping recording. Cancel: ${cancel}`);
    isCanceledRef.current = cancel;
    if (mediaRecorderRef.current?.state === "recording") {
      if (!cancel && isIOS()) {
        logger.info("iOS: Forcing requestData() before stop.");
        mediaRecorderRef.current.requestData();
        await new Promise((resolve) => setTimeout(resolve, 200));
      }
      mediaRecorderRef.current.stop();
    } else cleanupRecording();
  };

  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);

  const clearInactivityTimer = () => {
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
      inactivityTimerRef.current = null;
      logger.info("Inactivity timer cleared");
    }
  };

  const startInactivityTimer = () => {
    // Don't start inactivity timer for listening mode since it doesn't have text/audio inputs
    if (mode === "listening-mode") {
      logger.info("Skipping inactivity timer for listening mode");
      return;
    }

    clearInactivityTimer();
    inactivityTimerRef.current = setTimeout(
      () => {
        if (socketRef.current && userId && topicId && chatId) {
          logger.info(
            "No user response for 2 minutes, emitting no_user_response",
          );
          sendPlaceholder();
          socketRef.current.emit("no_user_response", {
            userId,
            topicId,
            chatId,
          });
        }
      },
      2 * 60 * 1000,
    );
    logger.info("Inactivity timer started (2 minutes)");
  };

  const resetInactivityTimer = () => {
    logger.info("User activity detected - resetting inactivity timer");
    clearInactivityTimer();

    // Only restart if we're not in listening mode
    if (mode !== "listening-mode") {
      startInactivityTimer();
    }
  };

  useEffect(() => {
    if (message.trim()) {
      resetInactivityTimer();
    }
  }, [message]);

  useEffect(() => {
    const lastMsg = messages[messages.length - 1];
    if (
      lastMsg &&
      lastMsg.type === "received" &&
      lastMsg.messageType === "text" &&
      !lastMsg.loading
    ) {
      startInactivityTimer();
    }

    return () => {
      clearInactivityTimer();
    };
  }, [messages]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    logger.info("Form submitted.");

    // if (isSessionExpired) {
    //   logger.error("Cannot send message: session expired.");
    //   return;
    // }

    if (!message.trim() || !isSocketConnected || isWaitingForResponse) {
      logger.error("Cannot send message.", {
        message: message.trim(),
        isSocketConnected,
      });
      return;
    }
    setIsWaitingForResponse(true);
    setMessages((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        type: "sent",
        messageType: "text",
        text: message.trim(),
      },
    ]);
    sendPlaceholder();
    const payload = { userId, chatId, textMessage: message.trim() };
    logger.emitting(ChatEvents.TEXT, payload);
    socketRef.current?.emit(ChatEvents.TEXT, payload);
    setMessage("");
    resetActivityTimer();
    resetInactivityTimer();
    if (onUserAction) onUserAction();
  };

  // --- MODIFIED: Autoplay logic using Howler ---
  useEffect(() => {
    if (
      mode !== "listening-mode" ||
      !listeningStage ||
      hasAutoplayedStage === listeningStage ||
      listeningStage === "quiz"
    )
      return;

    let audioId: string;
    let audioUrl: string | undefined;
    let completionSetter: (value: boolean) => void;

    if (
      (listeningStage === "initial" || listeningStage === "question_text") &&
      listeningData?.kbAudioUrl
    ) {
      audioId = "kb-audio";
      audioUrl = listeningData.kbAudioUrl;
      completionSetter = setIsContextCompleted;
    } else {
      return;
    }

    if (audioUrl && isAudioUnlocked && !isIOS()) {
      logger.info(`Autoplaying context audio for stage: ${listeningStage}`);
      toggleAudio(audioId, audioUrl, () => completionSetter(true));

      setHasAutoplayedStage(listeningStage);
    } else if (isIOS()) {
      toast.info("Tap the play button to start audio on this device.");
      setHasAutoplayedStage(listeningStage);
    }
  }, [
    listeningStage,
    listeningData,
    isAudioUnlocked,
    hasAutoplayedStage,
    mode,
  ]);

  const clearAudioProgress = () => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
    setAudioProgress(0);
    setAudioDuration(0);
  };

  const toggleAudio = (
    id: string,
    audioUrl: string | undefined,
    onEnd?: () => void,
  ) => {
    if (!audioUrl) return;

    // Reset inactivity timer when user interacts with audio
    resetInactivityTimer();

    if (soundRef.current && playingAudioId === id) {
      if (soundRef.current.playing()) {
        soundRef.current.pause();
        setIsCurrentlyPlaying(false);
      } else {
        soundRef.current.play();
        setIsCurrentlyPlaying(true);
        if (id === "kb-audio" && mode === "listening-mode") {
          onEndCalledRef.current = false;
        }
      }
      return;
    }

    if (soundRef.current) {
      soundRef.current.off();
      soundRef.current.stop();
    }

    setPlayingAudioId(id);
    setIsCurrentlyPlaying(false);
    setLoadingAudioId(id);
    clearAudioProgress();
    onEndCalledRef.current = false;

    const isBlob: boolean = audioUrl.startsWith("blob:");
    let format: string | undefined;
    if (isBlob) {
      const mimeType: string | undefined = getSupportedMimeType();
      if (mimeType) {
        format = mimeType.split("/")[1]?.split(";")[0];
      }
      if (!format) {
        format = "webm";
      }
    }

    const sound = new Howl({
      src: [audioUrl],
      html5: true,
      ...(format ? { format: [format] } : {}),
      onplay: () => {
        setPlayingAudioId(id);
        setIsCurrentlyPlaying(true);
        setLoadingAudioId(null);
        if (id === "kb-audio" && mode === "listening-mode") {
          setHasStartedContextAudio(true);
          onEndCalledRef.current = false;
        }
        setAudioDuration(sound.duration());
        if (progressIntervalRef.current)
          clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = setInterval(() => {
          const seek = sound.seek() || 0;
          setAudioProgress(seek);
          if (
            seek >= sound.duration() - 0.1 &&
            onEnd &&
            !onEndCalledRef.current
          ) {
            onEndCalledRef.current = true;
            onEnd();
            if (progressIntervalRef.current) {
              clearInterval(progressIntervalRef.current as unknown as number);
            }
            progressIntervalRef.current = null;
          }
        }, 100);
      },
      onpause: () => {
        if (progressIntervalRef.current)
          clearInterval(progressIntervalRef.current);
        setPlayingAudioId((prev) => {
          if (prev === id) setIsCurrentlyPlaying(false);
          return prev;
        });
        if (id === "kb-audio" && mode === "listening-mode") {
          setIsContextCompleted(false);
          setHasStartedContextAudio(false);
        }
      },
      onstop: () => {
        setPlayingAudioId((prev) => {
          if (prev === id) {
            setIsCurrentlyPlaying(false);
            setLoadingAudioId(null);
            return null;
          }
          return prev;
        });
        clearAudioProgress();
        if (id === "kb-audio" && mode === "listening-mode") {
          setHasStartedContextAudio(false);
          setIsContextCompleted(false);
        }
      },
      onend: () => {
        setPlayingAudioId((prev) => {
          if (prev === id) {
            setIsCurrentlyPlaying(false);
            setLoadingAudioId(null);
            return null;
          }
          return prev;
        });
        clearAudioProgress();
        if (onEnd && !onEndCalledRef.current) {
          onEndCalledRef.current = true;
          onEnd();
        }
      },
      onload: () => {
        setAudioDuration(sound.duration());
      },
      onloaderror: (soundId: number, error: any) => {
        logger.error("Howler load error:", { soundId, error });
        toast.error("Could not load audio.");
        setPlayingAudioId((prev) => {
          if (prev === id) {
            setIsCurrentlyPlaying(false);
            setLoadingAudioId(null);
            return null;
          }
          return prev;
        });
        clearAudioProgress();
      },
      onplayerror: (soundId: number, error: any) => {
        logger.error("Howler play error:", { soundId, error });
        toast.error("Could not play audio.");
        setPlayingAudioId((prev) => {
          if (prev === id) {
            setIsCurrentlyPlaying(false);
            setLoadingAudioId(null);
            return null;
          }
          return prev;
        });
        clearAudioProgress();
      },
    });

    sound.play();
    soundRef.current = sound;
  };

  const handleNextStage = () => {
    // Reset inactivity timer when user clicks next
    resetInactivityTimer();

    if (socketRef.current && userId && topicId && chatId) {
      const payload = { userId, topicId, chatId };
      logger.emitting(ChatEvents.NEXT_STAGE, payload);
      socketRef.current.emit(ChatEvents.NEXT_STAGE, payload);

      // If we are on the hint screen, we wait for the MCQ_LIST event.
      // Otherwise, we reload to get the next stage (the hint screen).
      if (mode === "listening-mode" && socketRef.current && chatId) {
        logger.emitting("next_listening_stage", { chatId });
        socketRef.current.emit("next_listening_stage", { chatId });
        toast.info("Loading next part...");
        return;
      }
      if (listeningStage === "question_text") {
        toast.info("Loading quiz...");
      } else {
        toast.info("Loading next part...");
        setTimeout(() => {
          window.location.reload();
        }, 500); // Small delay to ensure event is sent
      }
    } else {
      toast.error("Cannot proceed to next stage. Connection issue.");
      logger.error("Could not emit next_stage", {
        socket: !!socketRef.current,
        userId,
        topicId,
        chatId,
      });
    }
  };

  const handleResetChat = () => {
    logger.info("Handling chat reset - disconnecting and reconnecting socket.");
    if (!socketRef.current) return toast.error("Socket not available.");

    // First disconnect the socket
    socketRef.current.disconnect();

    // Wait a moment then reconnect and emit reset
    setTimeout(() => {
      if (socketRef.current) {
        socketRef.current.connect();

        // Wait for connection to be established
        socketRef.current.on("connect", () => {
          const payload = { userId, topicId };
          logger.emitting(ChatEvents.RESET_CHAT, payload);
          socketRef.current?.emit(ChatEvents.RESET_CHAT, payload);

          setMessages([]);
          setChatCompleted(false);
          setIsCompleteDialogOpen(false);
          setPlayingAudioId(null);
          toast.info("Resetting chat session...");

          setTimeout(() => {
            window.location.reload();
          }, 1000);
        });
      }
    }, 500);
  };

  const handleStillThere = (isContinuing: boolean) => {
    setIsInactiveDialogOpen(false);
    logger.info(
      `User responded to inactivity dialog. Continuing: ${isContinuing}`,
    );
    if (isContinuing) {
      logger.info("Reconnecting socket due to user confirmation.");
      socketRef.current?.connect();
    } else {
      navigate(-1);
    }
  };

  const handleContentFilterWarningAcknowledge = () => {
    logger.info(
      "User acknowledged content filter warning. Reconnecting socket.",
    );
    setIsContentFilterWarningOpen(false);
    socketRef.current?.connect();
  };

  const handleLogout = () => {
    logger.info("Logging out user due to account block.");
    localStorage.removeItem("AiTutorUser");
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    if (socketRef.current) {
      socketRef.current.disconnect();
    }
    window.location.href = "/login";
  };

  const formatTime = (sec: number) =>
    `${String(Math.floor(sec / 60)).padStart(2, "0")}:${String(
      sec % 60,
    ).padStart(2, "0")}`;

  return (
    // The JSX part remains largely the same, only the audio player logic needs updates.
    <>
      {mode === "listening-mode" && (
        <>
          <style>{`
            .gradient-hover-animate {
              background: linear-gradient(to right, #3EA4F9 0%, #0267B5 50%, #3EA4F9 100%);
              background-size: 200% 100%;
              background-position: 0% 50%;
              transition: background-position 0.6s ease;
            }
            .gradient-hover-animate:hover {
              background-position: 100% 50%;
            }
          `}</style>
          <div className="w-full max-w-[800px] mx-auto space-y-4 border border-[#058BF4] p-4 rounded-xl bg-white/70 backdrop-blur mb-4">
            <Progress
              value={progress}
              className="h-2 bg-[#D9ECFD]"
              indicatorClassName="bg-[linear-gradient(90deg,#3EA4F9_0%,#0267B5_50%,#3EA4F9_100%)]"
            />

            <div className="flex items-center justify-between">
              <span className="font-medium text-[#058BF4]">
                Step {listeningSteps}/3
              </span>
              <span className="flex items-center gap-1 px-3 py-1.5 rounded-lg border-2 border-[#3EA4F9] bg-white text-[#058BF4]">
                <Clock className="h-6 w-6 text-[#3EA4F9]" />
                <span>
                  {sessionTimeRemaining !== null
                    ? formatTime(sessionTimeRemaining)
                    : "..."}
                </span>
              </span>
            </div>

            {/* compact controls */}
            <div>
              <AudioPlayer
                audioSrc={listeningData?.kbAudioUrl || ""}
                isPlaying={playingAudioId === "kb-audio" && isCurrentlyPlaying}
                isLoading={loadingAudioId === "kb-audio"}
                progress={playingAudioId === "kb-audio" ? audioProgress : 0}
                duration={playingAudioId === "kb-audio" ? audioDuration : 0}
                variant="gradient"
                showTotal={true}
                onTogglePlay={() =>
                  toggleAudio("kb-audio", listeningData?.kbAudioUrl, () =>
                    setIsContextCompleted(true),
                  )
                }
              />
              {mode === "listening-mode" && (
                <div className="flex justify-end items-center h-4 pr-2 mt-2 md:mt-0">
                  {!hasStartedContextAudio ? (
                    <span className="text-[#058BF4] text-xs flex items-center gap-1 animate-pulse">
                      ▶ Play to proceed to next step
                    </span>
                  ) : !isContextCompleted ? (
                    <span className="text-orange-500 text-xs flex items-center gap-1">
                      <span className="animate-spin duration-1500">⏳</span>
                      Listening...
                    </span>
                  ) : (
                    <span className="text-green-500 text-xs flex items-center gap-1">
                      ✓ Completed
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
          <Dialog open={showReplayPopup} onOpenChange={setShowReplayPopup}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>That's not quite right</DialogTitle>
                <DialogDescription>
                  Would you like to listen to the audio again for a hint before
                  you try again?
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="gap-2 sm:justify-center">
                <Button
                  onClick={() => {
                    if (listeningData?.kbAudioUrl) {
                      toggleAudio("kb-audio", listeningData.kbAudioUrl, () =>
                        setIsContextCompleted(true),
                      );
                    }
                    setShowReplayPopup(false);
                  }}
                >
                  Replay Audio
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}

      <Dialog
        open={isCompleteDialogOpen}
        onOpenChange={(open) => !open && navigate(-1)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {mode === "listening-mode"
                ? "Practice Complete"
                : "Chat Completed"}
            </DialogTitle>
            <DialogDescription>
              {mode === "listening-mode"
                ? "Great job! You've successfully completed the listening exercise."
                : "This conversation has ended. Would you like to start over?"}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => navigate(-1)}>
              End Session
            </Button>
            <Button onClick={handleResetChat}>Reset Chat</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {listeningStage === "quiz" && mcqList.length > 0 && (
        <div className="w-full flex flex-col items-center gap-4">
          <div className="p-6 md:p-8 border rounded-3xl bg-white shadow-lg w-full max-w-[820px] mt-4 mb-2 text-left">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-[#E6F3FF] flex items-center justify-center">
                  <Check className="h-5 w-5 text-[#3EA4F9]" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-[#6B8BB8] uppercase tracking-wide">
                    Step 4: Quiz
                  </p>
                  <p className="text-lg font-semibold text-[#2B3A67]">
                    Test Your Knowledge
                  </p>
                </div>
              </div>
              <span className="text-xs font-semibold text-[#6B8BB8] bg-[#F1F6FF] px-3 py-1 rounded-full">
                {currentMcqIndex + 1}/{mcqList.length}
              </span>
            </div>
            <p className="text-lg font-semibold mb-4 text-[#2B3A67]">
              {mcqList[currentMcqIndex].question}
            </p>
            <div className="flex flex-col gap-2">
              {mcqList[currentMcqIndex].options.map(
                (option: string, index: number) => (
                  <Button
                    key={index}
                    variant={selectedAnswer === index ? "default" : "outline"}
                    onClick={() => {
                      setSelectedAnswer(index);
                      resetInactivityTimer();
                    }}
                    className={`w-full justify-start p-4 h-auto transition-colors rounded-2xl ${
                      selectedAnswer === index
                        ? "bg-[#3EA4F9] text-white hover:bg-[#2F93F0] border-transparent"
                        : "bg-white border-[#E1E7F0] text-[#2B3A67]"
                    }`}
                  >
                    <div
                      className={`w-5 h-5 mr-4 rounded-full border flex-shrink-0 ${
                        selectedAnswer === index
                          ? "bg-white border-white"
                          : "border-[#C9D6E6]"
                      }`}
                    />
                    <span>{option}</span>
                  </Button>
                ),
              )}
            </div>
          </div>
        </div>
      )}

      {listeningStage !== "quiz" && (
        <div
          className={`flex flex-col max-w-[800px] mx-auto bg-gray-100 rounded-xl overflow-hidden shadow-2xl ${
            mode === "listening-mode"
              ? "min-h-[49vh] max-h-[49vh]"
              : "max-h-[86vh] min-h-[86vh] md:min-h-[82vh] md:max-h-[82vh]"
          }`}
        >
          {mode !== "listening-mode" && (
            <header className="flex justify-between items-center px-6 py-4 border-b bg-white">
              <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <h2 className="text-lg font-semibold">
                {mode === "photo-mode"
                  ? "Photo Mode"
                  : mode === "reading-mode"
                    ? "Reading Mode"
                    : mode === "roleplay-mode"
                      ? "Roleplay Mode"
                      : mode === "debate-mode"
                        ? "Debate Mode"
                        : mode === "curriculum-mode"
                          ? "Curriculum Mode"
                          : "Chat Mode"}
              </h2>
              <div className="flex items-center gap-4">
                {mode === "curriculum-mode" && (
                  <Button
                    variant="outline"
                    onClick={() => setIsResetConfirmOpen(true)}
                    className="flex items-center gap-2 px-4 py-0 w-[132px] h-[40px] border-[#06CCB5] text-[#06CCB5] hover:text-[#06CCB5] hover:bg-[#06CCB5]/10 rounded-[10px] shadow-[0px_0px_4px_0px_rgba(0,0,0,0.25)] border-[1px]"
                    style={{
                      height: "40px",
                      boxSizing: "border-box",
                    }}
                  >
                    <RotateCcw className="h-5 w-5" />
                    <span className="font-medium">Reset Chat</span>
                  </Button>
                )}
                <div className="flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg border-2 border-[#3EA4F9] bg-white text-gray-500">
                  <Clock className="h-6 w-6 text-[#3EA4F9]" />
                  <span>
                    {sessionTimeRemaining !== null
                      ? formatTime(sessionTimeRemaining)
                      : "..."}
                  </span>
                </div>
              </div>
            </header>
          )}

          <div className="md:hidden">
            {mode === "photo-mode" && topicImage && (
              <div className="p-4">
                <img
                  src={topicImage}
                  alt="Topic context"
                  className="w-full rounded-lg object-top object-cover max-h-48"
                />
              </div>
            )}
          </div>
          {isSessionExpired && (
            <div className="bg-yellow-500 text-white text-center p-2 text-sm font-semibold">
              You have reached your session limit.
            </div>
          )}
          {chatCompleted && !isCompleteDialogOpen && (
            <div className="bg-primary/80 backdrop-blur-sm text-white text-center p-2 text-sm font-semibold">
              This conversation has ended.
            </div>
          )}
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
            {contentPayload && mode === "reading-mode" && (
              <ReadingPassageCard
                content={contentPayload.content}
                audioUrl={contentPayload.audioUrl}
                readingPresentation={contentPayload.readingPresentation}
                isPlaying={
                  playingAudioId === "content-payload-audio" &&
                  isCurrentlyPlaying
                }
                onToggleAudio={() =>
                  toggleAudio("content-payload-audio", contentPayload.audioUrl)
                }
              />
            )}
            {contentPayload && mode !== "reading-mode" && (
              <div className="p-4 rounded-lg shadow-sm bg-white border border-gray-200">
                <p
                  ref={contentRef}
                  className={`text-gray-800 text-base leading-relaxed whitespace-pre-wrap transition-all duration-300 ${
                    !isContentExpanded ? "line-clamp-3" : "line-clamp-none"
                  }`}
                >
                  {contentPayload.content
                    .split(/(\*\*.*?\*\*)/g)
                    .map((part, i) =>
                      part.startsWith("**") && part.endsWith("**") ? (
                        <span key={i} className="font-bold text-[#058BF4]">
                          {part.slice(2, -2)}
                        </span>
                      ) : (
                        part
                      ),
                    )}
                </p>
                <div className="flex items-center gap-4 mt-2">
                  {contentPayload.audioUrl && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        toggleAudio(
                          "content-payload-audio",
                          contentPayload.audioUrl,
                        )
                      }
                    >
                      {playingAudioId === "content-payload-audio" &&
                      isCurrentlyPlaying ? (
                        <Pause className="h-5 w-5" />
                      ) : (
                        <Play className="h-5 w-5" />
                      )}
                    </Button>
                  )}
                  {shouldShowExpandButton && (
                    <Button
                      variant="link"
                      size="sm"
                      onClick={() => {
                        setIsContentExpanded(!isContentExpanded);
                        resetInactivityTimer();
                      }}
                      className="text-sm text-[#058BF4] p-0 h-auto"
                    >
                      {isContentExpanded ? "See Less" : "See More"}
                    </Button>
                  )}
                </div>
              </div>
            )}
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col gap-1 ${
                  msg.type === "sent"
                    ? "self-end items-end"
                    : "self-start items-start"
                }`}
              >
                {msg.loading ? (
                  <div className="flex items-center gap-2 bg-white p-3 rounded-xl shadow-sm">
                    <LoaderPinwheel
                      size={18}
                      className="animate-spin text-primary"
                    />
                    <span className="text-sm text-gray-500">
                      AI is thinking...
                    </span>
                  </div>
                ) : msg.messageType === "audio" && (msg.audioURL || msg.audioUrl) ? (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => toggleAudio(msg.id, msg.audioURL || msg.audioUrl)}
                  >
                    {playingAudioId === msg.id ? (
                      isCurrentlyPlaying ? (
                        <Pause className="h-5 w-5" />
                      ) : loadingAudioId === msg.id ? (
                        <LoaderPinwheel className="h-5 w-5 animate-spin text-primary" />
                      ) : (
                        <Play className="h-5 w-5" />
                      )
                    ) : (
                      <Play className="h-5 w-5" />
                    )}
                  </Button>
                ) : msg.type === "sent" ? (
                  <div className="p-3 rounded-xl max-w-md shadow-sm break-words bg-[#3EA4F9] text-white rounded-tr-none">
                    {msg.text && (
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">
                        {msg.text.split(/(\*\*.*?\*\*)/g).map((part, i) =>
                          part.startsWith("**") && part.endsWith("**") ? (
                            <span key={i} className="font-bold text-white">
                              {part.slice(2, -2)}
                            </span>
                          ) : (
                            part
                          ),
                        )}
                      </p>
                    )}
                    {msg.hasAssessment && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          onShowFeedback({
                            type: "assessment",
                            content: msg.assessments,
                          });
                          resetInactivityTimer();
                        }}
                        className="flex items-center gap-1 bg-white text-primary text-xs p-1 h-auto rounded-md shadow-sm border mt-2"
                      >
                        <BarChart2 className="h-4 w-4" />
                        View Assessment
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {mode === "listening-mode" &&
                    listeningStage === "question_text" ? (
                      <HintBubble
                        title="Hint"
                        icon={Info}
                        timestamp={getDisplayTime()}
                        content={
                          msg.text ? (
                            <p className="text-sm leading-relaxed whitespace-pre-wrap">
                              {msg.text.split(/(\*\*.*?\*\*)/g).map((part, i) =>
                                part.startsWith("**") && part.endsWith("**") ? (
                                  <span
                                    key={i}
                                    className="font-bold text-[#058BF4]"
                                  >
                                    {part.slice(2, -2)}
                                  </span>
                                ) : (
                                  part
                                ),
                              )}
                            </p>
                          ) : (
                            ""
                          )
                        }
                      />
                    ) : (
                      <div className="p-3 rounded-xl max-w-md shadow-sm break-words bg-white text-gray-800 rounded-tl-none">
                        {msg.text && (
                          <p className="text-sm leading-relaxed whitespace-pre-wrap">
                            {msg.text.split(/(\*\*.*?\*\*)/g).map((part, i) =>
                              part.startsWith("**") && part.endsWith("**") ? (
                                <span
                                  key={i}
                                  className="font-bold text-[#058BF4]"
                                >
                                  {part.slice(2, -2)}
                                </span>
                              ) : (
                                part
                              ),
                            )}
                          </p>
                        )}

                        <div className="flex gap-2 items-center mt-2 flex-wrap">
                          {(msg.audioUrl || msg.audioURL) && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() =>
                                toggleAudio(msg.id, msg.audioUrl || msg.audioURL)
                              }
                            >
                              {playingAudioId === msg.id ? (
                                isCurrentlyPlaying ? (
                                  <Pause className="h-5 w-5" />
                                ) : loadingAudioId === msg.id ? (
                                  <LoaderPinwheel className="h-5 w-5 animate-spin text-primary" />
                                ) : (
                                  <Play className="h-5 w-5" />
                                )
                              ) : (
                                <Play className="h-5 w-5" />
                              )}
                            </Button>
                          )}
                          {msg.hasFeedback && (
                            <Button
                              id="tour-chat-feedback"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                onShowFeedback({
                                  type: "feedback",
                                  content: msg.feedback,
                                });
                                resetInactivityTimer();
                              }}
                              className="flex items-center gap-1 text-primary text-xs p-1 h-auto"
                            >
                              <MessageCircle className="h-4 w-4" />
                              View Feedback
                            </Button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {mode !== "listening-mode" && (
            <form id="tour-chat-input" onSubmit={handleSubmit} className="border-t p-4 bg-gray-50">
              <div className="flex items-center bg-white rounded-full px-4 py-1 shadow-sm">
                <Input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={
                    isRecording
                      ? `Recording... ${formatTime(recordTime)}`
                      : "Write a message or press mic..."
                  }
                  disabled={
                    isRecording ||
                    chatCompleted ||
                    // isSessionExpired ||
                    !isSocketConnected ||
                    isWaitingForResponse
                  }
                  className="flex-1 border-none focus:ring-0 bg-transparent"
                />
                {isRecording ? (
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => stopRecording(true)}
                      className="text-red-500 hover:bg-red-100 rounded-full"
                    >
                      <X className="h-5 w-5" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => stopRecording(false)}
                      className="text-green-500 hover:bg-green-100 rounded-full"
                    >
                      <ArrowUp className="h-5 w-5" />
                    </Button>
                  </div>
                ) : message.trim() ? (
                  <Button
                    type="submit"
                    variant="ghost"
                    size="icon"
                    className="text-primary"
                    disabled={
                      !isSocketConnected ||
                      chatCompleted ||
                      // isSessionExpired ||
                      isWaitingForResponse
                    }
                  >
                    <Send className="h-5 w-5" />
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-primary"
                    onClick={startRecording}
                    disabled={
                      !isSocketConnected ||
                      chatCompleted ||
                      // isSessionExpired ||
                      isWaitingForResponse
                    }
                  >
                    <Mic className="h-5 w-5" />
                  </Button>
                )}
              </div>
            </form>
          )}
          <Dialog
            open={isResetConfirmOpen}
            onOpenChange={setIsResetConfirmOpen}
          >
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Reset Chat Session?</DialogTitle>
                <DialogDescription>
                  This will clear all current messages and restart the chat from
                  the beginning. This action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsResetConfirmOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    setIsResetConfirmOpen(false);
                    handleResetChat();
                  }}
                >
                  Confirm Reset
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Dialog
            open={isInactiveDialogOpen}
            onOpenChange={(open) => !open && handleStillThere(false)}
          >
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Are you still there?</DialogTitle>
                <DialogDescription>
                  Your session was paused due to inactivity. Do you want to
                  continue?
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => handleStillThere(false)}
                >
                  No, End Session
                </Button>
                <Button onClick={() => handleStillThere(true)}>
                  Yes, I'm Here
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Dialog open={isBadgeModalOpen} onOpenChange={setIsBadgeModalOpen}>
            <DialogContent className="sm:max-w-md text-center">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold flex items-center justify-center gap-2">
                  <Award className="h-7 w-7 text-yellow-500" />
                  Badge Unlocked!
                </DialogTitle>
                <DialogDescription className="text-center pt-2">
                  Congratulations! You've earned a new badge for your progress.
                </DialogDescription>
              </DialogHeader>
              {unlockedBadgeInfo && (
                <div className="flex flex-col items-center justify-center p-4 my-4 bg-gray-50 rounded-lg">
                  <img
                    src={unlockedBadgeInfo.iconUrl}
                    alt={unlockedBadgeInfo.name}
                    className="w-24 h-24 mb-4 drop-shadow-lg"
                  />
                  <h3 className="text-xl font-semibold text-primary">
                    {unlockedBadgeInfo.name}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {unlockedBadgeInfo.description}
                  </p>
                  <p className="text-lg font-bold text-yellow-600 mt-4">
                    +{unlockedBadgeInfo.pointValue} Points
                  </p>
                </div>
              )}
              <DialogFooter className="sm:justify-center">
                <Button
                  onClick={() => setIsBadgeModalOpen(false)}
                  className="w-full"
                >
                  Claim & Continue
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Dialog
            open={isDuplicateConnectionModalOpen}
            onOpenChange={setIsDuplicateConnectionModalOpen}
          >
            <DialogContent className="sm:max-w-md text-center">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold text-red-600">
                  Duplicate Session Detected
                </DialogTitle>
                <DialogDescription className="text-center pt-2">
                  You are already connected from another session. Please logout
                  from other sessions and try again.
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-col items-center justify-center p-4 my-4 bg-red-50 rounded-lg border border-red-200">
                <div className="w-16 h-16 mb-4 bg-red-100 rounded-full flex items-center justify-center">
                  <X className="h-8 w-8 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-red-700 mb-2">
                  Connection Blocked
                </h3>
                <p className="text-sm text-red-600 text-center">
                  Only one active session is allowed per account. Please close
                  other browser tabs or devices where you're logged in.
                </p>
              </div>
              <DialogFooter className="sm:justify-center space-y-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsDuplicateConnectionModalOpen(false);
                    navigate("/login");
                  }}
                  className="w-full"
                >
                  Go to Login
                </Button>
                <Button
                  onClick={() => {
                    setIsDuplicateConnectionModalOpen(false);
                    window.location.reload();
                  }}
                  className="w-full"
                >
                  Try Again
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Dialog
            open={isContentFilterWarningOpen}
            onOpenChange={(open) => {
              // Prevent closing the modal by clicking outside or pressing ESC
              // Only allow closing via the "I Understand" button which reconnects the socket
              if (!open) {
                return;
              }
            }}
          >
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                  <AlertTriangle className="h-7 w-7" />
                  Content Policy Warning
                </DialogTitle>
                <DialogDescription className="text-center pt-2">
                  Your message has been flagged for policy violation.
                </DialogDescription>
              </DialogHeader>
              {contentFilterWarningData && (
                <div className="flex flex-col gap-4 p-4 my-4 bg-orange-50 rounded-lg border border-orange-200">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-800">
                      {contentFilterWarningData.message}
                    </p>
                    <div className="grid grid-cols-2 gap-3 pt-2 border-t border-orange-200">
                      <div>
                        <p className="text-xs text-gray-600 font-medium">
                          Violation Type
                        </p>
                        <p className="text-sm font-semibold text-orange-700">
                          {contentFilterWarningData.violationType}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 font-medium">
                          Severity
                        </p>
                        <p
                          className={`text-sm font-semibold ${
                            contentFilterWarningData.severity === "High"
                              ? "text-red-600"
                              : contentFilterWarningData.severity === "Medium"
                                ? "text-orange-600"
                                : "text-yellow-600"
                          }`}
                        >
                          {contentFilterWarningData.severity}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 font-medium">
                          Total Violations
                        </p>
                        <p className="text-sm font-semibold text-gray-800">
                          {contentFilterWarningData.violationCount}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 font-medium">
                          Warnings Remaining
                        </p>
                        <p className="text-sm font-semibold text-orange-700">
                          {contentFilterWarningData.remainingWarnings}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mt-2">
                    <p className="text-xs text-yellow-800">
                      ⚠️ Please review our content policy. Continued violations
                      may result in account suspension.
                    </p>
                  </div>
                </div>
              )}
              <DialogFooter className="sm:justify-center">
                <Button
                  onClick={handleContentFilterWarningAcknowledge}
                  className="w-full"
                >
                  I Understand
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <QuestionnaireModal
            open={isQueationnaireOpen}
            onClose={() => setIsQuestionnaireOpen(false)}
            onSubmit={handleQuestionnaireSubmit}
            mcqs={mcqList}
          />
        </div>
      )}

      <Dialog
        open={isAccountBlockedOpen}
        onOpenChange={(open) => {
          // Prevent closing the modal by clicking outside or pressing ESC
          // Only allow closing via the OK button which calls handleLogout
          if (!open) {
            // User tried to close, but we prevent it
            return;
          }
        }}
      >
        <DialogContent className="sm:max-w-md [&>button]:hidden">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-7 w-7" />
              Account Blocked
            </DialogTitle>
            <DialogDescription className="text-center pt-2">
              Your account has been suspended due to policy violations.
            </DialogDescription>
          </DialogHeader>
          {accountBlockedData && (
            <div className="flex flex-col gap-4 p-4 my-4 bg-red-50 rounded-lg border border-red-200">
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-800">
                  {accountBlockedData.message}
                </p>
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-red-200">
                  <div>
                    <p className="text-xs text-gray-600 font-medium">
                      Total Violations
                    </p>
                    <p className="text-sm font-semibold text-red-700">
                      {accountBlockedData.violationCount}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 font-medium">
                      Account Status
                    </p>
                    <p className="text-sm font-semibold text-red-700 uppercase">
                      {accountBlockedData.accountStatus}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-red-100 border border-red-300 rounded p-3 mt-2">
                <p className="text-xs text-red-800 font-medium">
                  ⛔ Your account access has been revoked. Please contact
                  support if you believe this is an error.
                </p>
              </div>
            </div>
          )}
          <DialogFooter className="sm:justify-center">
            <Button
              onClick={handleLogout}
              className="w-full bg-red-600 hover:bg-red-700 text-white"
            >
              OK
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {mode === "listening-mode" && (
        <div>
          <Button
            className="w-full mt-4 rounded-full p-5 bg-[#5EA9FF] hover:bg-[#4E98F0] text-white"
            onClick={() => {
              if (clickLocked.current) return;
              clickLocked.current = true;
              setTimeout(() => (clickLocked.current = false), 2000);

              (listeningStage === "quiz"
                ? handleSubmitAnswer
                : handleNextStage)();
            }}
            disabled={
              (mode === "listening-mode" &&
                (listeningStage === "initial" ||
                  listeningStage === "question_text") &&
                !isContextCompleted) ||
              (mode === "listening-mode" &&
                listeningStage === "quiz" &&
                selectedAnswer === null)
            }
          >
            {listeningStage === "quiz" ? "Submit Answer" : "Next"}
          </Button>
        </div>
      )}
    </>
  );
};

export default React.memo(ChatWindow);
