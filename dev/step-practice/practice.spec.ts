import { test, expect, type Page } from "@playwright/test";
import type { StepPracticeView } from "../../src/types/step-practice.contract";
const uid = (n: number) =>
  `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
async function fixture(
  page: Page,
  kind: "grammar" | "reading" | "listening" = "grammar",
) {
  const user = {
    id: uid(1),
    username: "step.synthetic",
    role: "student",
    region: "ROW",
    phoneNumber: "synthetic",
  };
  await page.addInitScript((u) => {
    localStorage.setItem("AiTutorUser", JSON.stringify(u));
    localStorage.setItem("accessToken", "synthetic");
    localStorage.setItem("refreshToken", "synthetic");
  }, user);
  const groups = Array.from({ length: kind === "grammar" ? 6 : 1 }, (_, i) => ({
    id: kind === "grammar" ? `1.1.1.${i + 1}` : "activity",
    title: [
      "Names of People, Places, Things, Ideas",
      "Countable & Uncountable Nouns",
      "Singular & Plural Forms",
      "Possessive Forms",
      "Collective Nouns",
      "Abstract Nouns",
    ][i],
    questionIds: [uid(100 + i * 2), uid(101 + i * 2)],
    checkedCount: 0,
    state: "not_started" as const,
    result: null,
  }));
  const view: StepPracticeView = {
    attempt: {
      id: uid(50),
      topicId: uid(20),
      courseId: uid(10),
      sectionId: uid(30),
      kind,
      title: kind === "grammar" ? "Nouns" : "Ants",
      contentVersion: 2,
      state: "in_progress",
      revision: 0,
      startedAt: "2026-11-17T00:00:00Z",
      lastSavedAt: null,
      audio: null,
      passage:
        kind === "reading"
          ? { id: uid(70), title: "Ants", paragraphs: ["Synthetic passage."] }
          : null,
      selections: [],
      questions: groups.flatMap((g, i) =>
        g.questionIds.map((id, j) => ({
          id,
          displayOrder: i * 2 + j + 1,
          instruction: "Choose one answer.",
          stem: `Synthetic question ${i * 2 + j + 1}`,
          grouping:
            kind === "grammar"
              ? { id: g.id, title: g.title, level: "A1" as const }
              : null,
          options: ["A", "B", "C", "D"].map((label, k) => ({
            id: uid(1000 + i * 20 + j * 4 + k),
            label: label as "A" | "B" | "C" | "D",
            text: `Choice ${label}`,
          })),
        })),
      ),
    },
    groups,
    feedback: [],
    result: null,
  };
  const state = {
    started: false,
    lost: false,
    lostCompletion: false,
    delayMs: 0,
    conflict: false,
    checks: [] as Array<{ requestId: string }>,
    revisionAtLoad: 0,
  };
  const receipts = new Set<string>();
  await page.route("**/*", async (route) => {
    const req = route.request();
    const url = new URL(req.url());
    if (url.hostname !== "127.0.0.1") return route.abort();
    if (!url.pathname.startsWith("/api/v1/")) return route.continue();
    const path = url.pathname.slice("/api/v1".length);
    const send = (data: unknown, status = 200) =>
      route.fulfill({ status, json: { status: true, data } });
    if (path === `/step/practice/topics/${uid(20)}`)
      return send({
        topicId: uid(20),
        sectionId: uid(30),
        title: view.attempt.title,
        state: state.started ? "in_progress" : "not_started",
        attemptId: state.started ? uid(50) : null,
        groups: view.groups,
      });
    if (path === `/step/topics/${uid(20)}/attempt`) {
      state.started = true;
      return send(view.attempt);
    }
    if (path === `/step/practice/attempts/${uid(50)}`) return send(view);
    const check = path.match(/\/questions\/([^/]+)\/check$/);
    const complete = path.match(/\/groups\/([^/]+)\/complete$/);
    if (check || complete) {
      const body = req.postDataJSON();
      if (state.delayMs)
        await new Promise((resolve) => setTimeout(resolve, state.delayMs));
      if (check) state.checks.push(body);
      if (state.conflict) {
        state.conflict = false;
        view.attempt.revision++;
        return route.fulfill({
          status: 409,
          json: { code: "STEP_REVISION_CONFLICT" },
        });
      }
      if (receipts.has(body.requestId)) return send(view);
      if (body.expectedRevision !== view.attempt.revision)
        return route.fulfill({
          status: 409,
          json: { code: "STEP_REVISION_CONFLICT" },
        });
      receipts.add(body.requestId);
      view.attempt.revision++;
      if (check) {
        const q = view.attempt.questions.find((q) => q.id === check[1])!;
        view.attempt.selections = [
          ...view.attempt.selections.filter((s) => s.questionId !== q.id),
          { questionId: q.id, optionId: body.optionId },
        ];
        view.feedback = [
          ...view.feedback.filter((f) => f.questionId !== q.id),
          {
            questionId: q.id,
            optionId: body.optionId,
            isCorrect: body.optionId === q.options[0].id,
            responseId: body.requestId,
            revision: view.attempt.revision,
            ...(kind !== "listening"
              ? {
                  explanation:
                    kind === "grammar"
                      ? "Explanation (EN): This is the supplied noun explanation.\n\nالشرح (AR): هذا شرح المصدر.\n\nHint: Identify a noun."
                      : "استراتيجية استخراج الإجابة\nUse the quoted passage evidence.",
                }
              : {}),
          },
        ];
        for (const group of view.groups) {
          group.checkedCount = view.feedback.filter((f) =>
            group.questionIds.includes(f.questionId),
          ).length;
          if (group.checkedCount && group.state !== "completed")
            group.state = "in_progress";
        }
      } else if (complete) {
        const group = view.groups.find(
          (g) => g.id === decodeURIComponent(complete[1]),
        )!;
        group.state = "completed";
        group.result = {
          earnedMarks: view.feedback.filter(
            (f) => group.questionIds.includes(f.questionId) && f.isCorrect,
          ).length,
          totalMarks: group.questionIds.length,
        };
        if (view.groups.every((g) => g.state === "completed"))
          view.result = {
            attemptId: uid(50),
            topicId: uid(20),
            state: "submitted",
            earnedMarks: view.groups.reduce(
              (n, g) => n + g.result!.earnedMarks,
              0,
            ),
            totalMarks: view.attempt.questions.length,
            completedAt: "2026-11-17T00:00:00Z",
          };
      }
      if (check && state.lost) {
        state.lost = false;
        return route.abort("failed");
      }
      if (complete && state.lostCompletion) {
        state.lostCompletion = false;
        return route.abort("failed");
      }
      return send(view);
    }
    return send({ courses: [], available: false });
  });
  return { state, view, topic: `/student/step/topics/${uid(20)}` };
}
async function enter(
  page: Page,
  title = "Names of People, Places, Things, Ideas",
) {
  await page
    .getByRole("article")
    .filter({ has: page.getByRole("heading", { name: title, exact: true }) })
    .getByRole("button")
    .click();
  await expect(
    page.getByRole("button", { name: "Check Answer", exact: true }),
  ).toBeVisible();
}
async function check(page: Page, label: string) {
  await page.getByRole("radio", { name: label, exact: true }).check();
  await page.getByRole("button", { name: "Check Answer", exact: true }).click();
}
for (const width of [1440, 390])
  test(`Nouns groups and fresh option feedback at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 950 });
    const f = await fixture(page);
    await page.goto(f.topic);
    await expect(page.getByRole("article")).toHaveCount(6);
    expect(f.state.started).toBe(false);
    await enter(page);
    await check(page, "B. Choice B");
    await expect(
      page.getByText("Incorrect — try again.", { exact: true }),
    ).toBeVisible();
    await expect(page.locator('[data-answer-result="false"]')).toHaveClass(
      /answer-feedback-shake/,
    );
    await check(page, "A. Choice A");
    await expect(page.getByText("Correct", { exact: true })).toBeVisible();
    await expect(page.locator('[data-answer-result="true"]')).toHaveClass(
      /answer-feedback-pop/,
    );
    await page.reload();
    await expect(page.getByText("Correct", { exact: true })).toBeVisible();
    await expect(page.locator('[data-answer-result="true"]')).not.toHaveClass(
      /answer-feedback-pop/,
    );
    await expect(
      page.getByRole("radio", { name: "A. Choice A", exact: true }),
    ).toBeChecked();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  });
