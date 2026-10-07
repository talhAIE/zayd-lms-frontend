import { useEffect, useMemo, useRef, useState } from "react";
import type {
  ScienceSparkActivityKey,
  ScienceSparkHtmlContent,
} from "../../types/science-spark.contract";
import { buildScienceSrcDoc, isScienceFrameMessage } from "./scienceFrame";

interface Props {
  content: ScienceSparkHtmlContent;
  /** Change this key on account/session changes so the previous frame is destroyed. */
  sessionKey: string;
  onBackToUnit: () => void;
  onSelectActivity: (activityKey: ScienceSparkActivityKey) => void;
  onRetry: () => void;
}

export function ScienceHtmlViewer(props: Props) {
  const generation = useMemo(
    () =>
      Array.from(crypto.getRandomValues(new Uint8Array(16)), (value) =>
        value.toString(16).padStart(2, "0"),
      ).join(""),
    [props.content, props.sessionKey],
  );
  return <ScienceFrame key={generation} {...props} />;
}

function ScienceFrame({
  content,
  onBackToUnit,
  onSelectActivity,
  onRetry,
}: Props) {
  const iframe = useRef<HTMLIFrameElement>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "unavailable">(
    "loading",
  );
  const [nonce] = useState(() =>
    Array.from(crypto.getRandomValues(new Uint8Array(16)), (value) =>
      value.toString(16).padStart(2, "0"),
    ).join(""),
  );
  const srcDoc = useMemo(() => {
    try {
      return buildScienceSrcDoc(content, nonce);
    } catch {
      return null;
    }
  }, [content, nonce]);
  useEffect(() => {
    const listener = (event: MessageEvent) => {
      if (
        !isScienceFrameMessage(
          event,
          iframe.current?.contentWindow ?? null,
          content.activityKey,
          nonce,
        )
      )
        return;
      switch (event.data.type) {
        case "ready":
          setStatus("ready");
          break;
        case "unavailable":
          setStatus("unavailable");
          break;
        case "unit":
          onBackToUnit();
          break;
        case "activity":
          onSelectActivity(event.data.targetActivityKey);
          break;
      }
    };
    window.addEventListener("message", listener);
    const timer = window.setTimeout(
      () =>
        setStatus((current) =>
          current === "loading" ? "unavailable" : current,
        ),
      15000,
    );
    return () => {
      window.removeEventListener("message", listener);
      window.clearTimeout(timer);
    };
  }, [content.activityKey, nonce, onBackToUnit, onSelectActivity]);
  if (!srcDoc || status === "unavailable")
    return (
      <div role="alert" style={{ padding: 24 }}>
        <p>Science content could not load.</p>
        <button type="button" onClick={onRetry}>
          Retry
        </button>
      </div>
    );
  return (
    <div style={{ position: "relative", width: "100%" }}>
      {status === "loading" && (
        <p
          role="status"
          style={{
            position: "absolute",
            inset: "12px auto auto 16px",
            zIndex: 1,
          }}
        >
          Loading Science…
        </p>
      )}
      <iframe
        ref={iframe}
        title={`Science — ${content.activityKey}`}
        sandbox="allow-scripts"
        referrerPolicy="no-referrer"
        srcDoc={srcDoc}
        style={{
          width: "100%",
          height: "max(560px, 82dvh)",
          border: 0,
          display: "block",
        }}
      />
    </div>
  );
}
