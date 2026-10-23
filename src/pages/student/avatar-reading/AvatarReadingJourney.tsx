import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import readingAvatar from '@/assets/svgs/reading-mode.png';
import { useAppSelector } from '@/redux/hooks';
import { AvatarReadingContext } from '@/components/avatar-reading/AvatarReadingContext';
import { avatarAvailability, avatarReadingTopics, createAvatarReadingTransport, type AvatarReadingTopic } from '@/services/avatarReadingService';
import ReadingModeTopics from '@/pages/student/topics/ReadingModeTopics';

function AvatarAccess({ children }: { children: ReactNode }) {
  const user = useAppSelector(state => state.auth.user);
  const [status, setStatus] = useState<'loading' | 'available' | 'unavailable' | 'error'>('loading');
  useEffect(() => {
    const controller = new AbortController();
    setStatus('loading');
    void avatarAvailability(controller.signal).then(value => setStatus(value ? 'available' : 'unavailable'))
      .catch(() => { if (!controller.signal.aborted) setStatus('error'); });
    return () => controller.abort();
  }, [user?.id]);
  if (status !== 'available') return <div className="rounded-2xl border bg-white p-8" role="status">
    <p>{status === 'loading' ? 'Loading 3D Avatar Mode…' : status === 'error' ? 'Unable to load 3D Avatar Mode. Please reload to try again.' : '3D Avatar Mode is not enabled for this account.'}</p>
    <Link to="/student/courses" className="mt-4 inline-block text-blue-600">Back to courses</Link>
  </div>;
  return <>{children}</>;
}

export function AvatarModePage() {
  return <AvatarAccess><div className="mx-auto w-full max-w-[1200px] space-y-8">
    <Link to="/student/courses" className="flex items-center gap-2 text-sm"><ChevronLeft /> Back to courses</Link>
    <h1 className="text-2xl font-bold">3D Avatar Mode</h1>
    <Link to="/student/3d-avatar/reading" className="flex flex-wrap items-center gap-5 rounded-3xl bg-gradient-to-r from-[#D5ECFF] to-[#EDE9FE] p-6 md:p-10">
      <img src={readingAvatar} alt="" className="h-28 w-28 rounded-2xl object-contain" />
      <div className="flex-1"><h2 className="text-xl font-bold">3D Reading</h2><p className="mt-2 text-sm text-slate-600">Reading practice with avatar playback.</p></div>
      <span className="rounded-xl bg-[#1689DD] px-10 py-3 font-semibold text-white">Start</span>
    </Link>
  </div></AvatarAccess>;
}

function useTopics() {
  const user = useAppSelector(state => state.auth.user);
  const [topics, setTopics] = useState<AvatarReadingTopic[] | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    setTopics(null); setError(false);
    void avatarReadingTopics(controller.signal).then(setTopics).catch(() => { if (!controller.signal.aborted) setError(true); });
    return () => controller.abort();
  }, [user?.id]);
  return { topics, error };
}

export function AvatarTopicsPage() {
  const { topics, error } = useTopics();
  return <AvatarAccess><div className="mx-auto w-full max-w-[1200px] space-y-8">
    <Link to="/student/3d-avatar" className="flex items-center gap-2 text-sm"><ChevronLeft /> Back to 3D Avatar Mode</Link>
    <h1 className="text-2xl font-bold">3D Reading</h1>
    {error && <p role="alert">Unable to load topics. Please reload to try again.</p>}
    {!topics && !error && <p role="status">Loading topics…</p>}
    {topics?.length === 0 && <p>No 3D Reading topics are available.</p>}
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {topics?.map(topic => <Link key={topic.id} to={`/student/3d-avatar/reading/${topic.id}`} className="overflow-hidden rounded-3xl border border-slate-100 bg-white p-4 shadow-sm transition hover:shadow-md">
        <div className="relative h-56 overflow-hidden rounded-2xl bg-blue-50">
          {topic.imageUrl && <img src={topic.imageUrl} alt="" className="h-full w-full object-cover" />}
          <span className="absolute left-3 top-3 rounded-xl bg-slate-700/75 px-3 py-2 text-xs font-semibold text-white">{topic.completed ? 'Completed' : 'Incomplete'}</span>
          <span className="absolute bottom-3 right-3 rounded-xl bg-[#1689DD] px-7 py-2 text-sm font-semibold text-white">{topic.completed ? 'Practise again' : 'Start'}</span>
        </div>
        <h2 className="mt-4 font-bold">{topic.title}</h2>
      </Link>)}
    </div>
  </div></AvatarAccess>;
}

export function AvatarReadingPage() {
  const { topicId } = useParams();
  const user = useAppSelector(state => state.auth.user);
  const { topics, error } = useTopics();
  const transport = useMemo(() => createAvatarReadingTransport(user?.id ?? ''), [user?.id]);
  const topic = topics?.find(t => t.id === topicId);
  return <AvatarAccess>
    {!topic ? <p role="status">{error ? 'Unable to load this topic. Please reload to try again.' : topics ? 'Topic not found.' : 'Loading topic…'}</p> :
      <AvatarReadingContext.Provider value={transport}>
        <ReadingModeTopics key={`${user?.id}:${topic.id}`} avatar={{ topicId: topic.id, title: topic.title }} />
      </AvatarReadingContext.Provider>}
  </AvatarAccess>;
}
