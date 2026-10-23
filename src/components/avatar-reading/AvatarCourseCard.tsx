import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { avatarAvailability } from '@/services/avatarReadingService';
import { useAppSelector } from '@/redux/hooks';
import readingAvatar from '@/assets/svgs/reading-mode.png';

export function AvatarCourseCard() {
  const user = useAppSelector(state => state.auth.user);
  const [available, setAvailable] = useState(false);
  useEffect(() => {
    setAvailable(false);
    if (!user) return;
    const controller = new AbortController();
    void avatarAvailability(controller.signal).then(setAvailable).catch(() => { if (!controller.signal.aborted) setAvailable(false); });
    return () => controller.abort();
  }, [user?.id]);
  if (!available) return null;
  return <Link to="/student/3d-avatar" className="flex flex-col rounded-[24px] border border-blue-100 bg-gradient-to-br from-[#D5ECFF] to-[#EDE9FE] p-6 shadow-sm transition hover:shadow-md">
    <img src={readingAvatar} alt="" className="mb-5 h-24 w-24 rounded-2xl object-contain" />
    <h3 className="text-xl font-bold text-[#232E43]">3D Avatar Mode</h3>
    <p className="mt-2 text-sm text-[#526078]">Practise reading with a 3D avatar.</p>
    <span className="mt-6 rounded-lg bg-[#3B82F6] px-4 py-3 text-center text-sm font-semibold text-white">Start</span>
  </Link>;
}
