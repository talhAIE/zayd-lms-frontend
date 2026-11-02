import { ArrowLeft, UserCheck, Users, Layers, Sparkles } from "lucide-react";
import schoolsGraphic from "@/assets/landing-page/section9.png";

export default function SchoolsSection() {
  return (
    <section id="schools" className="py-20 md:py-28 bg-white font-ibm-plex" dir="rtl">
      <div className="max-w-[1180px] mx-auto px-4 md:px-6">
        {/* Main Card Container */}
        <div className="rounded-[28px] md:rounded-[34px] bg-gradient-to-br from-[#EEF9FF] to-[#E8FBF6] border border-[#D4EEF7] p-8 md:p-14 shadow-[0px_20px_50px_rgba(15,80,140,0.08)] overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Right Column: Copy */}
            <div className="lg:col-span-7 flex flex-col items-start z-10">
              {/* Eyebrow */}
              <div className="inline-flex items-center gap-3">
                <span className="w-6 h-[1.5px] bg-[#48D3BF]" />
                <span className="text-[#2681E9] text-[13px] sm:text-[14px] font-bold tracking-wide">
                  زيــــد للمدارس والمجموعات
                </span>
                <span className="w-6 h-[1.5px] bg-[#48D3BF]" />
              </div>

              {/* Heading */}
              <h2 className="mt-4 text-[28px] sm:text-[36px] lg:text-[40px] font-bold text-[#07294D] tracking-tight leading-[1.25]">
                مدرستـــك تـدرّس الإنجليزيــــة… <br />
                <span className="text-[#2681E9]">زيــد يجعل كل طالب يمارسها.</span>
              </h2>

              {/* Description */}
              <p className="mt-4 text-[15px] sm:text-[16px] leading-[1.8] text-[#60768B] max-w-[560px]">
                لا تحتاج المدرسة إلى تغيير مقرراتها أو استبدال كادرها التعليمي المتميز. زيــــد يضيف طبقة
                متطورة من الممارسة الفردية والتقييم المستمر لما تقوم به المدرسة بالفعل في فصولها.
              </p>

              {/* Feature Pills */}
              <div className="mt-6 flex flex-wrap gap-2.5">
                <span className="px-3.5 py-1.5 rounded-[8px] bg-white/80 border border-[#C6E6EF] text-[#0862C1] text-[12px] sm:text-[13px] font-bold shadow-sm flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-[#2681E9]" />
                  أسعار خاصة حسب العدد
                </span>
                <span className="px-3.5 py-1.5 rounded-[8px] bg-white/80 border border-[#C6E6EF] text-[#0862C1] text-[12px] sm:text-[13px] font-bold shadow-sm flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-[#2681E9]" />
                  مجموعات وفصول طلابية
                </span>
                <span className="px-3.5 py-1.5 rounded-[8px] bg-white/80 border border-[#C6E6EF] text-[#0862C1] text-[12px] sm:text-[13px] font-bold shadow-sm flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#2681E9]" />
                  دعم للتطبيق داخل المدرسة
                </span>
              </div>

              {/* Free Teacher Account Benefit Card */}
              <div className="mt-6 w-full p-4 rounded-[12px] bg-white/90 border border-[#DCE9F4] shadow-sm flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-[10px] bg-[#EAFBF7] flex items-center justify-center text-[#097966] flex-shrink-0">
                  <UserCheck className="w-5 h-5" />
                </div>
                <p className="text-[14px] sm:text-[15px] text-[#07294D] font-medium">
                  يحصل معلمو المدارس المشاركة على{" "}
                  <span className="text-[#097966] font-bold">حساب خاص كامل الصلاحيات</span> دون أي تكلفة إضافية.
                </p>
              </div>

              {/* CTA Button */}
              <a
                href="/contact-us"
                className="mt-8 h-[48px] px-7 rounded-[11px] bg-gradient-to-r from-[#2681E9] to-[#0862C1] hover:from-[#1F73D4] hover:to-[#0753A6] shadow-[0px_10px_26px_rgba(38,129,233,0.22)] text-white text-[15px] font-bold inline-flex items-center gap-2 transition-all transform hover:scale-[1.02] cursor-pointer"
              >
                <span>اطلب عرض المدارس</span>
                <ArrowLeft className="w-4 h-4" />
              </a>
            </div>

            {/* Left Column: Visual Mockup with Teacher & Dashboard */}
            <div className="lg:col-span-5 flex justify-center items-center">
              <div className="relative w-full max-w-[450px] aspect-[4/3] flex items-center justify-center">
                <img
                  src={schoolsGraphic}
                  alt="لوحة تحكم المعلم وبوابة المدارس"
                  className="w-full h-full object-contain filter drop-shadow-[0_20px_45px_rgba(15,80,140,0.18)]"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
