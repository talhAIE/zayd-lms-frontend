import { Play } from "lucide-react";
import { Link } from "react-router-dom";
import heroAvatar from "@/assets/landing-page/section1.png";
import classroom from "@/assets/landing-page/hero-classroom.png";
import statChart from "@/assets/landing-page/stat-chart.png";
import statDocument from "@/assets/landing-page/stat-document.png";
import statClock from "@/assets/landing-page/stat-clock.png";

const stats = [
  { value: "ساعة", description: "ممارسة منتظمة أسبوعيًا", image: statClock, direction: "rtl" },
  { value: "+40", description: "موضوعًا وموقفًا حياتيًا", image: statDocument, direction: "ltr" },
  { value: "×10", description: "ممارسة أكثر للتحدث", image: statChart, direction: "ltr" },
];

export default function HeroSection() {
  return (
    <section aria-labelledby="hero-heading" className="relative isolate w-full overflow-hidden bg-white pb-12 pt-10 font-ibm-plex sm:pb-14 min-[820px]:pt-14" dir="rtl">
      <div className="mx-auto w-full max-w-[1180px] px-6">
        <div className="grid grid-cols-1 items-center gap-10 min-[820px]:grid-cols-[0.95fr_1.2fr] min-[820px]:gap-12 lg:gap-16">
          <div className="relative z-10 flex flex-col items-start min-[820px]:py-8">
            <p className="rounded-full bg-gradient-to-l from-[#347FE2] to-[#50CFC4] px-3 py-1.5 text-[10px] font-bold leading-4 text-white sm:text-[12px]">
              للطلاب من الأول المتوسط إلى الثالث الثانوي
            </p>

            <h1 id="hero-heading" className="mt-4 text-[31px] font-bold leading-[1.55] text-[#222222] sm:text-[38px] min-[820px]:text-[32px] lg:text-[42px] xl:text-[44px]">
              <span className="block">من دراسة الإنجليزية إلى</span>
              <span className="mt-1 block bg-gradient-to-l from-[#5999ED] to-[#50CFC4] bg-clip-text text-transparent">
                استخدامهــــا بثقــــة
              </span>
            </h1>

            <p className="mt-3 max-w-[450px] text-[14px] leading-[1.95] text-[#595959] lg:text-[15px]">
              <strong className="font-bold">زيــد</strong> معلّم ذكي لممارسة اللغة الإنجليزية، يمنح كل طالب تجربة شخصية للتحدث والتفاعل والتغذية الراجعة، مع توافق كامل مع منهج اللغة الإنجليزية الذي يدرسه في المدرسة.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-2.5">
              <Link to="/login" className="inline-flex min-h-10 items-center justify-center rounded-full bg-[#347FE2] px-6 py-2 text-[13px] font-bold text-white transition-colors hover:bg-[#246BCA] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#347FE2] focus-visible:ring-offset-4">
                ابدأ مع زيد الآن
              </Link>
              <a href="#schools" className="inline-flex min-h-10 items-center justify-center rounded-full border border-[#E5E7EB] bg-white px-6 py-2 text-[13px] font-bold text-[#347FE2] shadow-[0_2px_0_#F1F1F1] transition-colors hover:bg-[#F3F8FF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#347FE2] focus-visible:ring-offset-4">
                زيد للمدارس
              </a>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[610px] pb-1 pt-7 min-[820px]:pt-0" dir="ltr">
            <svg aria-hidden="true" className="pointer-events-none absolute -left-[22%] -top-[15%] -z-10 h-[155%] w-[145%] text-[#D8EDF7]" viewBox="0 0 750 570" fill="none">
              {Array.from({ length: 23 }, (_, index) => (
                <path key={index} d="M 340 74 C 230 -2 84 23 115 104 C 144 174 8 134 8 231 C 8 336 157 359 239 309 C 317 263 280 400 394 433 C 538 476 677 418 626 325 C 581 241 434 228 458 169 C 480 116 420 101 340 74 Z" stroke="currentColor" strokeWidth="0.8" transform={`translate(${325 * (1 - (1 + index * 0.044))} ${230 * (1 - (1 + index * 0.044))}) scale(${1 + index * 0.044})`} />
              ))}
            </svg>

            <div className="relative aspect-[1.54] w-full">
              <div className="absolute bottom-0 left-[7%] right-0 top-[18%] overflow-hidden rounded-[24px] bg-[#A4D5F3] sm:rounded-[30px]">
                <img src={classroom} alt="مساحة تعلم حديثة مع كتب وحاسوب لممارسة الإنجليزية" width={1672} height={941} fetchPriority="high" className="h-full w-full object-cover" />
              </div>

              <img src={heroAvatar} alt="المعلم الذكي زيد يرحب بك ويشير إلى تجربة التعلم" width={555} height={993} fetchPriority="high" className="pointer-events-none absolute bottom-0 left-[1%] z-10 h-[100%] w-[43%] select-none object-contain object-bottom" />

              <div aria-hidden="true" dir="rtl" className="absolute left-0 top-[22%] z-20 -rotate-[18deg] rounded-[6px] bg-[#A4CDFC] px-3 py-2 text-center text-[13px] font-bold leading-[1.4] text-[#172D43] sm:text-[16px]">
                جاهـز<br />نـبـدأ
              </div>

              <a href="#zayd-demo" aria-label="شاهد العرض التعريفي لزيد" className="group absolute left-[62%] top-[59%] z-20 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-[0_6px_24px_rgba(25,85,140,0.12)] transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#50CFC4] focus-visible:ring-offset-4 sm:h-[68px] sm:w-[68px]">
                <Play aria-hidden="true" className="ml-1 h-7 w-7 fill-[#50CFC4] text-[#50CFC4] sm:h-8 sm:w-8" strokeWidth={1.5} />
              </a>
            </div>
          </div>
        </div>

        <div className="relative z-10 mt-12 grid grid-cols-1 gap-4 min-[560px]:grid-cols-3 min-[820px]:mt-16 min-[820px]:gap-8">
          {stats.map((stat) => (
            <div key={stat.value} className="flex min-h-[112px] items-center justify-center gap-5 rounded-[18px] bg-[#347FE2] px-5 py-4 text-white min-[560px]:gap-3 min-[560px]:px-4 lg:min-h-[124px] lg:gap-6">
              <img src={stat.image} alt="" width={84} height={84} className="h-[76px] w-[76px] shrink-0 object-contain min-[560px]:h-[60px] min-[560px]:w-[60px] lg:h-[84px] lg:w-[84px]" />
              <div className="text-center">
                <p dir={stat.direction} className="text-[42px] font-normal leading-[1.2] min-[560px]:text-[34px] lg:text-[48px]">{stat.value}</p>
                <p className="mt-1.5 text-[12px] leading-5 min-[560px]:text-[10px] lg:text-[12px]">{stat.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
