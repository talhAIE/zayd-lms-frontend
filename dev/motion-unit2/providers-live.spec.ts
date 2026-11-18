import { test, expect } from "@playwright/test";
import { fixture } from "./fixtures";

// Opt-in: real providers, synthetic LMS identity; never starts a Zayd attempt.
test("live provider embedding review", async ({ page }, testInfo) => {
  test.skip(
    process.env.SCIENCE_LIVE_EMBEDS !== "1",
    "External provider review is opt-in",
  );
  test.setTimeout(180000);
  const report: unknown[] = [];
  for (const [unit, key, target] of [
    [2, "unit-kahoot", null],
    [2, "lesson-3-phet", null],
    [3, "lesson-1-phet", null],
    [3, "lesson-1-phet", "Gravity Force Lab"],
  ] as const) {
    await fixture(page, unit);
    await page.goto(
      `/student/science/spark-science/unit-${unit}/activities/${key}`,
    );
    if (target)
      await page.getByRole("button", { name: target, exact: true }).click();
    const frame = page.locator("iframe");
    await expect(frame).toBeVisible();
    const src = await frame.getAttribute("src");
    const iframe = await frame.elementHandle();
    const child = await iframe!.contentFrame();
    const visiblePlayer = await child!
      .locator("canvas,button,a")
      .first()
      .waitFor({ timeout: 25000 })
      .then(() => true)
      .catch(() => false);
    const text = await child!
      .locator("body")
      .innerText({ timeout: 3000 })
      .catch(() => "Provider content could not be inspected");
    report.push({
      unit,
      key,
      target,
      src,
      visiblePlayer,
      text: text.slice(0, 1600),
      frames: page.frames().map((f) => f.url()),
    });
    await page.screenshot({
      path: testInfo.outputPath(
        `unit-${unit}-${key}-${target ?? "default"}.png`,
      ),
      fullPage: true,
    });
  }
  console.log(JSON.stringify(report, null, 2));
  await testInfo.attach("provider-review.json", {
    body: JSON.stringify(report, null, 2),
    contentType: "application/json",
  });
});
