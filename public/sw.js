self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("sync", (event) => {
  if (event.tag === "sync-offline-mutations") {
    event.waitUntil(syncOfflineMutations());
  }
});

async function syncOfflineMutations() {
  // Post a message to all active clients (browser tabs) to trigger their
  // in-memory or IndexedDB sync queues.
  // We let the client-side Next.js code handle the actual Supabase fetching,
  // since it has the Auth session tokens and business logic.
  const clients = await self.clients.matchAll();
  for (const client of clients) {
    client.postMessage({ type: "TRIGGER_SYNC" });
  }
}
