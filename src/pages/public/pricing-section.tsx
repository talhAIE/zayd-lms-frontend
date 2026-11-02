import { Check, ArrowLeft } from "lucide-react";

export default function PricingSection() {
  return (
    <section id="pricing" className="py-20 md:py-28 bg-[#F8FBFD] font-ibm-plex" dir="rtl">
      <div className="max-w-[1180px] mx-auto px-4 md:px-6">
        {/* Section Header */}
        <div className="text-center max-w-[720px] mx-auto">
          {/* Eyebrow */}
          <div className="inline-flex items-center justify-center gap-3">
            <span className="w-6 h-[1.5px] bg-[#48D3BF]" />
            <span className="text-[#2681E9] text-[13px] sm:text-[14px] font-bold tracking-wide">
              عرض لفترة محدودة
            </span>
            <span className="w-6 h-[1.5px] bg-[#48D3BF]" />
          </div>

          {/* Heading */}
          <h2 className="mt-4 text-[32px] sm:text-[42px] lg:text-[49px] font-bold text-[#07294D] tracking-tight leading-[1.25]">
            اختر التجربة المناسبة
          </h2>

          {/* Description */}
          <p className="mt-4 text-[15px] sm:text-[16px] leading-[1.8] text-[#60768B]">
            خصم 50% متاح حاليًا على جميع الباقات السنوية للأفراد لتمنح طالبك فرصة الممارسة الحقيقية.
          </p>
        </div>

        {/* Pricing Cards Grid */}
        <div className="mt-14 md:mt-16 grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch pt-4">
          {/* Card 1: باقة المنهج */}
          <div className="bg-white border border-[#DCE9F4] rounded-[23px] p-7 sm:p-8 shadow-[0px_10px_35px_rgba(15,78,133,0.07)] flex flex-col justify-between transition-all hover:shadow-lg hover:-translate-y-1">
            <div>
              {/* Badge */}
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 rounded-full bg-[#E9FBF7] text-[#07977E] text-[11px] font-bold">
                  خصم 50%
                </span>
                <span className="text-[12px] text-[#60768B]">اشتراك سنوي</span>
              </div>

              {/* Title & Subtitle */}
              <h3 className="mt-4 text-[24px] font-bold text-[#07294D]">باقة المنهج</h3>
              <p className="text-[13px] text-[#60768B] mt-1">لطلاب المتوسطة والثانوية</p>

              {/* Price */}
              <div className="mt-6 flex items-baseline gap-2">
                <span className="text-[38px] font-bold text-[#2681E9]">99.5</span>
                <span className="text-[12px] text-[#60768B] font-medium">ر.س / سنة</span>
                <span className="text-[14px] text-[#8CA0B1] line-through mr-auto">199 ر.س</span>
              </div>

              {/* Features List */}
              <ul className="mt-8 space-y-3.5 border-t border-[#EEF4F9] pt-6">
                {[
                  "محتوى متوافق بالكامل مع المنهج السعودي",
                  "التحدث والاستماع والقراءة والكتابة",
                  "تعلّم مخصص وتدرج حسب المستوى",
                  "تغذية راجعة ذكية وملاحظات فورية",
                ].map((feat, idx) => (
                  <li key={idx} className="flex items-center gap-3 text-[14px] text-[#07294D]">
                    <div className="w-5 h-5 rounded-full bg-[#E9FBF7] text-[#07977E] flex items-center justify-center flex-shrink-0">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* CTA */}
            <a
              href="/auth/register"
              className="mt-8 h-[46px] w-full rounded-[11px] bg-gradient-to-r from-[#2681E9] to-[#0862C1] hover:from-[#1F73D4] hover:to-[#0753A6] shadow-[0px_10px_26px_rgba(38,129,233,0.22)] text-white text-[14px] font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <span>ابدأ باقة المنهج</span>
              <ArrowLeft className="w-4 h-4" />
            </a>
          </div>

          {/* Card 2: Zayd Plus (Featured / Elevated) */}
          <div className="relative bg-white border-2 border-[#2681E9] rounded-[23px] p-7 sm:p-8 shadow-[0px_24px_60px_rgba(31,126,217,0.16)] flex flex-col justify-between lg:-translate-y-4 transition-all hover:shadow-2xl">
            {/* Top Ribbon */}
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-6 py-1 rounded-full bg-[#2681E9] text-white text-[12px] font-bold shadow-md">
              الأفضل قيمة والأشمل
            </div>

            <div>
              {/* Badge */}
              <div className="flex items-center justify-between pt-2">
                <span className="px-3 py-1 rounded-full bg-[#E9FBF7] text-[#07977E] text-[11px] font-bold">
                  خصم 50%
                </span>
                <span className="text-[12px] text-[#2681E9] font-bold">شامل كل المزايا</span>
              </div>

              {/* Title & Subtitle */}
              <h3 className="mt-4 text-[24px] font-bold text-[#07294D]">Zayd Plus</h3>
              <p className="text-[13px] text-[#60768B] mt-1">التجربة الكاملة للمنهج والحياة</p>

              {/* Price */}
              <div className="mt-6 flex items-baseline gap-2">
                <span className="text-[38px] font-bold text-[#2681E9]">199.5</span>
                <span className="text-[12px] text-[#60768B] font-medium">ر.س / سنة</span>
                <span className="text-[14px] text-[#8CA0B1] line-through mr-auto">399 ر.س</span>
              </div>

              {/* Features List */}
              <ul className="mt-8 space-y-3.5 border-t border-[#EEF4F9] pt-6">
                {[
                  "جميع مزايا باقة المنهج الدراسي بالكامل",
                  "جميع مزايا Zayd Life للتحدث اليومي",
                  "أكثر من 40 موقفًا وموضوعًا حياتيًا تفاعليًا",
                  "تجربة أشمل لبناء الثقة والطلاقة اللغوية",
                ].map((feat, idx) => (
                  <li key={idx} className="flex items-center gap-3 text-[14px] text-[#07294D] font-medium">
                    <div className="w-5 h-5 rounded-full bg-[#2681E9] text-white flex items-center justify-center flex-shrink-0">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* CTA */}
            <a
              href="/auth/register"
              className="mt-8 h-[48px] w-full rounded-[11px] bg-gradient-to-r from-[#2681E9] to-[#0862C1] hover:from-[#1F73D4] hover:to-[#0753A6] shadow-[0px_10px_26px_rgba(38,129,233,0.3)] text-white text-[15px] font-bold flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02] cursor-pointer"
            >
              <span>اختر Zayd Plus</span>
              <ArrowLeft className="w-4 h-4" />
            </a>
          </div>

          {/* Card 3: Zayd Life */}
          <div className="bg-white border border-[#DCE9F4] rounded-[23px] p-7 sm:p-8 shadow-[0px_10px_35px_rgba(15,78,133,0.07)] flex flex-col justify-between transition-all hover:shadow-lg hover:-translate-y-1">
            <div>
              {/* Badge */}
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 rounded-full bg-[#E9FBF7] text-[#07977E] text-[11px] font-bold">
                  خصم 50%
                </span>
                <span className="text-[12px] text-[#60768B]">اشتراك سنوي</span>
              </div>

              {/* Title & Subtitle */}
              <h3 className="mt-4 text-[24px] font-bold text-[#07294D]">Zayd Life</h3>
              <p className="text-[13px] text-[#60768B] mt-1">للإنجليزية في الحياة اليومية</p>

              {/* Price */}
              <div className="mt-6 flex items-baseline gap-2">
                <span className="text-[38px] font-bold text-[#2681E9]">99.5</span>
                <span className="text-[12px] text-[#60768B] font-medium">ر.س / سنة</span>
                <span className="text-[14px] text-[#8CA0B1] line-through mr-auto">199 ر.س</span>
              </div>

              {/* Features List */}
              <ul className="mt-8 space-y-3.5 border-t border-[#EEF4F9] pt-6">
                {[
                  "أكثر من 40 موضوعًا وموقفًا حياتيًا",
                  "المطعم، السوق، المطار، السفر وغيرها",
                  "ممارسة التحدث في المواقف الاجتماعية",
                  "تغذية راجعة وتكرار المحاولة بحرية تامة",
                ].map((feat, idx) => (
                  <li key={idx} className="flex items-center gap-3 text-[14px] text-[#07294D]">
                    <div className="w-5 h-5 rounded-full bg-[#E9FBF7] text-[#07977E] flex items-center justify-center flex-shrink-0">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* CTA */}
            <a
              href="/auth/register"
              className="mt-8 h-[46px] w-full rounded-[11px] bg-gradient-to-r from-[#2681E9] to-[#0862C1] hover:from-[#1F73D4] hover:to-[#0753A6] shadow-[0px_10px_26px_rgba(38,129,233,0.22)] text-white text-[14px] font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <span>ابدأ Zayd Life</span>
              <ArrowLeft className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
