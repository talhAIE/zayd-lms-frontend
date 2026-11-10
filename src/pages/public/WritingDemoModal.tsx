import { lazy, useMemo } from 'react';
import LandingDemoDialog from './LandingDemoDialog';
import { createComponentDemoApi, grammarDemoMode } from '@/services/grammarDemoService';

const WritingMode = lazy(() => import('@/pages/student/ComponentModePlay'));
const mode = { ...grammarDemoMode, id: '90e5bf67-55c3-4f87-84b7-50df58518696', lessonId: '90e5bf67-55c3-4f87-84b7-50df58518696',
  title: 'Writing Mode', modeKey: 'writing-mode', description: 'A short paragraph about your daily routine.' };
export default function WritingDemoModal({ onClose }: { onClose: () => void }) {
  const api = useMemo(() => createComponentDemoApi('writing'), []);
  return (
    <LandingDemoDialog
      mode="writing"
      title="Try Writing Mode"
      description="Write three short sentences, build your paragraph, and get AI writing feedback. Use fictional details. Closing the demo resets all writing."
      loadingText="Loading writing practice…"
      onClose={onClose}
      className="reading-demo-modal grammar-demo-modal writing-demo-modal"
    >
      {onComplete => <WritingMode demo={{ api, mode, writing: api, onClose, onComplete }} />}
    </LandingDemoDialog>
  );
}
