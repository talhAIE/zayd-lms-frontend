export interface PendingReadingAudio {
  lessonModeId: string;
  sessionId: string;
  id: string;
  base64: string;
  format: string;
  createdAt: string;
}

const DATABASE_NAME = 'zayd-reading-recordings';
const STORE_NAME = 'pending';

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) {
        request.result.createObjectStore(STORE_NAME, { keyPath: 'lessonModeId' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function transact<T>(
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore, resolve: (value: T) => void, reject: (error: unknown) => void) => void,
): Promise<T> {
  return openDatabase().then((database) => new Promise<T>((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, mode);
    const store = transaction.objectStore(STORE_NAME);
    let value: T;
    transaction.oncomplete = () => {
      database.close();
      resolve(value);
    };
    transaction.onerror = () => {
      database.close();
      reject(transaction.error);
    };
    run(store, (result) => { value = result; }, reject);
  }));
}

export function savePendingReadingAudio(value: PendingReadingAudio): Promise<void> {
  return transact<void>('readwrite', (store, resolve, reject) => {
    const request = store.put(value);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export function loadPendingReadingAudio(lessonModeId: string): Promise<PendingReadingAudio | null> {
  return transact<PendingReadingAudio | null>('readonly', (store, resolve, reject) => {
    const request = store.get(lessonModeId);
    request.onsuccess = () => resolve((request.result as PendingReadingAudio | undefined) ?? null);
    request.onerror = () => reject(request.error);
  });
}

export function removePendingReadingAudio(lessonModeId: string, id: string): Promise<void> {
  return transact<void>('readwrite', (store, resolve, reject) => {
    const current = store.get(lessonModeId);
    current.onerror = () => reject(current.error);
    current.onsuccess = () => {
      if ((current.result as PendingReadingAudio | undefined)?.id !== id) {
        resolve();
        return;
      }
      const removal = store.delete(lessonModeId);
      removal.onsuccess = () => resolve();
      removal.onerror = () => reject(removal.error);
    };
  });
}

export function createPendingAudioUrl(base64: string, format: string): string {
  const bytes = Uint8Array.from(atob(base64), (character) => character.charCodeAt(0));
  return URL.createObjectURL(new Blob([bytes], { type: `audio/${format}` }));
}
