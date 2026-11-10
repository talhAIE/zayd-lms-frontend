import impactGraphic from "@/assets/landing-page/section7.png";
import studentsIcon from "@/assets/landing-page/metric-students.svg";
import clockIcon from "@/assets/landing-page/metric-clock.svg";
import booksIcon from "@/assets/landing-page/metric-books.svg";
import "./impact-stats-section.css";

const impactStats = [
  { value: "+1,000", label: "طالب مسجل", icon: studentsIcon },
  { value: "+2,200", label: "ساعة ممارسة", icon: clockIcon },
  { value: "+8,600", label: "درس منجز", icon: booksIcon },
];

export default function ImpactStatsSection() {
  return (
    <section id="impact" className="impact-stats" dir="rtl" lang="ar" aria-labelledby="impact-heading">
      <div className="impact-stats__container">
        <div className="impact-comparison">
          <div className="impact-comparison__copy" dir="rtl">
            <span className="impact-comparison__eyebrow">نتيجــة فارقــة</span>
            <h2 id="impact-heading" className="impact-comparison__heading">
              <span>عام واحد مع زيد يعادل نحو</span>
              <span className="impact-comparison__heading-accent">10 سنوات من ممارسة التحدث</span>
            </h2>
            <p className="impact-comparison__description">
              يتيح زيد فرصًا مكثفة للتحدث بالإنجليزية، تعادل تقريبًا ما قد يحصل عليه خلال 10 سنوات في الفصل التقليدي.
            </p>
            <p className="impact-comparison__footnote">
              المقارنة تتعلق بفرص ممارسة الإنجليزية، وليس بسنوات الدراسة.
            </p>
            <ul aria-label="إحصائيات زيد" className="impact-comparison__metrics">
              {impactStats.map((stat) => (
                <li key={stat.value} className="impact-comparison__metric">
                  <img src={stat.icon} alt="" aria-hidden="true" width={72} height={64} />
                  <bdi dir="ltr">{stat.value}</bdi>
                  <span>{stat.label}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="impact-comparison__illustration">
            <svg className="impact-comparison__spark" width="44" height="72" viewBox="0 0 44 72" fill="none" aria-hidden="true">
              <path d="M21 3 8 31l17 3L8 62l29-35-17-3L32 3H21Z" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" />
              <path d="m20 66 7-4m-5 9 7-1" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
            <svg className="impact-comparison__arrow" width="58" height="64" viewBox="0 0 58 64" fill="none" aria-hidden="true">
              <path d="M5 13c16 3 26 16 40 35M24 38l23 13-6-25" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <img src={impactGraphic} alt="عام واحد مع زيد مقابل 10 سنوات من ممارسة التحدث في الفصل التقليدي" width={894} height={646} />
          </div>
        </div>

      </div>
    </section>
  );
}
