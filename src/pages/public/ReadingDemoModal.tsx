import { lazy, Suspense, useMemo } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { createReadingDemoTransport, READING_DEMO_ID } from '@/services/readingDemoService';
import './reading-demo.css';

const ReadingMode = lazy(() => import('@/pages/student/topics/ReadingModeTopics'));

export default function ReadingDemoModal({ onClose }: { onClose: () => void }) {
  const transport = useMemo(createReadingDemoTransport, []);
  const demo = useMemo(() => ({ lessonModeId: READING_DEMO_ID, transport, onClose }), [transport, onClose]);
  return (
    <Dialog open onOpenChange={open => { if (!open) onClose(); }}>
      <DialogContent className="reading-demo-modal" dir="ltr" onPointerDownOutside={event => event.preventDefault()}>
        <DialogTitle className="sr-only">Try Reading Mode</DialogTitle>
        <DialogDescription className="sr-only">Listen to a short passage, practise reading three sentences, and answer one question. Closing the demo resets your practice.</DialogDescription>
        <Suspense fallback={<p role="status" className="p-10 text-center">Loading reading practice…</p>}>
          <ReadingMode demo={demo} />
        </Suspense>
      </DialogContent>
    </Dialog>
  );
}
