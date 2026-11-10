/** Planning-only contract. Not imported by src, not a P1 implementation. */
export type ContentStatus = 'specified' | 'observed' | 'proposed' | 'supplied_draft' | 'unresolved' | 'missing';
export type ReviewValue<T> = Readonly<{value:T|null; status:ContentStatus; source:string; decisionIds:readonly string[]}>;
export interface PlanPrice {id:string; title:string; originalPrice:number; activePrice:number; discountPercent:number; period:'year'; currency:'SAR'; description:string; action:string; status:'specified'; source:string;}
export interface FaqEntry {id:string; question:string; answerMarkdown:string; status:'supplied_draft'; source:string;}
export interface ScreenshotMapping {id:string; tab:string; asset:string; source:string; mappingStatus:string; approvalStatus:'reference_only'; decisionIds:readonly string[];}
export interface DemoPrompt {id:string; source:string; text:string|null; status:string; dependency:string; suitability:string;}
export interface LandingContentContract {
sourceSha256:string; approvalMeaning:string;
hero:Record<'body'|'primaryCta'|'secondaryCta',ReviewValue<string>>;
metricSubtitles:Record<'clock'|'topics'|'multiplier',ReviewValue<string>>;
topicCount:{currentObserved:ReviewValue<number>;proposedHero:ReviewValue<number>;approvedUnified:ReviewValue<number>;action:string};
impact:{students:ReviewValue<number>;practiceHours:ReviewValue<number>;practiceMinutesEquivalent:ReviewValue<number>;displayUnit:ReviewValue<'hours'|'minutes'>;completedLessons:ReviewValue<number>};
unitLabels:Record<string,string>;
pricing:{subtitle:ReviewValue<string>;plans:readonly PlanPrice[];topicBenefits:ReviewValue<string[]>;destination:ReviewValue<string>};
faqEntries:readonly FaqEntry[];banner:ReviewValue<string>;footer:{email:ReviewValue<string>;phone:ReviewValue<string>;socialUrls:ReviewValue<string[]>};
screenshotMappings:readonly ScreenshotMapping[];demoPrompts:readonly DemoPrompt[];
}
export const landingContentContract = {
  "sourceSha256": "cde12eb809ca248cfab3bd5f3d908498085f0b0ca58ce11020a2e12d4cdf8aa5",
  "approvalMeaning": "specified = stated final requirement, not verification of business claims; supplied_draft/proposed/unresolved are never approved",
  "hero": {
    "body": {
      "value": "زيد معلّم ذكي لممارسة اللغة الإنجليزية، يمنح كل طالب تجربة مخصصة للتحدث والقراءة والاستماع والكتابة، مع تغذية راجعة فورية ومحتوى متناغم مع ما يتعلمه في المدرسة.",
      "status": "specified",
      "source": "PDF p4 callout4",
      "decisionIds": []
    },
    "primaryCta": {
      "value": "جرب زيد Zayd الآن",
      "status": "specified",
      "source": "PDF p4 callout5",
      "decisionIds": []
    },
    "secondaryCta": {
      "value": "زيد Zayd للمدارس",
      "status": "specified",
      "source": "PDF p4 callout6",
      "decisionIds": []
    }
  },
  "metricSubtitles": {
    "clock": {
      "value": "أسبوعيًا لممارسة الإنجليزية",
      "status": "specified",
      "source": "PDF p5 callout1",
      "decisionIds": []
    },
    "topics": {
      "value": "موضوعًا وموقفًا من الحياة",
      "status": "specified",
      "source": "PDF p5 callout2",
      "decisionIds": []
    },
    "multiplier": {
      "value": "لممارسة الإنجليزية",
      "status": "specified",
      "source": "PDF p5 callout3",
      "decisionIds": []
    }
  },
  "topicCount": {
    "currentObserved": {
      "value": 40,
      "status": "observed",
      "source": "hero-section.tsx / zayd-life-section.tsx / pricing-section.tsx",
      "decisionIds": []
    },
    "proposedHero": {
      "value": 250,
      "status": "specified",
      "source": "PDF p5",
      "decisionIds": [
        "D01"
      ]
    },
    "approvedUnified": {
      "value": null,
      "status": "unresolved",
      "source": "User explicitly deferred decision",
      "decisionIds": [
        "D01"
      ]
    },
    "action": "Preserve existing value until D01 resolves; do not mark S3-TOPICS complete"
  },
  "impact": {
    "students": {
      "value": 2500,
      "status": "proposed",
      "source": "PDF p28 item6",
      "decisionIds": [
        "D06"
      ]
    },
    "practiceHours": {
      "value": 5000,
      "status": "proposed",
      "source": "PDF p28 item6",
      "decisionIds": [
        "D06"
      ]
    },
    "practiceMinutesEquivalent": {
      "value": 300000,
      "status": "proposed",
      "source": "PDF p28 item6",
      "decisionIds": [
        "D06"
      ]
    },
    "displayUnit": {
      "value": null,
      "status": "unresolved",
      "source": "PDF p28 item6",
      "decisionIds": [
        "D06"
      ]
    },
    "completedLessons": {
      "value": null,
      "status": "unresolved",
      "source": "PDF p28 missing replacement for old 8600",
      "decisionIds": [
        "D06"
      ]
    }
  },
  "unitLabels": {
    "currency": "SAR",
    "annual": "سنة",
    "students": "طالب مسجل",
    "hours": "ساعة ممارسة",
    "minutes": "دقيقة ممارسة",
    "lessons": "درس منجز"
  },
  "pricing": {
    "subtitle": {
      "value": "خصم يصل إلى 50% حاليًا على الباقات الثلاث للأفراد.",
      "status": "specified",
      "source": "PDF p19 final row",
      "decisionIds": [
        "D07"
      ]
    },
    "plans": [
      {
        "id": "curriculum",
        "title": "باقة المنهج",
        "originalPrice": 299,
        "activePrice": 199,
        "discountPercent": 33,
        "period": "year",
        "currency": "SAR",
        "description": "إذا كان هدفك تحسين أدائك في مناهج المدرسة",
        "action": "ابدأ باقة المنهج",
        "status": "specified",
        "source": "PDF p19"
      },
      {
        "id": "plus",
        "title": "Zayd Plus",
        "originalPrice": 599,
        "activePrice": 299,
        "discountPercent": 50,
        "period": "year",
        "currency": "SAR",
        "description": "التجربة الكاملة: المنهج الدراسي، والمواضيع والمواقف الحياتية.",
        "action": "اختر Zayd Plus",
        "status": "specified",
        "source": "PDF p20"
      },
      {
        "id": "life",
        "title": "Zayd Life",
        "originalPrice": 299,
        "activePrice": 199,
        "discountPercent": 33,
        "period": "year",
        "currency": "SAR",
        "description": "إذا كان هدفك استخدام الإنجليزية في الحياة اليومية",
        "action": "ابدأ Zayd Life",
        "status": "specified",
        "source": "PDF p20"
      }
    ],
    "topicBenefits": {
      "value": null,
      "status": "unresolved",
      "source": "Unified topic-dependent benefits need D01",
      "decisionIds": [
        "D01"
      ]
    },
    "destination": {
      "value": null,
      "status": "unresolved",
      "source": "Absent registration route; existing login candidate only",
      "decisionIds": [
        "E03"
      ]
    }
  },
  "faqEntries": [
    {
      "id": "faq-1",
      "question": "لماذا اخترنا اسم \"زيد Zayd\"؟",
      "answerMarkdown": "يرتبط اسم \"زيد\" في اللغة العربية بمعنى الزيادة والنماء والتقدّم المستمر؛ وهو ما يمثّله زيد تمامًا، إذ يزيد من فرص الطالب في ممارسة اللغة الإنجليزية، وينمّي مهاراته في التحدث والقراءة والاستماع والكتابة، ويزيد من ثقته في استخدام اللغة في المدرسة والحياة اليومية.",
      "status": "supplied_draft",
      "source": "PDF pp24-25"
    },
    {
      "id": "faq-2",
      "question": "ما هو زيد؟",
      "answerMarkdown": "زيد معلّم ذكي لممارسة اللغة الإنجليزية يمنح كل طالب تجربة مخصصة للتحدث والقراءة والاستماع والكتابة، مع تغذية راجعة فورية ومحتوى متناغم مع ما يتعلمه طلاب المرحلتين المتوسطة والثانوية في المدرسة.",
      "status": "supplied_draft",
      "source": "PDF pp24-25"
    },
    {
      "id": "faq-3",
      "question": "هل زيد بديل عن معلم اللغة الإنجليزية؟",
      "answerMarkdown": "لا، زيد لا يستبدل المعلم بل يعزز دوره ويوسّع أثره؛ فهو يمنح كل طالب فرصًا إضافية لممارسة اللغة الإنجليزية بشكل فردي ووفق مستواه وسرعته حول ما يتعلمه بالفعل في المدرسة، مع تغذية راجعة فورية تدعم تقدمه.",
      "status": "supplied_draft",
      "source": "PDF pp24-25"
    },
    {
      "id": "faq-4",
      "question": "ما الصفوف التي يخدمها زيد حاليًا؟",
      "answerMarkdown": "يخدم زيد حاليًا طلاب المرحلتين المتوسطة والثانوية (من الصف الأول المتوسط إلى الصف الثالث الثانوي)، بمحتوى متناغم مع منهج اللغة الإنجليزية المعتمد في المدرسة، بالإضافة إلى مواضيع ومواقف الحياة اليومية.",
      "status": "supplied_draft",
      "source": "PDF pp24-25"
    },
    {
      "id": "faq-5",
      "question": "كم يحتاج الطالب إلى استخدام زيد؟",
      "answerMarkdown": "يحتاج الطالب إلى نحو ساعة واحدة أسبوعيًا من الممارسة المنتظمة مع زيد؛ ومع الاستمرار خلال عام دراسي واحد، يحصل الطالب على فرص مكثفة لممارسة التحدث بالإنجليزية تعادل تقريبًا ما قد يحصل عليه خلال 10 سنوات في الفصل التقليدي.",
      "status": "supplied_draft",
      "source": "PDF pp24-25"
    },
    {
      "id": "faq-6",
      "question": "كيف يستخدم الذكاء الاصطناعي في تقييم الطالب؟",
      "answerMarkdown": "يستخدم زيد الذكاء الاصطناعي للتفاعل مع الطالب في مهارات التحدث والقراءة والاستماع والكتابة، وتقديم ملاحظات ذكية وتغذية راجعة فورية لتحسين النطق والطلاقة والأداء، مع تكييف التمارين تلقائيًا وفق مستوى الطالب واحتياجه ومنحه محاولات متكررة حتى الإتقان.",
      "status": "supplied_draft",
      "source": "PDF pp24-25"
    },
    {
      "id": "faq-7",
      "question": "ما الفرق بين الباقات الثلاث؟",
      "answerMarkdown": "- باقة المنهج (199 ﷼/سنة): إذا كان هدفك تحسين أدائك في مناهج المدرسة وممارسة مهارات اللغة الأربع.\n- باقة Zayd Life (199 ﷼/سنة): إذا كان هدفك استخدام الإنجليزية في الحياة اليومية عبر أكثر من 40 موضوعًا وموقفًا حياتيًا.\n- باقة Zayd Plus (299 ﷼/سنة - الأفضل قيمة): التجربة الكاملة التي تجمع مزايا باقة المنهج وجميع مزايا Zayd Life.",
      "status": "supplied_draft",
      "source": "PDF pp24-25"
    },
    {
      "id": "faq-8",
      "question": "هل توجد أسعار خاصة للمدارس والمجموعات؟",
      "answerMarkdown": "نعم، يوفّر زيد أسعارًا خاصة للمدارس واشتراكات للمجموعات الطلابية، مع دعم متكامل للتطبيق داخل المدرسة. يمكنك طلب عرض خاص عبر زر \"اطلب عرضًا لمدرستك\".",
      "status": "supplied_draft",
      "source": "PDF pp24-25"
    },
    {
      "id": "faq-9",
      "question": "هل يدفع المعلم مقابل حسابه؟",
      "answerMarkdown": "لا، لأن المعلم جزء أساسي من تجربة زيد، يحصل معلمو المدارس المشاركة على حساب خاص مجانًا دون أي تكلفة إضافية لمتابعة تقدم طلابهم وتقارير أدائهم.",
      "status": "supplied_draft",
      "source": "PDF p26"
    }
  ],
  "banner": {
    "value": "الطالب لا يحتاج إلى مزيد من شرح الإنجليزية بقدر ما يحتاج إلى المزيد من استخدامها.",
    "status": "supplied_draft",
    "source": "PDF p22 final row; p29 review request",
    "decisionIds": [
      "D09"
    ]
  },
  "footer": {
    "email": {
      "value": null,
      "status": "missing",
      "source": "PDF p29 item10",
      "decisionIds": [
        "D10"
      ]
    },
    "phone": {
      "value": null,
      "status": "missing",
      "source": "PDF p29 item10",
      "decisionIds": [
        "D10"
      ]
    },
    "socialUrls": {
      "value": null,
      "status": "missing",
      "source": "PDF p29 item10",
      "decisionIds": [
        "D10"
      ]
    }
  },
  "screenshotMappings": [
    {
      "id": "screenshot-slide-5",
      "tab": "Reading secondary / S7 reference",
      "asset": "planning/landing-p0/reference-images/slides-5-6-pair.png",
      "source": "PDF p10",
      "mappingStatus": "secondary mapping proposed",
      "approvalStatus": "reference_only",
      "decisionIds": [
        "D03",
        "E04"
      ]
    },
    {
      "id": "screenshot-slide-6",
      "tab": "القواعد",
      "asset": "planning/landing-p0/reference-images/slides-5-6-pair.png",
      "source": "PDF p10",
      "mappingStatus": "direct PDF mapping",
      "approvalStatus": "reference_only",
      "decisionIds": [
        "D03",
        "E04"
      ]
    },
    {
      "id": "screenshot-slide-7",
      "tab": "الاستماع",
      "asset": "planning/landing-p0/reference-images/slides-7-8-pair.png",
      "source": "PDF p10",
      "mappingStatus": "direct PDF mapping",
      "approvalStatus": "reference_only",
      "decisionIds": [
        "D03",
        "E04"
      ]
    },
    {
      "id": "screenshot-slide-8",
      "tab": "المحادثة",
      "asset": "planning/landing-p0/reference-images/slides-7-8-pair.png",
      "source": "PDF p10",
      "mappingStatus": "direct PDF mapping",
      "approvalStatus": "reference_only",
      "decisionIds": [
        "D03",
        "E04"
      ]
    },
    {
      "id": "screenshot-slide-9",
      "tab": "القراءة",
      "asset": "planning/landing-p0/reference-images/slides-9-10-pair.png",
      "source": "PDF p11",
      "mappingStatus": "direct PDF mapping",
      "approvalStatus": "reference_only",
      "decisionIds": [
        "D03",
        "E04"
      ]
    },
    {
      "id": "screenshot-slide-10",
      "tab": "الكتابة",
      "asset": "planning/landing-p0/reference-images/slides-9-10-pair.png",
      "source": "PDF p11",
      "mappingStatus": "direct PDF mapping",
      "approvalStatus": "reference_only",
      "decisionIds": [
        "D03",
        "E04"
      ]
    },
    {
      "id": "screenshot-slide-11",
      "tab": "الصيغة والمعنى والاستخدام",
      "asset": "planning/landing-p0/reference-images/slides-11-12-pair.png",
      "source": "PDF p11",
      "mappingStatus": "direct PDF mapping",
      "approvalStatus": "reference_only",
      "decisionIds": [
        "D03",
        "E04"
      ]
    },
    {
      "id": "screenshot-slide-12",
      "tab": "الاستماع والمناقشة / التحدث عن الذات",
      "asset": "planning/landing-p0/reference-images/slides-11-12-pair.png",
      "source": "PDF p11",
      "mappingStatus": "D03 unresolved shared mapping",
      "approvalStatus": "reference_only",
      "decisionIds": [
        "D03",
        "E04"
      ]
    }
  ],
  "demoPrompts": [
    {
      "id": "reading-prompt",
      "source": "p12, p28 item 4",
      "text": null,
      "status": "exact approved English sentence missing; existing public reading demo is server-provided",
      "dependency": "D04",
      "suitability": "Reuse only after product/content review"
    },
    {
      "id": "speaking-prompt",
      "source": "p12, p28 item 4",
      "text": null,
      "status": "exact approved English prompt missing; existing roleplay demo advertises cafe conversation",
      "dependency": "D04",
      "suitability": "Cafe scenario is not an approved replacement sentence"
    }
  ]
} satisfies LandingContentContract;
