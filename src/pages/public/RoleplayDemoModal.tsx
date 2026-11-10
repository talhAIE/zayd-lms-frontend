import { lazy, useMemo } from 'react';
import LandingDemoDialog from './LandingDemoDialog';
import { createReadingDemoTransport, ROLEPLAY_DEMO_ID } from '@/services/readingDemoService';

const RoleplayMode = lazy(() => import('@/pages/student/topics/RolePlayModeTopics'));
export default function RoleplayDemoModal({ onClose }: { onClose: () => void }) {
  const transport = useMemo(() => createReadingDemoTransport('roleplay'), []);
  return (
    <LandingDemoDialog
      mode="roleplay"
      title="Try Roleplay Mode"
      description="Order at a cafe in three short exchanges. Speak or type your answers. Closing the demo resets the conversation."
      loadingText="Loading roleplay practice…"
      onClose={onClose}
    >
      {onComplete => <RoleplayMode demo={{ lessonModeId: ROLEPLAY_DEMO_ID, transport, onClose, onComplete }} />}
    </LandingDemoDialog>
  );
}
