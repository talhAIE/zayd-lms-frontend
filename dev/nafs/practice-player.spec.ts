import { test, expect, type Page } from "@playwright/test";
import type {
  PracticeInProgressSession,
  PracticeCheckedAnswer,
} from "../../src/types/nafs-practice.contract";
import { installFixture, source } from "./browser-fixture";
import { deflateSync } from "node:zlib";

// A coded 400x180 half-shaded diagram, matching the synthetic asset dimensions.
function diagramPng() {
  const width = 400,
    height = 180,
    rows = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++) {
      const border =
        x >= 20 &&
        x <= 380 &&
        y >= 30 &&
        y <= 150 &&
        (x <= 22 || x >= 378 || y <= 32 || y >= 148 || (x >= 199 && x <= 201));
      const shaded = x > 22 && x < 200 && y > 32 && y < 148;
      const color = border
        ? [35, 46, 67, 255]
        : shaded
          ? [79, 141, 251, 255]
          : [248, 250, 252, 255];
      color.forEach(
        (value, i) => (rows[y * (width * 4 + 1) + 1 + x * 4 + i] = value),
      );
    }
  function chunk(type: string, data: Buffer) {
    const name = Buffer.from(type),
      length = Buffer.alloc(4),
      checksum = Buffer.alloc(4);
    length.writeUInt32BE(data.length);
    let crc = 0xffffffff;
    for (const value of Buffer.concat([name, data])) {
      crc ^= value;
      for (let i = 0; i < 8; i++)
        crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
    checksum.writeUInt32BE((crc ^ 0xffffffff) >>> 0);
    return Buffer.concat([length, name, data, checksum]);
  }
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width);
  header.writeUInt32BE(height, 4);
  header[8] = 8;
  header[9] = 6;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", header),
    chunk("IDAT", deflateSync(rows)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}
const syntheticDiagram = diagramPng();

