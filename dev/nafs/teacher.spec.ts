import { expect, test, type Page } from "@playwright/test";
import type { TeacherProgramResult } from "../../src/services/nafsService";

const teacher = {
  id: "teacher-browser",
  username: "qa.teacher",
  role: "teacher",
  firstName: "Test",
  lastName: "Teacher",
};
const assessments = [
  { id: "english", courseTitle: "NAFS English - Grade 6" },
  { id: "math", courseTitle: "NAFS Mathematics - Grade 6" },
];
const rows = Array.from({ length: 23 }, (_, i) => ({
  student: {
    id: `student-${i}`,
    displayName: `Student ${String(i + 1).padStart(2, "0")}`,
    username: `qa.student${i + 1}`,
  },
  assessment: { ...assessments[i % 2], totalMarks: 10 },
  state: i < 3 ? "completed" : "not_completed",
  earnedMarks: i < 3 ? [0, 10, 5][i] : null,
  completedAt: i < 3 ? "2026-11-04T06:00:00.000Z" : null,
}));
async function fixture(
  page: Page,
  options: {
    unavailable?: boolean;
    ordinaryError?: boolean;
    initialFailure?: boolean;
    missingRoute?: boolean;
  } = {},
) {
  const state = {
    fail: !!options.initialFailure,
    unavailable: !!options.unavailable,
    requests: [] as URL[],
    normalRequests: 0,
    delay: 0,
    keep: rows.length,
    programs: [] as TeacherProgramResult[],
    failPrograms: false,
  };
  await page.addInitScript((u) => {
    localStorage.setItem("AiTutorUser", JSON.stringify(u));
    localStorage.setItem("accessToken", "teacher-browser-token");
    localStorage.setItem("refreshToken", "teacher-browser-refresh");
  }, teacher);
  await page.route("**/*", async (route) => {
    const url = new URL(route.request().url());
    if (url.hostname !== "127.0.0.1") {
      await route.abort();
      return;
    }
    if (!url.pathname.startsWith("/api/")) {
      await route.continue();
      return;
    }
    if (url.pathname === "/api/v1/teacher/me/program-results") {
      await route.fulfill(
        state.failPrograms
          ? { status: 503, json: { message: "Unavailable" } }
          : { json: { status: true, data: { results: state.programs } } },
      );
      return;
    }
    if (url.pathname === "/api/v1/nafs/teacher/results") {
      state.requests.push(url);
      if (state.delay)
        await new Promise((resolve) => setTimeout(resolve, state.delay));
      if (options.missingRoute) {
        await route.fulfill({ status: 404, json: {} });
        return;
      }
      if (state.fail) {
        await route.fulfill({
          status: 503,
          json: { code: "NAFS_UNAVAILABLE" },
        });
        return;
      }
      const filtered = state.unavailable
        ? []
        : rows
            .slice(0, state.keep)
            .filter(
              (r) =>
                (!url.searchParams.has("assessmentId") ||
                  url.searchParams.get("assessmentId") === r.assessment.id) &&
                (!url.searchParams.has("completion") ||
                  url.searchParams.get("completion") === r.state),
            );
      const pageNumber = Number(url.searchParams.get("page") ?? 1),
        limit = Number(url.searchParams.get("limit") ?? 10);
      await route.fulfill({
        json: {
          status: true,
          data: {
            results: filtered.slice(
              (pageNumber - 1) * limit,
              pageNumber * limit,
            ),
            assessments: state.unavailable ? [] : assessments,
            pagination: {
              page: pageNumber,
              limit,
              total: filtered.length,
              totalPages: Math.ceil(filtered.length / limit),
            },
          },
        },
      });
      return;
    }
    if (url.pathname === "/api/v1/teacher/me/dashboard") {
      state.normalRequests++;
      if (options.ordinaryError) {
        await route.fulfill({
          status: 503,
          json: { message: "Ordinary dashboard unavailable" },
        });
        return;
      }
      await route.fulfill({
        json: {
          status: true,
          data: {
            teacher,
            students: [],
            summary: {
              totalStudents: 7,
              activeStudents: 5,
              inactiveStudents: 2,
              totalUsageSec: 3600,
              totalCompletedLessons: 3,
              totalCompletedLessonModes: 4,
              averageProgressPct: 42,
            },
            pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
          },
        },
      });
      return;
    }
    if (url.pathname === "/api/v1/teacher/me/filters") {
      await route.fulfill({
        json: { status: true, data: { classes: [], cefrLevels: [] } },
      });
      return;
    }
    await route.fulfill({ status: 404, json: {} });
  });
  return state;
}

