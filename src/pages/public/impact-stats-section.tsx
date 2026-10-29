import impactGraphic from "@/assets/landing-page/section7.png";

export default function ImpactStatsSection() {
  return (
    <section className="py-20 md:py-28 bg-[#F8FBFD] font-ibm-plex" dir="rtl">
      <div className="max-w-[1180px] mx-auto px-4 md:px-6">
        {/* Top Comparison Card */}
        <div className="rounded-[28px] border border-[#DCE9F4] bg-gradient-to-br from-white to-[#F3F9FF] shadow-[0px_16px_45px_rgba(12,82,145,0.06)] p-8 md:p-12 overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Right Column: Copy */}
            <div className="lg:col-span-7 flex flex-col items-start z-10">
              {/* Eyebrow */}
              <div className="inline-flex items-center gap-3">
                <span className="w-6 h-[1.5px] bg-[#48D3BF]" />
                <span className="text-[#2681E9] text-[13px] sm:text-[14px] font-bold tracking-wide">
                  نتيجة فارقة
                </span>
                <span className="w-6 h-[1.5px] bg-[#48D3BF]" />
              </div>

              {/* Heading */}
              <h2 className="mt-4 text-[30px] sm:text-[40px] lg:text-[46px] font-bold text-[#07294D] tracking-tight leading-[1.25]">
                عام واحد مع زيــــد تساوي نحو{" "}
                <span className="text-[#2681E9]">10 سنوات</span>{" "}
                من ممارسة التحدث
              </h2>

              {/* Description */}
              <p className="mt-5 text-[15px] sm:text-[16px] leading-[1.8] text-[#60768B] max-w-[580px]">
                أظهرت تجارب طلابنا أن الاستخدام المنتظم لزيــــد يمكن أن يمنح الطالب حجمًا من ممارسة
                التحدث والمحادثة باللغة الإنجليزية يعادل ما قد يحصل عليه خلال سنوات طويلة داخل الفصل
                التقليدي.
              </p>

              {/* Footnote */}
              <div className="mt-7 pt-4 border-t border-[#DCE9F4] w-full">
                <p className="text-[12px] sm:text-[13px] text-[#8CA0B1]">
                  * المقارنة تتعلق بحجم فرص ممارسة التحدث الفردية المباشرة، وليس بعدد سنوات الدراسة الأكاديمية.
                </p>
              </div>
            </div>

            {/* Left Column: 3D Comparison Graphic */}
            <div className="lg:col-span-5 flex justify-center items-center">
              <div className="relative w-full max-w-[420px] aspect-[4/3] flex items-center justify-center">
                <img
                  src={impactGraphic}
                  alt="مقارنة ممارسة التحدث: عام واحد مقابل 10 سنوات"
                  className="w-full h-full object-contain filter drop-shadow-[0_15px_30px_rgba(10,72,126,0.12)]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Dark Metrics Bar */}
        <div className="mt-6 rounded-[20px] bg-[#07294D] p-6 md:p-8 shadow-[0px_16px_40px_rgba(7,41,77,0.15)] text-white">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-0 divide-y md:divide-y-0 md:divide-x md:divide-x-reverse divide-white/10">
            {/* Stat 1 */}
            <div className="flex flex-col items-center text-center px-4 pt-4 md:pt-0">
              <span className="text-[32px] sm:text-[36px] font-bold text-[#48D3BF] leading-tight">
                +1,000
              </span>
              <span className="text-[14px] text-white/75 font-medium mt-1">
                طالب مسجل يتعلم بثقة
              </span>
            </div>

            {/* Stat 2 */}
            <div className="flex flex-col items-center text-center px-4 pt-4 md:pt-0">
              <span className="text-[32px] sm:text-[36px] font-bold text-[#48D3BF] leading-tight">
                +2,200
              </span>
              <span className="text-[14px] text-white/75 font-medium mt-1">
                ساعة ممارسة تحدث فعلية
              </span>
            </div>

            {/* Stat 3 */}
            <div className="flex flex-col items-center text-center px-4 pt-4 md:pt-0">
              <span className="text-[32px] sm:text-[36px] font-bold text-[#48D3BF] leading-tight">
                +8,600
              </span>
              <span className="text-[14px] text-white/75 font-medium mt-1">
                درس ومحادثة تم إنجازها
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
