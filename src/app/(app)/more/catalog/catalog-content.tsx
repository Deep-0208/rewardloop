"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ScreenContainer } from "@/components/screen-container";
import { PageHeader } from "@/components/page-header";
import { Section } from "@/components/section";
import { EmptyState } from "@/components/feedback/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { Plus, Scissors, Loader2 } from "@/components/icons";
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

/**
 * CatalogManagementContent — Interactive catalog CRUD interface.
 *
 * Supports adding new items and toggling active/inactive status.
 */
export function CatalogManagementContent({
  initialItems,
}: CatalogManagementContentProps) {
  const router = useRouter();
  const [items, setItems] = useState(initialItems);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [isPending, startTransition] = useTransition();

  const activeItems = items.filter((i) => i.status === "active");
  const inactiveItems = items.filter((i) => i.status === "inactive");

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
        type: "service",
      });
      if (result.success) {
        setItems((prev) => [result.data, ...prev]);
        setShowAddDialog(false);
        setNewName("");
        setNewPrice("");
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
        title="Service Catalog"
        subtitle={`${activeItems.length} active, ${inactiveItems.length} inactive`}
        onBack={() => router.push("/more")}
        actions={
          <Button
            size="sm"
            className="rounded-xl"
            onClick={() => setShowAddDialog(true)}
          >
            <Plus className="mr-1 size-4" />
            Add
          </Button>
        }
      />

      {items.length === 0 ? (
        <EmptyState
          icon={<Scissors className="size-8 text-primary" />}
          title="No Catalog Items"
          description="Add your salon services and products to get started."
          action={
            <Button
              className="h-12 px-6 rounded-xl font-semibold shadow-md touch-target"
              onClick={() => setShowAddDialog(true)}
            >
              <Plus className="mr-2 size-5" />
              Add First Item
            </Button>
          }
        />
      ) : (
        <>
          {activeItems.length > 0 && (
            <Section title="Active">
              <div className="flex flex-col gap-2">
                {activeItems.map((item) => (
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

          {inactiveItems.length > 0 && (
            <Section title="Inactive">
              <div className="flex flex-col gap-2">
                {inactiveItems.map((item) => (
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

      {/* Add Item Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-[360px] rounded-2xl">
          <DialogHeader>
            <DialogTitle>Add Service</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="item-name">Service Name</Label>
              <Input
                id="item-name"
                placeholder="e.g., Haircut + Beard"
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

/** A single catalog item row with toggle switch. */
function CatalogItemRow({
  item,
  onToggle,
  disabled,
}: {
  item: CatalogManagementItem;
  onToggle: (item: CatalogManagementItem) => void;
  disabled: boolean;
}) {
  return (
    <Card className="border border-border">
      <CardContent className="flex items-center gap-3 p-4">
        <div className="flex flex-1 flex-col gap-0.5">
          <span className="text-sm font-medium text-foreground">
            {item.name}
          </span>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold tabular-nums text-foreground">
              {formatCurrency(item.price)}
            </span>
            <Badge
              variant={item.status === "active" ? "default" : "secondary"}
              className="h-5 px-1.5 text-[10px] font-medium"
            >
              {item.status}
            </Badge>
          </div>
        </div>
        <Switch
          checked={item.status === "active"}
          onCheckedChange={() => onToggle(item)}
          disabled={disabled}
          aria-label={`Toggle ${item.name}`}
        />
      </CardContent>
    </Card>
  );
}
