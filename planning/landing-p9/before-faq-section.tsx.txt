import { useState } from "react";
import { CircleChevronDown } from "lucide-react";
import "./faq-section.css";

interface FAQItem {
  question: string;
  answer: string;
}

const faqs: FAQItem[] = [
  {
    question: "ما هو زيــــد؟",
    answer:
      "زيــــد معلّم ذكي لممارسة اللغة الإنجليزية يساعد الطالب على الحصول على فرص أكبر للتحدث والتفاعل والتغذية الراجعة، مع توافق كامل مع منهج طلاب المرحلتين المتوسطة والثانوية.",
  },
  {
    question: "هل زيــــد بديل عن معلم اللغة الإنجليزية؟",
    answer:
      "أبدًا، زيــــد لا يستبدل المعلم بل يعزز جهوده؛ حيث يمنح كل طالب فرصة للتحدث والتدريب الفردي والمستمر خارج الحصة لترسيخ ما يتعلمه في المدرسة دون حرج أو خوف من الخطأ.",
  },
  {
    question: "ما الصفوف التي يخدمها زيــــد حاليًا؟",
    answer:
      "يخدم زيــــد حاليًا جميع طلاب المرحلة المتوسطة (الأول، الثاني، الثالث المتوسط) والمرحلة الثانوية (المسارات المشتركة والتخصصية)، بالإضافة إلى باقة مواقف الحياة اليومية لجميع المراحل.",
  },
  {
    question: "كم يحتاج الطالب إلى استخدام زيــــد؟",
    answer:
      "يكفي من 15 إلى 20 دقيقة يوميًا بمعدل ساعة إلى ساعتين أسبوعيًا لإحداث فارق كبير في طلاقة التحدث واستيعاب الدروس وبناء الثقة اللغوية.",
  },
  {
    question: "ما الفرق بين الباقات الثلاث؟",
    answer:
      "باقة المنهج تركز بالكامل على مقررات المدرسة، وباقة Zayd Life تركز على مهارات التحدث في أكثر من 40 موقفًا حياتيًا، بينما باقة Zayd Plus هي الشاملة وتجمع المنهج والحياة اليومية معًا بأفضل قيمة.",
  },
  {
    question: "هل توجد أسعار خاصة للمدارس والمجموعات؟",
    answer:
      "نعم، نقدم باقات مرنة وخصومات خاصة للمدارس والمجموعات الطلابية الكبيرة، تشمل تقارير متابعة ولوحة تحكم متكاملة للإدارة والمعلمين.",
  },
  {
    question: "هل يدفع المعلم مقابل حسابه؟",
    answer:
      "لا، يحصل جميع معلمي ومعلمات المدارس الشريكة على حساب مجاني متكامل دون أي رسوم إضافية لمتابعة أداء فصولهم وطلابهم.",
  },
];

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleItem = (index: number) => {
    setOpenIndex(current => current === index ? null : index);
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
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div key={faq.question} className={`faq__item${isOpen ? " faq__item--open" : ""}`}>
                <h3 className="faq__question-heading">
                <button
                  type="button"
                  id={`faq-question-${index}`}
                  onClick={() => toggleItem(index)}
                  className="faq__question"
                  aria-expanded={isOpen}
                  aria-controls={`faq-answer-${index}`}
                >
                  <span>{faq.question}</span>
                  <CircleChevronDown className="faq__chevron" aria-hidden="true" strokeWidth={2.25} />
                </button>
                </h3>
                <div id={`faq-answer-${index}`} className="faq__answer" role="region" aria-labelledby={`faq-question-${index}`} hidden={!isOpen}>
                  <p>{faq.answer}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
