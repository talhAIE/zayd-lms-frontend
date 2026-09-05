import React from "react";
import {
  ArrowUp,
  BarChart2,
  Info,
  LoaderPinwheel,
  MessageCircle,
  Mic,
  Pause,
  Play,
  Send,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ReadingPassageCard, { type ReadingPassagePresentation } from "@/components/ui/ReadingPassageCard";
import { formatTime } from "./chat3d.shared";
import type { Message } from "./chat3d.shared";

interface ContentPayload {
  content: string;
  audioUrl?: string;
  narrationVideoUrl?: string;
  readingPresentation?: ReadingPassagePresentation;
}

interface ChatWindow3DMessagesProps {
  mode: string | null;
  contentPayload: ContentPayload | null;
  contentRef: React.RefObject<HTMLParagraphElement>;
  isContentExpanded: boolean;
  setIsContentExpanded: (expanded: boolean) => void;
  shouldShowExpandButton: boolean;
  playingAudioId: string | null;
  loadingAudioId: string | null;
  isCurrentlyPlaying: boolean;
  toggleAudio: (
    id: string,
    audioUrl: string | undefined,
    onEnd?: () => void,
  ) => void;
  onContentAudioComplete?: (completed: boolean) => void;
  chatLocked: boolean;
  messages: Message[];
  messagesEndRef: React.RefObject<HTMLDivElement>;
  handleShowAssessment: (assessments: any) => void;
  onShowFeedback: (feedback: { type: string; content: any }) => void;
  resetInactivityTimer: () => void;
  message: string;
  setMessage: (message: string) => void;
  isRecording: boolean;
  recordTime: number;
  chatCompleted: boolean;
  isSessionExpired: boolean;
  isSocketConnected: boolean;
  isWaitingForResponse: boolean;
  handleSubmit: (event?: React.FormEvent) => void;
  stopRecording: (cancel?: boolean) => void;
  startRecording: () => void;
}

const renderFormattedText = (
  text: string,
  boldClassName: string,
): React.ReactNode[] =>
  text.split(/(\*\*.*?\*\*)/g).map((part, index) =>
    part.startsWith("**") && part.endsWith("**") ? (
      <span key={index} className={boldClassName}>
        {part.slice(2, -2)}
      </span>
    ) : (
      part
    ),
  );

export default function ChatWindow3DMessages({
  mode,
  contentPayload,
  contentRef,
  isContentExpanded,
  setIsContentExpanded,
  shouldShowExpandButton,
  playingAudioId,
  loadingAudioId,
  isCurrentlyPlaying,
  toggleAudio,
  onContentAudioComplete,
  chatLocked,
  messages,
  messagesEndRef,
  handleShowAssessment,
  onShowFeedback,
  resetInactivityTimer,
  message,
  setMessage,
  isRecording,
  recordTime,
  chatCompleted,
  isSocketConnected,
  isWaitingForResponse,
  handleSubmit,
  stopRecording,
  startRecording,
}: ChatWindow3DMessagesProps) {
  return (
    <>
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        {contentPayload && mode === "reading-mode" && (
          <ReadingPassageCard
            content={contentPayload.content}
            audioUrl={contentPayload.audioUrl}
            readingPresentation={contentPayload.readingPresentation}
            isPlaying={
              playingAudioId === "content-payload-audio" && isCurrentlyPlaying
            }
            onToggleAudio={
              contentPayload.audioUrl
                ? () =>
                    toggleAudio(
                      "content-payload-audio",
                      contentPayload.audioUrl,
                      () => onContentAudioComplete?.(true),
                    )
                : undefined
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
              {renderFormattedText(
                contentPayload.content,
                "font-bold text-blue-600",
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
                      undefined,
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
                  className="text-sm text-blue-600 p-0 h-auto"
                >
                  {isContentExpanded ? "See Less" : "See More"}
                </Button>
              )}
            </div>
          </div>
        )}

        {!chatLocked && (
          <>
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
                ) : msg.messageType === "audio" && msg.audioURL ? (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => toggleAudio(msg.id, msg.audioURL)}
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
                        {renderFormattedText(
                          msg.text,
                          "font-bold text-white opacity-90",
                        )}
                      </p>
                    )}
                    {msg.hasAssessment && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          handleShowAssessment(msg.assessments);
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
                    <div className="p-3 rounded-xl max-w-md shadow-sm break-words bg-white text-gray-800 rounded-tl-none">
                      {msg.text && (
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">
                          {renderFormattedText(
                            msg.text,
                            "font-bold text-blue-600",
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
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </>
        )}

        {chatLocked && (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-[#B9E1FF] bg-white p-6 text-center shadow-sm">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#E6F3FF] px-3 py-1 text-sm font-semibold text-[#2B6CB0] mb-3">
              <Info className="h-4 w-4" />
              Complete the activity
            </div>
            <p className="text-sm text-[#2F4B66]">
              Finish the avatar video and listening activity to unlock the chat.
            </p>
          </div>
        )}
      </div>

      {!chatLocked && (
        <form id="tour-chat-input" onSubmit={handleSubmit} className="border-t p-4 bg-gray-50">
          <div className="flex items-center bg-white rounded-full px-4 py-1 shadow-sm">
            <Input
              type="text"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
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
    </>
  );
}
