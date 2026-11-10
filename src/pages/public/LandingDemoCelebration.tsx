import { useEffect, useRef, useState, type CSSProperties } from "react";
import { BookOpen, Check, MessageCircle, PenLine, Star } from "lucide-react";
import { DialogClose } from "@/components/ui/dialog";
import "./landing-demo-celebration.css";

const celebrations = {
  roleplay: { badge: "نجم المحادثة", title: "أحسنت! أكملت المحادثة." },
  listening: { badge: "نجم الاستماع", title: "رائع! أكملت تحدّي الاستماع." },
  reading: { badge: "نجم القراءة", title: "أحسنت يا نجم القراءة!" },
  grammar: { badge: "نجم القواعد", title: "أحسنت! أكملت تدريب القواعد." },
  writing: { badge: "نجم الكتابة", title: "رائع! أكملت تجربة الكتابة." },
  vocabulary: { badge: "نجم المفردات", title: "أحسنت! أكملت تحدّي المفردات." },
};

export type LandingDemoMode = keyof typeof celebrations;

const completionPoints = 100;
const confetti = Array.from({ length: 16 }, (_, index) => {
  const angle = index * Math.PI / 8;
  return {
    "--burst-x": `${Math.round(Math.cos(angle) * (102 + index % 3 * 18))}px`,
    "--burst-y": `${Math.round(Math.sin(angle) * (55 + index % 3 * 10))}px`,
    "--burst-spin": `${index % 2 ? 140 : -160}deg`,
  } as CSSProperties;
});

function CelebrationArt({ mode }: { mode: LandingDemoMode }) {
  switch (mode) {
    case "roleplay":
      return <div className="demo-celebration__bubbles"><MessageCircle /><MessageCircle /></div>;
    case "listening":
      return (
        <div className="demo-celebration__wave">
          {[16, 30, 48, 62, 48, 30, 16].map((height, index) => (
            <span key={index} style={{ height, animationDelay: `${index * 55}ms` }} />
          ))}
        </div>
      );
    case "reading":
      return <div className="demo-celebration__book"><BookOpen /><span /></div>;
    case "grammar":
      return (
        <div className="demo-celebration__tiles" dir="ltr">
          <span>I</span><span>am</span><span>ready.</span>
        </div>
      );
    case "writing":
      return (
        <div className="demo-celebration__pen">
          <PenLine />
          <svg viewBox="0 0 100 38" fill="none">
            <path pathLength={1} d="M4 28c16-15 19 10 37-2s15-2 25-3c7-1 12-8 16-14" />
          </svg>
        </div>
      );
    case "vocabulary":
      return (
        <div className="demo-celebration__deck" dir="ltr">
          <span>Library</span><span>Borrow</span><span>Quiet</span>
        </div>
      );
  }
}

export default function LandingDemoCelebration({ mode }: { mode: LandingDemoMode }) {
  const [points, setPoints] = useState(0);
  const returnButton = useRef<HTMLButtonElement>(null);
  const { badge, title } = celebrations[mode];

  useEffect(() => {
    returnButton.current?.focus();
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setPoints(completionPoints);
      return;
    }

    const startedAt = performance.now();
    let frame: number;

    function countPoints(now: number) {
      const progress = Math.min(1, Math.max(0, (now - startedAt - 540) / 860));
      setPoints(Math.floor(completionPoints * progress));
      if (progress < 1) frame = requestAnimationFrame(countPoints);
    }

    frame = requestAnimationFrame(countPoints);
    return () => cancelAnimationFrame(frame);
  }, []);

  const Seal = mode === "reading" ? Star : Check;

  return (
    <div className="demo-celebration" data-mode={mode}>
      <div className="demo-celebration__art" aria-hidden="true">
        <div className="demo-celebration__confetti">
          {confetti.map((style, index) => <i key={index} style={style} />)}
        </div>
        <CelebrationArt mode={mode} />
        <span className="demo-celebration__seal"><Seal size={21} /></span>
      </div>
      <span className="demo-celebration__badge">{badge}</span>
      <h2>{title}</h2>
      <p className="demo-celebration__points">
        <bdi dir="ltr" aria-hidden="true">+{points}</bdi>
        <span className="sr-only">{completionPoints} </span>
        نقطة تجريبية
      </p>
      <DialogClose type="button" ref={returnButton} className="demo-celebration__return">
        العودة إلى التجارب
      </DialogClose>
    </div>
  );
}
