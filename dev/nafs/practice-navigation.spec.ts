import { test, expect, type Page } from "@playwright/test";

// Entirely synthetic learner DTOs. No client packages, answer keys or database writes.
const courseId = "11111111-1111-4111-8111-111111111111";
const collectionId = "22222222-2222-4222-8222-222222222222";
const coursePath = `/student/nafs/courses/${courseId}`;
const overviewPath = `/student/nafs/practice/collections/${collectionId}`;
async function fixture(page: Page, region: string | null = "ROW") {
  await page.addInitScript(
    ({ region }) => {
      localStorage.setItem(
        "AiTutorUser",
        JSON.stringify({
          id: "pm4.synthetic",
          username: "pm4.synthetic",
          role: "student",
          region,
          firstName: "Synthetic",
        }),
      );
      localStorage.setItem("accessToken", "pm4.synthetic.token");
      localStorage.setItem("refreshToken", "pm4.synthetic.refresh");
    },
    { region },
  );
  const state = {
    modes: 200,
    available: true,
    empty: false,
    collectionError: 0,
    overviewError: 0,
    metadataError: false,
    hidden: false,
    progress: "not_started",
    delayModes: 0,
    delayOverview: 0,
    ordinary: true,
    delayCourses: 0,
    requests: [] as {
      path: string;
      method: string;
      auth: string | undefined;
    }[],
  };
  const collection = () => ({
    id: collectionId,
    courseId,
    title: "Quiz 1",
    questionCount: 250,
    totalMarks: 250,
    state: state.progress,
    activeSessionId:
      state.progress === "in_progress" ? "synthetic-active" : null,
    latestCompletedSessionId:
      state.progress === "completed" ? "synthetic-completed" : null,
  });
  await page.route("**/*", async (route) => {
    const req = route.request(),
      url = new URL(req.url());
    if (url.hostname !== "127.0.0.1") return route.abort();
    if (!url.pathname.startsWith("/api/v1/")) return route.continue();
    const path = url.pathname.slice("/api/v1".length);
    state.requests.push({
      path,
      method: req.method(),
      auth: req.headers().authorization,
    });
    const json = (data: unknown, status = 200) =>
      route.fulfill({ status, json: { status: true, data } });
    const error = (status: number) =>
      route.fulfill({
        status,
        json: {
          statusCode: status,
          code:
            status === 404
              ? "NAFS_PRACTICE_NOT_FOUND"
              : "NAFS_PRACTICE_UNAVAILABLE",
          message: "Synthetic failure",
        },
      });
    if (path === "/learning/courses")
      return json({
        courses: state.ordinary
          ? [
              {
                id: "ordinary-course",
                title: "Existing English course",
                progressStatus: "not_started",
                progressPct: 0,
              },
            ]
          : [],
      });
    if (path === "/nafs/courses") {
      if (state.delayCourses)
        await new Promise((resolve) => setTimeout(resolve, state.delayCourses));
      if (state.metadataError) return error(503);
      return json({
        courses: state.hidden
          ? []
          : [
              {
                id: courseId,
                assessmentId: courseId,
                courseTitle: "NAFS Math Grade 9",
                assessmentTitle: "Form A",
                gradeLabel: "9",
                subject: "math",
                questionCount: 30,
                state: "in_progress",
                attemptId: null,
                result: null,
              },
            ],
      });
    }
    if (path === `/nafs/courses/${courseId}/modes`) {
      if (state.delayModes)
        await new Promise((resolve) => setTimeout(resolve, state.delayModes));
      if (state.modes !== 200) return error(state.modes);
      return json({
        courseId,
        courseTitle: "NAFS Math Grade 9",
        subject: "math",
        gradeLabel: "9",
        quiz: { assessmentId: courseId, feedbackPolicy: "final_total_only" },
        practice: { available: state.available },
      });
    }
    if (path === "/nafs/practice/collections") {
      expect(url.searchParams.get("courseId")).toBe(courseId);
      if (state.collectionError) return error(state.collectionError);
      return json({ courseId, collections: state.empty ? [] : [collection()] });
    }
    if (path === `/nafs/practice/collections/${collectionId}`) {
      if (state.delayOverview)
        await new Promise((resolve) =>
          setTimeout(resolve, state.delayOverview),
        );
      if (state.overviewError) return error(state.overviewError);
      return json({
        collection: {
          ...collection(),
          instructions: ["Synthetic collection instructions."],
          policy: {
            checkAction: "explicit",
            retries: "unlimited",
            progression: "manual",
            completion: "all_current_selections_checked",
            repeat: "explicit_new_run_after_completion",
            scoring: "latest_checked_answer_one_mark",
            feedback: "checked_option_correctness_only",
            timerSeconds: null,
          },
        },
      });
    }
    if (path === `/nafs/assessments/${courseId}`)
      return json({
        assessment: {
          id: courseId,
          courseId,
          title: "Form A",
          instructions: [],
          questionCount: 30,
          totalMarks: 30,
          state: "not_started",
          attemptId: null,
          maxAttempts: 1,
          timerSeconds: null,
          requiresAllAnswers: true,
          feedbackPolicy: "final_total_only",
        },
      });
    return json({}, 404);
  });
  return state;
}

