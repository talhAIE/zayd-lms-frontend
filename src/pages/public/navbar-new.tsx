import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import navLogoPng from "@/assets/zayd-logo.png";
import { useLanguage } from "@/components/language-provider";

const menuItems = [
  { name: { en: "Home", ar: "الرئيسية" }, href: "#home", isRoute: false },
  { name: { en: "Features", ar: "الميزات" }, href: "#features", isRoute: false },
  { name: { en: "Tutors", ar: "المدرسون" }, href: "#tutors", isRoute: false },
  { name: { en: "Challenge", ar: "التحدي" }, href: "#challenge", isRoute: false },
  { name: { en: "Compliance", ar: "الامتثال" }, href: "#compliance", isRoute: false },
  { name: { en: "Join Now", ar: "انضم الآن" }, href: "#join-now", isRoute: false },
  { name: { en: "Contact Us", ar: "اتصل بنا" }, href: "/contact-us", isRoute: true },
];

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("home");
  const { language, setLanguage } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const isAr = language === "ar";

  const isMainPath = location.pathname === "/" || location.pathname === "/chinese";

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
      if (!isMainPath) {
        navigate("/");
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
      if (!isMainPath) {
        navigate("/");
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
    if (!isMainPath) {
      return;
    }

    const sections = menuItems
      .filter((item) => !item.isRoute)
      .map((item) => item.href.substring(1));

    const observerOptions = {
      root: null,
      rootMargin: "-20% 0px -70% 0px", // Focus on the top-ish part of the screen
      threshold: 0,
    };

    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);

    sections.forEach((id) => {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, [isMainPath]);

  return (
    <nav className={`w-full h-16 sm:h-20 shadow-sm sticky top-0 bg-white z-[9999] flex items-center ${isAr ? 'font-almarai' : ''}`} dir={isAr ? "rtl" : "ltr"}>
      <div className="flex items-center justify-between w-full px-4 sm:px-6 relative">
        
        {/* Logo - Left aligned */}
        <div
          className="w-24 sm:w-32 lg:w-40 h-8 sm:h-10 lg:h-14 flex items-center shrink-0 cursor-pointer"
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
            className="text-sm text-gray-700 hover:text-[#058BF4] transition-colors px-2 py-1"
          >
            العربية | English
          </button>
        </div>

        {/* Desktop Menu - Responsive spacing */}
        <ul className="hidden lg:flex items-center gap-1 xl:gap-4 bg-[#E1EEFF] px-4 xl:px-6 py-2 rounded-full text-gray-700 font-medium text-sm xl:text-base">
          {menuItems.map((item) => {
            const sectionId = item.href.substring(1);
            const isActive = item.isRoute 
              ? location.pathname === item.href
              : isMainPath && activeSection === sectionId;
            
            const itemName = isAr ? item.name.ar : item.name.en;

            if (item.isRoute) {
              return (
                <li key={itemName}>
                  <Link
                    to={item.href}
                    className={`cursor-pointer px-2 xl:px-3 py-1 rounded-full transition-colors block whitespace-nowrap ${
                      isActive ? "bg-[#058BF4] text-white" : "hover:text-blue-800"
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
                className={`cursor-pointer px-2 xl:px-3 py-1 rounded-full transition-colors whitespace-nowrap ${
                  isActive ? "bg-[#058BF4] text-white" : "hover:text-blue-800"
                }`}
                onClick={() => scrollToSection(item.href, item.isRoute)}
              >
                {itemName}
              </li>
            );
          })}
        </ul>

        {/* Right Side - Actions & Mobile Toggle */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Desktop Auth Buttons */}
          <div className="hidden lg:flex gap-2 items-center">
            <button
              onClick={() => setLanguage(language === "ar" ? "en" : "ar")}
              className="text-sm text-gray-700 hover:text-[#058BF4] transition-colors px-2 py-1"
            >
              العربية | English
            </button>
            <Link to="/login">
              <Button
                variant="outline"
                className="rounded-full border-[#058BF4] text-[#058BF4] hover:text-[#058BF4]"
              >
                {isAr ? "تسجيل الدخول" : "Sign In"}
              </Button>
            </Link>
          </div>

          {/* Mobile/Tablet Controls (Toggle + Hamburger) */}
          <div className="lg:hidden flex items-center gap-1">
            {/* Minimal Mobile Toggle - Only text variant */}
            <button
              className="flex flex-col justify-center items-center w-8 h-8 space-y-1 shrink-0"
              onClick={toggleMobileMenu}
              aria-label="Toggle mobile menu"
            >
              <span
                className={`block w-5 h-0.5 bg-gray-700 transition-all duration-300 ${
                  isMobileMenuOpen ? "rotate-45 translate-y-1.5" : ""
                }`}
              />
              <span
                className={`block w-5 h-0.5 bg-gray-700 transition-all duration-300 ${
                  isMobileMenuOpen ? "opacity-0" : ""
                }`}
              />
              <span
                className={`block w-5 h-0.5 bg-gray-700 transition-all duration-300 ${
                  isMobileMenuOpen ? "-rotate-45 -translate-y-1.5" : ""
                }`}
              />
            </button>
          </div>
        </div>
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
          <div className="flex justify-between items-center p-4 border-b">
            <div
              className="w-24 h-8 sm:w-32 sm:h-10 flex items-center cursor-pointer"
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
              className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-gray-900 transition-colors"
              aria-label="Close mobile menu"
            >
              <span className="text-3xl">&times;</span>
            </button>
          </div>

          {/* Mobile navigation items */}
          <div className="flex-1 flex flex-col justify-center items-center space-y-6 py-8">
            {menuItems.map((item, index) => {
              const sectionId = item.href.substring(1);
              const isActive = item.isRoute 
                ? location.pathname === item.href
                : isMainPath && activeSection === sectionId;
              
              const itemName = isAr ? item.name.ar : item.name.en;

              if (item.isRoute) {
                return (
                  <Link
                    key={itemName}
                    to={item.href}
                    className={`text-xl font-medium transition-all duration-300 ${
                      isActive
                        ? "text-[#058BF4]"
                        : "text-gray-700 hover:text-[#058BF4]"
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
                      ? "text-[#058BF4]"
                      : "text-gray-700 hover:text-[#058BF4]"
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
              className="text-sm text-gray-700 hover:text-[#058BF4] transition-colors px-2 py-1 text-center"
            >
              العربية | English
            </button>
            <Link to="/login">
              <Button
                variant="outline"
                className="rounded-full border-[#058BF4] text-[#058BF4] hover:text-[#058BF4] w-full"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {isAr ? "تسجيل الدخول" : "Sign In"}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
