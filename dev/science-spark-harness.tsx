import { createRoot } from "react-dom/client";
import { useCallback, useEffect, useState } from "react";
import { ScienceHtmlViewer } from "../src/components/science/ScienceHtmlViewer";
import type {
  ScienceSparkActivityKey,
  ScienceSparkHtmlContent,
} from "../src/types/science-spark.contract";
import { runScienceFrameChecks } from "./science-frame-checks";

/** Vite development harness only. Fixtures are prepared from private Blob delivery, never committed. */
function Harness() {
  const [activity, setActivity] =
    useState<ScienceSparkActivityKey>("introduction");
  const [content, setContent] = useState<ScienceSparkHtmlContent | null>(null);
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);
  const [width, setWidth] = useState("100%");
  const [message, setMessage] = useState(
    "Viewer verification — no state writes",
  );
  const back = useCallback(() => {
    setMessage("Back to Unit 1 requested; no completion");
  }, []);
  const select = useCallback((key: ScienceSparkActivityKey) => {
    setActivity(key);
    setMessage(`Selected ${key}; no completion`);
  }, []);
  useEffect(() => {
    const abort = new AbortController();
    setContent(null);
    setError(false);
    fetch(`/__science-spark-fixtures/${activity}.json`, {
      cache: "no-store",
      signal: abort.signal,
    })
      .then((response) => {
        if (!response.ok) throw new Error();
        return response.json();
      })
      .then(setContent)
      .catch(() => {
        if (!abort.signal.aborted) setError(true);
      });
    return () => abort.abort();
  }, [activity, retry]);
  return (
    <main
      style={{
        margin: "0 auto",
        width,
        maxWidth: "100%",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <header
        style={{
          padding: 12,
          display: "flex",
          flexWrap: "wrap",
          gap: 8,
          background: "#eef5fa",
        }}
      >
        <label>
          Activity{" "}
          <select
            aria-label="Activity"
            value={activity}
            onChange={(event) =>
              select(event.target.value as ScienceSparkActivityKey)
            }
          >
            {[
              "introduction",
              "lesson-1",
              "lesson-2",
              "lesson-3",
              "lesson-4",
            ].map((key) => (
              <option key={key}>{key}</option>
            ))}
          </select>
        </label>
        <button onClick={() => setWidth("100%")}>Desktop</button>
        <button onClick={() => setWidth("390px")}>Mobile 390px</button>
        <span role="status">{message}</span>
        <button
          disabled={!content}
          onClick={() => {
            if (content)
              setMessage(
                `${runScienceFrameChecks(content)} bridge/escaping assertions passed`,
              );
          }}
        >
          Check bridge safety
        </button>
        <button
          disabled={!content}
          onClick={() => {
            if (content)
              setContent({
                ...content,
                script: content.script + "\nlocation.hash='l99-forged';\n",
              });
          }}
        >
          Try forged hash
        </button>
        <button
          disabled={!content}
          onClick={() => {
            if (content)
              setContent({
                ...content,
                script: "throw new Error('development-only render failure');",
              });
          }}
        >
          Simulate render error
        </button>
      </header>
      {error ? (
        <div role="alert">
          Content unavailable.{" "}
          <button onClick={() => setRetry((value) => value + 1)}>Retry</button>
        </div>
      ) : content ? (
        <ScienceHtmlViewer
          content={content}
          sessionKey="dev-verification"
          onBackToUnit={back}
          onSelectActivity={select}
          onRetry={() => setRetry((value) => value + 1)}
        />
      ) : (
        <p>Loading private-storage fixture…</p>
      )}
    </main>
  );
}
if (import.meta.env.DEV) {
  const root =
    import.meta.hot?.data.scienceRoot ??
    createRoot(document.getElementById("root")!);
  root.render(<Harness />);
  import.meta.hot?.dispose((data) => {
    data.scienceRoot = root;
  });
}
