import { test, expect, type Page } from "@playwright/test";
import { fixture, sid, routePath, q1 } from "./practice-player.fixture";

const overview =
  "/student/nafs/practice/collections/22222222-2222-4222-8222-222222222222";
const saving = (page: Page) =>
  page.getByRole("status", { name: "Practice saving status" });
async function check(page: Page, label: "A" | "B" = "B") {
  await page.getByRole("radio", { name: new RegExp(`^${label}\\.`) }).check();
  await page.getByRole("button", { name: "Check Answer", exact: true }).click();
  await expect(saving(page)).toHaveText("All choices saved.");
}
async function finish(page: Page) {
  await check(page);
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await check(page, "A");
  await page
    .getByRole("button", { name: "Finish practice", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Confirm finish", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Practice finished" }),
  ).toBeVisible();
}
for (const width of [1440, 390]) {
  test(`durable ${width}px: start, autosave, reload, finish confirmation, repeat and immutable old result`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width, height: 950 });
    const state = await fixture(page);
    await page.goto("/student/courses");
    await page.getByRole("link", { name: "Open course", exact: true }).click();
    await page.getByRole("link", { name: "Open Practice Mode" }).click();
    await page.getByRole("link", { name: "View Quiz 1" }).click();
    await page
      .getByRole("button", { name: "Start practice", exact: true })
      .click();
    await expect(page).toHaveURL(routePath);
    await page.getByRole("radio", { name: /^B\./ }).check();
    await expect(saving(page)).toHaveText("All choices saved.");
    await expect(
      page.getByRole("button", { name: "Finish practice", exact: true }),
    ).toBeDisabled();
    await page.reload();
    await page.getByRole("button", { name: "Keep local choices" }).click();
    await expect(page.getByRole("radio", { name: /^B\./ })).toBeChecked();
    await expect(page.locator("[data-answer-result]")).toHaveCount(0);
    await page
      .getByRole("button", { name: "Check Answer", exact: true })
      .click();
    await expect(
      page.getByRole("status", { name: "Answer feedback" }),
    ).toHaveText("Correct!");
    await page.getByRole("button", { name: "Next", exact: true }).click();
    await check(page, "A");
    await page
      .getByRole("button", { name: "Finish practice", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Keep reviewing", exact: true })
      .click();
    expect(state.operations.filter((o) => o.kind === "complete")).toHaveLength(
      0,
    );
    await page
      .getByRole("button", { name: "Finish practice", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Confirm finish", exact: true })
      .click();
    await expect(page.getByLabel("1 out of 2 marks")).toBeVisible();
    await page.screenshot({
      path: testInfo.outputPath(`practice-completed-${width}.png`),
      fullPage: true,
    });
    const completed = structuredClone(state.runs.get(sid));
    await page.reload();
    await expect(page.getByLabel("1 out of 2 marks")).toBeVisible();
    await page
      .getByRole("button", { name: "Practice again", exact: true })
      .click();
    await expect(page).not.toHaveURL(routePath);
    await expect(page.getByText("NAFS · Practice Mode · Run 2")).toBeVisible();
    await expect(page.getByRole("radio", { checked: true })).toHaveCount(0);
    expect(state.runs.get(sid)).toEqual(completed);
    expect(state.runs.size).toBe(2);
    await page.goto(routePath);
    await expect(page.getByLabel("1 out of 2 marks")).toBeVisible();
    expect(state.operations.filter((o) => o.kind === "start")).toHaveLength(1);
    const keys = await page.evaluate(() => Object.keys(sessionStorage));
    expect(
      keys.filter(
        (k) => k.startsWith("nafs:practice:draft:") && k.endsWith(sid),
      ),
    ).toHaveLength(0);
  });
}
test("lost start replays the durable receipt instead of creating a second run", async ({
  page,
}) => {
  const state = await fixture(page);
  state.failStart = true;
  await page.goto(overview);
  await page
    .getByRole("button", { name: "Start practice", exact: true })
    .click();
  await expect(page.getByRole("alert")).toContainText(
    "Could not confirm practice",
  );
  await page.getByRole("button", { name: "Retry opening practice" }).click();
  await expect(page).toHaveURL(routePath);
  const sent = state.operations.filter((o) => o.kind === "start");
  expect(sent).toHaveLength(2);
  expect(sent[1].body).toEqual(sent[0].body);
  expect(state.runs.size).toBe(1);
});
test("lost repeat survives reload and resolves one successor with the same request", async ({
  page,
}) => {
  const state = await fixture(page);
  await page.goto(routePath);
  await finish(page);
  state.failRepeat = true;
  await page
    .getByRole("button", { name: "Practice again", exact: true })
    .click();
  await expect(page.getByRole("alert")).toContainText(
    "Could not confirm the new run",
  );
  await page.reload();
  await page
    .getByRole("button", { name: "Practice again", exact: true })
    .click();
  await expect(page.getByText("NAFS · Practice Mode · Run 2")).toBeVisible();
  const sent = state.operations.filter((o) => o.kind === "repeat");
  expect(sent).toHaveLength(2);
  expect(sent[1].body).toEqual(sent[0].body);
  expect(state.runs.size).toBe(2);
});
test("lost save receipt survives reload; new checks wait for reconciliation", async ({
  page,
}) => {
  const state = await fixture(page);
  state.failSave = true;
  page.on("dialog", (dialog) => void dialog.accept());
  await page.goto(routePath);
  await page.getByRole("radio", { name: /^B\./ }).check();
  await expect(saving(page)).toContainText("could not be confirmed");
  await page.reload();
  await expect(page.getByRole("radio").first()).toBeDisabled();
  await page.getByRole("button", { name: "Reconcile saved practice" }).click();
  await expect(saving(page)).toHaveText("All choices saved.");
  expect(state.saves).toHaveLength(2);
  expect(state.saves[1].body).toEqual(state.saves[0].body);
  expect(state.checks).toHaveLength(0);
  await page.getByRole("button", { name: "Check Answer", exact: true }).click();
  await expect(
    page.getByRole("status", { name: "Answer feedback" }),
  ).toHaveText("Correct!");
});
test("lost finish response reconciles to permanent result without duplicate completion", async ({
  page,
}) => {
  const state = await fixture(page);
  await page.goto(routePath);
  await check(page);
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await check(page);
  state.failComplete = true;
  await page
    .getByRole("button", { name: "Finish practice", exact: true })
    .click();
  await page.getByRole("button", { name: "Confirm finish" }).click();
  await expect(saving(page)).toContainText("could not be confirmed");
  await expect(page.getByRole("radio").first()).toBeDisabled();
  await page.getByRole("button", { name: "Reconcile saved practice" }).click();
  await expect(page.getByLabel("2 out of 2 marks")).toBeVisible();
  expect(state.operations.filter((o) => o.kind === "complete")).toHaveLength(1);
});
test("another tab revision never silently overwrites saved work; keep-local is deliberate", async ({
  page,
}) => {
  const state = await fixture(page);
  await page.goto(routePath);
  state.session.revision = 3;
  state.session.selections = [{ questionId: q1, optionId: "0-C" }];
  await page.getByRole("radio", { name: /^B\./ }).check();
  await expect(
    page.getByRole("button", { name: "Keep local choices" }),
  ).toBeVisible();
  expect(state.session.selections[0].optionId).toBe("0-C");
  await page.getByRole("button", { name: "Keep local choices" }).click();
  await expect(saving(page)).toHaveText("All choices saved.");
  expect(state.session.selections[0].optionId).toBe("0-B");
  expect(state.saves.at(-1)?.body.expectedRevision).toBe(3);
});
test("cross-tab account or region change removes questions/media and ignores late saves", async ({
  page,
}) => {
  const state = await fixture(page);
  state.saveDelay = 700;
  await page.goto(routePath);
  await page.getByRole("radio", { name: /^B\./ }).check();
  await page.evaluate(() => {
    const current = JSON.parse(localStorage.getItem("AiTutorUser")!);
    localStorage.setItem(
      "AiTutorUser",
      JSON.stringify({ ...current, id: "other", region: "SAUDI" }),
    );
    dispatchEvent(new StorageEvent("storage", { key: "AiTutorUser" }));
  });
  await expect(page.getByRole("radio")).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "Welcome Back!" }),
  ).toBeVisible();
  await expect(page.locator('img[src^="blob:"]')).toHaveCount(0);
});
test("revoked grants hide an already loaded practice after save rejection", async ({
  page,
}) => {
  const state = await fixture(page);
  await page.goto(routePath);
  state.deny = true;
  await page.getByRole("radio", { name: /^A\./ }).check();
  await expect(page.getByRole("radio")).toHaveCount(0);
  await expect(page.getByRole("alert")).toContainText("access changed");
});
test("browser offline saves retain choices and reconcile after reconnecting without grading", async ({
  page,
}) => {
  const state = await fixture(page);
  await page.goto(routePath);
  // Fulfilled route fixtures bypass Chromium's offline network failure. Cut the
  // mocked API transport too, so this represents an unreachable backend.
  const offlineApi = "**/api/v1/nafs/practice/**";
  await page.route(offlineApi, (route) => route.abort());
  await page.context().setOffline(true);
  await page.getByRole("radio", { name: /^B\./ }).check();
  await expect(saving(page)).toContainText("could not be confirmed");
  expect(state.saves).toHaveLength(0);
  await page.context().setOffline(false);
  await page.unroute(offlineApi);
  await page.getByRole("button", { name: "Reconcile saved practice" }).click();
  await expect(saving(page)).toHaveText("All choices saved.");
  expect(state.saves).toHaveLength(1);
  expect(state.checks).toHaveLength(0);
});
test("two open tabs require an explicit choice instead of silently replacing newer saved answers", async ({
  page,
  context,
}) => {
  const state = await fixture(page);
  await page.goto(routePath);
  const second = await context.newPage();
  await state.attach(second);
  await second.goto(routePath);
  await page.getByRole("radio", { name: /^A\./ }).check();
  await expect(saving(page)).toHaveText("All choices saved.");
  await second.getByRole("radio", { name: /^B\./ }).check();
  await expect(
    second.getByRole("button", { name: "Keep local choices" }),
  ).toBeVisible();
  expect(state.session.selections[0].optionId).toBe("0-A");
  await second.getByRole("button", { name: "Keep local choices" }).click();
  await expect(saving(second)).toHaveText("All choices saved.");
  await page.getByRole("button", { name: "Check Answer", exact: true }).click();
  await page.getByRole("button", { name: "Use server choices" }).click();
  await expect(page.getByRole("radio", { name: /^B\./ })).toBeChecked();
  expect(state.session.selections[0].optionId).toBe("0-B");
  await expect(page.locator("[data-answer-result]")).toHaveCount(0);
  await second.close();
});
test("closing a tab preserves its pending save in a private scoped backup for explicit recovery", async ({
  page,
  context,
}) => {
  const state = await fixture(page);
  await page.goto(routePath);
  const offlineApi = "**/api/v1/nafs/practice/**";
  await page.route(offlineApi, (route) => route.abort());
  await page.getByRole("radio", { name: /^B\./ }).check();
  await expect(saving(page)).toContainText("could not be confirmed");
  expect(state.saves).toHaveLength(0);
  const next = await context.newPage();
  await state.attach(next);
  await page.close({ runBeforeUnload: false });
  await next.goto(routePath);
  await expect(
    next.getByRole("heading", { name: "Recover local practice" }),
  ).toBeVisible();
  await next.getByRole("button", { name: "Recover draft 1" }).click();
  await next.getByRole("button", { name: "Reconcile saved practice" }).click();
  await expect(saving(next)).toHaveText("All choices saved.");
  await expect(next.getByRole("radio", { name: /^B\./ })).toBeChecked();
  expect(state.saves).toHaveLength(1);
  expect(state.checks).toHaveLength(0);
});
