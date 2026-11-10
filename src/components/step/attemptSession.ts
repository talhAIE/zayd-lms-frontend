import type {
  StepAttemptView,
  StepInProgressAttempt,
  StepResult,
  StepSaveAnswerRequest,
  StepSaveAnswerResponse,
  StepSubmitRequest,
} from "@/types/step.contract";

export type StepSaveState =
  | "saved"
  | "saving"
  | "error"
  | "conflict"
  | "submitting"
  | "uncertain"
  | "checking";
export interface StepJournal {
  format: 1;
  attemptId: string;
  contentVersion: number;
  index: number;
  dirty: Record<string, string>;
  pending?: { questionId: string; request: StepSaveAnswerRequest };
  finish?: StepSubmitRequest;
}
export interface StepAttemptState {
  attempt: StepAttemptView;
  selections: Record<string, string>;
  index: number;
  status: StepSaveState;
  message: string;
  locked: boolean;
}
export interface StepAttemptTransport {
  read(): Promise<StepAttemptView>;
  save(
    questionId: string,
    request: StepSaveAnswerRequest,
  ): Promise<StepSaveAnswerResponse>;
  submit(request: StepSubmitRequest): Promise<StepResult>;
}
const selections = (a: StepInProgressAttempt) =>
  Object.fromEntries(a.selections.map((s) => [s.questionId, s.optionId]));
const code = (e: unknown) =>
  (e as { response?: { data?: { code?: string } } })?.response?.data?.code;
const denied = (e: unknown) =>
  [403, 404].includes(
    (e as { response?: { status?: number } })?.response?.status ?? 0,
  );
const clashes = [
  "STEP_REVISION_CONFLICT",
  "STEP_REQUEST_CONFLICT",
  "STEP_SUBMITTED",
  "STEP_INVALID_ANSWER",
  "STEP_INCOMPLETE",
];

