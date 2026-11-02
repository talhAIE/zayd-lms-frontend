import { lazy, Suspense, useMemo } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { createGrammarDemoApi } from '@/services/grammarDemoService';
import './reading-demo.css';

const GrammarMode = lazy(() => import('@/pages/student/ComponentModePlay'));
export default function GrammarDemoModal({ onClose }: { onClose: () => void }) {
  const api = useMemo(() => createGrammarDemoApi(), []);
  const demo = useMemo(() => ({ api, onClose }), [api, onClose]);
  return (
    <Dialog open onOpenChange={open => { if (!open) onClose(); }}>
      <DialogContent className="reading-demo-modal grammar-demo-modal" dir="ltr" onPointerDownOutside={event => event.preventDefault()}>
        <DialogTitle className="sr-only">Try Grammar Mode</DialogTitle>
        <DialogDescription className="sr-only">Learn am, is, and are, fill three blanks, and answer one question. Closing the demo resets all practice.</DialogDescription>
        <Suspense fallback={<p role="status" className="p-10 text-center">Loading grammar practice…</p>}>
          <GrammarMode demo={demo} />
        </Suspense>
      </DialogContent>
    </Dialog>
  );
}
