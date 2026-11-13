import axios, { type AxiosRequestConfig } from "axios";
import apiClient from "@/config/ApiConfig";
import type { NafsOwner } from "./nafsService";
import { sameNafsOwner } from "./nafsService";
import type {
  NafsModesView,
  PracticeOwner,
  PracticeEnvelope,
  PracticeCollectionsView,
  PracticeCollectionOverview,
  PracticeError,
} from "@/types/nafs-practice.contract";

// Discovery only. No session creation, grading or recovery writes in Phase 4.
export function samePracticeOwner(owner: PracticeOwner, signal: AbortSignal) {
  try {
    const current = JSON.parse(localStorage.getItem("AiTutorUser") || "null");
    return sameNafsOwner(owner, signal) && current?.region === owner.region;
  } catch {
    return false;
  }
}
type OwnedConfig = AxiosRequestConfig & { scienceSession: () => boolean };
async function read<T>(
  url: string,
  signal: AbortSignal,
  owns: () => boolean,
  params?: Record<string, string>,
): Promise<T> {
  if (!owns()) throw new axios.CanceledError("NAFS account changed");
  const response = await apiClient.request<PracticeEnvelope<T>>({
    url,
    params,
    signal,
    timeout: 30000,
    scienceSession: owns,
  } as OwnedConfig);
  if (!owns()) throw new axios.CanceledError("NAFS account changed");
  return response.data.data;
}
export const nafsPracticeDiscoveryService = {
  modes: (owner: NafsOwner, signal: AbortSignal, courseId: string) => {
    const region = storedRegion();
    return read<NafsModesView>(
      `/nafs/courses/${encodeURIComponent(courseId)}/modes`,
      signal,
      () => sameNafsOwner(owner, signal) && storedRegion() === region,
    );
  },
  collections: (owner: PracticeOwner, signal: AbortSignal, courseId: string) =>
    read<PracticeCollectionsView>(
      "/nafs/practice/collections",
      signal,
      () => samePracticeOwner(owner, signal),
      { courseId },
    ),
  overview: (owner: PracticeOwner, signal: AbortSignal, collectionId: string) =>
    read<{ collection: PracticeCollectionOverview }>(
      `/nafs/practice/collections/${encodeURIComponent(collectionId)}`,
      signal,
      () => samePracticeOwner(owner, signal),
    ),
};
function storedRegion(): unknown {
  try {
    return JSON.parse(localStorage.getItem("AiTutorUser") || "null")?.region;
  } catch {
    return null;
  }
}
export function practiceDiscoveryMessage(error: unknown) {
  const code = axios.isAxiosError<PracticeError>(error)
    ? error.response?.data?.code
    : undefined;
  if (code === "NAFS_PRACTICE_DISABLED")
    return "Practice Mode is currently unavailable.";
  if (code === "NAFS_PRACTICE_NOT_FOUND")
    return "This practice content is unavailable or you do not have access.";
  return "Practice Mode could not load. Check your connection and try again.";
}
