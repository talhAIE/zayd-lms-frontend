import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Atom } from "lucide-react";
import {
  scienceSparkService,
  type ScienceOwner,
} from "@/services/scienceSparkService";
import type { ScienceSparkCourse } from "@/types/science-spark.contract";
import { useScienceOwner } from "./ScienceSession";

export function ScienceCourseCard() {
  const owner = useScienceOwner();
  return owner ? <Card key={owner.sessionKey} owner={owner} /> : null;
}
function Card({ owner }: { owner: ScienceOwner }) {
  const [course, setCourse] = useState<ScienceSparkCourse>();
  const [failed, setFailed] = useState(false);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setFailed(false);
    void scienceSparkService
      .courses(owner, controller.signal)
      .then(({ data }) => {
        if (!controller.signal.aborted)
          setCourse(data.available ? data.courses[0] : undefined);
      })
      .catch(() => {
        if (!controller.signal.aborted) setFailed(true);
      });
    return () => controller.abort();
  }, [owner, retry]);
  if (failed)
    return (
      <div className="text-sm text-slate-600">
        Additional courses could not load.{" "}
        <button className="underline" onClick={() => setRetry((n) => n + 1)}>
          Retry additional courses
        </button>
      </div>
    );
  if (!course) return null;
  return (
    <div className="rounded-3xl border border-sky-200 bg-sky-50 p-6 flex flex-col gap-4">
      <Atom className="h-10 w-10 text-sky-600" aria-hidden="true" />
      <p className="text-xs font-semibold uppercase text-sky-700">
        Science pilot · {course.sourceGrade}
      </p>
      <h3 className="text-xl font-bold">{course.title}</h3>
      <p className="text-sm text-slate-600">{course.description}</p>
      <Link
        className="mt-auto rounded-lg bg-slate-800 px-5 py-3 text-center text-white font-semibold"
        to={`/student/science/courses/${course.courseKey}`}
      >
        Open Science
      </Link>
    </div>
  );
}
