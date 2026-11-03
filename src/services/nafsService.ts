import axios, { type AxiosRequestConfig } from 'axios';
import apiClient from '@/config/ApiConfig';
import type {
  NafsAssessmentView,
  NafsAttemptView,
  NafsCourseView,
  NafsEnvelope,
  NafsError,
  NafsResultView,
  NafsSaveAnswerRequest,
  NafsSaveAnswerResponse,
  NafsSubmitRequest,
} from '@/types/nafs.contract';

export interface NafsOwner {
  id: string;
  username: string;
}
export function sameNafsOwner(owner: NafsOwner, signal: AbortSignal) {
  try {
    const current = JSON.parse(localStorage.getItem('AiTutorUser') || 'null');
    return (
      !signal.aborted &&
      current?.id === owner.id &&
      current?.username === owner.username &&
      current?.role?.toLowerCase() === 'student'
    );
  } catch {
    return false;
  }
}
export function nafsErrorCode(error: unknown): NafsError['code'] | undefined {
  return axios.isAxiosError<NafsError>(error)
    ? error.response?.data?.code
    : undefined;
}
export function nafsErrorMessage(error: unknown) {
  switch (nafsErrorCode(error)) {
    case 'NAFS_DISABLED':
      return 'NAFS is currently unavailable.';
    case 'NAFS_NOT_FOUND':
      return 'This quiz is unavailable or you do not have access.';
    case 'NAFS_UNAVAILABLE':
      return 'NAFS could not load. Please try again.';
    default:
      return 'Could not connect to NAFS. Please check your connection and try again.';
  }
}
// The existing interceptor checks this request-local guard before sending,
// after refresh, and on response. NAFS shares normal authentication only.
type OwnedConfig = AxiosRequestConfig & { scienceSession: () => boolean };
async function request<T>(
  owner: NafsOwner,
  signal: AbortSignal,
  config: AxiosRequestConfig,
): Promise<T> {
  if (!sameNafsOwner(owner, signal))
    throw new axios.CanceledError('NAFS session changed');
  const response = await apiClient.request<NafsEnvelope<T>>({
    ...config,
    signal,
    timeout: 30000,
    scienceSession: () => sameNafsOwner(owner, signal),
  } as OwnedConfig);
  if (!sameNafsOwner(owner, signal))
    throw new axios.CanceledError('NAFS session changed');
  return response.data.data;
}
const id = encodeURIComponent;
export const nafsService = {
  async courses(owner: NafsOwner, signal: AbortSignal) {
    try {
      return await request<{ courses: NafsCourseView[] }>(owner, signal, {
        url: '/nafs/courses',
      });
    } catch (error) {
      if (
        sameNafsOwner(owner, signal) &&
        axios.isAxiosError(error) &&
        error.response?.status === 404
      )
        return { courses: [] };
      throw error;
    }
  },
  assessment: (owner: NafsOwner, signal: AbortSignal, assessmentId: string) =>
    request<{ assessment: NafsAssessmentView }>(owner, signal, {
      url: `/nafs/assessments/${id(assessmentId)}`,
    }),
  start: (owner: NafsOwner, signal: AbortSignal, assessmentId: string) =>
    request<{ attempt: NafsAttemptView }>(owner, signal, {
      url: `/nafs/assessments/${id(assessmentId)}/attempt`,
      method: 'POST',
      data: {},
    }),
  attempt: (owner: NafsOwner, signal: AbortSignal, attemptId: string) =>
    request<{ attempt: NafsAttemptView }>(owner, signal, {
      url: `/nafs/attempts/${id(attemptId)}`,
    }),
  save: (
    owner: NafsOwner,
    signal: AbortSignal,
    attemptId: string,
    questionId: string,
    data: NafsSaveAnswerRequest,
  ) =>
    request<{ saved: NafsSaveAnswerResponse }>(owner, signal, {
      url: `/nafs/attempts/${id(attemptId)}/answers/${id(questionId)}`,
      method: 'PUT',
      data,
    }),
  submit: (
    owner: NafsOwner,
    signal: AbortSignal,
    attemptId: string,
    data: NafsSubmitRequest,
  ) =>
    request<{ result: NafsResultView }>(owner, signal, {
      url: `/nafs/attempts/${id(attemptId)}/submit`,
      method: 'POST',
      data,
    }),
  async media(
    owner: NafsOwner,
    signal: AbortSignal,
    attemptId: string,
    assetId: string,
  ) {
    // Construct the authorized API route ourselves: never send a token to a
    // content-provided absolute URL or append it to an image query string.
    if (!sameNafsOwner(owner, signal)) throw new axios.CanceledError();
    const response = await apiClient.request<Blob>({
      url: `/nafs/attempts/${id(attemptId)}/assets/${id(assetId)}`,
      responseType: 'blob',
      signal,
      timeout: 30000,
      scienceSession: () => sameNafsOwner(owner, signal),
    } as OwnedConfig);
    if (!sameNafsOwner(owner, signal)) throw new axios.CanceledError();
    if (response.data.type.split(';')[0] !== 'image/png')
      throw new Error('NAFS image unavailable');
    return response.data;
  },
};
