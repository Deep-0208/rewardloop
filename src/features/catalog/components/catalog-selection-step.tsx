"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useState,
  useTransition,
} from "react";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/constants/routes";
import { Skeleton } from "@/components/ui/skeleton";

import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { AlertCircle, RefreshCw, FileQuestion } from "@/components/icons";
import { getCatalogItems } from "../actions/get-catalog-items";
import { useBillingStore } from "@/stores/billing-store";
import type { CatalogItem } from "../types";
import { CatalogItemCard } from "./catalog-item-card";
import { CatalogSearchInput } from "./catalog-search-input";
import { CartSummaryFooter } from "./cart-summary-footer";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { catalogCache, clearCatalogPromise } from "../utils/catalog-cache";

/* ─── Fetch Reducer ─────────────────────────────────────────────────────────── */

interface FetchState {
  catalog: CatalogItem[];
  isLoading: boolean;
  error: string | null;
}

type FetchAction =
  | { type: "LOADING" }
  | { type: "SUCCESS"; data: CatalogItem[] }
  | { type: "ERROR"; error: string };

function fetchReducer(state: FetchState, action: FetchAction): FetchState {
  switch (action.type) {
    case "LOADING":
      return { ...state, isLoading: true, error: null };
    case "SUCCESS":
      return { catalog: action.data, isLoading: false, error: null };
    case "ERROR":
      return { ...state, isLoading: false, error: action.error };
  }
}

/**
 * CatalogSelectionStep — Step 2 of the /visit wizard.
 */
