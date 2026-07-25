"use client";

/**
 * Single owner of the presenter's local IndexedDB database. Two features
 * share it — the theme's background-folder handle and the per-plan-item
 * media files — and IndexedDB allows only one version/schema per database,
 * so both MUST open it through this module (independent `indexedDB.open`
 * calls with different versions would throw VersionError).
 *
 * Everything stored here stays on this machine. Media files are saved as
 * blobs — copies live inside the browser's own storage, so they survive
 * restarts and never need a permission prompt, and nothing is ever uploaded.
 */

const DB_NAME = "presenter-media-bin";
const DB_VERSION = 2;

/** v1: background-folder directory handle. */
export const HANDLE_STORE = "handles";
/** v2: File[] keyed by plan item id, for media slides. */
export const PLAN_MEDIA_STORE = "planItemMedia";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      for (const store of [HANDLE_STORE, PLAN_MEDIA_STORE]) {
        if (!req.result.objectStoreNames.contains(store)) {
          req.result.createObjectStore(store);
        }
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function withStore<T>(
  store: string,
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => IDBRequest | void
): Promise<T> {
  const db = await openDb();
  try {
    return await new Promise<T>((resolve, reject) => {
      const tx = db.transaction(store, mode);
      const request = run(tx.objectStore(store));
      tx.oncomplete = () =>
        resolve((request ? request.result : undefined) as T);
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
}

export function idbGet<T>(store: string, key: string): Promise<T | undefined> {
  return withStore<T | undefined>(store, "readonly", (s) => s.get(key));
}

export function idbPut(store: string, key: string, value: unknown): Promise<void> {
  return withStore<void>(store, "readwrite", (s) => {
    s.put(value, key);
  });
}

export function idbDelete(store: string, key: string): Promise<void> {
  return withStore<void>(store, "readwrite", (s) => {
    s.delete(key);
  });
}

export type StoredMediaFile = File;

/** Replaces the media files attached (on this machine) to a plan item. */
export async function savePlanItemFiles(planItemId: string, files: File[]) {
  // Best-effort: ask the browser not to evict this origin's storage under
  // pressure — media for an upcoming service shouldn't silently vanish.
  try {
    await navigator.storage?.persist?.();
  } catch {
    // Not supported or denied — stored anyway, just without the guarantee.
  }
  await idbPut(PLAN_MEDIA_STORE, planItemId, files);
}

export async function loadPlanItemFiles(
  planItemId: string
): Promise<File[] | null> {
  const files = await idbGet<File[]>(PLAN_MEDIA_STORE, planItemId);
  return Array.isArray(files) && files.length > 0 ? files : null;
}

export function deletePlanItemFiles(planItemId: string) {
  return idbDelete(PLAN_MEDIA_STORE, planItemId);
}
