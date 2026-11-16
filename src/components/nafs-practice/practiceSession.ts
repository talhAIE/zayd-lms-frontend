import { validPracticeResponse, hasPracticeResponse } from "./practiceAnswers";
import type {
  PracticeSessionView,
  PracticeInProgressSession,
  PracticeSavedSelection,
  PracticeCheckedAnswer,
  PracticeMutationRequest,
  PracticeSaveSelectionRequest,
  PracticeCompletedSession,
} from "@/types/nafs-practice.contract";

export type PracticeStatus =
  | "saved"
  | "saving"
  | "checking"
  | "completing"
  | "uncertain"
  | "conflict"
  | "recovery"
  | "denied";
export type PracticePending =
  | {
      kind: "save" | "check";
      questionId: string;
      request: PracticeSaveSelectionRequest;
    }
  | { kind: "complete"; request: PracticeMutationRequest };
export interface PracticeDraft {
  schema: 1;
  revision: number;
  choices: Record<string, string>;
  needsCheck: string[];
  pending?: PracticePending;
}
export interface PracticeState {
  session: PracticeSessionView;
  selections: Record<string, string>;
  needsCheck: Set<string>;
  status: PracticeStatus;
  message: string;
  feedbackEvent: string | null;
}
export interface PracticeTransport {
  read(): Promise<{ session: PracticeSessionView }>;
  save(
    q: string,
    request: PracticeSaveSelectionRequest,
  ): Promise<{ saved: PracticeSavedSelection }>;
  check(
    q: string,
    request: PracticeSaveSelectionRequest,
  ): Promise<{ checked: PracticeCheckedAnswer }>;
  complete(
    request: PracticeMutationRequest,
  ): Promise<{ session: PracticeCompletedSession }>;
}
const code = (e: unknown) =>
  (e as { response?: { data?: { code?: string } } })?.response?.data?.code;
const choices = (s: PracticeInProgressSession) =>
  Object.fromEntries(s.selections.map((v) => [v.questionId, v.optionId]));
const validChoice = (s: PracticeInProgressSession, q: string, o: string) =>
  s.questions.some((v) => v.id === q && validPracticeResponse(v, o));
const record = (v: unknown): v is Record<string, unknown> =>
  Boolean(v && typeof v === "object" && !Array.isArray(v));
export function parsePracticeDraft(
  value: unknown,
  session: PracticeInProgressSession,
): PracticeDraft | undefined {
  if (
    !record(value) ||
    value.schema !== 1 ||
    !Number.isInteger(value.revision) ||
    Number(value.revision) < 0 ||
    !record(value.choices) ||
    !Array.isArray(value.needsCheck) ||
    value.needsCheck.length > 500 ||
    Object.keys(value.choices).length > 500
  )
    return;
  const safe: Record<string, string> = {};
  for (const [q, o] of Object.entries(value.choices)) {
    if (typeof o !== "string" || !validChoice(session, q, o)) return;
    safe[q] = o;
  }
  if (
    !value.needsCheck.every(
      (q) => typeof q === "string" && session.questions.some((v) => v.id === q),
    )
  )
    return;
  let pending: PracticePending | undefined;
  if (value.pending !== undefined) {
    const p = value.pending;
    if (
      !record(p) ||
      !record(p.request) ||
      typeof p.request.requestId !== "string" ||
      !/^[A-Za-z0-9_-]{1,96}$/.test(p.request.requestId) ||
      !Number.isInteger(p.request.expectedRevision) ||
      Number(p.request.expectedRevision) < 0 ||
      Number(p.request.expectedRevision) > 2147483646
    )
      return;
    const request = {
      requestId: p.request.requestId,
      expectedRevision: Number(p.request.expectedRevision),
    };
    if (p.kind === "complete") pending = { kind: "complete", request };
    else if (
      (p.kind === "save" || p.kind === "check") &&
      typeof p.questionId === "string" &&
      typeof p.request.optionId === "string" &&
      validChoice(session, p.questionId, p.request.optionId)
    )
      pending = {
        kind: p.kind,
        questionId: p.questionId,
        request: { ...request, optionId: p.request.optionId },
      };
    else return;
  }
  return {
    schema: 1,
    revision: Number(value.revision),
    choices: safe,
    needsCheck: value.needsCheck as string[],
    pending,
  };
}

