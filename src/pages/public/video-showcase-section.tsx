import { useState } from "react";
import { Play } from "lucide-react";

export default function VideoShowcaseSection() {
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <section className="py-20 md:py-28 bg-[#F8FBFD] font-ibm-plex" dir="rtl">
      <div className="max-w-[1180px] mx-auto px-4 md:px-6">
        {/* Section Header */}
        <div className="text-center max-w-[720px] mx-auto">
          {/* Eyebrow */}
          <div className="inline-flex items-center justify-center gap-3">
            <span className="w-6 h-[1.5px] bg-[#48D3BF]" />
            <span className="text-[#2681E9] text-[13px] sm:text-[14px] font-bold tracking-wide">
              70 ثانية تكفي لفهم الفكرة
            </span>
            <span className="w-6 h-[1.5px] bg-[#48D3BF]" />
          </div>

          {/* Heading */}
          <h2 className="mt-4 text-[32px] sm:text-[42px] lg:text-[49px] font-bold text-[#07294D] tracking-tight leading-[1.25]">
            شاهد زيــــد وهو يصنع الفرق
          </h2>

          {/* Description */}
          <p className="mt-4 text-[15px] sm:text-[16px] leading-[1.8] text-[#60768B]">
            شاهد كيف ينتقل الطالب من مجرد دراسة الإنجليزية وحفظ القواعد إلى التحدث الفعلي والممارسة التفاعلية الممتعة.
          </p>
        </div>

        {/* Video Player Frame */}
        <div className="mt-12 md:mt-14 relative w-full aspect-[16/9] md:h-[490px] rounded-[24px] md:rounded-[29px] border-[6px] md:border-[10px] border-white shadow-[0px_24px_70px_rgba(17,83,143,0.12)] overflow-hidden bg-gradient-to-br from-[#0B3A68] via-[#104F8A] to-[#07294D] group cursor-pointer">
          {/* Ambient Lighting Gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#061D36]/80 via-transparent to-[#061D36]/30 pointer-events-none" />

          {/* Decorative Video Mock UI Grid */}
          <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#C9E4F9_1px,transparent_1px)] [background-size:24px_24px]" />

          {/* Center Play Button & Trigger */}
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3.5 z-10 select-none">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              aria-label="تشغيل فيديو التعريف"
              className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-white border-[6px] border-white/70 shadow-[0px_12px_35px_rgba(6,79,151,0.25)] flex items-center justify-center text-[#2681E9] group-hover:scale-110 transition-transform duration-300"
            >
              <Play className="w-6 h-6 md:w-7 md:h-7 fill-[#2681E9] translate-x-[-1px]" />
            </button>

            <span className="text-white font-bold text-[16px] md:text-[18px] tracking-wide">
              شاهد الفيديو
            </span>

            <span className="px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-white/90 text-[12px] font-semibold">
              01:10
            </span>
          </div>

          {/* Subtle Bottom Bar Preview */}
          <div className="absolute bottom-4 left-6 right-6 flex items-center justify-between text-white/60 text-xs z-10 pointer-events-none">
            <span>تجربة زيــــد التفاعلية</span>
            <span>HD • 1080p</span>
          </div>
        </div>
      </div>
    </section>
  );
}
