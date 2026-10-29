import { ArrowLeft, ArrowUp, Mail, Phone, Globe, Sparkles } from "lucide-react";
import navLogoPng from "@/assets/images/landingpage/nav-logo.png";

export default function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="w-full bg-gradient-to-br from-[#061D36] via-[#082D52] to-[#073D62] text-white rounded-t-[36px] md:rounded-t-[48px] font-ibm-plex overflow-hidden relative" dir="rtl">
      {/* Background Ambient Glows */}
      <div className="absolute top-10 right-10 w-80 h-80 rounded-full bg-[#48D3BF]/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-96 h-96 rounded-full bg-[#2681E9]/15 blur-3xl pointer-events-none" />

      <div className="max-w-[1180px] mx-auto px-4 md:px-6 relative z-10">
        {/* Top Integrated CTA Strip */}
        <div className="py-12 md:py-16 border-b border-white/10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex flex-col items-center md:items-start text-center md:text-right">
            <div className="inline-flex items-center gap-2 mb-2 text-[#7CE7D4] text-[12px] font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>مستقبل تعلّم الإنجليزية يبدأ هنا</span>
            </div>
            <h2 className="text-[28px] sm:text-[36px] lg:text-[42px] font-bold text-white tracking-tight leading-tight">
              تعلّمها اليوم، واستخدمها مدى الحياة.
            </h2>
          </div>

          <a
            href="/auth/register"
            className="h-[52px] px-8 rounded-[12px] bg-white text-[#0862C1] hover:bg-white/95 text-[15px] font-bold shadow-xl flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02] flex-shrink-0 cursor-pointer"
          >
            <span>ابدأ تجربتك الآن</span>
            <ArrowLeft className="w-4 h-4" />
          </a>
        </div>

        {/* Middle Navigation Columns */}
        <div className="py-14 md:py-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-10">
          {/* Column 1: Brand Summary (lg:col-span-4) */}
          <div className="lg:col-span-4 flex flex-col items-start">
            <div className="flex items-center gap-3 p-2.5 rounded-[16px] bg-white/[0.07] border border-white/15">
              <img
                src={navLogoPng}
                alt="شعار زيد"
                className="w-10 h-10 object-contain"
              />
              <span className="font-bold text-[16px] tracking-wider text-white">ZAYD AI</span>
            </div>

            <p className="mt-5 text-[14px] leading-[1.8] text-white/70 max-w-[320px]">
              معلّم ذكي يحوّل مناهج اللغة الإنجليزية إلى ممارسة شخصية تفاعلية وممتعة لكل طالب لبناء
              الثقة والطلاقة.
            </p>

            <div className="mt-5 inline-flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-white/[0.06] border border-white/10 text-[11px] text-white/80">
              <span className="w-2 h-2 rounded-full bg-[#48D3BF] animate-pulse" />
              <span>نساعد أكثر من 1,000 طالب على التحدث بثقة</span>
            </div>
          </div>

          {/* Column 2: اكتشف زيــــد (lg:col-span-3) */}
          <div className="lg:col-span-3 flex flex-col items-start">
            <h3 className="text-[15px] font-bold text-white relative pb-2.5">
              اكتشف زيــــد
              <span className="absolute bottom-0 right-0 w-8 h-[2px] bg-gradient-to-l from-[#48D3BF] to-[#2681E9] rounded-full" />
            </h3>
            <ul className="mt-5 space-y-3 text-[13px] text-white/70">
              <li>
                <a href="#home" className="hover:text-white transition-colors flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full border border-[#48D3BF]" />
                  <span>لماذا زيــــد؟</span>
                </a>
              </li>
              <li>
                <a href="#curriculum" className="hover:text-white transition-colors flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full border border-[#48D3BF]" />
                  <span>المنهج الدراسي السعودي</span>
                </a>
              </li>
              <li>
                <a href="#life" className="hover:text-white transition-colors flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full border border-[#48D3BF]" />
                  <span>الحياة اليومية Zayd Life</span>
                </a>
              </li>
              <li>
                <a href="#pricing" className="hover:text-white transition-colors flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full border border-[#48D3BF]" />
                  <span>الباقات والأسعار</span>
                </a>
              </li>
            </ul>
          </div>

          {/* Column 3: للطلاب والمدارس (lg:col-span-2) */}
          <div className="lg:col-span-2 flex flex-col items-start">
            <h3 className="text-[15px] font-bold text-white relative pb-2.5">
              للطلاب والمدارس
              <span className="absolute bottom-0 right-0 w-8 h-[2px] bg-gradient-to-l from-[#48D3BF] to-[#2681E9] rounded-full" />
            </h3>
            <ul className="mt-5 space-y-3 text-[13px] text-white/70">
              <li>
                <a href="#schools" className="hover:text-white transition-colors flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full border border-[#48D3BF]" />
                  <span>زيــــد للمدارس</span>
                </a>
              </li>
              <li>
                <a href="#pricing" className="hover:text-white transition-colors flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full border border-[#48D3BF]" />
                  <span>Zayd Plus</span>
                </a>
              </li>
              <li>
                <a href="#pricing" className="hover:text-white transition-colors flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full border border-[#48D3BF]" />
                  <span>Zayd Life</span>
                </a>
              </li>
              <li>
                <a href="#faq" className="hover:text-white transition-colors flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full border border-[#48D3BF]" />
                  <span>الأسئلة الشائعة</span>
                </a>
              </li>
            </ul>
          </div>

          {/* Column 4: لنبقَ على تواصل (lg:col-span-3) */}
          <div className="lg:col-span-3 flex flex-col items-start">
            <h3 className="text-[15px] font-bold text-white relative pb-2.5">
              لنبقَ على تواصل
              <span className="absolute bottom-0 right-0 w-8 h-[2px] bg-gradient-to-l from-[#48D3BF] to-[#2681E9] rounded-full" />
            </h3>

            <div className="mt-5 space-y-3 w-full">
              {/* Email Card */}
              <a
                href="mailto:info@zayd.ai"
                className="p-3 rounded-[12px] bg-white/[0.045] hover:bg-white/[0.09] border border-white/10 flex items-center gap-3 transition-colors cursor-pointer"
              >
                <div className="w-8 h-8 rounded-[8px] bg-white/10 flex items-center justify-center text-[#48D3BF]">
                  <Mail className="w-4 h-4" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-white/60">البريد الإلكتروني</span>
                  <span className="text-[12px] font-bold text-white">info@zayd.ai</span>
                </div>
              </a>

              {/* Phone Card */}
              <a
                href="tel:+966500000000"
                className="p-3 rounded-[12px] bg-white/[0.045] hover:bg-white/[0.09] border border-white/10 flex items-center gap-3 transition-colors cursor-pointer"
              >
                <div className="w-8 h-8 rounded-[8px] bg-white/10 flex items-center justify-center text-[#48D3BF]">
                  <Phone className="w-4 h-4" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-white/60">اتصل بنا</span>
                  <span className="text-[12px] font-bold text-white" dir="ltr">+966 50 000 0000</span>
                </div>
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Sub-Bar */}
        <div className="py-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-[12px] text-white/65">
          <p>© 2026 Zayd AI. جميع الحقوق محفوظة.</p>

          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1.5 hover:text-white cursor-pointer transition-colors">
              <Globe className="w-3.5 h-3.5 text-[#48D3BF]" />
              العربية (المملكة العربية السعودية)
            </span>
            <a href="/privacy" className="hover:text-white transition-colors">
              سياسة الخصوصية
            </a>
            <a href="/terms" className="hover:text-white transition-colors">
              الشروط والأحكام
            </a>
          </div>

          {/* Back to Top */}
          <button
            onClick={scrollToTop}
            aria-label="العودة إلى الأعلى"
            className="w-10 h-10 rounded-[12px] bg-white/[0.08] hover:bg-white/[0.15] border border-white/15 flex items-center justify-center text-white transition-colors cursor-pointer"
          >
            <ArrowUp className="w-4 h-4" />
          </button>
        </div>
      </div>
    </footer>
  );
}
