import { lazy, Suspense, useMemo } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { createComponentDemoApi, grammarDemoMode } from '@/services/grammarDemoService';
import './reading-demo.css';

const WritingMode = lazy(() => import('@/pages/student/ComponentModePlay'));
const mode = { ...grammarDemoMode, id: '90e5bf67-55c3-4f87-84b7-50df58518696', lessonId: '90e5bf67-55c3-4f87-84b7-50df58518696',
  title: 'Writing Mode', modeKey: 'writing-mode', description: 'A short paragraph about your daily routine.' };
export default function WritingDemoModal({ onClose }: { onClose: () => void }) {
  const api = useMemo(() => createComponentDemoApi('writing'), []);
  const demo = useMemo(() => ({ api, mode, writing: api, onClose }), [api, onClose]);
  return (
    <Dialog open onOpenChange={open => { if (!open) onClose(); }}>
      <DialogContent className="reading-demo-modal grammar-demo-modal writing-demo-modal" dir="ltr" onPointerDownOutside={event => event.preventDefault()}>
        <DialogTitle className="sr-only">Try Writing Mode</DialogTitle>
        <DialogDescription className="sr-only">Write three short sentences, build your paragraph, and get AI writing feedback. Use fictional details. Closing the demo resets all writing.</DialogDescription>
        <Suspense fallback={<p role="status" className="p-10 text-center">Loading writing practice…</p>}><WritingMode demo={demo} /></Suspense>
      </DialogContent>
    </Dialog>
  );
}