for (const viewport of [
  { width: 1440, height: 1000 },
  { width: 390, height: 844 },
]) {
  test(`teacher results ${viewport.width}px: marks, filters, pagination and ordinary dashboard isolation`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    const state = await fixture(page);
    await page.goto("/teacher/dashboard");
    const section = page.getByRole("region", { name: "NAFS results" });
    await expect(section).toBeVisible();
    const mobile = viewport.width < 640;
    const results = mobile
      ? section.getByRole("list", { name: "NAFS student results" })
      : section.getByRole("table");
    const resultRows = () =>
      mobile ? results.getByRole("listitem") : results.getByRole("row");
    const mark = (value: string) =>
      mobile
        ? results.getByText(value, { exact: true })
        : results.getByRole("cell", { name: value, exact: true });
    await expect(mark("0 / 10")).toBeVisible();
    await expect(mark("10 / 10")).toBeVisible();
    await expect(mark("5 / 10")).toBeVisible();
    await expect(resultRows()).toHaveCount(mobile ? 10 : 11);
    await expect(
      page.getByText("Assigned Learners", { exact: true }).locator(".."),
    ).toContainText("7");
    const normalRequests = state.normalRequests;
    await section
      .getByRole("button", { name: "Next NAFS results page" })
      .click();
    await expect(section.getByText("Page 2 of 3")).toBeVisible();
    await expect(
      results.getByText("Student 11", { exact: true }),
    ).toBeVisible();
    await section
      .getByLabel("NAFS completion", { exact: true })
      .selectOption("completed");
    await expect(section.getByText("Page 1 of 1")).toBeVisible();
    await expect(resultRows()).toHaveCount(mobile ? 3 : 4);
    await section
      .getByLabel("NAFS assessment", { exact: true })
      .selectOption("math");
    await expect(resultRows()).toHaveCount(mobile ? 1 : 2);
    await expect(
      results.getByText("Student 02", { exact: true }),
    ).toBeVisible();
    await section
      .getByLabel("NAFS completion", { exact: true })
      .selectOption("not_completed");
    await expect(
      results.getByText("Student 04", { exact: true }),
    ).toBeVisible();
    await expect(results.getByText("0 / 10", { exact: true })).toHaveCount(0);
    await section.getByRole("button", { name: "Clear NAFS filters" }).click();
    await expect(section.getByText("Page 1 of 3")).toBeVisible();
    await expect(
      section.getByLabel("NAFS assessment", { exact: true }),
    ).toHaveValue("all");
    expect(state.normalRequests).toBe(normalRequests);
    for (const url of state.requests)
      expect(
        [...url.searchParams.keys()].every((k) =>
          ["page", "limit", "assessmentId", "completion"].includes(k),
        ),
      ).toBe(true);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: `dev/.nafs-qa/teacher-${viewport.width}.png`,
      fullPage: true,
    });
    expect(errors).toEqual([]);
  });
}

test("NAFS remains usable if the ordinary dashboard fails", async ({
  page,
}) => {
  await fixture(page, { ordinaryError: true });
  await page.goto("/teacher/dashboard");
  await expect(
    page.getByRole("region", { name: "NAFS results" }),
  ).toBeVisible();
  await expect(page.getByText(/Error loading students data/)).toBeVisible();
  await expect(
    page.getByRole("cell", { name: "0 / 10", exact: true }),
  ).toBeVisible();
});

