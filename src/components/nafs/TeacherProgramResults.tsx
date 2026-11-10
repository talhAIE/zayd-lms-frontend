import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useAppSelector } from "@/redux/hooks";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  nafsTeacherService,
  sameNafsOwner,
  type NafsOwner,
  type TeacherProgramResult,
} from "@/services/nafsService";

export function TeacherProgramResults() {
  const { user, isAuthenticated } = useAppSelector((s) => s.auth);
  const id = user?.id,
    username = user?.username;
  const allowed = isAuthenticated && user?.role === "teacher";
  const owner = useMemo<NafsOwner | null>(
    () =>
      allowed && id && username ? { id, username, role: "teacher" } : null,
    [id, username, allowed],
  );
  return owner ? (
    <ProgramResults key={`${id}:${username}`} owner={owner} />
  ) : null;
}

function ProgramResults({ owner }: { owner: NafsOwner }) {
  const [rows, setRows] = useState<TeacherProgramResult[]>([]);
  const [failed, setFailed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refresh, setRefresh] = useState(0);
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [invalidated, setInvalidated] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setFailed(false);
    const changed = () => {
      if (!sameNafsOwner(owner, controller.signal)) {
        controller.abort();
        setInvalidated(true);
        setRows([]);
      }
    };
    window.addEventListener("storage", changed);
    void nafsTeacherService
      .programs(owner, controller.signal)
      .then((data) => {
        if (!sameNafsOwner(owner, controller.signal)) return;
        setRows(data.results);
        setLoading(false);
        setPage(1);
      })
      .catch((error) => {
        if (!axios.isCancel(error) && sameNafsOwner(owner, controller.signal)) {
          setFailed(true);
          setRows([]);
          setLoading(false);
        }
      });
    return () => {
      controller.abort();
      window.removeEventListener("storage", changed);
    };
  }, [owner, refresh]);
  if (invalidated || (!rows.length && !failed)) return null;
  const filtered = rows.filter((r) => status === "all" || r.state === status);
  const pages = Math.max(1, Math.ceil(filtered.length / 10));
  return (
    <section
      aria-labelledby="teacher-science-heading"
      className="mb-6"
      aria-busy={loading}
    >
      <Card>
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
            <h2 id="teacher-science-heading" className="text-xl font-semibold">
              Spark Science progress
            </h2>
            <Button
              variant="outline"
              disabled={loading}
              onClick={() => setRefresh((n) => n + 1)}
            >
              Refresh Science progress
            </Button>
          </div>
          {failed ? (
            <div role="alert">
              Could not load Science progress.{" "}
              <Button
                variant="outline"
                onClick={() => setRefresh((n) => n + 1)}
              >
                Retry Science progress
              </Button>
            </div>
          ) : loading ? (
            <p role="status">Loading Science progress…</p>
          ) : (
            <>
              <label
                htmlFor="science-completion"
                className="block text-sm font-medium mb-2"
              >
                Science completion
              </label>
              <select
                id="science-completion"
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                  setPage(1);
                }}
                className="rounded-md border px-3 py-2 mb-4"
              >
                <option value="all">All statuses</option>
                <option value="not_started">Not started</option>
                <option value="in_progress">In progress</option>
                <option value="completed">Completed</option>
              </select>
              <ul
                className="grid gap-3 sm:grid-cols-2"
                aria-label="Science student progress"
              >
                {filtered.slice((page - 1) * 10, page * 10).map((row) => (
                  <li
                    key={`${row.student.id}:${row.course.key}`}
                    className="border rounded-lg p-4 text-sm"
                  >
                    <p className="font-semibold">{row.student.displayName}</p>
                    <p className="text-gray-500 break-all">
                      {row.student.username}
                      {row.student.class ? ` · ${row.student.class}` : ""}
                    </p>
                    <p className="mt-3">
                      {row.course.title} · {row.course.unitTitle}
                    </p>
                    <p className="mt-2">
                      {row.state === "completed"
                        ? "Completed"
                        : row.state === "in_progress"
                          ? "In progress"
                          : "Not started"}
                    </p>
                    <p>
                      {row.completedActivities} / {row.totalActivities}{" "}
                      activities completed ({row.progressPct}%)
                    </p>
                  </li>
                ))}
              </ul>
              {!filtered.length && (
                <p role="status">No students match this Science filter.</p>
              )}
              <nav
                aria-label="Science progress pagination"
                className="flex flex-wrap items-center justify-between gap-2 mt-4"
              >
                <Button
                  variant="outline"
                  disabled={page <= 1}
                  onClick={() => setPage((n) => n - 1)}
                >
                  Previous Science page
                </Button>
                <p>
                  Page {page} of {pages}
                </p>
                <Button
                  variant="outline"
                  disabled={page >= pages}
                  onClick={() => setPage((n) => n + 1)}
                >
                  Next Science page
                </Button>
              </nav>
            </>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
