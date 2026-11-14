import { test, expect } from "@playwright/test";
import { fixture, routePath } from "./practice-player.fixture";
import type { PracticeTextLayout } from "../../src/types/nafs-practice.contract";

const fraction: PracticeTextLayout = {
  width: 1.3,
  height: 2.5,
  glyphs: [
    {
      text: "3",
      x: 0.3,
      y: 0,
      width: 0.6,
      size: 1,
      serif: true,
      italic: false,
      bold: false,
    },
    {
      text: "5",
      x: 0.3,
      y: 1.5,
      width: 0.6,
      size: 1,
      serif: true,
      italic: false,
      bold: false,
    },
  ],
  rules: [{ x: 0.1, y: 1.2, length: 1, angle: 0 }],
};
for (const width of [390, 1440]) {
  test(`native text and equations ${width}px retain selection, feedback and saved state without image requests`, async ({
    page,
  }, info) => {
    await page.setViewportSize({ width, height: 1000 });
    const state = await fixture(page);
    const q = state.session.questions[0];
    q.stem = "What is the value of the underlined digit in the number 45,890?";
    q.stemIsFigure = false;
    q.figure = null;
    q.passageId = null;
    q.accessibleVisualText = null;
    state.session.passages = [];
    q.options.forEach((o, i) => {
      o.text = ["500.", "50.", "5.", "5,000."][i];
      o.image = null;
      o.emphasisTerms = [];
    });
    q.options[1].textLayout = fraction;
    await page.goto(routePath);
    await expect(page.locator("#practice-question")).toHaveText(q.stem);
    await expect(page.locator("main").getByRole("img")).toHaveCount(0);
    await expect(page.getByText("Enlarge image")).toHaveCount(0);
    const native = page.getByLabel("Mathematical text");
    await expect(native).toBeVisible();
    await expect(native).toContainText("3");
    await expect(native).toContainText("5");
    const numerator = await native
      .getByText("3", { exact: true })
      .boundingBox();
    const denominator = await native
      .getByText("5", { exact: true })
      .boundingBox();
    expect(numerator!.y).toBeLessThan(denominator!.y);
    await page.getByRole("radio").nth(1).check();
    await page
      .getByRole("button", { name: "Check Answer", exact: true })
      .click();
    await expect(
      page.getByRole("status", { name: "Answer feedback" }),
    ).toHaveText("Correct!");
    await page.reload();
    await expect(page.getByRole("radio").nth(1)).toBeChecked();
    expect(state.media).toHaveLength(0);
    await page.screenshot({
      path: info.outputPath(`native-text-${width}.png`),
      fullPage: true,
    });
  });
}
