import heroAvatar from "@/assets/landing-page/section5.png";
import featureIcons from "@/assets/landing-page/personalized-feature-icons.png";
import "./personalized-learning-section.css";
import { lazy, Suspense, useCallback, useState } from 'react';
import readingIcon from '@/assets/svgs/reading-mode.png';
import listeningIcon from '@/assets/svgs/listening-mode.png';
import roleplayIcon from '@/assets/svgs/roleplay-mode.png';
import { BookOpenCheck } from 'lucide-react';
import './reading-demo.css';

const ReadingDemoModal = lazy(() => import('./ReadingDemoModal'));
const ListeningDemoModal = lazy(() => import('./ListeningDemoModal'));
const RoleplayDemoModal = lazy(() => import('./RoleplayDemoModal'));
const GrammarDemoModal = lazy(() => import('./GrammarDemoModal'));

const demos = {
  '100% 0%': { mode: 'roleplay', title: 'وضع المحادثة', desc: 'تدرّب على حوار قصير من الحياة اليومية.', icon: roleplayIcon },
  '50% 0%': { mode: 'listening', title: 'وضع الاستماع', desc: 'استمع لقصة قصيرة، واختبر فهمك.', icon: listeningIcon },
  '0% 0%': { mode: 'reading', title: 'وضع القراءة', desc: 'استمع، واقرأ بصوتك، واختبر فهمك.', icon: readingIcon },
  '100% 100%': { mode: 'grammar', title: 'وضع القواعد', desc: 'تعلّم قاعدة قصيرة، وتدرّب عليها، واختبر فهمك.', icon: null },
} as const;

const pillars = [
  { title: "تعلّم مخصص", desc: "تجربة تتفاعل مع مستوى الطالب واحتياجه وتقدمه.", position: "100% 0%" },
  { title: "تغذية راجعة فورية", desc: "ملاحظات ذكية تساعد الطالب على معرفة ما يحتاج إلى تحسينه.", position: "50% 0%" },
  { title: "ممارسة التحدث", desc: "فرص متكررة للتحدث بدل انتظار الدور داخل الفصل.", position: "0% 0%" },
  { title: "دعم النطق", desc: "ممارسة مستمرة لتحسين وضوح الأداء الشفهي.", position: "100% 100%" },
  { title: "إعادة المحاولة", desc: "يتدرب الطالب مرة بعد مرة حتى يتحسن.", position: "50% 100%" },
  { title: "مساحة آمنة للتحدث", desc: "بيئة مريحة للطالب المتردد أو الأقل مشاركة.", position: "0% 100%" },
];

export default function PersonalizedLearningSection() {
  const [demoOpen, setDemoOpen] = useState<'reading' | 'listening' | 'roleplay' | 'grammar' | null>(null);
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
            {pillars.map((pillar) => {
              const demo = demos[pillar.position as keyof typeof demos];
              return demo ? (
                <li key={pillar.title}>
                  <button type="button" className="personalized-learning__card personalized-learning__demo-trigger" onClick={() => setDemoOpen(demo.mode)} aria-haspopup="dialog">
                    {demo.icon ? <img src={demo.icon} alt="" width={52} height={52} className="h-[52px] w-[52px] object-contain" /> : <span className="flex h-[52px] w-[52px] items-center justify-center rounded-xl bg-blue-50 text-blue-500"><BookOpenCheck aria-hidden="true" size={32} /></span>}
                    <h3>{demo.title}</h3>
                    <p>{demo.desc}</p>
                    <span className="personalized-learning__demo-label">جرّب الآن — بدون تسجيل</span>
                  </button>
                </li>
              ) : <li key={pillar.title} className="personalized-learning__card">
                <span aria-hidden="true" className="personalized-learning__icon" style={{ backgroundImage: `url(${featureIcons})`, backgroundPosition: pillar.position }} />
                <h3>{pillar.title}</h3>
                <p>{pillar.desc}</p>
              </li>
            })}
          </ul>
        </div>
      </div>
      {demoOpen && <Suspense fallback={null}>{demoOpen === 'reading' ? <ReadingDemoModal onClose={closeDemo} /> : demoOpen === 'listening' ? <ListeningDemoModal onClose={closeDemo} /> : demoOpen === 'grammar' ? <GrammarDemoModal onClose={closeDemo} /> : <RoleplayDemoModal onClose={closeDemo} />}</Suspense>}
    </section>
  );
}
