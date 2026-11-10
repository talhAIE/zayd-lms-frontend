import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { ChevronLeft, ChevronRight, Loader2, RefreshCw } from "lucide-react";
import { useAppSelector } from "@/redux/hooks";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
  nafsTeacherService,
  sameNafsOwner,
  type NafsOwner,
} from "@/services/nafsService";
import type { NafsTeacherResultsView } from "@/types/nafs.contract";

type Completion = "all" | "completed" | "not_completed";
const pageSize = 10;
function completedDate(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      });
}

export function NafsTeacherResults() {
  const { user, isAuthenticated } = useAppSelector((s) => s.auth);
  const id = user?.id,
    username = user?.username;
  const allowed = isAuthenticated && user?.role === "teacher";
  const owner = useMemo<NafsOwner | null>(
    () =>
      allowed && id && username ? { id, username, role: "teacher" } : null,
    [allowed, id, username],
  );
  return owner ? (
    <TeacherResults key={`${owner.id}:${owner.username}`} owner={owner} />
  ) : null;
}

function TeacherResults({ owner }: { owner: NafsOwner }) {
  const [assessmentId, setAssessmentId] = useState("all");
  const [completion, setCompletion] = useState<Completion>("all");
  const [page, setPage] = useState(1);
  const [refresh, setRefresh] = useState(0);
  const [response, setResponse] = useState<{
    key: string;
    data: NafsTeacherResultsView;
  } | null>(null);
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const [invalidated, setInvalidated] = useState(false);
  const key = JSON.stringify([assessmentId, completion, page, refresh]);

  useEffect(() => {
    const controller = new AbortController();
    const sessionChanged = () => {
      if (!sameNafsOwner(owner, controller.signal)) {
        controller.abort();
        setInvalidated(true);
      }
    };
    window.addEventListener("storage", sessionChanged);
    void nafsTeacherService
      .results(owner, controller.signal, {
        ...(assessmentId === "all" ? {} : { assessmentId }),
        ...(completion === "all" ? {} : { completion }),
        page,
        limit: pageSize,
      })
      .then((data) => {
        if (sameNafsOwner(owner, controller.signal)) {
          setResponse({ key, data });
          setErrorKey(null);
          if (page > Math.max(1, data.pagination.totalPages))
            setPage(Math.max(1, data.pagination.totalPages));
        }
      })
      .catch((error) => {
        if (!axios.isCancel(error) && sameNafsOwner(owner, controller.signal))
          setErrorKey(key);
      });
    return () => {
      controller.abort();
      window.removeEventListener("storage", sessionChanged);
    };
  }, [owner, assessmentId, completion, page, refresh, key]);

  if (invalidated) return null;
  const failed = errorKey === key;
  const current = response?.key === key ? response.data : null;
  const loading = !failed && !current;
  // Disabled/no-grant responses contain no assessments. NAFS adds no empty
  // dashboard section and never substitutes normal LMS assignments for grants.
  if (!failed && (!response || (current && current.assessments.length === 0)))
    return null;
  const assessments = response?.data.assessments ?? [];
  const rows = current?.results ?? [];
  const pagination = current?.pagination;
  const clearFilters = () => {
    setAssessmentId("all");
    setCompletion("all");
    setPage(1);
  };

  return (
    <section
      aria-labelledby="nafs-results-heading"
      className="mb-6 min-w-0"
      aria-busy={loading}
    >
      <Card>
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
            <div>
              <h2
                id="nafs-results-heading"
                className="text-xl font-semibold text-gray-900"
              >
                NAFS results
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Quiz completion and final marks for your assigned students.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              disabled={loading}
              onClick={() => setRefresh((n) => n + 1)}
            >
              <RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" />
              Refresh NAFS results
            </Button>
          </div>
          <div className="flex flex-wrap items-end gap-3 mb-5">
            <div className="flex flex-col gap-1.5 text-sm font-medium min-w-0 w-full sm:w-auto">
              <label htmlFor="nafs-assessment-filter">NAFS assessment</label>
              <select
                id="nafs-assessment-filter"
                className="h-10 rounded-md border border-input bg-background px-3 text-sm sm:max-w-sm"
                value={assessmentId}
                onChange={(e) => {
                  setAssessmentId(e.target.value);
                  setPage(1);
                }}
              >
                <option value="all">All assessments</option>
                {assessments.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.courseTitle}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5 text-sm font-medium w-full sm:w-auto">
              <label htmlFor="nafs-completion-filter">NAFS completion</label>
              <select
                id="nafs-completion-filter"
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                value={completion}
                onChange={(e) => {
                  setCompletion(e.target.value as Completion);
                  setPage(1);
                }}
              >
                <option value="all">All statuses</option>
                <option value="completed">Completed</option>
                <option value="not_completed">Not completed</option>
              </select>
            </div>
            {(assessmentId !== "all" || completion !== "all") && (
              <Button variant="ghost" onClick={clearFilters}>
                Clear NAFS filters
              </Button>
            )}
          </div>
          {failed ? (
            <div
              role="alert"
              className="rounded-lg border border-red-200 p-4 text-sm"
            >
              <p>Could not load NAFS results. Please try again.</p>
              <Button
                className="mt-3"
                variant="outline"
                onClick={() => setRefresh((n) => n + 1)}
              >
                Retry NAFS results
              </Button>
            </div>
          ) : loading ? (
            <p
              role="status"
              className="flex items-center gap-2 py-8 text-sm text-gray-500"
            >
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              Loading NAFS results…
            </p>
          ) : rows.length === 0 ? (
            <p role="status" className="py-8 text-center text-sm text-gray-500">
              No students match these NAFS filters.
            </p>
          ) : (
            <>
              <ul
                aria-label="NAFS student results"
                className="space-y-3 sm:hidden"
              >
                {rows.map((row) => (
                  <li
                    key={`${row.student.id}:${row.assessment.id}`}
                    className="rounded-lg border p-3 text-sm"
                  >
                    <p className="font-medium break-words">
                      {row.student.displayName}
                    </p>
                    <p className="text-xs text-gray-500 break-all">
                      {row.student.username}
                    </p>
                    <p className="mt-2 break-words">
                      {row.assessment.courseTitle}
                    </p>
                    <div className="mt-3 flex items-center justify-between gap-2">
                      <Badge
                        variant={
                          row.state === "completed" ? "default" : "secondary"
                        }
                      >
                        {row.state === "completed"
                          ? "Completed"
                          : "Not completed"}
                      </Badge>
                      <p className="font-semibold">
                        {row.state === "completed" && row.earnedMarks !== null
                          ? `${row.earnedMarks} / ${row.assessment.totalMarks}`
                          : "—"}
                      </p>
                    </div>
                    {row.state === "completed" && (
                      <p className="mt-2 text-xs text-gray-500">
                        Completed {completedDate(row.completedAt)}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
              <div className="hidden sm:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>NAFS assessment</TableHead>
                      <TableHead>Completion</TableHead>
                      <TableHead>Marks</TableHead>
                      <TableHead>Completed at</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((row) => (
                      <TableRow key={`${row.student.id}:${row.assessment.id}`}>
                        <TableCell>
                          <p className="font-medium">
                            {row.student.displayName}
                          </p>
                          <p className="text-xs text-gray-500">
                            {row.student.username}
                          </p>
                        </TableCell>
                        <TableCell>{row.assessment.courseTitle}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              row.state === "completed"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {row.state === "completed"
                              ? "Completed"
                              : "Not completed"}
                          </Badge>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {row.state === "completed" && row.earnedMarks !== null
                            ? `${row.earnedMarks} / ${row.assessment.totalMarks}`
                            : "—"}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {row.state === "completed"
                            ? completedDate(row.completedAt)
                            : "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
          {!failed && !loading && pagination && (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t pt-4 text-sm">
              <p role="status">
                {pagination.total === 0
                  ? "0 results"
                  : `Showing ${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, pagination.total)} of ${pagination.total} results`}
              </p>
              <nav
                aria-label="NAFS results pagination"
                className="flex items-center gap-2"
              >
                <Button
                  variant="outline"
                  size="sm"
                  aria-label="Previous NAFS results page"
                  disabled={page <= 1}
                  onClick={() => setPage((n) => n - 1)}
                >
                  <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                  Previous
                </Button>
                <span>
                  Page {page} of {Math.max(1, pagination.totalPages)}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  aria-label="Next NAFS results page"
                  disabled={page >= pagination.totalPages}
                  onClick={() => setPage((n) => n + 1)}
                >
                  Next
                  <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </Button>
              </nav>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
