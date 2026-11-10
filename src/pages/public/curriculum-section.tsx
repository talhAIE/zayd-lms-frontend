import { useRef, useState, type KeyboardEvent } from "react";
import debateScreenshot from "@/assets/landing-page/curriculum/debate.png";
import formScreenshot from "@/assets/landing-page/curriculum/form-meaning-function.png";
import grammarScreenshot from "@/assets/landing-page/curriculum/grammar-flashcards.png";
import listeningScreenshot from "@/assets/landing-page/curriculum/listening.png";
import readingAloudScreenshot from "@/assets/landing-page/curriculum/reading-aloud.png";
import readingPassageScreenshot from "@/assets/landing-page/curriculum/reading-passage.png";
import roleplayScreenshot from "@/assets/landing-page/curriculum/roleplay.png";
import selfIntroductionScreenshot from "@/assets/landing-page/curriculum/self-introduction.png";
import writingScreenshot from "@/assets/landing-page/curriculum/writing.png";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import "./curriculum-section.css";

const readingAloudPreview = { src: readingAloudScreenshot, alt: "تمرين القراءة بصوت عالٍ مع خيار عرض التقييم" };

const curriculumSkills = [
  {
    id: "discussion", name: "الاستماع والمناقشة", size: "wide",
    preview: { src: debateScreenshot, alt: "بطاقات المواضيع في وضع المناقشة في زيد" },
  },
  {
    id: "grammar", name: "القواعد", size: "standard",
    preview: { src: grammarScreenshot, alt: "بطاقة تعليمية تعرض قاعدة نحوية ومثالًا عليها" },
  },
  {
    id: "listening", name: "الاستماع", size: "standard",
    preview: { src: listeningScreenshot, alt: "تمرين الاستماع مع مشغل الصوت ومخطط الموجة الصوتية" },
  },
  {
    id: "conversation", name: "المحادثة", size: "wide",
    preview: { src: roleplayScreenshot, alt: "محادثة تمثيل الأدوار مع تلميحات وخيارات للتغذية الراجعة" },
  },
  {
    id: "reading", name: "القراءة", size: "standard",
    preview: { src: readingPassageScreenshot, alt: "نص القراءة في زيد مع خيار الاستماع إليه" },
  },
  {
    id: "writing", name: "الكتابة", size: "standard",
    preview: { src: writingScreenshot, alt: "أسئلة موجّهة وحقول إجابة لبناء فقرة باللغة الإنجليزية" },
  },
  {
    id: "form", name: "الصيغة والمعنى والاستخدام", size: "long",
    preview: { src: formScreenshot, alt: "جدول قواعد يوضّح الكلمات ومعانيها وأمثلة على استخدامها" },
  },
  {
    id: "self-expression", name: "التحدث عن الذات", size: "medium",
    preview: { src: selfIntroductionScreenshot, alt: "تمرين للتعريف بالنفس يوضح سؤال زيد عن الاسم وتلميحًا ومثالًا للإجابة" },
  },
];

export default function CurriculumSection() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [showReadAloud, setShowReadAloud] = useState(false);
  const tabs = useRef<Array<HTMLButtonElement | null>>([]);

  function handleTabKey(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const lastIndex = curriculumSkills.length - 1;
    let nextIndex: number;

    switch (event.key) {
      case "ArrowLeft": nextIndex = index === lastIndex ? 0 : index + 1; break;
      case "ArrowRight": nextIndex = index === 0 ? lastIndex : index - 1; break;
      case "Home": nextIndex = 0; break;
      case "End": nextIndex = lastIndex; break;
      default: return;
    }

    event.preventDefault();
    setActiveIndex(nextIndex);
    tabs.current[nextIndex]?.focus();
  }

  return (
    <section id="curriculum" className="curriculum-overview" dir="rtl" lang="ar" aria-labelledby="curriculum-heading">
      <div className="curriculum-overview__container">
        <div className="curriculum-overview__copy">
          <p className="curriculum-overview__eyebrow">متوافق بالكامل مع المنهج</p>
          <h2 id="curriculum-heading" className="curriculum-overview__heading">
            <span>من الأول المتوسط</span>
            <span className="curriculum-overview__heading-accent">إلى الثالث الثانوي</span>
          </h2>
          <p className="curriculum-overview__description">
            لا يحتاج الطالب إلى منهج جديد. زيد يحوّل ما يدرسه بالفعل إلى تجربة ممارسة شخصية وتفاعلية تساعده على استخدام اللغة، لا مجرد معرفتها.
          </p>
          <p className="curriculum-overview__tagline">
            <span>يتعلمها في المنهج…</span>{" "}<span>ويمارسها مع زيد.</span>
          </p>
        </div>

        <div className="curriculum-overview__panel">
          <div className="curriculum-overview__skills" role="tablist" aria-label="مهارات المنهج التي يمارسها الطالب مع زيد">
            {curriculumSkills.map((skill, index) => (
              <button
                key={skill.id}
                ref={(button) => { tabs.current[index] = button; }}
                type="button"
                role="tab"
                id={`curriculum-tab-${skill.id}`}
                aria-controls={`curriculum-preview-${skill.id}`}
                aria-selected={index === activeIndex}
                tabIndex={index === activeIndex ? 0 : -1}
                className={`curriculum-overview__skill curriculum-overview__skill--${skill.size}`}
                onClick={() => setActiveIndex(index)}
                onKeyDown={(event) => handleTabKey(event, index)}
              >
                {skill.name}
              </button>
            ))}
          </div>
          {curriculumSkills.map((skill, index) => {
            const isActive = index === activeIndex;
            const isReading = skill.id === "reading";
            const preview = isReading && showReadAloud ? readingAloudPreview : skill.preview;

            return (
              <div
                key={skill.id}
                id={`curriculum-preview-${skill.id}`}
                role="tabpanel"
                aria-labelledby={`curriculum-tab-${skill.id}`}
                hidden={!isActive}
              >
                {isActive && (
                  <>
                    <div className="curriculum-overview__device">
                      <div className="curriculum-overview__screen">
                        <img key={preview.src} src={preview.src} alt={preview.alt} loading="lazy" decoding="async" />
                      </div>
                    </div>
                    <div className="curriculum-overview__preview-actions">
                      {isReading && (
                        <div className="curriculum-overview__reading-views" role="group" aria-label="صور وضع القراءة">
                          <button type="button" aria-pressed={!showReadAloud} onClick={() => setShowReadAloud(false)}>نص القراءة</button>
                          <button type="button" aria-pressed={showReadAloud} onClick={() => setShowReadAloud(true)}>القراءة بصوت عالٍ</button>
                        </div>
                      )}
                      <Dialog>
                        <DialogTrigger type="button" className="curriculum-overview__full-size">
                          عرض بالحجم الكامل
                        </DialogTrigger>
                        <DialogContent className="curriculum-overview__image-dialog" lang="ar" dir="rtl" aria-describedby={undefined}>
                          <DialogTitle>{skill.name}</DialogTitle>
                          <img src={preview.src} alt={preview.alt} />
                        </DialogContent>
                      </Dialog>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
