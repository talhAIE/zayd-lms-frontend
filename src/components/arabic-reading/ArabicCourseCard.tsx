import { BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';

/** Courses entry only; session access and content publication remain server-owned. */
export function ArabicCourseCard({ ready }: { ready: boolean }) {
  return <Link to="/student/arabic-reading" lang="ar" dir="rtl"
    className="flex min-w-0 flex-col overflow-hidden rounded-3xl border border-blue-100 bg-white shadow-sm transition hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600">
    <div className="flex h-[168px] items-center justify-center bg-blue-50">
      <BookOpen aria-hidden="true" className="h-16 w-16 text-blue-500" />
    </div>
    <div className="flex grow flex-col gap-4 p-5">
      <span className="text-xs font-semibold text-blue-600">نسخة تجريبية</span>
      <h3 className="text-xl font-bold text-[#232E43]">القراءة العربية</h3>
      <p className="text-sm text-slate-600">ثلاثة نصوص للاستماع والقراءة واختبار الفهم.</p>
      {!ready && <p className="text-sm text-slate-600">النصوص قيد الإعداد للمراجعة.</p>}
      <span className="mt-auto rounded-lg bg-blue-500 px-4 py-3 text-center text-sm font-semibold text-white">
        {ready ? 'ابدأ القراءة' : 'عرض النصوص'}
      </span>
    </div>
  </Link>;
}
