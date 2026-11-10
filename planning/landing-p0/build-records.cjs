// Generate planning-only typed data and traceability records from the reviewed plan.
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname,'../..');
const plan = fs.readFileSync(path.join(root,'LANDING_PAGE_IMPLEMENTATION_PLAN.md'),'utf8');
const manifest = JSON.parse(fs.readFileSync(path.join(__dirname,'source-manifest.json'),'utf8'));
const inventory = JSON.parse(fs.readFileSync(path.join(__dirname,'asset-inventory.json'),'utf8'));
let phase='';
const requirements=[];
const decisions=[];
const owner='User — product decision-maker; no other human assignee supplied';
const records={
  D01:{status:'deferred_by_user',owner,evidence:'User reply in this chat: Keep this decision unresolved for now',nextAction:'Do not change the topic value in P1. Continue independent P1 work; keep S3-TOPICS open.',blocks:['P1:S3-TOPICS completion','P6:S8-BODY final count','P7:topic benefits','P9:FAQ7 topic count']},
  D02:{status:'specified_default_no_alternative_approved',owner:'Frontend implementer — follow explicit PDF styles; user owns any alternative',evidence:'PDF pp7,15 supply concrete container/card styles. No bespoke alternative supplied.',nextAction:'Implement supplied styles when P2/P6 is authorized. Do not require optional aesthetic approval before coding.',blocks:[]},
  D03:{status:'awaiting_product_decision',owner,evidence:'PDF pp10-11 maps two reading screenshots and shares debate for discussion/self-expression; p28 asks for mapping/language confirmation.',nextAction:'Confirm self-expression mapping and English UI acceptability. Proposed Reading primary=slide9, secondary=slide5; Discussion=slide12; Self-expression reuse remains unapproved.',blocks:['P3 final screenshot mapping']},
  D04:{status:'missing_approved_prompts',owner,evidence:'PDF p28 item4 asks for exact one-to-two English samples; none supplied in repository landing content.',nextAction:'Provide/review one Reading sentence and one Speaking prompt. Existing cafe scenario is a candidate, not approved prompt copy.',blocks:['P5 final content']},
  D05:{status:'proposed_copy_and_layout_unapproved',owner,evidence:'PDF pp13-14 explicitly labels four Arabic feature texts proposed; p28 asks about ten cards.',nextAction:'Review supplied Arabic proposals and confirm integrated ten cards or six-plus-four grouping. Six-plus-four is an implementation recommendation only.',blocks:['P4 four additions final content/layout']},
  D06:{status:'unverified_metrics_and_missing_lessons_total',owner,evidence:'PDF p28 gives 2500+ students and 5000+ hours or 300000+ minutes, while p18 repeats stale totals.',nextAction:'Confirm reporting date/scope, hours vs minutes and updated completed-lessons value. No live backend/data access was used.',blocks:['P6 final impact totals']},
  D07:{status:'specified_copy_with_review_request_open',owner,evidence:'PDF p19 final row supplies up-to-50% wording; p28 still requests confirmation.',nextAction:'Use detailed supplied copy in a P7 review build, record content confirmation before publishing. Not a prerequisite for P1.',blocks:['P7 release copy signoff']},
  D08:{status:'placement_and_optional_graphics_unapproved',owner,evidence:'PDF p23 supplies all three cards; pp28-29 asks inside vs below Schools and whether screenshots accompany them.',nextAction:'Proposed order Schools → Smart Dashboards → banner → FAQ. Confirm placement and optional graphics; do not build live admin/redeem/nudge functionality.',blocks:['P8 final composition']},
  D09:{status:'supplied_drafts_pending_review',owner,evidence:'PDF p22 final banner ends استخدامها; p29 asks final word and approval of all nine supplied answers.',nextAction:'Use updated detailed banner/FAQ drafts for review. Do not label supplied drafts business-approved.',blocks:['P8 banner final copy','P9 FAQ release copy']},
  D10:{status:'missing_official_contacts',owner,evidence:'PDF p29 asks for official email, phone/WhatsApp and socials. Current footer uses placeholders.',nextAction:'Supply official details. Keep current footer layout; no invented official email/number/social accounts.',blocks:['P9 official footer data']},
  E01:{status:'missing_audio_and_transcripts',owner,nextAction:'Supply six approved preview clips and transcripts, including “other situations”, or a documented public preview endpoint.',evidence:'No dialogue audio in src/public. Only media file is public/avatar/placeholder.mp4.',blocks:['P6 scenario audio completion']},
  E02:{status:'integration_unverified',owner:'Frontend implementer — verify adapter when P5 authorized; user owns sample-vs-live product choice',nextAction:'Reuse guest transport where possible; validate actual score/word data in P5. Label any sample as sample; never hardcode visitor score 92.',evidence:'Guest reading/roleplay transport exists, but no live endpoint or microphone was invoked in P0.',blocks:['P5 measured feedback completion']},
  E03:{status:'destination_proposed_not_approved',owner,nextAction:'Choose valid onboarding/demo route for pricing/final CTA. /login is the existing hero route and recommended interim candidate, not an approved change.',evidence:'Pricing/final links point at absent /auth/register route. Browser observation records Home fallback.',blocks:['P7 conversion routing','P9 final CTA routing']},
  E04:{status:'paired_reference_available_originals_missing',owner,nextAction:'Review embedded paired references, obtain original exports if needed, confirm mapping and privacy before production assets are chosen.',evidence:'PDF pp10-11 supplies four 1834×522 paired PNGs; originals/PowerPoint not supplied.',blocks:['P3 final screenshot quality']},
};
for(const line of plan.split('\n')) {
  const p=line.match(/^## (P\d+) —/);if(p)phase=p[1];
  const r=line.match(/^- \[([ x])\] \*\*([^*]+)\*\* — (.*)/);
  if(r)requirements.push({id:r[2],phase,detail:r[3],status:r[1]==='x'?'planning_complete':'not_implemented',evidence:r[1]==='x'?['planning/landing-p0/README.md']:[]});
  const d=line.match(/^\*\*([DE]\d+) — (.*?)\.\*\* (.*)/);
  if(d)decisions.push({id:d[1],title:d[2],specificationContext:d[3],...records[d[1]]});
}
const faqPart=plan.split('## Appendix A —')[1].split('## Appendix B —')[0];
// Split on headings rather than the multiline end anchor, retaining full paragraph/list bodies.
const faqBlocks=faqPart.split(/^### /m).slice(1).map(block=>{const [head,...body]=block.split('\n');const m=head.match(/^(\d+)\. (.*)/);return {id:'faq-'+m[1],question:m[2],answerMarkdown:body.join('\n').trim(),status:'supplied_draft',source:m[1]==='9'?'PDF p26':'PDF pp24-25'};});
const value=(value,status,source,decisionIds=[])=>({value,status,source,decisionIds});
const content={
  sourceSha256:manifest.pdf.sha256,approvalMeaning:'specified = stated final requirement, not verification of business claims; supplied_draft/proposed/unresolved are never approved',
  hero:{
    body:value('زيد معلّم ذكي لممارسة اللغة الإنجليزية، يمنح كل طالب تجربة مخصصة للتحدث والقراءة والاستماع والكتابة، مع تغذية راجعة فورية ومحتوى متناغم مع ما يتعلمه في المدرسة.','specified','PDF p4 callout4'),
    primaryCta:value('جرب زيد Zayd الآن','specified','PDF p4 callout5'),
    secondaryCta:value('زيد Zayd للمدارس','specified','PDF p4 callout6'),
  },
  metricSubtitles:{clock:value('أسبوعيًا لممارسة الإنجليزية','specified','PDF p5 callout1'),topics:value('موضوعًا وموقفًا من الحياة','specified','PDF p5 callout2'),multiplier:value('لممارسة الإنجليزية','specified','PDF p5 callout3')},
  topicCount:{currentObserved:value(40,'observed','hero-section.tsx / zayd-life-section.tsx / pricing-section.tsx'),proposedHero:value(250,'specified','PDF p5',['D01']),approvedUnified:value(null,'unresolved','User explicitly deferred decision',['D01']),action:'Preserve existing value until D01 resolves; do not mark S3-TOPICS complete'},
  impact:{students:value(2500,'proposed','PDF p28 item6',['D06']),practiceHours:value(5000,'proposed','PDF p28 item6',['D06']),practiceMinutesEquivalent:value(300000,'proposed','PDF p28 item6',['D06']),displayUnit:value(null,'unresolved','PDF p28 item6',['D06']),completedLessons:value(null,'unresolved','PDF p28 missing replacement for old 8600',['D06'])},
  unitLabels:{currency:'SAR',annual:'سنة',students:'طالب مسجل',hours:'ساعة ممارسة',minutes:'دقيقة ممارسة',lessons:'درس منجز'},
  pricing:{
    subtitle:value('خصم يصل إلى 50% حاليًا على الباقات الثلاث للأفراد.','specified','PDF p19 final row',['D07']),
    plans:[
      {id:'curriculum',title:'باقة المنهج',originalPrice:299,activePrice:199,discountPercent:33,period:'year',currency:'SAR',description:'إذا كان هدفك تحسين أدائك في مناهج المدرسة',action:'ابدأ باقة المنهج',status:'specified',source:'PDF p19'},
      {id:'plus',title:'Zayd Plus',originalPrice:599,activePrice:299,discountPercent:50,period:'year',currency:'SAR',description:'التجربة الكاملة: المنهج الدراسي، والمواضيع والمواقف الحياتية.',action:'اختر Zayd Plus',status:'specified',source:'PDF p20'},
      {id:'life',title:'Zayd Life',originalPrice:299,activePrice:199,discountPercent:33,period:'year',currency:'SAR',description:'إذا كان هدفك استخدام الإنجليزية في الحياة اليومية',action:'ابدأ Zayd Life',status:'specified',source:'PDF p20'},
    ],
    topicBenefits:value(null,'unresolved','Unified topic-dependent benefits need D01',['D01']),destination:value(null,'unresolved','Absent registration route; existing login candidate only',['E03']),
  },
  faqEntries:faqBlocks,
  banner:value('الطالب لا يحتاج إلى مزيد من شرح الإنجليزية بقدر ما يحتاج إلى المزيد من استخدامها.','supplied_draft','PDF p22 final row; p29 review request',['D09']),
  footer:{email:value(null,'missing','PDF p29 item10',['D10']),phone:value(null,'missing','PDF p29 item10',['D10']),socialUrls:value(null,'missing','PDF p29 item10',['D10'])},
  screenshotMappings:inventory.requiredScreenshotReferences.map(s=>({id:s.id,tab:s.tab,asset:s.source.file,source:'PDF p'+s.source.pdfPage,mappingStatus:s.mappingStatus,approvalStatus:'reference_only',decisionIds:['D03','E04']})),
  demoPrompts:inventory.requiredDemoPrompts,
};
fs.writeFileSync(path.join(__dirname,'decisions.json'),JSON.stringify({recordedAt:new Date().toISOString(),sourcePdfSha256:manifest.pdf.sha256,decisions},null,2)+'\n');
fs.writeFileSync(path.join(__dirname,'requirements.json'),JSON.stringify({sourcePdfSha256:manifest.pdf.sha256,requirements},null,2)+'\n');
fs.writeFileSync(path.join(__dirname,'content-data.json'),JSON.stringify(content,null,2)+'\n');
const contract=`/** Planning-only contract. Not imported by src, not a P1 implementation. */
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
export const landingContentContract = ${JSON.stringify(content,null,2)} satisfies LandingContentContract;
`;
fs.writeFileSync(path.join(__dirname,'content-contract.ts'),contract);
console.log(JSON.stringify({requirements:requirements.length,decisions:decisions.length,faqEntries:faqBlocks.length,sourceSha256:manifest.pdf.sha256,applicationImports:0},null,2));
