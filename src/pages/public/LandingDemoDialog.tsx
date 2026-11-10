import { Suspense, useCallback, useState, type ReactNode } from "react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import LandingDemoCelebration, { type LandingDemoMode } from "./LandingDemoCelebration";
import "./reading-demo.css";

interface LandingDemoDialogProps {
  mode: LandingDemoMode;
  title: string;
  description: string;
  loadingText: string;
  className?: string;
  onClose: () => void;
  children: (onComplete: () => void) => ReactNode;
}

export default function LandingDemoDialog({
  mode, title, description, loadingText, className = "reading-demo-modal", onClose, children,
}: LandingDemoDialogProps) {
  const [completed, setCompleted] = useState(false);
  const [opener] = useState(() => document.activeElement);
  const complete = useCallback(() => setCompleted(true), []);

  return (
    <Dialog open onOpenChange={open => { if (!open) onClose(); }}>
      <DialogContent
        className={completed ? "landing-demo-celebration-dialog" : className}
        dir={completed ? "rtl" : "ltr"}
        lang={completed ? "ar" : "en"}
        onPointerDownOutside={event => event.preventDefault()}
        onCloseAutoFocus={event => {
          if (opener instanceof HTMLElement && opener.isConnected) {
            event.preventDefault();
            opener.focus();
          }
        }}
      >
        <DialogTitle className="sr-only">{completed ? "اكتملت التجربة" : title}</DialogTitle>
        <DialogDescription className="sr-only">
          {completed ? "أكملت النشاط وحصلت على 100 نقطة تجريبية." : description}
        </DialogDescription>
        {completed ? (
          <LandingDemoCelebration mode={mode} />
        ) : (
          <Suspense fallback={<p role="status" className="p-10 text-center">{loadingText}</p>}>
            {children(complete)}
          </Suspense>
        )}
      </DialogContent>
    </Dialog>
  );
}
