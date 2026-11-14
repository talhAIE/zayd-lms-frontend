import { expect, type Page, type Route } from "@playwright/test";
import type {
  PracticeInProgressSession,
  PracticeCheckedAnswer,
  PracticeSessionView,
} from "../../src/types/nafs-practice.contract";
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

export const sid = "33333333-3333-4333-8333-333333333333";
export const q1 = "44444444-4444-4444-8444-444444444444";
export const q2 = "55555555-5555-4555-8555-555555555555";
const assetId = "66666666-6666-4666-8666-666666666666";
export const routePath = `/student/nafs/practice/sessions/${sid}`;
const now = "2026-11-13T10:00:00.000Z";
export async function fixture(page: Page, count = 2) {
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
  const runs = new Map<string, PracticeSessionView>([[sid, session]]);
  const allReceipts = new Map<string, { payload: string; data: unknown }>();
  const successors = new Map<string, string>();
  const state = {
    session,
    runs,
    allReceipts,
    successors,
    checks: [] as {
      questionId: string;
      body: Record<string, string | number>;
    }[],
    saves: [] as {
      questionId: string;
      body: Record<string, string | number>;
    }[],
    operations: [] as { kind: string; body: Record<string, string | number> }[],
    receipts: new Map<string, PracticeCheckedAnswer>(),
    duplicate: false,
    fail: false,
    failSave: false,
    failComplete: false,
    failStart: false,
    failRepeat: false,
    conflict: false,
    delay: 0,
    saveDelay: 0,
    failReads: false,
    deny: false,
    failMedia: false,
    media: [] as { url: string; auth?: string }[],
  };
  const summary = () => {
    const current = [...runs.values()].at(-1)!;
    return {
      id: session.collectionId,
      courseId: session.courseId,
      title: "Quiz 1",
      questionCount: count,
      totalMarks: count,
      state:
        current.runNumber === 1 &&
        current.state === "in_progress" &&
        !current.selections.length &&
        !state.operations.some((o) => o.kind === "start")
          ? "not_started"
          : current.state,
      activeSessionId:
        state.operations.some((o) => o.kind === "start") ||
        current.runNumber > 1
          ? current.state === "in_progress"
            ? current.id
            : null
          : null,
      latestCompletedSessionId:
        [...runs.values()].reverse().find((r) => r.state === "completed")?.id ||
        null,
      instructions: ["Synthetic practice instructions."],
      policy: session.policy,
    };
  };
  const handler = async (route: Route) => {
    const request = route.request(),
      url = new URL(request.url());
    if (url.hostname !== "127.0.0.1") return route.abort();
    if (!url.pathname.startsWith("/api/v1/")) return route.continue();
    const p = url.pathname.slice("/api/v1".length),
      parts = p.split("/");
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
    if (p === "/learning/courses") return json({ courses: [] });
    if (p === "/nafs/courses")
      return json({
        courses: [
          {
            id: session.courseId,
            assessmentId: session.courseId,
            courseTitle: "NAFS Math Grade 9",
            assessmentTitle: "Form A",
            gradeLabel: "9",
            subject: "math",
            questionCount: 30,
            state: "not_started",
            attemptId: null,
            result: null,
          },
        ],
      });
    if (p.endsWith("/modes"))
      return json({
        courseId: session.courseId,
        courseTitle: "NAFS Math Grade 9",
        subject: "math",
        gradeLabel: "9",
        quiz: {
          assessmentId: session.courseId,
          feedbackPolicy: "final_total_only",
        },
        practice: { available: true },
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
    const isStart = p.endsWith("/sessions") && p.includes("/collections/");
    const isRepeat = p.endsWith("/repeat");
    const run = runs.get(parts[4]);
    if (request.method() === "GET") {
      if (p === "/nafs/practice/collections")
        return json({ courseId: session.courseId, collections: [summary()] });
      if (p.includes("/collections/")) return json({ collection: summary() });
      if (state.failReads) return route.abort();
      if (!run) return error("NAFS_PRACTICE_NOT_FOUND");
      return json({ session: structuredClone(run) });
    }
    const body = request.postDataJSON();
    const kind = isStart
      ? "start"
      : isRepeat
        ? "repeat"
        : request.method() === "PUT"
          ? "save"
          : p.endsWith("/complete")
            ? "complete"
            : "check";
    state.operations.push({ kind, body });
    const receipt = allReceipts.get(body.requestId),
      payload = JSON.stringify([p, body]);
    if (receipt) {
      if (receipt.payload !== payload)
        return error("NAFS_PRACTICE_REQUEST_CONFLICT", 409);
      if (kind === "check") state.checks.push({ questionId: parts[6], body });
      if (kind === "save") state.saves.push({ questionId: parts[6], body });
      return json(receipt.data);
    }
    let data: unknown;
    if (isStart) {
      const current = [...runs.values()].at(-1)!;
      data = { session: structuredClone(current) };
    } else if (isRepeat) {
      if (!run || run.state !== "completed")
        return error("NAFS_PRACTICE_NOT_COMPLETED", 409);
      if (body.expectedRevision !== run.revision)
        return error("NAFS_PRACTICE_REVISION_CONFLICT", 409);
      let successor = successors.get(run.id);
      if (!successor) {
        successor = `77777777-7777-4777-8777-${String(run.runNumber + 1).padStart(12, "0")}`;
        const next = structuredClone(session);
        Object.assign(next, {
          id: successor,
          runNumber: run.runNumber + 1,
          revision: 0,
          selections: [],
          latestChecks: [],
          checkedCount: 0,
        });
        runs.set(successor, next);
        successors.set(run.id, successor);
      }
      data = { session: structuredClone(runs.get(successor)) };
    } else {
      if (!run) return error("NAFS_PRACTICE_NOT_FOUND");
      if (run.state === "completed")
        return kind === "complete"
          ? json({ session: run })
          : error("NAFS_PRACTICE_COMPLETED", 409);
      if (kind === "save" && state.saveDelay)
        await new Promise((resolve) => setTimeout(resolve, state.saveDelay));
      if (kind === "check" && state.delay)
        await new Promise((resolve) => setTimeout(resolve, state.delay));
      if (state.conflict || body.expectedRevision !== run.revision)
        return error("NAFS_PRACTICE_REVISION_CONFLICT", 409);
      if (kind === "complete") {
        if (
          !run.questions.every((q) =>
            run.latestChecks.some(
              (c) =>
                c.questionId === q.id &&
                c.optionId ===
                  run.selections.find((s) => s.questionId === q.id)?.optionId,
            ),
          )
        )
          return error("NAFS_PRACTICE_INCOMPLETE", 409);
        const result = {
          id: run.id,
          courseId: run.courseId,
          collectionId: run.collectionId,
          contentVersion: run.contentVersion,
          runNumber: run.runNumber,
          state: "completed" as const,
          revision: run.revision + 1,
          questionCount: count,
          checkedCount: count,
          earnedMarks: run.latestChecks.filter((c) => c.isCorrect).length,
          totalMarks: count,
          completedAt: now,
        };
        runs.set(run.id, result);
        data = { session: result };
      } else {
        const questionId = parts[6],
          selection = { questionId, optionId: body.optionId };
        if (kind === "save") state.saves.push({ questionId, body });
        else state.checks.push({ questionId, body });
        if (kind === "check" && state.duplicate)
          return json({ checked: [...state.receipts.values()].at(-1) });
        run.revision++;
        run.selections = [
          ...run.selections.filter((s) => s.questionId !== questionId),
          selection,
        ];
        if (kind === "check") {
          const previous = run.latestChecks.find(
            (c) => c.questionId === questionId,
          );
          const check = {
            ...selection,
            responseId: `${run.id}-event-${run.revision}`,
            sequence: (previous?.sequence || 0) + 1,
            isCorrect:
              run.questions.find((q) => q.id === questionId)?.responseKind ===
              "multi_choice"
                ? body.optionId === '["0-A","0-C"]'
                : run.questions.find((q) => q.id === questionId)
                      ?.responseKind === "written"
                  ? body.optionId ===
                    JSON.stringify({ text: "Equivalent written answer" })
                  : body.optionId.endsWith("-B"),
            checkedAt: now,
          };
          run.latestChecks = [
            ...run.latestChecks.filter((c) => c.questionId !== questionId),
            check,
          ];
          const checked = {
            sessionId: run.id,
            revision: run.revision,
            selection,
            check,
            checkedCount: run.latestChecks.length,
          };
          state.receipts.set(body.requestId, structuredClone(checked));
          data = { checked };
        } else
          data = {
            saved: {
              sessionId: run.id,
              revision: run.revision,
              selection,
              savedAt: now,
              checkedCount: run.latestChecks.length,
            },
          };
      }
    }
    allReceipts.set(body.requestId, { payload, data: structuredClone(data) });
    const failKey =
      kind === "check"
        ? "fail"
        : kind === "save"
          ? "failSave"
          : kind === "complete"
            ? "failComplete"
            : kind === "start"
              ? "failStart"
              : "failRepeat";
    if (state[failKey]) {
      state[failKey] = false;
      return route.abort();
    }
    return json(data);
  };
  await page.route("**/*", handler);
  return Object.assign(state, {
    attach: (other: Page) => other.route("**/*", handler),
  });
}
