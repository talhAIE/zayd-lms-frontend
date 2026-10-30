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

export default function PersonalizedLearningSection() {
  return (
    <section id="personalized-learning" className="personalized-learning" dir="rtl" lang="ar" aria-labelledby="personalized-heading">
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
