import {
  buildScienceSrcDoc,
  isScienceFrameMessage,
} from "../src/components/science/scienceFrame";
import type { ScienceSparkHtmlContent } from "../src/types/science-spark.contract";

/** In-browser assertions for opaque-source/nonce/schema rejection and safe srcDoc assembly. */
export function runScienceFrameChecks(content: ScienceSparkHtmlContent) {
  let passed = 0;
  const assert = (condition: boolean) => {
    if (!condition) throw new Error("Science frame verification failed");
    passed++;
  };
  const nonce = "a".repeat(32);
  const current = window;
  const message = { type: "ready", activityKey: content.activityKey, nonce };
  const event = (data: unknown, source: Window | null = current) =>
    new MessageEvent("message", { data, source });
  assert(
    isScienceFrameMessage(event(message), current, content.activityKey, nonce),
  );
  for (const data of [
    null,
    [],
    "ready",
    { ...message, type: ["ready"] },
    { ...message, nonce: "old-frame" },
    { ...message, activityKey: "practice" },
    { ...message, type: "complete" },
    { ...message, userId: "spoof" },
    { ...message, type: "activity", targetActivityKey: "quiz" },
  ])
    assert(
      !isScienceFrameMessage(event(data), current, content.activityKey, nonce),
    );
  assert(
    !isScienceFrameMessage(
      event(message, null),
      current,
      content.activityKey,
      nonce,
    ),
  );
  assert(
    !isScienceFrameMessage(event(message), null, content.activityKey, nonce),
  );
  const intro = {
    type: "activity",
    activityKey: "introduction",
    nonce,
    targetActivityKey: "lesson-2",
  };
  assert(isScienceFrameMessage(event(intro), current, "introduction", nonce));
  assert(!isScienceFrameMessage(event(intro), current, "lesson-1", nonce));
  const injected: ScienceSparkHtmlContent = {
    ...content,
    moduleData: { marker: "</script><img src=x onerror=alert(1)>" },
    script: "// </script><script>alert('escape')</script>\n",
    css: "/* </style><script>escape</script> */",
  };
  const srcDoc = buildScienceSrcDoc(injected, nonce);
  const parsed = new DOMParser().parseFromString(srcDoc, "text/html");
  assert(parsed.querySelectorAll("script").length === 1);
  assert(parsed.querySelectorAll('img[src="x"]').length === 0);
  assert(
    parsed
      .querySelector('meta[http-equiv="Content-Security-Policy"]')
      ?.getAttribute("content")
      ?.includes("connect-src 'none'") === true,
  );
  assert(!srcDoc.includes("allow-same-origin"));
  return passed;
}
