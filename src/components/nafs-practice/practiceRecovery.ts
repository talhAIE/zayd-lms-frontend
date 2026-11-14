import type {
  PracticeOwner,
  PracticeSessionView,
  PracticeMutationRequest,
} from "@/types/nafs-practice.contract";
import type { PracticeDraft } from "./practiceSession";

// A document owns its own backup. Even opener-cloned sessionStorage cannot make
// two live tabs overwrite each other's write-ahead receipts.
let writer: string | undefined;
export interface PracticeBackup {
  key: string;
  updatedAt: number;
  value: unknown;
}
export function practiceBackups(key: string): PracticeBackup[] {
  const backups: PracticeBackup[] = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const candidate = localStorage.key(i);
      if (!candidate?.startsWith(`${key}:backup:`)) continue;
      const raw = localStorage.getItem(candidate);
      if (!raw || raw.length >= 12 * 1024 * 1024) continue;
      let parsed: unknown;
      try {
        parsed = JSON.parse(raw);
      } catch {
        continue;
      }
      if (
        parsed &&
        typeof parsed === "object" &&
        "updatedAt" in parsed &&
        typeof parsed.updatedAt === "number" &&
        Number.isFinite(parsed.updatedAt) &&
        "value" in parsed
      )
        backups.push({
          key: candidate,
          updatedAt: parsed.updatedAt,
          value: parsed.value,
        });
    }
  } catch {
    /* Storage can be disabled; mutation dispatch will then be blocked. */
  }
  return backups.sort((a, b) => b.updatedAt - a.updatedAt);
}
export function ignorePracticeBackups(key: string) {
  try {
    sessionStorage.setItem(`${key}:ignoreBackups`, "true");
  } catch {
    /* Sending still requires writable recovery storage. */
  }
}
export function shouldOfferPracticeBackups(key: string) {
  try {
    return sessionStorage.getItem(`${key}:ignoreBackups`) !== "true";
  } catch {
    return true;
  }
}
export function clearCompletedPracticeRecovery(key: string) {
  try {
    sessionStorage.removeItem(key);
    sessionStorage.removeItem(`${key}:ignoreBackups`);
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const candidate = localStorage.key(i);
      if (candidate?.startsWith(`${key}:backup:`)) keys.push(candidate);
    }
    for (const candidate of keys) localStorage.removeItem(candidate);
  } catch {
    /* An immutable server result remains authoritative. */
  }
}

const scope = (owner: PracticeOwner) =>
  [owner.id, owner.username, owner.role, owner.region]
    .map(encodeURIComponent)
    .join(":");
export const practiceDraftKey = (
  owner: PracticeOwner,
  s: PracticeSessionView,
) =>
  `nafs:practice:draft:v1:${scope(owner)}:${encodeURIComponent(s.collectionId)}:${s.contentVersion}:${encodeURIComponent(s.id)}`;
export function readPracticeRecovery(key: string): unknown {
  try {
    const raw = sessionStorage.getItem(key);
    if (raw && raw.length < 12 * 1024 * 1024) return JSON.parse(raw);
  } catch {
    /* Persistent entry receipts can still be recovered in a reopened tab. */
  }
  if (key.startsWith("nafs:practice:entry:"))
    return practiceBackups(key)[0]?.value;
}
export function writePracticeRecovery(
  key: string,
  value: PracticeDraft | EntryReceipt | null,
) {
  try {
    if (value) sessionStorage.setItem(key, JSON.stringify(value));
    else sessionStorage.removeItem(key);
    if (key.startsWith("nafs:practice:draft:")) ignorePracticeBackups(key);
    // No browser storage/crypto work runs merely by importing disabled practice.
    writer ||= crypto.randomUUID();
    const backupKey = `${key}:backup:${writer}`;
    if (value)
      localStorage.setItem(
        backupKey,
        JSON.stringify({ updatedAt: Date.now(), value }),
      );
    else localStorage.removeItem(backupKey);
    return true;
  } catch {
    return false;
  }
}
interface EntryReceipt {
  schema: 1;
  kind: "start" | "repeat";
  target: string;
  requestId: string;
  expectedRevision?: number;
}
export function practiceEntryKey(
  owner: PracticeOwner,
  kind: "start" | "repeat",
  target: string,
) {
  return `nafs:practice:entry:v1:${scope(owner)}:${kind}:${encodeURIComponent(target)}`;
}
// Start and repeat retain the exact payload across reloads until the target run
// is known. Retry first reads its authorized parent/predecessor, then replays.
export async function openPracticeRun(
  owner: PracticeOwner,
  kind: "start" | "repeat",
  target: string,
  revision: number | undefined,
  read: () => Promise<unknown>,
  send: (
    request: { requestId: string } | PracticeMutationRequest,
  ) => Promise<{ session: PracticeSessionView }>,
) {
  const key = practiceEntryKey(owner, kind, target);
  const saved = readPracticeRecovery(key) as Partial<EntryReceipt> | undefined;
  const valid =
    saved?.schema === 1 &&
    saved.kind === kind &&
    saved.target === target &&
    typeof saved.requestId === "string" &&
    /^[A-Za-z0-9_-]{1,96}$/.test(saved.requestId) &&
    (kind === "start" ||
      (saved.expectedRevision === revision &&
        Number.isInteger(saved.expectedRevision)));
  const receipt: EntryReceipt = valid
    ? {
        schema: 1,
        kind,
        target,
        requestId: saved.requestId!,
        ...(kind === "repeat" ? { expectedRevision: revision } : {}),
      }
    : {
        schema: 1,
        kind,
        target,
        requestId: crypto.randomUUID(),
        ...(kind === "repeat" ? { expectedRevision: revision } : {}),
      };
  const persisted = writePracticeRecovery(key, receipt);
  // Do not send an operation that could be lost across reload without a receipt.
  if (!persisted)
    throw new Error(
      "Practice recovery storage is unavailable. Allow browser storage before opening a new run.",
    );
  if (valid) await read();
  const request =
    kind === "start"
      ? { requestId: receipt.requestId }
      : {
          requestId: receipt.requestId,
          expectedRevision: receipt.expectedRevision!,
        };
  const result = await send(request);
  writePracticeRecovery(key, null);
  return result;
}
