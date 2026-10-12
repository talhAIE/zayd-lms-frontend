import { useState } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { BrowserRouter, useNavigate } from "react-router-dom";
import { store } from "../src/redux/store";
import { login, crossTabLogout } from "../src/redux/slices/authSlice";
import AppRoutes from "../src/routes";
import "../src/index.css";
import "../src/App.css";

function Harness() {
  const navigate = useNavigate(),
    [status, setStatus] = useState(
      "Synthetic accounts only; no live learner records.",
    );
  async function signIn(account: string) {
    const response = await fetch(`/__motion-test/session?account=${account}`),
      data = await response.json();
    localStorage.setItem("AiTutorUser", JSON.stringify(data.user));
    localStorage.setItem("accessToken", data.accessToken);
    localStorage.setItem("refreshToken", data.refreshToken);
    store.dispatch(
      login.fulfilled(
        { ...data, message: "Local Motion verification" },
        "motion-harness",
        { username: data.user.username },
      ),
    );
    setStatus(`Synthetic account: ${account}`);
    navigate("/student/courses");
  }
  return (
    <>
      <aside
        className="relative z-[60] bg-yellow-50 p-3 flex flex-wrap gap-4 text-sm"
        aria-label="Local verification controls"
      >
        <button onClick={() => void signIn("american9")}>
          American Grade 9
        </button>
        <button onClick={() => void signIn("american8")}>
          American Grade 8
        </button>
        <button onClick={() => void signIn("saudi9")}>Saudi Grade 9</button>
        <button onClick={() => navigate("/student/courses")}>Courses</button>
        <button
          onClick={() =>
            void fetch("/__motion-test/fail-save").then(() =>
              setStatus("Next completion will fail once"),
            )
          }
        >
          Fail next save
        </button>
        <button
          onClick={() => {
            store.dispatch(crossTabLogout());
            localStorage.removeItem("AiTutorUser");
            localStorage.removeItem("accessToken");
            localStorage.removeItem("refreshToken");
          }}
        >
          Logout
        </button>
        <p className="w-full">{status}</p>
      </aside>
      <AppRoutes />
    </>
  );
}
createRoot(document.getElementById("root")!).render(
  <Provider store={store}>
    <BrowserRouter>
      <Harness />
    </BrowserRouter>
  </Provider>,
);
