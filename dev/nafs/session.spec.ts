import { test, expect } from '@playwright/test';
import {
  AttemptSession,
  type AttemptTransport,
} from '../../src/components/nafs/attemptSession';
import type {
  NafsInProgressAttemptView,
  NafsSaveAnswerRequest,
  NafsSubmitRequest,
} from '../../src/types/nafs.contract';

const initial = (): NafsInProgressAttemptView => ({
  id: 'attempt',
  assessmentId: 'assessment',
  contentVersion: 1,
  state: 'in_progress',
  revision: 0,
  startedAt: new Date().toISOString(),
  lastSavedAt: null,
  passages: [],
  selections: [],
  questions: [1, 2].map((n) => ({
    id: `q${n}`,
    displayOrder: n,
    stem: `Question ${n}`,
    accessibleVisualText: null,
    presentation: 'structured_text',
    sourceFacsimile: null,
    passageId: null,
    options: [...'ABCD'].map((label) => ({
      id: `q${n}-${label}`,
      label: label as 'A',
      text: label,
      image: null,
    })),
  })),
});
const result = {
  attemptId: 'attempt',
  assessmentId: 'assessment',
  state: 'submitted' as const,
  earnedMarks: 1,
  totalMarks: 2,
  completedAt: new Date().toISOString(),
};
const failure = (code: string) => ({ response: { data: { code } } });
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((r) => {
    resolve = r;
  });
  return { promise, resolve };
}
function fixture() {
  const a = initial();
  const calls: Array<{ q: string; body: NafsSaveAnswerRequest }> = [];
  const submits: NafsSubmitRequest[] = [];
  const transport: AttemptTransport = {
    read: async () => ({ attempt: structuredClone(a) }),
    save: async (q, body) => {
      calls.push({ q, body });
      a.revision = body.expectedRevision + 1;
      a.selections = [
        ...a.selections.filter((s) => s.questionId !== q),
        { questionId: q, optionId: body.optionId },
      ];
      return {
        saved: {
          attemptId: a.id,
          state: 'in_progress',
          revision: a.revision,
          selection: { questionId: q, optionId: body.optionId },
          savedAt: new Date().toISOString(),
        },
      };
    },
    submit: async (body) => {
      submits.push(body);
      return { result };
    },
  };
  const engine = new AttemptSession(structuredClone(a), transport, () => {});
  return { engine, transport, calls, submits, a };
}

