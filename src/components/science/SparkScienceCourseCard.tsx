import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useScienceOwner } from "./ScienceSession";
import {
  sparkScienceService,
  type SparkCourse,
} from "@/services/sparkScienceService";
import type { ScienceOwner } from "@/services/scienceSparkService";

import { SPARK_COURSE_PATH } from "@/utils/sparkScienceNavigation";
export { SPARK_COURSE_PATH, SPARK_UNIT_PATH } from "@/utils/sparkScienceNavigation";
export const SPARK_COURSE_IMAGE =
  "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&q=80";

export function SparkScienceCourseCard({
  onCourseChange,
}: {
  onCourseChange?: (course: SparkCourse | null) => void;
}) {
  const owner = useScienceOwner();
  useEffect(() => {
    if (!owner) onCourseChange?.(null);
  }, [owner, onCourseChange]);
  return owner ? (
    <Card
      key={owner.sessionKey}
      owner={owner}
      onCourseChange={onCourseChange}
    />
  ) : null;
}
function Card({
  owner,
  onCourseChange,
}: {
  owner: ScienceOwner;
  onCourseChange?: (course: SparkCourse | null) => void;
}) {
  const [course, setCourse] = useState<SparkCourse | null>(null),
    [failed, setFailed] = useState(false),
    [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setFailed(false);
    setCourse(null);
    onCourseChange?.(null);
    void sparkScienceService
      .course(owner, controller.signal)
      .then((result) => {
        if (!controller.signal.aborted) {
          setCourse(result.course);
          onCourseChange?.(result.course);
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) setFailed(true);
      });
    return () => controller.abort();
  }, [owner, retry, onCourseChange]);
  if (failed)
    return (
      <div role="alert" className="text-sm text-slate-600">
        Spark Science could not load.{" "}
        <button className="underline" onClick={() => setRetry((n) => n + 1)}>
          Retry
        </button>
      </div>
    );
  if (!course) return null;
  return (
    <div className="flex flex-col bg-white border border-[#F1F5F9] rounded-[24px] overflow-hidden shadow-[0px_4px_24px_rgba(0,0,0,0.02)]">
      <img
        src={SPARK_COURSE_IMAGE}
        alt="Books and an apple"
        className="w-full h-[168px] object-cover"
      />
      <div className="p-5 flex flex-col gap-4 flex-grow">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-[#4F8DFB]" />
            <span className="text-[11px] font-bold text-[#4F8DFB]">9</span>
          </div>
          <h3 className="text-[18px] font-bold text-[#282828] leading-[23px] mt-1">
            {course.title}
          </h3>
          <p className="text-[14px] text-[#949494] leading-[18px] mt-1">
            {course.description}
          </p>
        </div>
        <div className="flex flex-col gap-2 mt-auto pt-2">
          <div className="flex justify-between text-[12px] font-semibold">
            <span>Completion</span>
            <span className="text-[#4F8DFB]">{course.progressPct}%</span>
          </div>
          <div
            role="progressbar"
            aria-label="Spark Science completion"
            aria-valuenow={course.progressPct}
            aria-valuemin={0}
            aria-valuemax={100}
            className="h-[6px] bg-[#F1F5F9] rounded-full overflow-hidden"
          >
            <div
              className="h-full bg-[#4F8DFB] rounded-full"
              style={{ width: `${course.progressPct}%` }}
            />
          </div>
        </div>
        <Link
          to={SPARK_COURSE_PATH}
          className="mt-2 w-full h-[46px] bg-[#232E43] hover:bg-[#1a2333] text-white rounded-[8px] font-semibold text-[14px] flex items-center justify-center"
        >
          Continue Course
        </Link>
      </div>
    </div>
  );
}
