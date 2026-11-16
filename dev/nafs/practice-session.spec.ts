import { test, expect } from "@playwright/test";
import {
  PracticeSession,
  parsePracticeDraft,
  type PracticeDraft,
  type PracticeTransport,
} from "../../src/components/nafs-practice/practiceSession";
import {
  practiceDraftKey,
  practiceEntryKey,
  openPracticeRun,
  practiceBackups,
  writePracticeRecovery,
  clearCompletedPracticeRecovery,
} from "../../src/components/nafs-practice/practiceRecovery";
import type {
  PracticeInProgressSession,
  PracticeSessionView,
  PracticeOwner,
} from "../../src/types/nafs-practice.contract";

const initial = (): PracticeInProgressSession => ({
  id: "run-1",
  courseId: "course",
  collectionId: "collection",
  contentVersion: 1,
  runNumber: 1,
  state: "in_progress",
  revision: 0,
  startedAt: "2026-11-13T00:00:00Z",
  lastSavedAt: null,
  questionCount: 2,
  questions: [1, 2].map((i) => ({
    id: `q${i}`,
    displayOrder: i,
    stem: `Question ${i}`,
    emphasisTerms: [],
    accessibleVisualText: null,
    figure: null,
    passageId: null,
    options: ["A", "B", "C", "D"].map((label) => ({
      id: label,
      label,
      text: label,
      image: null,
      emphasisTerms: [],
    })) as PracticeInProgressSession["questions"][number]["options"],
  })),
  passages: [],
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
});
const err = (code: string) => ({ response: { status: 409, data: { code } } });
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((r) => (resolve = r));
  return { promise, resolve };
}
function fixture() {
  const server = initial();
  let completed: PracticeSessionView | undefined;
  let draft: PracticeDraft | null = null;
  let fail = "";
  let failRead = false;
  const calls: { kind: string; q?: string; request: object }[] = [];
  const receipts = new Map<string, { body: string; result: unknown }>();
  const history: string[] = [];
  const events: string[] = [];
  const transport: PracticeTransport = {
    read: async () => {
      if (failRead) throw Error("offline read");
      return { session: structuredClone(completed || server) };
    },
    save: async (q, request) =>
      mutate("save", q, request) as Awaited<
        ReturnType<PracticeTransport["save"]>
      >,
    check: async (q, request) =>
      mutate("check", q, request) as Awaited<
        ReturnType<PracticeTransport["check"]>
      >,
    complete: async (request) =>
      mutate("complete", "", request) as Awaited<
        ReturnType<PracticeTransport["complete"]>
      >,
  };
  function mutate(
    kind: string,
    q: string,
    request: { requestId: string; expectedRevision: number; optionId?: string },
  ) {
    calls.push({ kind, q, request: structuredClone(request) });
    const body = JSON.stringify([kind, q, request]);
    const old = receipts.get(request.requestId);
    if (old) {
      if (old.body !== body) throw err("NAFS_PRACTICE_REQUEST_CONFLICT");
      return structuredClone(old.result);
    }
    if (request.expectedRevision !== server.revision)
      throw err("NAFS_PRACTICE_REVISION_CONFLICT");
    server.revision++;
    let result: unknown;
    if (kind === "complete") {
      completed = {
        id: server.id,
        courseId: server.courseId,
        collectionId: server.collectionId,
        contentVersion: 1,
        runNumber: 1,
        revision: server.revision,
        state: "completed",
        questionCount: 2,
        checkedCount: 2,
        earnedMarks: server.latestChecks.filter((c) => c.isCorrect).length,
        totalMarks: 2,
        completedAt: "2026-11-13T01:00:00Z",
      };
      result = { session: completed };
    } else {
      const selection = { questionId: q, optionId: request.optionId! };
      server.selections = [
        ...server.selections.filter((s) => s.questionId !== q),
        selection,
      ];
      if (kind === "check") {
        const check = {
          ...selection,
          responseId: `event-${server.revision}`,
          isCorrect: request.optionId === "B",
          sequence: history.filter((id) => id === q).length + 1,
          checkedAt: "2026-11-13T01:00:00Z",
        };
        history.push(q);
        server.latestChecks = [
          ...server.latestChecks.filter((c) => c.questionId !== q),
          check,
        ];
        result = {
          checked: {
            sessionId: server.id,
            revision: server.revision,
            selection,
            check,
            checkedCount: server.latestChecks.length,
          },
        };
      } else
        result = {
          saved: {
            sessionId: server.id,
            revision: server.revision,
            selection,
            savedAt: "2026-11-13T01:00:00Z",
            checkedCount: server.latestChecks.length,
          },
        };
    }
    receipts.set(request.requestId, { body, result: structuredClone(result) });
    if (fail === kind) {
      fail = "";
      throw Error("lost response");
    }
    return structuredClone(result);
  }
  function create(restored?: unknown, start = structuredClone(server)) {
    return new PracticeSession(
      start,
      transport,
      (s) => {
        if (s.feedbackEvent) events.push(s.feedbackEvent);
      },
      (d) => {
        draft = structuredClone(d);
      },
      restored,
    );
  }
  const engine = create();
  return {
    server,
    transport,
    engine,
    calls,
    history,
    events,
    receipts,
    create,
    get draft() {
      return draft;
    },
    fail(kind: string) {
      fail = kind;
    },
    failRead(value: boolean) {
      failRead = value;
    },
  };
}
async function answer(f: ReturnType<typeof fixture>, q: string, o: string) {
  f.engine.select(q, o);
  await f.engine.flush();
  await f.engine.check(q);
}

