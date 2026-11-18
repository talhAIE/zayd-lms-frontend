import apiClient from "@/config/ApiConfig";
import axios from "axios";
import { sameStepOwner, type StepOwner } from "./stepService";
import type {
  StepEnvelope,
  StepSaveAnswerRequest,
} from "@/types/step.contract";
import type {
  StepPracticeAttemptView,
  StepPracticeTopic,
} from "@/types/step-practice.contract";
async function request<T>(
  owner: StepOwner,
  signal: AbortSignal,
  path: string,
  body?: unknown,
) {
  const current = () => sameStepOwner(owner, signal);
  if (!current()) throw new axios.CanceledError("STEP session changed");
  const response = await apiClient.request<StepEnvelope<T>>({
    url: "/step/practice" + path,
    method: body === undefined ? "GET" : "POST",
    data: body,
    signal,
    timeout: 30000,
    scienceSession: current,
  } as Parameters<typeof apiClient.request>[0]);
  if (!current()) throw new axios.CanceledError("STEP session changed");
  if (response.data?.status !== true || !response.data.data)
    throw new Error("Invalid STEP practice response");
  return response.data.data;
}
const id = encodeURIComponent;
export const stepPracticeService = {
  topic: (owner: StepOwner, signal: AbortSignal, topicId: string) =>
    request<StepPracticeTopic>(owner, signal, `/topics/${id(topicId)}`),
  attempt: (owner: StepOwner, signal: AbortSignal, attemptId: string) =>
    request<StepPracticeAttemptView>(
      owner,
      signal,
      `/attempts/${id(attemptId)}`,
    ),
  check: (
    owner: StepOwner,
    signal: AbortSignal,
    attemptId: string,
    questionId: string,
    body: StepSaveAnswerRequest,
  ) =>
    request<StepPracticeAttemptView>(
      owner,
      signal,
      `/attempts/${id(attemptId)}/questions/${id(questionId)}/check`,
      body,
    ),
  complete: (
    owner: StepOwner,
    signal: AbortSignal,
    attemptId: string,
    groupId: string,
    body: { requestId: string; expectedRevision: number },
  ) =>
    request<StepPracticeAttemptView>(
      owner,
      signal,
      `/attempts/${id(attemptId)}/groups/${id(groupId)}/complete`,
      body,
    ),
};