// One serial writer. A receipt is durable before transport; uncertainty always
// reads/replays/reads before any newer mutation can be sent.
export class PracticeSession {
  state: PracticeState;
  private dirty = new Map<string, string>();
  private pending?: PracticePending;
  private running?: Promise<void>;
  private disposed = false;
  private action = false;
  private seen: Set<string>;
  private remote?: PracticeSessionView;
  private storageReady = true;
  constructor(
    initial: PracticeInProgressSession,
    private transport: PracticeTransport,
    private changed: (state: PracticeState) => void,
    private persist: (draft: PracticeDraft | null) => boolean | void,
    draft?: unknown,
  ) {
    this.state = {
      session: initial,
      selections: choices(initial),
      needsCheck: new Set(),
      status: "saved",
      message: "",
      feedbackEvent: null,
    };
    this.seen = new Set(initial.latestChecks.map((c) => c.responseId));
    const restored = parsePracticeDraft(draft, initial);
    if (restored) {
      this.dirty = new Map(Object.entries(restored.choices));
      this.pending = restored.pending;
      this.state.selections = { ...this.state.selections, ...restored.choices };
      this.state.needsCheck = new Set(restored.needsCheck);
      if (this.pending?.kind === "check")
        this.state.needsCheck.add(this.pending.questionId);
      this.state.status = this.pending
        ? "uncertain"
        : this.dirty.size || this.state.needsCheck.size
          ? "recovery"
          : "saved";
      this.state.message = this.pending
        ? "A previous request needs to be reconciled before continuing."
        : this.state.status === "recovery"
          ? "Recovered local choices need your review before saving."
          : "";
      if (!this.pending && this.state.status === "recovery")
        this.remote = initial;
    }
  }
  dispose() {
    this.disposed = true;
  }
  private emit(status = this.state.status, message = "") {
    if (this.disposed) return;
    this.state = {
      ...this.state,
      selections: { ...this.state.selections },
      needsCheck: new Set(this.state.needsCheck),
      status,
      message,
    };
    const draft: PracticeDraft | null =
      this.state.session.state === "completed" ||
      (!this.dirty.size && !this.pending && !this.state.needsCheck.size)
        ? null
        : {
            schema: 1,
            revision: this.state.session.revision,
            choices: Object.fromEntries(this.dirty),
            needsCheck: [...this.state.needsCheck],
            pending: this.pending,
          };
    try {
      this.storageReady = this.persist(draft) !== false;
    } catch {
      this.storageReady = false;
    }
    if (
      !this.storageReady &&
      status !== "denied" &&
      this.state.session.state !== "completed"
    )
      this.state = {
        ...this.state,
        status: "uncertain",
        message:
          "Browser recovery storage is unavailable. Allow storage, then reconcile before continuing.",
      };
    this.changed(this.state);
  }
  private acceptRead(session: PracticeSessionView) {
    if (
      session.id !== this.state.session.id ||
      session.collectionId !== this.state.session.collectionId ||
      session.contentVersion !== this.state.session.contentVersion
    )
      throw new Error("Practice snapshot changed");
    this.state.session = session;
    this.state.feedbackEvent = null;
    if (session.state === "completed") {
      this.pending = undefined;
      this.dirty.clear();
      this.state.selections = {};
      this.state.needsCheck.clear();
    } else {
      this.state.selections = {
        ...choices(session),
        ...Object.fromEntries(this.dirty),
      };
      session.latestChecks.forEach((c) => this.seen.add(c.responseId));
    }
  }
  private failure(error: unknown) {
    const c = code(error);
    if (
      ["NAFS_PRACTICE_NOT_FOUND", "NAFS_PRACTICE_DISABLED"].includes(c || "") ||
      [401, 403, 404].includes(
        (error as { response?: { status?: number } })?.response?.status || 0,
      )
    )
      this.emit(
        "denied",
        "This practice is unavailable or your access has changed.",
      );
    else
      this.emit(
        "uncertain",
        "The request could not be confirmed. Reconcile saved practice before continuing.",
      );
  }
  private editable() {
    return (
      !this.disposed &&
      !this.action &&
      this.state.session.state === "in_progress" &&
      ["saved", "saving"].includes(this.state.status)
    );
  }
  select(q: string, o: string) {
    if (
      !this.editable() ||
      this.state.session.state !== "in_progress" ||
      !validChoice(this.state.session, q, o)
    )
      return;
    this.state.selections[q] = o;
    this.dirty.set(q, o);
    this.state.needsCheck.add(q);
    this.state.feedbackEvent = null;
    this.emit("saving");
    void this.flush();
  }
  clearAnimation() {
    this.state.feedbackEvent = null;
    this.emit(this.state.status, this.state.message);
  }
  async flush(): Promise<void> {
    if (this.running) return this.running;
    this.running = this.drain();
    try {
      await this.running;
    } finally {
      this.running = undefined;
      if (
        !this.disposed &&
        !this.action &&
        this.dirty.size &&
        this.state.status === "saving"
      )
        void this.flush();
    }
  }
  private async drain() {
    while (
      !this.disposed &&
      this.state.session.state === "in_progress" &&
      this.dirty.size &&
      ["saved", "saving", "checking", "completing"].includes(this.state.status)
    ) {
      const [questionId, optionId] = this.dirty.entries().next().value!;
      this.pending = {
        kind: "save",
        questionId,
        request: {
          requestId: crypto.randomUUID(),
          expectedRevision: this.state.session.revision,
          optionId,
        },
      };
      this.emit(this.action ? this.state.status : "saving");
      try {
        await this.send(false);
      } catch (e) {
        await this.failedMutation(e);
        return;
      }
    }
    if (
      !this.disposed &&
      !this.action &&
      ["saving", "saved"].includes(this.state.status)
    )
      this.emit("saved");
  }
  private async send(animate: boolean) {
    if (!this.storageReady) throw new Error("Recovery storage unavailable");
    const p = this.pending;
    if (!p || this.state.session.state !== "in_progress") return;
    const s = this.state.session;
    if (p.kind === "complete") {
      const { session } = await this.transport.complete(p.request);
      if (this.disposed) return;
      if (session.state !== "completed")
        throw new Error("Completion not confirmed");
      this.acceptRead(session);
      this.emit("saved");
      return;
    }
    const result =
      p.kind === "save"
        ? (await this.transport.save(p.questionId, p.request)).saved
        : (await this.transport.check(p.questionId, p.request)).checked;
    if (this.disposed) return;
    if (
      result.sessionId !== s.id ||
      result.selection.questionId !== p.questionId ||
      result.selection.optionId !== p.request.optionId ||
      result.revision !== p.request.expectedRevision + 1
    )
      throw new Error("Invalid practice receipt");
    if (p.kind === "check") {
      const checked = result as PracticeCheckedAnswer;
      if (
        checked.check.questionId !== p.questionId ||
        checked.check.optionId !== p.request.optionId ||
        typeof checked.check.isCorrect !== "boolean"
      )
        throw new Error("Invalid checked response");
      const fresh = !this.seen.has(checked.check.responseId);
      this.seen.add(checked.check.responseId);
      s.latestChecks = [
        ...s.latestChecks.filter((c) => c.questionId !== p.questionId),
        checked.check,
      ];
      if (this.state.selections[p.questionId] === p.request.optionId)
        this.state.needsCheck.delete(p.questionId);
      this.state.feedbackEvent =
        animate && fresh ? checked.check.responseId : null;
    }
    s.revision = result.revision;
    s.checkedCount = result.checkedCount;
    s.selections = [
      ...s.selections.filter((v) => v.questionId !== p.questionId),
      result.selection,
    ];
    if (this.dirty.get(p.questionId) === p.request.optionId)
      this.dirty.delete(p.questionId);
    this.pending = undefined;
    this.emit();
  }
  private async failedMutation(e: unknown) {
    if (this.disposed) return;
    const c = code(e);
    if (
      c === "NAFS_PRACTICE_REVISION_CONFLICT" ||
      c === "NAFS_PRACTICE_REQUEST_CONFLICT" ||
      c === "NAFS_PRACTICE_COMPLETED" ||
      c === "NAFS_PRACTICE_INCOMPLETE"
    ) {
      // Definite rejection; retain intended choices but do not replay a rejected revision.
      if (this.pending?.kind === "check") {
        this.dirty.set(this.pending.questionId, this.pending.request.optionId);
        this.state.needsCheck.add(this.pending.questionId);
      }
      this.pending = undefined;
      try {
        const { session } = await this.transport.read();
        if (this.disposed) return;
        this.remote = session;
        this.acceptRead(session);
        this.emit(
          session.state === "completed" ? "saved" : "conflict",
          "Saved practice changed. Choose whether to keep your local choices or use the server choices.",
        );
      } catch (readError) {
        this.failure(readError);
      }
    } else this.failure(e);
  }
  async check(q: string) {
    if (
      !this.editable() ||
      this.state.session.state !== "in_progress" ||
      !this.state.session.questions.some(
        (v) => v.id === q && hasPracticeResponse(v, this.state.selections[q]),
      )
    )
      return;
    this.action = true;
    this.state.feedbackEvent = null;
    this.emit("checking");
    try {
      await this.flush();
      if (
        this.disposed ||
        this.state.session.state !== "in_progress" ||
        this.pending ||
        this.state.status !== "checking"
      )
        return;
      this.pending = {
        kind: "check",
        questionId: q,
        request: {
          requestId: crypto.randomUUID(),
          expectedRevision: this.state.session.revision,
          optionId: this.state.selections[q],
        },
      };
      this.emit("checking");
      try {
        await this.send(true);
        if (!this.disposed) this.emit("saved");
      } catch (e) {
        await this.failedMutation(e);
      }
    } finally {
      this.action = false;
      if (!this.disposed && this.state.status === "saved") this.emit("saved");
    }
  }
  canFinish() {
    const s = this.state.session;
    return (
      !this.action &&
      !this.pending &&
      !this.dirty.size &&
      this.state.status === "saved" &&
      s.state === "in_progress" &&
      s.questions.every(
        (q) =>
          !this.state.needsCheck.has(q.id) &&
          s.latestChecks.some(
            (c) =>
              c.questionId === q.id &&
              c.optionId === this.state.selections[q.id],
          ),
      )
    );
  }
  async finish() {
    if (!this.canFinish()) return;
    this.action = true;
    this.pending = {
      kind: "complete",
      request: {
        requestId: crypto.randomUUID(),
        expectedRevision: this.state.session.revision,
      },
    };
    this.emit("completing");
    try {
      await this.send(false);
    } catch (e) {
      await this.failedMutation(e);
    } finally {
      this.action = false;
      if (!this.disposed && this.state.status === "saved") this.emit("saved");
    }
  }
  async reconcile() {
    if (
      this.disposed ||
      this.action ||
      !["uncertain", "denied"].includes(this.state.status)
    )
      return;
    this.action = true;
    this.emit("uncertain", "Reconciling saved practice…");
    try {
      const p = this.pending;
      const { session: before } = await this.transport.read();
      if (this.disposed) return;
      if (before.state === "completed") {
        this.acceptRead(before);
        this.emit("saved");
        return;
      }
      // Receipt replays can have an older revision than a newer tab's projection.
      // Use the operation's original revision for replay validation, then read again.
      if (p) {
        const current = this.state.session;
        this.state.session = {
          ...before,
          revision: p.request.expectedRevision,
        };
        try {
          await this.send(false);
        } catch (e) {
          this.state.session = current;
          await this.failedMutation(e);
          return;
        }
        if (this.disposed) return;
        const acceptedRevision = this.state.session.revision;
        const { session: after } = await this.transport.read();
        if (this.disposed) return;
        this.remote = after;
        this.acceptRead(after);
        if (after.state === "completed") {
          this.emit("saved");
          return;
        }
        if (after.revision > acceptedRevision) {
          this.emit(
            "conflict",
            "Another tab changed saved practice. Choose local or server choices.",
          );
          return;
        }
      } else {
        this.remote = before;
        this.acceptRead(before);
      }
      this.emit(
        this.dirty.size ? "conflict" : "saved",
        this.dirty.size
          ? "Review your local choices before saving them against the current session."
          : "Saved practice reconciled.",
      );
    } catch (e) {
      this.failure(e);
    } finally {
      this.action = false;
      if (!this.disposed && this.state.status === "saved") this.emit("saved");
    }
  }
  resolve(useLocal: boolean) {
    if (
      this.disposed ||
      this.action ||
      !["conflict", "recovery"].includes(this.state.status) ||
      this.pending
    )
      return;
    if (!useLocal) {
      this.dirty.clear();
      this.state.needsCheck.clear();
    }
    if (this.remote) this.acceptRead(this.remote);
    this.remote = undefined;
    this.emit(this.dirty.size ? "saving" : "saved");
    if (this.dirty.size) void this.flush();
  }
}