export function CatalogSelectionStep() {
  const [fetchState, dispatch] = useReducer(fetchReducer, {
    catalog: [],
    isLoading: true,
    error: null,
  });
  const { catalog, isLoading, error } = fetchState;

  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"service" | "product">("service");
  const [, startTransition] = useTransition();

  /* ─── Store ────────────────────────────────────────────────────────────── */
  const selectedServices = useBillingStore((s) => s.selectedServices);
  const selectedProducts = useBillingStore((s) => s.selectedProducts);
  const addService = useBillingStore((s) => s.addService);
  const addProduct = useBillingStore((s) => s.addProduct);
  const updateServiceQuantity = useBillingStore((s) => s.updateServiceQuantity);
  const updateProductQuantity = useBillingStore((s) => s.updateProductQuantity);
  const setStep = useBillingStore((s) => s.setStep);
  const getSubtotal = useBillingStore((s) => s.getSubtotal);
  const getTotalItems = useBillingStore((s) => s.getTotalItems);
  const getTotalQuantity = useBillingStore((s) => s.getTotalQuantity);
  const reset = useBillingStore((s) => s.reset);

  /* ─── Data Fetching ────────────────────────────────────────────────────── */
  const [fetchKey, setFetchKey] = useState(0);

  useEffect(() => {
    let stale = false;

    async function load() {
      // 1. Immediately yield cached data if we have it (Fast Checkout)
      const cachedResponse = catalogCache.get("catalog");
      if (cachedResponse?.success) {
        dispatch({ type: "SUCCESS", data: cachedResponse.data });
      } else {
        dispatch({ type: "LOADING" });
      }

      // 2. Fetch the latest catalog in the background
      try {
        const result = await catalogCache.fetchWithRetry(
          "catalog",
          async () => {
            return await getCatalogItems();
          },
        );
        clearCatalogPromise();

        if (stale) return;

        if (result.success) {
          // Only update UI if the catalog actually changed
          if (
            JSON.stringify(
              cachedResponse?.success ? cachedResponse.data : null,
            ) !== JSON.stringify(result.data)
          ) {
            dispatch({ type: "SUCCESS", data: result.data });
          }
        } else if (!cachedResponse?.success) {
          // Only show error if we don't have a fallback cache
          dispatch({ type: "ERROR", error: result.error });
        }
      } catch {
        if (!cachedResponse?.success && !stale) {
          dispatch({ type: "ERROR", error: "Failed to load catalog" });
        }
      }
    }

    load();

    return () => {
      stale = true;
    };
  }, [fetchKey]);

  const handleRetry = useCallback(() => {
    catalogCache.clear();
    setFetchKey((k) => k + 1);
  }, []);

  /* ─── Search & Category Filtering ──────────────────────────────────────── */
  const currentTabCatalog = useMemo(() => {
    let result = catalog.filter((item) => item.type === activeTab);

    const trimmed = searchQuery.trim().toLowerCase();
    if (trimmed.length > 0) {
      result = result.filter((item) =>
        item.name.toLowerCase().includes(trimmed),
      );
    }

    return result;
  }, [catalog, searchQuery, activeTab]);

  /* ─── Handlers ─────────────────────────────────────────────────────────── */
  const handleTapItem = useCallback(
    (id: string, type: "service" | "product") => {
      const item = catalog.find((c) => c.id === id);
      if (!item) return;

      startTransition(() => {
        if (type === "service") {
          addService({
            catalogItemId: item.id,
            name: item.name,
            unitPrice: item.price,
          });
        } else {
          addProduct({
            catalogItemId: item.id,
            name: item.name,
            unitPrice: item.price,
          });
        }
      });
    },
    [catalog, addService, addProduct],
  );

  const handleContinue = useCallback(() => {
    if (getTotalItems() === 0) return;
    setStep("summary");
  }, [getTotalItems, setStep]);

  const handleIncrement = useCallback(
    (id: string, type: "service" | "product") => {
      if (type === "service") updateServiceQuantity(id, 1);
      else updateProductQuantity(id, 1);
    },
    [updateServiceQuantity, updateProductQuantity],
  );

  const handleDecrement = useCallback(
    (id: string, type: "service" | "product") => {
      if (type === "service") updateServiceQuantity(id, -1);
      else updateProductQuantity(id, -1);
    },
    [updateServiceQuantity, updateProductQuantity],
  );

  const handleBack = useCallback(() => {
    setStep("customer");
  }, [setStep]);

  const router = useRouter();
  const handleCancel = useCallback(() => {
    reset();
    router.replace(ROUTES.DASHBOARD);
  }, [reset, router]);

  /* ─── Quantity lookup for cards ─────────────────────────────────────────── */
  const items = useMemo(
    () => [...selectedServices, ...selectedProducts],
    [selectedServices, selectedProducts],
  );
  const quantityMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of items) {
      map.set(item.catalogItemId, item.quantity);
    }
    return map;
  }, [items]);

  /* ─── Render: Loading ──────────────────────────────────────────────────── */
  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col">
        <PageHeader
          title="Select Items"
          onBack={handleBack}
          actions={
            <Button variant="ghost" size="sm" onClick={handleCancel}>
              Cancel
            </Button>
          }
        />
        <div className="px-4 pb-2">
          <Skeleton className="h-10 w-full rounded-md" />
        </div>
        <div className="flex flex-1 flex-col gap-2 px-4 pb-24">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-[72px] w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  /* ─── Render: Error / Offline ───────────────────────────────────────────── */
  if (error) {
    return (
      <div className="flex flex-1 flex-col">
        <PageHeader
          title="Select Items"
          onBack={handleBack}
          actions={
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCancel}
              className="text-muted-foreground hover:text-foreground"
            >
              Cancel
            </Button>
          }
        />
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
          <AlertCircle className="size-12 text-destructive/60" />
          <div>
            <p className="text-base font-medium text-foreground">
              Failed to load catalog
            </p>
            <p className="mt-1 text-sm text-muted-foreground">{error}</p>
          </div>
          <Button variant="outline" onClick={handleRetry}>
            <RefreshCw className="mr-2 size-4" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  /* ─── Render: Empty Catalog ─────────────────────────────────────────────── */
  if (catalog.length === 0) {
    return (
      <div className="flex flex-1 flex-col">
        <PageHeader
          title="Select Items"
          onBack={handleBack}
          actions={
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCancel}
              className="text-muted-foreground hover:text-foreground"
            >
              Cancel
            </Button>
          }
        />
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
          <FileQuestion className="size-12 text-muted-foreground/60" />
          <div>
            <p className="text-base font-medium text-foreground">
              No services or products found
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Add items from the Dashboard to get started.
            </p>
          </div>
        </div>
      </div>
    );
  }

  /* ─── Render: Main ──────────────────────────────────────────────────────── */
  return (
    <div className="flex flex-1 flex-col">
      <PageHeader
        title="Select Items"
        subtitle="Step 2 of 3"
        onBack={handleBack}
        actions={
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCancel}
            className="text-muted-foreground hover:text-foreground"
          >
            Cancel
          </Button>
        }
      />

      <div className="sticky top-0 z-30 bg-background/95 px-[var(--spacing-md)] pb-3 pt-[var(--spacing-md)] backdrop-blur-sm supports-backdrop-filter:bg-background/80 flex flex-col gap-[var(--spacing-sm)]">
        <CatalogSearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          onClear={() => setSearchQuery("")}
        />

        <Tabs
          defaultValue="service"
          value={activeTab}
          onValueChange={(val) => setActiveTab(val as "service" | "product")}
          className="w-full"
        >
          <TabsList className="w-full grid grid-cols-2 bg-muted/70 p-1 rounded-full shadow-inner h-[44px]">
            <TabsTrigger
              value="service"
              className="rounded-full h-full text-[14px] font-semibold transition-all"
            >
              Services
            </TabsTrigger>
            <TabsTrigger
              value="product"
              className="rounded-full h-full text-[14px] font-semibold transition-all"
            >
              Products
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div
        className="grid grid-cols-2 content-start gap-[var(--spacing-s)] overflow-y-auto px-[var(--spacing-md)] pb-[160px] flex-1 mt-2"
        role="list"
        aria-label="Catalog items"
      >
        {currentTabCatalog.length === 0 ? (
          <div className="col-span-2 flex flex-col items-center justify-center py-12 text-center">
            <p className="text-sm text-muted-foreground">
              No {activeTab}s match your search for &ldquo;{searchQuery.trim()}
              &rdquo;.
            </p>
          </div>
        ) : (
          currentTabCatalog.map((item) => (
            <CatalogItemCard
              key={item.id}
              id={item.id}
              name={item.name}
              price={item.price}
              type={item.type}
              quantityInCart={quantityMap.get(item.id) ?? 0}
              onTap={handleTapItem}
              onIncrement={handleIncrement}
              onDecrement={handleDecrement}
            />
          ))
        )}
      </div>

      <CartSummaryFooter
        totalItems={getTotalItems()}
        totalQuantity={getTotalQuantity()}
        subtotal={getSubtotal()}
        onContinue={handleContinue}
      />
    </div>
  );
}