test('serializes rapid edits, retains newest selection and drains saves before final snapshot', async () => {
  const f = fixture();
  const gate = deferred<void>();
  const save = f.transport.save;
  let active = 0,
    max = 0;
  f.transport.save = async (q, body) => {
    active++;
    max = Math.max(max, active);
    if (!f.calls.length) await gate.promise;
    const response = await save(q, body);
    active--;
    return response;
  };
  f.engine.select('q1', 'q1-A');
  f.engine.select('q1', 'q1-B');
  f.engine.select('q2', 'q2-C');
  const finish = f.engine.finish();
  expect(f.submits).toHaveLength(0);
  gate.resolve();
  await finish;
  expect(max).toBe(1);
  expect(f.calls.map((c) => c.body.expectedRevision)).toEqual([0, 1, 2]);
  expect(f.submits[0].answers).toEqual([
    { questionId: 'q1', optionId: 'q1-B' },
    { questionId: 'q2', optionId: 'q2-C' },
  ]);
  f.engine.select('q1', 'q1-D');
  await f.engine.finish();
  expect(f.submits).toHaveLength(1);
  expect(f.engine.state.attempt).toEqual(result);
});
test('retains a failed save and replays its exact request before newer edits', async () => {
  const f = fixture();
  const save = f.transport.save;
  let rejected: NafsSaveAnswerRequest | undefined;
  f.transport.save = async (q, body) => {
    if (!rejected) {
      rejected = structuredClone(body);
      throw Error('lost response');
    }
    return save(q, body);
  };
  f.engine.select('q1', 'q1-A');
  await f.engine.drain();
  expect(f.engine.state.status).toBe('error');
  f.engine.select('q1', 'q1-B');
  await f.engine.finish();
  expect(f.submits).toHaveLength(0);
  await f.engine.retry();
  expect(f.calls[0].body).toEqual(rejected);
  expect(f.calls[1].body.optionId).toBe('q1-B');
  expect(f.engine.state.status).toBe('saved');
});
test('revision conflict reads server and requires explicit choice instead of silently overwriting another tab', async () => {
  const f = fixture();
  const save = f.transport.save;
  f.transport.save = async () => {
    throw failure('NAFS_REVISION_CONFLICT');
  };
  f.a.revision = 7;
  f.a.selections = [{ questionId: 'q2', optionId: 'q2-D' }];
  f.engine.select('q1', 'q1-B');
  await f.engine.drain();
  expect(f.engine.state.status).toBe('conflict');
  await f.engine.finish();
  expect(f.submits).toHaveLength(0);
  f.transport.save = save;
  await f.engine.resolveConflict(true);
  expect(f.calls[0].body.expectedRevision).toBe(7);
  expect(f.engine.state.selections).toEqual({ q1: 'q1-B', q2: 'q2-D' });
});
test('discarding recovered local answers retains current server selections', async () => {
  const f = fixture();
  f.a.selections = [{ questionId: 'q1', optionId: 'q1-C' }];
  f.engine.recoverDraft({ q1: 'q1-B', unrelated: 'anything' });
  expect(f.engine.state.status).toBe('conflict');
  await f.engine.resolveConflict(false);
  expect(f.engine.state.selections).toEqual({ q1: 'q1-C' });
  expect(f.calls).toHaveLength(0);
});
test('lost finish response recovers submitted summary without another submit', async () => {
  const f = fixture();
  f.transport.submit = async () => {
    throw Error('lost response');
  };
  f.transport.read = async () => ({ attempt: result });
  f.engine.select('q1', 'q1-A');
  f.engine.select('q2', 'q2-B');
  await f.engine.drain();
  await f.engine.finish();
  expect(f.engine.state.attempt).toEqual(result);
});
test('uncertain finish freezes edits and checks/replays the same immutable request', async () => {
  const f = fixture();
  const requests: NafsSubmitRequest[] = [];
  let fail = true;
  f.transport.submit = async (body) => {
    requests.push(structuredClone(body));
    if (fail) throw Error('offline');
    return { result };
  };
  f.engine.select('q1', 'q1-A');
  f.engine.select('q2', 'q2-B');
  await f.engine.drain();
  await f.engine.finish();
  expect(f.engine.state.status).toBe('uncertain');
  f.engine.select('q1', 'q1-D');
  expect(f.engine.state.selections.q1).toBe('q1-A');
  fail = false;
  await f.engine.checkSubmission();
  expect(requests[1]).toEqual(requests[0]);
  expect(f.engine.state.attempt).toEqual(result);
});
test('failed reconciliation can be retried, and server-submitted attempts lock immediately', async () => {
  const f = fixture();
  let fail = true;
  f.transport.save = async () => {
    throw failure('NAFS_SUBMITTED');
  };
  f.transport.read = async () => {
    if (fail) throw Error('offline');
    return { attempt: result };
  };
  f.engine.select('q1', 'q1-A');
  await f.engine.drain();
  expect(f.engine.state.status).toBe('error');
  fail = false;
  await f.engine.retry();
  expect(f.engine.state.attempt).toEqual(result);
});
test('incomplete and disposed sessions never submit or deliver late updates', async () => {
  const f = fixture();
  await f.engine.finish();
  expect(f.submits).toHaveLength(0);
  const gate = deferred<{ saved: never }>();
  f.transport.save = () => gate.promise;
  f.engine.select('q1', 'q1-A');
  f.engine.dispose();
  gate.resolve({ saved: undefined as never });
  await f.engine.drain();
  expect(f.engine.state.attempt.state).toBe('in_progress');
  expect(f.engine.state.selections.q2).toBeUndefined();
});

test('simultaneous finish clicks send only one immutable submission', async () => {
  const f = fixture();
  const gate = deferred<void>();
  f.transport.submit = async (body) => {
    f.submits.push(body);
    await gate.promise;
    return { result };
  };
  f.engine.select('q1', 'q1-A');
  f.engine.select('q2', 'q2-B');
  await f.engine.drain();
  const first = f.engine.finish(),
    second = f.engine.finish();
  await expect.poll(() => f.submits.length).toBe(1);
  gate.resolve();
  await Promise.all([first, second]);
  expect(f.submits).toHaveLength(1);
  expect(f.engine.state.attempt).toEqual(result);
});

test('a known submission rejection and failed reread can recover without trapping editable answers', async () => {
  const f = fixture();
  let offline = true;
  f.transport.submit = async () => {
    throw failure('NAFS_REVISION_CONFLICT');
  };
  f.transport.read = async () => {
    if (offline) throw Error('offline');
    return { attempt: structuredClone(f.a) };
  };
  f.engine.select('q1', 'q1-A');
  f.engine.select('q2', 'q2-B');
  await f.engine.drain();
  await f.engine.finish();
  expect(f.engine.state.status).toBe('error');
  f.engine.select('q1', 'q1-C');
  expect(f.engine.state.selections.q1).toBe('q1-C');
  offline = false;
  await f.engine.retry();
  expect(f.engine.state.status).toBe('conflict');
  await f.engine.resolveConflict(true);
  expect(f.engine.state.status).toBe('saved');
  expect(f.engine.state.selections.q1).toBe('q1-C');
});
