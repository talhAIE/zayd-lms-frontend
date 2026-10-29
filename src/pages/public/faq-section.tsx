import { useState } from "react";
import { Plus, Minus } from "lucide-react";

interface FAQItem {
  question: string;
  answer: string;
}

const faqs: FAQItem[] = [
  {
    question: "ما هو زيــــد؟",
    answer:
      "زيــــد معلّم ذكي لممارسة اللغة الإنجليزية، يمنح الطالب فرصًا أكبر للتحدث والتفاعل والتغذية الراجعة الفورية، مع توافق كامل مع مناهج طلاب المرحلتين المتوسطة والثانوية بالمملكة.",
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
    question: "كم يحتاج الطالب إلى استخدام زيــــد يوميًا؟",
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
    question: "هل يدفع المعلم مقابل حسابه في المدارس المشاركة؟",
    answer:
      "لا، يحصل جميع معلمي ومعلمات المدارس الشريكة على حساب مجاني متكامل دون أي رسوم إضافية لمتابعة أداء فصولهم وطلابهم.",
  },
];

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleItem = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="py-20 md:py-28 bg-[#F8FBFD] font-ibm-plex" dir="rtl">
      <div className="max-w-[1180px] mx-auto px-4 md:px-6">
        {/* Section Header */}
        <div className="text-center max-w-[720px] mx-auto">
          {/* Eyebrow */}
          <div className="inline-flex items-center justify-center gap-3">
            <span className="w-6 h-[1.5px] bg-[#48D3BF]" />
            <span className="text-[#2681E9] text-[13px] sm:text-[14px] font-bold tracking-wide">
              الأسئلـــة الشائعـــة
            </span>
            <span className="w-6 h-[1.5px] bg-[#48D3BF]" />
          </div>

          {/* Heading */}
          <h2 className="mt-4 text-[32px] sm:text-[42px] lg:text-[49px] font-bold text-[#07294D] tracking-tight leading-[1.25]">
            كل ما تحتاج معرفته <br />
            قبل البدء مع زيــــد
          </h2>
        </div>

        {/* Accordion Stack */}
        <div className="mt-12 md:mt-16 max-w-[890px] mx-auto flex flex-col gap-3.5">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={index}
                className={`bg-white rounded-[14px] border transition-all duration-200 overflow-hidden ${
                  isOpen
                    ? "border-[#A9D6F7] shadow-[0px_12px_30px_rgba(20,96,160,0.08)]"
                    : "border-[#DCE9F4] hover:border-[#BEDEF7]"
                }`}
              >
                <button
                  onClick={() => toggleItem(index)}
                  className="w-full px-5 sm:px-6 py-4 sm:py-5 flex items-center justify-between gap-4 text-right cursor-pointer select-none"
                  aria-expanded={isOpen}
                >
                  <span className="text-[15px] sm:text-[16px] font-bold text-[#07294D]">
                    {faq.question}
                  </span>
                  <div
                    className={`w-8 h-8 rounded-[8px] flex items-center justify-center transition-colors flex-shrink-0 ${
                      isOpen ? "bg-[#2681E9] text-white" : "bg-[#EEF7FF] text-[#2681E9]"
                    }`}
                  >
                    {isOpen ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  </div>
                </button>

                {isOpen && (
                  <div className="px-5 sm:px-6 pb-5 pt-1 text-[#60768B] text-[14px] sm:text-[15px] leading-[1.8] border-t border-[#EEF4F9] animate-in fade-in slide-in-from-top-1 duration-200">
                    <p>{faq.answer}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
