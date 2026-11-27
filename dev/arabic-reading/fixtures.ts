/** Synthetic presentation fixtures only. Never import from src/ or attribute this text/quiz to the PDF. */
import type { ArabicActivityId, ArabicActivityOverview, ArabicActivitySummary, ArabicSessionView, ArabicReadingFeedback } from '../../src/types/arabic-reading.contract';
import { ARABIC_ACTIVITY_TITLES } from '../../src/components/arabic-reading/presentation';
export const ids = Object.keys(ARABIC_ACTIVITY_TITLES) as ArabicActivityId[];
export const profile = {language:'ar', direction:'rtl', speechLocale:'ar-SA', voice:'ar-SA-HamedNeural', speakingStyle:null, prosodySupported:false} as const;
export const activities: ArabicActivitySummary[] = ids.map((id, index) => ({id,title:ARABIC_ACTIVITY_TITLES[id],questionCount:[10,6,9][index],state:'not_started',sessionId:null,available:true}));
export const overview = (id: ArabicActivityId): ArabicActivityOverview => ({activity:activities.find(a=>a.id===id)!,profile,
  instructions:['استمع إلى النص كاملاً، ثم اقرأ الجمل بصوت واضح.','يمكنك إعادة تشغيل الجملة والاستفادة من الملاحظات.','أجب عن جميع الأسئلة وتحقّق من صحة إجاباتك قبل الإنهاء.']});
export const feedback: ArabicReadingFeedback = {chunkId:'demo-chunk',status:'retry',text:'استمع إلى الجملة ثم حاول قراءتها مرة أخرى.',
  assessment:{available:false,accuracy:null,fluency:null,completeness:null,pronunciation:null},vocabulary:null};
export function syntheticSession(id: ArabicActivityId, phase: ArabicSessionView['phase'], long = false): ArabicSessionView {
  const content = 'هٰذا نَصٌّ تَجْرِيبِيٌّ لِفَحْصِ وُضُوحِ الْحُرُوفِ وَالْحَرَكَاتِ. بلغت النسبة ١٢٫٥٪ في عام ٢٠٢٦، ثم ظهرت القيمة 12.5% في المثال.';
  const base = {id:`synthetic-session-${id}`,activityId:id,title:ARABIC_ACTIVITY_TITLES[id],versionId:'synthetic-layout-only',runNumber:1,revision:1,profile,
    passage:Array.from({length:long?18:3},(_,i)=>({id:`block-${i}`,kind:'paragraph' as const,text:content})),hasListened:phase!=='listen',
    startedAt:'2026-11-27T00:00:00.000Z',lastSavedAt:'2026-11-27T00:00:00.000Z',messages:[
      {id:'coach-1',sequence:1,sender:'coach' as const,text:'اقرأ الجملة المعروضة بصوت واضح.',createdAt:'2026-11-27T00:00:00.000Z',clientAttemptId:null,feedback:null},
      {id:'learner-1',sequence:2,sender:'learner' as const,text:'هذا نص تجريبي لقراءة الحركات.',createdAt:'2026-11-27T00:00:00.000Z',clientAttemptId:'synthetic-attempt',feedback:null},
      {id:'coach-2',sequence:3,sender:'coach' as const,text:feedback.text,createdAt:'2026-11-27T00:00:00.000Z',clientAttemptId:'synthetic-attempt',feedback},
    ]};
  if(phase==='listen')return {...base,phase,currentChunk:null,feedback:null};
  if(phase==='reading')return {...base,phase,currentChunk:{id:'demo-chunk',text:content},feedback,attemptedCount:1,acceptedCount:0,failedCount:0,totalChunks:3};
  if(phase==='quiz')return {...base,phase,questions:Array.from({length:activities.find(a=>a.id===id)!.questionCount},(_,i)=>({
    id:`demo-q${i+1}`,number:(id==='ar-reading-01'?1:id==='ar-reading-02'?11:17)+i,prompt:'أي عبارة تصف هذا العرض التجريبي؟',
    options:['مثال لعرض القراءة العربية','مثال لعرض الحساب','مثال لعرض الرسم','مثال لعرض الألوان'].map((text,j)=>({id:`demo-q${i+1}-o${j}`,label:['أ','ب','ج','د'][j] as 'أ'|'ب'|'ج'|'د',text})),
  })),checkedAnswers:[]};
  return {...base,phase,completedAt:'2026-11-27T00:00:00.000Z',result:{correctCount:activities.find(a=>a.id===id)!.questionCount,totalQuestions:activities.find(a=>a.id===id)!.questionCount}};
}
