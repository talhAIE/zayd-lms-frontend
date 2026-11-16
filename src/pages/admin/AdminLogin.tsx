import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { login } from "@/redux/slices/authSlice";
import { isDirectoryAdmin } from "@/utils/adminRoles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Logo from "@/assets/zayd-logo.png";

export default function AdminLogin() {
  const [params] = useSearchParams();
  const [username, setUsername] = useState(params.get("username") || "");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAppSelector((s) => s.auth);
  useEffect(() => {
    if (isAuthenticated && isDirectoryAdmin(user?.role))
      navigate("/admin/dashboard", { replace: true });
  }, [isAuthenticated, user?.role, navigate]);
  return (
    <main className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-5 font-['Outfit',sans-serif]">
      <section className="w-full max-w-md bg-white border border-slate-100 rounded-3xl p-8 shadow-sm">
        <img src={Logo} alt="Zayd" className="w-20 mx-auto mb-7" />
        <h1 className="text-2xl font-bold text-[#232E43]">Admin sign in</h1>
        <p className="text-slate-500 mt-2 mb-6">
          View students in your assigned schools.
        </p>
        <form
          className="space-y-5"
          onSubmit={async (e) => {
            e.preventDefault();
            setError("");
            setBusy(true);
            try {
              const result = await dispatch(
                login({ username: username.trim() }),
              ).unwrap();
              if (!isDirectoryAdmin(result.user.role)) {
                navigate("/home", { replace: true });
                return;
              }
              navigate("/admin/dashboard", { replace: true });
            } catch (err) {
              setError(
                typeof err === "string"
                  ? err
                  : "Sign in failed. Check your username.",
              );
            } finally {
              setBusy(false);
            }
          }}
        >
          <div>
            <label
              htmlFor="admin-username"
              className="block text-sm font-medium mb-2"
            >
              Username
            </label>
            <Input
              id="admin-username"
              autoComplete="username"
              required
              maxLength={200}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          {error && (
            <p role="alert" className="text-red-600 text-sm">
              {error}
            </p>
          )}
          <Button
            type="submit"
            disabled={busy}
            className="w-full bg-[#232E43] hover:bg-[#1a2333]"
          >
            {busy ? "Signing in…" : "Sign in"}
          </Button>
        </form>
        <Link
          to="/login"
          className="inline-block mt-6 text-sm text-slate-500 underline"
        >
          Student or teacher sign in
        </Link>
      </section>
    </main>
  );
}
