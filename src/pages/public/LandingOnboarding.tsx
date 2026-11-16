import { useEffect, useRef, useState, type FormEvent } from "react";
import { CircleCheck } from "lucide-react";
import { DialogClose } from "@/components/ui/dialog";
import type { LandingDemoMode } from "./LandingDemoCelebration";
import { onboardingCopy as copy, onboardingOptions, type OnboardingLanguage } from "./landing-onboarding-copy";
import "./landing-onboarding.css";

const baseSteps = ["name", "goal", "skill", "topics", "dailyTime", "attribution", "contact"] as const;
type Step = typeof baseSteps[number] | "stepHistory";
type Choice = keyof typeof onboardingOptions;
type FormError = "missingContact" | "invalidPhone" | "saveFailed";

const initialAnswers = {
  name: "", goal: "", stepHistory: "", level: "", skill: "",
  topics: [] as string[], dailyTime: "", attribution: "", whatsapp: "", email: "",
};

const apiOrigin = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/+$/, "");

function normalizeWhatsApp(value: string) {
  return value
    .replace(/[٠-٩۰-۹]/g, digit => String(digit.charCodeAt(0) - (digit <= "٩" ? 0x660 : 0x6f0)))
    .replace(/[\s().-]/g, "");
}

interface LandingOnboardingProps {
  mode?: LandingDemoMode;
  language: OnboardingLanguage;
  onLanguageChange: (language: OnboardingLanguage) => void;
  onClose?: () => void;
}

