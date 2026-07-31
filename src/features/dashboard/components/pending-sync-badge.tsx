"use client";

import { useEffect, useState, useCallback } from "react";
import {
  getPendingVisits,
  flushQueue,
  type PendingVisit,
} from "@/lib/offline-queue";
import { completeVisit } from "@/features/checkout/actions/complete-visit";
import { RefreshCcw, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

export function PendingSyncBadge() {
  const [pending, setPending] = useState<PendingVisit[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const loadPending = useCallback(async () => {
    const visits = await getPendingVisits();
    setPending(visits);
    if (visits.length === 0) {
      setIsOpen(false);
    }
  }, []);

  const handleSync = useCallback(async () => {
    if (isSyncing) return;
    setIsSyncing(true);

    await flushQueue(async (payload) => {
      try {
        const result = await completeVisit(
          payload as Parameters<typeof completeVisit>[0],
        );
        return result.success;
      } catch {
        return false;
      }
    });

    await loadPending();
    setIsSyncing(false);
  }, [isSyncing, loadPending]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadPending();
    window.addEventListener("offline-queue-updated", loadPending);

    // Auto-sync when coming online
    const handleOnline = async () => {
      await handleSync();
    };
    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener("offline-queue-updated", loadPending);
      window.removeEventListener("online", handleOnline);
    };
  }, [loadPending, handleSync]);

  if (pending.length === 0) return null;

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className="mb-6 rounded-[var(--radius-card)] border border-orange-200 bg-orange-50 shadow-sm overflow-hidden"
    >
      <CollapsibleTrigger className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-orange-100/50">
        <div className="flex items-center gap-3">
          <AlertTriangle className="size-5 text-orange-500" />
          <div aria-live="polite" role="status">
            <p className="text-sm font-medium text-orange-900">Pending Sync</p>
            <p className="text-xs text-orange-700">
              {pending.length} visit{pending.length > 1 ? "s" : ""} waiting
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            handleSync();
          }}
          disabled={isSyncing}
          className="h-8 text-orange-700 hover:text-orange-800 hover:bg-orange-200"
          aria-label="Sync pending visits"
        >
          <RefreshCcw
            className={`mr-2 size-3 ${isSyncing ? "animate-spin" : ""}`}
            aria-hidden="true"
          />
          <span aria-live="polite">
            {isSyncing ? "Syncing..." : "Sync Now"}
          </span>
        </Button>
      </CollapsibleTrigger>

      <CollapsibleContent>
        <div className="border-t border-orange-200 divide-y divide-orange-200/50">
          {pending.map((visit, i) => {
            // Rough calculation of total based on payload (or just show it's a visit)
            const isFailed = visit.status === "failed";
            return (
              <div
                key={visit.id}
                className="flex items-center justify-between px-4 py-2 bg-white/50"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Visit #{i + 1}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(visit.created_at).toLocaleTimeString()}
                    {isFailed && (
                      <span className="ml-2 text-red-500 font-medium">
                        Failed
                      </span>
                    )}
                  </p>
                </div>
                {isFailed && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSync()}
                    className="h-7 text-xs"
                  >
                    Retry
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
