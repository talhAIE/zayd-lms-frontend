import type { ScienceSparkPracticeContent } from "@/types/science-spark.contract";

/** Defense in depth: external content can never become arbitrary frame/link URLs. */
export function validateSciencePractice(content: ScienceSparkPracticeContent) {
  const embed = new URL(content.embedUrl);
  const details = new URL(content.detailsUrl);
  const safe = (url: URL, host: string) =>
    url.protocol === "https:" &&
    url.hostname === host &&
    !url.username &&
    !url.password &&
    !url.port &&
    !url.hash;
  if (
    content.kind !== "external_practice" ||
    content.activityKey !== "practice" ||
    content.provider !== "kahoot" ||
    !["preview", "assignment"].includes(content.embedMode) ||
    !safe(embed, "embed.kahoot.it") ||
    !embed.pathname.slice(1) ||
    !safe(details, "create.kahoot.it") ||
    !details.pathname.startsWith("/details/") ||
    details.search
  ) {
    throw new Error("Invalid Science Practice configuration");
  }
  return { embedUrl: embed.href, detailsUrl: details.href };
}
