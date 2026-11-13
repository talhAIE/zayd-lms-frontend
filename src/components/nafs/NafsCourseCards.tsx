import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Atom, BookOpen, Calculator } from 'lucide-react';
import { nafsService, type NafsOwner } from '@/services/nafsService';
import type { NafsCourseView } from '@/types/nafs.contract';
import { useNafsOwner } from './useNafsSession';

interface Props {
  onCoursesChange?: (courses: NafsCourseView[]) => void;
  onStatusChange?: (status: 'loading' | 'hidden' | 'available' | 'error') => void;
}
export function NafsCourseCards({ onCoursesChange, onStatusChange }: Props) {
  const owner = useNafsOwner();
  useEffect(() => {
    if (!owner) onStatusChange?.('hidden');
  }, [owner, onStatusChange]);
  return owner ? (
    <Cards
      key={`${owner.id}:${owner.username}`}
      owner={owner}
      onCoursesChange={onCoursesChange}
      onStatusChange={onStatusChange}
    />
  ) : null;
}
function Cards({ owner, onCoursesChange, onStatusChange }: Props & { owner: NafsOwner }) {
  const [courses, setCourses] = useState<NafsCourseView[]>([]);
  const [failed, setFailed] = useState(false);
  const [retry, setRetry] = useState(0);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const controller = new AbortController();
    setFailed(false);
    setLoading(true);
    onStatusChange?.('loading');
    void nafsService
      .courses(owner, controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) {
          setCourses(data.courses);
          setLoading(false);
          onCoursesChange?.(data.courses);
          onStatusChange?.(data.courses.length ? 'available' : 'hidden');
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setFailed(true);
          setLoading(false);
          onCoursesChange?.([]);
          onStatusChange?.('error');
        }
      });
    return () => {
      controller.abort();
      onCoursesChange?.([]);
    };
  }, [owner, retry, onCoursesChange, onStatusChange]);
  if (loading) return <p role="status" className="text-sm text-slate-600">Loading NAFS courses…</p>;
  if (failed)
    return (
      <div role="status" className="text-sm text-slate-600">
        NAFS courses could not load.{' '}
        <button className="underline" onClick={() => setRetry((n) => n + 1)}>
          Retry loading NAFS
        </button>
      </div>
    );
  return (
    <>
      {courses.map((course) => {
        const Icon =
          course.subject === 'math'
            ? Calculator
            : course.subject === 'science'
              ? Atom
              : BookOpen;
        return (
          <article
            key={course.id}
            className="flex flex-col bg-white border border-[#F1F5F9] rounded-[24px] overflow-hidden shadow-[0px_4px_24px_rgba(0,0,0,0.02)]"
          >
            <div className="h-[168px] flex items-center justify-center bg-[#EFF5FF]">
              <Icon className="h-16 w-16 text-[#4F8DFB]" aria-hidden="true" />
            </div>
            <div className="p-5 flex flex-col gap-4 flex-grow">
              <span className="text-[11px] font-bold text-[#4F8DFB] uppercase tracking-wide">
                NAFS · Grade {course.gradeLabel}
              </span>
              <h3 className="text-[18px] font-bold text-[#282828]">
                {course.courseTitle}
              </h3>
              <p className="text-sm text-[#64748B]">
                Quiz Mode · {course.assessmentTitle} · {course.questionCount} questions
              </p>
              <p className="text-sm text-slate-600 mt-auto">
                {course.state === 'submitted'
                  ? 'Quiz completed'
                  : course.state === 'in_progress'
                    ? 'Quiz in progress · Continue your saved quiz'
                    : 'One attempt · Marks after finishing'}
              </p>
              <Link
                className="w-full min-h-[46px] px-3 py-3 bg-[#232E43] hover:bg-[#1a2333] text-white rounded-lg font-semibold text-sm text-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
                to={`/student/nafs/courses/${course.id}`}
              >
                Open course
              </Link>
            </div>
          </article>
        );
      })}
    </>
  );
}
