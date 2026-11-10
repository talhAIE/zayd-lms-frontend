import type {
  NafsAttemptView,
  NafsInProgressAttemptView,
  NafsResultView,
  NafsSaveAnswerRequest,
  NafsSaveAnswerResponse,
  NafsSelection,
  NafsSubmitRequest,
} from '@/types/nafs.contract';

export type SaveState =
  'saved' | 'saving' | 'error' | 'conflict' | 'submitting' | 'uncertain';
export interface AttemptState {
  attempt: NafsAttemptView;
  selections: Record<string, string>;
  status: SaveState;
  message: string;
}
export interface AttemptTransport {
  read(): Promise<{ attempt: NafsAttemptView }>;
  save(
    questionId: string,
    request: NafsSaveAnswerRequest,
  ): Promise<{ saved: NafsSaveAnswerResponse }>;
  submit(request: NafsSubmitRequest): Promise<{ result: NafsResultView }>;
}
const selections = (a: NafsInProgressAttemptView) =>
  Object.fromEntries(a.selections.map((s) => [s.questionId, s.optionId]));
const code = (error: unknown) =>
  (error as { response?: { data?: { code?: string } } })?.response?.data?.code;

// A single serial writer per mounted attempt. A failed request is retained
// unchanged for replay. Conflicting tabs require an explicit reconciliation.
export class AttemptSession {
  state: AttemptState;
  private dirty = new Map<string, string>();
  private saved: Record<string, string>;
  private pending?: { questionId: string; request: NafsSaveAnswerRequest };
  private finishRequest?: NafsSubmitRequest;
  private running?: Promise<void>;
  private disposed = false;
  private locked = false;
  private needsRead = false;
  private resolving = false;
  constructor(
    attempt: NafsInProgressAttemptView,
    private transport: AttemptTransport,
    private changed: (state: AttemptState) => void,
    private draft?: (answers: Record<string, string>) => void,
  ) {
    this.saved = selections(attempt);
    this.state = {
      attempt,
      selections: { ...this.saved },
      status: 'saved',
      message: '',
    };
  }
  dispose() {
    this.disposed = true;
  }
  private emit(status: SaveState, message = '') {
    if (this.disposed) return;
    this.state = {
      ...this.state,
      selections: { ...this.state.selections },
      status,
      message,
    };
    this.draft?.(
      this.state.attempt.state === 'submitted'
        ? {}
        : Object.fromEntries(this.dirty),
    );
    this.changed(this.state);
  }
  private result(result: NafsResultView) {
    this.locked = true;
    this.dirty.clear();
    this.pending = undefined;
    this.state = {
      attempt: result,
      selections: {},
      status: 'saved',
      message: '',
    };
    this.emit('saved');
  }
  select(questionId: string, optionId: string) {
    if (
      this.disposed ||
      this.locked ||
      this.state.status === 'conflict' ||
      this.state.attempt.state !== 'in_progress'
    )
      return;
    if (
      !this.state.attempt.questions.some(
        (q) => q.id === questionId && q.options.some((o) => o.id === optionId),
      )
    )
      return;
    this.state.selections[questionId] = optionId;
    this.dirty.set(questionId, optionId);
    if (this.state.status === 'error') {
      this.emit('error', this.state.message);
      return;
    }
    this.emit('saving');
    void this.drain();
  }
  recoverDraft(draft: Record<string, string>) {
    if (this.state.attempt.state !== 'in_progress') return;
    for (const q of this.state.attempt.questions) {
      const value = draft[q.id];
      if (q.options.some((o) => o.id === value) && value !== this.saved[q.id]) {
        this.dirty.set(q.id, value);
        this.state.selections[q.id] = value;
      }
    }
    if (this.dirty.size)
      this.emit(
        'conflict',
        'Unsaved answers were recovered on this device. Choose whether to keep them or use the saved answers.',
      );
    else this.emit('saved');
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
      this.locked ||
      ['error', 'conflict'].includes(this.state.status)
    )
      return;
    while (
      this.dirty.size &&
      !this.disposed &&
      this.state.attempt.state === 'in_progress'
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
      this.emit('saving');
      try {
        const { saved } = await this.transport.save(
          pending.questionId,
          pending.request,
        );
        if (this.disposed) return;
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
        if (
          [
            'NAFS_REVISION_CONFLICT',
            'NAFS_REQUEST_CONFLICT',
            'NAFS_SUBMITTED',
          ].includes(code(error) || '')
        ) {
          await this.reconcile();
        } else
          this.emit(
            'error',
            'Your latest answers have not been confirmed saved. Check your connection and retry saving.',
          );
        return;
      }
    }
    this.emit('saved');
  }
  async retry() {
    if (this.disposed || this.state.status !== 'error') return;
    if (this.needsRead) {
      await this.reconcile();
      return;
    }
    if (this.locked) return;
    this.emit('saving');
    await this.drain();
  }
  private async reconcile() {
    this.needsRead = true;
    try {
      const { attempt } = await this.transport.read();
      if (this.disposed) return;
      if (attempt.state === 'submitted') {
        this.result(attempt);
        return;
      }
      this.state.attempt = attempt;
      this.saved = selections(attempt);
      this.pending = undefined;
      this.needsRead = false;
      this.state.selections = {
        ...this.saved,
        ...Object.fromEntries(this.dirty),
      };
      this.locked = false;
      this.emit(
        'conflict',
        'This quiz changed in another tab. Review your answers before continuing.',
      );
    } catch {
      this.emit(
        'error',
        'Could not check the saved quiz. Retry saving to check again.',
      );
    }
  }
  async resolveConflict(keepLocal: boolean) {
    if (this.resolving || this.state.status !== 'conflict') return;
    this.resolving = true;
    try {
      // Re-read on the user's decision; never rebase against an old tab revision.
      await this.reconcile();
      if (
        this.state.status !== 'conflict' ||
        this.state.attempt.state !== 'in_progress'
      )
        return;
      if (!keepLocal) this.dirty.clear();
      this.state.selections = {
        ...this.saved,
        ...Object.fromEntries(this.dirty),
      };
      this.emit(this.dirty.size ? 'saving' : 'saved');
      await this.drain();
    } finally {
      this.resolving = false;
    }
  }
  async finish() {
    if (this.locked || this.disposed) return;
    await this.drain();
    if (
      this.locked ||
      this.disposed ||
      this.state.status !== 'saved' ||
      this.state.attempt.state !== 'in_progress'
    )
      return;
    const a = this.state.attempt;
    if (a.questions.some((q) => !this.state.selections[q.id])) return;
    this.locked = true;
    this.finishRequest = {
      expectedRevision: a.revision,
      requestId: crypto.randomUUID(),
      answers: a.questions.map(
        (q) =>
          ({
            questionId: q.id,
            optionId: this.state.selections[q.id],
          }) satisfies NafsSelection,
      ),
    };
    await this.sendFinish();
  }
  private async sendFinish() {
    if (!this.finishRequest || this.disposed) return;
    this.emit('submitting');
    try {
      const { result } = await this.transport.submit(this.finishRequest);
      if (!this.disposed) this.result(result);
    } catch (error) {
      if (this.disposed) return;
      if (
        [
          'NAFS_REVISION_CONFLICT',
          'NAFS_INCOMPLETE',
          'NAFS_INVALID_ANSWER',
          'NAFS_REQUEST_CONFLICT',
        ].includes(code(error) || '')
      ) {
        this.finishRequest = undefined;
        this.locked = false;
        await this.reconcile();
      } else {
        // A lost response is not evidence that submission failed.
        try {
          const { attempt } = await this.transport.read();
          if (this.disposed) return;
          if (attempt.state === 'submitted') {
            this.result(attempt);
            return;
          }
        } catch {
          /* Keep the original immutable finish request for replay. */
        }
        this.emit(
          'uncertain',
          'Submission is not yet confirmed. Check submission to safely recover this same attempt.',
        );
      }
    }
  }
  async checkSubmission() {
    if (this.state.status !== 'uncertain' || this.disposed) return;
    this.emit('submitting');
    try {
      const { attempt } = await this.transport.read();
      if (this.disposed) return;
      if (attempt.state === 'submitted') {
        this.result(attempt);
        return;
      }
      await this.sendFinish();
    } catch {
      this.emit(
        'uncertain',
        'Could not confirm submission. Check your connection and check submission again.',
      );
    }
  }
}
