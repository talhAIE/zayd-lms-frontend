import { useEffect } from "react";
import type { Dispatch, MutableRefObject, SetStateAction } from "react";
import { toast } from "sonner";
import { io } from "socket.io-client";
import { attachSocketAuthRecovery, isSocketAuthRecovering } from '@/utils/socketAuthRecovery';
import {
  ChatEvents,
  findLastIndex,
  logger,
  normalizeListeningStage,
} from "./chat3d.shared";
import type { Message } from "./chat3d.shared";

type Setter<T = any> = Dispatch<SetStateAction<T>>;

interface UseChatWindow3DSocketParams {
  SOCKET_URL: string;
  userId: string;
  topicId: string;
  mode: string | null;
  isInactiveDialogOpen: boolean;
  navigate: (to: any) => void;
  socketRef: MutableRefObject<any>;
  activityTimerRef: MutableRefObject<NodeJS.Timeout | null>;
  listeningLoadingTimeoutRef: MutableRefObject<NodeJS.Timeout | null>;
  clickLocked: MutableRefObject<boolean>;
  listeningStageRef: MutableRefObject<string | null>;
  prefetchedQuizRef: MutableRefObject<boolean>;
  hasListeningStartedRef: MutableRefObject<boolean>;
  wantsQuizRef: MutableRefObject<boolean>;
  wantsHintsRef: MutableRefObject<boolean>;
  skipListeningCompletionStepRef: MutableRefObject<boolean>;
  sessionTimerBaseRef: MutableRefObject<{
    remainingSeconds: number;
    receivedAt: number;
  } | null>;
  sessionTimerLastEmittedRef: MutableRefObject<number | null>;
  onListeningStageChangeRef: MutableRefObject<
    | ((
        stage: string | null,
        data?: {
          kbAudioUrl?: string;
        },
      ) => void)
    | undefined
  >;
  resetActivityTimer: () => void;
  requestNextListeningStage: () => void;
  openListeningQuiz: (payload: any) => void;
  startInactivityTimer: () => void;
  sendPlaceholder: () => void;
  removeLoadingMessage: () => void;
  hasUnlimitedSessions: () => boolean;
  emitSessionRemaining: (next: number | null) => void;
  unloadAudio: () => void;
  onTopicImage: (imageUrl: string) => void;
  onContentPayload?: (payload: {
    content: string;
    contentAudioUrl?: string;
    narrationVideoUrl?: string;
  }) => void;
  onListeningVideoUrl?: (videoUrl?: string) => void;
  setIsSocketConnected: Setter<boolean>;
  setIsWaitingForResponse: Setter<boolean>;
  setIsListeningLoading: Setter<boolean>;
  setChatId: Setter<string | null>;
  setListeningData: Setter<any>;
  setHasPlayedIntroAudio: Setter<boolean>;
  setIsContextCompleted: Setter<boolean>;
  setShowListeningHints: Setter<boolean>;
  setShowListeningCompletionCard: Setter<boolean>;
  setPendingMcqPayload: Setter<any | null>;
  setMessages: Setter<Message[]>;
  setListeningStage: Setter<string | null>;
  setChatCompleted: Setter<boolean>;
  setIsCompleteDialogOpen: Setter<boolean>;
  setSessionLimitReached: Setter<boolean>;
  setContentPayload: Setter<{
    content: string;
    audioUrl?: string;
    narrationVideoUrl?: string;
  } | null>;
  setMcqList: Setter<any[]>;
  setIsQuestionnaireOpen: Setter<boolean>;
  setCurrentMcqIndex: Setter<number>;
  setIsDuplicateConnectionModalOpen: Setter<boolean>;
  setTopicImage: Setter<string | null>;
  setUnlockedBadgeInfo: Setter<{
    name: string;
    description: string;
    iconUrl: string;
    pointValue: number;
  } | null>;
  setIsBadgeModalOpen: Setter<boolean>;
  setAccountBlockedData: Setter<{
    message: string;
    violationCount: number;
    accountStatus: string;
  } | null>;
  setIsAccountBlockedOpen: Setter<boolean>;
  setContentFilterWarningData: Setter<{
    message: string;
    violationType: string;
    severity: string;
    violationCount: number;
    remainingWarnings: number;
  } | null>;
  setIsContentFilterWarningOpen: Setter<boolean>;
}

