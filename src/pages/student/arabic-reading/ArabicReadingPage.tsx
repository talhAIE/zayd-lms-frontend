import { Link, useParams } from 'react-router-dom';
import { useEffect, useReducer } from 'react';
import { useAppSelector } from '../../../redux/hooks';
import { ArabicReadingShell } from '../../../components/arabic-reading/ArabicReadingShell';
import { ArabicReadingView } from '../../../components/arabic-reading/ArabicReadingView';
import { ARABIC_ACTIVITY_TITLES, arabicRouteGate } from '../../../components/arabic-reading/presentation';
import { useArabicReading } from '../../../hooks/arabic-reading/useArabicReading';
import { arabicBrowserOwner, type ArabicOwner } from '../../../utils/arabicReadingIdentity';
import type { ArabicActivityId } from '../../../types/arabic-reading.contract';
import { ARABIC_CLIENT_TEXT } from '../../../services/arabicReadingService';
import { ArabicRecorder } from '../../../components/arabic-reading/ArabicReadingControls';

function ArabicLive({owner,activityId}:{owner:ArabicOwner;activityId:ArabicActivityId|undefined}){
  const {screen,playback,recorder,busy,notice,actions}=useArabicReading(owner,activityId);
  return <>{notice&&<p className="ar-notice ar-live-notice" role="alert">{ARABIC_CLIENT_TEXT[notice]}</p>}
    <ArabicReadingView screen={screen} actions={actions} playback={playback} recorder={recorder} busy={busy}/>
    {screen.kind==='session'&&screen.session.phase!=='reading'&&['saved','reconciling'].includes(recorder.state)&&
      <ArabicRecorder recorder={recorder} actions={{discard:actions.discard}} busy={busy}/>}
    {screen.kind==='session'&&screen.session.phase==='quiz'&&<p className="ar-notice">التحقّق من الإجابات غير متاح حالياً.</p>}
  </>;
}
/** Default-off owned-server entry. No dev fixture or inferred grant/content approval. */
export default function ArabicReadingPage() {
  const {isAuthenticated, user} = useAppSelector(state => state.auth), {activityId} = useParams();
  const [,pulse]=useReducer(n=>n+1,0);
  useEffect(()=>{
    const changed=()=>pulse();window.addEventListener('storage',changed);window.addEventListener('focus',changed);
    const timer=setInterval(changed,1000);return()=>{clearInterval(timer);window.removeEventListener('storage',changed);window.removeEventListener('focus',changed);};
  },[]);
  const gate = arabicRouteGate(import.meta.env.VITE_LMS_ENABLE_ARABIC_READING === 'true', isAuthenticated, user?.role);
  const owner=gate==='ready'?arabicBrowserOwner():null;
  const validId=!activityId||Object.prototype.hasOwnProperty.call(ARABIC_ACTIVITY_TITLES,activityId);
  const code = gate === 'disabled' ? 'AR_DISABLED' : gate === 'login' ? 'AR_UNAUTHORIZED' : gate === 'denied' ? 'AR_NOT_FOUND'
    : !validId ? 'AR_NOT_FOUND' : 'AR_UNAVAILABLE';
  return <ArabicReadingShell>{owner&&validId?<ArabicLive key={`${owner.key}:${activityId??'chooser'}`} owner={owner} activityId={activityId as ArabicActivityId|undefined}/>:<ArabicReadingView screen={{kind:'error', code}} />}
    {gate === 'login' && <Link className="ar-primary" to="/login">تسجيل الدخول</Link>}
  </ArabicReadingShell>;
}
