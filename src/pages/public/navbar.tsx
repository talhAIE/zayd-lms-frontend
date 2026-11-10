import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { Link } from "react-router-dom";
import navLogoPng from "@/assets/landing-page/logo.png";

const navItems = [
  { name: "الرئيسية", href: "#home" },
  { name: "المنهج", href: "#curriculum" },
  { name: "الحياة اليومية", href: "#life" },
  { name: "للمدارس", href: "#schools" },
  { name: "الأسئلة الشائعة", href: "#faq" },
];

const focusStyle = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2681E9] focus-visible:ring-offset-4 focus-visible:ring-offset-[#EFF5FF]";

export default function Navbar() {
  const [activeItem, setActiveItem] = useState("الرئيسية");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileMenuOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [mobileMenuOpen]);

  const handleScroll = (href: string, name: string) => {
    setActiveItem(name);
    setMobileMenuOpen(false);
    const target = document.querySelector(href);
    const behavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ? "instant" : "smooth";
    if (href === "#home") {
      window.scrollTo({ top: 0, behavior });
    } else if (target) {
      window.scrollTo({
        top: target.getBoundingClientRect().top + window.scrollY - 86,
        behavior,
      });
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-[#EFF5FF] font-ibm-plex" dir="rtl">
      <div className="mx-auto flex h-[86px] w-full max-w-[1180px] items-center justify-between gap-5 px-6 max-[360px]:gap-2 max-[360px]:px-3 sm:px-[60px] lg:px-6">
        <a
          href="#home"
          onClick={(event) => {
            event.preventDefault();
            handleScroll("#home", "الرئيسية");
          }}
          className={`shrink-0 rounded-sm ${focusStyle}`}
        >
          <img src={navLogoPng} alt="زيد — الرئيسية" className="h-[56px] w-[45px] object-contain" />
        </a>

        <nav aria-label="التنقل الرئيسي" className="hidden items-center gap-6 min-[820px]:flex">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              aria-current={activeItem === item.name ? "location" : undefined}
              onClick={(event) => {
                event.preventDefault();
                handleScroll(item.href, item.name);
              }}
              className={`whitespace-nowrap rounded-sm py-2 text-[13px] leading-5 transition-colors ${focusStyle} ${
                activeItem === item.name
                  ? "font-bold text-[#5999ED]"
                  : "font-medium text-[#414141] hover:text-[#5999ED]"
              }`}
            >
              {item.name}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-1">
          <a
            href="#pricing"
            onClick={(event) => {
              event.preventDefault();
              handleScroll("#pricing", "الأسعار");
            }}
            className={`inline-flex h-[30px] min-w-[68px] items-center justify-center rounded-full bg-[#50CFC4] px-4 text-[12px] font-medium text-white transition-colors hover:bg-[#38BEB3] ${focusStyle}`}
          >
            الأسعار
          </a>
          <Link
            to="/login"
            className={`inline-flex h-[30px] min-w-[96px] items-center justify-center rounded-full bg-[#5999ED] px-5 text-[12px] font-bold text-white transition-colors hover:bg-[#4085DD] ${focusStyle}`}
          >
            جرب زيـــد
          </Link>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? "إغلاق القائمة" : "فتح القائمة"}
            aria-expanded={mobileMenuOpen}
            aria-controls="landing-mobile-navigation"
            className={`mr-2 flex h-9 w-9 items-center justify-center rounded-full text-[#414141] hover:bg-[#DFEAFC] min-[820px]:hidden ${focusStyle}`}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <nav
          id="landing-mobile-navigation"
          aria-label="التنقل على الهاتف"
          className="absolute inset-x-0 top-full flex flex-col gap-1 border-t border-[#DFEAFC] bg-[#EFF5FF] px-6 py-4 shadow-sm min-[820px]:hidden"
        >
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              aria-current={activeItem === item.name ? "location" : undefined}
              onClick={(event) => {
                event.preventDefault();
                handleScroll(item.href, item.name);
              }}
              className={`rounded-lg px-3 py-3 text-[14px] ${focusStyle} ${
                activeItem === item.name ? "font-bold text-[#5999ED]" : "text-[#414141] hover:bg-[#DFEAFC]"
              }`}
            >
              {item.name}
            </a>
          ))}
        </nav>
      )}
    </header>
  );
}
