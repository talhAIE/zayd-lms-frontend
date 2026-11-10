import { useState, type ReactNode } from "react";
import { CircleChevronDown } from "lucide-react";
import { landingPricingPlans } from "./landing-content";
import "./faq-section.css";

interface FAQItem {
  id: string;
  question: string;
  answer: ReactNode;
}

function BilingualText({ text }: { text: string }) {
  return text.split(/(Zayd Plus|Zayd Life|Zayd)/g).map((part, index) =>
    /^Zayd(?: Plus| Life)?$/.test(part) ? <bdi key={index} dir="ltr" lang="en">{part}</bdi> : part
  );
}

const packageFaqPlans = [landingPricingPlans[0], landingPricingPlans[2], landingPricingPlans[1]];
const packageFaqDescriptions = {
  curriculum: "إذا كان هدفك تحسين أدائك في مناهج المدرسة وممارسة مهارات اللغة الأربع.",
  life: "إذا كان هدفك استخدام الإنجليزية في الحياة اليومية عبر أكثر من 40 موضوعًا وموقفًا حياتيًا.",
  plus: "التجربة الكاملة التي تجمع مزايا باقة المنهج وجميع مزايا Zayd Life.",
} as const;

const faqs: FAQItem[] = [
  {
    id: "name-origin",
    question: 'لماذا اخترنا اسم "زيد Zayd"؟',
    answer:
      'يرتبط اسم "زيد" في اللغة العربية بمعنى الزيادة والنماء والتقدّم المستمر؛ وهو ما يمثّله زيد تمامًا، إذ يزيد من فرص الطالب في ممارسة اللغة الإنجليزية، وينمّي مهاراته في التحدث والقراءة والاستماع والكتابة، ويزيد من ثقته في استخدام اللغة في المدرسة والحياة اليومية.',
  },
  {
    id: "what-is-zayd",
    question: "ما هو زيد؟",
    answer:
      "زيد معلّم ذكي لممارسة اللغة الإنجليزية يمنح كل طالب تجربة مخصصة للتحدث والقراءة والاستماع والكتابة، مع تغذية راجعة فورية ومحتوى متناغم مع ما يتعلمه طلاب المرحلتين المتوسطة والثانوية في المدرسة.",
  },
  {
    id: "teacher-role",
    question: "هل زيد بديل عن معلم اللغة الإنجليزية؟",
    answer:
      "لا، زيد لا يستبدل المعلم بل يعزز دوره ويوسّع أثره؛ فهو يمنح كل طالب فرصًا إضافية لممارسة اللغة الإنجليزية بشكل فردي ووفق مستواه وسرعته حول ما يتعلمه بالفعل في المدرسة، مع تغذية راجعة فورية تدعم تقدمه.",
  },
  {
    id: "supported-grades",
    question: "ما الصفوف التي يخدمها زيد حاليًا؟",
    answer:
      "يخدم زيد حاليًا طلاب المرحلتين المتوسطة والثانوية (من الصف الأول المتوسط إلى الصف الثالث الثانوي)، بمحتوى متناغم مع منهج اللغة الإنجليزية المعتمد في المدرسة، بالإضافة إلى مواضيع ومواقف الحياة اليومية.",
  },
  {
    id: "weekly-usage",
    question: "كم يحتاج الطالب إلى استخدام زيد؟",
    answer:
      "يحتاج الطالب إلى نحو ساعة واحدة أسبوعيًا من الممارسة المنتظمة مع زيد؛ ومع الاستمرار خلال عام دراسي واحد، يحصل الطالب على فرص مكثفة لممارسة التحدث بالإنجليزية تعادل تقريبًا ما قد يحصل عليه خلال 10 سنوات في الفصل التقليدي.",
  },
  {
    id: "ai-assessment",
    question: "كيف يستخدم الذكاء الاصطناعي في تقييم الطالب؟",
    answer:
      "يستخدم زيد الذكاء الاصطناعي للتفاعل مع الطالب في مهارات التحدث والقراءة والاستماع والكتابة، وتقديم ملاحظات ذكية وتغذية راجعة فورية لتحسين النطق والطلاقة والأداء، مع تكييف التمارين تلقائيًا وفق مستوى الطالب واحتياجه ومنحه محاولات متكررة حتى الإتقان.",
  },
  {
    id: "packages",
    question: "ما الفرق بين الباقات الثلاث؟",
    answer:
      <ul className="faq__packages">
        {packageFaqPlans.map((plan) => (
          <li key={plan.id} data-plan={plan.id}>
            <strong>
              {plan.id === "curriculum" ? plan.name : <>باقة <bdi dir="ltr" lang="en">{plan.name}</bdi></>}{" "}
              (<span className="faq__package-price"><bdi dir="ltr">{plan.price}</bdi> ﷼/سنة</span>{plan.featured && " - الأفضل قيمة"}):
            </strong>{" "}
            <BilingualText text={packageFaqDescriptions[plan.id]} />
          </li>
        ))}
      </ul>,
  },
  {
    id: "schools-groups",
    question: "هل توجد أسعار خاصة للمدارس والمجموعات؟",
    answer:
      'نعم، يوفّر زيد أسعارًا خاصة للمدارس واشتراكات للمجموعات الطلابية، مع دعم متكامل للتطبيق داخل المدرسة. يمكنك طلب عرض خاص عبر زر "اطلب عرضًا لمدرستك".',
  },
  {
    id: "teacher-account",
    question: "هل يدفع المعلم مقابل حسابه؟",
    answer:
      "لا، لأن المعلم جزء أساسي من تجربة زيد، يحصل معلمو المدارس المشاركة على حساب خاص مجانًا دون أي تكلفة إضافية لمتابعة تقدم طلابهم وتقارير أدائهم.",
  },
];

export default function FAQSection() {
  const [openId, setOpenId] = useState<string | null>("what-is-zayd");

  const toggleItem = (id: string) => {
    setOpenId(current => current === id ? null : id);
  };

  return (
    <section id="faq" className="faq" dir="rtl" lang="ar" aria-labelledby="faq-heading">
      <div className="faq__container">
        <div className="faq__header">
          <span className="faq__eyebrow">الأسئلــة الشائعــة</span>
          <h2 id="faq-heading" className="faq__heading">
            <span>كل ما تحتاج معرفته</span>
            <span className="faq__heading-accent">قبـــــــــــل البـــــــــــدء</span>
          </h2>
        </div>

        <div className="faq__list">
          {faqs.map((faq) => {
            const isOpen = openId === faq.id;
            return (
              <div key={faq.id} className={`faq__item${isOpen ? " faq__item--open" : ""}`}>
                <h3 className="faq__question-heading">
                <button
                  type="button"
                  id={`faq-question-${faq.id}`}
                  onClick={() => toggleItem(faq.id)}
                  className="faq__question"
                  aria-expanded={isOpen}
                  aria-controls={`faq-answer-${faq.id}`}
                >
                  <span><BilingualText text={faq.question} /></span>
                  <CircleChevronDown className="faq__chevron" aria-hidden="true" strokeWidth={2.25} />
                </button>
                </h3>
                <div id={`faq-answer-${faq.id}`} className="faq__answer-collapse" role="region" aria-labelledby={`faq-question-${faq.id}`} aria-hidden={!isOpen} data-open={isOpen}>
                  <div className="faq__answer-inner"><div className="faq__answer">
                  {typeof faq.answer === "string" ? <p>{faq.answer}</p> : faq.answer}
                  </div></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
