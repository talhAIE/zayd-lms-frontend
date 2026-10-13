export const SPARK_COURSE_PATH = "/student/science/spark-science";
export const SPARK_UNIT_PATH = `${SPARK_COURSE_PATH}/unit-1`;

// Use the course hierarchy instead of browser history, which also contains
// iframe navigation and repeated completion visits.
export function sparkScienceBackTarget(pathname: string, search = ""): string | null {
  if (pathname.startsWith(`${SPARK_UNIT_PATH}/activities/`)) {
    if (/\/activities\/lesson-[123]$/.test(pathname) && new URLSearchParams(search).get("view") === "interactive")
      return pathname;
    return SPARK_UNIT_PATH;
  }
  if (pathname === SPARK_UNIT_PATH) return SPARK_COURSE_PATH;
  if (pathname === SPARK_COURSE_PATH) return "/student/courses";
  return null;
}
