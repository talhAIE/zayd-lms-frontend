import { lazy, useMemo } from 'react';
import LandingDemoDialog from './LandingDemoDialog';
import { createReadingDemoTransport, READING_DEMO_ID } from '@/services/readingDemoService';

const ReadingMode = lazy(() => import('@/pages/student/topics/ReadingModeTopics'));

export default function ReadingDemoModal({ onClose }: { onClose: () => void }) {
  const transport = useMemo(createReadingDemoTransport, []);
  return (
    <LandingDemoDialog
      mode="reading"
      title="Try Reading Mode"
      description="Listen to a short passage, practise reading three sentences, and answer one question. Closing the demo resets your practice."
      loadingText="Loading reading practice…"
      onClose={onClose}
    >
      {onComplete => <ReadingMode demo={{ lessonModeId: READING_DEMO_ID, transport, onClose, onComplete }} />}
    </LandingDemoDialog>
  );
}
