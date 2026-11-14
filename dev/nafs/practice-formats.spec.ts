import { test, expect } from "@playwright/test";
import { fixture, routePath, q2 } from "./practice-player.fixture";
for (const width of [390, 1440]) {
  test(`extended formats ${width}: multi selection, retry, written recovery and completion`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 950 });
    const state = await fixture(page);
    state.session.questions[0].responseKind = "multi_choice";
    state.session.questions[0].options =
      state.session.questions[0].options.slice(0, 3);
    state.session.questions[1].responseKind = "written";
    state.session.questions[1].options = [];
    await page.goto(routePath);
    const check = page.getByRole("button", {
      name: "Check Answer",
      exact: true,
    });
    await expect(page.getByRole("checkbox")).toHaveCount(3);
    await page.getByRole("checkbox", { name: /^A\./ }).check();
    await check.click();
    await expect(
      page.getByRole("status", { name: "Answer feedback" }),
    ).toContainText("Incorrect");
    await page.getByRole("checkbox", { name: /^C\./ }).check();
    await check.click();
    await expect(
      page.getByRole("status", { name: "Answer feedback" }),
    ).toHaveText("Correct!");
    await expect(page.locator(".answer-confetti")).toHaveCount(1);
    expect(state.checks.at(-1)?.body.optionId).toBe('["0-A","0-C"]');
    await page.reload();
    await expect(page.getByRole("checkbox", { name: /^A\./ })).toBeChecked();
    await expect(page.getByRole("checkbox", { name: /^C\./ })).toBeChecked();
    await expect(
      page.locator(".answer-feedback-pop,.answer-feedback-shake"),
    ).toHaveCount(0);
    await page.getByRole("button", { name: "Next", exact: true }).click();
    const text = page.getByRole("textbox", { name: "Your answer" });
    await expect(check).toBeDisabled();
    await text.fill("   ");
    await expect(check).toBeDisabled();
    await text.fill("Unfinished written draft");
    await expect
      .poll(
        () =>
          state.session.selections.find((s) => s.questionId === q2)?.optionId,
      )
      .toBe(JSON.stringify({ text: "Unfinished written draft" }));
    await page.reload();
    await page
      .getByRole("button", { name: "Keep local choices", exact: true })
      .click();
    await page.getByRole("button", { name: "Next", exact: true }).click();
    await expect(text).toHaveValue("Unfinished written draft");
    state.fail = true;
    await text.fill("Equivalent written answer");
    await check.click();
    await page
      .getByRole("button", { name: "Reconcile saved practice" })
      .click();
    await expect(
      page.getByRole("status", { name: "Answer feedback" }),
    ).toHaveText("Correct!");
    await expect(
      page.getByText("2 of 2 checked", { exact: true }),
    ).toBeVisible();
    expect(
      state.session.latestChecks.find((c) => c.questionId === q2)?.isCorrect,
    ).toBe(true);
    await page
      .getByRole("button", { name: "Finish practice", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Confirm finish", exact: true })
      .click();
    await expect(page.getByText("2 / 2", { exact: true })).toBeVisible();
    const attempts = state.checks.filter((c) => c.questionId === q2);
    expect(attempts).toHaveLength(2);
    expect(attempts[1].body).toEqual(attempts[0].body);
    expect(
      state.session.latestChecks.find((c) => c.questionId === q2)?.sequence,
    ).toBe(1);
  });
  test(`two-option item ${width} preserves the supplied options`, async ({
    page,
  }) => {
    const state = await fixture(page);
    state.session.questions[0].options =
      state.session.questions[0].options.slice(0, 2);
    await page.setViewportSize({ width, height: 950 });
    await page.goto(routePath);
    await expect(page.getByRole("radio")).toHaveCount(2);
    await page.getByRole("radio", { name: /^B\./ }).check();
    await page
      .getByRole("button", { name: "Check Answer", exact: true })
      .click();
    await expect(
      page.getByRole("status", { name: "Answer feedback" }),
    ).toHaveText("Correct!");
  });
}

test("source notation and image-only choices use authenticated media without a duplicated visible stem", async ({
  page,
}) => {
  const state = await fixture(page);
  state.session.questions[0].stemIsFigure = true;
  state.session.questions[0].options[1].text = "";
  await page.goto(routePath);
  await expect(page.locator("#practice-question")).toHaveClass(/sr-only/);
  await expect(
    page.getByRole("img", { name: "Synthetic fraction diagram" }),
  ).toBeVisible();
  await expect(
    page.getByRole("img", { name: "Synthetic half diagram" }),
  ).toBeVisible();
  await page
    .getByRole("radio", { name: "B. Synthetic half diagram", exact: true })
    .check();
  await page.getByRole("button", { name: "Check Answer", exact: true }).click();
  await expect(
    page.getByRole("status", { name: "Answer feedback" }),
  ).toHaveText("Correct!");
  expect(
    state.media.every((m) => m.url.includes("/nafs/practice/sessions/")),
  ).toBe(true);
});
