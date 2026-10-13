import { Button } from "@/components/ui/button";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import navLogoPng from "@/assets/zayd-logo.png";
import { useLanguage } from "@/components/language-provider";

const menuItems = [
  { name: { en: "Home", ar: "الرئيسية" }, href: "#home", isRoute: false },
  { name: { en: "Features", ar: "المميزات" }, href: "#features", isRoute: false },
  { name: { en: "Safety", ar: "الأمان" }, href: "#safety", isRoute: false },
  { name: { en: "Pricing", ar: "الأسعار" }, href: "#pricing", isRoute: false },
  { name: { en: "Contact Us", ar: "اتصل بنا" }, href: "/chinese/contact-us", isRoute: true },
];

export default function ChineseNavbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("home");
  const { language, setLanguage } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const isAr = language === "ar";

  const isChinesePath = location.pathname === "/chinese";

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const scrollToSection = (href: string, isRoute: boolean = false) => {
    if (isRoute) {
      navigate(href);
      setIsMobileMenuOpen(false);
      return;
    }
    if (href === "#home") {
      if (!isChinesePath) {
        navigate("/chinese");
        setTimeout(() => {
          window.scrollTo({
            top: 0,
            behavior: "smooth",
          });
        }, 100);
      } else {
        window.scrollTo({
          top: 0,
          behavior: "smooth",
        });
      }
    } else {
      if (!isChinesePath) {
        navigate("/chinese");
        setTimeout(() => {
          const element = document.querySelector(href);
          if (element) {
            element.scrollIntoView({
              behavior: "smooth",
              block: "start",
            });
          }
        }, 100);
      } else {
        const element = document.querySelector(href);
        if (element) {
          element.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }
      }
    }
    setIsMobileMenuOpen(false);
  };

  useEffect(() => {
    if (!isChinesePath) {
      return;
    }

    const handleScroll = () => {
      const sections = menuItems
        .filter((item) => !item.isRoute)
        .map((item) => item.href.substring(1));
      const scrollPosition = window.scrollY + 100;

      for (let i = sections.length - 1; i >= 0; i--) {
        const section = document.getElementById(sections[i]);
        if (section && section.offsetTop <= scrollPosition) {
          setActiveSection(sections[i]);
          break;
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, [isChinesePath]);

  return (
    <nav className={`w-full md:py-4 py-8 shadow-sm sticky top-0 bg-white z-[9999] ${isAr ? 'font-almarai' : 'font-nunito'}`} dir={isAr ? "rtl" : "ltr"}>
      <div className="flex items-center w-full px-4 relative">
        <div
          className="absolute left-4 md:relative md:left-auto w-20 h-8 md:w-28 md:h-12 flex items-center cursor-pointer z-10"
          dir="ltr"
          onClick={() => scrollToSection("#home")}
        >
          <img
            src={navLogoPng}
            alt="Zayd AI Logo"
            className="w-full h-full object-contain"
          />
        </div>

        {/* Mobile/Tablet language toggle centered between logo and menu */}
        <div className="lg:hidden absolute left-1/2 -translate-x-1/2">
          <button
            onClick={() => setLanguage(language === "ar" ? "en" : "ar")}
            className="text-sm text-gray-700 hover:text-[#35AB4E] transition-colors px-2 py-1"
          >
            العربية | English
          </button>
        </div>

        {/* Centered green background menu */}
        <ul className="hidden lg:flex gap-6 bg-[#E4F2E7] px-6 py-2 rounded-full text-gray-700 font-medium mx-auto whitespace-nowrap">
          {menuItems.map((item) => {
            const sectionId = item.href.substring(1);
            const isActive = item.isRoute 
              ? location.pathname === item.href
              : isChinesePath && activeSection === sectionId;
            
            const itemName = isAr ? item.name.ar : item.name.en;

            if (item.isRoute) {
              return (
                <li key={itemName} className="whitespace-nowrap">
                  <Link
                    to={item.href}
                    className={`cursor-pointer px-3 py-1 rounded-full transition-colors block whitespace-nowrap ${
                      isActive ? "bg-[#35AB4E] text-white" : "hover:text-[#35AB4E]"
                    }`}
                  >
                    {itemName}
                  </Link>
                </li>
              );
            }
            
            return (
              <li
                key={itemName}
                className={`cursor-pointer px-3 py-1 rounded-full transition-colors whitespace-nowrap ${
                  isActive ? "bg-[#35AB4E] text-white" : "hover:text-[#35AB4E]"
                }`}
                onClick={() => scrollToSection(item.href, item.isRoute)}
              >
                {itemName}
              </li>
            );
          })}
        </ul>

        {/* Desktop buttons - far right */}
        <div className="hidden lg:flex gap-2 items-center">
          <button
            onClick={() => setLanguage(language === "ar" ? "en" : "ar")}
            className="text-sm text-gray-700 hover:text-[#35AB4E] transition-colors px-2 py-1"
          >
            العربية | English
          </button>
          
          {/* Login Button - Outline Style */}
          <a href="https://nihao.waaha.ai/login">
            <Button
              className="bg-white text-[#4B5563] rounded-xl px-6 py-2 h-10 font-bold transition-all hover:bg-gray-50 hover:text-[#35AB4E] active:scale-95 flex items-center justify-center whitespace-nowrap"
              style={{
                border: "1px solid #D1D5DB",
                boxShadow: "0px 3px 0px #9CA3AF",
              }}
            >
              {isAr ? "تسجيل الدخول" : "Log In"}
            </Button>
          </a>

          {/* Register Button - Premium Green Style */}
          <a href="https://nihao.waaha.ai/register">
            <Button
              className="text-white text-sm font-bold rounded-xl flex items-center justify-center transition-all hover:brightness-110 active:scale-95 px-6 h-10 whitespace-nowrap"
              style={{
                background: "#35AB4E",
                boxShadow: "0px 3px 0px #20672F",
                border: "none",
              }}
            >
              {isAr ? "ابدأ الآن" : "Sign Up"}
            </Button>
          </a>
        </div>

        {/* Mobile/Tablet hamburger menu button */}
        <button
          className="lg:hidden flex flex-col justify-center items-center w-8 h-8 space-y-1 shrink-0 absolute right-4"
          onClick={toggleMobileMenu}
          aria-label="Toggle mobile menu"
        >
          <span
            className={`block w-6 h-0.5 bg-gray-700 transition-all duration-300 ${
              isMobileMenuOpen ? "rotate-45 translate-y-1.5" : ""
            }`}
          />
          <span
            className={`block w-6 h-0.5 bg-gray-700 transition-all duration-300 ${
              isMobileMenuOpen ? "opacity-0" : ""
            }`}
          />
          <span
            className={`block w-6 h-0.5 bg-gray-700 transition-all duration-300 ${
              isMobileMenuOpen ? "-rotate-45 -translate-y-1.5" : ""
            }`}
          />
        </button>
      </div>

      {/* Mobile/Tablet menu overlay */}
      <div
        className={`lg:hidden fixed inset-0 z-50 bg-white transition-all duration-300 ease-in-out ${
          isMobileMenuOpen ? "opacity-100 visible" : "opacity-0 invisible"
        }`}
      >
        <div
          className={`flex flex-col h-full transition-transform duration-300 ease-in-out ${
            isMobileMenuOpen ? "translate-y-0" : "translate-y-full"
          }`}
        >
          {/* Mobile header with logo and close button */}
          <div className="flex justify-between items-center p-4 border-b relative">
            <div
              className="w-20 h-8 md:w-28 md:h-12 flex items-center cursor-pointer"
              dir="ltr"
              onClick={() => scrollToSection("#home")}
            >
              <img
                src={navLogoPng}
                alt="Zayd AI Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <button
              onClick={toggleMobileMenu}
              className="w-8 h-8 flex items-center justify-center"
              aria-label="Close mobile menu"
            >
              <span className="text-2xl">&times;</span>
            </button>
          </div>

          {/* Mobile navigation items */}
          <div className="flex-1 flex flex-col justify-center items-center space-y-6 py-8">
            {menuItems.map((item, index) => {
              const sectionId = item.href.substring(1);
              const isActive = item.isRoute 
                ? location.pathname === item.href
                : isChinesePath && activeSection === sectionId;
              
              const itemName = isAr ? item.name.ar : item.name.en;

              if (item.isRoute) {
                return (
                  <Link
                    key={itemName}
                    to={item.href}
                    className={`text-xl font-medium transition-all duration-300 ${
                      isActive
                        ? "text-[#35AB4E]"
                        : "text-gray-700 hover:text-[#35AB4E]"
                    } ${
                      isMobileMenuOpen
                        ? "opacity-100 translate-y-0"
                        : "opacity-0 translate-y-4"
                    }`}
                    style={{
                      transitionDelay: isMobileMenuOpen
                        ? `${index * 100}ms`
                        : "0ms",
                    }}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {itemName}
                  </Link>
                );
              }
              
              return (
                <button
                  key={itemName}
                  className={`text-xl font-medium transition-all duration-300 ${
                    isActive
                      ? "text-[#35AB4E]"
                      : "text-gray-700 hover:text-[#35AB4E]"
                  } ${
                    isMobileMenuOpen
                      ? "opacity-100 translate-y-0"
                      : "opacity-0 translate-y-4"
                  }`}
                  style={{
                    transitionDelay: isMobileMenuOpen
                      ? `${index * 100}ms`
                      : "0ms",
                  }}
                  onClick={() => scrollToSection(item.href, item.isRoute)}
                >
                  {itemName}
                </button>
              );
            })}
          </div>

          {/* Mobile/Tablet buttons */}
          <div
            className={`flex flex-col gap-3 p-6 border-t transition-all duration-300 ${
              isMobileMenuOpen
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-4"
            }`}
            style={{
              transitionDelay: isMobileMenuOpen ? "400ms" : "0ms",
            }}
          >
            <button
              onClick={() => {
                setLanguage(language === "ar" ? "en" : "ar");
                setIsMobileMenuOpen(false);
              }}
              className="text-sm text-gray-700 hover:text-[#35AB4E] transition-colors px-2 py-1 text-center"
            >
              العربية | English
            </button>
            
            <div className="flex flex-col gap-3">
              {/* Login Button - Mobile */}
              <a href="https://nihao.waaha.ai/login" className="w-full">
                <Button
                  className="bg-white text-[#4B5563] rounded-xl py-6 font-extrabold transition-all hover:bg-gray-50 hover:text-[#35AB4E] active:scale-95 w-full flex items-center justify-center"
                  style={{
                    border: "1px solid #D1D5DB",
                    boxShadow: "0px 3px 0px #9CA3AF",
                  }}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {isAr ? "تسجيل الدخول" : "Log In"}
                </Button>
              </a>

              {/* Register Button - Mobile */}
              <a href="https://nihao.waaha.ai/register" className="w-full">
                <Button
                  className="text-white rounded-xl py-6 font-extrabold transition-all hover:brightness-110 active:scale-95 w-full flex items-center justify-center"
                  style={{
                    background: "#35AB4E",
                    boxShadow: "0px 3px 0px #20672F",
                    border: "none",
                  }}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {isAr ? "ابدأ الآن" : "Sign Up"}
                </Button>
              </a>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
