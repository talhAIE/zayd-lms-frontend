import { Mail, Twitter, Instagram } from "lucide-react";
import { useLanguage } from "@/components/language-provider";
import logoImg from "@/assets/zayd-logo.png";
import { motion } from "framer-motion";

export default function Footer() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const direction = isAr ? "rtl" : "ltr";

  const columns = [
    {
      title: isAr ? "المنتج" : "Product",
      links: [
        { label: isAr ? "الميزات" : "Features", href: "#features" },
        { label: isAr ? "كيف يعمل" : "Tutors", href: "#tutors" },
        { label: isAr ? "التسعير" : "Challenge", href: "#challenge" },
        { label: isAr ? "الشهادات" : "Compliance", href: "#compliance" },
        { label: isAr ? "الأسئلة الشائعة" : "Join Now", href: "#join-now" },
      ],
    },
    {
      title: isAr ? "اللغات" : "Languages",
      links: [
        {
          label: isAr ? "🇬🇧 معلم اللغة الإنجليزية" : "English Tutor",
          href: "#",
        },
        { label: isAr ? "🇨🇳 معلم اللغة الصينية" : "Chinese Tutor", href: "#" },
        { label: isAr ? "المناهج الدراسية" : "Curriculum", href: "#" },
        { label: isAr ? "تتبع التقدم" : "Progress Tracking", href: "#" },
      ],
    },
    {
      title: isAr ? "الشركة" : "Company",
      links: [
        { label: isAr ? "معلومات عنا" : "About Us", href: "#" },
        { label: isAr ? "رؤية 2030" : "Vision 2030", href: "#" },
        { label: isAr ? "الوظائف" : "Careers", href: "#" },
        { label: isAr ? "اتصل بنا" : "Contact", href: "/contact-us" },
        { label: isAr ? "المدونة" : "Blog", href: "#" },
      ],
    },
    {
      title: isAr ? "الدعم" : "Support",
      links: [
        { label: isAr ? "مركز المساعدة" : "Help Center", href: "#" },
        { label: isAr ? "سياسة الخصوصية" : "Privacy Policy", href: "#" },
        { label: isAr ? "شروط الخدمة" : "Terms of Service", href: "#" },
        { label: isAr ? "سياسة الكوكيز" : "Cookie Policy", href: "#" },
      ],
    },
  ];

  return (
    <motion.footer
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="bg-[#F8FAFC] border-t border-gray-100 pt-8 sm:pt-24 pb-8 sm:pb-12"
      dir={direction}
    >
      <div className="max-w-7xl mx-auto px-4">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 sm:gap-16 mb-12 sm:mb-20">
          {/* Logo and About Side */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.8 }}
            className="lg:col-span-4 space-y-6 sm:space-y-8 flex flex-col items-center lg:items-start text-center lg:text-left"
          >
            <div className="flex items-center gap-2">
              <img
                src={logoImg}
                alt="ZAYD Logo"
                className="h-8 sm:h-10 w-auto"
              />
            </div>

            <p className="text-gray-500 font-medium leading-relaxed max-w-sm text-sm sm:text-base">
              {isAr
                ? "صالة اللغة للطالب العصري. تدرب على الإنجليزية أو الصينية مع تدريب مدعوم بالذكاء الاصطناعي مصمم للطلاقة والدقة والنطق المثالي."
                : "The Language Gym for the Modern Student. Practice English or Chinese with AI-driven training designed for fluency, accuracy, and perfect prosody."}
            </p>

            <div className="flex items-center gap-4">
              {[Mail, Twitter, Instagram].map((Icon, idx) => (
                <div
                  key={idx}
                  className="w-10 h-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center text-gray-400 shadow-sm transition-all cursor-default"
                >
                  <Icon className="w-5 h-5" />
                </div>
              ))}
            </div>
          </motion.div>

          {/* Links Columns */}
          <div className="lg:col-span-8 grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-10 sm:gap-12">
            {columns.map((column, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.6, delay: 0.1 * idx }}
                className="space-y-4 sm:space-y-6"
              >
                <h4 className="text-gray-900 font-bold text-base sm:text-lg select-none">
                  {column.title}
                </h4>
                <ul className="space-y-3 sm:space-y-4">
                  {column.links.map((link, lIdx) => (
                    <li key={lIdx}>
                      {link.href !== "#" ? (
                        <a
                          href={link.href}
                          className="text-gray-500 text-sm sm:text-base font-medium hover:text-[#058BF4] transition-colors"
                        >
                          {link.label}
                        </a>
                      ) : (
                        <span className="text-gray-500 text-sm sm:text-base font-medium select-none">
                          {link.label}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Lower Footer */}
        <div className="pt-8 sm:pt-12 border-t border-gray-200/60 flex flex-col md:flex-row justify-between items-center gap-6 sm:gap-8">
          {/* Legal Links */}
          <div className="flex items-center gap-6 sm:gap-8 text-xs sm:text-sm text-gray-500 font-medium">
            <span className="select-none">{isAr ? "الخصوصية" : "Privacy"}</span>
            <span className="select-none">{isAr ? "الشروط" : "Terms"}</span>
            <span className="select-none">{isAr ? "الكوكيز" : "Cookies"}</span>
          </div>

          {/* Copyright */}
          <p className="text-xs sm:text-sm text-gray-400 font-medium whitespace-nowrap order-3 md:order-2">
            {isAr
              ? `© 2025 زيد AI. جميع الحقوق محفوظة.`
              : `© 2025 Zayd AI. All rights reserved.`}
          </p>

          {/* Tagline */}
          <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-900 font-bold order-2 md:order-3">
            {isAr
              ? "مبني في المملكة العربية السعودية. تدريب قادة 2030."
              : "Built in Saudi Arabia. Training the Leaders of 2030."}
          </div>
        </div>
      </div>
    </motion.footer>
  );
}
