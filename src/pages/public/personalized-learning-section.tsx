import heroAvatar from "@/assets/landing-page/section5.png";
import avatarPreview from "@/assets/landing-page/3d-avatar-preview.mp4";
import certificatePreview from "@/assets/landing-page/certificate-preview.png";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import "./personalized-learning-section.css";
import { lazy, Suspense, useCallback, useState } from 'react';
import readingIcon from '@/assets/svgs/reading-mode.png';
import listeningIcon from '@/assets/svgs/listening-mode.png';
import roleplayIcon from '@/assets/svgs/roleplay-mode.png';
import { Award, BookOpenCheck, BotMessageSquare, Gauge, Languages, PenLine, Play, RotateCcw, Trophy } from 'lucide-react';
import './reading-demo.css';

const ReadingDemoModal = lazy(() => import('./ReadingDemoModal'));
const ListeningDemoModal = lazy(() => import('./ListeningDemoModal'));
const RoleplayDemoModal = lazy(() => import('./RoleplayDemoModal'));
const GrammarDemoModal = lazy(() => import('./GrammarDemoModal'));
const WritingDemoModal = lazy(() => import('./WritingDemoModal'));
const VocabularyDemoModal = lazy(() => import('./VocabularyDemoModal'));

const demos = [
  { mode: 'roleplay', title: 'وضع المحادثة', desc: 'تدرّب على حوار قصير من الحياة اليومية.', icon: roleplayIcon },
  { mode: 'listening', title: 'وضع الاستماع', desc: 'استمع لقصة قصيرة، واختبر فهمك.', icon: listeningIcon },
  { mode: 'reading', title: 'وضع القراءة', desc: 'استمع، واقرأ بصوتك، واختبر فهمك.', icon: readingIcon },
  { mode: 'grammar', title: 'وضع القواعد', desc: 'تعلّم قاعدة قصيرة، وتدرّب عليها، واختبر فهمك.', icon: null },
  { mode: 'writing', title: 'وضع الكتابة', desc: 'اكتب فقرة قصيرة، واحصل على ملاحظات لتحسينها.', icon: null },
  { mode: 'vocabulary', title: 'وضع المفردات', desc: 'تعلّم ثلاث كلمات، وطابق معانيها، واختبر فهمك.', icon: null },
] as const;

function CertificateReveal() {
  const [artworkReady, setArtworkReady] = useState(false);
  const [reveal, setReveal] = useState(0);

  return (
    <>
      <figure className="personalized-learning__certificate" data-ready={artworkReady} key={reveal}>
        <img src={certificatePreview} alt="تصميم شهادة تقدير من زيد" width={1280} height={906} onLoad={() => setArtworkReady(true)} />
        <div className="personalized-learning__certificate-copy" lang="en" dir="ltr">
          <strong>Noor Ali</strong>
          <p>For completing a Zayd reading activity</p>
        </div>
        <span className="personalized-learning__certificate-stamp" role="img" aria-label="شارة نجم القراءة">
          <Award aria-hidden="true" />
        </span>
      </figure>
      <button type="button" className="personalized-learning__certificate-replay" onClick={() => setReveal(value => value + 1)} disabled={!artworkReady}>
        <RotateCcw size={16} aria-hidden="true" />
        أعد العرض
      </button>
    </>
  );
}

const featureCards = [
  {
    id: 'cefr',
    icon: Gauge,
    title: <>تقييم وفق معيار <bdi dir="ltr" lang="en">CEFR</bdi> العالمي</>,
    description: <>قياس دقيق لمستوى الطالب وفق الإطار الأوروبي المشترك للغات <bdi dir="ltr">(A1–C2)</bdi>.</>,
  },
  {
    id: 'avatar',
    icon: BotMessageSquare,
    title: <>شخصيات تفاعلية ثلاثية الأبعاد <bdi dir="ltr" lang="en">(3D Avatar)</bdi></>,
    description: 'محادثة حية وتفاعلية مع شخصية زيد الذكية في أوضاع تعلم متنوعة.',
  },
  {
    id: 'certificates',
    icon: Award,
    title: 'شهادات وشارات إنجاز',
    description: 'شهادات إتمام وشارات تحفيزية توثّق تقدم الطالب وإنجازاته في كل مرحلة.',
  },
  {
    id: 'rewards',
    icon: Trophy,
    title: 'نقاط ومكافآت تحفيزية',
    description: 'نظام نقاط تنافسي ولوحات شرف تكافئ الطالب على الاستمرارية والتفوق.',
  },
] as const;

