import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  Users,
  UserCheck,
  UserX,
  School,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Eye,
} from "lucide-react";
import { useAppSelector } from "@/redux/hooks";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  adminService,
  sameAdminOwner,
  type AdminDashboardView,
  type AdminFilters,
  type AdminOwner,
  type AdminQuery,
  type AdminStudentView,
  type AdminResult,
} from "@/services/adminService";

const panel =
  "w-full bg-white rounded-3xl p-4 md:p-8 font-['Outfit',sans-serif] text-[#232E43]";
const selectClass =
  "h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm min-w-0 w-full";
const minutes = (seconds: number) =>
  seconds < 3600
    ? `${Math.ceil(seconds / 60)} min`
    : `${(seconds / 3600).toFixed(1)} hrs`;
const state = (value: string) =>
  value === "submitted" || value === "completed"
    ? "Completed"
    : value === "in_progress"
      ? "In progress"
      : "Not started";
function useOwner() {
  const { user } = useAppSelector((s) => s.auth);
  const [, refreshOwner] = useState(0);
  useEffect(() => {
    const changed = () => refreshOwner((n) => n + 1);
    window.addEventListener("storage", changed);
    window.addEventListener("focus", changed);
    return () => {
      window.removeEventListener("storage", changed);
      window.removeEventListener("focus", changed);
    };
  }, []);
  const owner = useMemo<AdminOwner | null>(
    () =>
      user
        ? {
            id: user.id,
            username: user.username,
            role: user.role,
            region: (user as typeof user & { region?: string }).region,
          }
        : null,
    [user],
  );
  return owner && sameAdminOwner(owner) ? owner : null;
}
function ChangedSession() {
  return (
    <p role="alert" className="p-8">
      Admin session changed.{" "}
      <Link className="underline" to="/login">
        Sign in again
      </Link>
      .
    </p>
  );
}
function ownerKey(owner: AdminOwner) {
  return JSON.stringify(owner);
}
function Metric({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: typeof Users;
}) {
  return (
    <Card className="border-slate-100 shadow-sm rounded-2xl">
      <CardContent className="p-5 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm text-slate-500">{label}</p>
          <p className="text-3xl font-bold mt-2">{value.toLocaleString()}</p>
        </div>
        <span className="p-3 bg-blue-50 rounded-xl">
          <Icon className="w-6 h-6 text-blue-500" />
        </span>
      </CardContent>
    </Card>
  );
}
export default function AdminDashboard() {
  const owner = useOwner();
  return owner ? (
    <Directory key={ownerKey(owner)} owner={owner} />
  ) : (
    <ChangedSession />
  );
}
function Directory({ owner }: { owner: AdminOwner }) {
  const [filters, setFilters] = useState<AdminFilters>();
  const [filterError, setFilterError] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [school, setSchool] = useState("");
  const [grade, setGrade] = useState("");
  const [className, setClassName] = useState("");
  const [status, setStatus] = useState("all");
  const [sortBy, setSortBy] = useState("username");
  const [sortOrder, setSortOrder] = useState("asc");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [retry, setRetry] = useState(0);
  const [response, setResponse] = useState<{
    key: string;
    view: AdminDashboardView;
  }>();
  const [errorKey, setErrorKey] = useState("");
  const query = useMemo<AdminQuery>(
    () => ({
      search: debouncedSearch || undefined,
      schoolId: school || undefined,
      grade: grade || undefined,
      class: className || undefined,
      status,
      sortBy,
      sortOrder,
      page,
      limit,
    }),
    [
      debouncedSearch,
      school,
      grade,
      className,
      status,
      sortBy,
      sortOrder,
      page,
      limit,
    ],
  );
  const key = JSON.stringify([query, retry]);
  const view = response?.key === key ? response.view : undefined;
  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timeout);
  }, [search]);
  useEffect(() => {
    const controller = new AbortController();
    setFilters(undefined);
    setFilterError(false);
    void adminService
      .filters(owner, controller.signal)
      .then((value) => {
        if (!controller.signal.aborted) setFilters(value);
      })
      .catch(() => {
        if (!controller.signal.aborted) setFilterError(true);
      });
    return () => controller.abort();
  }, [owner, retry]);
  useEffect(() => {
    const controller = new AbortController();
    setErrorKey("");
    void adminService
      .dashboard(owner, controller.signal, query)
      .then((value) => {
        if (!controller.signal.aborted) setResponse({ key, view: value });
      })
      .catch(() => {
        if (!controller.signal.aborted) setErrorKey(key);
      });
    return () => controller.abort();
  }, [owner, query, key]);
  const actor = filters?.actor ?? view?.actor;
  const nafs = actor
    ? actor.program === "nafs"
    : owner.role.startsWith("nafs_");
  const failed = errorKey === key || filterError;
  function reset() {
    setSearch("");
    setDebouncedSearch("");
    setSchool("");
    setGrade("");
    setClassName("");
    setStatus("all");
    setSortBy("username");
    setSortOrder("asc");
    setPage(1);
  }
  return (
    <section className={panel}>
      <header className="flex flex-wrap items-start justify-between gap-4 mb-7">
        <div>
          <p className="text-sm text-blue-600 font-semibold">
            {actor?.scope === "super" ? "Super admin" : "School admin"}
          </p>
          <h1 className="text-2xl md:text-3xl font-bold mt-2">
            {nafs ? "NAFS" : "Zayd"} Student Dashboard
          </h1>
          <p className="mt-2 text-slate-500">
            {actor?.scope === "school"
              ? actor.schoolName
              : "Browse students across your schools."}
          </p>
        </div>
        <Badge variant="secondary" className="py-2 px-3">
          Students only
        </Badge>
      </header>
      {failed && (
        <div role="alert" className="rounded-xl bg-red-50 p-4 mb-6">
          <p>Student data could not load. Check your access or try again.</p>
          <Button
            variant="outline"
            className="mt-3"
            onClick={() => setRetry((n) => n + 1)}
          >
            Try again
          </Button>
        </div>
      )}
      {view && (
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-7">
          <Metric
            label="Students"
            value={view.summary.totalStudents}
            icon={Users}
          />
          <Metric
            label="Active students"
            value={view.summary.activeStudents}
            icon={UserCheck}
          />
          <Metric
            label="Inactive students"
            value={view.summary.inactiveStudents}
            icon={UserX}
          />
          <Metric label="Schools" value={view.summary.schools} icon={School} />
        </div>
      )}
      <div className="border border-slate-100 rounded-2xl p-4 md:p-5">
        <h2 className="font-semibold text-lg mb-4">Student directory</h2>
        <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-4">
          <div>
            <label htmlFor="admin-search" className="block text-sm mb-2">
              Search username or name
            </label>
            <Input
              id="admin-search"
              type="search"
              placeholder="Search students…"
              value={search}
              maxLength={100}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="admin-school" className="block text-sm mb-2">
              School
            </label>
            <select
              id="admin-school"
              className={selectClass}
              disabled={!filters || actor?.scope === "school"}
              value={actor?.scope === "school" ? actor.schoolId : school}
              onChange={(e) => {
                setSchool(e.target.value);
                setPage(1);
              }}
            >
              {actor?.scope !== "school" && (
                <option value="">All schools</option>
              )}
              {filters?.schools.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="admin-grade" className="block text-sm mb-2">
              Grade
            </label>
            <select
              id="admin-grade"
              className={selectClass}
              value={grade}
              onChange={(e) => {
                setGrade(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All grades</option>
              {filters?.grades.map((g) => (
                <option key={g} value={g}>
                  Grade {g}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="admin-class" className="block text-sm mb-2">
              Class
            </label>
            <select
              id="admin-class"
              className={selectClass}
              value={className}
              onChange={(e) => {
                setClassName(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All classes</option>
              {filters?.classes.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="admin-status" className="block text-sm mb-2">
              Account status
            </label>
            <select
              id="admin-status"
              className={selectClass}
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
            >
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="blocked">Blocked</option>
            </select>
          </div>
          <div>
            <label htmlFor="admin-sort" className="block text-sm mb-2">
              Sort by
            </label>
            <select
              id="admin-sort"
              className={selectClass}
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setPage(1);
              }}
            >
              <option value="username">Username</option>
              <option value="name">Name</option>
              <option value="grade">Grade</option>
              {actor?.program === "zayd" && (
                <>
                  <option value="usage">Usage</option>
                  <option value="points">Points</option>
                  <option value="lessons">Completed lessons</option>
                </>
              )}
            </select>
          </div>
          <div>
            <label htmlFor="admin-order" className="block text-sm mb-2">
              Order
            </label>
            <select
              id="admin-order"
              className={selectClass}
              value={sortOrder}
              onChange={(e) => {
                setSortOrder(e.target.value);
                setPage(1);
              }}
            >
              <option value="asc">Ascending</option>
              <option value="desc">Descending</option>
            </select>
          </div>
          <div className="flex items-end">
            <Button variant="outline" onClick={reset} className="w-full">
              Clear filters
            </Button>
          </div>
        </div>
        {!view && !failed ? (
          <p role="status" className="flex gap-2 items-center py-10">
            <Loader2 className="w-5 h-5 animate-spin" />
            Loading students…
          </p>
        ) : (
          view && (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Username</TableHead>
                      <TableHead>School</TableHead>
                      <TableHead>Grade</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead>Status</TableHead>
                      {nafs ? (
                        <>
                          <TableHead>Simulator completed</TableHead>
                          <TableHead>Quiz runs completed</TableHead>
                        </>
                      ) : (
                        <>
                          <TableHead>Usage</TableHead>
                          <TableHead>Points</TableHead>
                          <TableHead>Lessons completed</TableHead>
                        </>
                      )}
                      <TableHead>Profile</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {view.students.map((student) => (
                      <TableRow key={student.id}>
                        <TableCell className="font-medium whitespace-nowrap">
                          {student.displayName || student.username}
                        </TableCell>
                        <TableCell>{student.username}</TableCell>
                        <TableCell className="min-w-44">
                          {student.schoolName}
                        </TableCell>
                        <TableCell>{student.grade || "—"}</TableCell>
                        <TableCell>{student.className || "—"}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              student.status === "active"
                                ? "secondary"
                                : "outline"
                            }
                          >
                            {student.status}
                          </Badge>
                        </TableCell>
                        {nafs ? (
                          <>
                            <TableCell>
                              {student.nafs?.simulatorCompleted ?? 0}
                            </TableCell>
                            <TableCell>
                              {student.nafs?.practiceCompleted ?? 0}
                            </TableCell>
                          </>
                        ) : (
                          <>
                            <TableCell>
                              {minutes(student.stats?.totalUsageSec ?? 0)}
                            </TableCell>
                            <TableCell>
                              {student.stats?.totalPoints ?? 0}
                            </TableCell>
                            <TableCell>
                              {student.stats?.totalLessonsDone ?? 0}
                            </TableCell>
                          </>
                        )}
                        <TableCell>
                          <Link
                            to={`/admin/students/${student.id}`}
                            aria-label={`View ${student.username}`}
                            className="inline-flex items-center gap-2 text-blue-600 underline min-h-10"
                          >
                            <Eye className="w-4 h-4" />
                            View
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                    {!view.students.length && (
                      <TableRow>
                        <TableCell
                          colSpan={nafs ? 9 : 10}
                          className="text-center py-12 text-slate-500"
                        >
                          No students match these filters.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
              <footer className="flex flex-wrap justify-between items-center gap-4 mt-5">
                <p className="text-sm text-slate-500">
                  {view.pagination.total} students · Page {view.pagination.page}{" "}
                  of {view.pagination.totalPages}
                </p>
                <div className="flex items-center gap-2">
                  <label htmlFor="admin-page-size" className="text-sm">
                    Rows
                  </label>
                  <select
                    id="admin-page-size"
                    className={`${selectClass} !w-auto`}
                    value={limit}
                    onChange={(e) => {
                      setLimit(Number(e.target.value));
                      setPage(1);
                    }}
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                  <Button
                    aria-label="Previous page"
                    variant="outline"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    aria-label="Next page"
                    variant="outline"
                    disabled={page >= view.pagination.totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </footer>
            </>
          )
        )}
      </div>
    </section>
  );
}

export function AdminStudentProfile() {
  const owner = useOwner();
  const { studentId = "" } = useParams();
  return owner ? (
    <StudentProfile
      key={`${ownerKey(owner)}:${studentId}`}
      owner={owner}
      id={studentId}
    />
  ) : (
    <ChangedSession />
  );
}
function StudentProfile({ owner, id }: { owner: AdminOwner; id: string }) {
  const [view, setView] = useState<AdminStudentView>();
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setView(undefined);
    setError(false);
    void adminService
      .student(owner, controller.signal, id)
      .then((value) => {
        if (!controller.signal.aborted) setView(value);
      })
      .catch(() => {
        if (!controller.signal.aborted) setError(true);
      });
    return () => controller.abort();
  }, [owner, id, retry]);
  return (
    <section className={panel}>
      <Link
        to="/admin/dashboard"
        className="text-sm underline text-slate-500 inline-flex items-center gap-2 mb-6"
      >
        <ChevronLeft className="w-4 h-4" />
        Back to students
      </Link>
      {error ? (
        <div role="alert">
          <p>Student details are unavailable or outside your access.</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => setRetry((n) => n + 1)}
          >
            Try again
          </Button>
        </div>
      ) : !view ? (
        <p role="status">Loading student…</p>
      ) : (
        <>
          <h1 className="text-3xl font-bold">
            {view.student.displayName || view.student.username}
          </h1>
          <p className="text-slate-500 mt-2 mb-6">
            {view.student.username} · {view.student.schoolName} · Grade{" "}
            {view.student.grade || "—"} · Class {view.student.className || "—"}
          </p>
          {view.actor.program === "zayd" ? (
            <>
              <div className="grid sm:grid-cols-3 gap-4 mb-6">
                <Metric
                  label="Completed lessons"
                  value={view.stats?.totalLessonsDone ?? 0}
                  icon={UserCheck}
                />
                <Metric
                  label="Points"
                  value={view.stats?.totalPoints ?? 0}
                  icon={Users}
                />
                <Metric
                  label="Current streak"
                  value={view.stats?.currentStreak ?? 0}
                  icon={UserCheck}
                />
              </div>
              <h2 className="text-xl font-semibold mb-4">
                Recorded course enrollments
              </h2>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Course</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Progress</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {view.courses?.map((c) => (
                      <TableRow key={c.course.id}>
                        <TableCell>{c.course.title}</TableCell>
                        <TableCell>{c.course.subject}</TableCell>
                        <TableCell>{c.progressPct}%</TableCell>
                        <TableCell>{c.status}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {!view.courses?.length && (
                <p className="py-6 text-slate-500">
                  No course enrollments recorded yet.
                </p>
              )}
            </>
          ) : (
            <>
              <h2 className="text-xl font-semibold mb-4">Simulator Test</h2>
              <div className="space-y-4 mb-8">
                {view.simulator?.map((s) => (
                  <ResultCard key={s.id} title={s.title} result={s.attempt} />
                ))}
              </div>
              <h2 className="text-xl font-semibold mb-4">Quizzes</h2>
              <div className="space-y-4">
                {view.quizzes?.map((q) => (
                  <div key={q.id}>
                    {q.runs.length ? (
                      q.runs.map((r) => (
                        <ResultCard
                          key={r.id}
                          title={`${q.title} · Run ${r.runNumber}`}
                          result={r}
                        />
                      ))
                    ) : (
                      <ResultCard title={q.title} result={null} />
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </section>
  );
}
function ResultCard({
  title,
  result,
}: {
  title: string;
  result: AdminResult | null;
}) {
  const completed =
    result?.state === "submitted" || result?.state === "completed";
  return (
    <Card className="rounded-2xl shadow-none border-slate-200">
      <CardContent className="p-5 flex flex-wrap justify-between items-center gap-4">
        <div>
          <h3 className="font-semibold">{title}</h3>
          <p className="text-sm text-slate-500 mt-2">
            {result ? state(result.state) : "Not started"}
            {result?.completedAt
              ? ` · ${new Date(result.completedAt).toLocaleDateString()}`
              : ""}
          </p>
        </div>
        <p className="font-semibold">
          {completed && result?.earnedMarks != null
            ? `${result.earnedMarks} / ${result.totalMarks}`
            : "—"}
        </p>
      </CardContent>
    </Card>
  );
}
