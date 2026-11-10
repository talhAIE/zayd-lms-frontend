import { test, expect } from "@playwright/test";
import {
  StepAttemptSession,
  type StepJournal,
  type StepAttemptTransport,
} from "../../src/components/step/attemptSession";
import type {
  StepAttemptView,
  StepInProgressAttempt,
  StepSubmitRequest,
} from "../../src/types/step.contract";
import { attempt } from "./fixture";
const clone = <T>(a: T): T => structuredClone(a);
const conflict = (code = "STEP_REVISION_CONFLICT") => ({
  response: { status: 409, data: { code } },
});
function harness(journal?: StepJournal, initial = attempt("reading")) {
  let server: StepAttemptView = clone(initial),
    stored: StepJournal | null = null;
  const state = {
    failSave: 0,
    lostSave: 0,
    failRead: false,
    lostSubmit: false,
    dropSubmit: false,
    saveGate: undefined as undefined | Promise<void>,
    saves: [] as { q: string; r: any }[],
    submits: [] as StepSubmitRequest[],
    active: 0,
    maxActive: 0,
  };
  const receipts = new Map<string, { body: string; response: any }>();
  const transport: StepAttemptTransport = {
    read: async () => {
      if (state.failRead) throw Error("offline");
      return clone(server);
    },
    save: async (q, r) => {
      state.active++;
      state.maxActive = Math.max(state.maxActive, state.active);
      state.saves.push({ q, r: clone(r) });
      try {
        if (state.saveGate) await state.saveGate;
        if (state.failSave-- > 0) throw Error("offline");
        const receipt = receipts.get(r.requestId),
          body = JSON.stringify([q, r]);
        if (receipt) {
          if (receipt.body !== body) throw conflict("STEP_REQUEST_CONFLICT");
          return clone(receipt.response);
        }
        if (server.state !== "in_progress") throw conflict("STEP_SUBMITTED");
        if (r.expectedRevision !== server.revision) throw conflict();
        server.selections = server.selections
          .filter((s) => s.questionId !== q)
          .concat({ questionId: q, optionId: r.optionId });
        server.revision++;
        const response = {
          attemptId: server.id,
          state: "in_progress" as const,
          revision: server.revision,
          selection: { questionId: q, optionId: r.optionId },
          savedAt: "2026-11-10T00:01:00Z",
        };
        receipts.set(r.requestId, { body, response });
        if (state.lostSave-- > 0) throw Error("lost acknowledgement");
        return clone(response);
      } finally {
        state.active--;
      }
    },
    submit: async (r) => {
      state.submits.push(clone(r));
      if (state.dropSubmit) throw Error("not sent");
      if (server.state === "submitted") return clone(server);
      if (r.expectedRevision !== server.revision) throw conflict();
      if (
        r.answers.length !== server.questions.length ||
        r.answers.some(
          (s) =>
            !server.selections.some(
              (a) => a.questionId === s.questionId && a.optionId === s.optionId,
            ),
        )
      )
        throw conflict("STEP_INCOMPLETE");
      server = {
        attemptId: server.id,
        topicId: server.topicId,
        state: "submitted",
        earnedMarks: 2,
        totalMarks: 4,
        completedAt: "2026-11-10T00:02:00Z",
      };
      if (state.lostSubmit) throw Error("lost result");
      return clone(server);
    },
  };
  const session = new StepAttemptSession(
    initial,
    transport,
    () => {},
    (j) => {
      stored = clone(j);
    },
    journal,
  );
  return {
    session,
    state,
    transport,
    get journal() {
      return stored;
    },
    get server() {
      return server;
    },
    set server(a: StepAttemptView) {
      server = a;
    },
  };
}
async function answerAll(h: ReturnType<typeof harness>) {
  for (let i = 0; i < 4; i++) h.session.select(`q${i}`, `q${i}o0`);
  await h.session.drain();
}
test("rapid changes coalesce behind a single serial writer and submission waits for saves", async () => {
  const h = harness();
  let release!: () => void;
  h.state.saveGate = new Promise((r) => (release = r));
  h.session.select("q0", "q0o0");
  h.session.select("q0", "q0o1");
  h.session.select("q0", "q0o2");
  h.session.select("q1", "q1o0");
  h.session.select("q2", "q2o0");
  h.session.select("q3", "q3o0");
  expect(h.session.canFinish).toBe(false);
  const finish = h.session.finish();
  h.session.select("q0", "q0o3");
  release();
  await finish;
  expect(h.state.maxActive).toBe(1);
  expect(
    h.state.saves.filter((s) => s.q === "q0").map((s) => s.r.optionId),
  ).toEqual(["q0o0", "q0o2"]);
  expect(h.state.submits[0].answers[0].optionId).toBe("q0o2");
  expect(h.session.state.attempt.state).toBe("submitted");
  expect(h.journal).toBeNull();
});
test("lost save response retains exact request for retry while newer intent survives", async () => {
  const h = harness();
  h.state.lostSave = 1;
  h.session.select("q0", "q0o0");
  await h.session.drain();
  expect(h.session.state.status).toBe("error");
  const pending = clone(h.journal!.pending);
  h.session.select("q0", "q0o1");
  await h.session.retry();
  expect(h.state.saves[1].r).toEqual(pending!.request);
  expect(h.session.state.selections.q0).toBe("q0o1");
  expect(h.session.state.status).toBe("saved");
  expect((h.server as StepInProgressAttempt).revision).toBe(2);
});
test("refresh restores journal, exact pending ID, content version and question position", async () => {
  const h = harness();
  h.state.failSave = 1;
  h.session.select("q0", "q0o1");
  await h.session.drain();
  h.session.navigate(2);
  const journal = clone(h.journal!);
  h.session.dispose();
  const resumed = new StepAttemptSession(
    clone(h.server as StepInProgressAttempt),
    h.transport,
    () => {},
    () => {},
    journal,
  );
  expect(resumed.state.index).toBe(2);
  expect(resumed.state.selections.q0).toBe("q0o1");
  await resumed.retry();
  expect(h.state.saves[1].r.requestId).toBe(journal.pending!.request.requestId);
  expect(resumed.state.status).toBe("saved");
});
test("foreign or different-version journal cannot overlay server answers", () => {
  for (const patch of [{ attemptId: "foreign" }, { contentVersion: 9 }]) {
    const h = harness({
      format: 1,
      attemptId: "reading",
      contentVersion: 1,
      index: 3,
      dirty: { q0: "q0o1" },
      ...patch,
    });
    expect(h.session.state.index).toBe(0);
    expect(h.session.state.selections).toEqual({});
  }
});
test("revision conflict re-reads and requires explicit keep-local choice", async () => {
  const h = harness();
  (h.server as StepInProgressAttempt).revision = 1;
  (h.server as StepInProgressAttempt).selections = [
    { questionId: "q1", optionId: "q1o1" },
  ];
  h.session.select("q0", "q0o2");
  await h.session.drain();
  expect(h.session.state.status).toBe("conflict");
  expect(h.session.state.locked).toBe(true);
  h.session.select("q2", "q2o0");
  expect(h.session.state.selections.q2).toBeUndefined();
  await h.session.resolveConflict(true);
  expect(h.session.state.status).toBe("saved");
  expect(h.session.state.selections).toEqual({ q0: "q0o2", q1: "q1o1" });
  expect(h.state.saves[1].r.expectedRevision).toBe(1);
});
test("use saved answers drops recovered intent only after a successful fresh read", async () => {
  const h = harness({
    format: 1,
    attemptId: "reading",
    contentVersion: 1,
    index: 0,
    dirty: { q0: "q0o3" },
  });
  h.state.failRead = true;
  await h.session.resolveConflict(false);
  expect(h.session.state.status).toBe("error");
  expect(h.journal!.dirty.q0).toBe("q0o3");
  h.state.failRead = false;
  await h.session.retry();
  await h.session.resolveConflict(false);
  expect(h.session.state.selections).toEqual({});
  expect(h.state.saves).toHaveLength(0);
});
test("incomplete or failed saves cannot submit; invalid IDs are ignored", async () => {
  const h = harness();
  h.session.select("q0", "foreign");
  h.session.select("foreign", "q0o0");
  await h.session.finish();
  expect(h.state.submits).toHaveLength(0);
  h.state.failSave = 1;
  await answerAll(h);
  await h.session.finish();
  expect(h.state.submits).toHaveLength(0);
  expect(h.session.canFinish).toBe(false);
});
test("lost submit result is recovered by reading same attempt with no second submit", async () => {
  const h = harness();
  await answerAll(h);
  h.state.lostSubmit = true;
  await h.session.finish();
  expect(h.session.state.attempt.state).toBe("submitted");
  expect(h.state.submits).toHaveLength(1);
  expect(h.journal).toBeNull();
});
test("uncertain submit locks editing, survives refresh and replays exact body after checking", async () => {
  const h = harness();
  await answerAll(h);
  h.state.dropSubmit = true;
  h.state.failRead = true;
  await h.session.finish();
  expect(h.session.state.status).toBe("uncertain");
  const journal = clone(h.journal!);
  h.session.select("q0", "q0o3");
  expect(h.session.state.selections.q0).toBe("q0o0");
  h.session.dispose();
  const resumed = new StepAttemptSession(
    clone(h.server as StepInProgressAttempt),
    h.transport,
    () => {},
    () => {},
    journal,
  );
  expect(resumed.state.locked).toBe(true);
  h.state.failRead = false;
  h.state.dropSubmit = false;
  await resumed.checkSubmission();
  expect(resumed.state.attempt.state).toBe("submitted");
  expect(h.state.submits[1]).toEqual(h.state.submits[0]);
});
test("changed revision during uncertain submit never auto-rebases final answers", async () => {
  const h = harness();
  await answerAll(h);
  h.state.dropSubmit = true;
  await h.session.finish();
  expect(h.session.state.status).toBe("uncertain");
  (h.server as StepInProgressAttempt).revision++;
  await h.session.checkSubmission();
  expect(h.session.state.status).toBe("conflict");
  expect(h.state.submits).toHaveLength(1);
  expect(h.journal!.finish).toBeUndefined();
});
test("dispose prevents late writes, notifications and follow-up mutations", async () => {
  const h = harness();
  let release!: () => void;
  h.state.saveGate = new Promise((r) => (release = r));
  h.session.select("q0", "q0o0");
  h.session.select("q1", "q1o0");
  const journal = clone(h.journal);
  h.session.dispose();
  release();
  await h.session.drain();
  expect(h.state.saves).toHaveLength(1);
  expect(h.journal).toEqual(journal);
  await h.session.finish();
  expect(h.state.submits).toHaveLength(0);
});
