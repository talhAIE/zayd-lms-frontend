import { test, expect, type Page } from "@playwright/test";
import { attempt, user } from "./fixture";
const course = {
  id: "step",
  title: "STEP",
  sectionCount: 3,
  topicCount: 3,
  completedTopicCount: 1,
};
const sections = ["reading", "grammar", "listening"].map((kind, i) => ({
  id: kind,
  courseId: "step",
  kind,
  title: kind[0].toUpperCase() + kind.slice(1),
  displayOrder: [3, 1, 2][i],
  topicCount: 1,
  completedTopicCount: 0,
}));
async function mock(page: Page) {
  const state = {
    discovery: 200,
    deny: false,
    empty: false,
    audioFail: false,
    expired: false,
    submitted: false,
    requests: [] as string[],
  };
  await page.addInitScript((u) => {
    localStorage.setItem("AiTutorUser", JSON.stringify(u));
    localStorage.setItem("accessToken", "synthetic");
    localStorage.setItem("refreshToken", "synthetic-refresh");
  }, user);
  await page.route("**/*", async (route) => {
    const req = route.request(),
      url = new URL(req.url());
    if (url.hostname.endsWith(".blob.core.windows.net")) {
      if (state.audioFail) return route.abort();
      const b = Buffer.alloc(44 + 160000);
      b.write("RIFF");
      b.writeUInt32LE(b.length - 8, 4);
      b.write("WAVEfmt ", 8);
      b.writeUInt32LE(16, 16);
      b.writeUInt16LE(1, 20);
      b.writeUInt16LE(1, 22);
      b.writeUInt32LE(8000, 24);
      b.writeUInt32LE(16000, 28);
      b.writeUInt16LE(2, 32);
      b.writeUInt16LE(16, 34);
      b.write("data", 36);
      b.writeUInt32LE(160000, 40);
      return route.fulfill({
        body: b,
        contentType: "audio/wav",
        headers: { "Access-Control-Allow-Origin": "*" },
      });
    }
    if (url.hostname !== "127.0.0.1") return route.abort();
    if (!url.pathname.startsWith("/api/v1/")) return route.continue();
    const p = url.pathname.slice(7);
    state.requests.push(`${req.method()} ${p}`);
    const json = (data: unknown, status = 200) =>
      route.fulfill({ status, json: { status: true, data } });
    if (p === "/learning/courses")
      return json({
        courses: [
          {
            id: "normal",
            title: "Existing English course",
            code: "EN",
            grade: "9",
            progressPct: 0,
            progressStatus: "not_started",
            isLocked: false,
          },
        ],
      });
    if (!p.startsWith("/step/")) return json({}, 404);
    if (state.deny) return json({}, 403);
    if (p === "/step/courses")
      return state.discovery === 200
        ? json({ courses: state.empty ? [] : [course] })
        : route.fulfill({
            status: state.discovery,
            json: {
              code:
                state.discovery === 404 ? "STEP_DISABLED" : "STEP_UNAVAILABLE",
            },
          });
    if (p === "/step/courses/step") return json({ course, sections });
    if (p.startsWith("/step/sections/")) {
      const kind = p.split("/").pop()!;
      return json({
        section: sections.find((s) => s.id === kind),
        topics: [
          {
            id: kind,
            sectionId: kind,
            kind,
            title: `Synthetic ${kind} activity`,
            displayOrder: 1,
            questionCount: kind === "grammar" ? 60 : 4,
            totalMarks: kind === "grammar" ? 60 : 4,
            state: "not_started",
            attemptId: null,
            result: null,
          },
        ],
      });
    }
    if (p.startsWith("/step/topics/")) {
      const kind = p.split("/").pop()!;
      return json({
        id: kind,
        sectionId: kind,
        courseId: "step",
        kind,
        title: `Synthetic ${kind} activity`,
        questionCount: 4,
        totalMarks: 4,
        state: "not_started",
        attemptId: null,
        instructions: ["Choose one answer."],
        maxAttempts: 1,
        timerSeconds: null,
        requiresAllAnswers: true,
        feedbackPolicy: "final_total_only",
      });
    }
    if (p.endsWith("/access"))
      return json({
        url: "https://synthetic.blob.core.windows.net/step-private-content/step/tone.wav",
        expiresAt: new Date(
          Date.now() + (state.expired ? -60000 : 240000),
        ).toISOString(),
      });
    if (p.startsWith("/step/attempts/")) {
      if (state.submitted)
        return json({
          attemptId: "reading",
          topicId: "reading",
          state: "submitted",
          earnedMarks: 3,
          totalMarks: 4,
          completedAt: "2026-11-10T00:00:00Z",
        });
      const view = attempt(p.split("/").pop() as "grammar");
      view.selections = [{ questionId: "q0", optionId: "q0o0" }];
      return json(view);
    }
    return json({}, 404);
  });
  return state;
}
test("Courses isolates disabled, empty and failed STEP discovery; retry and hierarchy use API order", async ({
  page,
}) => {
  const s = await mock(page);
  s.discovery = 404;
  await page.goto("/student/courses");
  await expect(page.getByText("Existing English course")).toBeVisible();
  await expect(page.getByRole("link", { name: "Open STEP" })).toHaveCount(0);
  s.discovery = 503;
  await page.reload();
  await expect(page.getByText("Existing English course")).toBeVisible();
  await page.getByRole("button", { name: "Retry loading STEP" }).click();
  await expect(
    page.getByRole("button", { name: "Retry loading STEP" }),
  ).toBeVisible();
  s.discovery = 200;
  s.empty = true;
  await page.getByRole("button", { name: "Retry loading STEP" }).click();
  await expect(page.getByRole("link", { name: "Open STEP" })).toHaveCount(0);
  s.empty = false;
  await page.reload();
  await page.getByRole("link", { name: "Open STEP" }).click();
  await expect(
    page.getByRole("heading", { name: "Choose a section" }),
  ).toBeVisible();
  await expect(page.locator("article h3")).toHaveText([
    "Grammar",
    "Listening",
    "Reading",
  ]);
  await page.getByRole("link", { name: "Open Listening" }).click();
  await expect(page.getByText("4 questions · 4 marks")).toBeVisible();
  await page.getByRole("link", { name: "Open activity" }).click();
  await expect(
    page.getByRole("button", { name: "Start activity" }),
  ).toBeDisabled();
  expect(
    s.requests.filter((p) => p.startsWith("POST") || p.startsWith("PUT")),
  ).toEqual([]);
});
for (const width of [390, 1440])
  for (const kind of ["grammar", "listening", "reading"])
    test(`${kind} controlled layout at ${width}px`, async ({ page }) => {
      const s = await mock(page);
      await page.setViewportSize({ width, height: 1000 });
      await page.goto(`/dev/step/layout.html?kind=${kind}`);
      await expect(
        page.getByRole("heading", { name: /Question 1 of/ }),
      ).toBeVisible();
      await expect(
        page.getByRole("button", { name: "Submit activity" }),
      ).toBeDisabled();
      await page.getByRole("radio").first().check();
      await expect(page.getByText(/1 of \d+ answered/)).toBeVisible();
      await page.getByRole("radio").first().focus();
      await page.keyboard.press("ArrowDown");
      await expect(page.getByRole("radio").nth(1)).toBeChecked();
      if (kind === "reading" && width < 1024) {
        await page.getByText("Read passage", { exact: true }).click();
        await expect(page.locator("details")).toHaveAttribute("open", "");
      }
      if (kind === "listening") {
        await expect(page.locator("audio")).toHaveJSProperty("readyState", 4);
        await page.locator("audio").evaluate((a) => {
          (window as any).savedAudio = a;
          void (a as HTMLAudioElement).play();
        });
      }
      await page.getByRole("button", { name: "Next", exact: true }).click();
      await expect(
        page.getByRole("heading", { name: /Question 2 of/ }),
      ).toBeFocused();
      await page.getByRole("radio").first().check();
      if (kind === "listening") {
        expect(
          await page
            .locator("audio")
            .evaluate((a) => a === (window as any).savedAudio),
        ).toBe(true);
        await expect
          .poll(() =>
            page
              .locator("audio")
              .evaluate((a) => (a as HTMLAudioElement).currentTime),
          )
          .toBeGreaterThan(0);
      }
      if (kind === "reading" && width < 1024)
        await expect(page.locator("details")).toHaveAttribute("open", "");
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      await page.screenshot({
        path: `dev/.step-qa/${kind}-${width}.png`,
        fullPage: true,
      });
      expect(
        s.requests.filter((p) => p.startsWith("PUT") || p.includes("/submit")),
      ).toEqual([]);
    });
