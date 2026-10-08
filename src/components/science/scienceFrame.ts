import type {
  ScienceSparkActivityKey,
  ScienceSparkHtmlContent,
} from "../../types/science-spark.contract";

export type ScienceFrameMessage =
  | {
      type: "ready" | "unavailable" | "unit";
      activityKey: ScienceSparkActivityKey;
      nonce: string;
    }
  | {
      type: "activity";
      activityKey: "introduction";
      nonce: string;
      targetActivityKey: "lesson-1" | "lesson-2" | "lesson-3" | "lesson-4";
    };

const jsonForScript = (value: unknown) =>
  JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");

export function isScienceFrameMessage(
  event: MessageEvent,
  source: Window | null,
  activityKey: ScienceSparkActivityKey,
  nonce: string,
): event is MessageEvent<ScienceFrameMessage> {
  if (
    !source ||
    event.source !== source ||
    !event.data ||
    typeof event.data !== "object" ||
    Array.isArray(event.data)
  )
    return false;
  const message = event.data as Record<string, unknown>;
  if (typeof message.type !== "string") return false;
  if (message.activityKey !== activityKey || message.nonce !== nonce)
    return false;
  const keys = Object.keys(message).sort().join(",");
  if (["ready", "unavailable", "unit"].includes(message.type))
    return keys === "activityKey,nonce,type";
  return (
    message.type === "activity" &&
    activityKey === "introduction" &&
    keys === "activityKey,nonce,targetActivityKey,type" &&
    typeof message.targetActivityKey === "string" &&
    ["lesson-1", "lesson-2", "lesson-3", "lesson-4"].includes(
      message.targetActivityKey,
    )
  );
}

/** Assemble only the authenticated trusted payload; no JWT or parent storage enters this frame. */
export function buildScienceSrcDoc(
  content: ScienceSparkHtmlContent,
  nonce: string,
): string {
  if (
    !/^[a-f0-9]{32}$/.test(nonce) ||
    !content.allowedSectionIds.includes(content.entrySectionId)
  )
    throw new Error("Invalid Science frame");
  const document = new DOMParser().parseFromString(content.html, "text/html");
  document
    .querySelectorAll("script, link, base, iframe, object, embed")
    .forEach((element) => element.remove());
  for (const element of document.querySelectorAll("[src]")) {
    const path = element.getAttribute("src")!;
    const asset = content.assets[path as keyof typeof content.assets];
    if (
      !asset ||
      !/^data:image\/(png|jpeg);base64,[A-Za-z0-9+/=]+$/.test(asset)
    )
      throw new Error("Missing Science image");
    element.setAttribute("src", asset);
  }
  const policy = document.createElement("meta");
  policy.httpEquiv = "Content-Security-Policy";
  policy.content = `default-src 'none'; script-src 'nonce-${nonce}'; style-src 'unsafe-inline'; img-src data:; connect-src 'none'; frame-src 'none'; base-uri 'none'; form-action 'none';`;
  document.head.prepend(policy);
  const style = document.createElement("style");
  style.textContent = content.css.replace(/<\/style/gi, "<\\/style");
  document.head.append(style);
  const script = document.createElement("script");
  script.setAttribute("nonce", nonce);
  script.textContent = `window.__SCIENCE_FRAME=Object.freeze({nonce:${jsonForScript(nonce)}});\nwindow.SCIENCE_MODULE=${jsonForScript(content.moduleData)};\nconst reportUnavailable=()=>parent.postMessage({type:'unavailable',activityKey:${jsonForScript(content.activityKey)},nonce:${jsonForScript(nonce)}},'*');\nwindow.addEventListener('error',reportUnavailable);\nconst assets=${jsonForScript(content.assets)};\nlocation.hash=${jsonForScript(content.entrySectionId)};\ndocument.addEventListener('click',event=>{const anchor=event.target.closest('a[href]');if(!anchor)return;const href=anchor.getAttribute('href');if(!href.startsWith('#'))return;event.preventDefault();if(anchor.hasAttribute('data-science-activity'))return;if(href==='#content'){document.getElementById('content').focus();return;}location.hash=href.slice(1);});\nconst renderer=document.createElement('script');renderer.setAttribute('nonce',${jsonForScript(nonce)});let source=${jsonForScript(content.script)};Object.entries(assets).forEach(([path,url])=>{source=source.split(path).join(url);});renderer.textContent=source;document.body.append(renderer);`;
  document.body.append(script);
  // JSON is escaped above; authored CSS cannot terminate its style element.
  return "<!doctype html>\n" + document.documentElement.outerHTML;
}
