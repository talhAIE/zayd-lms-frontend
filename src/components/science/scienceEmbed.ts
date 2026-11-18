/** Provider URLs only. Original published catalogs remain immutable. */
export function scienceEmbedUrl(
  kind: "kahoot" | "phet",
  source: string,
): string {
  const url = new URL(source);
  if (url.protocol !== "https:" || url.username || url.password || url.port)
    throw new Error("Invalid Science player URL");
  if (kind === "kahoot") {
    const match = url.pathname.match(
      /^\/details\/(?:[^/]+\/)?([0-9a-f-]{36})\/?$/i,
    );
    if (
      url.hostname !== "create.kahoot.it" ||
      !match ||
      url.hash ||
      (url.search && url.search !== "?drawer=")
    )
      throw new Error("Invalid Kahoot activity");
    return `https://embed.kahoot.it/${match[1]}`;
  }
  if (url.hostname !== "phet.colorado.edu")
    throw new Error("Invalid PhET activity");
  if (
    url.pathname === "/en/simulations/friction" &&
    !url.search &&
    (!url.hash || url.hash === "#translations-header")
  )
    return "https://phet.colorado.edu/sims/html/friction/latest/friction_en.html";
  if (url.hash) throw new Error("Invalid PhET player");
  if (
    /^\/sims\/html\/(forces-and-motion-basics|gravity-force-lab|energy-skate-park-basics|quantum-wave-interference)\/latest\/\1_(en|all)\.html$/.test(
      url.pathname,
    ) &&
    !url.search
  )
    return url.href;
  const legacy = url.pathname.match(
    /^\/sims\/cheerpj\/(moving-man|ladybug-motion-2d)\/latest\/\1\.html$/,
  );
  if (legacy && url.search === `?simulation=${legacy[1]}`) return url.href;
  throw new Error("Invalid PhET player");
}
