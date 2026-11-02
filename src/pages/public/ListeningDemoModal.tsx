import { lazy, Suspense, useMemo } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { createReadingDemoTransport, LISTENING_DEMO_ID } from '@/services/readingDemoService';
import './reading-demo.css';

const ListeningMode = lazy(() => import('@/pages/student/topics/ListeningModeTopics'));
export default function ListeningDemoModal({ onClose }: { onClose: () => void }) {
  const transport = useMemo(() => createReadingDemoTransport('listening'), []);
  const demo = useMemo(() => ({ lessonModeId: LISTENING_DEMO_ID, transport, onClose }), [transport, onClose]);
  return (
    <Dialog open onOpenChange={open => { if (!open) onClose(); }}>
      <DialogContent className="reading-demo-modal" dir="ltr" onPointerDownOutside={event => event.preventDefault()}>
        <DialogTitle className="sr-only">Try Listening Mode</DialogTitle>
        <DialogDescription className="sr-only">Listen to a short story twice and answer one quiz question. Closing the demo resets your practice.</DialogDescription>
        <Suspense fallback={<p role="status" className="p-10 text-center">Loading listening practice…</p>}>
          <ListeningMode demo={demo} />
        </Suspense>
      </DialogContent>
    </Dialog>
  );
}
