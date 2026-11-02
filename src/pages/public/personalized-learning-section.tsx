import heroAvatar from "@/assets/landing-page/section5.png";
import featureIcons from "@/assets/landing-page/personalized-feature-icons.png";
import "./personalized-learning-section.css";
import { lazy, Suspense, useCallback, useState } from 'react';
import readingIcon from '@/assets/svgs/reading-mode.png';
import listeningIcon from '@/assets/svgs/listening-mode.png';
import './reading-demo.css';

const ReadingDemoModal = lazy(() => import('./ReadingDemoModal'));
const ListeningDemoModal = lazy(() => import('./ListeningDemoModal'));

const pillars = [
  { title: "تعلّم مخصص", desc: "تجربة تتفاعل مع مستوى الطالب واحتياجه وتقدمه.", position: "100% 0%" },
  { title: "تغذية راجعة فورية", desc: "ملاحظات ذكية تساعد الطالب على معرفة ما يحتاج إلى تحسينه.", position: "50% 0%" },
  { title: "ممارسة التحدث", desc: "فرص متكررة للتحدث بدل انتظار الدور داخل الفصل.", position: "0% 0%" },
  { title: "دعم النطق", desc: "ممارسة مستمرة لتحسين وضوح الأداء الشفهي.", position: "100% 100%" },
  { title: "إعادة المحاولة", desc: "يتدرب الطالب مرة بعد مرة حتى يتحسن.", position: "50% 100%" },
  { title: "مساحة آمنة للتحدث", desc: "بيئة مريحة للطالب المتردد أو الأقل مشاركة.", position: "0% 100%" },
];

export default function PersonalizedLearningSection() {
  const [demoOpen, setDemoOpen] = useState<'reading' | 'listening' | null>(null);
  const closeDemo = useCallback(() => setDemoOpen(null), []);
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
              pillar.position === '0% 0%' || pillar.position === '50% 0%' ? (
                <li key={pillar.title}>
                  <button type="button" className="personalized-learning__card personalized-learning__demo-trigger" onClick={() => setDemoOpen(pillar.position === '0% 0%' ? 'reading' : 'listening')} aria-haspopup="dialog">
                    <img src={pillar.position === '0% 0%' ? readingIcon : listeningIcon} alt="" width={52} height={52} className="h-[52px] w-[52px] object-contain" />
                    <h3>{pillar.position === '0% 0%' ? 'وضع القراءة' : 'وضع الاستماع'}</h3>
                    <p>{pillar.position === '0% 0%' ? 'استمع، واقرأ بصوتك، واختبر فهمك.' : 'استمع لقصة قصيرة، واختبر فهمك.'}</p>
                    <span className="personalized-learning__demo-label">جرّب الآن — بدون تسجيل</span>
                  </button>
                </li>
              ) : <li key={pillar.title} className="personalized-learning__card">
                <span aria-hidden="true" className="personalized-learning__icon" style={{ backgroundImage: `url(${featureIcons})`, backgroundPosition: pillar.position }} />
                <h3>{pillar.title}</h3>
                <p>{pillar.desc}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
      {demoOpen && <Suspense fallback={null}>{demoOpen === 'reading' ? <ReadingDemoModal onClose={closeDemo} /> : <ListeningDemoModal onClose={closeDemo} />}</Suspense>}
    </section>
  );
}
