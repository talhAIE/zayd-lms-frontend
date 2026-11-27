import { Link, useParams } from 'react-router-dom';
import { useAppSelector } from '../../../redux/hooks';
import { ArabicReadingShell } from '../../../components/arabic-reading/ArabicReadingShell';
import { ArabicReadingView } from '../../../components/arabic-reading/ArabicReadingView';
import { ARABIC_ACTIVITY_TITLES, arabicRouteGate } from '../../../components/arabic-reading/presentation';

/** Default-off production entry. Real owned-session transport is connected in Phase 6.
 * Never import a dev fixture here or fabricate an authorized/published activity.
 */
export default function ArabicReadingPage() {
  const {isAuthenticated, user} = useAppSelector(state => state.auth), {activityId} = useParams();
  const gate = arabicRouteGate(import.meta.env.VITE_LMS_ENABLE_ARABIC_READING === 'true', isAuthenticated, user?.role);
  const code = gate === 'disabled' ? 'AR_DISABLED' : gate === 'login' ? 'AR_UNAUTHORIZED' : gate === 'denied' ? 'AR_NOT_FOUND'
    : activityId && !Object.prototype.hasOwnProperty.call(ARABIC_ACTIVITY_TITLES, activityId) ? 'AR_NOT_FOUND' : 'AR_UNAVAILABLE';
  return <ArabicReadingShell><ArabicReadingView screen={{kind:'error', code}} />
    {gate === 'login' && <Link className="ar-primary" to="/login">تسجيل الدخول</Link>}
  </ArabicReadingShell>;
}
