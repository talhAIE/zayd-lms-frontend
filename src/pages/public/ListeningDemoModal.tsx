import { lazy, useMemo } from 'react';
import LandingDemoDialog from './LandingDemoDialog';
import { createReadingDemoTransport, LISTENING_DEMO_ID } from '@/services/readingDemoService';

const ListeningMode = lazy(() => import('@/pages/student/topics/ListeningModeTopics'));
export default function ListeningDemoModal({ onClose }: { onClose: () => void }) {
  const transport = useMemo(() => createReadingDemoTransport('listening'), []);
  return (
    <LandingDemoDialog
      mode="listening"
      title="Try Listening Mode"
      description="Listen to a short story twice and answer one quiz question. Closing the demo resets your practice."
      loadingText="Loading listening practice…"
      onClose={onClose}
    >
      {onComplete => <ListeningMode demo={{ lessonModeId: LISTENING_DEMO_ID, transport, onClose, onComplete }} />}
    </LandingDemoDialog>
  );
}
