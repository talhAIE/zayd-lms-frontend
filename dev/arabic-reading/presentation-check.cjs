// Offline boundaries and actual React server rendering. No browser, API, recording or source keys.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const load=require('../load-tsx.cjs'),{renderToStaticMarkup}=require('react-dom/server'),React=require('react');
const root=path.resolve(__dirname,'../..'),p=load(path.join(root,'src/components/arabic-reading/presentation.ts'));
let checks=0;const check=(value,message)=>{assert(value,message);checks++;};
check(p.arabicRouteGate(false,true,'student')==='disabled','Default-off gate precedes account shortcuts');
check(p.arabicRouteGate(true,false,'student')==='login','Authentication required');
for(const role of ['teacher','admin','nafs_school_admin',undefined])check(p.arabicRouteGate(true,true,role)==='denied','Other modes/roles never imply access');
check(p.arabicRouteGate(true,true,'STUDENT')==='ready','Student shell readiness is not a tester grant');
check(Object.keys(p.ARABIC_ACTIVITY_TITLES).length===3,'Exactly three catalog entries');
check(Object.values(p.ARABIC_ERROR_TEXT).every(text=>/\p{Script=Arabic}/u.test(text)&&!/[A-Za-z]/.test(text)),'Every contract error is localized');
check(p.arabicTime(30)==='٠:٣٠','Arabic recording timer');
const {ArabicSourceText}=load(path.join(root,'src/components/arabic-reading/ArabicSourceText.tsx'));
const original='قَرَأَ ١٢٫٥٪ في ٢٠٢٦ ثم 12.5% <script>خطأ</script>';
const html=renderToStaticMarkup(React.createElement(ArabicSourceText,{text:original}));
check((html.match(/<bdi dir="ltr">/g)||[]).length===3,'Numeral runs isolated');
check(!html.includes('<script>')&&html.includes('&lt;script&gt;'),'Source renders as escaped text');
check(html.includes('قَرَأَ')&&html.includes('١٢٫٥٪')&&html.includes('12.5%'),'Diacritics and exact numerals retained');
const contract=load(path.join(root,'src/types/arabic-reading.contract.ts'));
const {ArabicFeedbackDetails}=load(path.join(root,'src/components/arabic-reading/ArabicReadingControls.tsx'),{'./presentation':p,'../../types/arabic-reading.contract':contract});
const feedback={chunkId:'unit-only',status:'retry',text:'ملاحظة تجريبية',vocabulary:null,assessment:{available:true,accuracy:0,fluency:null,completeness:null,pronunciation:null}};
const scores=renderToStaticMarkup(React.createElement(ArabicFeedbackDetails,{feedback}));
check(scores.includes('٠ من ١٠٠')&&(scores.match(/غير متاح/g)||[]).length===3,'Genuine score zero stays zero; absent scores stay unavailable');
const components=path.join(root,'src/components/arabic-reading');
for(const file of fs.readdirSync(components).filter(f=>/\.tsx?$/.test(f))){
  const source=fs.readFileSync(path.join(components,file),'utf8').replace(/\/\*[\s\S]*?\*\//g,'');
  check(!/StudentLayout|useModeSession|useLearningProgressRefresh|ApiConfig|socket\.io|localStorage|sessionStorage|getUserMedia|fetch\(|axios|navigator\.sendBeacon/.test(source),'Isolated presentation: '+file);
  check(!/from\s+['"][^'"]*dev\/|privateSnapshotJson|answer-key|content\/arabic-reading/.test(source),'No synthetic/private data imports: '+file);
}
const routes=fs.readFileSync(path.join(root,'src/routes/index.tsx'),'utf8');
for(const route of ['/student/arabic-reading','/student/arabic-reading/:activityId'])
  check(routes.includes(`path="${route}" element={<ArabicReadingPage />}`),'Independent shell route '+route);
const page=fs.readFileSync(path.join(root,'src/pages/student/arabic-reading/ArabicReadingPage.tsx'),'utf8');
check(page.includes("VITE_LMS_ENABLE_ARABIC_READING === 'true'"),'Explicit default-off client flag');
check(!/from\s+['"][^'"]*dev\/|syntheticSession\(|fixtures|StudentLayout|ApiConfig|getUserMedia/.test(page.replace(/\/\*[\s\S]*?\*\//g,'')),'Production entry has no synthetic provider/transport/engagement');
const css=fs.readFileSync(path.join(components,'arabic-reading.css'),'utf8');
check(/prefers-reduced-motion: reduce/.test(css)&&/animation: none !important/.test(css),'Reduced motion');
check(!/:root|^body\s*\{|^html\s*\{|^button\s*\{/m.test(css),'No global style overrides');
console.log(JSON.stringify({passed:true,checks}));
