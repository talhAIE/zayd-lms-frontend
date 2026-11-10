import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { StepPlayer } from "../../src/components/step/StepPlayer";
import { attempt, owner, user } from "./fixture";
import type { StepSectionKind } from "../../src/types/step.contract";
import "../../src/index.css";
if (
  !import.meta.env.DEV ||
  !import.meta.env.VITE_STEP_LAYOUT_PREVIEW ||
  !["localhost", "127.0.0.1"].includes(location.hostname)
)
  throw new Error("Local QA only");
localStorage.setItem("AiTutorUser", JSON.stringify(user));
const kind = new URLSearchParams(location.search).get("kind") || "grammar";
const data = attempt(kind as StepSectionKind);
function Preview() {
  const [index, setIndex] = useState(0),
    [answers, setAnswers] = useState<Record<string, string>>({}),
    [submitted, setSubmitted] = useState(false);
  return (
    <BrowserRouter>
      <StepPlayer
        owner={owner}
        attempt={data}
        currentIndex={index}
        onNavigate={setIndex}
        selections={answers}
        onSelect={(q, o) => setAnswers((a) => ({ ...a, [q]: o }))}
        onSubmit={() => setSubmitted(true)}
        saveStatus={
          submitted
            ? "Synthetic submit callback called"
            : "Layout preview — no persistence"
        }
      />
    </BrowserRouter>
  );
}
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Preview />
  </React.StrictMode>,
);
