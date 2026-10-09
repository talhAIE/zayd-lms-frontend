import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { toast } from 'sonner';
import { ContentFilterWarningData } from '@/components/ui/ContentPolicyWarningModal';
import { createPendingAudioUrl, loadPendingReadingAudio, removePendingReadingAudio, savePendingReadingAudio } from '@/utils/pendingReadingAudio';
import { type ReadingVocabularyFeedback } from '@/utils/readingVocabularyFeedback';

const MAX_READING_SOCKET_AUDIO_BASE64_LENGTH = 900_000;

export interface HistoryItem {
  id: string;
  sender: string;
  role: 'assistant' | 'user';
  content: string;
  hint: string | null;
  feedback: string | null;
  assessments: any | null;
  audioUrl: string | null;
  createdAt: string;
  deliveryStatus?: 'sending' | 'failed';
  readingVocabularyFeedback?: ReadingVocabularyFeedback;
  readingSpeechText?: string | null;
}

export interface Mcq {
  id: string;
  question: string;
  options: string[] | Array<{ id: string; text: string }>;
  hint?: string;
  correct?: string | number;
  correctOptionId?: string;
}

export interface ReadingProgress {
  hasListenedToPassage: boolean;
  phase: 'reading' | 'quiz' | 'completed';
  currentSentenceIndex: number;
  totalSentences: number;
  attemptedSentenceIndexes: number[];
  acceptedSentenceIndexes: number[];
  isRetrying: boolean;
  rejectedAttemptCount: number;
  percentComplete: number;
}

export interface McqResult {
  results?: boolean[];
  passed: boolean;
  correctCount: number;
  required: number;
  message: string;
}

export interface McqAnswerFeedback {
  modeSessionId: string;
  questionId: string;
  isCorrect: boolean;
  message: string;
}

export interface RoleplayProgress {
  requiredTurns: number;
  completedTurns: number;
  remainingTurns: number;
  guidedSteps: Array<{ id: string; prompt: string; hint?: string }>;
  currentGuidedStep: { id: string; prompt: string; hint?: string } | null;
}

export interface ListeningPayload {
  stage?: 'initial' | 'question' | 'quiz' | 'transcript' | 'completed';
  narrationText?: string;
  narrationAudioUrl?: string;
  narrationVideoUrl?: string;
  kbAudioUrl?: string;
  questionText?: string;
  questionAudioUrl?: string;
  transcript?: string;
  transcriptAudioUrl?: string;
  mcqs?: Mcq[];
}

export interface SessionStatus {
  remainingSeconds: number | null;
  message?: string;
}

export interface UseModeSessionOptions {
  lessonModeId: string;
  onCompleted?: () => void;
  onBadgeUnlocked?: (badge: any) => void;
}

function hasCompletedAudioAttempt(history: HistoryItem[], attemptId: string): boolean {
  const attemptIndex = history.findIndex(message => message.hint === `audio-attempt:${attemptId}`);
  return attemptIndex >= 0 && history.slice(attemptIndex + 1).some(message => message.role === 'assistant');
}

function showPendingAudioInHistory(history: HistoryItem[], pending: HistoryItem): HistoryItem[] {
  const serverIndex = history.findIndex(message => message.hint === `audio-attempt:${pending.id}`);
  if (serverIndex < 0) return [...history, { ...pending, deliveryStatus: 'failed' }];
  return history.map((message, index) => index === serverIndex
    ? { ...message, id: pending.id, audioUrl: pending.audioUrl, deliveryStatus: 'failed' }
    : message);
}

