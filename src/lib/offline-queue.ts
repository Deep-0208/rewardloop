import { openDB, DBSchema, IDBPDatabase } from "idb";

export interface PendingVisit {
  id: string;
  created_at: string;
  payload: unknown; // The arguments for the server action
  retry_count: number;
  last_attempt: string;
  status: "pending" | "failed";
}

interface RewardLoopDB extends DBSchema {
  visits: {
    key: string;
    value: PendingVisit;
  };
}

let dbPromise: Promise<IDBPDatabase<RewardLoopDB>> | null = null;

if (typeof window !== "undefined") {
  dbPromise = openDB<RewardLoopDB>("rewardloop-queue", 1, {
    upgrade(db) {
      db.createObjectStore("visits", { keyPath: "id" });
    },
  });
}

export async function enqueueVisit(payload: unknown) {
  if (!dbPromise) return;
  const db = await dbPromise;
  const visit: PendingVisit = {
    id: crypto.randomUUID(),
    created_at: new Date().toISOString(),
    payload,
    retry_count: 0,
    last_attempt: new Date().toISOString(),
    status: "pending",
  };
  await db.add("visits", visit);

  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("offline-queue-updated"));
  }
}

export async function getPendingVisits(): Promise<PendingVisit[]> {
  if (!dbPromise) return [];
  const db = await dbPromise;
  return db.getAll("visits");
}

export async function removeVisit(id: string) {
  if (!dbPromise) return;
  const db = await dbPromise;
  await db.delete("visits", id);

  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("offline-queue-updated"));
  }
}

export async function updateVisit(visit: PendingVisit) {
  if (!dbPromise) return;
  const db = await dbPromise;
  await db.put("visits", visit);

  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("offline-queue-updated"));
  }
}

export async function flushQueue(
  syncFn: (payload: unknown) => Promise<boolean>,
) {
  const pending = await getPendingVisits();
  if (pending.length === 0) return;

  for (const visit of pending) {
    try {
      visit.last_attempt = new Date().toISOString();
      visit.retry_count += 1;
      await updateVisit(visit);

      const success = await syncFn(visit.payload);
      if (success) {
        await removeVisit(visit.id);
      } else {
        visit.status = "failed";
        await updateVisit(visit);
      }
    } catch {
      visit.status = "failed";
      await updateVisit(visit);
    }
  }
}
