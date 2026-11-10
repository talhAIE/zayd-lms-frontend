import { ArrowLeft } from "lucide-react";
import schoolsGraphic from "@/assets/landing-page/section9.png";
import "./schools-section.css";

export default function SchoolsSection() {
  return (
    <section id="schools" className="schools" dir="rtl" lang="ar" aria-labelledby="schools-heading">
      <div className="schools__container">
        <div className="schools__card">
          <div className="schools__copy">
            <span className="schools__eyebrow">زيد للمدارس والمجموعات</span>
            <h2 id="schools-heading" className="schools__heading">
              <span>مدرستـــك تدرّس الإنجليزيــة</span>
              <span className="schools__heading-accent">زيــد يجعل كل طالب يمارسها.</span>
            </h2>
            <p className="schools__description">
              لا تحتاج المدرسة إلى تغيير منهجها أو استبدال معلميها. <strong>زيـــد</strong> يضيف طبقة من الممارسة
              الفردية والتغذية الراجعة حول ما تقوم به المدرسة بالفعل.
            </p>
            <ul className="schools__features" aria-label="مزايا المدارس والمجموعات">
              <li>أسعار خاصة حسب العدد</li><li>مجموعات طلابية</li><li>دعم للتطبيق داخل المدرسة</li>
            </ul>
            <a href="/contact-us" className="schools__action">
              <span>اطلب عرض المدارس</span><span className="schools__arrow"><ArrowLeft aria-hidden="true" /></span>
            </a>
          </div>
          <div className="schools__visual">
            <img src={schoolsGraphic} alt="لوحة تحكم المعلم مع حساب خاص للمعلم مجانًا" width={1094} height={711} />
            <p className="schools__teacher-note">
              لأن المعلم جزء أساسي من تجربة <strong>زيـــد</strong> يحصل معلمو المدارس المشاركة على حساب خاص دون تكلفة إضافية.
            </p>
            <p className="schools__teacher-message">زيـــد لا يستبدل المعلم.. بل يوسّع أثره.</p>
          </div>
      </div>
      </div>
    </section>
  );
}