export default function PersonalizedLearningSection() {
  const [demoOpen, setDemoOpen] = useState<(typeof demos)[number]['mode'] | null>(null);
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
            <img src={heroAvatar} alt="معلم زيد الذكي يحمل جهازًا لوحيًا ويشير إلى تجارب زيد" width={1024} height={1017} loading="lazy" decoding="async" />
          </div>
          <div className="personalized-learning__demos">
            <h3 id="personalized-demo-heading" className="personalized-learning__demo-label">جرّب الآن — بدون تسجيل</h3>
            <ul className="personalized-learning__demo-list" aria-labelledby="personalized-demo-heading">
              {demos.map((demo) => (
                <li key={demo.mode}>
                  <button type="button" className="personalized-learning__demo-entry" onClick={() => setDemoOpen(demo.mode)} aria-haspopup="dialog">
                    <span className="personalized-learning__demo-icon" aria-hidden="true">
                      {demo.icon ? <img src={demo.icon} alt="" width={32} height={32} /> : demo.mode === 'vocabulary' ? <Languages size={28} /> : demo.mode === 'writing' ? <PenLine size={28} /> : <BookOpenCheck size={28} />}
                    </span>
                    <span className="personalized-learning__demo-title">{demo.title}</span>
                    <span className="personalized-learning__demo-description">{demo.desc}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <ul className="personalized-learning__features" aria-label="مزايا إضافية مع زيد">
          {featureCards.map(({ id, icon: Icon, title, description }) => (
            <li className={id === 'avatar' || id === 'certificates' ? "personalized-learning__feature personalized-learning__feature--preview" : "personalized-learning__feature"} key={id}>
              <span className="personalized-learning__feature-icon" aria-hidden="true"><Icon size={26} /></span>
              <h3>{title}</h3>
              <p>{description}</p>
              {id === 'avatar' && (
                <Dialog>
                  <DialogTrigger type="button" className="personalized-learning__preview-trigger">
                    <Play size={16} aria-hidden="true" />
                    شاهد زيد ثلاثي الأبعاد
                  </DialogTrigger>
                  <DialogContent className="personalized-learning__preview-dialog" lang="ar" dir="rtl">
                    <DialogTitle>معاينة زيد ثلاثي الأبعاد</DialogTitle>
                    <DialogDescription className="sr-only">معاينة صامتة لوضع القراءة مع شخصية زيد ثلاثية الأبعاد.</DialogDescription>
                    <video src={avatarPreview} autoPlay muted playsInline controls aria-label="معاينة صامتة لوضع القراءة ثلاثي الأبعاد" />
                  </DialogContent>
                </Dialog>
              )}
              {id === 'certificates' && (
                <Dialog>
                  <DialogTrigger type="button" className="personalized-learning__preview-trigger">
                    <Award size={16} aria-hidden="true" />
                    شاهد نموذج الشهادة
                  </DialogTrigger>
                  <DialogContent className="personalized-learning__preview-dialog personalized-learning__certificate-dialog" lang="ar" dir="rtl">
                    <DialogTitle>شهادة تقدير وشارة إنجاز</DialogTitle>
                    <DialogDescription className="personalized-learning__certificate-label">نموذج توضيحي</DialogDescription>
                    <CertificateReveal />
                  </DialogContent>
                </Dialog>
              )}
            </li>
          ))}
        </ul>
      </div>
      {demoOpen && <Suspense fallback={null}>{demoOpen === 'reading' ? <ReadingDemoModal onClose={closeDemo} /> : demoOpen === 'listening' ? <ListeningDemoModal onClose={closeDemo} /> : demoOpen === 'grammar' ? <GrammarDemoModal onClose={closeDemo} /> : demoOpen === 'writing' ? <WritingDemoModal onClose={closeDemo} /> : demoOpen === 'vocabulary' ? <VocabularyDemoModal onClose={closeDemo} /> : <RoleplayDemoModal onClose={closeDemo} />}</Suspense>}
    </section>
  );
}