test("subtopics complete independently and remain reviewable", async ({
  page,
}) => {
  const f = await fixture(page);
  await page.goto(f.topic);
  await enter(page);
  await expect(
    page.getByRole("button", { name: "Complete subtopic", exact: true }),
  ).toBeDisabled();
  await check(page, "A. Choice A");
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await check(page, "B. Choice B");
  await page
    .getByRole("button", { name: "Complete subtopic", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Confirm completion", exact: true })
    .click();
  await expect(page.getByText(/Subtopic completed/)).toBeVisible();
  expect(f.view.result).toBeNull();
  await page
    .getByRole("link", { name: "Back to Nouns", exact: true })
    .first()
    .click();
  const first = page.getByRole("article").first();
  await expect(first.getByText(/Completed/)).toBeVisible();
  await expect(
    page
      .getByRole("article")
      .nth(1)
      .getByText(/Not started/),
  ).toBeVisible();
  await first.getByRole("button", { name: "View subtopic" }).click();
  await expect(page.getByRole("radio").first()).toBeDisabled();
  await expect(
    page.getByRole("button", { name: "Check Answer", exact: true }),
  ).toHaveCount(0);
});
test("lost check response is recovered on refresh without a second check or animation", async ({
  page,
}) => {
  const f = await fixture(page);
  await page.goto(f.topic);
  await enter(page);
  f.state.lost = true;
  await check(page, "A. Choice A");
  await expect(
    page.getByRole("button", { name: "Retry saved request" }),
  ).toBeVisible();
  await page.reload();
  await expect(page.getByText("Correct", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Retry saved request" }),
  ).toHaveCount(0);
  expect(f.state.checks).toHaveLength(1);
  await expect(page.locator('[data-answer-result="true"]')).not.toHaveClass(
    /answer-feedback-pop/,
  );
});
test("conflicting check needs explicit server-choice recovery", async ({
  page,
}) => {
  const f = await fixture(page);
  await page.goto(f.topic);
  await enter(page);
  f.state.conflict = true;
  await check(page, "A. Choice A");
  await expect(
    page.getByRole("button", { name: "Use saved choices" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Check Answer", exact: true }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Use saved choices" }).click();
  await check(page, "A. Choice A");
  await expect(page.getByText("Correct", { exact: true })).toBeVisible();
});
test("Reading retains its passage and uses checked feedback", async ({
  page,
}) => {
  const f = await fixture(page, "reading");
  await page.goto(f.topic);
  await enter(page);
  await expect(
    page.getByRole("complementary", { name: "Reading passage panel" }),
  ).toContainText("Synthetic passage.");
  await check(page, "A. Choice A");
  await expect(page.getByText("Correct", { exact: true })).toBeVisible();
});

test("lost completion response recovers the completed group on refresh", async ({
  page,
}) => {
  const f = await fixture(page);
  await page.goto(f.topic);
  await enter(page);
  await check(page, "A. Choice A");
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await check(page, "A. Choice A");
  f.state.lostCompletion = true;
  await page
    .getByRole("button", { name: "Complete subtopic", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Confirm completion", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Retry saved request" }),
  ).toBeVisible();
  await page.reload();
  await expect(page.getByText(/Subtopic completed/)).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Check Answer", exact: true }),
  ).toHaveCount(0);
});

test("account changes remove the player and suppress a late checked response", async ({
  page,
}) => {
  const f = await fixture(page);
  await page.goto(f.topic);
  await enter(page);
  f.state.delayMs = 800;
  await check(page, "A. Choice A");
  await page.evaluate(() => {
    const prior = localStorage.getItem("AiTutorUser");
    const next = JSON.stringify({
      id: "different-student",
      username: "other",
      role: "student",
      region: "ROW",
    });
    localStorage.setItem("AiTutorUser", next);
    window.dispatchEvent(
      new StorageEvent("storage", {
        key: "AiTutorUser",
        oldValue: prior,
        newValue: next,
      }),
    );
  });
  await expect(
    page.getByRole("button", { name: "Check Answer", exact: true }),
  ).toHaveCount(0);
  await expect(page.locator('[data-answer-result="true"]')).toHaveCount(0);
});

test("source explanation appears only after checking and remains static after refresh", async ({
  page,
}) => {
  const f = await fixture(page);
  await page.goto(f.topic);
  await enter(page);
  const explanation = page.getByRole("region", {
    name: "Content explanation",
    exact: true,
  });
  await expect(explanation).toHaveCount(0);
  await check(page, "B. Choice B");
  await expect(explanation).toContainText(
    "This is the supplied noun explanation.",
  );
  await expect(explanation).toContainText("هذا شرح المصدر.");
  await expect(explanation).toContainText("Hint: Identify a noun.");
  await expect(explanation).not.toHaveClass(/answer-feedback|animate/);
  await page.getByRole("radio", { name: "A. Choice A", exact: true }).check();
  await expect(explanation).toHaveCount(0);
  await page.getByRole("button", { name: "Check Answer", exact: true }).click();
  await expect(explanation).toBeVisible();
  await page.reload();
  await expect(explanation).toContainText(
    "This is the supplied noun explanation.",
  );
  await expect(page.locator('[data-answer-result="true"]')).not.toHaveClass(
    /answer-feedback-pop/,
  );
});

test("Reading shows its supplied strategy; Listening without authored explanation shows none", async ({
  page,
}) => {
  const reading = await fixture(page, "reading");
  await page.goto(reading.topic);
  await enter(page);
  await check(page, "A. Choice A");
  await expect(
    page.getByRole("region", { name: "Content explanation", exact: true }),
  ).toContainText("Use the quoted passage evidence.");
  const listening = await fixture(page, "listening");
  await page.goto(listening.topic);
  await enter(page);
  await check(page, "A. Choice A");
  await expect(page.getByText("Correct", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("region", { name: "Content explanation", exact: true }),
  ).toHaveCount(0);
});
