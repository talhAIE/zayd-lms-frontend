import { ArrowLeft, Sparkles } from "lucide-react";
import ctaAvatar from "@/assets/landing-page/section11.png";

export default function FinalCtaSection() {
  return (
    <section className="py-16 md:py-24 bg-white font-ibm-plex overflow-hidden" dir="rtl">
      <div className="max-w-[1180px] mx-auto px-4 md:px-6">
        {/* Main Gradient Banner Container */}
        <div className="relative rounded-[30px] md:rounded-[36px] bg-gradient-to-r from-[#137FE0] via-[#21A3CD] to-[#42CDB9] p-8 md:p-14 shadow-[0px_25px_60px_rgba(19,127,224,0.22)] overflow-hidden text-white">
          {/* Subtle Ambient Radial Light */}
          <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-white/10 blur-3xl pointer-events-none" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center relative z-10">
            {/* Right Column: Copy & Actions */}
            <div className="lg:col-span-7 flex flex-col items-start">
              {/* Eyebrow */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md mb-4">
                <Sparkles className="w-3.5 h-3.5 text-[#8EF0DC]" />
                <span className="text-[#8EF0DC] text-[13px] font-bold">جاهز لتجربة زيــــد؟</span>
              </div>

              {/* Heading */}
              <h2 className="text-[28px] sm:text-[38px] lg:text-[44px] font-bold text-white tracking-tight leading-[1.25]">
                المنهــج نفســه. المعلــم نفسـه. <br />
                <span className="text-white/95">لكن هذه المرة كل طالب يتحدث.</span>
              </h2>

              {/* Subtitle */}
              <p className="mt-4 text-[15px] sm:text-[17px] leading-[1.8] text-white/85 max-w-[540px]">
                امنح الطالب فرصة أكبر للتحدث والممارسة والتفاعل مع الإنجليزية التي يتعلمها اليوم
                ويحتاج إليها غدًا في حياته ومستقبله.
              </p>

              {/* Dual Action Buttons */}
              <div className="mt-8 flex flex-wrap items-center gap-4 w-full sm:w-auto">
                <a
                  href="/auth/register"
                  className="h-[48px] px-7 rounded-[12px] bg-white text-[#0862C1] hover:bg-white/90 text-[15px] font-bold shadow-lg flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02] active:scale-[0.98] w-full sm:w-auto cursor-pointer"
                >
                  <span>جرّب زيــــد الآن</span>
                  <ArrowLeft className="w-4 h-4" />
                </a>

                <a
                  href="/contact-us"
                  className="h-[48px] px-7 rounded-[12px] bg-transparent hover:bg-white/10 border border-white/50 text-white text-[15px] font-bold flex items-center justify-center gap-2 transition-all w-full sm:w-auto cursor-pointer"
                >
                  <span>اطلب تجربة لمدرستك</span>
                  <ArrowLeft className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* Left Column: Visual Avatar Character */}
            <div className="lg:col-span-5 flex justify-center items-center">
              <div className="relative w-full max-w-[340px] aspect-[4/5] flex items-center justify-center">
                <img
                  src={ctaAvatar}
                  alt="انضم إلى منصة زيد التعليمية"
                  className="w-full h-full object-contain filter drop-shadow-[0_20px_40px_rgba(0,0,0,0.2)]"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