export default function LandingOnboarding({ mode, language, onLanguageChange, onClose }: LandingOnboardingProps) {
  const [answers, setAnswers] = useState(initialAnswers);
  const [step, setStep] = useState<Step>("name");
  const [error, setError] = useState<FormError | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const pending = useRef<AbortController | null>(null);
  const submission = useRef<{ data: string; id: string } | null>(null);
  const steps: readonly Step[] = answers.goal === "step"
    ? ["name", "goal", "stepHistory", ...baseSteps.slice(2)]
    : baseSteps;
  const index = steps.indexOf(step);
  const optional = step === "name" || step === "topics" || step === "contact";
  const canContinue = optional || Boolean(answers[step]);

  useEffect(() => { heading.current?.focus(); }, [step, saved]);
  useEffect(() => () => {
    pending.current?.abort();
    pending.current = null;
  }, []);

  function changeText(field: "name" | "whatsapp" | "email", value: string) {
    setAnswers(previous => ({ ...previous, [field]: value }));
    setError(null);
  }

  function changeChoice(field: Choice, value: string) {
    setAnswers(previous => {
      if (field === "topics") {
        const topics = previous.topics.includes(value)
          ? previous.topics.filter(topic => topic !== value)
          : [...previous.topics, value];
        return { ...previous, topics };
      }
      if (field === "goal" && value !== previous.goal) {
        return { ...previous, goal: value, stepHistory: "" };
      }
      return { ...previous, [field]: value };
    });
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canContinue || pending.current) return;
    if (step !== "contact") {
      setStep(steps[index + 1]);
      return;
    }

    const email = answers.email.trim();
    const whatsapp = normalizeWhatsApp(answers.whatsapp);
    if (!email && !whatsapp) {
      setError("missingContact");
      return;
    }
    if (answers.whatsapp.trim() && !/^\+[1-9]\d{7,14}$/.test(whatsapp)) {
      setError("invalidPhone");
      return;
    }

    const data = {
      sourceMode: mode,
      locale: language,
      name: answers.name.trim() || undefined,
      goal: answers.goal,
      stepHistory: answers.goal === "step" ? answers.stepHistory : undefined,
      level: answers.level || undefined,
      skill: answers.skill,
      topics: answers.topics,
      dailyTime: answers.dailyTime,
      attribution: answers.attribution,
      email: email || undefined,
      whatsapp: whatsapp || undefined,
    };
    const serialized = JSON.stringify(data);
    if (submission.current?.data !== serialized) {
      submission.current = { data: serialized, id: crypto.randomUUID() };
    }

    const controller = new AbortController();
    pending.current = controller;
    const timeout = window.setTimeout(() => controller.abort(), 15_000);
    setError(null);
    setSaving(true);
    try {
      const response = await fetch(`${apiOrigin}/api/v1/public-demo/onboarding`, {
        method: "POST",
        credentials: "omit",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, requestId: submission.current.id }),
        signal: controller.signal,
      });
      const result = await response.json();
      if (!response.ok || result?.saved !== true) throw new Error("Onboarding submission failed");
      if (pending.current === controller) setSaved(true);
    } catch {
      if (pending.current === controller) setError("saveFailed");
    } finally {
      window.clearTimeout(timeout);
      if (pending.current === controller) {
        pending.current = null;
        setSaving(false);
      }
    }
  }

  function renderChoices(field: Choice) {
    return (
      <fieldset className="landing-onboarding__choices">
        <legend className={field === "level" ? "landing-onboarding__level" : "sr-only"}>{copy[field][language]}</legend>
        <div className="landing-onboarding__options">
          {onboardingOptions[field].map(option => (
            <label key={option.value}>
              <input
                name={field}
                type={field === "topics" ? "checkbox" : "radio"}
                value={option.value}
                checked={field === "topics" ? answers.topics.includes(option.value) : answers[field] === option.value}
                onChange={() => changeChoice(field, option.value)}
              />
              <bdi>{option[language]}</bdi>
            </label>
          ))}
        </div>
      </fieldset>
    );
  }

  return (
    <div className="landing-onboarding">
      <div className="landing-onboarding__top">
        <div className="landing-onboarding__language" role="group" aria-label={language === "ar" ? "لغة النموذج" : "Form language"}>
          <button type="button" lang="ar" aria-pressed={language === "ar"} disabled={saving} onClick={() => onLanguageChange("ar")}>العربية</button>
          <button type="button" lang="en" aria-pressed={language === "en"} disabled={saving} onClick={() => onLanguageChange("en")}>English</button>
        </div>
        {!saved && <progress value={index + 1} max={steps.length} aria-label={language === "ar" ? "تقدم النموذج" : "Form progress"} />}
      </div>
      {saved ? (
        <div className="landing-onboarding__success">
          <CircleCheck size={44} aria-hidden="true" />
          <h2 ref={heading} tabIndex={-1}>{copy.saved[language]}</h2>
          <p className="landing-onboarding__follow-up" lang="en" dir="ltr">we will contact you soon</p>
          {onClose ? <button className="landing-onboarding__primary" type="button" onClick={onClose}>{copy.close[language]}</button> : <DialogClose className="landing-onboarding__primary" type="button">{copy.close[language]}</DialogClose>}
        </div>
      ) : (
        <form onSubmit={submit} aria-busy={saving}>
          <h2 id="landing-onboarding-step" ref={heading} tabIndex={-1}>{copy[step][language]}</h2>
          {step === "name" ? (
            <input type="text" autoComplete="name" maxLength={120} dir="auto" aria-labelledby="landing-onboarding-step" value={answers.name} onChange={event => changeText("name", event.target.value)} />
          ) : step === "contact" ? (
            <div className="landing-onboarding__contact">
              <p>{copy.contactIntro[language]}</p>
              <p id="landing-onboarding-contact-use">{copy.contactUse[language]}</p>
              <label>
                {copy.whatsapp[language]}
                <input type="tel" autoComplete="tel" dir="ltr" maxLength={32} placeholder="+9665XXXXXXXX" aria-describedby="landing-onboarding-contact-use" value={answers.whatsapp} disabled={saving} onChange={event => changeText("whatsapp", event.target.value)} />
              </label>
              <label>
                {copy.email[language]}
                <input type="email" autoComplete="email" dir="ltr" maxLength={254} aria-describedby="landing-onboarding-contact-use" value={answers.email} disabled={saving} onChange={event => changeText("email", event.target.value)} />
              </label>
            </div>
          ) : (
            <>
              {step === "skill" && renderChoices("level")}
              {renderChoices(step)}
            </>
          )}
          {error && <p className="landing-onboarding__error" role="alert">{copy[error][language]}</p>}
          <div className="landing-onboarding__actions">
            {index > 0 && (
              <button type="button" className="landing-onboarding__secondary" disabled={saving} onClick={() => {
                setError(null);
                setStep(steps[index - 1]);
              }}>{copy.back[language]}</button>
            )}
            <button type="submit" className="landing-onboarding__primary" disabled={!canContinue || saving}>
              {copy[saving ? "saving" : step === "contact" ? "submit" : "next"][language]}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
