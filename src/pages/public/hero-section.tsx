import { ArrowLeft, GraduationCap, Play } from "lucide-react";
import { Link } from "react-router-dom";
import heroAvatar from "@/assets/landing-page/section1.png";
import classroom from "@/assets/landing-page/hero-classroom-premium.png";
import statChart from "@/assets/landing-page/stat-chart.png";
import statDocument from "@/assets/landing-page/stat-document.png";
import statClock from "@/assets/landing-page/stat-clock.png";
import "./hero-section.css";

const stats = [
  { value: "ساعة", description: "ممارسة منتظمة أسبوعيًا", image: statClock, direction: "rtl" },
  { value: "+40", description: "موضوعًا وموقفًا حياتيًا", image: statDocument, direction: "ltr" },
  { value: "×10", description: "ممارسة أكثر للتحدث", image: statChart, direction: "ltr" },
];

function scrollToSection(event: React.MouseEvent<HTMLAnchorElement>, id: string) {
  // Preserve normal anchor behavior for modified clicks and new tabs.
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  const target = document.getElementById(id);
  if (!target) return;
  event.preventDefault();
  const headerHeight = document.querySelector("header")?.getBoundingClientRect().height ?? 86;
  window.scrollTo({
    top: target.getBoundingClientRect().top + window.scrollY - headerHeight - 16,
    behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
  });
  // Move keyboard and assistive-technology navigation to the destination too.
  target.setAttribute("tabindex", "-1");
  target.focus({ preventScroll: true });
}

export default function HeroSection() {
  return (
    <section aria-labelledby="hero-heading" className="landing-hero" dir="rtl" lang="ar">
      <div className="landing-hero__container">
        <div className="landing-hero__main">
          <div className="landing-hero__copy">
            <p className="landing-hero__audience">
              <GraduationCap aria-hidden="true" />
              <span>للطلاب من الأول المتوسط إلى الثالث الثانوي</span>
            </p>
            <h1 id="hero-heading" className="landing-hero__heading">
              <span>من دراسة الإنجليزية إلى</span>
              <span className="landing-hero__heading-accent">استخدامها بثقة</span>
            </h1>
            <p className="landing-hero__description">
              <strong>زيد</strong> معلّم ذكي لممارسة اللغة الإنجليزية، يمنح كل طالب تجربة شخصية للتحدث والتفاعل والتغذية الراجعة، مع توافق كامل{" "}
              <span className="landing-hero__curriculum">مع المنهج السعودي.</span>
            </p>
            <div className="landing-hero__actions">
              <Link to="/login" className="landing-hero__button landing-hero__button--primary">
                <span>ابدأ مع زيد الآن</span>
                <ArrowLeft aria-hidden="true" />
              </Link>
              <a href="#schools" onClick={(event) => scrollToSection(event, "schools")} className="landing-hero__button landing-hero__button--secondary">زيد للمدارس</a>
            </div>
          </div>

          <div className="landing-hero__visual" dir="ltr">
            <div className="landing-hero__scene">
              <img src={classroom} alt="مساحة تعلم حديثة مع كتب وحاسوب لممارسة الإنجليزية" width={1672} height={941} {...{ fetchpriority: "high" }} className="landing-hero__classroom" />
            </div>
            <img src={heroAvatar} alt="المعلم الذكي زيد يرحب بك ويشير إلى تجربة التعلم" width={555} height={993} {...{ fetchpriority: "high" }} className="landing-hero__teacher" />
            <a href="#zayd-demo" onClick={(event) => scrollToSection(event, "zayd-demo")} aria-label="انتقل إلى العرض التعريفي لزيد" className="landing-hero__play">
              <Play aria-hidden="true" focusable="false" />
            </a>
          </div>
        </div>

        <ul aria-label="مزايا ممارسة الإنجليزية مع زيد" className="landing-hero__stats">
          {stats.map((stat) => (
            <li key={stat.value} className="landing-hero__stat">
              <img src={stat.image} alt="" width={84} height={84} />
              <div>
                <p dir={stat.direction} className="landing-hero__stat-value">{stat.value}</p>
                <p className="landing-hero__stat-description">{stat.description}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
