import heroAvatar from "@/assets/landing-page/section5.png";
import featureIcons from "@/assets/landing-page/personalized-feature-icons.png";
import "./personalized-learning-section.css";

const pillars = [
  { title: "تعلّم مخصص", desc: "تجربة تتفاعل مع مستوى الطالب واحتياجه وتقدمه.", position: "100% 0%" },
  { title: "تغذية راجعة فورية", desc: "ملاحظات ذكية تساعد الطالب على معرفة ما يحتاج إلى تحسينه.", position: "50% 0%" },
  { title: "ممارسة التحدث", desc: "فرص متكررة للتحدث بدل انتظار الدور داخل الفصل.", position: "0% 0%" },
  { title: "دعم النطق", desc: "ممارسة مستمرة لتحسين وضوح الأداء الشفهي.", position: "100% 100%" },
  { title: "إعادة المحاولة", desc: "يتدرب الطالب مرة بعد مرة حتى يتحسن.", position: "50% 100%" },
  { title: "مساحة آمنة للتحدث", desc: "بيئة مريحة للطالب المتردد أو الأقل مشاركة.", position: "0% 100%" },
];

const contourTransforms = Array.from({ length: 22 }, (_, index) => {
  const scale = .7 + index * .038;
  return `translate(${325 * (1 - scale)} ${230 * (1 - scale)}) scale(${scale})`;
});

export default function PersonalizedLearningSection() {
  return (
    <section id="personalized-learning" className="personalized-learning" dir="rtl" lang="ar" aria-labelledby="personalized-heading">
      <svg className="personalized-learning__contours" aria-hidden="true" focusable="false" viewBox="-160 -100 1000 800" fill="none">
        <defs>
          <radialGradient id="personalized-contour-fade">
            <stop offset="45%" stopColor="white" />
            <stop offset="100%" stopColor="black" />
          </radialGradient>
          <mask id="personalized-contour-mask" x="-160" y="-100" width="1000" height="800" maskUnits="userSpaceOnUse">
            <rect x="-160" y="-100" width="1000" height="800" fill="url(#personalized-contour-fade)" />
          </mask>
        </defs>
        <g mask="url(#personalized-contour-mask)" stroke="currentColor" strokeWidth="1">
          {contourTransforms.map((transform) => (
            <path key={transform} transform={transform} d="M 340 74 C 230 -2 84 23 115 104 C 144 174 8 134 8 231 C 8 336 157 359 239 309 C 317 263 280 400 394 433 C 538 476 677 418 626 325 C 581 241 434 228 458 169 C 480 116 420 101 340 74 Z" />
          ))}
        </g>
      </svg>

      <div className="personalized-learning__container">
        <div className="personalized-learning__header">
          <h2 id="personalized-heading" className="personalized-learning__heading">
            <span>كل طالب يتعلم</span>
            <span className="personalized-learning__heading-accent">ويتحدث بطريقته</span>
          </h2>
          <p className="personalized-learning__description">
            لأن الطلاب لا يتعلمون بالطريقة نفسها، يمنح زيد كل طالب مساحة أكبر للتجربة والتكرار والتحسن.
          </p>
        </div>

        <div className="personalized-learning__content">
          <div className="personalized-learning__figure">
            <img src={heroAvatar} alt="معلم زيد الذكي يحمل جهازًا لوحيًا ويشير إلى مزايا التعلم المخصص" width={1024} height={1017} loading="lazy" decoding="async" />
          </div>
          <ul className="personalized-learning__cards" aria-label="مزايا التعلم المخصص مع زيد">
            {pillars.map((pillar) => (
              <li key={pillar.title} className="personalized-learning__card">
                <span aria-hidden="true" className="personalized-learning__icon" style={{ backgroundImage: `url(${featureIcons})`, backgroundPosition: pillar.position }} />
                <h3>{pillar.title}</h3>
                <p>{pillar.desc}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
