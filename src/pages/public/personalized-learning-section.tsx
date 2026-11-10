import heroAvatar from "@/assets/landing-page/section5.png";
import avatarPreview from "@/assets/landing-page/3d-avatar-preview.mp4";
import certificatePreview from "@/assets/landing-page/certificate-preview.png";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import "./personalized-learning-section.css";
import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import readingIcon from '@/assets/svgs/reading-mode.png';
import listeningIcon from '@/assets/svgs/listening-mode.png';
import roleplayIcon from '@/assets/svgs/roleplay-mode.png';
import { Award, BookOpenCheck, BotMessageSquare, CircleCheck, Gauge, Languages, PenLine, Play, Trophy } from 'lucide-react';
import './reading-demo.css';
import LandingDemoViewport from './LandingDemoViewport';

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

  return (
    <figure className="personalized-learning__certificate" data-ready={artworkReady}>
      <img src={certificatePreview} alt="تصميم شهادة تقدير من زيد" width={1280} height={906} onLoad={() => setArtworkReady(true)} />
      <p className="personalized-learning__certificate-copy" lang="en" dir="ltr">For completing a Zayd reading activity</p>
      <span className="personalized-learning__certificate-stamp" role="img" aria-label="شارة نجم القراءة">
        <Award aria-hidden="true" />
      </span>
    </figure>
  );
}

const startingPoints = 200;
const earnedPoints = 50;
const finalPoints = startingPoints + earnedPoints;
const sampleLeaders = [
  { id: 'layan', name: 'ليان', points: 320 },
  { id: 'omar', name: 'عمر', points: 285 },
];
const sampleNeighbor = { id: 'neighbor', name: 'ريم', points: 235 };

function RewardsPreview() {
  const [points, setPoints] = useState(startingPoints);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setPoints(finalPoints);
      return;
    }

    const startedAt = performance.now();
    let frame: number;

    function updatePoints(now: number) {
      const progress = Math.min(1, Math.max(0, (now - startedAt - 650) / 1000));
      setPoints(startingPoints + Math.floor(earnedPoints * progress));
      if (progress < 1) frame = requestAnimationFrame(updatePoints);
    }

    frame = requestAnimationFrame(updatePoints);
    return () => cancelAnimationFrame(frame);
  }, []);

  const advanced = points === finalPoints;
  const learner = { id: 'learner', name: 'نورة', points };
  const leaderboard = advanced
    ? [...sampleLeaders, learner, sampleNeighbor]
    : [...sampleLeaders, sampleNeighbor, learner];

  return (
    <div className="personalized-learning__rewards-preview">
      <div className="personalized-learning__rewards-summary">
        <p><CircleCheck size={19} aria-hidden="true" /> اكتمل نشاط القراءة</p>
        <span className="personalized-learning__points-earned"><bdi dir="ltr">+{earnedPoints}</bdi> نقطة</span>
        <p>رصيد نورة <strong className="personalized-learning__points-total"><bdi dir="ltr">{points}</bdi></strong> نقطة</p>
      </div>
      <h3 id="personalized-sample-leaderboard">لوحة الشرف</h3>
      <ol className="personalized-learning__sample-leaderboard" aria-labelledby="personalized-sample-leaderboard" data-advanced={advanced}>
        {leaderboard.map((entry, index) => (
          <li key={entry.id} data-learner={entry.id}>
            <bdi dir="ltr" className="personalized-learning__sample-rank">{index + 1}</bdi>
            <span>{entry.name}</span>
            <span><bdi dir="ltr">{entry.points}</bdi> نقطة</span>
          </li>
        ))}
      </ol>
      <p className="sr-only" aria-live="polite">{advanced ? 'ارتفعت نورة من المركز الرابع إلى المركز الثالث.' : ''}</p>
    </div>
  );
}

const cefrLevels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const;
const sampleCefrLevel = 'B1';

function CefrPreview() {
  return (
    <div className="personalized-learning__cefr-preview">
      <div className="personalized-learning__cefr-response">
        <h3>مثال على إجابة الطالب</h3>
        <p lang="en" dir="ltr">
          On weekends, I <mark>play football with my friends</mark> because it <mark>helps me stay active</mark>.
        </p>
      </div>
      <div className="personalized-learning__cefr-scale">
        <h3 id="personalized-cefr-scale">مقياس <bdi dir="ltr" lang="en">CEFR</bdi></h3>
        <ol dir="ltr" aria-labelledby="personalized-cefr-scale">
          {cefrLevels.map(level => (
            <li key={level} aria-current={level === sampleCefrLevel ? 'true' : undefined}>{level}</li>
          ))}
        </ol>
      </div>
      <div className="personalized-learning__cefr-result">
        <h3>المستوى في هذا المثال: <bdi dir="ltr">{sampleCefrLevel}</bdi></h3>
        <p>يعبّر عن أفكاره بوضوح في مواقف يومية مألوفة.</p>
      </div>
    </div>
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
            <li className="personalized-learning__feature personalized-learning__feature--preview" key={id}>
              <span className="personalized-learning__feature-icon" aria-hidden="true"><Icon size={26} /></span>
              <h3>{title}</h3>
              <p>{description}</p>
              {id === 'cefr' && (
                <Dialog>
                  <DialogTrigger type="button" className="personalized-learning__preview-trigger">
                    <Gauge size={16} aria-hidden="true" />
                    شاهد مثال التقييم
                  </DialogTrigger>
                  <DialogContent className="personalized-learning__preview-dialog personalized-learning__cefr-dialog" lang="ar" dir="rtl">
                    <DialogTitle>تقييم مستوى اللغة وفق <bdi dir="ltr" lang="en">CEFR</bdi></DialogTitle>
                    <DialogDescription className="personalized-learning__preview-label">نموذج توضيحي</DialogDescription>
                    <CefrPreview />
                  </DialogContent>
                </Dialog>
              )}
              {id === 'avatar' && (
                <Dialog>
                  <DialogTrigger type="button" className="personalized-learning__preview-trigger">
                    <Play size={16} aria-hidden="true" />
                    شاهد زيد ثلاثي الأبعاد
                  </DialogTrigger>
                  <DialogContent className="personalized-learning__preview-dialog" lang="ar" dir="rtl">
                    <DialogTitle>معاينة زيد ثلاثي الأبعاد</DialogTitle>
                    <DialogDescription className="sr-only">معاينة صامتة لوضع القراءة مع شخصية زيد ثلاثية الأبعاد.</DialogDescription>
                    <LandingDemoViewport><video src={avatarPreview} autoPlay muted playsInline aria-label="معاينة صامتة لوضع القراءة ثلاثي الأبعاد" /></LandingDemoViewport>
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
                    <DialogDescription className="personalized-learning__preview-label">نموذج توضيحي</DialogDescription>
                    <CertificateReveal />
                  </DialogContent>
                </Dialog>
              )}
              {id === 'rewards' && (
                <Dialog>
                  <DialogTrigger type="button" className="personalized-learning__preview-trigger">
                    <Trophy size={16} aria-hidden="true" />
                    شاهد كيف تعمل النقاط
                  </DialogTrigger>
                  <DialogContent className="personalized-learning__preview-dialog personalized-learning__rewards-dialog" lang="ar" dir="rtl">
                    <DialogTitle>نقاط ومكافآت تحفيزية</DialogTitle>
                    <DialogDescription className="personalized-learning__preview-label">نموذج توضيحي</DialogDescription>
                    <RewardsPreview />
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
