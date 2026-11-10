import { lazy, useMemo } from 'react';
import LandingDemoDialog from './LandingDemoDialog';
import { createGrammarDemoApi } from '@/services/grammarDemoService';

const GrammarMode = lazy(() => import('@/pages/student/ComponentModePlay'));
export default function GrammarDemoModal({ onClose }: { onClose: () => void }) {
  const api = useMemo(() => createGrammarDemoApi(), []);
  return (
    <LandingDemoDialog
      mode="grammar"
      title="Try Grammar Mode"
      description="Learn am, is, and are, fill three blanks, and answer one question. Closing the demo resets all practice."
      loadingText="Loading grammar practice…"
      onClose={onClose}
      className="reading-demo-modal grammar-demo-modal"
    >
      {onComplete => <GrammarMode demo={{ api, onClose, onComplete }} />}
    </LandingDemoDialog>
  );
}