export function useChatWindow3DSocket({
  SOCKET_URL,
  userId,
  topicId,
  mode,
  isInactiveDialogOpen,
  navigate,
  socketRef,
  activityTimerRef,
  listeningLoadingTimeoutRef,
  clickLocked,
  listeningStageRef,
  prefetchedQuizRef,
  hasListeningStartedRef,
  wantsQuizRef,
  wantsHintsRef,
  skipListeningCompletionStepRef,
  sessionTimerBaseRef,
  sessionTimerLastEmittedRef,
  onListeningStageChangeRef,
  resetActivityTimer,
  requestNextListeningStage,
  openListeningQuiz,
  startInactivityTimer,
  sendPlaceholder,
  removeLoadingMessage,
  hasUnlimitedSessions,
  emitSessionRemaining,
  unloadAudio,
  onTopicImage,
  onContentPayload,
  onListeningVideoUrl,
  setIsSocketConnected,
  setIsWaitingForResponse,
  setIsListeningLoading,
  setChatId,
  setListeningData,
  setHasPlayedIntroAudio,
  setIsContextCompleted,
  setShowListeningHints,
  setShowListeningCompletionCard,
  setPendingMcqPayload,
  setMessages,
  setListeningStage,
  setChatCompleted,
  setIsCompleteDialogOpen,
  setSessionLimitReached,
  setContentPayload,
  setMcqList,
  setIsQuestionnaireOpen,
  setCurrentMcqIndex,
  setIsDuplicateConnectionModalOpen,
  setTopicImage,
  setUnlockedBadgeInfo,
  setIsBadgeModalOpen,
  setAccountBlockedData,
  setIsAccountBlockedOpen,
  setContentFilterWarningData,
  setIsContentFilterWarningOpen,
}: UseChatWindow3DSocketParams) {
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
    const disposeAuthRecovery = attachSocketAuthRecovery(socket);
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
      clickLocked.current = false;
      clickLocked.current = false;
      if (listeningLoadingTimeoutRef.current) {
        clearTimeout(listeningLoadingTimeoutRef.current);
        listeningLoadingTimeoutRef.current = null;
      }
      setIsListeningLoading(false);

      setChatId(newChatId);
      setListeningData(data);

      if (data?.narrationVideoUrl) {
        onListeningVideoUrl?.(data.narrationVideoUrl);
      } else {
        onListeningVideoUrl?.(undefined);
      }

      const inQuiz = listeningStageRef.current === "quiz";
      const payloadMcqs = data.mcqs || data.questions || [];
      const backendStage = normalizeListeningStage(data?.stage, data);
      if (inQuiz && backendStage !== "quiz") {
        return;
      }

      let currentStage: string | null = null;
      if (backendStage === "initial") {
        setHasPlayedIntroAudio(false);
        setIsContextCompleted(false);
        setShowListeningHints(false);
        setShowListeningCompletionCard(false);
        setPendingMcqPayload(null);
        prefetchedQuizRef.current = false;
        currentStage = "initial";
        hasListeningStartedRef.current = true;
        setMessages(
          data.narrationText
            ? [
                {
                  id: "narration-audio",
                  messageType: "text",
                  type: "received",
                  text: data.narrationText,
                  audioUrl: data.narrationAudioUrl,
                  audioPlayed: false,
                },
              ]
            : [],
        );
        if (data.mcqs || data.questions) {
          setPendingMcqPayload({ chatId: newChatId, ...data });
        }
      } else if (backendStage === "question_text") {
        if (listeningStageRef.current === "initial") {
          if (wantsQuizRef.current || skipListeningCompletionStepRef.current) {
            if (!prefetchedQuizRef.current) {
              prefetchedQuizRef.current = true;
              requestNextListeningStage();
            }
            return;
          }
          if (!prefetchedQuizRef.current) {
            prefetchedQuizRef.current = true;
            requestNextListeningStage();
          }
          currentStage = "initial";
        } else {
          currentStage = "question_text";
          setMessages([
            {
              id: "question-audio",
              messageType: "text",
              type: "received",
              text: data.questionText,
              audioUrl: data.questionAudioUrl,
              audioPlayed: false,
            },
          ]);
        }
      } else if (backendStage === "quiz" && payloadMcqs.length) {
        setPendingMcqPayload({ chatId: newChatId, ...data });
        if (inQuiz) {
          return;
        }
        if (wantsQuizRef.current) {
          openListeningQuiz({ chatId: newChatId, ...data });
          return;
        }
        if (wantsHintsRef.current) {
          setShowListeningHints(true);
          wantsHintsRef.current = false;
        }
        currentStage = listeningStageRef.current ?? "question_text";
      }

      setListeningStage(currentStage);
      logger.info(`Listening mode stage inferred: ${currentStage}`, data);
      onListeningStageChangeRef.current?.(currentStage, {
        kbAudioUrl: data.kbAudioUrl,
      });
    });

    socket.on("listening_completed", () => {
      setChatCompleted(true);
      setIsCompleteDialogOpen(true);
      toast.success("ðŸŽ‰ Listening session completed!");
    });

    socket.on("disconnect", (reason: any) => {
      logger.error(`Socket disconnected. Reason: ${reason}`);
      setIsSocketConnected(false);
      setIsWaitingForResponse(false);
      clickLocked.current = false;
      setIsListeningLoading(false);
      clickLocked.current = false;
      setIsListeningLoading(false);

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

    socket.on("connect_error", (err: any) => {
      if (isSocketAuthRecovering(socket)) return;
      logger.error("Socket connection error:", err);
      clickLocked.current = false;
      setIsListeningLoading(false);
      clickLocked.current = false;
      setIsListeningLoading(false);

      if (err.message.includes("401") || err.message.includes("Unauthorized")) {
        toast.error("Authentication failed. Please log in again.");
        localStorage.removeItem("AiTutorUser");
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        navigate("/login");
        return;
      }

      toast.error(`Connection failed: ${err.message}`);
    });

    socket.on("auth_error", (error: any) => {
      if (isSocketAuthRecovering(socket)) return;
      logger.error("WebSocket authentication error:", error);
      clickLocked.current = false;
      setIsListeningLoading(false);
      clickLocked.current = false;
      setIsListeningLoading(false);
      toast.error("Authentication failed. Please log in again.");
      localStorage.removeItem("AiTutorUser");
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      navigate("/login");
    });

    socket.on(ChatEvents.CHAT_HISTORY, (payload: any) => {
      logger.receiving(ChatEvents.CHAT_HISTORY, payload);

      const { chatHistory, chatId: newChatId } = payload;
      const formatted: Message[] = chatHistory.map((msg: any) => ({
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

    socket.on(ChatEvents.SPEECH_TRANSCRIBED, (payload: any) => {
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

    socket.on(ChatEvents.STREAMING_COMPLETE, (payload: any) => {
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

    socket.on(ChatEvents.TTS_AUDIO_URL, (payload: any) => {
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

    socket.on(ChatEvents.STREAMING_COMPLETE, (payload: any) => {
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

    socket.on(ChatEvents.SESSION_STATUS_UPDATE, (payload: any) => {
      logger.receiving(ChatEvents.SESSION_STATUS_UPDATE, payload);

      if (hasUnlimitedSessions()) {
        sessionTimerBaseRef.current = null;
        sessionTimerLastEmittedRef.current = null;
        setSessionLimitReached(false);
        emitSessionRemaining(null);
        return;
      }

      const rawRemaining = payload?.remainingSeconds;
      if (typeof rawRemaining !== "number" || Number.isNaN(rawRemaining)) {
        sessionTimerBaseRef.current = null;
        sessionTimerLastEmittedRef.current = null;
        setSessionLimitReached(false);
        emitSessionRemaining(null);
        return;
      }
      const normalizedRemaining = Math.max(0, Math.floor(rawRemaining));
      sessionTimerBaseRef.current = {
        remainingSeconds: normalizedRemaining,
        receivedAt: Date.now(),
      };
      sessionTimerLastEmittedRef.current = normalizedRemaining;
      setSessionLimitReached(normalizedRemaining === 0);
      emitSessionRemaining(normalizedRemaining);
    });

    socket.on(ChatEvents.CONTENT_PAYLOAD, (payload: any) => {
      logger.receiving(ChatEvents.CONTENT_PAYLOAD, payload);
      const { contentPayload: data } = payload;
      if (data) {
        const { content, contentAudioUrl, narrationVideoUrl } = data;
        if (
          (mode === "reading-mode" ||
            mode === "roleplay-mode" ||
            mode === "debate-mode") &&
          content
        ) {
          const safeNarrationVideoUrl = narrationVideoUrl ?? undefined;
          setContentPayload({
            content,
            audioUrl: contentAudioUrl,
            narrationVideoUrl: safeNarrationVideoUrl,
          });
          if (mode === "reading-mode") {
            onContentPayload?.({
              content,
              contentAudioUrl,
              narrationVideoUrl: safeNarrationVideoUrl,
            });
          }
        }
      }
    });

    socket.on(ChatEvents.MCQ_LIST, (payload: any) => {
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

    socket.on(ChatEvents.MCQ_RESULT, (payload: any) => {
      logger.receiving(ChatEvents.MCQ_RESULT, payload);
      const { correctCount, required, message } = payload;
      const isSuccess = correctCount >= required;

      if (mode !== "listening-mode") {
        if (isSuccess) {
          toast.success("ðŸŽ‰ Quiz Passed!", {
            description: `Great job! You got ${correctCount} correct answers.`,
            duration: 4000,
          });
        } else {
          toast.error("âŒ Try Again", {
            description: message,
            duration: 4000,
          });
        }
      }
    });

    socket.on(ChatEvents.ERROR, (payload: any) => {
      if (isSocketAuthRecovering(socket)) return;
      logger.receiving(ChatEvents.ERROR, payload);
      setIsWaitingForResponse(false);
      removeLoadingMessage();
      clickLocked.current = false;
      setIsListeningLoading(false);
      clickLocked.current = false;
      setIsListeningLoading(false);

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
        if (hasUnlimitedSessions()) {
          return;
        }
        setSessionLimitReached(true);
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

    socket.on(ChatEvents.CHAT_COMPLETED, (payload: any) => {
      logger.receiving(ChatEvents.CHAT_COMPLETED, payload);
      setChatCompleted(true);
      setIsCompleteDialogOpen(true);
      toast.info(payload.message);
    });

    socket.on(ChatEvents.ATTACHMENT_URL, (payload: any) => {
      logger.receiving(ChatEvents.ATTACHMENT_URL, payload);
      setTopicImage(payload.attachment);
      onTopicImage(payload.attachment);
    });

    socket.on(ChatEvents.BADGE_UNLOCKED, (payload: any) => {
      logger.receiving(ChatEvents.BADGE_UNLOCKED, payload);
      setUnlockedBadgeInfo({
        name: payload.name,
        description: payload.description,
        iconUrl: payload.iconUrl,
        pointValue: payload.pointValue,
      });
      setIsBadgeModalOpen(true);
      toast.success(`ðŸŽ‰ New Badge Unlocked: ${payload.name}!`);
    });

    socket.on(ChatEvents.ACCOUNT_BLOCKED, (payload: any) => {
      logger.receiving(ChatEvents.ACCOUNT_BLOCKED, payload);
      removeLoadingMessage();
      setAccountBlockedData({
        message: payload.message,
        violationCount: payload.violationCount,
        accountStatus: payload.accountStatus,
      });
      setIsAccountBlockedOpen(true);
    });

    socket.on(ChatEvents.CONTENT_FILTER_WARNING, (payload: any) => {
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
      disposeAuthRecovery();
      if (activityTimerRef.current) clearTimeout(activityTimerRef.current);
      if (listeningLoadingTimeoutRef.current) {
        clearTimeout(listeningLoadingTimeoutRef.current);
      }
      socket.disconnect();
      unloadAudio();
    };
  }, [userId, topicId, navigate, resetActivityTimer, onTopicImage, unloadAudio]);
}
