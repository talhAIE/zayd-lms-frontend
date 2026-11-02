import { lazy, Suspense, useMemo } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { createComponentDemoApi, grammarDemoMode } from '@/services/grammarDemoService';
import './reading-demo.css';

const VocabularyMode = lazy(() => import('@/pages/student/ComponentModePlay'));
const mode = { ...grammarDemoMode, id: 'ad064c10-df74-4d6f-a1b9-6bc671eae1f5', lessonId: 'ad064c10-df74-4d6f-a1b9-6bc671eae1f5',
  title: 'Vocabulary Mode', modeKey: 'vocabulary-mode', description: 'Learn three words for a visit to the library.' };
export default function VocabularyDemoModal({ onClose }: { onClose: () => void }) {
  const api = useMemo(() => createComponentDemoApi('vocabulary'), []);
  const demo = useMemo(() => ({ api, mode, onClose }), [api, onClose]);
  return (
    <Dialog open onOpenChange={open => { if (!open) onClose(); }}>
      <DialogContent className="reading-demo-modal grammar-demo-modal" dir="ltr" onPointerDownOutside={event => event.preventDefault()}>
        <DialogTitle className="sr-only">Try Vocabulary Mode</DialogTitle>
        <DialogDescription className="sr-only">Reveal three flashcards, match the words to their meanings, and answer one question. Closing resets all practice.</DialogDescription>
        <Suspense fallback={<p role="status" className="p-10 text-center">Loading vocabulary practice…</p>}><VocabularyMode demo={demo} /></Suspense>
      </DialogContent>
    </Dialog>
  );
}
