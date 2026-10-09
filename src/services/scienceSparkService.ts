import axios from "axios";
import apiClient from "@/config/ApiConfig";
import type {
  ScienceSparkCoursesResponse,
  ScienceSparkUnitsResponse,
  ScienceSparkActivitiesResponse,
  ScienceSparkContentResponse,
  ScienceSparkOpenResponse,
  ScienceSparkCompleteResponse,
} from "@/types/science-spark.contract";

export interface ScienceOwner {
  id: string;
  username: string;
  sessionKey: string;
}
// Dedicated Science endpoints/state, shared authentication transport. Every
// initial request and queued refresh retry remains bound to its current owner.
function sameOwner(owner: ScienceOwner) {
  try {
    const user = JSON.parse(localStorage.getItem("AiTutorUser") || "null");
    return user?.id === owner.id && user?.username === owner.username;
  } catch {
    return false;
  }
}
function assertSession(owner: ScienceOwner, signal: AbortSignal) {
  if (signal.aborted || !sameOwner(owner)) throw new axios.CanceledError();
}
async function request<T>(
  owner: ScienceOwner,
  signal: AbortSignal,
  path: string,
  method: "GET" | "POST" = "GET",
): Promise<T> {
  assertSession(owner, signal);
  const config = {
    url: `/science-spark${path}`,
    method,
    signal,
    timeout: 30000,
    scienceSession: () => !signal.aborted && sameOwner(owner),
    ...(method === "POST" ? { data: {} } : {}),
  };
  const response = await apiClient.request<T>(config);
  assertSession(owner, signal);
  return response.data;
}
const unit = (key: string) => `/units/${encodeURIComponent(key)}/activities`;
const activity = (unitKey: string, key: string) =>
  `${unit(unitKey)}/${encodeURIComponent(key)}`;
export const scienceSparkService = {
  courses: async (o: ScienceOwner, s: AbortSignal): Promise<ScienceSparkCoursesResponse> => {
    try {
      return await request<ScienceSparkCoursesResponse>(o, s, "/courses");
    } catch (error) {
      assertSession(o, s);
      // Older production backends do not expose the optional pilot API.
      // Only course discovery treats a missing route as unavailable.
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return { status: true, data: { available: false, courses: [] } };
      }
      throw error;
    }
  },
  units: (o: ScienceOwner, s: AbortSignal, key: string) =>
    request<ScienceSparkUnitsResponse>(
      o,
      s,
      `/courses/${encodeURIComponent(key)}/units`,
    ),
  activities: (o: ScienceOwner, s: AbortSignal, key: string) =>
    request<ScienceSparkActivitiesResponse>(o, s, unit(key)),
  content: (o: ScienceOwner, s: AbortSignal, u: string, a: string) =>
    request<ScienceSparkContentResponse>(o, s, `${activity(u, a)}/content`),
  open: (o: ScienceOwner, s: AbortSignal, u: string, a: string) =>
    request<ScienceSparkOpenResponse>(o, s, `${activity(u, a)}/open`, "POST"),
  complete: (o: ScienceOwner, s: AbortSignal, u: string, a: string) =>
    request<ScienceSparkCompleteResponse>(
      o,
      s,
      `${activity(u, a)}/complete`,
      "POST",
    ),
};
export function scienceError(error: unknown): string {
  const status = axios.isAxiosError(error) ? error.response?.status : undefined;
  if (status === 401)
    return "Your session has expired. Sign in again to continue.";
  if (status === 403 || status === 404)
    return "Science is not available for this account or activity.";
  return "Science could not be saved or loaded. Please retry.";
}
