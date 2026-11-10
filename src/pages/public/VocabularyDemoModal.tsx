import { lazy, useMemo } from 'react';
import LandingDemoDialog from './LandingDemoDialog';
import { createComponentDemoApi, grammarDemoMode } from '@/services/grammarDemoService';

const VocabularyMode = lazy(() => import('@/pages/student/ComponentModePlay'));
const mode = { ...grammarDemoMode, id: 'ad064c10-df74-4d6f-a1b9-6bc671eae1f5', lessonId: 'ad064c10-df74-4d6f-a1b9-6bc671eae1f5',
  title: 'Vocabulary Mode', modeKey: 'vocabulary-mode', description: 'Learn three words for a visit to the library.' };
export default function VocabularyDemoModal({ onClose }: { onClose: () => void }) {
  const api = useMemo(() => createComponentDemoApi('vocabulary'), []);
  return (
    <LandingDemoDialog
      mode="vocabulary"
      title="Try Vocabulary Mode"
      description="Reveal three flashcards, match the words to their meanings, and answer one question. Closing resets all practice."
      loadingText="Loading vocabulary practice…"
      onClose={onClose}
      className="reading-demo-modal grammar-demo-modal"
    >
      {onComplete => <VocabularyMode demo={{ api, mode, onClose, onComplete }} />}
    </LandingDemoDialog>
  );
}