for (const width of [1440, 390]) {
  test(`practice navigation ${width}px: course -> modes -> Quiz 1 overview -> back, no session writes`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width, height: 900 });
    const state = await fixture(page);
    await page.goto("/student/courses");
    await expect(page.getByText(/1 course in progress/)).toBeVisible();
    await page.getByRole("link", { name: "Open course", exact: true }).click();
    await expect(
      page.getByRole("heading", { name: "NAFS Math Grade 9" }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Open Quiz Mode" }),
    ).toHaveAttribute("href", `/student/nafs/assessments/${courseId}`);
    await page.getByRole("link", { name: "Open Practice Mode" }).click();
    await expect(page.getByText("250 questions · 250 marks")).toBeVisible();
    await page.getByRole("link", { name: "View Quiz 1" }).click();
    await expect(
      page.getByRole("heading", { name: "Quiz 1", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByText("Synthetic collection instructions."),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Start practice" }),
    ).toBeEnabled();
    await expect(page.getByText(/Domain|Strand|Indicator|Outcome/)).toHaveCount(
      0,
    );
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: testInfo.outputPath(`practice-overview-${width}.png`),
      fullPage: true,
    });
    await page.getByRole("link", { name: "Back to Practice Mode" }).click();
    await page.getByRole("link", { name: "Back to modes" }).click();
    await page.getByRole("link", { name: "Open Quiz Mode" }).click();
    await expect(
      page.getByRole("button", { name: "Start quiz", exact: true }),
    ).toBeVisible();
    expect(
      state.requests.filter(
        (r) => r.path.startsWith("/nafs/") && r.method !== "GET",
      ),
    ).toEqual([]);
    expect(
      state.requests
        .filter((r) => r.path.startsWith("/nafs/"))
        .every((r) => r.auth === "Bearer pm4.synthetic.token"),
    ).toBe(true);
  });
}
test("practice unavailable disables only practice; legacy Quiz bookmark works", async ({
  page,
}) => {
  const state = await fixture(page);
  state.available = false;
  await page.goto(coursePath);
  await expect(
    page.getByRole("button", { name: "Open Practice Mode" }),
  ).toBeDisabled();
  await page.getByRole("link", { name: "Open Quiz Mode" }).click();
  await expect(
    page.getByRole("button", { name: "Start quiz", exact: true }),
  ).toBeVisible();
});
test("old backend 404 falls back to the known legacy assessment", async ({
  page,
}) => {
  const state = await fixture(page);
  state.modes = 404;
  await page.goto(coursePath);
  await expect(page).toHaveURL(`/student/nafs/assessments/${courseId}`);
  await expect(
    page.getByRole("button", { name: "Start quiz", exact: true }),
  ).toBeVisible();
});
test("503 offers retry and Quiz link without pretending practice is available", async ({
  page,
}) => {
  const state = await fixture(page);
  state.modes = 503;
  await page.goto(coursePath);
  await expect(page.getByRole("alert")).toContainText(
    "Mode availability could not load",
  );
  await expect(
    page.getByRole("link", { name: "Open Quiz Mode" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Open Practice Mode" }),
  ).toBeDisabled();
  state.modes = 200;
  await page.getByRole("button", { name: "Try loading again" }).click();
  await expect(
    page.getByRole("link", { name: "Open Practice Mode" }),
  ).toBeVisible();
});
test("slow modes never delays the Quiz link; optional metadata failure does not block practice", async ({
  page,
}) => {
  const state = await fixture(page);
  state.delayModes = 1000;
  state.metadataError = true;
  await page.goto(coursePath);
  await expect(
    page.getByRole("link", { name: "Open Quiz Mode" }),
  ).toBeVisible();
  await expect(page.getByText("Loading mode availability…")).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Open Practice Mode" }),
  ).toBeVisible();
});
test("empty and failed collection states recover independently of modes", async ({
  page,
}) => {
  const state = await fixture(page);
  state.collectionError = 503;
  await page.goto(`${coursePath}/practice`);
  await expect(page.getByRole("alert")).toContainText(
    "Practice Mode could not load",
  );
  state.collectionError = 0;
  state.empty = true;
  await page.getByRole("button", { name: "Try loading again" }).click();
  await expect(
    page.getByText(
      "No practice collections are available for this course yet.",
    ),
  ).toBeVisible();
  await page.getByRole("link", { name: "Back to modes" }).click();
  await expect(
    page.getByRole("link", { name: "Open Quiz Mode" }),
  ).toBeVisible();
});
test("direct overview denial reveals no collection, retries and does not start practice", async ({
  page,
}) => {
  const state = await fixture(page);
  state.overviewError = 404;
  await page.goto(overviewPath);
  await expect(page.getByRole("alert")).toContainText(
    "unavailable or you do not have access",
  );
  await expect(page.getByRole("heading", { name: "Quiz 1" })).toHaveCount(0);
  state.overviewError = 0;
  await page.getByRole("button", { name: "Try loading again" }).click();
  await expect(page.getByRole("heading", { name: "Quiz 1" })).toBeVisible();
  expect(state.requests.every((r) => r.method === "GET")).toBe(true);
});
for (const [progress, label] of [
  ["in_progress", "Resume practice"],
  ["completed", "View practice result"],
]) {
  test(`${progress} overview uses backend state without merging Quiz progress`, async ({
    page,
  }) => {
    const state = await fixture(page);
    state.progress = progress;
    await page.goto(overviewPath);
    await expect(page.getByRole("button", { name: label })).toBeEnabled();
    await page.goto("/student/courses");
    await expect(page.getByText(/1 course in progress/)).toBeVisible();
    await expect(
      page.getByText("Quiz Mode · Form A · 30 questions"),
    ).toBeVisible();
    expect(
      state.requests.filter((r) => r.path.startsWith("/nafs/practice/")),
    ).toHaveLength(1);
  });
}
test("missing region fails closed for practice while existing Quiz navigation works", async ({
  page,
}) => {
  const state = await fixture(page, null);
  await page.goto(overviewPath);
  await expect(page.getByRole("alert")).toContainText("sign in again");
  expect(
    state.requests.filter((r) => r.path.startsWith("/nafs/practice/")),
  ).toHaveLength(0);
  await page.goto(coursePath);
  await expect(
    page.getByRole("link", { name: "Open Quiz Mode" }),
  ).toBeVisible();
});
test("hidden NAFS discovery leaves ordinary courses available", async ({
  page,
}) => {
  const state = await fixture(page);
  state.hidden = true;
  await page.goto("/student/courses");
  await expect(
    page.getByRole("heading", { name: "Existing English course" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Open course", exact: true }),
  ).toHaveCount(0);
});
test("a region change discards an in-flight practice response", async ({
  page,
}) => {
  const state = await fixture(page);
  state.delayOverview = 1200;
  await page.goto(overviewPath);
  await expect(page.getByText("Loading practice overview…")).toBeVisible();
  await page.evaluate(() => {
    const user = JSON.parse(localStorage.getItem("AiTutorUser")!);
    localStorage.setItem(
      "AiTutorUser",
      JSON.stringify({ ...user, region: "SAUDI" }),
    );
  });
  await expect(page.getByRole("alert")).toContainText("could not load");
  await expect(page.getByRole("heading", { name: "Quiz 1" })).toHaveCount(0);
});
test("slow NAFS discovery does not show a premature empty curriculum", async ({
  page,
}) => {
  const state = await fixture(page);
  state.ordinary = false;
  state.delayCourses = 1200;
  await page.goto("/student/courses");
  await expect(page.getByText("Loading NAFS courses…")).toBeVisible();
  await expect(page.getByText("No curriculum courses available.")).toHaveCount(
    0,
  );
  await expect(
    page.getByRole("link", { name: "Open course", exact: true }),
  ).toBeVisible();
});
test("failed NAFS discovery shows retry rather than an empty curriculum", async ({
  page,
}) => {
  const state = await fixture(page);
  state.ordinary = false;
  state.metadataError = true;
  await page.goto("/student/courses");
  await expect(
    page.getByRole("button", { name: "Retry loading NAFS" }),
  ).toBeVisible();
  await expect(page.getByText("No curriculum courses available.")).toHaveCount(
    0,
  );
  state.metadataError = false;
  await page.getByRole("button", { name: "Retry loading NAFS" }).click();
  await expect(
    page.getByRole("link", { name: "Open course", exact: true }),
  ).toBeVisible();
});
