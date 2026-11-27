// Local-only synthetic layouts. No App, auth storage, actual microphone, learner API or cloud.
import { createRoot } from 'react-dom/client';
import { useEffect, useState } from 'react';
import { BrowserRouter, useLocation, useNavigate } from 'react-router-dom';
import '../../src/index.css';
import { ArabicReadingShell } from '../../src/components/arabic-reading/ArabicReadingShell';
import { ArabicReadingView } from '../../src/components/arabic-reading/ArabicReadingView';
import type { ArabicPlayback, ArabicRecorderView, ArabicReadingScreen, ArabicReadingActions } from '../../src/components/arabic-reading/presentation';
import { arabicActivityPath } from '../../src/components/arabic-reading/presentation';
import type { ArabicActivityId, ArabicErrorCode } from '../../src/types/arabic-reading.contract';
import { activities, ids, overview, syntheticSession } from './fixtures';

if (!import.meta.env.DEV || !['localhost','127.0.0.1'].includes(location.hostname)) throw new Error('Local preview only');
const query=new URLSearchParams(location.search),initial=query.get('scene')??'chooser';
function scene(kind:string,id:ArabicActivityId):ArabicReadingScreen {
  if(kind==='loading')return {kind:'loading'};
  if(kind==='error')return {kind:'error',code:(query.get('code')??'AR_SPEECH_UNAVAILABLE') as ArabicErrorCode};
  if(kind==='overview')return {kind:'overview',overview:overview(id)};
  if(['listen','reading','quiz','completed'].includes(kind))return {kind:'session',session:syntheticSession(id,kind as 'listen',query.get('long')==='true')};
  return {kind:'chooser',activities:query.get('unavailable')==='true'?activities.map(a=>({...a,available:false})):activities};
}
export function Harness(){
  const navigate=useNavigate(),location=useLocation(),id=ids.find(id=>location.pathname.endsWith(id))??ids[Number(query.get('activity')??1)-1]??ids[0];
  const [screen,setScreen]=useState<ArabicReadingScreen>(()=>scene(initial,id));
  const [playback,setPlayback]=useState<ArabicPlayback>({target:null,state:'idle',position:0,duration:12,passageEnded:false});
  const [recorder,setRecorder]=useState<ArabicRecorderView>({state:query.get('recorder') as ArabicRecorderView['state']??'idle',seconds:12});
  const [busy,setBusy]=useState(false);
  useEffect(()=>{if(location.pathname.startsWith('/student/arabic-reading/'))setScreen({kind:'overview',overview:overview(id)});
    else if(location.pathname==='/student/arabic-reading')setScreen({kind:'chooser',activities});},[location.pathname,id]);
  const actions:ArabicReadingActions={
    choose:id=>navigate(arabicActivityPath(id)),start:id=>setScreen({kind:'session',session:syntheticSession(id,'listen',query.get('long')==='true')}),
    back:()=>navigate('/student/arabic-reading'),retry:()=>setScreen({kind:'chooser',activities}),
    play:target=>setPlayback(p=>({...p,target,state:query.get('audio')==='unavailable'?'unavailable':query.get('audio')==='loading'?'loading':p.state==='playing'?'paused':'playing',
      passageEnded:(target.kind==='passage' && !['loading','unavailable'].includes(query.get('audio')??'')) || p.passageEnded,position:target.kind==='passage'?12:0})),
    seek:position=>setPlayback(p=>({...p,position})),listen:()=>setScreen({kind:'session',session:syntheticSession(id,'reading')}),
    record:()=>setRecorder({state:'recording',seconds:12}),stop:()=>setRecorder({state:'ready',seconds:12}),cancel:()=>setRecorder({state:'idle',seconds:0}),
    discard:()=>setRecorder({state:'idle',seconds:0}),resend:()=>setRecorder({state:'ready',seconds:12}),
    send:()=>{setRecorder({state:'uploading',seconds:12});setBusy(true);window.setTimeout(()=>{setBusy(false);setRecorder({state:'idle',seconds:0});setScreen({kind:'session',session:syntheticSession(id,'quiz')});},50);},
    check:(questionId,optionId)=>setScreen(s=>s.kind==='session'&&s.session.phase==='quiz'?{kind:'session',session:{...s.session,
      checkedAnswers:[...s.session.checkedAnswers.filter(a=>a.questionId!==questionId),{questionId,selectedOptionId:optionId,isCorrect:optionId.endsWith('-o0'),responseId:'synthetic-check'}]}}:s),
    finish:()=>setScreen({kind:'session',session:syntheticSession(id,'completed')}),retake:()=>{setPlayback(p=>({...p,passageEnded:false}));setScreen({kind:'session',session:syntheticSession(id,'listen')});},
  };
  return <ArabicReadingShell><p className="ar-preview" role="note">معاينة محلية بنص تجريبي؛ لا تُسجّل نتائج فعلية.</p><ArabicReadingView screen={screen} actions={actions} playback={playback} recorder={recorder} busy={busy}/></ArabicReadingShell>;
}
createRoot(document.getElementById('root')!).render(<BrowserRouter><Harness /></BrowserRouter>);
