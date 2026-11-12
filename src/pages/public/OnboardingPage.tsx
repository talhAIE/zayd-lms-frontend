import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import logo from "@/assets/landing-page/logo.png";
import LandingOnboarding from "./LandingOnboarding";
import type { OnboardingLanguage } from "./landing-onboarding-copy";
import "./landing-onboarding.css";

export default function OnboardingPage() {
  const [language, setLanguage] = useState<OnboardingLanguage>("ar");
  const navigate = useNavigate();

  return (
    <main className="landing-onboarding-page" dir={language === "ar" ? "rtl" : "ltr"} lang={language}>
      <Link to="/" className="landing-onboarding-page__brand" aria-label={language === "ar" ? "زيد — الرئيسية" : "Zayd — Home"}>
        <img src={logo} alt="Zayd" width={58} height={72} />
      </Link>
      <div className="landing-onboarding-page__card">
        <LandingOnboarding language={language} onLanguageChange={setLanguage} onClose={() => navigate("/")} />
      </div>
    </main>
  );
}