test("all selections enable controlled submit with no correctness reveal", async ({
  page,
}) => {
  await mock(page);
  await page.goto("/dev/step/layout.html?kind=reading");
  for (let i = 0; i < 4; i++) {
    await page.getByRole("radio").first().check();
    if (i < 3)
      await page.getByRole("button", { name: "Next", exact: true }).click();
  }
  await page.getByRole("button", { name: "Submit activity" }).click();
  await expect(
    page.getByText("Synthetic submit callback called"),
  ).toBeVisible();
  await expect(
    page.getByText(/correct answer|incorrect|earned marks/i),
  ).toHaveCount(0);
});
test("audio retry, expiry and release on leaving routed attempt", async ({
  page,
}) => {
  const s = await mock(page);
  s.expired = true;
  await page.goto("/student/step/attempts/listening");
  await expect(
    page.getByRole("button", { name: "Reload audio" }),
  ).toBeVisible();
  s.expired = false;
  s.audioFail = true;
  await page.getByRole("button", { name: "Reload audio" }).click();
  await expect(
    page.getByRole("button", { name: "Reload audio" }),
  ).toBeVisible();
  s.audioFail = false;
  await page.getByRole("button", { name: "Reload audio" }).click();
  await expect(page.locator("audio")).toHaveJSProperty("readyState", 4);
  await page.locator("audio").evaluate((a) => ((window as any).savedAudio = a));
  await page
    .getByRole("link", { name: "Back to activity", exact: true })
    .click();
  expect(
    await page.evaluate(
      () =>
        (window as any).savedAudio.paused &&
        !(window as any).savedAudio.getAttribute("src"),
    ),
  ).toBe(true);
});
test("denied route and account switch hide stale student content", async ({
  page,
}) => {
  const s = await mock(page);
  s.deny = true;
  await page.goto("/student/step/courses/step");
  await expect(
    page.getByText(
      "This STEP activity is unavailable or you do not have access.",
    ),
  ).toBeVisible();
  s.deny = false;
  await page.getByRole("button", { name: /Try loading again/i }).click();
  await expect(
    page.getByRole("heading", { name: "Choose a section" }),
  ).toBeVisible();
  await page.evaluate(() => {
    localStorage.setItem(
      "AiTutorUser",
      JSON.stringify({ id: "another", username: "another", role: "student" }),
    );
    window.dispatchEvent(new StorageEvent("storage", { key: "AiTutorUser" }));
  });
  await expect(
    page.getByRole("heading", { name: "Choose a section" }),
  ).toHaveCount(0);
});

