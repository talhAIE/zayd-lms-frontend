import type { ScienceSparkExternalContent } from "@/types/science-spark.contract";

/** Defense in depth: external content can never become arbitrary frame/link URLs. */
export function validateSciencePractice(content: ScienceSparkExternalContent) {
  if (content.kind === "external_simulation") {
    const simulationUrl = "https://phet.colorado.edu/en/simulations/quantum-wave-interference";
    const embedUrl = "https://phet.colorado.edu/sims/html/quantum-wave-interference/latest/quantum-wave-interference_en.html";
    if (content.activityKey !== "simulation" || content.provider !== "phet" ||
      content.embedUrl !== embedUrl || content.detailsUrl !== simulationUrl) {
      throw new Error("Invalid Science Simulation configuration");
    }
    return { embedUrl, detailsUrl: simulationUrl };
  }
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
