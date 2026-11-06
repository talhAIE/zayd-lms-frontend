import { ArrowLeft, Check, Crown } from "lucide-react";
import { SaudiRiyalIcon } from "@/components/Icons";
import pricingMascot from "@/assets/landing-page/pricing-mascot-reference.png";
import "./pricing-section.css";

const plans = [
  {
    name: "باقة المنهج",
    description: "لطلاب المتوسطة والثانوية الذين يريدون التركيز على ممارسة محتوى المنهج.",
    originalPrice: "199", price: "99.5", featured: false,
    features: ["محتوى متوافق مع المنهج", "ممارسة التحدث والاستماع والقراءة والكتابة", "تعلّم مخصص", "تغذية راجعة بالذكاء الاصطناعي"],
    action: "ابدأ باقة المنهج",
  },
  {
    name: "Zayd Plus",
    description: "التجربة الكاملة: المنهج الدراسي، والمواضيع والمواقف الحياتية.",
    originalPrice: "399", price: "199.5", featured: true,
    features: ["جميع مزايا باقة المنهج", "جميع مزايا Zayd Life", "أكثر من 40 موقفًا حياتيًا", "تجربة أشمل لبناء الثقة في استخدام اللغة"],
    action: "اختر Zayd Plus",
  },
  {
    name: "Zayd Life",
    description: "لمن يريد ممارسة الإنجليزية في مواقف الحياة اليومية بعيدًا عن محتوى المنهج.",
    originalPrice: "199", price: "99.5", featured: false,
    features: ["أكثر من 40 موضوعًا حياتيًا", "محادثات في المطعم والسوق والمطار وغيرها", "ممارسة التحدث في المواقف اليومية", "تغذية راجعة وتكرار المحاولة"],
    action: "ابدأ Zayd Life",
  },
];

export default function PricingSection() {
  return (
    <section id="pricing" className="pricing" dir="rtl" lang="ar" aria-labelledby="pricing-heading">
      <div className="pricing__container">
        <div className="pricing__header">
          <span className="pricing__eyebrow">عرض لفترة محدودة</span>
          <h2 id="pricing-heading" className="pricing__heading">اختر التجربة <span>المناسبة</span></h2>
          <p className="pricing__description">خصم <strong>50%</strong> حاليًا على الباقات الثلاث للأفراد.</p>
        </div>
        <div className="pricing__plans">
          {plans.map((plan) => (
            <article key={plan.name} className={`pricing-card${plan.featured ? " pricing-card--featured" : ""}`} aria-label={plan.name}>
              {plan.featured && <>
                <div className="pricing-card__mascot" aria-hidden="true"><img src={pricingMascot} alt="" width={304} height={150} /></div>
                <span className="pricing-card__recommendation"><Crown aria-hidden="true" /> الأفضل قيمة</span>
              </>}
              <h3 className="pricing-card__name"><bdi>{plan.name}</bdi></h3>
              <p className="pricing-card__description">{plan.description}</p>
              <del className="pricing-card__original-price" dir="ltr" aria-label={`السعر السابق: ${plan.originalPrice} ريال سعودي`}>
                <SaudiRiyalIcon className="pricing-card__riyal" />
                <bdi dir="ltr">{plan.originalPrice}</bdi>
              </del>
              <div className="pricing-card__price">
                <strong><bdi dir="ltr">{plan.price}</bdi></strong>
                <span className="pricing-card__billing">
                  <SaudiRiyalIcon className="pricing-card__riyal" />
                  <span className="sr-only">ريال سعودي</span>
                  <span className="pricing-card__period">/ سنة</span>
                </span>
              </div>
              <span className="pricing-card__discount">خصــــــــم 50%</span>
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