// Independent STEP serial writer. The journal contains intent/receipts only,
// never question content, audio URLs, tokens or private grading information.
export class StepAttemptSession {
  state: StepAttemptState;
  private dirty = new Map<string, string>();
  private saved: Record<string, string>;
  private pending?: StepJournal["pending"];
  private finishRequest?: StepSubmitRequest;
  private running?: Promise<void>;
  private disposed = false;
  private finishing = false;
  private resolving = false;
  private needsRead = false;
  constructor(
    private initial: StepInProgressAttempt,
    private transport: StepAttemptTransport,
    private changed: (state: StepAttemptState) => void,
    private persist: (journal: StepJournal | null) => void,
    journal?: StepJournal,
  ) {
    this.saved = selections(initial);
    this.state = {
      attempt: initial,
      selections: { ...this.saved },
      index: 0,
      status: "saved",
      message: "",
      locked: false,
    };
    if (
      journal?.format !== 1 ||
      journal.attemptId !== initial.id ||
      journal.contentVersion !== initial.contentVersion
    )
      return;
    this.state.index = Number.isInteger(journal.index)
      ? Math.max(0, Math.min(initial.questions.length - 1, journal.index))
      : 0;
    for (const q of initial.questions)
      if (q.options.some((o) => o.id === journal.dirty?.[q.id]))
        this.dirty.set(q.id, journal.dirty[q.id]);
    const pending = journal.pending;
    if (
      pending &&
      this.valid(pending.questionId, pending.request?.optionId) &&
      this.validRequest(pending.request)
    ) {
      this.pending = pending;
      if (!this.dirty.has(pending.questionId))
        this.dirty.set(pending.questionId, pending.request.optionId);
    }
    const finish = journal.finish;
    if (
      finish &&
      this.validRequest(finish) &&
      Array.isArray(finish.answers) &&
      finish.answers.length === initial.questions.length &&
      new Set(finish.answers.map((s) => s.questionId)).size ===
        initial.questions.length &&
      finish.answers.every((s) => this.valid(s.questionId, s.optionId))
    ) {
      this.finishRequest = finish;
      this.state.selections = Object.fromEntries(
        finish.answers.map((s) => [s.questionId, s.optionId]),
      );
      this.state.status = "uncertain";
      this.state.locked = true;
      this.state.message =
        "A submission was interrupted. Check submission before making changes.";
    } else if (this.dirty.size) {
      this.state.selections = {
        ...this.saved,
        ...Object.fromEntries(this.dirty),
      };
      this.state.status = this.pending ? "error" : "conflict";
      this.state.locked = !this.pending;
      this.state.message =
        "Unsaved answers were recovered on this device. Review and recover them before submitting.";
    }
  }
  private validRequest(r: { requestId?: string; expectedRevision?: number }) {
    return (
      typeof r.requestId === "string" &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        r.requestId,
      ) &&
      Number.isInteger(r.expectedRevision) &&
      r.expectedRevision! >= 0
    );
  }
  private valid(qid: string, oid: string) {
    return this.initial.questions.some(
      (q) => q.id === qid && q.options.some((o) => o.id === oid),
    );
  }
  dispose() {
    this.disposed = true;
  }
  publish() {
    this.emit(this.state.status, this.state.message);
  }
  private emit(status: StepSaveState, message = "") {
    if (this.disposed) return;
    this.state = {
      ...this.state,
      status,
      message,
      selections: { ...this.state.selections },
    };
    this.persist(
      this.state.attempt.state === "submitted"
        ? null
        : {
            format: 1,
            attemptId: this.initial.id,
            contentVersion: this.initial.contentVersion,
            index: this.state.index,
            dirty: Object.fromEntries(this.dirty),
            pending: this.pending,
            finish: this.finishRequest,
          },
    );
    this.changed(this.state);
  }
  private result(result: StepResult) {
    this.dirty.clear();
    this.pending = undefined;
    this.finishRequest = undefined;
    this.state = {
      ...this.state,
      attempt: result,
      selections: {},
      locked: true,
    };
    this.emit("saved");
  }
  navigate(index: number) {
    if (this.disposed || this.state.locked || !Number.isInteger(index)) return;
    this.state.index = Math.max(
      0,
      Math.min(this.initial.questions.length - 1, index),
    );
    this.emit(this.state.status, this.state.message);
  }
  select(questionId: string, optionId: string) {
    if (
      this.disposed ||
      this.finishing ||
      this.state.locked ||
      this.state.attempt.state !== "in_progress" ||
      !this.valid(questionId, optionId)
    )
      return;
    this.state.selections[questionId] = optionId;
    this.dirty.set(questionId, optionId);
    if (this.state.status === "error") {
      this.emit("error", this.state.message);
      return;
    }
    this.emit("saving");
    void this.drain();
  }
  drain(): Promise<void> {
    if (this.running) return this.running;
    this.running = this.pump().finally(() => {
      this.running = undefined;
    });
    return this.running;
  }
  private async pump() {
    if (
      this.disposed ||
      this.state.locked ||
      ["error", "conflict"].includes(this.state.status)
    )
      return;
    while (
      this.dirty.size &&
      !this.disposed &&
      this.state.attempt.state === "in_progress"
    ) {
      const [questionId, optionId] = this.dirty.entries().next().value!;
      this.pending ??= {
        questionId,
        request: {
          optionId,
          expectedRevision: this.state.attempt.revision,
          requestId: crypto.randomUUID(),
        },
      };
      const pending = this.pending;
      this.emit("saving");
      try {
        const saved = await this.transport.save(
          pending.questionId,
          pending.request,
        );
        if (this.disposed) return;
        if (saved.revision < this.state.attempt.revision) {
          await this.reconcile();
          return;
        }
        this.state.attempt = {
          ...this.state.attempt,
          revision: saved.revision,
          lastSavedAt: saved.savedAt,
        };
        this.saved[pending.questionId] = pending.request.optionId;
        if (this.dirty.get(pending.questionId) === pending.request.optionId)
          this.dirty.delete(pending.questionId);
        this.pending = undefined;
      } catch (error) {
        if (this.disposed) return;
        if (clashes.includes(code(error) || "")) await this.reconcile();
        else {
          this.needsRead = denied(error);
          this.state.locked = this.needsRead;
          this.emit(
            "error",
            "Your latest answers are not confirmed saved. Check your connection or access, then retry saving.",
          );
        }
        return;
      }
    }
    this.emit("saved");
  }
  private async reconcile() {
    this.needsRead = true;
    this.state.locked = true;
    this.emit("checking", "Checking saved answers…");
    try {
      const a = await this.transport.read();
      if (this.disposed) return;
      if (a.state === "submitted") {
        this.result(a);
        return;
      }
      if (
        a.id !== this.initial.id ||
        a.contentVersion !== this.initial.contentVersion
      )
        throw new Error("Unexpected attempt version");
      this.state.attempt = a;
      this.saved = selections(a);
      this.pending = undefined;
      this.needsRead = false;
      this.state.selections = {
        ...this.saved,
        ...Object.fromEntries(this.dirty),
      };
      this.emit(
        "conflict",
        "Saved answers changed or device answers were recovered. Choose which answers to keep before continuing.",
      );
    } catch {
      this.emit(
        "error",
        "Could not check saved answers. Retry saving to check again.",
      );
    }
  }
  async retry() {
    if (this.disposed || this.state.status !== "error" || this.resolving)
      return;
    if (this.needsRead) {
      this.resolving = true;
      try {
        await this.reconcile();
      } finally {
        this.resolving = false;
      }
      return;
    }
    this.emit("saving");
    await this.drain();
  }
  async resolveConflict(keepLocal: boolean) {
    if (this.disposed || this.resolving || this.state.status !== "conflict")
      return;
    this.resolving = true;
    try {
      await this.reconcile();
      if (
        this.disposed ||
        this.state.attempt.state !== "in_progress" ||
        this.needsRead
      )
        return;
      if (!keepLocal) this.dirty.clear();
      this.state.selections = {
        ...this.saved,
        ...Object.fromEntries(this.dirty),
      };
      this.state.locked = false;
      this.emit(this.dirty.size ? "saving" : "saved");
      await this.drain();
    } finally {
      this.resolving = false;
    }
  }
  get canFinish() {
    return (
      !this.disposed &&
      !this.finishing &&
      !this.state.locked &&
      this.state.status === "saved" &&
      !this.dirty.size &&
      this.initial.questions.every((q) =>
        this.valid(q.id, this.state.selections[q.id]),
      )
    );
  }
  async finish() {
    if (
      this.disposed ||
      this.finishing ||
      this.state.locked ||
      ["error", "conflict"].includes(this.state.status)
    )
      return;
    this.finishing = true;
    try {
      await this.drain();
      if (
        this.disposed ||
        this.state.status !== "saved" ||
        this.state.attempt.state !== "in_progress" ||
        this.dirty.size ||
        !this.initial.questions.every((q) =>
          this.valid(q.id, this.state.selections[q.id]),
        )
      )
        return;
      this.state.locked = true;
      this.finishRequest = {
        expectedRevision: this.state.attempt.revision,
        requestId: crypto.randomUUID(),
        answers: this.initial.questions.map((q) => ({
          questionId: q.id,
          optionId: this.state.selections[q.id],
        })),
      };
      await this.sendFinish();
    } finally {
      this.finishing = false;
    }
  }
  private async sendFinish() {
    if (!this.finishRequest || this.disposed) return;
    this.emit("submitting", "Submitting activity…");
    try {
      const result = await this.transport.submit(this.finishRequest);
      if (!this.disposed) this.result(result);
    } catch (error) {
      if (this.disposed) return;
      if (clashes.includes(code(error) || "")) {
        for (const s of this.finishRequest.answers)
          this.dirty.set(s.questionId, s.optionId);
        this.finishRequest = undefined;
        await this.reconcile();
      } else await this.recoverSubmission(false);
    }
  }
  private async recoverSubmission(replay: boolean) {
    try {
      const a = await this.transport.read();
      if (this.disposed) return;
      if (a.state === "submitted") {
        this.result(a);
        return;
      }
      if (replay && this.finishRequest) {
        // A changed revision requires explicit reconciliation, never rebasing a final submission.
        if (
          a.revision !== this.finishRequest.expectedRevision ||
          a.contentVersion !== this.initial.contentVersion
        ) {
          for (const s of this.finishRequest.answers)
            this.dirty.set(s.questionId, s.optionId);
          this.finishRequest = undefined;
          await this.reconcile();
          return;
        }
        await this.sendFinish();
        return;
      }
    } catch {
      /* Keep the exact journaled submit body and remain locked. */
    }
    this.emit(
      "uncertain",
      "Submission is not confirmed. Check submission to recover this same attempt safely.",
    );
  }
  async checkSubmission() {
    if (this.disposed || this.resolving || this.state.status !== "uncertain")
      return;
    this.resolving = true;
    this.emit("checking", "Checking submission…");
    try {
      await this.recoverSubmission(true);
    } finally {
      this.resolving = false;
    }
  }
}