const sid = "33333333-3333-4333-8333-333333333333";
const q1 = "44444444-4444-4444-8444-444444444444";
const q2 = "55555555-5555-4555-8555-555555555555";
const assetId = "66666666-6666-4666-8666-666666666666";
const routePath = `/student/nafs/practice/sessions/${sid}`;
const now = "2026-11-13T10:00:00.000Z";
async function fixture(page: Page, count = 2) {
  await page.addInitScript(() => {
    localStorage.setItem(
      "AiTutorUser",
      JSON.stringify({
        id: "pm5.synthetic",
        username: "pm5.synthetic",
        role: "student",
        region: "ROW",
      }),
    );
    localStorage.setItem("accessToken", "pm5.synthetic.token");
    localStorage.setItem("refreshToken", "pm5.synthetic.refresh");
  });
  const figure = {
    id: assetId,
    url: "https://untrusted.invalid/never-fetch.png?credential=never",
    alt: "Synthetic fraction diagram",
    width: 400,
    height: 180,
  };
  const session: PracticeInProgressSession = {
    id: sid,
    courseId: "11111111-1111-4111-8111-111111111111",
    collectionId: "22222222-2222-4222-8222-222222222222",
    contentVersion: 1,
    runNumber: 1,
    state: "in_progress",
    revision: 0,
    startedAt: now,
    lastSavedAt: null,
    questionCount: count,
    questions: Array.from({ length: count }, (_, i) => ({
      id: i === 0 ? q1 : i === 1 ? q2 : `q-${i}`,
      displayOrder: i + 1,
      stem:
        i === 0
          ? "Choose the fraction 1/2 of the whole."
          : `Synthetic question ${i + 1}: Compare 3/4 and 1/2.`,
      emphasisTerms: i === 0 ? ["fraction"] : ["3/4"],
      accessibleVisualText:
        i === 0 ? "A whole divided into equal parts." : null,
      figure: i === 0 ? figure : null,
      passageId: i === 0 ? "p1" : "p2",
      options: ["A", "B", "C", "D"].map((label, n) => ({
        id: `${i}-${label}`,
        label,
        text: [
          "One quarter 1/4",
          "One half 1/2",
          "Three quarters 3/4",
          "One whole",
        ][n],
        image:
          i === 0 && n === 1
            ? { ...figure, alt: "Synthetic half diagram" }
            : null,
        emphasisTerms: n === 1 ? ["half"] : [],
      })) as PracticeInProgressSession["questions"][number]["options"],
    })),
    passages: [
      {
        id: "p1",
        paragraphs: [
          "First full passage: a fraction describes part of a whole.",
          "Final paragraph of the first passage.",
        ],
        emphasisTerms: ["fraction"],
        figure: { ...figure, alt: "Synthetic passage figure" },
      },
      {
        id: "p2",
        paragraphs: [
          "A different full passage for the second question.",
          "Final paragraph of the second passage.",
        ],
        emphasisTerms: [],
        figure: null,
      },
    ],
    selections: [],
    latestChecks: [],
    checkedCount: 0,
    policy: {
      checkAction: "explicit",
      retries: "unlimited",
      progression: "manual",
      completion: "all_current_selections_checked",
      repeat: "explicit_new_run_after_completion",
      scoring: "latest_checked_answer_one_mark",
      feedback: "checked_option_correctness_only",
      timerSeconds: null,
    },
  };
  const state = {
    session,
    checks: [] as {
      questionId: string;
      body: Record<string, string | number>;
    }[],
    receipts: new Map<string, PracticeCheckedAnswer>(),
    duplicate: false,
    fail: false,
    conflict: false,
    delay: 0,
    deny: false,
    failMedia: false,
    media: [] as { url: string; auth?: string }[],
  };
  await page.route("**/*", async (route) => {
    const request = route.request(),
      url = new URL(request.url());
    if (url.hostname !== "127.0.0.1") return route.abort();
    if (!url.pathname.startsWith("/api/v1/")) return route.continue();
    const p = url.pathname.slice("/api/v1".length);
    const json = (data: unknown) =>
      route.fulfill({
        json: { status: true, data },
        headers: { "Cache-Control": "private, no-store" },
      });
    const error = (code: string, status = 404) =>
      route.fulfill({
        status,
        json: { code, statusCode: status, message: "Synthetic denial" },
      });
    if (!p.startsWith("/nafs/practice/")) return json({});
    expect(request.headers().authorization).toBe("Bearer pm5.synthetic.token");
    if (state.deny) return error("NAFS_PRACTICE_NOT_FOUND");
    if (p.includes("/assets/")) {
      state.media.push({
        url: request.url(),
        auth: request.headers().authorization,
      });
      if (state.failMedia) return error("NAFS_PRACTICE_UNAVAILABLE", 503);
      return route.fulfill({
        contentType: "image/png",
        body: syntheticDiagram,
      });
    }
    if (request.method() === "GET")
      return json({ session: structuredClone(session) });
    const body = request.postDataJSON();
    const questionId = p.split("/")[6];
    state.checks.push({ questionId, body });
    if (state.delay)
      await new Promise((resolve) => setTimeout(resolve, state.delay));
    if (state.conflict) return error("NAFS_PRACTICE_REVISION_CONFLICT", 409);
    let accepted = state.receipts.get(body.requestId);
    if (state.duplicate) accepted = [...state.receipts.values()].at(-1);
    if (!accepted) {
      expect(body.expectedRevision).toBe(session.revision);
      const previous = session.latestChecks.find(
        (c) => c.questionId === questionId,
      );
      const check = {
        questionId,
        optionId: body.optionId,
        responseId: `synthetic-event-${session.revision + 1}`,
        sequence: (previous?.sequence || 0) + 1,
        isCorrect: body.optionId.endsWith("-B"),
        checkedAt: now,
      };
      session.revision++;
      session.latestChecks = [
        ...session.latestChecks.filter((c) => c.questionId !== questionId),
        check,
      ];
      session.selections = [
        ...session.selections.filter((s) => s.questionId !== questionId),
        { questionId, optionId: body.optionId },
      ];
      session.checkedCount = session.latestChecks.length;
      accepted = {
        sessionId: sid,
        revision: session.revision,
        selection: { questionId, optionId: body.optionId },
        check,
        checkedCount: session.checkedCount,
      };
      state.receipts.set(body.requestId, structuredClone(accepted));
    }
    if (state.fail) {
      state.fail = false;
      return route.abort();
    }
    return json({ checked: accepted });
  });
  return state;
}
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
  await expect(page.getByRole("alert")).toContainText("could not be confirmed");
  await expect(page.getByRole("radio").first()).toBeDisabled();
  await page.getByRole("button", { name: "Retry same check" }).click();
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
  await check(page).click();
  await expect(page.getByRole("radio").first()).toBeDisabled();
  await expect(page.getByRole("alert")).toContainText("session changed");
  await expect(page.locator("[data-answer-result]")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Retry same check" }),
  ).toHaveCount(0);
  state.conflict = false;
  await page
    .getByRole("button", {
      name: "Reload saved practice (discard unchecked choices)",
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