for (const width of [1440, 390])
  test(`Science teacher program scope and progress ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    const state = await fixture(page, { unavailable: true });
    state.programs = Array.from({ length: 12 }, (_, i) => ({
      student: {
        id: `s${i}`,
        username: `sci.student${i}`,
        displayName: `Science Student ${i}`,
        class: "9G",
      },
      course: {
        key: "spark-science-motion",
        title: "Spark Science",
        unitTitle: "Motion",
      },
      completedActivities: i === 0 ? 5 : 1,
      totalActivities: 5,
      progressPct: i === 0 ? 100 : 20,
      state: i === 0 ? "completed" : "in_progress",
    }));
    await page.goto("/teacher/dashboard");
    const section = page.getByRole("region", {
      name: "Spark Science progress",
    });
    await expect(section).toBeVisible();
    await expect(
      section.getByText("5 / 5 activities completed (100%)"),
    ).toBeVisible();
    await expect(section.getByRole("listitem")).toHaveCount(10);
    await expect(
      page.getByRole("region", { name: "NAFS results" }),
    ).toHaveCount(0);
    await section.getByRole("button", { name: "Next Science page" }).click();
    await expect(section.getByRole("listitem")).toHaveCount(2);
    await section
      .getByLabel("Science completion", { exact: true })
      .selectOption("completed");
    await expect(section.getByRole("listitem")).toHaveCount(1);
    await expect(section.getByText("Page 1 of 1")).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: `dev/.nafs-qa/science-teacher-${width}.png`,
      fullPage: true,
    });
    state.programs = [];
    await section
      .getByRole("button", { name: "Refresh Science progress" })
      .click();
    await expect(section).toHaveCount(0);
  });

test("Science progress failure leaves NAFS and ordinary dashboard available", async ({
  page,
}) => {
  const state = await fixture(page);
  state.failPrograms = true;
  await page.goto("/teacher/dashboard");
  await expect(
    page.getByRole("region", { name: "Spark Science progress" }),
  ).toContainText("Could not load Science progress.");
  await expect(
    page.getByRole("region", { name: "NAFS results" }),
  ).toBeVisible();
  await expect(
    page.getByText("Assigned Learners", { exact: true }),
  ).toBeVisible();
  state.failPrograms = false;
  await page.getByRole("button", { name: "Retry Science progress" }).click();
  await expect(
    page.getByRole("region", { name: "Spark Science progress" }),
  ).toHaveCount(0);
});

test("NAFS failure has a retry and does not hide ordinary statistics", async ({
  page,
}) => {
  const state = await fixture(page, { initialFailure: true });
  await page.goto("/teacher/dashboard");
  await expect(page.getByRole("alert")).toContainText(
    "Could not load NAFS results",
  );
  await expect(
    page.getByText("Assigned Learners", { exact: true }),
  ).toBeVisible();
  state.fail = false;
  await page.getByRole("button", { name: "Retry NAFS results" }).click();
  await expect(
    page.getByRole("cell", { name: "0 / 10", exact: true }),
  ).toBeVisible();
});

for (const missingRoute of [false, true])
  test(`no grant/feature off or absent route hides NAFS (${missingRoute})`, async ({
    page,
  }) => {
    const state = await fixture(page, { unavailable: true, missingRoute });
    await page.goto("/teacher/dashboard");
    await expect.poll(() => state.requests.length).toBeGreaterThan(0);
    await expect(
      page.getByText("Assigned Learners", { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("region", { name: "NAFS results" }),
    ).toHaveCount(0);
  });

test("refresh can remove revoked access without keeping stale results", async ({
  page,
}) => {
  const state = await fixture(page);
  await page.goto("/teacher/dashboard");
  await expect(
    page.getByRole("region", { name: "NAFS results" }),
  ).toBeVisible();
  state.unavailable = true;
  await page.getByRole("button", { name: "Refresh NAFS results" }).click();
  await expect(page.getByRole("region", { name: "NAFS results" })).toHaveCount(
    0,
  );
  await expect(
    page.getByText("Assigned Learners", { exact: true }),
  ).toBeVisible();
});

test("changing accounts clears cached teacher results and cancels a late response", async ({
  page,
}) => {
  const state = await fixture(page);
  await page.goto("/teacher/dashboard");
  await expect(
    page.getByRole("region", { name: "NAFS results" }),
  ).toBeVisible();
  state.delay = 500;
  await page.getByRole("button", { name: "Refresh NAFS results" }).click();
  await page.evaluate(() => {
    localStorage.setItem(
      "AiTutorUser",
      JSON.stringify({
        id: "another",
        username: "another.teacher",
        role: "teacher",
      }),
    );
    window.dispatchEvent(new StorageEvent("storage", { key: "AiTutorUser" }));
  });
  await expect(page.getByRole("region", { name: "NAFS results" })).toHaveCount(
    0,
  );
  await page.waitForTimeout(600);
  await expect(page.getByRole("region", { name: "NAFS results" })).toHaveCount(
    0,
  );
});

test("refresh clamps an out-of-range page and keeps an empty filtered result understandable", async ({
  page,
}) => {
  const state = await fixture(page);
  await page.goto("/teacher/dashboard");
  const panel = page.getByRole("region", { name: "NAFS results" });
  await expect(panel.getByText("Page 1 of 3")).toBeVisible();
  await panel.getByRole("button", { name: "Next NAFS results page" }).click();
  await expect(panel.getByText("Page 2 of 3")).toBeVisible();
  await panel.getByRole("button", { name: "Next NAFS results page" }).click();
  await expect(panel.getByText("Page 3 of 3")).toBeVisible();
  state.keep = 4;
  await panel.getByRole("button", { name: "Refresh NAFS results" }).click();
  await expect(panel.getByText("Page 1 of 1")).toBeVisible();
  await expect(panel.getByRole("row")).toHaveCount(5);
  state.keep = 0;
  await panel.getByRole("button", { name: "Refresh NAFS results" }).click();
  await expect(
    panel.getByText("No students match these NAFS filters."),
  ).toBeVisible();
  await expect(
    panel.getByLabel("NAFS assessment", { exact: true }).locator("option"),
  ).toHaveCount(3);
  await expect(panel.getByText("0 results", { exact: true })).toBeVisible();
});
