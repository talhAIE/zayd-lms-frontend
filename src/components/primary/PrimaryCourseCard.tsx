import { useEffect, useMemo, useState } from 'react';
import { BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAppSelector } from '@/redux/hooks';
import { primaryApi, type PrimaryLesson } from '@/services/primaryService';

export function usePrimaryAccount() {
  const { user, isAuthenticated, refreshToken } = useAppSelector((state) => state.auth);
  const { id, username, role } = user ?? {};
  return useMemo(() => (
    isAuthenticated && role === 'student' && id && username
      ? { api: primaryApi({ id, username }), key: crypto.randomUUID() }
      : null
  ), [id, username, role, isAuthenticated, refreshToken]);
}

export function PrimaryCourseCard({ onAvailabilityChange }: { onAvailabilityChange: (available: boolean) => void }) {
  const account = usePrimaryAccount();
  const [result, setResult] = useState<{ key: string; lesson: PrimaryLesson } | null>(null);
  useEffect(() => {
    if (!account) return;
    const controller = new AbortController();
    void account.api.availability(controller.signal).then((availability) => {
      if (availability.available) setResult({ key: account.key, lesson: availability.lesson });
    }).catch(() => {
      // Primary discovery is optional and does not block curriculum courses.
    });
    return () => controller.abort();
  }, [account]);

  const lesson = result?.key === account?.key ? result?.lesson : undefined;
  useEffect(() => onAvailabilityChange(Boolean(lesson)), [lesson, onAvailabilityChange]);
  if (!lesson) return null;

  return (
    <Link to={`/student/primary/${encodeURIComponent(lesson.id)}`} className="flex flex-col rounded-[24px] border border-blue-100 bg-gradient-to-br from-[#D5ECFF] to-[#EDE9FE] p-6 shadow-sm transition hover:shadow-md">
      <div className="mb-5 flex h-24 w-24 items-center justify-center rounded-2xl bg-white/70 text-blue-600">
        <BookOpen className="h-10 w-10" aria-hidden="true" />
      </div>
      <h3 className="text-xl font-bold text-[#232E43]">Primary</h3>
      <p className="mt-2 text-sm text-[#526078]">Grade {lesson.grade} · {lesson.title}</p>
      <span className="mt-6 rounded-lg bg-[#3B82F6] px-4 py-3 text-center text-sm font-semibold text-white">Open lesson</span>
    </Link>
  );
}
