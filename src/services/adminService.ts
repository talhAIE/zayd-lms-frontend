import axios from "axios";
import apiClient from "@/config/ApiConfig";

export interface AdminActor {
  id: string;
  username: string;
  displayName: string;
  role: string;
  program: "zayd" | "nafs";
  scope: "super" | "school";
  schoolId: string;
  schoolName: string;
}
export interface AdminStats {
  currentStreak: number;
  totalUsageSec: number;
  totalPoints: number;
  totalLessonsDone: number;
  totalLessonModesDone: number;
}
export interface AdminStudent {
  id: string;
  username: string;
  displayName: string;
  grade: string | null;
  className: string | null;
  schoolName: string;
  curriculum: string;
  status: string;
  stats?: AdminStats;
  nafs?: { simulatorCompleted: number; practiceCompleted: number };
}
export interface AdminFilters {
  actor: AdminActor;
  schools: Array<{ id: string; name: string; curriculum: string }>;
  grades: string[];
  classes: string[];
}
export interface AdminDashboardView {
  actor: AdminActor;
  summary: {
    totalStudents: number;
    activeStudents: number;
    inactiveStudents: number;
    schools: number;
    totalUsageSec?: number;
    completedLessons?: number;
    totalPoints?: number;
  };
  students: AdminStudent[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
export interface AdminQuery {
  schoolId?: string;
  search?: string;
  grade?: string;
  class?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: string;
  page: number;
  limit: number;
}
export interface AdminResult {
  id: string;
  state: string;
  earnedMarks: number | null;
  totalMarks: number;
  completedAt: string | null;
  runNumber?: number;
}
export interface AdminStudentView {
  actor: AdminActor;
  student: AdminStudent;
  stats?: AdminStats | null;
  courses?: Array<{
    status: string;
    progressPct: number;
    completedAt: string | null;
    course: {
      id: string;
      title: string;
      grade: string | null;
      subject: string;
    };
  }>;
  simulator?: Array<{
    id: string;
    title: string;
    subject: string;
    grade: string;
    attempt: AdminResult | null;
  }>;
  quizzes?: Array<{
    id: string;
    title: string;
    subject: string;
    grade: string;
    runs: AdminResult[];
  }>;
}
export interface AdminOwner {
  id: string;
  username: string;
  role: string;
  region?: string;
}
export function sameAdminOwner(owner: AdminOwner) {
  try {
    const user = JSON.parse(
      localStorage.getItem("AiTutorUser") || "null",
    ) as AdminOwner | null;
    return (
      user?.id === owner.id &&
      user.username === owner.username &&
      user.role === owner.role &&
      user.region === owner.region
    );
  } catch {
    return false;
  }
}
function current(owner: AdminOwner, signal: AbortSignal) {
  return !signal.aborted && sameAdminOwner(owner);
}
async function get<T>(
  owner: AdminOwner,
  signal: AbortSignal,
  url: string,
  params?: AdminQuery,
) {
  if (!current(owner, signal))
    throw new axios.CanceledError("Admin session changed");
  const response = await apiClient.get<{ data: T }>(url, {
    params,
    signal,
    scienceSession: () => current(owner, signal),
  } as Parameters<typeof apiClient.get>[1]);
  if (!current(owner, signal))
    throw new axios.CanceledError("Admin session changed");
  return response.data.data;
}
export const adminService = {
  filters: (owner: AdminOwner, signal: AbortSignal) =>
    get<AdminFilters>(owner, signal, "/admin/filters"),
  dashboard: (owner: AdminOwner, signal: AbortSignal, query: AdminQuery) =>
    get<AdminDashboardView>(owner, signal, "/admin/dashboard", query),
  student: (owner: AdminOwner, signal: AbortSignal, id: string) =>
    get<AdminStudentView>(
      owner,
      signal,
      `/admin/students/${encodeURIComponent(id)}`,
    ),
};
