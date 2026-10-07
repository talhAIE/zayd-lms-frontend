import { useMemo } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAppSelector } from "@/redux/hooks";
import { StudentLayout } from "@/components/layouts/student-layout";
import type { ScienceOwner } from "@/services/scienceSparkService";

export function useScienceOwner(): ScienceOwner | null {
  const { user, isAuthenticated, refreshToken } = useAppSelector((s) => s.auth);
  const id = user?.id,
    username = user?.username,
    role = user?.role;
  return useMemo(
    () =>
      isAuthenticated && role === "student" && id && username
        ? { id, username, sessionKey: crypto.randomUUID() }
        : null,
    [id, username, role, isAuthenticated, refreshToken],
  );
}
export function ScienceSession() {
  const owner = useScienceOwner();
  if (!owner) return <Navigate to="/login" replace />;
  // Synchronous remount destroys frames/data before a new account can render.
  return (
    <StudentLayout>
      <Outlet key={owner.sessionKey} context={owner} />
    </StudentLayout>
  );
}
