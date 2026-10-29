import { ArrowLeft, MessageCircle, Compass, Utensils, GraduationCap, ShoppingBag, Users, Plane } from "lucide-react";

export default function ZaydLifeSection() {
  return (
    <section id="life" className="py-20 md:py-28 bg-gradient-to-b from-[#F9FCFE] to-[#F4F9FC] font-ibm-plex overflow-hidden relative" dir="rtl">
      {/* Decorative Watermark Orb */}
      <div className="absolute top-1/2 -left-20 w-[440px] h-[440px] bg-[#48D3BF]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-[1180px] mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Right Column: Copy & Actions */}
          <div className="lg:col-span-5 flex flex-col items-start z-10 relative">
            {/* Watermark Word */}
            <span className="absolute -top-10 right-0 text-[80px] md:text-[100px] font-bold text-[#2681E9]/[0.05] tracking-widest select-none pointer-events-none">
              LIFE
            </span>

            {/* Eyebrow */}
            <div className="inline-flex items-center gap-3">
              <span className="w-6 h-[1.5px] bg-[#48D3BF]" />
              <span className="text-[#2681E9] text-[13px] sm:text-[14px] font-bold tracking-wide">
                من المنهج إلى الحياة
              </span>
              <span className="w-6 h-[1.5px] bg-[#48D3BF]" />
            </div>

            {/* Heading */}
            <h2 className="mt-4 text-[32px] sm:text-[42px] lg:text-[49px] font-bold text-[#07294D] tracking-tight leading-[1.25]">
              الإنجليزية لا تنتهي عند حدود الكتاب
            </h2>

            {/* Description */}
            <p className="mt-4 text-[15px] sm:text-[16px] leading-[1.8] text-[#60768B]">
              في Zayd Life وZayd Plus، يستطيع الطالب التدريب على أكثر من 40 موضوعًا وموقفًا من الحياة
              اليومية، ليستخدم اللغة عندما يحتاج إليها فعلًا في السفر والمواقف الاجتماعية.
            </p>

            {/* Feature Mini Card */}
            <div className="mt-6 w-full p-3.5 rounded-[14px] bg-white/80 border border-[#D9EBF7] shadow-sm flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-[10px] bg-[#EEF7FF] flex items-center justify-center text-[#2681E9] flex-shrink-0">
                <MessageCircle className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-[13px] font-bold text-[#07294D]">
                  محادثات تشبه الحياة الحقيقية
                </span>
                <span className="text-[11px] text-[#60768B] mt-0.5">
                  مواقف يومية بلغة مفيدة تستطيع استخدامها فورًا.
                </span>
              </div>
            </div>

            {/* Punchline */}
            <p className="mt-6 text-[17px] font-bold text-[#07294D]">
              لأن الهدف ليس فقط أن يعرف الإنجليزية…{" "}
              <span className="text-[#2681E9]">بل أن يستخدمها.</span>
            </p>

            {/* CTA */}
            <a
              href="#pricing"
              className="mt-7 h-[46px] px-6 bg-gradient-to-r from-[#2681E9] to-[#0862C1] hover:from-[#1F73D4] hover:to-[#0753A6] shadow-[0px_10px_26px_rgba(38,129,233,0.22)] rounded-[11px] text-white text-[14px] font-bold inline-flex items-center gap-2 transition-all transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              <span>اكتشف Zayd Life</span>
              <ArrowLeft className="w-4 h-4" />
            </a>
          </div>

          {/* Left Column: Mosaic Interactive Cards */}
          <div className="lg:col-span-7 bg-white/85 backdrop-blur-md border border-[#DCEBF5] shadow-[0px_25px_65px_rgba(12,74,126,0.11)] rounded-[27px] p-5 sm:p-7">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              {/* Featured Large Card */}
              <div className="sm:col-span-2 relative min-h-[160px] sm:min-h-[190px] rounded-[17px] bg-gradient-to-br from-[#062444] to-[#0D4175] p-5 flex flex-col justify-end text-white overflow-hidden shadow-sm group cursor-pointer hover:shadow-md transition-all">
                <div className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-[#48D3BF]">
                  <Plane className="w-5 h-5" />
                </div>
                <div className="z-10">
                  <h3 className="text-[18px] sm:text-[20px] font-bold text-white mb-1">
                    في المطار
                  </h3>
                  <p className="text-[12px] text-white/75">
                    السؤال عن الرحلات وإنهاء إجراءات السفر بثقة.
                  </p>
                </div>
              </div>

              {/* Card 2: Travel */}
              <div className="relative min-h-[100px] sm:min-h-[120px] rounded-[17px] bg-gradient-to-br from-[#09355E] to-[#125899] p-4 flex flex-col justify-end text-white group cursor-pointer hover:scale-[1.02] transition-all">
                <Compass className="w-5 h-5 text-[#8EF0DC] mb-2" />
                <span className="text-[14px] font-bold">أثناء السفر</span>
              </div>

              {/* Card 3: Restaurant */}
              <div className="relative min-h-[100px] sm:min-h-[120px] rounded-[17px] bg-gradient-to-br from-[#0B3A68] to-[#1660A6] p-4 flex flex-col justify-end text-white group cursor-pointer hover:scale-[1.02] transition-all">
                <Utensils className="w-5 h-5 text-[#8EF0DC] mb-2" />
                <span className="text-[14px] font-bold">في المطعم</span>
              </div>

              {/* Card 4: Study */}
              <div className="relative min-h-[100px] sm:min-h-[120px] rounded-[17px] bg-gradient-to-br from-[#07294D] to-[#0E4982] p-4 flex flex-col justify-end text-white group cursor-pointer hover:scale-[1.02] transition-all">
                <GraduationCap className="w-5 h-5 text-[#8EF0DC] mb-2" />
                <span className="text-[14px] font-bold">الدراسة والتعلّم</span>
              </div>

              {/* Card 5: Shopping */}
              <div className="relative min-h-[100px] sm:min-h-[120px] rounded-[17px] bg-gradient-to-br from-[#0A335C] to-[#135491] p-4 flex flex-col justify-end text-white group cursor-pointer hover:scale-[1.02] transition-all">
                <ShoppingBag className="w-5 h-5 text-[#8EF0DC] mb-2" />
                <span className="text-[14px] font-bold">في السوق</span>
              </div>

              {/* Card 6: Social Situations (Span full width on mobile or bottom card) */}
              <div className="sm:col-span-3 relative min-h-[90px] rounded-[17px] bg-gradient-to-r from-[#07294D] via-[#0E4780] to-[#1663AB] p-4 flex items-center justify-between text-white group cursor-pointer hover:scale-[1.01] transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-[#48D3BF]">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-[14px] font-bold text-white">مواقف اجتماعية</h4>
                    <p className="text-[11px] text-white/70">التعارف وتكوين الصداقات ومناقشة الهوايات</p>
                  </div>
                </div>
                <ArrowLeft className="w-4 h-4 text-white/70 group-hover:-translate-x-1 transition-transform" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
