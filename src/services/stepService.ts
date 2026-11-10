import axios, { type AxiosRequestConfig } from "axios";
import apiClient from "@/config/ApiConfig";
import type {
  StepAttemptView,
  StepAudioAccess,
  StepCourseView,
  StepCoursesView,
  StepEnvelope,
  StepError,
  StepResult,
  StepSaveAnswerRequest,
  StepSaveAnswerResponse,
  StepSectionView,
  StepSubmitRequest,
  StepTopicOverview,
} from "@/types/step.contract";

export interface StepOwner {
  id: string;
  username: string;
  region: string;
}
export const stepOwnerKey = (owner: StepOwner) =>
  JSON.stringify([owner.id, owner.username, owner.region]);
export function sameStepOwner(owner: StepOwner, signal: AbortSignal) {
  try {
    const user = JSON.parse(localStorage.getItem("AiTutorUser") || "null");
    return (
      !signal.aborted &&
      user?.id === owner.id &&
      user?.username === owner.username &&
      user?.role?.toLowerCase() === "student" &&
      (user.region ?? "ROW") === owner.region
    );
  } catch {
    return false;
  }
}
export function stepErrorCode(error: unknown): StepError["code"] | undefined {
  return axios.isAxiosError<StepError>(error)
    ? error.response?.data?.code
    : undefined;
}
export function stepUnavailable(error: unknown) {
  return (
    stepErrorCode(error) === "STEP_DISABLED" ||
    (axios.isAxiosError(error) &&
      [403, 404].includes(error.response?.status ?? 0))
  );
}
export function stepErrorMessage(error: unknown) {
  if (stepErrorCode(error) === "STEP_DISABLED")
    return "STEP is currently unavailable.";
  if (stepUnavailable(error))
    return "This STEP activity is unavailable or you do not have access.";
  return "STEP could not load. Please check your connection and try again.";
}
type OwnedConfig = AxiosRequestConfig & { scienceSession: () => boolean };
async function request<T>(
  owner: StepOwner,
  signal: AbortSignal,
  config: AxiosRequestConfig,
): Promise<T> {
  if (!sameStepOwner(owner, signal))
    throw new axios.CanceledError("STEP account changed");
  const response = await apiClient.request<StepEnvelope<T>>({
    ...config,
    signal,
    timeout: 30000,
    scienceSession: () => sameStepOwner(owner, signal),
  } as OwnedConfig);
  if (!sameStepOwner(owner, signal))
    throw new axios.CanceledError("STEP account changed");
  if (response.data?.status !== true || response.data.data == null)
    throw new Error("Invalid STEP response");
  return response.data.data;
}
const id = encodeURIComponent;
// Transport is prepared here; Phase 6 binds the mutation methods to the session driver.
export const stepService = {
  courses: async (owner: StepOwner, signal: AbortSignal) => {
    try {
      const value = await request<StepCoursesView>(owner, signal, {
        url: "/step/courses",
      });
      if (!Array.isArray(value.courses))
        throw new Error("Invalid STEP courses");
      return value;
    } catch (error) {
      if (sameStepOwner(owner, signal) && stepUnavailable(error))
        return { courses: [] };
      throw error;
    }
  },
  course: (owner: StepOwner, signal: AbortSignal, courseId: string) =>
    request<StepCourseView>(owner, signal, {
      url: `/step/courses/${id(courseId)}`,
    }),
  section: (owner: StepOwner, signal: AbortSignal, sectionId: string) =>
    request<StepSectionView>(owner, signal, {
      url: `/step/sections/${id(sectionId)}`,
    }),
  overview: (owner: StepOwner, signal: AbortSignal, topicId: string) =>
    request<StepTopicOverview>(owner, signal, {
      url: `/step/topics/${id(topicId)}`,
    }),
  attempt: (owner: StepOwner, signal: AbortSignal, attemptId: string) =>
    request<StepAttemptView>(owner, signal, {
      url: `/step/attempts/${id(attemptId)}`,
    }),
  start: (owner: StepOwner, signal: AbortSignal, topicId: string) =>
    request<StepAttemptView>(owner, signal, {
      url: `/step/topics/${id(topicId)}/attempt`,
      method: "POST",
      data: {},
    }),
  save: (
    owner: StepOwner,
    signal: AbortSignal,
    attemptId: string,
    questionId: string,
    data: StepSaveAnswerRequest,
  ) =>
    request<StepSaveAnswerResponse>(owner, signal, {
      url: `/step/attempts/${id(attemptId)}/answers/${id(questionId)}`,
      method: "PUT",
      data,
    }),
  submit: (
    owner: StepOwner,
    signal: AbortSignal,
    attemptId: string,
    data: StepSubmitRequest,
  ) =>
    request<StepResult>(owner, signal, {
      url: `/step/attempts/${id(attemptId)}/submit`,
      method: "POST",
      data,
    }),
  result: (owner: StepOwner, signal: AbortSignal, attemptId: string) =>
    request<StepResult>(owner, signal, {
      url: `/step/attempts/${id(attemptId)}/result`,
    }),
  audio: (
    owner: StepOwner,
    signal: AbortSignal,
    attemptId: string,
    assetId: string,
  ) =>
    request<StepAudioAccess>(owner, signal, {
      url: `/step/attempts/${id(attemptId)}/audio/${id(assetId)}/access`,
      method: "POST",
      data: {},
    }),
};
