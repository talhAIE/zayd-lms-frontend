export const SPARK_COURSE_PATH = "/student/science/spark-science";
export const SPARK_UNIT_PATH = `${SPARK_COURSE_PATH}/unit-2`;

// Use the course hierarchy instead of browser history, which also contains
// iframe navigation and repeated completion visits.
export function sparkScienceBackTarget(
  pathname: string,
  search = "",
): string | null {
  const unitPath =
    pathname.match(
      /^(\/student\/science\/spark-science\/unit-[23])(?:\/|$)/,
    )?.[1] ?? SPARK_UNIT_PATH;
  if (pathname.startsWith(`${unitPath}/activities/`)) {
    const nested = pathname.match(
      /\/activities\/(lesson-[123])-(interactive|quiz|kahoot|phet)$/,
    );
    if (nested) return `${unitPath}/activities/${nested[1]}`;
    if (
      /\/activities\/lesson-[123]$/.test(pathname) &&
      new URLSearchParams(search).get("view") === "interactive"
    )
      return pathname;
    return unitPath;
  }
  if (pathname === unitPath) return SPARK_COURSE_PATH;
  if (pathname === SPARK_COURSE_PATH) return "/student/courses";
  return null;
}
