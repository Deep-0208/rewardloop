"use client";

import { useState, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ScreenContainer } from "@/components/screen-container";
import { PageHeader } from "@/components/page-header";
import { Section } from "@/components/section";
import { EmptyState } from "@/components/feedback/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Plus, Scissors, Loader2, Package } from "@/components/icons";
import { formatCurrency } from "@/utils";
import {
  createCatalogItem,
  toggleCatalogItemStatus,
} from "@/features/settings/actions";
import type { CatalogManagementItem } from "@/features/settings/types";
import { toast } from "sonner";

interface CatalogManagementContentProps {
  initialItems: CatalogManagementItem[];
}

export function CatalogManagementContent({
  initialItems,
}: CatalogManagementContentProps) {
  const router = useRouter();
  const [items, setItems] = useState(initialItems);
  const [showAddDialog, setShowAddDialog] = useState(false);

  const [newName, setNewName] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [newType, setNewType] = useState<"service" | "product">("service");

  const [activeTab, setActiveTab] = useState<"service" | "product">("service");
  const [isPending, startTransition] = useTransition();

  const services = useMemo(
    () => items.filter((i) => i.type === "service"),
    [items],
  );
  const products = useMemo(
    () => items.filter((i) => i.type === "product"),
    [items],
  );

  const activeServices = services.filter((i) => i.status === "active");
  const inactiveServices = services.filter((i) => i.status === "inactive");

  const activeProducts = products.filter((i) => i.status === "active");
  const inactiveProducts = products.filter((i) => i.status === "inactive");

  const handleAddItem = () => {
    const priceInPaise = Math.round(Number(newPrice) * 100);
    if (!newName.trim() || priceInPaise < 100) {
      toast.error("Please enter a valid name and price (min ₹1).");
      return;
    }

    startTransition(async () => {
      const result = await createCatalogItem({
        name: newName.trim(),
        price: priceInPaise,
        type: newType,
      });
      if (result.success) {
        setItems((prev) => [result.data, ...prev]);
        setShowAddDialog(false);
        setNewName("");
        setNewPrice("");
        setNewType(activeTab); // Reset type to current tab
        toast.success(`"${result.data.name}" added to catalog.`);
      } else {
        toast.error(result.error);
      }
    });
  };

  const handleToggleStatus = (item: CatalogManagementItem) => {
    const newStatus = item.status === "active" ? "inactive" : "active";
    startTransition(async () => {
      const result = await toggleCatalogItemStatus(item.id, newStatus);
      if (result.success) {
        setItems((prev) =>
          prev.map((i) => (i.id === item.id ? result.data : i)),
        );
        toast.success(
          `"${item.name}" ${newStatus === "active" ? "activated" : "deactivated"}.`,
        );
      } else {
        toast.error(result.error);
      }
    });
  };

  return (
    <ScreenContainer>
      <PageHeader
        title="Catalog"
        subtitle={`${items.length} items`}
        onBack={() => router.back()}
        actions={
          <Button
            className="rounded-full shadow-sm font-semibold px-4"
            onClick={() => {
              setNewType(activeTab);
              setShowAddDialog(true);
            }}
          >
            <Plus className="mr-1.5 size-4" />
            Add
          </Button>
        }
      />

      <Tabs
        defaultValue="service"
        value={activeTab}
        onValueChange={(val) => setActiveTab(val as "service" | "product")}
        className="w-full"
      >
        <TabsList className="w-full grid grid-cols-2 mb-6 h-11 rounded-full bg-muted/70 p-1">
          <TabsTrigger
            value="service"
            className="rounded-full h-full font-semibold"
          >
            Services
          </TabsTrigger>
          <TabsTrigger
            value="product"
            className="rounded-full h-full font-semibold"
          >
            Products
          </TabsTrigger>
        </TabsList>

        <TabsContent value="service" className="space-y-4">
          {services.length === 0 ? (
            <EmptyState
              icon={<Scissors className="size-8 text-primary" />}
              title="No Services"
              description="Add your services to get started."
              action={
                <Button
                  className="h-12 px-6 rounded-xl font-semibold shadow-md touch-target"
                  onClick={() => {
                    setNewType("service");
                    setShowAddDialog(true);
                  }}
                >
                  <Plus className="mr-2 size-5" />
                  Add Service
                </Button>
              }
            />
          ) : (
            <>
              {activeServices.length > 0 && (
                <Section title="Active Services">
                  <div className="flex flex-col gap-2">
                    {activeServices.map((item) => (
                      <CatalogItemRow
                        key={item.id}
                        item={item}
                        onToggle={handleToggleStatus}
                        disabled={isPending}
                      />
                    ))}
                  </div>
                </Section>
              )}

              {inactiveServices.length > 0 && (
                <Section title="Inactive Services">
                  <div className="flex flex-col gap-2 opacity-70">
                    {inactiveServices.map((item) => (
                      <CatalogItemRow
                        key={item.id}
                        item={item}
                        onToggle={handleToggleStatus}
                        disabled={isPending}
                      />
                    ))}
                  </div>
                </Section>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="product" className="space-y-4">
          {products.length === 0 ? (
            <EmptyState
              icon={<Package className="size-8 text-primary" />}
              title="No Products"
              description="Add your products to get started."
              action={
                <Button
                  className="h-12 px-6 rounded-xl font-semibold shadow-md touch-target"
                  onClick={() => {
                    setNewType("product");
                    setShowAddDialog(true);
                  }}
                >
                  <Plus className="mr-2 size-5" />
                  Add Product
                </Button>
              }
            />
          ) : (
            <>
              {activeProducts.length > 0 && (
                <Section title="Active Products">
                  <div className="flex flex-col gap-2">
                    {activeProducts.map((item) => (
                      <CatalogItemRow
                        key={item.id}
                        item={item}
                        onToggle={handleToggleStatus}
                        disabled={isPending}
                      />
                    ))}
                  </div>
                </Section>
              )}

              {inactiveProducts.length > 0 && (
                <Section title="Inactive Products">
                  <div className="flex flex-col gap-2 opacity-70">
                    {inactiveProducts.map((item) => (
                      <CatalogItemRow
                        key={item.id}
                        item={item}
                        onToggle={handleToggleStatus}
                        disabled={isPending}
                      />
                    ))}
                  </div>
                </Section>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Add Item Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent
          className="rounded-2xl"
          style={{ width: "calc(100% - 32px)", maxWidth: "360px" }}
        >
          <DialogHeader>
            <DialogTitle>
              Add {newType === "service" ? "Service" : "Product"}
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="item-type">Type</Label>
              <Select
                value={newType}
                onValueChange={(val) =>
                  setNewType(val as "service" | "product")
                }
              >
                <SelectTrigger id="item-type">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="service">Service</SelectItem>
                  <SelectItem value="product">Product</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="item-name">Name</Label>
              <Input
                id="item-name"
                placeholder={
                  newType === "service"
                    ? "e.g., Haircut + Beard"
                    : "e.g., Hair Wax"
                }
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                autoFocus
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="item-price">Price (₹)</Label>
              <Input
                id="item-price"
                type="number"
                min="1"
                step="1"
                placeholder="e.g., 450"
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={handleAddItem}
              disabled={isPending}
              className="w-full h-11 rounded-xl font-semibold"
            >
              {isPending ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : null}
              Add to Catalog
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ScreenContainer>
  );
}

function CatalogItemRow({
  item,
  onToggle,
  disabled,
}: {
  item: CatalogManagementItem;
  onToggle: (item: CatalogManagementItem) => void;
  disabled: boolean;
}) {
  const isActive = item.status === "active";
  return (
    <Card className="border-0 shadow-[var(--shadow-card)] transition-all duration-200 hover:shadow-[var(--shadow-soft)]">
      <CardContent className="flex items-center gap-4 p-4">
        <div className="flex flex-1 flex-col gap-1">
          <span className="text-base font-semibold tracking-tight text-foreground">
            {item.name}
          </span>
          <div className="flex items-center gap-2.5">
            <span className="text-sm font-medium tabular-nums text-muted-foreground">
              {formatCurrency(item.price)}
            </span>
            <div className="flex items-center">
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${isActive ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400" : "bg-muted text-muted-foreground"}`}
              >
                {item.status}
              </span>
            </div>
          </div>
        </div>
        <Switch
          checked={isActive}
          onCheckedChange={() => onToggle(item)}
          disabled={disabled}
          aria-label={`Toggle ${item.name}`}
          className="scale-110 shadow-sm"
        />
      </CardContent>
    </Card>
  );
}
