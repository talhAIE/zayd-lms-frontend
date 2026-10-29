import { BookOpen } from "lucide-react";

interface SkillPill {
  name: string;
  left: string;
  top: string;
  width: string;
}

const desktopPills: SkillPill[] = [
  { name: "الاستماع والمناقشة", left: "236.15px", top: "12.9px", width: "131px" },
  { name: "التحدث عن الذات", left: "456.78px", top: "25.8px", width: "125px" },
  { name: "الكتابة", left: "564.19px", top: "172px", width: "64px" },
  { name: "القراءة", left: "505.96px", top: "326px", width: "64px" },
  { name: "الصيغة والمعنى والاستخدام", left: "153.18px", top: "364.7px", width: "173px" },
  { name: "المحادثة", left: "76.59px", top: "235.7px", width: "75px" },
  { name: "القواعد", left: "0px", top: "180.59px", width: "68px" },
  { name: "الاستماع", left: "44.67px", top: "51.59px", width: "76px" },
];

export default function CurriculumSection() {
  return (
    <section
      id="curriculum"
      className="py-20 md:py-28 bg-gradient-to-br from-[#0862C1] to-[#2B91EC] text-white font-ibm-plex overflow-hidden"
      dir="rtl"
    >
      <div className="max-w-[1180px] mx-auto px-4 md:px-6">
        {/* ======================================================== */}
        {/* DESKTOP LAYOUT (lg & above): Exact Figma 1180px Canvas   */}
        {/* ======================================================== */}
        <div className="hidden lg:block relative w-[1180px] h-[430px] mx-auto scale-[0.84] xl:scale-100 origin-center">
          {/* Text Block - Right Side (x: 708px to 1180px) */}
          <div
            style={{ left: "708.25px", top: "68.1px", width: "471.75px" }}
            className="absolute flex flex-col items-start text-right z-10"
            dir="rtl"
          >
            {/* Eyebrow */}
            <div className="inline-flex items-center gap-3">
              <span className="w-6 h-[1.5px] bg-[#48D3BF]" />
              <span className="text-[#8EF0DC] text-[13px] font-bold tracking-wide">
                متوافق بالكامل مع المنهج
              </span>
              <span className="w-6 h-[1.5px] bg-[#48D3BF]" />
            </div>

            {/* Heading */}
            <h2 className="mt-4 text-[42px] xl:text-[49px] font-bold text-white tracking-tight leading-[1.25]">
              مـــن الأول المتوســـط <br />
              إلــــى الثالــــــث الثانـوي
            </h2>

            {/* Description */}
            <p className="mt-5 text-[16px] leading-[1.9] text-white/80 max-w-[490px]">
              لا يحتاج الطالب إلى منهج جديد. زيــــد يحوّل ما يدرسه بالفعل إلى تجربة ممارسة شخصية
              وتفاعلية تساعده على استخدام اللغة، لا مجرد معرفتها.
            </p>

            {/* Subtext Punchline */}
            <div className="mt-6 text-[18px] xl:text-[20px] font-bold text-white">
              <span>يتعلمهـا فـي المنهـج… ويمارسهـا مـع زيــــد.</span>
            </div>
          </div>

          {/* Central Glassmorphic Hub - Left Side (Center at x: 319px, y: 215px) */}
          <div
            style={{
              left: "241.62px",
              top: "137.5px",
              width: "155px",
              height: "155px",
            }}
            className="absolute rounded-full bg-white/[0.14] border border-white/30 backdrop-blur-[10px] shadow-[0px_25px_55px_rgba(4,53,101,0.25),inset_0px_0px_0px_13px_rgba(255,255,255,0.06)] flex flex-col items-center justify-center text-center p-3 z-10 select-none"
          >
            <BookOpen className="w-8 h-8 text-white mb-1.5 stroke-[1.8]" />
            <span className="text-[16px] font-bold text-white leading-tight">منهجك</span>
            <span className="text-[12px] text-white/70 font-medium mt-0.5">
              يتحوّل إلى ممارسة
            </span>
          </div>

          {/* 8 Orbiting Frosted Glass Skill Pills - Left Side (x: 0px to 628px) */}
          {desktopPills.map((pill) => (
            <div
              key={pill.name}
              style={{
                left: pill.left,
                top: pill.top,
                width: pill.width,
                height: "40px",
              }}
              className="absolute bg-white/10 hover:bg-white/20 border border-white/25 backdrop-blur-[6px] rounded-full text-white text-[13px] font-medium flex items-center justify-center shadow-sm select-none transition-all hover:scale-105 cursor-default"
            >
              <span>{pill.name}</span>
            </div>
          ))}
        </div>

        {/* ======================================================== */}
        {/* MOBILE & TABLET LAYOUT (< lg): Vertically Stacked       */}
        {/* ======================================================== */}
        <div className="flex flex-col items-center gap-10 lg:hidden">
          {/* Top: Text Block */}
          <div className="flex flex-col items-center text-center max-w-[540px]">
            {/* Eyebrow */}
            <div className="inline-flex items-center gap-3">
              <span className="w-6 h-[1.5px] bg-[#48D3BF]" />
              <span className="text-[#8EF0DC] text-[13px] font-bold tracking-wide">
                متوافق بالكامل مع المنهج
              </span>
              <span className="w-6 h-[1.5px] bg-[#48D3BF]" />
            </div>

            {/* Heading */}
            <h2 className="mt-4 text-[30px] sm:text-[38px] font-bold text-white tracking-tight leading-[1.25]">
              مـــن الأول المتوســـط <br />
              إلــــى الثالــــــث الثانـوي
            </h2>

            {/* Description */}
            <p className="mt-4 text-[15px] sm:text-[16px] leading-[1.8] text-white/80">
              لا يحتاج الطالب إلى منهج جديد. زيــــد يحوّل ما يدرسه بالفعل إلى تجربة ممارسة شخصية
              وتفاعلية تساعده على استخدام اللغة، لا مجرد معرفتها.
            </p>

            {/* Subtext Punchline */}
            <div className="mt-5 text-[17px] sm:text-[19px] font-bold text-white">
              <span>يتعلمهـا فـي المنهـج… ويمارسهـا مـع زيــــد.</span>
            </div>
          </div>

          {/* Bottom: Orbiting Constellation (Centered & Scaled, Zero Overlap) */}
          <div className="w-full flex justify-center items-center overflow-hidden h-[300px] xs:h-[340px] sm:h-[390px]">
            <div className="w-[638px] h-[430px] relative scale-[0.6] xs:scale-[0.68] sm:scale-[0.82] origin-center flex-shrink-0">
              {/* Central Glassmorphic Hub */}
              <div
                style={{
                  left: "241.62px",
                  top: "137.5px",
                  width: "155px",
                  height: "155px",
                }}
                className="absolute rounded-full bg-white/[0.14] border border-white/30 backdrop-blur-[10px] shadow-[0px_25px_55px_rgba(4,53,101,0.25),inset_0px_0px_0px_13px_rgba(255,255,255,0.06)] flex flex-col items-center justify-center text-center p-3 z-10 select-none"
              >
                <BookOpen className="w-8 h-8 text-white mb-1.5 stroke-[1.8]" />
                <span className="text-[16px] font-bold text-white leading-tight">منهجك</span>
                <span className="text-[12px] text-white/70 font-medium mt-0.5">
                  يتحوّل إلى ممارسة
                </span>
              </div>

              {/* 8 Orbiting Frosted Glass Skill Pills */}
              {desktopPills.map((pill) => (
                <div
                  key={pill.name}
                  style={{
                    left: pill.left,
                    top: pill.top,
                    width: pill.width,
                    height: "40px",
                  }}
                  className="absolute bg-white/10 hover:bg-white/20 border border-white/25 backdrop-blur-[6px] rounded-full text-white text-[13px] font-medium flex items-center justify-center shadow-sm select-none"
                >
                  <span>{pill.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
