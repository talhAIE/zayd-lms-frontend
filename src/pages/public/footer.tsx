import { Mail, Phone } from "lucide-react";
import logo from "@/assets/landing-page/logo.png";
import mascot from "@/assets/landing-page/section11.png";
import "./footer.css";

export default function Footer() {
  return (
    <footer id="footer" className="site-footer" dir="rtl" lang="ar">
      <div className="site-footer__container">
        <div className="site-footer__grid">
          <div className="site-footer__brand">
            <a href="#home" aria-label="زيد — الصفحة الرئيسية">
              <img src={logo} alt="ZAYD" className="site-footer__logo" />
            </a>
            <p>معلم ذكي لممارسة اللغة الإنجليزية.<br />تعلّم. مارس. أتقن.</p>
          </div>
          <nav className="site-footer__navigation" aria-label="روابط سريعة">
            <h2>روابط سريعة</h2>
            <ul>
              <li><a href="#home">لماذا زيــد؟</a></li>
              <li><a href="#curriculum">المنهج</a></li>
              <li><a href="#pricing">الأسعار</a></li>
              <li><a href="#schools">للمدارس</a></li>
            </ul>
          </nav>
          <div className="site-footer__contact">
            <h2>تواصل معنا</h2>
            <a href="mailto:contact@waaha.ai">
              <Mail aria-hidden="true" /><span dir="ltr">contact@waaha.ai</span>
            </a>
            <a href="tel:+966582788984">
              <Phone aria-hidden="true" /><span dir="ltr">+966 58 278 8984</span>
            </a>
          </div>
          <div className="site-footer__character" aria-hidden="true">
            <img src={mascot} alt="" />
          </div>
        </div>
        <p className="site-footer__copyright" dir="ltr">© 2026 Zayd AI. <span dir="rtl">جميع الحقوق محفوظة.</span></p>
      </div>
    </footer>
  );
}
