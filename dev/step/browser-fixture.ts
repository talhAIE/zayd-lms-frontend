import type { Page } from "@playwright/test";
import type {
  StepAttemptView,
  StepInProgressAttempt,
  StepSectionKind,
} from "../../src/types/step.contract";
import { attempt, user } from "./fixture";
// Entirely synthetic API/media. No production keys, accounts, content or writes.
export async function mock(page: Page) {
  const state = {
    discovery: 200,
    deny: false,
    empty: false,
    audioFail: false,
    expired: false,
    submitted: false,
    failSaves: 0,
    lostSave: 0,
    failReads: false,
    dropSubmit: false,
    lostSubmit: false,
    failReadAfterSubmit: false,
    lostStart: false,
    conflictOnce: false,
    saveDelayMs: 0,
    requests: [] as {
      method: string;
      path: string;
      body: any;
      auth?: string;
    }[],
    attempts: new Map<string, StepAttemptView>(),
    receipts: new Map<string, { body: string; response: unknown }>(),
    created: 0,
  };
  await page.addInitScript((u) => {
    if (!localStorage.getItem("AiTutorUser")) {
      localStorage.setItem("AiTutorUser", JSON.stringify(u));
      localStorage.setItem("accessToken", "synthetic");
      localStorage.setItem("refreshToken", "synthetic-refresh");
    }
  }, user);
  const course = () => ({
    id: "step",
    title: "STEP",
    sectionCount: 3,
    topicCount: 3,
    completedTopicCount: [...state.attempts.values()].filter(
      (a) => a.state === "submitted",
    ).length,
  });
  const sections = () =>
    ["reading", "grammar", "listening"].map((kind, i) => ({
      id: kind,
      courseId: "step",
      kind,
      title: kind[0].toUpperCase() + kind.slice(1),
      displayOrder: [3, 1, 2][i],
      topicCount: 1,
      completedTopicCount:
        state.attempts.get(kind)?.state === "submitted" ? 1 : 0,
    }));
  const overview = (kind: StepSectionKind) => {
    const a = state.attempts.get(kind);
    return {
      id: kind,
      sectionId: kind,
      courseId: "step",
      kind,
      title: `Synthetic ${kind} activity`,
      displayOrder: 1,
      questionCount: kind === "grammar" ? 60 : 4,
      totalMarks: kind === "grammar" ? 60 : 4,
      state: a?.state || "not_started",
      attemptId: a ? kind : null,
      result: a?.state === "submitted" ? a : null,
      instructions: ["Choose one answer."],
      maxAttempts: 1,
      timerSeconds: null,
      requiresAllAnswers: true,
      feedbackPolicy: "final_total_only",
    };
  };
  const get = (kind: StepSectionKind) => {
    if (!state.attempts.has(kind)) {
      const a = attempt(kind);
      a.selections = [{ questionId: "q0", optionId: "q0o0" }];
      state.attempts.set(kind, a);
    }
    return state.attempts.get(kind)!;
  };
  await page.route("**/*", async (route) => {
    const req = route.request(),
      url = new URL(req.url());
    if (url.hostname.endsWith(".blob.core.windows.net")) {
      if (state.audioFail) return route.abort();
      const b = Buffer.alloc(160044);
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
    const p = url.pathname.slice(7),
      method = req.method(),
      body = req.postData() ? req.postDataJSON() : null;
    state.requests.push({
      method,
      path: p,
      body,
      auth: req.headers().authorization,
    });
    const json = (data: unknown, status = 200) =>
      route.fulfill({ status, json: { status: true, data } });
    const error = (code: string, status = 409) =>
      route.fulfill({
        status,
        json: { code, statusCode: status, message: code },
      });
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
    if (state.deny) return error("STEP_NOT_FOUND", 403);
    if (p === "/step/courses")
      return state.discovery === 200
        ? json({ courses: state.empty ? [] : [course()] })
        : error(
            state.discovery === 404 ? "STEP_DISABLED" : "STEP_UNAVAILABLE",
            state.discovery,
          );
    if (p === "/step/courses/step")
      return json({ course: course(), sections: sections() });
    if (p.startsWith("/step/sections/")) {
      const kind = p.split("/").pop() as StepSectionKind;
      return json({
        section: sections().find((s) => s.id === kind),
        topics: [overview(kind)],
      });
    }
    if (p.startsWith("/step/topics/")) {
      const kind = p.split("/")[3] as StepSectionKind;
      if (method === "POST") {
        if (!state.attempts.has(kind)) {
          state.attempts.set(kind, attempt(kind));
          state.created++;
        }
        if (state.lostStart) {
          state.lostStart = false;
          return route.abort();
        }
        return json(state.attempts.get(kind));
      }
      return json(overview(kind));
    }
    if (p.endsWith("/access"))
      return json({
        url: "https://synthetic.blob.core.windows.net/step-private-content/step/tone.wav",
        expiresAt: new Date(
          Date.now() + (state.expired ? -60000 : 240000),
        ).toISOString(),
      });
    if (p.startsWith("/step/attempts/")) {
      const kind = p.split("/")[3] as StepSectionKind,
        a = get(kind);
      if (method === "GET") {
        if (state.failReads) return error("STEP_UNAVAILABLE", 503);
        if (state.submitted)
          return json({
            attemptId: "reading",
            topicId: "reading",
            state: "submitted",
            earnedMarks: 3,
            totalMarks: 4,
            completedAt: "2026-11-10T00:00:00Z",
          });
        return json(a);
      }
      if (method === "PUT") {
        if (state.saveDelayMs)
          await new Promise((r) => setTimeout(r, state.saveDelayMs));
        if (state.failSaves-- > 0) return error("STEP_UNAVAILABLE", 503);
        const receipt = state.receipts.get(body.requestId),
          hash = JSON.stringify([p, body]);
        if (receipt)
          return receipt.body === hash
            ? json(receipt.response)
            : error("STEP_REQUEST_CONFLICT");
        if (a.state !== "in_progress") return error("STEP_SUBMITTED");
        if (state.conflictOnce) {
          state.conflictOnce = false;
          a.revision++;
          a.selections = [{ questionId: "q1", optionId: "q1o1" }];
          return error("STEP_REVISION_CONFLICT");
        }
        if (a.revision !== body.expectedRevision)
          return error("STEP_REVISION_CONFLICT");
        const questionId = p.split("/").pop()!;
        if (
          !a.questions.some(
            (q) =>
              q.id === questionId &&
              q.options.some((o) => o.id === body.optionId),
          )
        )
          return error("STEP_INVALID_ANSWER");
        a.selections = a.selections
          .filter((s) => s.questionId !== questionId)
          .concat({ questionId, optionId: body.optionId });
        a.revision++;
        const response = {
          attemptId: kind,
          state: "in_progress",
          revision: a.revision,
          selection: { questionId, optionId: body.optionId },
          savedAt: "2026-11-10T00:01:00Z",
        };
        state.receipts.set(body.requestId, { body: hash, response });
        if (state.lostSave-- > 0) return route.abort();
        return json(response);
      }
      if (p.endsWith("/submit")) {
        if (state.failReadAfterSubmit) state.failReads = true;
        if (state.dropSubmit) return route.abort();
        if (a.state === "submitted") return json(a);
        if (a.revision !== body.expectedRevision)
          return error("STEP_REVISION_CONFLICT");
        if (
          body.answers.length !== a.questions.length ||
          body.answers.some(
            (s: any) =>
              !a.selections.some(
                (v) =>
                  v.questionId === s.questionId && v.optionId === s.optionId,
              ),
          )
        )
          return error("STEP_INCOMPLETE");
        const result = {
          attemptId: kind,
          topicId: kind,
          state: "submitted" as const,
          earnedMarks: 3,
          totalMarks: a.questions.length,
          completedAt: "2026-11-10T00:02:00Z",
        };
        state.attempts.set(kind, result);
        if (state.lostSubmit) return route.abort();
        return json(result);
      }
    }
    return error("STEP_NOT_FOUND", 404);
  });
  return state;
}