test("routed attempt stays read-only, uses saved selections and releases audio on account switch", async ({
  page,
}) => {
  await mock(page);
  await page.goto("/student/step/attempts/listening");
  await expect(page.locator("audio")).toHaveJSProperty("readyState", 4);
  await expect(page.getByRole("radio").first()).toBeDisabled();
  await expect(page.getByRole("radio").first()).toBeChecked();
  await expect(page.getByText("1 of 4 answered")).toBeVisible();
  await page.locator("audio").evaluate((a) => ((window as any).savedAudio = a));
  await page.getByRole("button", { name: "Next", exact: true }).click();
  expect(
    await page
      .locator("audio")
      .evaluate((a) => a === (window as any).savedAudio),
  ).toBe(true);
  await page.screenshot({
    path: "dev/.step-qa/routed-listening-desktop.png",
    fullPage: true,
  });
  await page.evaluate(() => {
    localStorage.setItem(
      "AiTutorUser",
      JSON.stringify({ id: "next", username: "next", role: "student" }),
    );
    window.dispatchEvent(new StorageEvent("storage", { key: "AiTutorUser" }));
  });
  await expect(page.locator("audio")).toHaveCount(0);
  expect(
    await page.evaluate(
      () =>
        (window as any).savedAudio.paused &&
        !(window as any).savedAudio.getAttribute("src"),
    ),
  ).toBe(true);
});

test("submitted attempt displays only server final total", async ({ page }) => {
  const s = await mock(page);
  s.submitted = true;
  await page.goto("/student/step/attempts/reading");
  await expect(
    page.getByRole("heading", { name: "Activity completed" }),
  ).toBeVisible();
  await expect(page.getByText("3 / 4", { exact: true })).toBeVisible();
  await expect(page.getByRole("radio")).toHaveCount(0);
  await expect(page.getByText(/correct answer|incorrect|retake/i)).toHaveCount(
    0,
  );
});
