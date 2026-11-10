export type OnboardingLanguage = "ar" | "en";
type Label = Record<OnboardingLanguage, string>;

const options = (rows: [string, string, string][]) =>
  rows.map(([value, en, ar]) => ({ value, en, ar }));

export const onboardingOptions = {
  goal: options([
    ["school", "Improve school grades", "تحسين درجاتي الدراسية"],
    ["step", "Pass STEP", "اجتياز اختبار STEP"],
    ["confidence", "Speak confidently", "التحدث بثقة"],
    ["general", "General improvement", "تطوير عام"],
  ]),
  stepHistory: options([
    ["yes", "Yes", "نعم"],
    ["no", "No", "لا"],
    ["planning", "Planning to soon", "أخطط لذلك قريباً"],
  ]),
  level: options([
    ["beginner", "Beginner", "مبتدئ"],
    ["elementary", "Elementary", "أساسي"],
    ["intermediate", "Intermediate", "متوسط"],
    ["advanced", "Advanced", "متقدم"],
  ]),
  skill: options([
    ["reading", "Reading", "القراءة"],
    ["listening", "Listening", "الاستماع"],
    ["writing", "Writing", "الكتابة"],
    ["speaking", "Speaking", "المحادثة"],
    ["grammar", "Grammar", "القواعد"],
    ["vocabulary", "Vocabulary", "المفردات"],
  ]),
  topics: options([
    ["sports", "Sports", "الرياضة"],
    ["science", "Science", "العلوم"],
    ["stories", "Stories", "القصص"],
    ["technology", "Technology", "التقنية"],
    ["travel", "Travel", "السفر"],
  ]),
  dailyTime: options([
    ["15", "15 min", "15 دقيقة"],
    ["30", "30 min", "30 دقيقة"],
    ["60", "1 hour", "ساعة واحدة"],
    ["more", "More", "أكثر من ذلك"],
  ]),
  attribution: options([
    ["school", "School", "المدرسة"],
    ["friend", "Friend", "صديق"],
    ["social", "Social media", "وسائل التواصل الاجتماعي"],
    ["other", "Other", "أخرى"],
  ]),
};

export const onboardingCopy = {
  name: { en: "What's your name? (Optional)", ar: "ما اسمك؟ (اختياري)" },
  goal: { en: "What is your main goal?", ar: "ما هو هدفك الرئيسي؟" },
  stepHistory: { en: "Have you taken the STEP test before?", ar: "هل سبق لك خوض اختبار STEP؟" },
  skill: { en: "Which skill do you want to focus on most?", ar: "ما المهارة التي تود التركيز عليها أكثر؟" },
  level: { en: "Your level (Optional)", ar: "مستواك (اختياري)" },
  topics: { en: "What topics do you enjoy? (Choose as many as you like)", ar: "ما المواضيع التي تفضلها؟ (اختر ما تشاء)" },
  dailyTime: { en: "How much time can you practice daily?", ar: "كم من الوقت يمكنك تخصيصه للممارسة يومياً؟" },
  attribution: { en: "How did you hear about us?", ar: "كيف سمعت عنا؟" },
  contact: { en: "Your personalized plan is ready!", ar: "خطتك التدريبية جاهزة!" },
  contactIntro: {
    en: "Sign up with your WhatsApp number or email and start your English journey in under a minute.",
    ar: "سجّل برقم الواتساب أو بريدك الإلكتروني وابدأ رحلتك في تعلم الإنجليزية في أقل من دقيقة.",
  },
  contactUse: {
    en: "Provide at least one so Zayd can follow up about your request.",
    ar: "أدخل وسيلة تواصل واحدة على الأقل حتى يتمكن زيد من متابعة طلبك.",
  },
  whatsapp: { en: "WhatsApp number", ar: "رقم الواتساب" },
  email: { en: "Email address", ar: "البريد الإلكتروني" },
  next: { en: "Continue", ar: "متابعة" },
  back: { en: "Back", ar: "السابق" },
  submit: { en: "Start Learning Now", ar: "ابدأ التعلم الآن" },
  saving: { en: "Saving…", ar: "جارٍ الحفظ…" },
  saved: { en: "Your details have been saved.", ar: "تم حفظ بياناتك بنجاح." },
  close: { en: "Close", ar: "إغلاق" },
  missingContact: { en: "Enter a WhatsApp number or email address.", ar: "أدخل رقم الواتساب أو بريدك الإلكتروني." },
  invalidPhone: { en: "Enter your WhatsApp number with its country code, starting with +.", ar: "أدخل رقم الواتساب مع رمز الدولة مسبوقاً بعلامة +." },
  saveFailed: { en: "We couldn't save your details. Please try again.", ar: "تعذّر حفظ بياناتك. يرجى المحاولة مرة أخرى." },
} satisfies Record<string, Label>;
