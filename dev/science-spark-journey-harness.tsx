import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { BrowserRouter, useNavigate } from "react-router-dom";
import { store } from "../src/redux/store";
import { login, crossTabLogout } from "../src/redux/slices/authSlice";
import AppRoutes from "../src/routes";
import "../src/index.css";
import "../src/App.css";

// Development entry only, never imported by main or bundled in production.
// Uses the actual routes, Redux auth boundary, service and viewer with a local
// standalone Science API. Its synthetic state survives refresh until server restart.
function Harness() {
  const navigate = useNavigate();
  const [status, setStatus] = useState("Local journey verification");
  async function signIn(username: string) {
    const result = await fetch(
      `/__science-spark-test/session?username=${encodeURIComponent(username)}`,
    );
    const data = await result.json();
    localStorage.setItem("AiTutorUser", JSON.stringify(data.user));
    localStorage.setItem("accessToken", data.accessToken);
    localStorage.setItem("refreshToken", data.refreshToken);
    store.dispatch(
      login.fulfilled({ ...data, message: "Local harness" }, "harness", {
        username,
      }),
    );
    setStatus(`Current synthetic account: ${username}`);
  }
  async function command(action: string) {
    const response = await fetch(
      `/__science-spark-test/command?action=${action}`,
    );
    setStatus(`${action}: ${JSON.stringify(await response.json())}`);
  }
  return (
    <>
      <aside
        className="relative z-[60] flex flex-wrap gap-2 bg-yellow-50 border-b p-3 text-sm"
        aria-label="Development test controls"
      >
        <button onClick={() => void signIn("qa.full.american.g7")}>
          Use American QA
        </button>
        <button onClick={() => void signIn("qa.full.saudi.g7")}>
          Use Saudi QA
        </button>
        <button onClick={() => void signIn("ordinary.american")}>
          Use ineligible account
        </button>
        <button
          onClick={() => {
            store.dispatch(crossTabLogout());
            localStorage.removeItem("AiTutorUser");
            localStorage.removeItem("accessToken");
            localStorage.removeItem("refreshToken");
          }}
        >
          Test logout
        </button>
        <button onClick={() => navigate("/student/courses")}>
          Test Courses
        </button>
        <button
          onClick={() =>
            navigate("/student/science/units/nature-of-science-unit-1")
          }
        >
          Test direct unit
        </button>
        <button
          onClick={() =>
            navigate(
              "/student/science/units/nature-of-science-unit-1/activities/lesson-4",
            )
          }
        >
          Test direct Lesson 4
        </button>
        <button onClick={() => void command("fail-complete")}>
          Fail next save
        </button>
        <button onClick={() => void command("fail-content")}>
          Fail next content
        </button>
        <button onClick={() => void command("delay-content")}>
          Delay next content
        </button>
        <button onClick={() => void command("delay-complete")}>
          Delay next save
        </button>
        <button onClick={() => void command("disable")}>Disable pilot</button>
        <button onClick={() => void command("enable")}>Enable pilot</button>
        <button onClick={() => void command("statistics")}>
          Show request counts
        </button>
        <p className="w-full" role="status">
          {status}
        </p>
      </aside>
      <AppRoutes />
    </>
  );
}
if (
  !import.meta.env.DEV ||
  !["127.0.0.1", "localhost"].includes(location.hostname)
)
  throw new Error("Local development only");
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <Harness />
      </BrowserRouter>
    </Provider>
  </StrictMode>,
);
