import axios from "axios";
import apiClient from "@/config/ApiConfig";
import type { ScienceOwner } from "./scienceSparkService";

export type SparkActivityKey = string;
export interface SparkActivity {
  key: SparkActivityKey;
  title: string;
  kind:
    | "introduction"
    | "lesson"
    | "review"
    | "interactive_lesson"
    | "quiz"
    | "kahoot"
    | "phet";
  activities?: SparkActivity[];
  targets?: { key: string; title: string; url: string }[];
  opened: boolean;
  completed: boolean;
}
export interface SparkCourse {
  key: string;
  title: string;
  description: string;
  grade: string;
  unitKey: string;
  unitTitle: string;
  progressPct: number;
  completedActivities: number;
  totalActivities: number;
  completedUnits: number;
  status: "not_started" | "in_progress" | "completed";
  activities: SparkActivity[];
}
export interface SparkCourseResult {
  available: boolean;
  course: SparkCourse | null;
}
export interface SparkViewer {
  path: string;
  nonce: string;
  activityKey: SparkActivityKey;
  expiresAt: string;
}

function sameOwner(owner: ScienceOwner, signal: AbortSignal) {
  try {
    const user = JSON.parse(localStorage.getItem("AiTutorUser") || "null");
    return (
      !signal.aborted &&
      user?.id === owner.id &&
      user?.username === owner.username &&
      user?.role?.toLowerCase() === "student" &&
      (user?.region ?? "ROW") === (owner.region ?? "ROW")
    );
  } catch {
    return false;
  }
}
async function request<T>(
  owner: ScienceOwner,
  signal: AbortSignal,
  path: string,
  method: "GET" | "POST" | "PUT" = "GET",
  body: unknown = {},
): Promise<T> {
  if (!sameOwner(owner, signal))
    throw new axios.CanceledError("Science session changed");
  const response = await apiClient.request<{ status: true; data: T }>({
    url: `/spark-science${path}`,
    method,
    signal,
    timeout: path.endsWith("/grade") ? 210000 : 30000,
    ...(method !== "GET" ? { data: body } : {}),
    scienceSession: () => sameOwner(owner, signal),
  } as any);
  if (!sameOwner(owner, signal))
    throw new axios.CanceledError("Science session changed");
  return response.data.data;
}
export interface SparkQuestion {
  id: string;
  sourceLabel: string;
  componentType: string;
  points: number;
  prompt: string;
  options: { id: string; label: string; text: string }[];
  stimuli: {
    type: string;
    path?: string;
    alt?: string;
    headers?: string[];
    rows?: string[][];
  }[];
  fields?: { id: string; label: string; unit?: string }[];
}
export interface SparkQuizAttempt {
  id: string;
  quizKey: string;
  title: string;
  state: "in_progress" | "grading" | "submitted";
  revision: number;
  questions: SparkQuestion[];
  answers: Record<string, Record<string, string>>;
  score: number | null;
  maxScore: number;
  gradedItems: number;
  feedback: Record<
    string,
    { score: number; maxScore: number; feedback: string }
  > | null;
}
export const sparkScienceService = {
  open: (o: ScienceOwner, s: AbortSignal, k: string) =>
    request<SparkActivity>(
      o,
      s,
      `/activities/${encodeURIComponent(k)}/open`,
      "POST",
    ),
  startQuiz: (o: ScienceOwner, s: AbortSignal, k: string) =>
    request<SparkQuizAttempt>(
      o,
      s,
      `/activities/${encodeURIComponent(k)}/quiz`,
      "POST",
    ),
  attempt: (o: ScienceOwner, s: AbortSignal, id: string) =>
    request<SparkQuizAttempt>(o, s, `/attempts/${encodeURIComponent(id)}`),
  save: (
    o: ScienceOwner,
    s: AbortSignal,
    id: string,
    revision: number,
    answers: SparkQuizAttempt["answers"],
  ) =>
    request<SparkQuizAttempt>(
      o,
      s,
      `/attempts/${encodeURIComponent(id)}/answers`,
      "PUT",
      { revision, answers },
    ),
  submit: (
    o: ScienceOwner,
    s: AbortSignal,
    id: string,
    revision: number,
    requestId: string,
  ) =>
    request<SparkQuizAttempt>(
      o,
      s,
      `/attempts/${encodeURIComponent(id)}/submit`,
      "POST",
      { revision, requestId },
    ),
  grade: (o: ScienceOwner, s: AbortSignal, id: string) =>
    request<SparkQuizAttempt>(
      o,
      s,
      `/attempts/${encodeURIComponent(id)}/grade`,
      "POST",
    ),
  image: async (
    o: ScienceOwner,
    s: AbortSignal,
    id: string,
    filename: string,
  ) => {
    if (!sameOwner(o, s)) throw new axios.CanceledError();
    const response = await apiClient.get(
      `/spark-science/attempts/${encodeURIComponent(id)}/images/${encodeURIComponent(filename)}`,
      {
        signal: s,
        responseType: "blob",
        scienceSession: () => sameOwner(o, s),
      } as any,
    );
    if (!sameOwner(o, s)) throw new axios.CanceledError();
    return response.data as Blob;
  },
  course: async (
    owner: ScienceOwner,
    signal: AbortSignal,
  ): Promise<SparkCourseResult> => {
    try {
      return await request(owner, signal, "/course");
    } catch (error) {
      if (!sameOwner(owner, signal)) throw new axios.CanceledError();
      if (axios.isAxiosError(error) && error.response?.status === 404)
        return { available: false, course: null };
      throw error;
    }
  },
  viewer: (owner: ScienceOwner, signal: AbortSignal, key: SparkActivityKey) =>
    request<SparkViewer>(
      owner,
      signal,
      `/activities/${encodeURIComponent(key)}/viewer`,
      "POST",
    ),
  complete: (owner: ScienceOwner, signal: AbortSignal, key: SparkActivityKey) =>
    request<SparkCourseResult>(
      owner,
      signal,
      `/activities/${encodeURIComponent(key)}/complete`,
      "POST",
    ),
};
export function sparkViewerUrl(viewer: SparkViewer) {
  if (
    !viewer.path.startsWith("/spark-science/view/") ||
    viewer.path.includes("://")
  )
    throw new Error("Unexpected Science viewer");
  return new URL(
    `${(apiClient.defaults.baseURL || "/api/v1").replace(/\/$/, "")}${viewer.path}`,
    window.location.origin,
  ).href;
}
