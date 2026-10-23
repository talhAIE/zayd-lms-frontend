import { createContext } from 'react';
import type { Socket } from 'socket.io-client';
import type { uploadReadingAudio } from '@/utils/readingAudioUpload';

export interface AvatarReadingTransport {
  connect: () => Socket;
  upload: typeof uploadReadingAudio;
  storagePrefix: string;
}

// Ordinary LMS screens use the existing socket and upload implementation.
export const AvatarReadingContext = createContext<AvatarReadingTransport | null>(null);
