/**
 * RewardLoop — Catalog Selection Step.
 *
 * Main container for Step 2 of the Add Visit wizard.
 * Orchestrates search, catalog list, cart drawer, and footer.
 *
 * @module features/catalog/components/catalog-selection-step
 */

"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useState,
  useTransition,
} from "react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { AlertCircle, RefreshCw, X, FileQuestion } from "@/components/icons";
import { getCatalogItems } from "../actions/get-catalog-items";
import { useBillingStore } from "@/stores/billing-store";
import type { CatalogItem } from "../types";
import { CatalogItemCard } from "./catalog-item-card";
import { CatalogSearchInput } from "./catalog-search-input";
import { CartSummaryFooter } from "./cart-summary-footer";
import { CartItemRow } from "./cart-item-row";

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
 *
 * Flow:
 * 1. Fetches catalog on mount.
 * 2. Client-side search filtering (instant, case-insensitive, partial).
 * 3. Tap-to-add items to cart (via billing store).
 * 4. Cart drawer for quantity adjustment.
 * 5. Continue to Reward Calculation step.
 */
export function CatalogSelectionStep() {
  /* ─── Fetch State ────────────────────────────────────────────────────────── */
  const [fetchState, dispatch] = useReducer(fetchReducer, {
    catalog: [],
    isLoading: true,
    error: null,
  });
  const { catalog, isLoading, error } = fetchState;

  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<
    "all" | "service" | "product"
  >("all");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [, startTransition] = useTransition();

  /* ─── Store ────────────────────────────────────────────────────────────── */
  const items = useBillingStore((s) => s.items);
  const addItem = useBillingStore((s) => s.addItem);
  const updateQuantity = useBillingStore((s) => s.updateQuantity);
  const setStep = useBillingStore((s) => s.setStep);
  const getSubtotal = useBillingStore((s) => s.getSubtotal);
  const getTotalItems = useBillingStore((s) => s.getTotalItems);
  const getTotalQuantity = useBillingStore((s) => s.getTotalQuantity);

  /* ─── Data Fetching ────────────────────────────────────────────────────── */
  const [fetchKey, setFetchKey] = useState(0);

  useEffect(() => {
    let stale = false;

    async function load() {
      const result = await getCatalogItems();
      if (stale) return;

      if (result.success) {
        dispatch({ type: "SUCCESS", data: result.data });
      } else {
        dispatch({ type: "ERROR", error: result.error });
      }
    }

    dispatch({ type: "LOADING" });
    load();

    return () => {
      stale = true;
    };
  }, [fetchKey]);

  const handleRetry = useCallback(() => {
    setFetchKey((k) => k + 1);
  }, []);

  /* ─── Search & Category Filtering ──────────────────────────────────────── */
  const filteredCatalog = useMemo(() => {
    let result = catalog;

    // 1. Filter by category
    if (activeCategory !== "all") {
      result = result.filter((item) => item.type === activeCategory);
    }

    // 2. Filter by search query
    const trimmed = searchQuery.trim().toLowerCase();
    if (trimmed.length > 0) {
      result = result.filter((item) =>
        item.name.toLowerCase().includes(trimmed),
      );
    }

    return result;
  }, [catalog, searchQuery, activeCategory]);

  /* ─── Handlers ─────────────────────────────────────────────────────────── */
  const handleTapItem = useCallback(
    (id: string) => {
      const item = catalog.find((c) => c.id === id);
      if (!item) return;

      startTransition(() => {
        addItem({
          catalogItemId: item.id,
          name: item.name,
          unitPrice: item.price,
        });
      });
    },
    [catalog, addItem],
  );

  const handleContinue = useCallback(() => {
    if (getTotalItems() === 0) return;
    setStep("reward");
  }, [getTotalItems, setStep]);

  const handleBack = useCallback(() => {
    setStep("customer");
  }, [setStep]);

  /* ─── Quantity lookup for cards ─────────────────────────────────────────── */
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
        <PageHeader title="Select Services & Products" onBack={handleBack} />
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
        <PageHeader title="Select Services & Products" onBack={handleBack} />
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
        <PageHeader title="Select Services & Products" onBack={handleBack} />
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
      {/* Sticky Header */}
      <PageHeader
        title="Select Services & Products"
        subtitle="Step 2 of 4"
        onBack={handleBack}
      />

      {/* Sticky Search & Filters */}
      <div className="sticky top-0 z-30 bg-background/95 px-4 pb-3 backdrop-blur-sm supports-backdrop-filter:bg-background/80 flex flex-col gap-3">
        <CatalogSearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          onClear={() => setSearchQuery("")}
        />

        {/* Category Filters */}
        <div className="flex gap-2">
          <button
            type="button"
            className={cn(
              "h-8 rounded-full px-4 text-xs font-semibold transition-all duration-200 cursor-pointer active:scale-95",
              activeCategory === "all"
                ? "bg-primary text-primary-foreground shadow-[0_2px_10px_rgba(79,70,229,0.3)]"
                : "bg-card border border-border/60 text-muted-foreground hover:border-primary/30 hover:text-foreground",
            )}
            onClick={() => setActiveCategory("all")}
          >
            All
          </button>
          <button
            type="button"
            className={cn(
              "h-8 rounded-full px-4 text-xs font-semibold transition-all duration-200 cursor-pointer active:scale-95",
              activeCategory === "service"
                ? "bg-primary text-primary-foreground shadow-[0_2px_10px_rgba(79,70,229,0.3)]"
                : "bg-card border border-border/60 text-muted-foreground hover:border-primary/30 hover:text-foreground",
            )}
            onClick={() => setActiveCategory("service")}
          >
            Services
          </button>
          <button
            type="button"
            className={cn(
              "h-8 rounded-full px-4 text-xs font-semibold transition-all duration-200 cursor-pointer active:scale-95",
              activeCategory === "product"
                ? "bg-primary text-primary-foreground shadow-[0_2px_10px_rgba(79,70,229,0.3)]"
                : "bg-card border border-border/60 text-muted-foreground hover:border-primary/30 hover:text-foreground",
            )}
            onClick={() => setActiveCategory("product")}
          >
            Products
          </button>
        </div>
      </div>

      {/* Scrollable Catalog Grid (2 Boxes) */}
      <div
        className="grid grid-cols-2 gap-3.5 overflow-y-auto px-4 pb-32 flex-1"
        role="list"
        aria-label="Catalog items"
      >
        {filteredCatalog.length === 0 ? (
          <div className="col-span-2 flex flex-col items-center justify-center py-12 text-center">
            <p className="text-sm text-muted-foreground">
              No items match your search for &ldquo;{searchQuery.trim()}&rdquo;.
            </p>
          </div>
        ) : (
          filteredCatalog.map((item) => (
            <CatalogItemCard
              key={item.id}
              id={item.id}
              name={item.name}
              price={item.price}
              type={item.type}
              quantityInCart={quantityMap.get(item.id) ?? 0}
              onTap={handleTapItem}
              onIncrement={(id) => updateQuantity(id, 1)}
              onDecrement={(id) => updateQuantity(id, -1)}
            />
          ))
        )}
      </div>

      {/* Cart Summary Footer */}
      <CartSummaryFooter
        totalItems={getTotalItems()}
        totalQuantity={getTotalQuantity()}
        subtotal={getSubtotal()}
        onExpandCart={() => setIsDrawerOpen(true)}
        onContinue={handleContinue}
      />

      {/* Cart Drawer */}
      <Drawer
        open={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
        showSwipeHandle
      >
        <DrawerContent className={cn("mx-auto max-w-lg")}>
          <DrawerHeader className="flex-row items-center justify-between">
            <DrawerTitle>Your Cart</DrawerTitle>
            <Button
              variant="ghost"
              size="icon"
              className="size-12"
              aria-label="Close cart"
              onClick={() => setIsDrawerOpen(false)}
            >
              <X className="size-4" />
            </Button>
          </DrawerHeader>

          <div className="flex-1 overflow-y-auto px-4">
            {items.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Your cart is empty. Tap items to add them.
              </p>
            ) : (
              items.map((item) => (
                <CartItemRow
                  key={item.catalogItemId}
                  id={item.catalogItemId}
                  name={item.name}
                  unitPrice={item.unitPrice}
                  quantity={item.quantity}
                  onIncrement={(id) => updateQuantity(id, 1)}
                  onDecrement={(id) => updateQuantity(id, -1)}
                />
              ))
            )}
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
