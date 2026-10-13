import footerImageImg from "@/assets/images/landingpage/footer-image.png";
import logoImg from "@/assets/zayd-logo.png";
import { Link } from "react-router-dom";
import { useLanguage } from "@/components/language-provider";

export default function Footer() {
  const { language } = useLanguage();
  const legalLinks = [
    {
      name: {
        en: "Terms of Service",
        ar: "شروط الخدمة",
      },
      href: "#",
    },
    {
      name: {
        en: "Privacy Policy",
        ar: "سياسة الخصوصية",
      },
      href: "#",
    },
    {
      name: {
        en: "Refund Policy",
        ar: "سياسة الاسترداد",
      },
      href: "#",
    },
  ];

  return (
    <footer className="bg-[#0A0A0E] text-white py-14 overflow-hidden">
      <div className="container mx-auto px-6 max-w-6xl overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center mb-24 gap-8 lg:gap-0">
          <div className="min-w-0 flex-1">
            <div className="flex flex-col lg:flex-row lg:justify-start lg:items-center gap-2 lg:gap-4 mb-4">
              <div className="bg-[#2a2a2a] px-4 py-2 rounded-full inline-block w-fit">
                <span className="text-white text-xs font-medium tracking-wide">
                  {language === "ar" ? "زيد" : "ZAYD"}
                </span>
              </div>
              <p className="text-gray-300 text-xs font-medium tracking-[0.2em] uppercase">
                {language === "ar"
                  ? "ادفع مرة واحدة وامتلكه للأبد"
                  : "PAY ONCE, OWN FOREVER."}
              </p>
            </div>

            <div className="mb-8">
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-6xl font-semibold leading-tight mb-6 relative break-words">
                {language === "ar" ? (
                  <span className="relative inline-block">
                    صُمم من أجل الطلاب... وبدعم من خبراء التعليم
                    {/* Orange circle, original */}
                    <span
                      className="pointer-events-none absolute left-0 bottom-0"
                      aria-hidden="true"
                      style={{
                        width: 76,
                        height: 76,
                        borderRadius: "50%",
                        background:
                          "radial-gradient(circle, rgba(255, 120, 71, 0.3) 70%, transparent 100%)",
                        zIndex: 0,
                        filter: "blur(12px)",
                        transform: "translate(-55%, 40%)",
                      }}
                    ></span>
                    {/* New blue circle, top right */}
                    <span
                      className="pointer-events-none absolute right-0 -top-6"
                      aria-hidden="true"
                      style={{
                        width: "260px",
                        height: "100px",
                        borderRadius: "50%",
                        background:
                          "radial-gradient(circle, rgba(5,139,244,0.29) 55%, transparent 95%)",
                        zIndex: 0,
                        filter: "blur(32px)",
                        transform: "translate(40%, -85%)",
                      }}
                    ></span>
                  </span>
                ) : (
                  <>
                    Built for Students,
                    <br />
                    <span className="relative inline-block">
                      Backed by Education
                      {/* Orange circle, original */}
                      <span
                        className="pointer-events-none absolute left-0 bottom-0"
                        aria-hidden="true"
                        style={{
                          width: 76,
                          height: 76,
                          borderRadius: "50%",
                          background:
                            "radial-gradient(circle, rgba(255, 120, 71, 0.3) 70%, transparent 100%)",
                          zIndex: 0,
                          filter: "blur(12px)",
                          transform: "translate(-55%, 40%)",
                        }}
                      ></span>
                      {/* New blue circle, top right */}
                      <span
                        className="pointer-events-none absolute right-0 -top-6"
                        aria-hidden="true"
                        style={{
                          width: "260px",
                          height: "100px",
                          borderRadius: "50%",
                          background:
                            "radial-gradient(circle, rgba(5,139,244,0.29) 55%, transparent 95%)",
                          zIndex: 0,
                          filter: "blur(32px)",
                          transform: "translate(40%, -85%)",
                        }}
                      ></span>
                    </span>
                  </>
                )}
              </h2>
              <p className="text-gray-300 text-sm lg:text-base mb-4 max-w-md">
                {language === "ar" ? (
                  "طوّر مهاراتك في اللغة الإنجليزية بقوة الذكاء الاصطناعي."
                ) : (
                  <>
                    Unlock English skills with the
                    <br />
                    power of AI.
                  </>
                )}
              </p>
            </div>

            <Link to="/login">
              <div className="bg-[#2a2a2a] px-6 lg:px-10 py-3 lg:py-4 rounded-full inline-block w-fit hover:bg-[#3a3a3a] transition-colors duration-300 cursor-pointer">
                <span className="text-white text-md font-light tracking-wide flex items-center gap-2">
                  {language === "ar"
                    ? "انضم الآن وابدأ مجانًا"
                    : "Join Now & Start Free"}
                  <svg
                    className="w-3 h-3"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </span>
              </div>
            </Link>
          </div>

          <div className="relative flex items-center justify-center order-first lg:order-last overflow-visible">
            {/* Softer/lighter background green circle shade at the top right */}
            <span
              className="lg:flex hidden pointer-events-none absolute -top-8 -right-8 lg:-right-12"
              aria-hidden="true"
              style={{
                width: 180,
                height: 180,
                borderRadius: "50%",
                background:
                  "radial-gradient(circle, rgba(23, 216, 97, 0.18) 70%, transparent 100%)",
                zIndex: 0,
                filter: "blur(24px)",
              }}
            ></span>
            <img
              src={footerImageImg}
              alt="ZAYD"
              width={150}
              height={150}
              className="relative z-10 hidden lg:block lg:w-[200px] lg:h-[200px] flip-in-en"
            />
          </div>
        </div>

        <div className="border-t border-gray-900 py-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 lg:gap-0">
            <div className="flex items-center">
              <img
                src={logoImg}
                alt="ZAYD Logo"
                width={96}
                height={96}
                className="mr-2 w-20 h-auto object-contain"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3 lg:gap-6 justify-center lg:justify-end">
              <h3 className="text-sm lg:text-md font-light px-2 lg:px-3">
                LinkedIn
              </h3>
              <h3 className="text-sm lg:text-md font-light px-2 lg:px-3">
                Telegram
              </h3>
              <h3 className="text-sm lg:text-md font-light px-2 lg:px-3">
                Behance
              </h3>
              <h3 className="text-sm lg:text-md font-light px-2 lg:px-3">X</h3>
              <h3 className="text-sm lg:text-md font-light px-2 lg:px-3">
                Instagram
              </h3>
              <h3 className="text-sm lg:text-md font-light px-2 lg:px-3">
                Facebook
              </h3>
            </div>
          </div>
        </div>

        <div className="text-center py-6 lg:py-8">
          {/* Legal Links */}
          <div className="flex flex-wrap justify-center items-center gap-1 mb-4 text-xs lg:text-sm">
            {legalLinks.map((link, index) => (
              <div key={link.name.en} className="flex items-center">
                <a
                  href={link.href}
                  className="text-gray-100 hover:text-white transition-colors duration-300"
                >
                  {link.name[language]}
                </a>
                {index < legalLinks.length - 1 && (
                  <span className="mx-3 text-gray-600">•</span>
                )}
              </div>
            ))}
          </div>

          {/* Copyright */}
          <div className="text-xs lg:text-sm text-gray-400">
            {language === "ar"
              ? "2025 ZAYD © جميع الحقوق محفوظة. زيد"
              : "2025 ZAYD © Copyright 2025. All Rights Reserved"}
          </div>
        </div>
      </div>
    </footer>
  );
}