test("rapid selections coalesce while one save is in flight; checks wait for all saves", async () => {
  const f = fixture();
  const gate = deferred<void>();
  const original = f.transport.save;
  f.transport.save = async (q, r) => {
    await gate.promise;
    return original(q, r);
  };
  f.engine.select("q1", "A");
  f.engine.select("q1", "B");
  f.engine.select("q1", "C");
  const checking = f.engine.check("q1");
  expect(f.calls).toHaveLength(0);
  gate.resolve();
  await checking;
  expect(f.calls.map((c) => c.kind)).toEqual(["save", "save", "check"]);
  expect(f.server.selections[0].optionId).toBe("C");
  expect(f.history).toEqual(["q1"]);
});
test("finish uses latest checks, no client answers or scores, and cannot double submit", async () => {
  const f = fixture();
  await answer(f, "q1", "A");
  await f.engine.check("q1");
  await answer(f, "q1", "B");
  await answer(f, "q2", "A");
  expect(f.engine.canFinish()).toBe(true);
  await Promise.all([f.engine.finish(), f.engine.finish()]);
  expect(f.calls.filter((c) => c.kind === "complete")).toHaveLength(1);
  expect(Object.keys(f.calls.at(-1)!.request).sort()).toEqual([
    "expectedRevision",
    "requestId",
  ]);
  expect(f.engine.state.session).toMatchObject({
    state: "completed",
    earnedMarks: 1,
    totalMarks: 2,
  });
  expect(f.history).toHaveLength(4);
  expect(f.draft).toBeNull();
  const before = f.calls.length;
  f.engine.select("q1", "D");
  await f.engine.check("q1");
  expect(f.calls).toHaveLength(before);
});
test("saving alone never checks; changing back to the checked answer requires a new check", async () => {
  const f = fixture();
  await answer(f, "q1", "B");
  await answer(f, "q2", "B");
  f.engine.select("q1", "A");
  await f.engine.flush();
  f.engine.select("q1", "B");
  await f.engine.flush();
  expect(f.engine.canFinish()).toBe(false);
  expect(f.engine.state.needsCheck.has("q1")).toBe(true);
  expect(f.history).toHaveLength(2);
  await f.engine.check("q1");
  expect(f.engine.canFinish()).toBe(true);
});
for (const kind of ["save", "check"] as const) {
  test(`lost ${kind} reply is read/replayed/read with the same payload and no duplicate event`, async () => {
    const f = fixture();
    if (kind === "check") {
      f.engine.select("q1", "B");
      await f.engine.flush();
    }
    f.fail(kind);
    if (kind === "save") {
      f.engine.select("q1", "B");
      await f.engine.flush();
    } else await f.engine.check("q1");
    expect(f.engine.state.status).toBe("uncertain");
    const original = f.calls.at(-1)!;
    const restored = f.create(f.draft);
    f.engine.dispose();
    await restored.reconcile();
    expect(f.calls.at(-1)).toEqual(original);
    expect(restored.state.status).toBe("saved");
    expect(restored.state.feedbackEvent).toBeNull();
    expect(f.history).toHaveLength(kind === "check" ? 1 : 0);
  });
}
test("lost finish reply restores server summary without submitting or starting again", async () => {
  const f = fixture();
  await answer(f, "q1", "B");
  await answer(f, "q2", "B");
  f.fail("complete");
  await f.engine.finish();
  expect(f.engine.state.status).toBe("uncertain");
  await f.engine.reconcile();
  expect(f.engine.state.session.state).toBe("completed");
  expect(f.calls.filter((c) => c.kind === "complete")).toHaveLength(1);
  expect(f.draft).toBeNull();
});
test("failed reconciliation stays frozen and can be retried", async () => {
  const f = fixture();
  f.fail("save");
  f.engine.select("q1", "B");
  await f.engine.flush();
  f.failRead(true);
  await f.engine.reconcile();
  expect(f.engine.state.status).toBe("uncertain");
  const count = f.calls.length;
  f.engine.select("q1", "A");
  expect(f.calls).toHaveLength(count);
  f.failRead(false);
  await f.engine.reconcile();
  expect(f.engine.state.status).toBe("saved");
});
test("offline before a save commits replays once after the read confirms the old revision", async () => {
  const f = fixture();
  const original = f.transport.save;
  let offline = true;
  f.transport.save = async (q, request) => {
    if (offline) throw Error("offline");
    return original(q, request);
  };
  f.engine.select("q1", "B");
  await f.engine.flush();
  expect(f.server.revision).toBe(0);
  const request = f.draft!.pending!.request;
  offline = false;
  await f.engine.reconcile();
  expect(f.server.revision).toBe(1);
  expect(f.calls[0].request).toEqual(request);
  expect(f.engine.state.status).toBe("saved");
});
for (const local of [true, false]) {
  test(`revision conflict requires explicit ${local ? "keep local" : "use server"} decision`, async () => {
    const f = fixture();
    f.server.revision = 3;
    f.server.selections = [{ questionId: "q1", optionId: "C" }];
    f.engine.select("q1", "B");
    await f.engine.flush();
    expect(f.engine.state.status).toBe("conflict");
    expect(f.server.selections[0].optionId).toBe("C");
    f.engine.resolve(local);
    await f.engine.flush();
    expect(f.engine.state.selections.q1).toBe(local ? "B" : "C");
    expect(f.server.selections[0].optionId).toBe(local ? "B" : "C");
    expect(f.engine.state.status).toBe("saved");
  });
}
test("old receipt replay never overwrites a newer tab revision; newer local choices remain reviewable", async () => {
  const f = fixture();
  f.fail("save");
  f.engine.select("q1", "A");
  await f.engine.flush();
  const draft = structuredClone(f.draft)!;
  draft.choices.q1 = "B";
  f.server.revision += 2;
  f.server.selections = [{ questionId: "q1", optionId: "C" }];
  const restored = f.create(draft);
  await restored.reconcile();
  expect(restored.state.status).toBe("conflict");
  expect(restored.state.session.revision).toBe(3);
  expect(restored.state.selections.q1).toBe("B");
  expect(f.server.selections[0].optionId).toBe("C");
  restored.resolve(false);
  expect(restored.state.selections.q1).toBe("C");
});
test("recovered unchecked drafts need explicit approval; invalid question/option drafts are rejected", async () => {
  const f = fixture();
  const draft = {
    schema: 1,
    revision: 0,
    choices: { q1: "B" },
    needsCheck: ["q1"],
  };
  const restored = f.create(draft);
  expect(restored.state.status).toBe("recovery");
  expect(f.calls).toHaveLength(0);
  restored.resolve(true);
  await restored.flush();
  expect(f.server.selections[0].optionId).toBe("B");
  expect(f.history).toHaveLength(0);
  expect(
    parsePracticeDraft({ ...draft, choices: { foreign: "B" } }, initial()),
  ).toBeUndefined();
  expect(
    parsePracticeDraft(
      {
        ...draft,
        pending: {
          kind: "complete",
          request: { requestId: "bad id", expectedRevision: 0 },
        },
      },
      initial(),
    ),
  ).toBeUndefined();
});
test("storage failures block mutation dispatch instead of losing request identity", async () => {
  const f = fixture();
  const engine = new PracticeSession(
    initial(),
    f.transport,
    () => {},
    () => false,
  );
  engine.select("q1", "B");
  await engine.flush();
  expect(engine.state.status).toBe("uncertain");
  expect(f.calls).toHaveLength(0);
});
test("dispose ignores late results and retains pending recovery without cross-session updates", async () => {
  const f = fixture();
  const gate = deferred<void>();
  const original = f.transport.save;
  f.transport.save = async (q, r) => {
    await gate.promise;
    return original(q, r);
  };
  f.engine.select("q1", "B");
  const draft = structuredClone(f.draft);
  f.engine.dispose();
  gate.resolve();
  await f.engine.flush();
  expect(f.engine.state.session.revision).toBe(0);
  expect(f.draft).toEqual(draft);
  expect(f.draft?.pending?.kind).toBe("save");
});
test("draft keys isolate account, role, region, collection, version and run; draft data has no content/media", async () => {
  const owner: PracticeOwner = {
    id: "user",
    username: "student",
    role: "student",
    region: "ROW",
  };
  const s = initial();
  const keys = [
    practiceDraftKey(owner, s),
    practiceDraftKey({ ...owner, region: "SAUDI" }, s),
    practiceDraftKey({ ...owner, id: "other" }, s),
    practiceDraftKey(owner, { ...s, contentVersion: 2 }),
    practiceDraftKey(owner, { ...s, id: "run-2" }),
    practiceDraftKey(owner, { ...s, collectionId: "other" }),
  ];
  expect(new Set(keys).size).toBe(6);
  expect(keys.every((k) => k.startsWith("nafs:practice:draft:"))).toBe(true);
  const f = fixture();
  f.engine.select("q1", "B");
  await f.engine.flush();
  expect(Object.keys(f.draft!).sort()).toEqual([
    "choices",
    "needsCheck",
    "pending",
    "revision",
    "schema",
  ]);
  expect(JSON.stringify(f.draft)).not.toMatch(
    /Question|image|url|isCorrect|passages/,
  );
});
test("persistent backup parsing ignores corruption and completion clears only the matching run", async () => {
  const primary = new Map<string, string>(),
    persistent = new Map<string, string>();
  const storage = (data: Map<string, string>) => ({
    getItem: (key: string) => data.get(key) || null,
    setItem: (key: string, value: string) => data.set(key, value),
    removeItem: (key: string) => data.delete(key),
    key: (i: number) => [...data.keys()][i] || null,
    get length() {
      return data.size;
    },
  });
  Object.assign(globalThis, {
    sessionStorage: storage(primary),
    localStorage: storage(persistent),
  });
  const owner: PracticeOwner = {
    id: "user",
    username: "student",
    role: "student",
    region: "ROW",
  };
  const key = practiceDraftKey(owner, initial()),
    other = practiceDraftKey(owner, { ...initial(), id: "other-run" });
  persistent.set(`${key}:backup:corrupt`, "broken JSON");
  const draft: PracticeDraft = {
    schema: 1,
    revision: 0,
    choices: { q1: "B" },
    needsCheck: ["q1"],
  };
  expect(writePracticeRecovery(key, draft)).toBe(true);
  expect(writePracticeRecovery(other, draft)).toBe(true);
  expect(practiceBackups(key)).toHaveLength(1);
  clearCompletedPracticeRecovery(key);
  expect(
    [...persistent.keys()].filter((k) => k.startsWith(`${key}:backup:`)),
  ).toHaveLength(0);
  expect(practiceBackups(other)).toHaveLength(1);
  expect(primary.has(other)).toBe(true);
});
test("persistent storage failure prevents a new run and retains its original in-tab receipt for retry", async () => {
  const data = new Map<string, string>();
  let blocked = true;
  let sends = 0;
  Object.assign(globalThis, {
    sessionStorage: {
      getItem: (k: string) => data.get(k) || null,
      setItem: (k: string, v: string) => data.set(k, v),
      removeItem: (k: string) => data.delete(k),
    },
    localStorage: {
      setItem: () => {
        if (blocked) throw Error("quota");
      },
      removeItem() {},
    },
  });
  const owner: PracticeOwner = {
    id: "user",
    username: "student",
    role: "student",
    region: "ROW",
  };
  const send = async () => {
    sends++;
    return { session: initial() };
  };
  await expect(
    openPracticeRun(owner, "start", "target", undefined, async () => {}, send),
  ).rejects.toThrow("storage");
  expect(sends).toBe(0);
  expect(data.has(practiceEntryKey(owner, "start", "target"))).toBe(true);
  blocked = false;
  await openPracticeRun(
    owner,
    "start",
    "target",
    undefined,
    async () => {},
    send,
  );
  expect(sends).toBe(1);
});
test("lost start and repeat replies reuse their persisted request and read before replay", async () => {
  const data = new Map<string, string>();
  const persistent = new Map<string, string>();
  Object.assign(globalThis, {
    sessionStorage: {
      getItem: (k: string) => data.get(k) || null,
      setItem: (k: string, v: string) => data.set(k, v),
      removeItem: (k: string) => data.delete(k),
    },
    localStorage: {
      getItem: (k: string) => persistent.get(k) || null,
      setItem: (k: string, v: string) => persistent.set(k, v),
      removeItem: (k: string) => persistent.delete(k),
      key: (i: number) => [...persistent.keys()][i] || null,
      get length() {
        return persistent.size;
      },
    },
  });
  const owner: PracticeOwner = {
    id: "user",
    username: "student",
    role: "student",
    region: "ROW",
  };
  for (const kind of ["start", "repeat"] as const) {
    const sent: object[] = [];
    let reads = 0;
    let first = true;
    const send = async (request: object) => {
      sent.push(request);
      if (first) {
        first = false;
        throw Error("lost reply");
      }
      return { session: initial() };
    };
    await expect(
      openPracticeRun(
        owner,
        kind,
        "target",
        kind === "repeat" ? 7 : undefined,
        async () => {
          reads++;
        },
        send,
      ),
    ).rejects.toThrow();
    expect(data.has(practiceEntryKey(owner, kind, "target"))).toBe(true);
    await openPracticeRun(
      owner,
      kind,
      "target",
      kind === "repeat" ? 7 : undefined,
      async () => {
        reads++;
      },
      send,
    );
    expect(sent[1]).toEqual(sent[0]);
    expect(reads).toBe(1);
    expect(data.has(practiceEntryKey(owner, kind, "target"))).toBe(false);
  }
});
