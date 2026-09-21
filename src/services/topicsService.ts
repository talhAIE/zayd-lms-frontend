import apiClient from '@/config/ApiConfig';
import { Topic } from '@/redux/slices/topicsSlice';
import { ChapterTopicsResponse, Chapter } from '@/types/chapter.types';

// Update interface to match backend response structure
export interface TopicsResponse {
  statusMessage: string;
  data: {
    topics?: Topic[];
    chapters?: Chapter[];
    isChapterBased: boolean;
  };
}

export interface AvailableMode {
  mode: string;
  topicMode: string;
  displayName: string;
  isAvailable: boolean;
  isChapterBased: boolean;
  totalItems: number;
  children?: AvailableMode[];
}

export interface AvailableModesResponse {
  statusMessage: string;
  data: {
    modes: AvailableMode[];
  };
}

const LMS_MODE_FALLBACK: AvailableMode[] = [
  'chat-mode',
  'photo-mode',
  'reading-mode',
  'roleplay-mode',
  'listening-mode',
  'debate-mode',
  'curriculum-mode',
  '3d-reading-mode',
  '3d-roleplay-mode',
  '3d-listening-mode',
].map((topicMode) => ({
  mode: topicMode,
  topicMode,
  displayName: topicMode,
  isAvailable: true,
  isChapterBased: false,
  totalItems: 0,
}));

export const TopicService = {
  // The legacy Topic module is intentionally absent from the LMS API. Its
  // former endpoint failed open, so retain that behaviour without issuing a
  // guaranteed 404 on every login or learning-mode page visit.
  getAvailableModes: async (_userId: string) => ({
    data: {
      statusMessage: 'success',
      data: { modes: LMS_MODE_FALLBACK },
    } satisfies AvailableModesResponse,
  }),

  getTopics: (userId: string, topicMode: string) => {
    return apiClient.post<TopicsResponse>('/topic/search', {
      userId,
      topicMode
    });
  },

  getTopicById: (topicId: string) => {
    return apiClient.get<{ status: string; data: Topic }>(`/topics/${topicId}`);
  },

  getChapterTopics: (chapterId: string, userId: string) => {
    return apiClient.get<ChapterTopicsResponse>(`/topic/chapter/${chapterId}/topics?userId=${userId}`);
  },

};

export default TopicService;
