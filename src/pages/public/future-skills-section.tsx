import { Sparkles } from "lucide-react";

const futureTags = [
  "الدراسة الجامعية",
  "المعرفة العالمية",
  "التواصل المهني",
  "سوق العمل",
  "أثناء السفر",
  "مواقف اجتماعية",
];

export default function FutureSkillsSection() {
  return (
    <section className="py-12 md:py-16 bg-[#F8FBFD] font-ibm-plex" dir="rtl">
      <div className="max-w-[1180px] mx-auto px-4 md:px-6">
        {/* Gradient Banner Container */}
        <div className="relative rounded-[28px] md:rounded-[32px] bg-gradient-to-r from-[#1685E5] via-[#2CB4D2] to-[#4BD1BE] p-8 md:p-14 shadow-[0px_25px_60px_rgba(23,132,210,0.2)] overflow-hidden text-white">
          {/* Ambient Lighting Orbs */}
          <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-white/10 blur-3xl pointer-events-none" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
            {/* Right Column: Copy */}
            <div className="lg:col-span-7 flex flex-col items-start">
              {/* Eyebrow */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md mb-4">
                <Sparkles className="w-3.5 h-3.5 text-[#8EF0DC]" />
                <span className="text-[#8EF0DC] text-[13px] font-bold">مهارة للمستقبل</span>
              </div>

              {/* Heading */}
              <h2 className="text-[28px] sm:text-[38px] lg:text-[42px] font-bold text-white tracking-tight leading-[1.25]">
                الإنجليزية ليست مادة دراسية فقط
              </h2>

              {/* Description */}
              <p className="mt-4 text-[15px] sm:text-[16px] leading-[1.8] text-white/85 max-w-[520px]">
                ما يتعلمه الطالب اليوم يمكن أن يفتح أمامه فرصًا أكبر غدًا في الدراسة الجامعية،
                والوصول إلى المعرفة العالمية، وبناء الثقة للتواصل في سوق العمل.
              </p>
            </div>

            {/* Left Column: Skill Category Pills */}
            <div className="lg:col-span-5 flex flex-wrap justify-center lg:justify-end gap-3">
              {futureTags.map((tag, index) => (
                <div
                  key={index}
                  className="px-4 py-2.5 rounded-full bg-white/15 hover:bg-white/25 border border-white/35 backdrop-blur-md text-[13px] sm:text-[14px] font-medium text-white shadow-sm transition-all hover:scale-105 select-none"
                >
                  {tag}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
