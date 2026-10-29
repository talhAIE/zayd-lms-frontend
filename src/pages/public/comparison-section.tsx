import { CheckCircle2, AlertCircle } from "lucide-react";

export default function ComparisonSection() {
  return (
    <section className="py-20 md:py-28 bg-white font-ibm-plex" dir="rtl">
      <div className="max-w-[1180px] mx-auto px-4 md:px-6">
        {/* Section Header */}
        <div className="text-center max-w-[720px] mx-auto">
          {/* Eyebrow */}
          <div className="inline-flex items-center justify-center gap-3">
            <span className="w-6 h-[1.5px] bg-[#48D3BF]" />
            <span className="text-[#2681E9] text-[13px] sm:text-[14px] font-bold tracking-wide">
              يدرس الإنجليزية لسنوات
            </span>
            <span className="w-6 h-[1.5px] bg-[#48D3BF]" />
          </div>

          {/* Heading */}
          <h2 className="mt-4 text-[32px] sm:text-[42px] lg:text-[49px] font-bold text-[#07294D] tracking-tight leading-[1.25]">
            لكــن كــم يتحــدث فعليًــا؟
          </h2>

          {/* Description */}
          <p className="mt-4 text-[15px] sm:text-[16px] leading-[1.8] text-[#60768B]">
            المشكلة ليست دائمًا في شرح اللغة أو فهم القواعد، بل في أن كل طالب يحتاج فرصة حقيقية
            للتحدث بانتظام وبدون خوف من الوقوع في الخطأ.
          </p>
        </div>

        {/* Side-by-Side Comparison Cards */}
        <div className="mt-12 md:mt-16 grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Card 1: With Zayd (Positive / Green Accent) */}
          <div className="relative bg-gradient-to-br from-[#EBFCF7] to-[#F9FFFD] border border-[#BFEEE4] rounded-[24px] p-7 sm:p-9 shadow-[0px_12px_35px_rgba(9,121,102,0.06)] flex flex-col justify-between overflow-hidden">
            {/* Ambient Corner Blob */}
            <div className="absolute -bottom-12 -left-12 w-44 h-44 rounded-full bg-[#097966]/5 blur-2xl pointer-events-none" />

            <div>
              {/* Badge */}
              <div className="inline-flex items-center px-3 py-1.5 bg-[#097966] text-white text-[12px] font-bold rounded-[8px] shadow-sm">
                مع زيــــد
              </div>

              {/* Title */}
              <h3 className="mt-5 text-[22px] sm:text-[25px] font-bold text-[#07294D] leading-snug">
                لكل طالب مساحة شخصية للممارسة
              </h3>

              {/* Description */}
              <p className="mt-3 text-[15px] sm:text-[16px] leading-[1.8] text-[#60768B]">
                زيــــد لا يستبدل المعلم؛ بل يضيف طبقة من الممارسة التفاعلية المستمرة خارج أوقات
                الحصة لبناء الطلاقة التامة.
              </p>

              {/* Feature Points */}
              <ul className="mt-7 space-y-3.5">
                <li className="flex items-center gap-3 text-[#07294D] text-[14px] sm:text-[15px] font-medium">
                  <CheckCircle2 className="w-5 h-5 text-[#097966] flex-shrink-0" />
                  <span>يتحدث ويستمع ويقرأ ويكتب ويتفاعل يوميًا</span>
                </li>
                <li className="flex items-center gap-3 text-[#07294D] text-[14px] sm:text-[15px] font-medium">
                  <CheckCircle2 className="w-5 h-5 text-[#097966] flex-shrink-0" />
                  <span>يحصل على تغذية راجعة فورية وتصحيح ذكي</span>
                </li>
                <li className="flex items-center gap-3 text-[#07294D] text-[14px] sm:text-[15px] font-medium">
                  <CheckCircle2 className="w-5 h-5 text-[#097966] flex-shrink-0" />
                  <span>يعيد المحاولة بحرية ويتقدم حسب وتيرته ومستواه</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Card 2: Traditional Classroom (Rose Accent) */}
          <div className="relative bg-gradient-to-br from-[#FFF3F4] to-[#FFFAFA] border border-[#F3D1D4] rounded-[24px] p-7 sm:p-9 shadow-[0px_12px_35px_rgba(226,78,90,0.06)] flex flex-col justify-between overflow-hidden">
            {/* Ambient Corner Blob */}
            <div className="absolute -bottom-12 -left-12 w-44 h-44 rounded-full bg-[#E24E5A]/5 blur-2xl pointer-events-none" />

            <div>
              {/* Badge */}
              <div className="inline-flex items-center px-3 py-1.5 bg-[#E24E5A] text-white text-[12px] font-bold rounded-[8px] shadow-sm">
                داخل الفصل
              </div>

              {/* Title */}
              <h3 className="mt-5 text-[22px] sm:text-[25px] font-bold text-[#07294D] leading-snug">
                معلــم واحــد… وعشـرات الطلاب
              </h3>

              {/* Description */}
              <p className="mt-3 text-[15px] sm:text-[16px] leading-[1.8] text-[#60768B]">
                مهما كانت كفاءة المعلم وإخلاصه، يظل وقت الحصة محدودًا، ويصعب توفير دقائق فردية كافية
                لكل طالب ليتحدث ويطور لغته.
              </p>

              {/* Challenge Points */}
              <ul className="mt-7 space-y-3.5">
                <li className="flex items-center gap-3 text-[#07294D] text-[14px] sm:text-[15px] font-medium">
                  <AlertCircle className="w-5 h-5 text-[#E24E5A] flex-shrink-0" />
                  <span>وقت محدود جدًا للتحدث والمحادثة الحية</span>
                </li>
                <li className="flex items-center gap-3 text-[#07294D] text-[14px] sm:text-[15px] font-medium">
                  <AlertCircle className="w-5 h-5 text-[#E24E5A] flex-shrink-0" />
                  <span>فرص أقل لإعادة المحاولة وتكرار التجربة</span>
                </li>
                <li className="flex items-center gap-3 text-[#07294D] text-[14px] sm:text-[15px] font-medium">
                  <AlertCircle className="w-5 h-5 text-[#E24E5A] flex-shrink-0" />
                  <span>صعوبة تقديم تقييم وتغذية راجعة دقيقة ومستمرة للجميع</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
