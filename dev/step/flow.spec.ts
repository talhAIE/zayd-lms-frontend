import { test, expect, type Page } from "@playwright/test";
import { mock } from "./browser-fixture";
async function fill(page: Page, n = 4) {
  for (let i = 0; i < n; i++) {
    await page.getByRole("radio").first().check();
    if (i < n - 1)
      await page.getByRole("button", { name: "Next", exact: true }).click();
  }
  await expect(
    page.getByRole("button", { name: "Submit activity", exact: true }),
  ).toBeEnabled();
}
async function confirm(page: Page) {
  await page
    .getByRole("button", { name: "Submit activity", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page
    .getByRole("button", { name: "Confirm submission", exact: true })
    .click();
}
for (const kind of ["grammar", "listening", "reading"])
  test(`${kind}: Start, save, resume, submit and server progress`, async ({
    page,
  }) => {
    test.setTimeout(120000);
    const s = await mock(page);
    if (kind === "reading")
      await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`/student/step/topics/${kind}`);
    expect(s.created).toBe(0);
    await page.getByRole("button", { name: "Start activity" }).click();
    await expect(
      page.getByRole("heading", { name: /Question 1 of/ }),
    ).toBeVisible();
    expect(s.created).toBe(1);
    await page.getByRole("radio").nth(1).check();
    await expect(
      page.getByText("All answers saved", { exact: true }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Next", exact: true }).click();
    await page.reload();
    await expect(
      page.getByRole("heading", { name: /Question 2 of/ }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Previous", exact: true }).click();
    await expect(page.getByRole("radio").nth(1)).toBeChecked();
    const n = kind === "grammar" ? 60 : 4;
    await fill(page, n);
    await page
      .getByRole("button", { name: "Submit activity", exact: true })
      .click();
    await page.getByRole("button", { name: "Keep reviewing" }).click();
    expect(s.requests.filter((r) => r.path.endsWith("/submit"))).toHaveLength(
      0,
    );
    await confirm(page);
    await expect(
      page.getByRole("heading", { name: "Activity completed" }),
    ).toBeVisible();
    await expect(page.getByText(`3 / ${n}`, { exact: true })).toBeVisible();
    await expect(page.getByRole("radio")).toHaveCount(0);
    await page.reload();
    await expect(
      page.getByRole("heading", { name: "Activity completed" }),
    ).toBeVisible();
    await page
      .getByRole("link", { name: "Back to activity", exact: true })
      .click();
    await expect(
      page.getByRole("link", { name: "View result", exact: true }),
    ).toBeVisible();
    await page
      .getByRole("link", { name: "Back to section", exact: true })
      .click();
    await expect(page.getByText("Completed", { exact: true })).toBeVisible();
    await page.getByRole("link", { name: "Back to STEP", exact: true }).click();
    await expect(
      page.getByText("1 of 3 activities completed", { exact: true }),
    ).toBeVisible();
    await page.goto("/student/courses");
    await expect(
      page.getByText("1 of 3 activities completed", { exact: true }),
    ).toBeVisible();
    expect(s.created).toBe(1);
    expect(s.requests.filter((r) => r.path.endsWith("/submit"))).toHaveLength(
      1,
    );
  });
test("failed Start retries resume the same server attempt without creating another", async ({
  page,
}) => {
  const s = await mock(page);
  s.lostStart = true;
  await page.goto("/student/step/topics/reading");
  await page.getByRole("button", { name: "Start activity" }).click();
  await expect(page.getByRole("alert")).toBeVisible();
  await page.getByRole("button", { name: "Start activity" }).click();
  await expect(
    page.getByRole("heading", { name: "Question 1 of 4" }),
  ).toBeVisible();
  expect(s.created).toBe(1);
});
test("offline save survives reload with exact request ID and newest answer", async ({
  page,
}) => {
  const s = await mock(page);
  s.failSaves = 10;
  await page.goto("/student/step/attempts/reading");
  await page.getByRole("radio").nth(1).check();
  await expect(
    page.getByRole("button", { name: "Retry saving" }),
  ).toBeVisible();
  await page.getByRole("radio").nth(2).check();
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Question 2 of 4" }),
  ).toBeVisible();
  s.failSaves = 0;
  await page.getByRole("button", { name: "Retry saving" }).click();
  await expect(
    page.getByText("All answers saved", { exact: true }),
  ).toBeVisible();
  const writes = s.requests.filter((r) => r.method === "PUT");
  expect(writes[1].body).toEqual(writes[0].body);
  expect(writes.at(-1)!.body.optionId).toBe("q0o2");
  await page.getByRole("button", { name: "Previous", exact: true }).click();
  await expect(page.getByRole("radio").nth(2)).toBeChecked();
});
test("revision conflict blocks submit and requires review before saving local changes", async ({
  page,
}) => {
  const s = await mock(page);
  s.conflictOnce = true;
  await page.goto("/student/step/attempts/reading");
  await page.getByRole("radio").nth(2).check();
  await expect(
    page.getByRole("button", { name: "Keep my device answers" }),
  ).toBeVisible();
  await expect(page.getByRole("radio").first()).toBeDisabled();
  await page.getByRole("button", { name: "Keep my device answers" }).click();
  await expect(
    page.getByText("All answers saved", { exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("radio").nth(2)).toBeChecked();
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await expect(page.getByRole("radio").nth(1)).toBeChecked();
  expect(s.requests.filter((r) => r.path.endsWith("/submit"))).toHaveLength(0);
});
test("lost submit reply and failed read stay locked across reload then recover server result", async ({
  page,
}) => {
  const s = await mock(page);
  await page.goto("/student/step/attempts/reading");
  await fill(page);
  s.lostSubmit = true;
  s.failReadAfterSubmit = true;
  await confirm(page);
  await expect(
    page.getByRole("button", { name: "Check submission" }),
  ).toBeVisible();
  await expect(page.getByRole("radio").first()).toBeDisabled();
  s.failReads = false;
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Activity completed" }),
  ).toBeVisible();
  expect(s.requests.filter((r) => r.path.endsWith("/submit"))).toHaveLength(1);
  expect(
    await page.evaluate(() =>
      Object.keys(sessionStorage).filter((k) => k.startsWith("step:attempt:")),
    ),
  ).toEqual([]);
});
test("unsent submit is checked before exact replay after refresh; radios stay locked", async ({
  page,
}) => {
  const s = await mock(page);
  await page.goto("/student/step/attempts/listening");
  await fill(page);
  s.dropSubmit = true;
  await confirm(page);
  await expect(
    page.getByRole("button", { name: "Check submission" }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Check submission" }),
  ).toBeVisible();
  await expect(page.getByRole("radio").first()).toBeDisabled();
  s.dropSubmit = false;
  await page.getByRole("button", { name: "Check submission" }).click();
  await expect(
    page.getByRole("heading", { name: "Activity completed" }),
  ).toBeVisible();
  const submits = s.requests.filter((r) => r.path.endsWith("/submit"));
  expect(submits).toHaveLength(2);
  expect(submits[1].body).toEqual(submits[0].body);
  const second = s.requests.indexOf(submits[1]);
  expect(s.requests.slice(0, second).at(-1)!.method).toBe("GET");
});
test("switching account during a delayed save cannot send queued answers as the next student", async ({
  page,
}) => {
  const s = await mock(page);
  s.saveDelayMs = 1000;
  await page.goto("/student/step/attempts/reading");
  await page.getByRole("radio").nth(1).check();
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await page.getByRole("radio").nth(1).check();
  await page.evaluate(() => {
    localStorage.setItem(
      "AiTutorUser",
      JSON.stringify({
        id: "next",
        username: "next",
        role: "student",
        region: "ROW",
      }),
    );
    localStorage.setItem("accessToken", "next-token");
    window.dispatchEvent(new StorageEvent("storage", { key: "AiTutorUser" }));
  });
  await expect(page.getByRole("radio")).toHaveCount(0);
  await page.goto("/student/step/attempts/reading");
  await expect(
    page.getByRole("heading", { name: "Question 1 of 4" }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Retry saving" })).toHaveCount(
    0,
  );
  expect(
    s.requests.filter(
      (r) => r.method === "PUT" && r.auth === "Bearer next-token",
    ),
  ).toHaveLength(0);
});