export function useModeSession({ lessonModeId, onCompleted, onBadgeUnlocked }: UseModeSessionOptions) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [modeSessionId, setModeSessionId] = useState<string | null>(null);
  const [chatHistory, setChatHistory] = useState<HistoryItem[]>([]);
  const [contentPayload, setContentPayload] = useState<any>(null);
  const [mcqList, setMcqList] = useState<Mcq[]>([]);
  const [mcqResult, setMcqResult] = useState<McqResult | null>(null);
  const [mcqAnswerFeedback, setMcqAnswerFeedback] = useState<Record<string, McqAnswerFeedback>>({});
  const [isCheckingMcqAnswer, setIsCheckingMcqAnswer] = useState(false);
  const [listeningPayload, setListeningPayload] = useState<ListeningPayload | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [hasPendingAudio, setHasPendingAudio] = useState(false);
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const [isReconcilingAudio, setIsReconcilingAudio] = useState(false);
  const [lastNewRecordingAttemptId, setLastNewRecordingAttemptId] = useState<string | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [sessionStatus, setSessionStatus] = useState<SessionStatus>({ remainingSeconds: null });
  const [readingProgress, setReadingProgress] = useState<ReadingProgress | null>(null);
  const [roleplayProgress, setRoleplayProgress] = useState<RoleplayProgress | null>(null);
  const [isContentFilterWarningOpen, setIsContentFilterWarningOpen] = useState(false);
  const [contentFilterWarningData, setContentFilterWarningData] = useState<ContentFilterWarningData | null>(null);
  const [isAccountBlocked, setIsAccountBlocked] = useState(false);

  // Refs for tracking mutable state within socket handlers without needing to re-bind
  const modeSessionIdRef = useRef<string | null>(null);
  const modeKeyRef = useRef<string | null>(null);
  const completionHandledRef = useRef(false);
  const onCompletedRef = useRef(onCompleted);
  const onBadgeUnlockedRef = useRef(onBadgeUnlocked);
  const pendingAudioMessageIdRef = useRef<string | null>(null);
  const pendingAudioRef = useRef<{ id: string; base64: string; format: string; audioUrl: string; sessionId: string } | null>(null);
  const discardedAudioAttemptIdsRef = useRef(new Set<string>());
  const pendingAudioTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconciliationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const modeRequestInFlightRef = useRef(false);
  const reconcilingAudioRef = useRef(false);
  const audioConnectionWarningShownRef = useRef(false);

  useEffect(() => {
    onCompletedRef.current = onCompleted;
    onBadgeUnlockedRef.current = onBadgeUnlocked;
  }, [onBadgeUnlocked, onCompleted]);

  useEffect(() => {
    if (!lessonModeId) return;

    // A mode can change without unmounting this hook. Never let its socket
    // handlers send a message to the previous lesson's session.
    modeSessionIdRef.current = null;
    modeKeyRef.current = null;
    pendingAudioMessageIdRef.current = null;
    pendingAudioRef.current = null;
    discardedAudioAttemptIdsRef.current = new Set();
    setHasPendingAudio(true);
    setLastNewRecordingAttemptId(null);
    if (pendingAudioTimeoutRef.current) clearTimeout(pendingAudioTimeoutRef.current);
    pendingAudioTimeoutRef.current = null;
    if (reconciliationTimeoutRef.current) clearTimeout(reconciliationTimeoutRef.current);
    reconciliationTimeoutRef.current = null;
    modeRequestInFlightRef.current = false;
    reconcilingAudioRef.current = false;
    audioConnectionWarningShownRef.current = false;
    setIsSocketConnected(false);
    setIsReconcilingAudio(false);
    completionHandledRef.current = false;
    setModeSessionId(null);
    setChatHistory([]);
    setContentPayload(null);
    setMcqList([]);
    setMcqResult(null);
    setMcqAnswerFeedback({});
    setIsCheckingMcqAnswer(false);
    setListeningPayload(null);
    setReadingProgress(null);
    setRoleplayProgress(null);
    setIsCompleted(false);

    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) {
      toast.error('Authentication required');
      return;
    }

    const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:4000';
    const newSocket = io(socketUrl, {
      auth: { token: accessToken },
      transports: ['polling', 'websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('[Socket] Connected');
      setIsSocketConnected(true);
      audioConnectionWarningShownRef.current = false;
      reconcilingAudioRef.current = !!pendingAudioRef.current;
      setIsReconcilingAudio(reconcilingAudioRef.current);
      if (reconciliationTimeoutRef.current) clearTimeout(reconciliationTimeoutRef.current);
      if (reconcilingAudioRef.current) {
        reconciliationTimeoutRef.current = setTimeout(() => {
          reconcilingAudioRef.current = false;
          setIsReconcilingAudio(false);
          reconciliationTimeoutRef.current = null;
        }, 10_000);
      }
      newSocket.emit('start_mode_session', { lessonModeId });
    });

    newSocket.on('connect_error', (err) => {
      console.error('[Socket] Connect error:', err);
      setIsSocketConnected(false);
      if (reconciliationTimeoutRef.current) clearTimeout(reconciliationTimeoutRef.current);
      reconciliationTimeoutRef.current = null;
      reconcilingAudioRef.current = false;
      setIsReconcilingAudio(false);
      if (pendingAudioRef.current) {
        if (!audioConnectionWarningShownRef.current) {
          toast.error('Your recording is still here. Reconnect, then send this recording again.');
          audioConnectionWarningShownRef.current = true;
        }
      } else {
        toast.error('Could not connect to the learning server. Please check your connection.');
      }
    });

    newSocket.on('disconnect', (reason) => {
      console.warn('[Socket] Disconnected:', reason);
      setIsSocketConnected(false);
      if (reconciliationTimeoutRef.current) clearTimeout(reconciliationTimeoutRef.current);
      reconciliationTimeoutRef.current = null;
      reconcilingAudioRef.current = false;
      setIsReconcilingAudio(false);
      if (pendingAudioRef.current) {
        if (pendingAudioTimeoutRef.current) clearTimeout(pendingAudioTimeoutRef.current);
        pendingAudioTimeoutRef.current = null;
        modeRequestInFlightRef.current = false;
        setIsTyping(false);
        setChatHistory(prev => prev.map(message => message.id === pendingAudioRef.current?.id
          ? { ...message, deliveryStatus: 'failed' }
          : message));
        if (!audioConnectionWarningShownRef.current) {
          toast.error('Your recording is still here. Reconnect, then send this recording again.');
          audioConnectionWarningShownRef.current = true;
        }
      }
    });

    newSocket.io.on('reconnect_attempt', (attempt) => {
      console.info('[Socket] Reconnecting, attempt:', attempt);
    });

    newSocket.io.on('reconnect', (attempt) => {
      console.info('[Socket] Reconnected after attempt:', attempt);
    });

    newSocket.io.on('reconnect_error', (error) => {
      console.error('[Socket] Reconnect error:', error);
    });

    newSocket.on('mode_session_started', (session: { lessonModeId: string; modeSessionId: string; modeKey?: string; chatHistory?: HistoryItem[]; contentPayload?: any; mcqs?: Mcq[]; readingProgress?: ReadingProgress; roleplayProgress?: RoleplayProgress; isCompleted?: boolean }) => {
      console.log('[Socket] Mode session started:', session);
      if (session.lessonModeId !== lessonModeId) {
        console.warn('[Socket] Ignoring a session for a different lesson mode.');
        return;
      }
      if (modeSessionIdRef.current !== session.modeSessionId) {
        completionHandledRef.current = false;
      }
      setModeSessionId(session.modeSessionId);
      modeSessionIdRef.current = session.modeSessionId;
      modeKeyRef.current = session.modeKey ?? null;
      reconcilingAudioRef.current = false;
      setIsReconcilingAudio(false);
      if (reconciliationTimeoutRef.current) clearTimeout(reconciliationTimeoutRef.current);
      reconciliationTimeoutRef.current = null;
      if (pendingAudioRef.current && session.chatHistory && hasCompletedAudioAttempt(session.chatHistory, pendingAudioRef.current.id)) {
        const acknowledgedId = pendingAudioRef.current.id;
        pendingAudioRef.current = null;
        pendingAudioMessageIdRef.current = null;
        setHasPendingAudio(false);
        modeRequestInFlightRef.current = false;
        if (pendingAudioTimeoutRef.current) clearTimeout(pendingAudioTimeoutRef.current);
        pendingAudioTimeoutRef.current = null;
        void removePendingReadingAudio(lessonModeId, acknowledgedId).catch(() => undefined);
      }
      if (session.chatHistory) {
        setChatHistory(prev => {
          const pending = pendingAudioRef.current && prev.find(message => message.id === pendingAudioRef.current?.id);
          return pending ? showPendingAudioInHistory(session.chatHistory!, pending) : session.chatHistory!;
        });
      }
      if (!pendingAudioRef.current) {
        void loadPendingReadingAudio(lessonModeId).then((draft) => {
          if (!draft) {
            if (!pendingAudioRef.current) setHasPendingAudio(false);
            return;
          }
          if (discardedAudioAttemptIdsRef.current.has(draft.id)) {
            void removePendingReadingAudio(lessonModeId, draft.id).catch(() => undefined);
            if (!pendingAudioRef.current) setHasPendingAudio(false);
            return;
          }
          if (draft.sessionId !== session.modeSessionId || (session.chatHistory && hasCompletedAudioAttempt(session.chatHistory, draft.id))) {
            void removePendingReadingAudio(lessonModeId, draft.id);
            if (!pendingAudioRef.current) setHasPendingAudio(false);
            return;
          }
          if (pendingAudioRef.current) return;
          const audioUrl = createPendingAudioUrl(draft.base64, draft.format);
          pendingAudioRef.current = { id: draft.id, base64: draft.base64, format: draft.format, audioUrl, sessionId: draft.sessionId };
          pendingAudioMessageIdRef.current = draft.id;
          setHasPendingAudio(true);
          setChatHistory(prev => prev.some(message => message.id === draft.id) ? prev : showPendingAudioInHistory(prev, {
            id: draft.id, sender: 'user', role: 'user', content: '', hint: null,
            feedback: null, assessments: null, audioUrl,
            createdAt: draft.createdAt, deliveryStatus: 'failed',
          }));
        }).catch(() => {
          if (!pendingAudioRef.current) setHasPendingAudio(false);
        });
      }
      if (session.contentPayload) {
        setContentPayload(session.contentPayload);
      }
      if (session.mcqs) {
        setMcqList(session.mcqs);
        setMcqResult(null);
        setMcqAnswerFeedback({});
        setIsCheckingMcqAnswer(false);
      }
      if (session.readingProgress) {
        setReadingProgress(session.readingProgress);
      }
      if (session.roleplayProgress) {
        setRoleplayProgress(session.roleplayProgress);
      }
      setIsCompleted(session.isCompleted || false);
    });

    newSocket.on('content_payload', (payload: { contentPayload: any }) => {
      setContentPayload(payload.contentPayload);
    });

    newSocket.on('chat_history', (payload: { modeSessionId: string, chatHistory: HistoryItem[], roleplayProgress?: RoleplayProgress }) => {
      if (pendingAudioRef.current && hasCompletedAudioAttempt(payload.chatHistory, pendingAudioRef.current.id)) {
        const acknowledgedId = pendingAudioRef.current.id;
        pendingAudioRef.current = null;
        pendingAudioMessageIdRef.current = null;
        setHasPendingAudio(false);
        modeRequestInFlightRef.current = false;
        if (pendingAudioTimeoutRef.current) clearTimeout(pendingAudioTimeoutRef.current);
        pendingAudioTimeoutRef.current = null;
        void removePendingReadingAudio(lessonModeId, acknowledgedId).catch(() => undefined);
      }
      setChatHistory(prev => {
        const pending = pendingAudioRef.current && prev.find(message => message.id === pendingAudioRef.current?.id);
        return pending ? showPendingAudioInHistory(payload.chatHistory, pending) : payload.chatHistory;
      });
      if (payload.roleplayProgress) setRoleplayProgress(payload.roleplayProgress);
    });

    newSocket.on('ai_response', (payload: { roleplayProgress?: RoleplayProgress }) => {
      setIsTyping(true);
      if (payload.roleplayProgress) setRoleplayProgress(payload.roleplayProgress);
    });

    newSocket.on('streaming_complete', (payload: { ai_response: string, feedback: string, ai_cefr_level: string, isCompleted: boolean, ttsAudioUrl?: string, hint?: string, readingProgress?: ReadingProgress, roleplayProgress?: RoleplayProgress, roleplayProgressEarned?: boolean, messageId?: string, readingVocabularyFeedback?: ReadingVocabularyFeedback, readingSpeechText?: string | null }) => {
      modeRequestInFlightRef.current = false;
      setIsTyping(false);
      const completedAudio = modeKeyRef.current === 'reading-mode' ? pendingAudioRef.current : null;
      if (completedAudio) {
        if (pendingAudioTimeoutRef.current) clearTimeout(pendingAudioTimeoutRef.current);
        pendingAudioTimeoutRef.current = null;
        pendingAudioRef.current = null;
        pendingAudioMessageIdRef.current = null;
        setHasPendingAudio(false);
        void removePendingReadingAudio(lessonModeId, completedAudio.id).catch(() => undefined);
      }
      if (payload.readingProgress) {
        setReadingProgress(payload.readingProgress);
      }
      if (payload.roleplayProgress) {
        setRoleplayProgress(payload.roleplayProgress);
      }
      setChatHistory(prev => [
        ...prev.map(message => completedAudio && message.id === completedAudio.id
          ? { ...message, deliveryStatus: undefined }
          : message),
        {
          id: payload.messageId || Date.now().toString(),
          sender: 'ai',
          role: 'assistant',
          content: payload.ai_response,
          feedback: payload.feedback,
          readingVocabularyFeedback: payload.readingVocabularyFeedback,
          readingSpeechText: payload.readingSpeechText,
          hint: payload.hint || null,
          assessments:
            payload.roleplayProgressEarned === undefined
              ? null
              : { roleplayProgressEarned: payload.roleplayProgressEarned },
          audioUrl: payload.ttsAudioUrl || null,
          createdAt: new Date().toISOString(),
        }
      ]);
    });

    newSocket.on('reading_progress', (payload: ReadingProgress) => {
      setReadingProgress(payload);
    });

    newSocket.on('mcq_list', (payload: { modeSessionId: string, questions: Mcq[] }) => {
      setMcqList(payload.questions);
      setMcqResult(null);
      setMcqAnswerFeedback({});
      setIsCheckingMcqAnswer(false);
    });

    newSocket.on('mcq_answer_result', (payload: McqAnswerFeedback) => {
      setIsCheckingMcqAnswer(false);
      setMcqAnswerFeedback((current) => ({
        ...current,
        [payload.questionId]: payload,
      }));
    });

    newSocket.on('mcq_result', (payload: McqResult) => {
      setMcqResult(payload);
      if (!payload.passed) {
        toast.error(payload.message || `Need ${payload.required} correct to pass`);
      } else {
        toast.success(payload.message || 'Quiz completed!');
        setMcqList([]);
      }
    });

    newSocket.on('chat_completed', (payload: { roleplayProgress?: RoleplayProgress }) => {
      if (completionHandledRef.current) return;
      completionHandledRef.current = true;
      if (payload.roleplayProgress) setRoleplayProgress(payload.roleplayProgress);
      setIsCompleted(true);
      void Promise.resolve(onCompletedRef.current?.()).catch(() => {
        toast.error('Your lesson finished, but progress could not be refreshed.');
      });
    });

    newSocket.on('listening_payload', (payload: ListeningPayload) => {
      setListeningPayload(payload);
      if (payload.mcqs && Array.isArray(payload.mcqs)) {
        setMcqList(payload.mcqs);
      }
    });

    newSocket.on('speech_transcribed', (payload: { textMessage: string, assessments: any, audioUrl?: string, clientAttemptId?: string }) => {
      const pendingAudioMessageId = payload.clientAttemptId || pendingAudioMessageIdRef.current;
      if (modeKeyRef.current !== 'reading-mode' && pendingAudioMessageId && pendingAudioMessageId === pendingAudioMessageIdRef.current) {
        if (pendingAudioTimeoutRef.current) clearTimeout(pendingAudioTimeoutRef.current);
        pendingAudioTimeoutRef.current = null;
        pendingAudioMessageIdRef.current = null;
        pendingAudioRef.current = null;
        setHasPendingAudio(false);
        void removePendingReadingAudio(lessonModeId, pendingAudioMessageId).catch(() => undefined);
      }
      setChatHistory(prev => {
        if (pendingAudioMessageId) {
          const updated = prev.map(message =>
            message.id === pendingAudioMessageId
              ? {
                  ...message,
                  content: payload.textMessage,
                  assessments: payload.assessments,
                  audioUrl: payload.audioUrl || message.audioUrl,
                  // The server has received and transcribed this recording.
                  deliveryStatus: undefined,
                }
              : message,
          );
          if (updated.some(message => message.id === pendingAudioMessageId)) return updated;
          if (updated.some(message => message.hint === `audio-attempt:${pendingAudioMessageId}`)) return updated;
        }

        return [
          ...prev,
          {
            id: Date.now().toString(),
            sender: 'user',
            role: 'user',
            content: payload.textMessage,
            hint: null,
            feedback: null,
            assessments: payload.assessments,
            audioUrl: payload.audioUrl || null,
            createdAt: new Date().toISOString(),
          },
        ];
      });
    });

    newSocket.on('audio_already_received', () => {
      modeRequestInFlightRef.current = false;
      setIsTyping(false);
    });

    newSocket.on('session_status', (payload: { remainingSeconds: number, message?: string }) => {
      setSessionStatus({ remainingSeconds: payload.remainingSeconds, message: payload.message });
    });

    newSocket.on('content_filter_warning', (payload: any) => {
      setContentFilterWarningData({
        message: payload.message,
        violationType: payload.violationType,
        severity: payload.severity,
        violationCount: payload.violationCount,
        remainingWarnings: payload.remainingWarnings,
      });
      setIsContentFilterWarningOpen(true);
      modeRequestInFlightRef.current = false;
      setIsTyping(false);
    });

    newSocket.on('account_blocked', (payload: { message: string }) => {
      setIsAccountBlocked(true);
      modeRequestInFlightRef.current = false;
      setIsTyping(false);
      toast.error(payload.message || 'Your account has been blocked.');
      newSocket.disconnect();
      window.setTimeout(() => {
        window.location.assign('/login');
      }, 2000);
    });

    newSocket.on('error', (payload: { message: string, clientAttemptId?: string, code?: string }) => {
      const pending = pendingAudioRef.current;
      if (payload.code === 'NO_SPEECH' || payload.code === 'UNCLEAR_SPEECH') {
        if (payload.clientAttemptId && pending?.id !== payload.clientAttemptId) return;
        if (pending) {
          if (pendingAudioTimeoutRef.current) clearTimeout(pendingAudioTimeoutRef.current);
          pendingAudioTimeoutRef.current = null;
          discardedAudioAttemptIdsRef.current.add(pending.id);
          pendingAudioRef.current = null;
          pendingAudioMessageIdRef.current = null;
          setHasPendingAudio(false);
          setLastNewRecordingAttemptId(pending.id);
          setChatHistory(prev => prev.filter(message => message.id !== pending.id));
          if (pending.audioUrl.startsWith('blob:')) URL.revokeObjectURL(pending.audioUrl);
          void removePendingReadingAudio(lessonModeId, pending.id).catch(() => undefined);
        }
      } else if (pending && (!payload.clientAttemptId || payload.clientAttemptId === pending.id)) {
        if (pendingAudioTimeoutRef.current) clearTimeout(pendingAudioTimeoutRef.current);
        pendingAudioTimeoutRef.current = null;
        setChatHistory(prev => prev.map(message => message.id === pending.id
          ? { ...message, deliveryStatus: 'failed' }
          : message));
      }
      toast.error(payload.code === 'UNCLEAR_SPEECH' && modeKeyRef.current === 'reading-mode'
        ? 'Please try reading this sentence again.'
        : payload.message);
      modeRequestInFlightRef.current = false;
      setIsTyping(false);
      setIsCheckingMcqAnswer(false);
    });

    newSocket.on('badge_unlocked', (payload: any) => {
      toast.success(`Badge Unlocked: ${payload.name}!`);
      if (onBadgeUnlockedRef.current) onBadgeUnlockedRef.current(payload);
    });

    return () => {
      if (pendingAudioTimeoutRef.current) clearTimeout(pendingAudioTimeoutRef.current);
      pendingAudioTimeoutRef.current = null;
      if (reconciliationTimeoutRef.current) clearTimeout(reconciliationTimeoutRef.current);
      reconciliationTimeoutRef.current = null;
      newSocket.disconnect();
      setSocket((currentSocket) => currentSocket === newSocket ? null : currentSocket);
    };
  }, [lessonModeId]);

  const sendMessage = useCallback((text: string) => {
    if (
      !socket ||
      !modeSessionIdRef.current ||
      isAccountBlocked ||
      modeRequestInFlightRef.current
    ) return;
    modeRequestInFlightRef.current = true;
    setIsTyping(true);
    setChatHistory(prev => [
      ...prev,
      {
        id: Date.now().toString(),
        sender: 'user',
        role: 'user',
        content: text,
        hint: null,
        feedback: null,
        assessments: null,
        audioUrl: null,
        createdAt: new Date().toISOString(),
      }
    ]);
    socket.emit('text', { modeSessionId: modeSessionIdRef.current, textMessage: text });
  }, [socket, isAccountBlocked]);

  const sendAudio = useCallback(async (base64Audio: string, format: string = 'wav', localAudioUrl?: string): Promise<boolean> => {
    if (pendingAudioRef.current) {
      toast.error('Please finish or retry the previous recording first.');
      return false;
    }
    // Socket.IO's default message limit is 1 MB. Base64 audio is larger than
    // the original blob, so reject an oversized Reading upload before it can
    // disconnect the socket and strand the recording in the pending state.
    if (modeKeyRef.current === 'reading-mode' && base64Audio.length > MAX_READING_SOCKET_AUDIO_BASE64_LENGTH) {
      if (localAudioUrl?.startsWith('blob:')) URL.revokeObjectURL(localAudioUrl);
      toast.error('This recording is too long to send. Please record the sentence again.');
      return false;
    }
    const id = crypto.randomUUID();
    if (localAudioUrl && modeSessionIdRef.current) {
      pendingAudioMessageIdRef.current = id;
      pendingAudioRef.current = { id, base64: base64Audio, format, audioUrl: localAudioUrl, sessionId: modeSessionIdRef.current };
      setHasPendingAudio(true);
      setChatHistory(prev => [...prev, {
        id, sender: 'user', role: 'user', content: '', hint: null,
        feedback: null, assessments: null, audioUrl: localAudioUrl,
        createdAt: new Date().toISOString(), deliveryStatus: 'sending',
      }]);
      try {
        await savePendingReadingAudio({
          lessonModeId, sessionId: modeSessionIdRef.current, id,
          base64: base64Audio, format, createdAt: new Date().toISOString(),
        });
      } catch {
        toast.error('This browser could not save the recording for recovery after a refresh.');
      }
    }
    if (
      !socket ||
      !socket.connected ||
      !modeSessionIdRef.current ||
      isAccountBlocked ||
      modeRequestInFlightRef.current
    ) {
      if (localAudioUrl) {
        setChatHistory(prev => prev.map(message => message.id === id ? { ...message, deliveryStatus: 'failed' } : message));
      }
      toast.error('Your recording is still here. Reconnect, then send this recording again.');
      return false;
    }
    modeRequestInFlightRef.current = true;
    setIsTyping(true);
    socket.emit('audio', { modeSessionId: modeSessionIdRef.current, audioBuffer: base64Audio, format, clientAttemptId: id });
    pendingAudioTimeoutRef.current = setTimeout(() => {
      if (pendingAudioRef.current?.id !== id) return;
      modeRequestInFlightRef.current = false;
      setIsTyping(false);
      setChatHistory(prev => prev.map(message => message.id === id ? { ...message, deliveryStatus: 'failed' } : message));
      toast.error('Recording is taking too long. Please retry it.');
    }, 180_000);
    return true;
  }, [socket, isAccountBlocked, lessonModeId]);

  const retryAudio = useCallback(() => {
    const pending = pendingAudioRef.current;
    if (!pending) return;
    if (modeKeyRef.current === 'reading-mode' && pending.base64.length > MAX_READING_SOCKET_AUDIO_BASE64_LENGTH) {
      toast.error('This recording is too long to send. Discard it and record the sentence again.');
      return;
    }
    if (!socket?.connected) {
      toast.error('Your recording is still here. Please reconnect before sending it again.');
      return;
    }
    if (reconcilingAudioRef.current || modeRequestInFlightRef.current) {
      toast.error('Please wait while we check whether your recording was received.');
      return;
    }
    if (modeSessionIdRef.current !== pending.sessionId) {
      toast.error('This recording belongs to an earlier session. Please reopen the lesson.');
      return;
    }
    modeRequestInFlightRef.current = true;
    setIsTyping(true);
    setChatHistory(prev => prev.map(message => message.id === pending.id
      ? { ...message, deliveryStatus: 'sending' }
      : message));
    socket.emit('audio', { modeSessionId: pending.sessionId, audioBuffer: pending.base64, format: pending.format, clientAttemptId: pending.id });
    pendingAudioTimeoutRef.current = setTimeout(() => {
      if (pendingAudioRef.current?.id !== pending.id) return;
      modeRequestInFlightRef.current = false;
      setIsTyping(false);
      setChatHistory(prev => prev.map(message => message.id === pending.id ? { ...message, deliveryStatus: 'failed' } : message));
      toast.error('Recording is taking too long. Please retry it.');
    }, 180_000);
  }, [socket]);

  const discardAudio = useCallback(async (attemptId: string) => {
    const pending = pendingAudioRef.current;
    if (!pending || pending.id !== attemptId) return;
    if (modeRequestInFlightRef.current || reconcilingAudioRef.current) {
      toast.error('Please wait while we check this recording.');
      return;
    }
    try {
      await removePendingReadingAudio(lessonModeId, attemptId);
    } catch {
      toast.error('The saved copy could not be removed. It may reappear after a refresh.');
    }
    if (pendingAudioRef.current?.id !== attemptId) return;
    if (pendingAudioTimeoutRef.current) clearTimeout(pendingAudioTimeoutRef.current);
    pendingAudioTimeoutRef.current = null;
    discardedAudioAttemptIdsRef.current.add(attemptId);
    pendingAudioRef.current = null;
    pendingAudioMessageIdRef.current = null;
    setHasPendingAudio(false);
    setLastNewRecordingAttemptId(attemptId);
    setIsTyping(false);
    setChatHistory(prev => prev.flatMap(message => {
      if (message.id !== attemptId) return [message];
      if (!message.content.trim()) return [];
      return [{
        ...message,
        deliveryStatus: undefined,
        audioUrl: message.audioUrl?.startsWith('blob:') ? null : message.audioUrl,
      }];
    }));
    if (pending.audioUrl.startsWith('blob:')) URL.revokeObjectURL(pending.audioUrl);
  }, [lessonModeId]);

  const submitMcqs = useCallback((answers: Array<number | string>) => {
    if (!socket || !modeSessionIdRef.current || isAccountBlocked) return;
    socket.emit('submit_mcqs', { modeSessionId: modeSessionIdRef.current, answers });
  }, [socket, isAccountBlocked]);

  const startListening = useCallback(() => {
    if (!socket || !modeSessionIdRef.current || isAccountBlocked) return;
    socket.emit('start_listening', { modeSessionId: modeSessionIdRef.current });
  }, [socket, isAccountBlocked]);

  const nextListeningStage = useCallback(() => {
    if (!socket || !modeSessionIdRef.current || isAccountBlocked) return;
    socket.emit('next_listening_stage', { modeSessionId: modeSessionIdRef.current });
  }, [socket, isAccountBlocked]);

  const checkMcqAnswer = useCallback((questionId: string, answer: number | string) => {
    if (!socket || !modeSessionIdRef.current || isAccountBlocked || isCheckingMcqAnswer) return;
    setIsCheckingMcqAnswer(true);
    socket.emit('check_mcq_answer', {
      modeSessionId: modeSessionIdRef.current,
      questionId,
      answer,
    });
  }, [socket, isAccountBlocked, isCheckingMcqAnswer]);

  const clearMcqAnswerFeedback = useCallback((questionId: string) => {
    setMcqAnswerFeedback((current) => {
      if (!(questionId in current)) return current;
      const { [questionId]: _discarded, ...remaining } = current;
      return remaining;
    });
  }, []);

  const markReadingPassageListened = useCallback(() => {
    if (!socket || !modeSessionIdRef.current || isAccountBlocked) return;
    socket.emit('reading_passage_listened', {
      modeSessionId: modeSessionIdRef.current,
    });
  }, [socket, isAccountBlocked]);

  const retryReadingPassageAudio = useCallback(() => {
    if (!socket?.connected || !lessonModeId || isAccountBlocked) return false;
    socket.emit('start_mode_session', { lessonModeId });
    return true;
  }, [socket, lessonModeId, isAccountBlocked]);

  const restartSession = useCallback(() => {
    if (!socket || !lessonModeId || isAccountBlocked) return;
    if (pendingAudioRef.current) {
      void removePendingReadingAudio(lessonModeId, pendingAudioRef.current.id).catch(() => undefined);
      pendingAudioRef.current = null;
      pendingAudioMessageIdRef.current = null;
      setHasPendingAudio(false);
    }
    if (pendingAudioTimeoutRef.current) clearTimeout(pendingAudioTimeoutRef.current);
    pendingAudioTimeoutRef.current = null;
    setChatHistory([]);
    setMcqList([]);
    setMcqResult(null);
    setListeningPayload(null);
    setReadingProgress(null);
    setRoleplayProgress(null);
    setIsCompleted(false);
    socket.emit('restart_mode_session', { lessonModeId });
  }, [socket, lessonModeId, isAccountBlocked]);

  const resetActivityTimer = useCallback(() => {
    if (!socket || !modeSessionIdRef.current) return;
    socket.emit('reset_activity_timer', { modeSessionId: modeSessionIdRef.current });
  }, [socket]);

  return {
    modeSessionId,
    chatHistory,
    contentPayload,
    mcqList,
    mcqResult,
    mcqAnswerFeedback,
    isCheckingMcqAnswer,
    listeningPayload,
    readingProgress,
    roleplayProgress,
    isTyping,
    hasPendingAudio,
    isSocketConnected,
    isReconcilingAudio,
    lastNewRecordingAttemptId,
    setIsTyping,
    isCompleted,
    sessionStatus,
    isAccountBlocked,
    isContentFilterWarningOpen,
    setIsContentFilterWarningOpen,
    contentFilterWarningData,
    resetActivityTimer,
    sendMessage,
    sendAudio,
    retryAudio,
    discardAudio,
    submitMcqs,
    checkMcqAnswer,
    clearMcqAnswerFeedback,
    startListening,
    nextListeningStage,
    markReadingPassageListened,
    retryReadingPassageAudio,
    restartSession
  };
}
