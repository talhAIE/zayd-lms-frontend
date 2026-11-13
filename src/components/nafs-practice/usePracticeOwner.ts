import { useMemo } from "react";
import { useAppSelector } from "@/redux/hooks";
import type { PracticeOwner } from "@/types/nafs-practice.contract";

export function usePracticeOwner(): PracticeOwner | null {
  const { user, isAuthenticated } = useAppSelector((s) => s.auth);
  const region = (user as typeof user & { region?: string })?.region;
  const id = user?.id,
    username = user?.username;
  const allowed = isAuthenticated && user?.role === "student";
  return useMemo(
    () =>
      allowed && id && username && (region === "ROW" || region === "SAUDI")
        ? { id, username, role: "student", region }
        : null,
    [allowed, id, username, region],
  );
}
export function practiceOwnerKey(owner: PracticeOwner) {
  return JSON.stringify([owner.id, owner.username, owner.role, owner.region]);
}
