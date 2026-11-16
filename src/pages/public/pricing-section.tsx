import { ArrowLeft, Check, Crown } from "lucide-react";
import pricingMascot from "@/assets/landing-page/pricing-mascot-reference.png";
import { landingPricingPlans } from "./landing-content";
import "./pricing-section.css";

export default function PricingSection() {
  return (
    <section id="pricing" className="pricing" dir="rtl" lang="ar" aria-labelledby="pricing-heading">
      <div className="pricing__container">
        <div className="pricing__header">
          <span className="pricing__eyebrow">عرض لفترة محدودة</span>
          <h2 id="pricing-heading" className="pricing__heading">اختر التجربة <span>المناسبة</span></h2>
          <p className="pricing__description">خصم يصل إلى <strong><bdi dir="ltr">50%</bdi></strong> حاليًا على الباقات الثلاث للأفراد.</p>
        </div>
        <div className="pricing__plans">
          {landingPricingPlans.map((plan) => (
            <article key={plan.id} className={`pricing-card${plan.featured ? " pricing-card--featured" : ""}`} aria-label={plan.name}>
              {plan.featured && <>
                <div className="pricing-card__mascot" aria-hidden="true"><img src={pricingMascot} alt="" width={304} height={150} /></div>
                <span className="pricing-card__recommendation"><Crown aria-hidden="true" /> الأفضل قيمة</span>
              </>}
              <h3 className="pricing-card__name"><bdi>{plan.name}</bdi></h3>
              <p className="pricing-card__description">{plan.description}</p>
              <del className="pricing-card__original-price" dir="ltr" aria-label={`السعر السابق: ${plan.originalPrice} ريال سعودي`}>
                <span className="pricing-card__riyal" aria-hidden="true">﷼</span>
                <bdi dir="ltr">{plan.originalPrice}</bdi>
              </del>
              <div className="pricing-card__price">
                <strong><bdi dir="ltr">{plan.price}</bdi></strong>
                <span className="pricing-card__billing">
                  <span className="pricing-card__riyal" aria-hidden="true">﷼</span>
                  <span className="sr-only">ريال سعودي</span>
                  <span className="pricing-card__period">/ سنة</span>
                </span>
              </div>
              <span className="pricing-card__discount">
                <svg className="pricing-card__discount-rays pricing-card__discount-rays--right" viewBox="0 0 20 40" fill="none" aria-hidden="true"><path d="M3 20h9M6 7l7 6M6 33l7-6" /></svg>
                خصم <bdi dir="ltr">{plan.discountPercent}%</bdi>
                <svg className="pricing-card__discount-rays pricing-card__discount-rays--left" viewBox="0 0 20 40" fill="none" aria-hidden="true"><path d="M3 20h9M6 7l7 6M6 33l7-6" /></svg>
              </span>
              <ul className="pricing-card__features">
                {plan.features.map((feature) => (
                  <li key={feature}><span className="pricing-card__check"><Check aria-hidden="true" /></span><span>{feature}</span></li>
                ))}
              </ul>
              <a href="/auth/register" className="pricing-card__action">
                <span>{plan.action}</span><span className="pricing-card__arrow"><ArrowLeft aria-hidden="true" /></span>
              </a>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
