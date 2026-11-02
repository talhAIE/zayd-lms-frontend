import { lazy, Suspense, useMemo } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { createReadingDemoTransport, ROLEPLAY_DEMO_ID } from '@/services/readingDemoService';
import './reading-demo.css';

const RoleplayMode = lazy(() => import('@/pages/student/topics/RolePlayModeTopics'));
export default function RoleplayDemoModal({ onClose }: { onClose: () => void }) {
  const transport = useMemo(() => createReadingDemoTransport('roleplay'), []);
  const demo = useMemo(() => ({ lessonModeId: ROLEPLAY_DEMO_ID, transport, onClose }), [transport, onClose]);
  return (
    <Dialog open onOpenChange={open => { if (!open) onClose(); }}>
      <DialogContent className="reading-demo-modal" dir="ltr" onPointerDownOutside={event => event.preventDefault()}>
        <DialogTitle className="sr-only">Try Roleplay Mode</DialogTitle>
        <DialogDescription className="sr-only">Order at a cafe in three short exchanges. Speak or type your answers. Closing the demo resets the conversation.</DialogDescription>
        <Suspense fallback={<p role="status" className="p-10 text-center">Loading roleplay practice…</p>}>
          <RoleplayMode demo={demo} />
        </Suspense>
      </DialogContent>
    </Dialog>
  );
}
