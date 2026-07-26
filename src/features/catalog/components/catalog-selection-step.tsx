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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [, startTransition] = useTransition();

  /* ─── Store ────────────────────────────────────────────────────────────── */
  const addService = useBillingStore((s) => s.addService);
  const addProduct = useBillingStore((s) => s.addProduct);
  const updateServiceQuantity = useBillingStore((s) => s.updateServiceQuantity);
  const updateProductQuantity = useBillingStore((s) => s.updateProductQuantity);
  const getCartItems = useBillingStore((s) => s.getCartItems);
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
    (id: string) => {
      const item = catalog.find((c) => c.id === id);
      if (!item) return;

      startTransition(() => {
        if (item.type === "service") {
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

  const handleBack = useCallback(() => {
    setStep("customer");
  }, [setStep]);

  /* ─── Quantity lookup for cards ─────────────────────────────────────────── */
  const items = getCartItems();
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
      <PageHeader
        title="Select Items"
        subtitle="Step 2 of 3"
        onBack={handleBack}
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
          <TabsList className="w-full grid grid-cols-2 bg-surface p-1 rounded-[16px]">
            <TabsTrigger value="service" className="rounded-[12px]">
              Services
            </TabsTrigger>
            <TabsTrigger value="product" className="rounded-[12px]">
              Products
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div
        className="grid grid-cols-2 gap-[var(--spacing-s)] overflow-y-auto px-[var(--spacing-md)] pb-[160px] flex-1 mt-2"
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
              onIncrement={(id) => {
                if (item.type === "service") updateServiceQuantity(id, 1);
                else updateProductQuantity(id, 1);
              }}
              onDecrement={(id) => {
                if (item.type === "service") updateServiceQuantity(id, -1);
                else updateProductQuantity(id, -1);
              }}
            />
          ))
        )}
      </div>

      <CartSummaryFooter
        totalItems={getTotalItems()}
        totalQuantity={getTotalQuantity()}
        subtotal={getSubtotal()}
        onExpandCart={() => setIsDrawerOpen(true)}
        onContinue={handleContinue}
      />

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
                  onIncrement={(id) => {
                    if (item.type === "service") updateServiceQuantity(id, 1);
                    else updateProductQuantity(id, 1);
                  }}
                  onDecrement={(id) => {
                    if (item.type === "service") updateServiceQuantity(id, -1);
                    else updateProductQuantity(id, -1);
                  }}
                />
              ))
            )}
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
