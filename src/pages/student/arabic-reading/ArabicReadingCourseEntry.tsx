import { useEffect, useReducer, useState } from 'react';
import { useAppSelector } from '../../../redux/hooks';
import { ArabicCourseCard } from '../../../components/arabic-reading/ArabicCourseCard';
import { ArabicReadingApi } from '../../../services/arabicReadingService';
import { arabicBrowserOwner } from '../../../utils/arabicReadingIdentity';

export type ArabicCourseStatus = 'loading' | 'hidden' | 'visible';

export function ArabicReadingCourseEntry({ onStatusChange }: { onStatusChange: (status: ArabicCourseStatus) => void }) {
  const user = useAppSelector(state => state.auth.user);
  const [, changed] = useReducer(n => n + 1, 0);
  useEffect(() => {
    const update = () => changed();
    window.addEventListener('storage', update); window.addEventListener('focus', update);
    return () => { window.removeEventListener('storage', update); window.removeEventListener('focus', update); };
  }, []);
  const owner = import.meta.env.VITE_LMS_ENABLE_ARABIC_READING === 'true' && user?.role?.toLowerCase() === 'student'
    ? arabicBrowserOwner() : null;
  const ownerKey = owner?.id === user?.id ? owner?.key : undefined;
  const [discovery, setDiscovery] = useState<{ ownerKey: string; ready: boolean }>();

  useEffect(() => {
    if (!ownerKey) { onStatusChange('hidden'); return; }
    const abort = new AbortController();
    const current = () => !abort.signal.aborted && arabicBrowserOwner()?.key === ownerKey;
    const service = new ArabicReadingApi(current);
    onStatusChange('loading');
    void service.discovery(abort.signal).then(value => {
      if (!current()) return;
      setDiscovery({ ownerKey, ready: value.activities.some(activity => activity.available) });
      onStatusChange('visible');
    }).catch(() => {
      if (!current()) return;
      setDiscovery(undefined);
      onStatusChange('hidden');
    });
    return () => abort.abort();
  }, [ownerKey, onStatusChange]);

  return ownerKey && discovery?.ownerKey === ownerKey ? <ArabicCourseCard ready={discovery.ready} /> : null;
}
