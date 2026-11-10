import { useCallback, useEffect, useRef, useState } from "react";
import apiClient from "@/config/ApiConfig";
import { useAppSelector } from "@/redux/hooks";
import { Button } from "@/components/ui/button";

type TestAccess = { available: false } | {
  available: true;
  program: "step" | "avatar" | "primary";
};

export function TestAccountTools() {
  const user = useAppSelector(state => state.auth.user);
  if (user?.role !== "student" || !/^qa\.repeat\.(step|3d|primary\.g[123])\.\d{2}$/.test(user.username)) return null;
  return <Tools key={`${user.id}:${user.username}`} id={user.id} username={user.username} />;
}

function Tools({ id, username }: { id: string; username: string }) {
  const [access, setAccess] = useState<TestAccess>({ available: false });
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");
  const lifetime = useRef<AbortController | null>(null);
  const pending = useRef(false);

  const current = useCallback(() => {
    try {
      const user = JSON.parse(localStorage.getItem("AiTutorUser") || "null");
      return !lifetime.current?.signal.aborted && user?.id === id && user?.username === username;
    } catch { return false; }
  }, [id, username]);

  useEffect(() => {
    const controller = new AbortController();
    lifetime.current = controller;
    const config = { signal: controller.signal, scienceSession: current };
    void apiClient.get<TestAccess>("/testing/access", config)
      .then(response => { if (current()) setAccess(response.data); })
      .catch(() => {});
    return () => controller.abort();
  }, [current]);

  async function reset() {
    if (!access.available || !current() || pending.current) return;
    pending.current = true;
    setWorking(true);
    setError("");
    try {
      const config = { signal: lifetime.current?.signal, scienceSession: current };
      await apiClient.post("/testing/reset-course", {}, config);
      if (current()) window.location.reload();
    } catch {
      if (current()) setError("Testing progress could not be reset. Please try again.");
    } finally {
      pending.current = false;
      if (current()) setWorking(false);
    }
  }

  if (!access.available) return null;
  return (
    <div className="flex flex-col items-start gap-2 md:items-end">
      <Button className="bg-[#3B82F6] text-white hover:bg-[#2563EB]" aria-label="Reset course progress" disabled={working} onClick={() => void reset()}>
        {working ? "Resetting…" : "Reset"}
      </Button>
      {error && <p role="alert" className="max-w-xs text-sm text-red-600">{error}</p>}
    </div>
  );
}
