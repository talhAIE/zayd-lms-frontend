import { ArrowLeft } from "lucide-react";
import "./final-cta-section.css";

export default function FinalCtaSection() {
  return (
    <section id="final-cta" className="final-cta" dir="rtl" lang="ar" aria-labelledby="final-cta-heading">
      <div className="final-cta__container">
        <div className="final-cta__card">
          <span className="final-cta__eyebrow">جاهز لتجربة زيــــد؟</span>
          <h2 id="final-cta-heading" className="final-cta__heading">
            <span>المنهــج نفســه. المعلــم نفسـه.</span>
            <span>لكن هذه المرة كل طالب يتحدث.</span>
          </h2>
          <p className="final-cta__description">
            <span>امنح الطالب فرصة أكبر للتحدث والممارسة والتفاعل مع الإنجليزية التي يتعلمها اليوم</span>
            <span>ويحتاج إليها غدًا في الجامعة وسوق العمل والحياة.</span>
          </p>
          <div className="final-cta__actions">
            <a href="/auth/register" className="final-cta__button final-cta__button--primary">
              <span>جرّب زيــــد الآن</span>
              <span className="final-cta__arrow"><ArrowLeft aria-hidden="true" /></span>
            </a>
            <a href="/contact-us" className="final-cta__button final-cta__button--secondary">
              اطلب تجربة لمدرستك
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
