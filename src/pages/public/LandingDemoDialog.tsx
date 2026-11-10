import { Suspense, useCallback, useState, type ReactNode } from "react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import LandingDemoCelebration, { type LandingDemoMode } from "./LandingDemoCelebration";
import LandingOnboarding from "./LandingOnboarding";
import LandingDemoViewport from "./LandingDemoViewport";
import type { OnboardingLanguage } from "./landing-onboarding-copy";
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
  const [onboarding, setOnboarding] = useState(false);
  const [language, setLanguage] = useState<OnboardingLanguage>("ar");
  const [opener] = useState(() => document.activeElement);
  const complete = useCallback(() => setCompleted(true), []);
  const arabic = completed && (!onboarding || language === "ar");

  return (
    <Dialog open onOpenChange={open => { if (!open) onClose(); }}>
      <DialogContent
        className={onboarding ? "landing-demo-celebration-dialog landing-demo-onboarding-dialog" : completed ? "landing-demo-celebration-dialog" : className}
        dir={arabic ? "rtl" : "ltr"}
        lang={arabic ? "ar" : "en"}
        onPointerDownOutside={event => event.preventDefault()}
        onCloseAutoFocus={event => {
          if (opener instanceof HTMLElement && opener.isConnected) {
            event.preventDefault();
            opener.focus();
          }
        }}
      >
        <DialogTitle className="sr-only">
          {onboarding ? (arabic ? "إعداد خطتك التدريبية" : "Set up your learning plan") : completed ? "اكتملت التجربة" : title}
        </DialogTitle>
        <DialogDescription className="sr-only">
          {onboarding
            ? (arabic ? "أجب عن الأسئلة لإعداد خطة تناسب أهدافك." : "Answer a few questions about your learning goals.")
            : completed ? "أكملت النشاط وحصلت على 100 نقطة تجريبية." : description}
        </DialogDescription>
        <LandingDemoViewport compact={!completed} key={onboarding ? "onboarding" : completed ? "celebration" : "player"}>
          {onboarding ? (
            <LandingOnboarding mode={mode} language={language} onLanguageChange={setLanguage} />
          ) : completed ? (
            <LandingDemoCelebration mode={mode} onStartOnboarding={() => setOnboarding(true)} />
          ) : (
            <Suspense fallback={<p role="status" className="p-10 text-center">{loadingText}</p>}>
              {children(complete)}
            </Suspense>
          )}
        </LandingDemoViewport>
      </DialogContent>
    </Dialog>
  );
}
