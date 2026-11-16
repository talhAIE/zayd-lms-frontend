import { test, expect, type Page } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
const backend = path.resolve(process.cwd(), "../step-backend");
const read = (p: string) =>
  JSON.parse(
    fs.readFileSync(path.join(backend, "content/science-spark", p), "utf8"),
  );
const catalog = read("motion-unit2-v2/catalog.json"),
  external = read("motion-unit2-v2/external.json");
const unit = "/student/science/spark-science/unit-2";
async function fixture(page: Page) {
  const attempts = new Map<string, any>(),
    complete = new Set<string>();
  let failSave = false,
    lostSubmit = false;
  await page.addInitScript(() => {
    if (!localStorage.getItem("AiTutorUser")) {
      localStorage.setItem(
        "AiTutorUser",
        JSON.stringify({
          id: "motion-browser-qa",
          username: "motion.synthetic",
          role: "student",
          region: "ROW",
          firstName: "Science",
          lastName: "QA",
        }),
      );
      localStorage.setItem("accessToken", "synthetic");
      localStorage.setItem("refreshToken", "synthetic-refresh");
    }
  });
  const leaf = (item: any) => ({
    ...item,
    title:
      item.title ||
      (item.kind === "interactive_lesson"
        ? "Interactive Lesson"
        : item.kind === "quiz"
          ? "Lesson Quiz"
          : item.kind === "kahoot"
            ? "Lesson Kahoot"
            : "PhET Simulations"),
    opened: false,
    completed: complete.has(item.key),
    ...(item.externalKey
      ? {
          targets: (() => {
            const e = external.activities.find(
              (e: any) => e.key === item.externalKey,
            );
            return e.targets || [{ key: e.key, title: e.title, url: e.url }];
          })(),
        }
      : {}),
  });
  const course = () => ({
    available: true,
    course: {
      key: "spark-science-motion",
      title: "Spark Science",
      description: "American Grade 9 Science · Motion",
      grade: "9",
      unitTitle: "Unit 2: Motion",
      unitKey: "motion-unit-1",
      status: "in_progress",
      progressPct: Math.floor((complete.size / 12) * 100),
      completedActivities: complete.size,
      totalActivities: 12,
      completedUnits: complete.size === 12 ? 1 : 0,
      activities: catalog.entries.map((e: any) =>
        e.activities
          ? { ...leaf(e), activities: e.activities.map(leaf) }
          : leaf(e),
      ),
    },
  });
  await page.route("**/api/v1/**", async (route) => {
    const request = route.request(),
      url = new URL(request.url()),
      p = url.pathname.replace("/api/v1", ""),
      method = request.method();
    const ok = async (data: any) =>
      route.fulfill({ json: { status: true, data } });
    if (p === "/spark-science/course") return ok(course());
    const activity = p.match(
      /^\/spark-science\/activities\/([^/]+)\/(quiz|open|complete|viewer)$/,
    );
    if (activity) {
      const [, key, action] = activity;
      if (action === "quiz") {
        let a = attempts.get(key);
        if (!a) {
          const quizKey =
              key === "unit-quiz" ? "unit" : key.replace("-quiz", ""),
            q = read(`motion-quizzes-v1/learner/${quizKey}.json`);
          a = {
            id: "attempt-" + key,
            quizKey,
            title: q.title,
            questions: q.questions,
            answers: {},
            revision: 0,
            state: "in_progress",
            score: null,
            maxScore: q.totalMarks,
            gradedItems: 0,
            feedback: null,
          };
          attempts.set(key, a);
        }
        return ok(a);
      }
      if (action === "complete") {
        complete.add(key);
        return ok(course());
      }
      if (action === "open") return ok({ key });
      if (action === "viewer")
        return ok({
          path: "/spark-science/view/synthetic/index.html",
          activityKey: key,
          nonce: "synthetic",
          expiresAt: new Date(Date.now() + 60000).toISOString(),
        });
    }
    if (p.startsWith("/spark-science/view/"))
      return route.fulfill({
        contentType: "text/html",
        body: "<!doctype html><h1>Interactive Science Lesson</h1><p>Lesson content</p>",
      });
    const match = p.match(/^\/spark-science\/attempts\/([^/]+)(.*)$/);
    if (match) {
      const a = [...attempts.values()].find((a) => a.id === match[1]);
      if (!a)
        return route.fulfill({ status: 404, json: { message: "Not found" } });
      const suffix = match[2];
      if (suffix.startsWith("/images/"))
        return route.fulfill({
          path: path.join(
            backend,
            "content/science-spark/motion-quizzes-v1/learner/assets",
            suffix.split("/").pop()!,
          ),
        });
      if (method === "GET") return ok(a);
      const body = request.postDataJSON();
      if (suffix === "/answers") {
        if (failSave) {
          failSave = false;
          return route.abort();
        }
        if (body.revision !== a.revision)
          return route.fulfill({ status: 409, json: { message: "Conflict" } });
        a.answers = body.answers;
        a.revision++;
        return ok(a);
      }
      if (suffix === "/submit") {
        a.state = "grading";
        if (lostSubmit) {
          lostSubmit = false;
          return route.abort();
        }
        return ok(a);
      }
      if (suffix === "/grade") {
        a.state = "submitted";
        a.score = a.maxScore;
        a.gradedItems = a.questions.length;
        a.feedback = Object.fromEntries(
          a.questions.map((q: any) => [
            q.id,
            {
              score: q.points,
              maxScore: q.points,
              feedback: "Synthetic rubric feedback.",
            },
          ]),
        );
        complete.add(a.quizKey === "unit" ? "unit-quiz" : a.quizKey + "-quiz");
        return ok(a);
      }
    }
    if (p.includes("testing"))
      return route.fulfill({ json: { available: false } });
    if (p.endsWith("/courses")) return ok({ courses: [] });
    return ok({ available: false, courses: [], modes: [] });
  });
  return {
    attempts,
    complete,
    failNextSave: () => {
      failSave = true;
    },
    loseSubmit: () => {
      lostSubmit = true;
    },
  };
}
test("unit hierarchy, conditional lesson cards, both PhET links and HTML completion", async ({
  page,
}) => {
  await fixture(page);
  await page.goto(unit);
  await expect(
    page.getByRole("heading", { name: "Unit 2: Motion" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: /Lesson 1: Describing Motion/ }),
  ).toBeVisible();
  await page.goto(unit + "/activities/lesson-1");
  await expect(
    page.getByRole("link", { name: /Interactive Lesson/ }),
  ).toHaveCount(1);
  await expect(page.getByRole("link", { name: /Lesson Quiz/ })).toHaveCount(1);
  await expect(page.getByRole("link", { name: /Kahoot|PhET/ })).toHaveCount(0);
  await page.goto(unit + "/activities/lesson-3");
  await expect(
    page.getByRole("link", {
      name: /Interactive Lesson|Lesson Quiz|Lesson Kahoot|PhET Simulations/,
    }),
  ).toHaveCount(4);
  await page.getByRole("link", { name: /PhET Simulations/ }).click();
  await expect(
    page.getByRole("link", { name: /Play Moving Man/ }),
  ).toHaveAttribute("href", /simulation=moving-man/);
  await expect(
    page.getByRole("link", { name: /Play Ladybug/ }),
  ).toHaveAttribute("target", "_blank");
  await page
    .getByRole("button", { name: "Complete and return", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Lesson 3: Acceleration" }),
  ).toBeVisible();
  await page.getByRole("link", { name: /Interactive Lesson/ }).click();
  await expect(page.locator("iframe")).toBeVisible();
  await page
    .getByRole("button", { name: "Next activity", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Lesson 3: Acceleration" }),
  ).toBeVisible();
});
for (const width of [1440, 390])
  test(`all four quizzes complete, restore results and show private figures at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    const state = await fixture(page);
    page.on("dialog", (d) => d.accept());
    for (const key of ["lesson-1", "lesson-2", "lesson-3", "unit"]) {
      const quiz = read(`motion-quizzes-v1/learner/${key}.json`),
        routeKey = key === "unit" ? "unit-quiz" : key + "-quiz";
      await page.goto(unit + "/activities/" + routeKey);
      await expect(
        page.getByRole("heading", { name: quiz.title, exact: true }),
      ).toBeVisible();
      for (const question of quiz.questions) {
        await page
          .getByRole("button", { name: question.sourceLabel, exact: true })
          .click();
        if (question.componentType === "mcq")
          await page.getByRole("radio").first().check();
        else if (question.componentType === "open_input")
          await page
            .getByRole("textbox")
            .fill(
              "The calculation and scientific reasoning are explained here.",
            );
        else {
          const inputs = page.getByRole("textbox");
          await inputs.nth(0).fill("2");
          await inputs.nth(1).fill("30");
        }
      }
      await expect(
        page.getByRole("button", { name: "Submit quiz", exact: true }),
      ).toBeEnabled();
      if (key === "lesson-1") state.loseSubmit();
      await page
        .getByRole("button", { name: "Submit quiz", exact: true })
        .click();
      await expect(
        page.getByRole("heading", {
          name: `Result: ${quiz.totalMarks} / ${quiz.totalMarks}`,
        }),
      ).toBeVisible({ timeout: 20000 });
      await page.reload();
      await expect(
        page.getByRole("heading", { name: /Result:/ }),
      ).toBeVisible();
    }
    expect([...state.attempts.values()]).toHaveLength(4);
  });
test("refresh restores saved written draft and rejects account replacement", async ({
  page,
}) => {
  await fixture(page);
  await page.goto(unit + "/activities/lesson-1-quiz");
  await page.getByRole("button", { name: "3", exact: true }).click();
  await page.getByRole("textbox").fill("My saved scientific explanation.");
  await expect(
    page.getByText("All answers saved", { exact: true }),
  ).toBeVisible();
  await page.reload();
  await page.getByRole("button", { name: "3", exact: true }).click();
  await expect(page.getByRole("textbox")).toHaveValue(
    "My saved scientific explanation.",
  );
  await page.evaluate(() =>
    localStorage.setItem(
      "AiTutorUser",
      JSON.stringify({
        id: "other",
        username: "other",
        role: "student",
        region: "ROW",
      }),
    ),
  );
  await page
    .getByRole("textbox")
    .fill("This must not save to the previous account.");
  await expect(page.getByRole("alert")).toContainText("could not be confirmed");
});

test("course hub exposes Science without an empty message; failed saves retain drafts", async ({
  page,
}) => {
  const state = await fixture(page);
  await page.goto("/student/courses");
  await expect(
    page.getByRole("heading", { name: "Spark Science", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("No curriculum courses available.", { exact: true }),
  ).toHaveCount(0);
  await page.goto(unit + "/activities/lesson-1-quiz");
  await page.getByRole("button", { name: "3", exact: true }).click();
  await expect(
    page.getByRole("img", { name: /supplied source figure/ }),
  ).toBeVisible();
  state.failNextSave();
  await page
    .getByRole("textbox")
    .fill("Retain this explanation after a failed save.");
  await expect(page.getByRole("alert")).toContainText("could not be confirmed");
  await page.getByRole("button", { name: "Keep device answers" }).click();
  await expect(
    page.getByText("All answers saved", { exact: true }),
  ).toBeVisible();
  await page.reload();
  await page.getByRole("button", { name: "3", exact: true }).click();
  await expect(page.getByRole("textbox")).toHaveValue(
    "Retain this explanation after a failed save.",
  );
  await page.screenshot({
    path: test.info().outputPath("quiz-figure.png"),
    fullPage: true,
  });
});
