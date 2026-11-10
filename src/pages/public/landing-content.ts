/** Shared landing content. The hero topic count was confirmed as 250+ by the user. */
export const landingHeroContent = {
  brand: "زيد",
  description:
    "معلّم ذكي لممارسة اللغة الإنجليزية، يمنح كل طالب تجربة مخصصة للتحدث والقراءة والاستماع والكتابة، مع تغذية راجعة فورية ومحتوى متناغم مع ما يتعلمه في المدرسة.",
  primaryCta: { beforeBrand: "جرب زيد", brand: "Zayd", afterBrand: "الآن" },
  secondaryCta: { beforeBrand: "زيد", brand: "Zayd", afterBrand: "للمدارس" },
  characterTag: "جاهز نبدأ",
} as const;

export const landingHeroMetrics = [
  { id: "clock", value: "ساعة", description: "أسبوعيًا لممارسة الإنجليزية", direction: "rtl" },
  { id: "topics", value: "+250", description: "موضوعًا وموقفًا من الحياة", direction: "ltr" },
  { id: "multiplier", value: "×10", description: "لممارسة الإنجليزية", direction: "ltr" },
] as const;

export interface LandingPricingPlan {
  id: "curriculum" | "plus" | "life";
  name: string;
  description: string;
  originalPrice: number;
  price: number;
  discountPercent: number;
  featured: boolean;
  features: readonly string[];
  action: string;
}

// Annual SAR prices and whole-percent display discounts from PDF pp19–20.
// Reuse these amounts when P9 implements the supplied package FAQ.
// D01's broader catalog count and E03's destination remain unresolved.
export const landingPricingPlans = [
  {
    id: "curriculum",
    name: "باقة المنهج",
    description: "إذا كان هدفك تحسين أدائك في مناهج المدرسة",
    originalPrice: 299, price: 199, discountPercent: 33, featured: false,
    features: ["محتوى متوافق مع المنهج", "ممارسة التحدث والاستماع والقراءة والكتابة", "تعلّم مخصص", "تغذية راجعة بالذكاء الاصطناعي"],
    action: "ابدأ باقة المنهج",
  },
  {
    id: "plus",
    name: "Zayd Plus",
    description: "التجربة الكاملة: المنهج الدراسي، والمواضيع والمواقف الحياتية.",
    originalPrice: 599, price: 299, discountPercent: 50, featured: true,
    features: ["جميع مزايا باقة المنهج", "جميع مزايا Zayd Life", "أكثر من 40 موقفًا حياتيًا", "تجربة أشمل لبناء الثقة في استخدام اللغة"],
    action: "اختر Zayd Plus",
  },
  {
    id: "life",
    name: "Zayd Life",
    description: "إذا كان هدفك استخدام الإنجليزية في الحياة اليومية",
    originalPrice: 299, price: 199, discountPercent: 33, featured: false,
    features: ["أكثر من 40 موضوعًا حياتيًا", "محادثات في المطعم والسوق والمطار وغيرها", "ممارسة التحدث في المواقف اليومية", "تغذية راجعة وتكرار المحاولة"],
    action: "ابدأ Zayd Life",
  },
] as const satisfies readonly LandingPricingPlan[];
