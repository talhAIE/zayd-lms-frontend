import heroAvatar from "@/assets/landing-page/section5.png";
import featureIcons from "@/assets/landing-page/personalized-feature-icons.png";
import "./personalized-learning-section.css";
import { lazy, Suspense, useCallback, useState } from 'react';
import readingIcon from '@/assets/svgs/reading-mode.png';
import listeningIcon from '@/assets/svgs/listening-mode.png';
import roleplayIcon from '@/assets/svgs/roleplay-mode.png';
import { BookOpenCheck, PenLine, Languages } from 'lucide-react';
import './reading-demo.css';

const ReadingDemoModal = lazy(() => import('./ReadingDemoModal'));
const ListeningDemoModal = lazy(() => import('./ListeningDemoModal'));
const RoleplayDemoModal = lazy(() => import('./RoleplayDemoModal'));
const GrammarDemoModal = lazy(() => import('./GrammarDemoModal'));
const WritingDemoModal = lazy(() => import('./WritingDemoModal'));
const VocabularyDemoModal = lazy(() => import('./VocabularyDemoModal'));

const demos = {
  '100% 0%': { mode: 'roleplay', title: 'وضع المحادثة', desc: 'تدرّب على حوار قصير من الحياة اليومية.', icon: roleplayIcon },
  '50% 0%': { mode: 'listening', title: 'وضع الاستماع', desc: 'استمع لقصة قصيرة، واختبر فهمك.', icon: listeningIcon },
  '0% 0%': { mode: 'reading', title: 'وضع القراءة', desc: 'استمع، واقرأ بصوتك، واختبر فهمك.', icon: readingIcon },
  '100% 100%': { mode: 'grammar', title: 'وضع القواعد', desc: 'تعلّم قاعدة قصيرة، وتدرّب عليها، واختبر فهمك.', icon: null },
  '50% 100%': { mode: 'writing', title: 'وضع الكتابة', desc: 'اكتب فقرة قصيرة، واحصل على ملاحظات لتحسينها.', icon: null },
  '0% 100%': { mode: 'vocabulary', title: 'وضع المفردات', desc: 'تعلّم ثلاث كلمات، وطابق معانيها، واختبر فهمك.', icon: null },
} as const;

const pillars = [
  { title: "تعلم مخصص", desc: "يتكيف مع مستوى الطالب واحتياجه.", position: "100% 0%" },
  { title: "تغذية راجعة فورية", desc: "ملاحظات ذكية لتحسين الأداء.", position: "50% 0%" },
  { title: "ممارسة التحدث", desc: "تطور مهارات النطق والتحدث.", position: "0% 0%" },
  { title: "تحسين النطق", desc: "تدريبات لتطوير النطق والطلاقة.", position: "100% 100%" },
  { title: "تكرار دون حدود", desc: "محاولات متكررة حتى الإتقان.", position: "50% 100%" },
  { title: "بيئة آمنة للتعلم", desc: "ممارسة الإنجليزية بثقة دون خوف من الخطأ.", position: "0% 100%" },
];

export default function PersonalizedLearningSection() {
  const [demoOpen, setDemoOpen] = useState<'reading' | 'listening' | 'roleplay' | 'grammar' | 'writing' | 'vocabulary' | null>(null);
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
            يمنح زيد كل طالب تجربة تفاعلية تتكيف مع مستواه، وتساعده على ممارسة الإنجليزية والتحسن باستمرار.
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

        <div className="personalized-learning__demos">
          <p className="personalized-learning__demo-label">جرّب الآن — بدون تسجيل</p>
          <ul className="personalized-learning__demo-list" aria-label="تجارب زيد">
            {Object.values(demos).map((demo) => (
              <li key={demo.mode}>
                <button type="button" className="personalized-learning__demo-entry" onClick={() => setDemoOpen(demo.mode)} aria-haspopup="dialog">
                  <span className="personalized-learning__demo-icon" aria-hidden="true">
                    {demo.icon ? <img src={demo.icon} alt="" width={32} height={32} /> : demo.mode === 'vocabulary' ? <Languages size={28} /> : demo.mode === 'writing' ? <PenLine size={28} /> : <BookOpenCheck size={28} />}
                  </span>
                  <span className="personalized-learning__demo-copy">
                    <span className="personalized-learning__demo-title">{demo.title}</span>
                    <span className="personalized-learning__demo-description">{demo.desc}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
      {demoOpen && <Suspense fallback={null}>{demoOpen === 'reading' ? <ReadingDemoModal onClose={closeDemo} /> : demoOpen === 'listening' ? <ListeningDemoModal onClose={closeDemo} /> : demoOpen === 'grammar' ? <GrammarDemoModal onClose={closeDemo} /> : demoOpen === 'writing' ? <WritingDemoModal onClose={closeDemo} /> : demoOpen === 'vocabulary' ? <VocabularyDemoModal onClose={closeDemo} /> : <RoleplayDemoModal onClose={closeDemo} />}</Suspense>}
    </section>
  );
}
