import { useState } from "react";
import { ArrowLeft, Building2, Menu, X } from "lucide-react";
import navLogoPng from "@/assets/landing-page/logo.png";

interface NavItem {
  name: string;
  href: string;
}

const navItems: NavItem[] = [
  { name: "الرئيسية", href: "#home" },
  { name: "المنهج", href: "#curriculum" },
  { name: "الحياة اليومية", href: "#life" },
  { name: "للمدارس", href: "#schools" },
  { name: "الأسئلة الشائعة", href: "#faq" },
  { name: "الأسعار", href: "#pricing" },
];

export default function Navbar() {
  const [activeItem, setActiveItem] = useState("الرئيسية");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleScroll = (href: string, name: string) => {
    setActiveItem(name);
    setMobileMenuOpen(false);
    if (href === "#home") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    const target = document.querySelector(href);
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <header className="sticky top-4 z-50 w-full px-4 md:px-6 flex justify-center font-ibm-plex" dir="rtl">
      {/* Main Glassmorphic Container */}
      <div className="w-full max-w-[1180px] h-[70px] bg-[rgba(255,255,255,0.84)] border border-[rgba(198,224,244,0.8)] shadow-[0px_12px_35px_rgba(10,72,126,0.1),inset_0px_1px_0px_#FFFFFF] backdrop-blur-[20px] rounded-[20px] px-3 md:px-[12px] flex items-center justify-between transition-all">
        {/* Brand / Logo Area */}
        <a
          href="#home"
          onClick={(e) => {
            e.preventDefault();
            handleScroll("#home", "الرئيسية");
          }}
          className="flex items-center gap-[10px] pl-[16px] md:pl-[19px] border-l border-[#DCE9F4] select-none cursor-pointer"
        >
          <img
            src={navLogoPng}
            alt="شعار زيـــد"
            className="w-[46px] h-[42px] md:w-[52px] md:h-[48px] object-contain"
          />
        </a>

        {/* Desktop Navigation Links */}
        <nav
          aria-label="التنقل الرئيسي"
          className="hidden lg:flex items-center bg-[#F5F9FC] rounded-[13px] p-[5px] gap-[3px]"
        >
          {navItems.map((item) => {
            const isActive = activeItem === item.name;
            return (
              <a
                key={item.name}
                href={item.href}
                onClick={(e) => {
                  e.preventDefault();
                  handleScroll(item.href, item.name);
                }}
                className={`relative px-[13px] py-[10px] text-[13px] leading-[20px] font-medium rounded-[9px] transition-all cursor-pointer ${
                  isActive
                    ? "bg-white text-[#0862C1] shadow-[0px_4px_14px_rgba(18,91,154,0.1)] font-semibold"
                    : "text-[#496176] hover:text-[#0862C1] hover:bg-white/50"
                }`}
              >
                {item.name}
                {isActive && (
                  <span className="absolute bottom-[3px] left-1/2 -translate-x-1/2 w-[4px] h-[4px] bg-[#48D3BF] rounded-full" />
                )}
              </a>
            );
          })}
        </nav>

        {/* CTA Actions */}
        <div className="hidden sm:flex items-center gap-2">
          {/* Schools Link */}
          <a
            href="#schools"
            onClick={(e) => {
              e.preventDefault();
              handleScroll("#schools", "للمدارس");
            }}
            className="h-[43px] px-[13px] bg-[rgba(244,250,255,0.8)] hover:bg-[#EBF4FC] border border-[#D4E5F2] rounded-[12px] text-[#0862C1] text-[13px] font-bold flex items-center gap-[7px] transition-all cursor-pointer"
          >
            <Building2 className="w-[17px] h-[17px] text-[#0862C1]" />
            <span>للمدارس</span>
          </a>

          {/* Primary CTA */}
          <a
            href="/auth/register"
            className="h-[48px] px-5 bg-gradient-to-r from-[#2681E9] to-[#0862C1] hover:from-[#1F73D4] hover:to-[#0753A6] shadow-[0px_10px_26px_rgba(38,129,233,0.22)] rounded-[13px] text-white text-[14px] font-bold flex items-center gap-[7px] transition-all transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            <span>جرّب زيــــد</span>
            <ArrowLeft className="w-[18px] h-[18px]" />
          </a>
        </div>

        {/* Mobile Hamburger Toggle */}
        <div className="flex items-center gap-2 lg:hidden">
          <a
            href="/auth/register"
            className="sm:hidden h-[40px] px-3 bg-gradient-to-r from-[#2681E9] to-[#0862C1] shadow-sm rounded-[10px] text-white text-[13px] font-bold flex items-center gap-1"
          >
            <span>جرّب</span>
            <ArrowLeft className="w-3.5 h-3.5" />
          </a>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? "إغلاق القائمة" : "فتح القائمة"}
            className="w-10 h-10 flex items-center justify-center rounded-[12px] bg-[#F5F9FC] text-[#07294D] hover:bg-[#EAF2F9] transition-colors"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="absolute top-[82px] left-4 right-4 bg-white/95 backdrop-blur-xl border border-[#DCE9F4] rounded-[20px] shadow-2xl p-5 flex flex-col gap-3 lg:hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          <nav className="flex flex-col gap-1">
            {navItems.map((item) => {
              const isActive = activeItem === item.name;
              return (
                <button
                  key={item.name}
                  onClick={() => handleScroll(item.href, item.name)}
                  className={`flex items-center justify-between px-4 py-3 rounded-[12px] text-[14px] font-medium transition-all text-right ${
                    isActive
                      ? "bg-[#F5F9FC] text-[#0862C1] font-bold"
                      : "text-[#496176] hover:bg-[#F9FBFC]"
                  }`}
                >
                  <span>{item.name}</span>
                  {isActive && <span className="w-2 h-2 rounded-full bg-[#48D3BF]" />}
                </button>
              );
            })}
          </nav>
          <div className="pt-3 border-t border-[#EEF4F9] flex flex-col gap-2">
            <button
              onClick={() => handleScroll("#schools", "للمدارس")}
              className="h-[44px] w-full bg-[#F5F9FC] border border-[#D4E5F2] rounded-[12px] text-[#0862C1] text-[14px] font-bold flex items-center justify-center gap-2"
            >
              <Building2 className="w-[18px] h-[18px]" />
              <span>للمدارس والشركاء</span>
            </button>
            <a
              href="/auth/register"
              className="h-[48px] w-full bg-gradient-to-r from-[#2681E9] to-[#0862C1] rounded-[13px] text-white text-[14px] font-bold flex items-center justify-center gap-2 shadow-[0px_10px_26px_rgba(38,129,233,0.22)]"
            >
              <span>جرّب زيــــد الآن</span>
              <ArrowLeft className="w-4 h-4" />
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
