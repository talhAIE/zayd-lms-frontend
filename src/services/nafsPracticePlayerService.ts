import axios, { type AxiosRequestConfig } from "axios";
import apiClient from "@/config/ApiConfig";
import { samePracticeOwner } from "./nafsPracticeDiscoveryService";
import type {
  PracticeOwner,
  PracticeSessionView,
  PracticeEnvelope,
  PracticeCheckRequest,
  PracticeCheckedAnswer,
  PracticeSavedSelection,
  PracticeMutationRequest,
  PracticeCompletedSession,
} from "@/types/nafs-practice.contract";

type OwnedConfig = AxiosRequestConfig & { scienceSession: () => boolean };
async function request<T>(
  owner: PracticeOwner,
  signal: AbortSignal,
  config: AxiosRequestConfig,
) {
  if (!samePracticeOwner(owner, signal))
    throw new axios.CanceledError("Practice account changed");
  const response = await apiClient.request<T>({
    ...config,
    signal,
    timeout: config.timeout ?? 30000,
    scienceSession: () => samePracticeOwner(owner, signal),
  } as OwnedConfig);
  if (!samePracticeOwner(owner, signal))
    throw new axios.CanceledError("Practice account changed");
  return response.data;
}
const id = encodeURIComponent;
export const nafsPracticePlayerService = {
  async start(
    owner: PracticeOwner,
    signal: AbortSignal,
    collectionId: string,
    data: { requestId: string },
  ) {
    return (
      await request<PracticeEnvelope<{ session: PracticeSessionView }>>(
        owner,
        signal,
        {
          url: `/nafs/practice/collections/${id(collectionId)}/sessions`,
          method: "POST",
          data,
        },
      )
    ).data;
  },
  async save(
    owner: PracticeOwner,
    signal: AbortSignal,
    sessionId: string,
    questionId: string,
    data: PracticeCheckRequest,
  ) {
    return (
      await request<PracticeEnvelope<{ saved: PracticeSavedSelection }>>(
        owner,
        signal,
        {
          url: `/nafs/practice/sessions/${id(sessionId)}/selections/${id(questionId)}`,
          method: "PUT",
          data,
        },
      )
    ).data;
  },
  async complete(
    owner: PracticeOwner,
    signal: AbortSignal,
    sessionId: string,
    data: PracticeMutationRequest,
  ) {
    return (
      await request<PracticeEnvelope<{ session: PracticeCompletedSession }>>(
        owner,
        signal,
        {
          url: `/nafs/practice/sessions/${id(sessionId)}/complete`,
          method: "POST",
          data,
        },
      )
    ).data;
  },
  async repeat(
    owner: PracticeOwner,
    signal: AbortSignal,
    sessionId: string,
    data: PracticeMutationRequest,
  ) {
    return (
      await request<PracticeEnvelope<{ session: PracticeSessionView }>>(
        owner,
        signal,
        {
          url: `/nafs/practice/sessions/${id(sessionId)}/repeat`,
          method: "POST",
          data,
        },
      )
    ).data;
  },
  async session(owner: PracticeOwner, signal: AbortSignal, sessionId: string) {
    return (
      await request<PracticeEnvelope<{ session: PracticeSessionView }>>(
        owner,
        signal,
        {
          url: `/nafs/practice/sessions/${id(sessionId)}`,
        },
      )
    ).data;
  },
  async check(
    owner: PracticeOwner,
    signal: AbortSignal,
    sessionId: string,
    questionId: string,
    data: PracticeCheckRequest,
  ) {
    return (
      await request<PracticeEnvelope<{ checked: PracticeCheckedAnswer }>>(
        owner,
        signal,
        {
          url: `/nafs/practice/sessions/${id(sessionId)}/questions/${id(questionId)}/check`,
          timeout: 75000,
          method: "POST",
          data,
        },
      )
    ).data;
  },
  async media(
    owner: PracticeOwner,
    signal: AbortSignal,
    sessionId: string,
    assetId: string,
  ) {
    const blob = await request<Blob>(owner, signal, {
      url: `/nafs/practice/sessions/${id(sessionId)}/assets/${id(assetId)}`,
      responseType: "blob",
    });
    if (blob.type.split(";")[0] !== "image/png" || blob.size > 20 * 1024 * 1024)
      throw new Error("Practice image unavailable");
    return blob;
  },
};
