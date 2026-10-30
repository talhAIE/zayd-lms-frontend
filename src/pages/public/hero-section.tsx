import { Play } from "lucide-react";
import { Link } from "react-router-dom";
import heroAvatar from "@/assets/landing-page/section1.png";
import classroom from "@/assets/landing-page/hero-classroom.png";
import statChart from "@/assets/landing-page/stat-chart.png";
import statDocument from "@/assets/landing-page/stat-document.png";
import statClock from "@/assets/landing-page/stat-clock.png";
import "./hero-section.css";

const stats = [
  { value: "ساعة", description: "ممارسة منتظمة أسبوعيًا", image: statClock, direction: "rtl" },
  { value: "+40", description: "موضوعًا وموقفًا حياتيًا", image: statDocument, direction: "ltr" },
  { value: "×10", description: "ممارسة أكثر للتحدث", image: statChart, direction: "ltr" },
];

const contours = Array.from({ length: 18 }, (_, index) => {
  const scale = 0.72 + index * 0.035;
  return `translate(${325 * (1 - scale)} ${230 * (1 - scale)}) scale(${scale})`;
});

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
            <p className="landing-hero__audience">للطلاب من الأول المتوسط إلى الثالث الثانوي</p>
            <h1 id="hero-heading" className="landing-hero__heading">
              <span>من دراسة الإنجليزية إلى</span>
              <span className="landing-hero__heading-accent">استخدامها بثقة</span>
            </h1>
            <p className="landing-hero__description">
              <strong>زيد</strong> معلّم ذكي لممارسة اللغة الإنجليزية، يمنح كل طالب تجربة شخصية للتحدث والتفاعل والتغذية الراجعة، مع توافق كامل مع منهج اللغة الإنجليزية الذي يدرسه في المدرسة.
            </p>
            <div className="landing-hero__actions">
              <Link to="/login" className="landing-hero__button landing-hero__button--primary">ابدأ مع زيد الآن</Link>
              <a href="#schools" onClick={(event) => scrollToSection(event, "schools")} className="landing-hero__button landing-hero__button--secondary">زيد للمدارس</a>
            </div>
          </div>

          <div className="landing-hero__visual" dir="ltr">
            <svg aria-hidden="true" focusable="false" className="landing-hero__contours" viewBox="-130 -120 960 740" fill="none">
              <defs>
                <radialGradient id="hero-contour-fade">
                  <stop offset="50%" stopColor="white" />
                  <stop offset="100%" stopColor="black" />
                </radialGradient>
                <mask id="hero-contour-mask" x="-130" y="-120" width="960" height="740" maskUnits="userSpaceOnUse">
                  <rect x="-130" y="-120" width="960" height="740" fill="url(#hero-contour-fade)" />
                </mask>
              </defs>
              <g mask="url(#hero-contour-mask)" stroke="currentColor" strokeWidth="1">
                {contours.map((transform) => (
                  <path key={transform} d="M 340 74 C 230 -2 84 23 115 104 C 144 174 8 134 8 231 C 8 336 157 359 239 309 C 317 263 280 400 394 433 C 538 476 677 418 626 325 C 581 241 434 228 458 169 C 480 116 420 101 340 74 Z" transform={transform} />
                ))}
              </g>
            </svg>
            <div className="landing-hero__scene">
              <img src={classroom} alt="مساحة تعلم حديثة مع كتب وحاسوب لممارسة الإنجليزية" width={1672} height={941} {...{ fetchpriority: "high" }} className="landing-hero__classroom" />
            </div>
            <img src={heroAvatar} alt="المعلم الذكي زيد يرحب بك ويشير إلى تجربة التعلم" width={555} height={993} {...{ fetchpriority: "high" }} className="landing-hero__teacher" />
            <span aria-hidden="true" dir="rtl" className="landing-hero__note">جاهز<br />نبدأ!</span>
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
