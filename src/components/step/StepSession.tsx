import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAppSelector } from "@/redux/hooks";
import {
  sameStepOwner,
  stepOwnerKey,
  type StepOwner,
} from "@/services/stepService";

const Context = createContext<StepOwner | null>(null);
export function useStepOwner() {
  const { user, isAuthenticated } = useAppSelector((s) => s.auth);
  const [storageRevision, updateStorage] = useState(0);
  useEffect(() => {
    const changed = (event: StorageEvent) => {
      if (event.key === "AiTutorUser" || event.key === null)
        updateStorage((n) => n + 1);
    };
    window.addEventListener("storage", changed);
    return () => window.removeEventListener("storage", changed);
  }, []);
  const region = (user as typeof user & { region?: string })?.region ?? "ROW";
  return useMemo(() => {
    if (
      !isAuthenticated ||
      user?.role !== "student" ||
      !user.id ||
      !user.username
    )
      return null;
    const owner = { id: user.id, username: user.username, region };
    return sameStepOwner(owner, new AbortController().signal) ? owner : null;
    // A storage event can revoke a stale account even before the Redux view updates.
  }, [
    user?.id,
    user?.username,
    user?.role,
    isAuthenticated,
    region,
    storageRevision,
  ]);
}
export function StepSession() {
  const owner = useStepOwner();
  if (!owner) return <Navigate to="/login" replace />;
  return (
    <Context.Provider key={stepOwnerKey(owner)} value={owner}>
      <Outlet />
    </Context.Provider>
  );
}
export function useStepSession() {
  const owner = useContext(Context);
  if (!owner) throw new Error("STEP student session required");
  return owner;
}
