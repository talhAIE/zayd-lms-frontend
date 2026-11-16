import { test, expect } from "@playwright/test";
import { fixture, read } from "./fixtures";
for (const unit of [2, 3])
  test(`Unit ${unit} animates correct and incorrect answers and reveals explanation only after checking`, async ({
    page,
  }) => {
    const state = await fixture(page, unit);
    const prefix = unit === 2 ? "motion-quizzes-v1" : "forces-quizzes-v1";
    const quiz = read(`${prefix}/learner/lesson-1.json`);
    const keys = read(`${prefix}/private/lesson-1.grading.json`).grading;
    const correctIndex = quiz.questions[0].options.findIndex(
      (o: { id: string }) => o.id === keys[0].correctOptionIds[0],
    );
    const incorrectIndex = quiz.questions[1].options.findIndex(
      (o: { id: string }) => o.id !== keys[1].correctOptionIds[0],
    );
    await page.goto(
      `/student/science/spark-science/unit-${unit}/activities/lesson-1-quiz`,
    );
    await expect(
      page.getByRole("heading", { name: "Content explanation", exact: true }),
    ).toHaveCount(0);
    await page.getByRole("radio").nth(correctIndex).check();
    await page
      .getByRole("button", { name: "Check Answer", exact: true })
      .click();
    await expect(
      page.getByRole("heading", { name: "Correct", exact: true }),
    ).toBeVisible();
    await expect(page.locator('[data-answer-result="true"]')).toHaveClass(
      /answer-feedback-pop/,
    );
    await expect(
      page.locator("[data-science-option].answer-feedback-pop"),
    ).toHaveCount(1);
    await expect(
      page.locator("[data-science-explanation].answer-feedback"),
    ).toHaveCount(0);
    await expect(
      page.locator("[data-science-explanation] .answer-confetti"),
    ).toHaveCount(0);
    await expect(page.getByText(/\bmarks?\b|^Result:/)).toHaveCount(0);
    await expect(
      page.getByRole("heading", { name: "Content explanation", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByText("Correct answer:", { exact: true }),
    ).toBeVisible();
    await expect(page.getByRole("radio").first()).toBeDisabled();
    await page.screenshot({
      path: test.info().outputPath("correct-feedback.png"),
      fullPage: true,
    });
    await page
      .getByRole("button", { name: "Next question", exact: true })
      .click();
    await expect(
      page.getByRole("heading", { name: "Content explanation", exact: true }),
    ).toHaveCount(0);
    state.incorrectNextCheck();
    await page.getByRole("radio").nth(incorrectIndex).check();
    await page
      .getByRole("button", { name: "Check Answer", exact: true })
      .click();
    await expect(
      page.getByRole("heading", { name: "Incorrect", exact: true }),
    ).toBeVisible();
    await expect(page.locator('[data-answer-result="false"]')).toHaveClass(
      /answer-feedback-shake/,
    );
    await expect(
      page.locator("[data-science-option].answer-feedback-shake"),
    ).toHaveCount(1);
    await expect(
      page.locator("[data-science-explanation].answer-feedback"),
    ).toHaveCount(0);
    await expect(
      page.getByRole("heading", { name: "Content explanation", exact: true }),
    ).toBeVisible();
    await expect(page.getByRole("radio").first()).toBeDisabled();
    await page.reload();
    await expect(
      page.getByRole("heading", { name: "Correct", exact: true }),
    ).toBeVisible();
    await expect(
      page.locator(".answer-feedback-pop,.answer-feedback-shake"),
    ).toHaveCount(0);
    await page
      .getByRole("button", { name: "Next question", exact: true })
      .click();
    await expect(
      page.getByRole("heading", { name: "Incorrect", exact: true }),
    ).toBeVisible();
    await expect(
      page.locator(".answer-feedback-pop,.answer-feedback-shake"),
    ).toHaveCount(0);
  });
test("recovers a checked answer after its response is lost without repeating the grade", async ({
  page,
}) => {
  const state = await fixture(page, 3);
  await page.goto(
    "/student/science/spark-science/unit-3/activities/lesson-1-quiz",
  );
  await page.getByRole("radio").first().check();
  state.loseNextCheck();
  await page.getByRole("button", { name: "Check Answer", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Correct", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Content explanation", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("radio").first()).toBeDisabled();
  expect(state.attempts.get("lesson-1-quiz").gradedItems).toBe(1);
});
