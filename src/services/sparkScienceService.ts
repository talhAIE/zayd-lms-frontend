import axios from "axios";
import apiClient from "@/config/ApiConfig";
import type { ScienceOwner } from "./scienceSparkService";

export type SparkActivityKey =
  "introduction" | "lesson-1" | "lesson-2" | "lesson-3" | "module-review";
export interface SparkActivity {
  key: SparkActivityKey;
  title: string;
  kind: "introduction" | "lesson" | "review";
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
      user?.username === owner.username
    );
  } catch {
    return false;
  }
}
async function request<T>(
  owner: ScienceOwner,
  signal: AbortSignal,
  path: string,
  method: "GET" | "POST" = "GET",
): Promise<T> {
  if (!sameOwner(owner, signal))
    throw new axios.CanceledError("Science session changed");
  const response = await apiClient.request<{ status: true; data: T }>({
    url: `/spark-science${path}`,
    method,
    signal,
    timeout: 30000,
    ...(method === "POST" ? { data: {} } : {}),
    scienceSession: () => sameOwner(owner, signal),
  } as any);
  if (!sameOwner(owner, signal))
    throw new axios.CanceledError("Science session changed");
  return response.data.data;
}
export const sparkScienceService = {
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
