import { Mic, MessageSquare, Sparkles, Shield, RotateCcw, Volume2 } from "lucide-react";
import heroAvatar from "@/assets/landing-page/section5.png";

const pillars = [
  {
    title: "ممارسة التحدث",
    desc: "فرص متكررة للتحدث بدل انتظار الدور داخل الفصل.",
    icon: Mic,
  },
  {
    title: "تغذية راجعة فورية",
    desc: "ملاحظات ذكية تساعد الطالب على معرفة ما يحتاج إلى تحسينه.",
    icon: MessageSquare,
  },
  {
    title: "تعلّم مخصص",
    desc: "تجربة تتفاعل مع مستوى الطالب واحتياجه وتقدمه.",
    icon: Sparkles,
  },
  {
    title: "مساحة آمنة للتحدث",
    desc: "بيئة مريحة للطالب المتردد أو الأقل مشاركة.",
    icon: Shield,
  },
  {
    title: "إعادة المحاولة",
    desc: "يتدرب الطالب مرة بعد مرة حتى يتحسن.",
    icon: RotateCcw,
  },
  {
    title: "دعم النطق",
    desc: "ممارسة مستمرة لتحسين ووضوح الأداء الشفهي.",
    icon: Volume2,
  },
];

export default function PersonalizedLearningSection() {
  return (
    <section className="py-20 md:py-28 bg-white font-ibm-plex" dir="rtl">
      <div className="max-w-[1180px] mx-auto px-4 md:px-6">
        {/* Section Header */}
        <div className="text-center max-w-[720px] mx-auto">
          {/* Eyebrow */}
          <div className="inline-flex items-center justify-center gap-3">
            <span className="w-6 h-[1.5px] bg-[#48D3BF]" />
            <span className="text-[#2681E9] text-[13px] sm:text-[14px] font-bold tracking-wide">
              تجربة تتكيف معك
            </span>
            <span className="w-6 h-[1.5px] bg-[#48D3BF]" />
          </div>

          {/* Heading */}
          <h2 className="mt-4 text-[32px] sm:text-[42px] lg:text-[49px] font-bold text-[#07294D] tracking-tight leading-[1.25]">
            كل طالب يتعلم ويتحدث بطريقته
          </h2>

          {/* Description */}
          <p className="mt-4 text-[15px] sm:text-[16px] leading-[1.8] text-[#60768B]">
            لأن الطلاب لا يتعلمون بالطريقة نفسها، يمنح زيــــد كل طالب مساحة أكبر للتجربة والتكرار والتحسن في بيئة تراعي احتياجه الفردي.
          </p>
        </div>

        {/* Content Area: 6 Feature Cards & Visual Artwork */}
        <div className="mt-14 md:mt-16 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Visual Illustration with Concentric Circles */}
          <div className="lg:col-span-4 relative flex items-center justify-center order-2 lg:order-1">
            <div className="relative w-full max-w-[360px] sm:max-w-[410px] aspect-[410/520] flex items-center justify-center">
              {/* Concentric & Eccentric Decorative Circles */}
              <svg
                className="absolute inset-0 w-full h-full pointer-events-none overflow-visible"
                viewBox="0 0 410 520"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <defs>
                  <linearGradient id="personalizedLearningCircleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="6.17%" stopColor="#DFF9F4" />
                    <stop offset="93.83%" stopColor="#E3F3FF" />
                  </linearGradient>
                </defs>

                {/* Outer Dashed Ring (Figma: 410x410, top=80px) */}
                <circle
                  cx="205"
                  cy="285"
                  r="204.5"
                  stroke="#ACD9EF"
                  strokeWidth="1.25"
                  strokeDasharray="5 5"
                />

                {/* Inner Dashed Ring (Figma: 360x360, top=130px) */}
                <circle
                  cx="205"
                  cy="310"
                  r="179.5"
                  stroke="#ACD9EF"
                  strokeWidth="1.25"
                  strokeDasharray="5 5"
                />

                {/* Solid Gradient Circle (Figma: 310x310, top=200px) */}
                <circle
                  cx="205"
                  cy="355"
                  r="155"
                  fill="url(#personalizedLearningCircleGrad)"
                />
              </svg>

              {/* Avatar Image */}
              <img
                src={heroAvatar}
                alt="معلم زيد الذكي"
                className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[65.5%] w-auto object-contain object-bottom select-none pointer-events-none drop-shadow-[0_15px_25px_rgba(10,72,126,0.12)] z-10"
              />

              {/* Floating Pill Badge */}
              <div
                dir="ltr"
                className="absolute top-[73.5%] left-[2%] sm:left-[4%] bg-white shadow-[0px_24px_70px_rgba(17,83,143,0.12)] border border-[#DCE9F4] rounded-[10px] px-3.5 py-2 flex items-center gap-2 z-20 whitespace-nowrap"
              >
                <Sparkles className="w-4 h-4 text-[#2681E9] shrink-0" />
                <span className="text-[12px] font-bold text-[#2681E9]">رحلة تعلم خاصة بك</span>
              </div>
            </div>
          </div>

          {/* Right 6 Feature Cards Grid */}
          <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-4 order-1 lg:order-2">
            {pillars.map((item, index) => {
              const IconComp = item.icon;
              return (
                <div
                  key={index}
                  className="bg-white border border-[#DCE9F4] hover:border-[#2681E9]/40 rounded-[18px] p-6 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 flex flex-col items-start"
                >
                  <div className="w-[42px] h-[42px] rounded-[12px] bg-gradient-to-br from-[#FFFFFF] to-[#EEF7FF] border border-[#D7EBFA] shadow-[0px_7px_18px_rgba(27,111,181,0.1)] flex items-center justify-center text-[#2681E9] mb-4">
                    <IconComp className="w-5 h-5" />
                  </div>
                  <h3 className="text-[17px] font-bold text-[#07294D] leading-snug">
                    {item.title}
                  </h3>
                  <p className="mt-1.5 text-[13px] leading-[1.8] text-[#60768B]">
                    {item.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
