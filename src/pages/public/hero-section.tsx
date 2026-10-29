import { ArrowLeft, Volume2, Mic } from "lucide-react";
import heroAvatar from "@/assets/landing-page/section1.png";
import statChart from "@/assets/landing-page/stat-chart.png";
import statDocument from "@/assets/landing-page/stat-document.png";
import statClock from "@/assets/landing-page/stat-clock.png";

export default function HeroSection() {
  return (
    <section className="relative w-full pt-6 pb-16 overflow-hidden font-ibm-plex" dir="rtl">
      {/* Background radial blurs */}
      <div className="absolute top-[80px] -right-[180px] w-[430px] h-[430px] bg-[rgba(73,215,193,0.17)] rounded-full blur-[90px] pointer-events-none" />
      <div className="absolute top-[180px] -left-[140px] w-[380px] h-[380px] bg-[rgba(38,129,233,0.12)] rounded-full blur-[90px] pointer-events-none" />

      <div className="max-w-[1180px] mx-auto px-4 md:px-6">
        {/* Main Hero Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center min-h-[580px]">
          {/* Right Column: Copy & Actions */}
          <div className="lg:col-span-7 flex flex-col items-start z-10">
            {/* Target Audience Badge */}
            <div className="inline-flex items-center gap-[9px] px-[13px] py-[8px] bg-[#E6F4FF] border border-[#C7E7FF] rounded-full">
              <span className="w-[7px] h-[7px] bg-[#48D3BF] rounded-full shadow-[0px_0px_0px_5px_rgba(72,211,191,0.17)]" />
              <span className="text-[#0862C1] text-[13px] leading-5 font-semibold">
                للطلاب من الأول المتوسط إلى الثالث الثانوي
              </span>
            </div>

            {/* Primary Heading */}
            <h1 className="mt-6 text-[38px] sm:text-[50px] lg:text-[62px] leading-[1.2] font-bold text-[#07294D] tracking-tight">
              من دراسة الإنجليزية <br />
              إلى{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#2681E9] to-[#0862C1]">
                استخدامهــــا بثقــــة
              </span>
            </h1>

            {/* Description Paragraph */}
            <p className="mt-6 text-[16px] sm:text-[18px] leading-[1.9] text-[#60768B] max-w-[540px]">
              زيــــد معلّم ذكي لممارسة اللغة الإنجليزية، يمنح كل طالب فرصة للتحدث، وتلقي ملاحظات
              فورية، وبناء الثقة في بيئة تفاعلية وآمنة متوافقة مع المناهج السعودية.
            </p>

            {/* Dual CTAs */}
            <div className="mt-8 flex flex-wrap items-center gap-[13px] w-full sm:w-auto">
              <a
                href="/auth/register"
                className="h-[48px] px-6 bg-gradient-to-r from-[#2681E9] to-[#0862C1] hover:from-[#1F73D4] hover:to-[#0753A6] shadow-[0px_10px_26px_rgba(38,129,233,0.22)] rounded-[12px] text-white text-[15px] font-bold flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02] active:scale-[0.98] w-full sm:w-auto cursor-pointer"
              >
                <span>ابدأ مع زيــــد الآن</span>
                <ArrowLeft className="w-4 h-4" />
              </a>

              <a
                href="#schools"
                className="h-[48px] px-6 border border-[#B8D9F7] bg-white/70 hover:bg-[#F3F9FF] rounded-[12px] text-[#2681E9] text-[15px] font-bold flex items-center justify-center gap-2 transition-all w-full sm:w-auto cursor-pointer"
              >
                <span>زيــــد للمدارس</span>
                <ArrowLeft className="w-4 h-4" />
              </a>
            </div>

            {/* Social Proof Counter */}
            <div className="mt-9 flex items-center gap-[14px]">
              <div className="flex -space-x-2 space-x-reverse">
                <div className="w-8 h-8 rounded-full bg-[#2681E9] border-2 border-white text-white text-[11px] font-bold flex items-center justify-center shadow-sm">
                  ز
                </div>
                <div className="w-8 h-8 rounded-full bg-[#48D3BF] border-2 border-white text-white text-[11px] font-bold flex items-center justify-center shadow-sm">
                  ي
                </div>
                <div className="w-8 h-8 rounded-full bg-[#07294D] border-2 border-white text-white text-[11px] font-bold flex items-center justify-center shadow-sm">
                  د
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-[14px] leading-5 font-bold text-[#07294D]">
                  +1,000 طالب
                </span>
                <span className="text-[12px] leading-4 text-[#60768B]">
                  يتعلمون ويتحدثون بثقة مع زيــــد
                </span>
              </div>
            </div>
          </div>

          {/* Left Column: Visual Avatar & Floating AI Badges */}
          <div className="lg:col-span-5 relative flex justify-center lg:justify-end items-center">
            {/* Backdrop Frame Glow */}
            <div className="relative w-full max-w-[420px] aspect-[4/5] rounded-[28px] bg-gradient-to-b from-[#FFFFFF] to-[#E9F3FC] border-8 border-white shadow-[0px_24px_70px_rgba(17,83,143,0.12)] flex items-end justify-center overflow-hidden">
              <img
                src={heroAvatar}
                alt="المعلم الذكي زيـــد"
                className="w-full h-full object-contain object-bottom select-none transform hover:scale-[1.02] transition-transform duration-500"
              />
            </div>

            {/* Floating Badge 1 - Top Left */}
            <div className="absolute -top-3 sm:top-6 -left-2 sm:-left-6 bg-white/90 backdrop-blur-md border border-white/95 shadow-[0px_12px_30px_rgba(15,77,132,0.15)] rounded-[14px] p-3 flex items-center gap-2.5 z-20 animate-bounce duration-1000">
              <div className="w-8 h-8 rounded-[10px] bg-[#E8FAF7] flex items-center justify-center text-[#48D3BF]">
                <Volume2 className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-[12px] font-bold text-[#07294D]">ممتاز!</span>
                <span className="text-[11px] text-[#48D3BF] font-semibold">نطقك يتحسن</span>
              </div>
            </div>

            {/* Floating Badge 2 - Bottom Right */}
            <div className="absolute -bottom-4 sm:bottom-8 -right-2 sm:-right-4 bg-white/90 backdrop-blur-md border border-white/95 shadow-[0px_12px_30px_rgba(15,77,132,0.15)] rounded-[14px] p-3 flex items-center gap-2.5 z-20">
              <div className="w-8 h-8 rounded-[10px] bg-[#EAF3FD] flex items-center justify-center text-[#2681E9]">
                <Mic className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-[12px] font-bold text-[#07294D]">تحدث بثقة</span>
                <span className="text-[11px] text-[#2681E9] font-medium">وتعلّم بطريقتك</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Strip: 3 Cards */}
        <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Card 1 */}
          <div className="bg-gradient-to-br from-[#FFFFFF] to-[#F3F9FF] border border-[#D9EBFA] shadow-[0px_12px_35px_rgba(12,82,145,0.08)] rounded-[18px] p-5 md:p-6 flex items-center gap-4 transition-all hover:shadow-[0px_16px_40px_rgba(12,82,145,0.12)] hover:-translate-y-0.5">
            <img
              src={statChart}
              alt="إحصائية ممارسة التحدث"
              className="w-[60px] h-[60px] sm:w-[65px] sm:h-[65px] object-contain flex-shrink-0"
            />
            <div className="flex flex-col">
              <span className="text-[28px] font-bold text-[#2681E9] leading-tight">×10</span>
              <span className="text-[13px] text-[#60768B] font-medium mt-1">
                ممارسة أكثر للتحدث
              </span>
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-gradient-to-br from-[#FFFFFF] to-[#F3F9FF] border border-[#D9EBFA] shadow-[0px_12px_35px_rgba(12,82,145,0.08)] rounded-[18px] p-5 md:p-6 flex items-center gap-4 transition-all hover:shadow-[0px_16px_40px_rgba(12,82,145,0.12)] hover:-translate-y-0.5">
            <img
              src={statDocument}
              alt="إحصائية المواقف الحياتية"
              className="w-[60px] h-[60px] sm:w-[65px] sm:h-[65px] object-contain flex-shrink-0"
            />
            <div className="flex flex-col">
              <span className="text-[28px] font-bold text-[#2681E9] leading-tight">+40</span>
              <span className="text-[13px] text-[#60768B] font-medium mt-1">
                موضوعًا وموقفًا حياتيًا
              </span>
            </div>
          </div>

          {/* Card 3 */}
          <div className="bg-gradient-to-br from-[#FFFFFF] to-[#F3F9FF] border border-[#D9EBFA] shadow-[0px_12px_35px_rgba(12,82,145,0.08)] rounded-[18px] p-5 md:p-6 flex items-center gap-4 transition-all hover:shadow-[0px_16px_40px_rgba(12,82,145,0.12)] hover:-translate-y-0.5">
            <img
              src={statClock}
              alt="إحصائية وقت الممارسة"
              className="w-[60px] h-[60px] sm:w-[65px] sm:h-[65px] object-contain flex-shrink-0"
            />
            <div className="flex flex-col">
              <span className="text-[28px] font-bold text-[#2681E9] leading-tight">ساعة</span>
              <span className="text-[13px] text-[#60768B] font-medium mt-1">
                ممارسة منتظمة أسبوعيًا
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
