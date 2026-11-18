import { test, expect } from "@playwright/test";
import path from "node:path";
import { fixture, read, backend } from "./fixtures";
const unit = "/student/science/spark-science/unit-2";
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
    page.locator("iframe"),
  ).toHaveAttribute("src", /simulation=moving-man/);
  await page.getByRole("button", { name: "Ladybug Motion 2D", exact: true }).click();
  await expect(page.locator("iframe")).toHaveAttribute("src", /simulation=ladybug-motion-2d/);
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
        await page
          .getByRole("button", { name: "Check Answer", exact: true })
          .click();
        await expect(
          page.getByRole("heading", { name: "Correct", exact: true }),
        ).toBeVisible();
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
          name: "Quiz completed",
          exact: true,
        }),
      ).toBeVisible({ timeout: 20000 });
      await page.reload();
      await expect(
        page.getByRole("heading", { name: "Quiz completed", exact: true }),
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
