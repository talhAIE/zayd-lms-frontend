import { test, expect } from "@playwright/test";
import { installFixture, source } from "./browser-fixture";
import { fixture, sid, routePath } from "./practice-player.fixture";
const feedback = (page: Page) =>
  page.getByRole("status", { name: "Answer feedback" });
const check = (page: Page) =>
  page.getByRole("button", { name: "Check Answer", exact: true });

for (const width of [1440, 390]) {
  test(`player ${width}px: server feedback, manual navigation, no answer reveal or taxonomy`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width, height: 950 });
    const state = await fixture(page);
    await page.goto(routePath);
    await expect(check(page)).toBeDisabled();
    await page.getByRole("radio", { name: /^A\./ }).check();
    await expect(feedback(page)).toContainText("Check this answer");
    await expect(page.locator("[data-answer-result]")).toHaveCount(0);
    await check(page).click();
    await expect(feedback(page)).toContainText("Incorrect");
    await expect(page.locator(".answer-feedback-shake")).toHaveCount(1);
    await expect(
      page.getByRole("heading", { name: "Question 1 of 2" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Question 1, checked", exact: true }),
    ).toHaveClass(/bg-blue-50/);
    await expect(page.locator("[data-answer-result]")).toHaveCount(1);
    await page.getByRole("radio", { name: /^B\./ }).check();
    await expect(page.locator("[data-answer-result]")).toHaveCount(0);
    await check(page).click();
    await expect(feedback(page)).toHaveText("Correct!");
    await expect(page.locator(".answer-feedback-pop")).toHaveCount(1);
    await expect(page.locator(".answer-confetti")).toHaveCount(1);
    await page.screenshot({
      path: testInfo.outputPath(`practice-player-${width}.png`),
      fullPage: true,
    });
    await page.getByRole("button", { name: "Next", exact: true }).click();
    await expect(
      page.getByRole("heading", { name: "Question 2 of 2" }),
    ).toBeFocused();
    await page.getByRole("button", { name: "Previous", exact: true }).click();
    await expect(feedback(page)).toHaveText("Correct!");
    await expect(
      page.locator(
        ".answer-feedback-pop, .answer-confetti, .answer-feedback-shake",
      ),
    ).toHaveCount(0);
    await page.reload();
    await expect(feedback(page)).toHaveText("Correct!");
    await expect(
      page.locator(".answer-feedback-pop, .answer-confetti"),
    ).toHaveCount(0);
    expect(state.checks).toHaveLength(2);
    await expect(
      page.getByText(/Domain|Strand|Outcome|Indicator|Correct answer is/),
    ).toHaveCount(0);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  });
}
test("changing back to an earlier selection requires a fresh check; repeated new checks animate once each", async ({
  page,
}) => {
  const state = await fixture(page);
  await page.goto(routePath);
  await page.getByRole("radio", { name: /^B\./ }).check();
  await check(page).click();
  await expect(feedback(page)).toHaveText("Correct!");
  await page.getByRole("radio", { name: /^A\./ }).check();
  await page.getByRole("radio", { name: /^B\./ }).check();
  await expect(page.locator("[data-answer-result]")).toHaveCount(0);
  await expect(page.getByRole("progressbar")).toHaveAttribute(
    "aria-valuenow",
    "0",
  );
  await check(page).click();
  await expect(page.locator(".answer-feedback-pop")).toHaveCount(1);
  expect(state.session.latestChecks[0].sequence).toBe(2);
  expect(state.checks[0].body.requestId).not.toBe(
    state.checks[1].body.requestId,
  );
});
test("duplicate accepted response never replays effects", async ({ page }) => {
  const state = await fixture(page);
  await page.goto(routePath);
  await page.getByRole("radio", { name: /^B\./ }).check();
  await check(page).click();
  await expect(feedback(page)).toHaveText("Correct!");
  state.duplicate = true;
  await check(page).click();
  await expect(
    page.locator(".answer-feedback-pop, .answer-confetti"),
  ).toHaveCount(0);
  expect(state.receipts.size).toBe(1);
});
test("lost response freezes choices; exact retry restores feedback without animation", async ({
  page,
}) => {
  const state = await fixture(page);
  state.fail = true;
  await page.goto(routePath);
  await page.getByRole("radio", { name: /^B\./ }).check();
  await check(page).click();
  await expect(page.getByRole('status', { name: 'Practice saving status' })).toContainText('could not be confirmed');
  await expect(page.getByRole("radio").first()).toBeDisabled();
  await page.getByRole('button', { name: 'Reconcile saved practice' }).click();
  await expect(feedback(page)).toHaveText("Correct!");
  await expect(
    page.locator(".answer-feedback-pop, .answer-confetti"),
  ).toHaveCount(0);
  expect(state.checks).toHaveLength(2);
  expect(state.checks[1].body).toEqual(state.checks[0].body);
  expect(state.receipts.size).toBe(1);
});
test("pending check locks choices; conflict offers explicit reload without guessing correctness", async ({
  page,
}) => {
  const state = await fixture(page);
  state.delay = 700;
  state.conflict = true;
  await page.goto(routePath);
  await page.getByRole("radio", { name: /^A\./ }).check();
  await expect(page.getByRole("radio").first()).toBeDisabled();
  await expect(page.getByRole('status', { name: 'Practice saving status' })).toContainText('Saved practice changed');
  await expect(page.locator("[data-answer-result]")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Retry same check" }),
  ).toHaveCount(0);
  state.conflict = false;
  await page
    .getByRole("button", {
      name: 'Use server choices',
    })
    .click();
  await expect(check(page)).toBeDisabled();
  await expect(page.getByRole("radio").first()).not.toBeChecked();
});
test("mobile passages are complete, linked to their question, and preserve math/emphasis", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await fixture(page);
  await page.goto(routePath);
  const toggle = page.getByRole("button", { name: "Read passage" });
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await toggle.click();
  await expect(
    page.getByText("Final paragraph of the first passage."),
  ).toBeVisible();
  await expect(page.locator("#practice-question strong")).toHaveText(
    "fraction",
  );
  await expect(
    page.getByRole("math", { name: "1 over 2" }).first(),
  ).toBeVisible();
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await page.getByRole("button", { name: "Read passage" }).click();
  await expect(
    page.getByText("Final paragraph of the second passage."),
  ).toBeVisible();
  await expect(
    page.getByText("Final paragraph of the first passage."),
  ).toHaveCount(0);
});
test("private images use bearer API bytes, retry, enlarge, close and revoke object URLs", async ({
  page,
}) => {
  const state = await fixture(page);
  state.failMedia = true;
  await page.addInitScript(() => {
    const revoke = URL.revokeObjectURL;
    Object.assign(window, { revokedPracticeImages: [] });
    URL.revokeObjectURL = (url) => {
      (
        window as unknown as { revokedPracticeImages: string[] }
      ).revokedPracticeImages.push(url);
      revoke.call(URL, url);
    };
  });
  await page.goto(routePath);
  await expect(
    page.getByRole("button", { name: "Reload image" }).first(),
  ).toBeVisible();
  state.failMedia = false;
  await page
    .getByRole("alert")
    .filter({ hasText: "Synthetic fraction diagram" })
    .getByRole("button", { name: "Reload image" })
    .click();
  await expect(page.getByAltText("Synthetic fraction diagram")).toHaveAttribute(
    "src",
    /^blob:/,
  );
  await page.getByRole("button", { name: "Enlarge image" }).first().click();
  await expect(page.getByRole("dialog")).toBeVisible();
  const closeTarget = await page
    .getByRole("button", { name: "Close", exact: true })
    .boundingBox();
  expect(closeTarget?.width).toBeGreaterThanOrEqual(44);
  expect(closeTarget?.height).toBeGreaterThanOrEqual(44);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.getByRole("button", { name: "Next", exact: true }).click();
  expect(
    await page.evaluate(
      () =>
        (window as unknown as { revokedPracticeImages: string[] })
          .revokedPracticeImages.length,
    ),
  ).toBeGreaterThan(0);
  expect(
    state.media.every(
      (r) =>
        r.auth === "Bearer pm5.synthetic.token" &&
        !new URL(r.url).search &&
        r.url.includes(`/sessions/${sid}/assets/`),
    ),
  ).toBe(true);
});
test("native radio keyboard selection, checking and heading focus work", async ({
  page,
}) => {
  await fixture(page);
  await page.goto(routePath);
  await page.getByRole("radio", { name: /^A\./ }).focus();
  await page.keyboard.press("ArrowDown");
  await expect(page.getByRole("radio", { name: /^B\./ })).toBeChecked();
  await check(page).focus();
  await page.keyboard.press("Space");
  await expect(feedback(page)).toHaveText("Correct!");
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Question 2 of 2" }),
  ).toBeFocused();
});
test("reduced motion suppresses celebration/shake while preserving visible correctness", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await fixture(page);
  await page.goto(routePath);
  await page.getByRole("radio", { name: /^A\./ }).check();
  await check(page).click();
  await expect(page.locator('[data-answer-result="false"]')).toHaveCSS(
    "animation-name",
    "none",
  );
  await page.getByRole("radio", { name: /^B\./ }).check();
  await check(page).click();
  await expect(feedback(page)).toHaveText("Correct!");
  await expect(page.locator('[data-answer-result="true"]')).toHaveCSS(
    "animation-name",
    "none",
  );
  await expect(page.locator(".answer-confetti")).toHaveCSS("display", "none");
});
test("250-question neutral navigation reaches last question without leaking correctness in buttons", async ({
  page,
}) => {
  await fixture(page, 250);
  await page.goto(routePath);
  await expect(
    page
      .getByRole("navigation", { name: "Practice question navigator" })
      .getByRole("button"),
  ).toHaveCount(250);
  await page
    .getByRole("button", { name: "Question 250, unchecked", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Question 250 of 250" }),
  ).toBeFocused();
  await expect(
    page.getByRole("button", { name: "Next", exact: true }),
  ).toBeDisabled();
});
test("direct denied sessions display no questions or feedback", async ({
  page,
}) => {
  const state = await fixture(page);
  state.deny = true;
  await page.goto(routePath);
  await expect(page.getByRole("alert")).toContainText(
    "unavailable or you do not have access",
  );
  await expect(page.getByRole("radio")).toHaveCount(0);
});
test("legacy Quiz player still has no feedback surfaces or Check Answer control", async ({
  page,
}) => {
  await installFixture(page);
  await page.goto(`/student/nafs/assessments/${source.assessments[0].id}`);
  await page.getByRole("button", { name: "Start quiz", exact: true }).click();
  await page.getByRole("radio").first().check();
  await expect(
    page.locator(".answer-feedback, [data-answer-result]"),
  ).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Check Answer" })).toHaveCount(
    0,
  );
});
