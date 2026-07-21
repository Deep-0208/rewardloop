"use client";

/**
 * BottomSheet — Bottom sheet wrapper around shadcn Drawer.
 *
 * Adds grab handle, 20px top corners, max-height 90%, backdrop dismiss.
 * Source: 09_UI_UX_Specification §16 — Bottom Sheets
 */

import { cn } from "@/lib/utils";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerTrigger,
  DrawerClose,
} from "@/components/ui/drawer";
import type { ReactNode } from "react";

interface BottomSheetProps {
  /** Controlled open state */
  open?: boolean;
  /** Called when open state changes */
  onOpenChange?: (open: boolean) => void;
  /** Trigger element (uncontrolled mode) */
  trigger?: ReactNode;
  /** Sheet title (required for accessibility) */
  title: string;
  /** Optional description */
  description?: string;
  /** Sheet content */
  children: ReactNode;
  /** Footer actions */
  footer?: ReactNode;
  className?: string;
}

export function BottomSheet({
  open,
  onOpenChange,
  trigger,
  title,
  description,
  children,
  footer,
  className,
}: BottomSheetProps) {
  return (
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
      showSwipeHandle
      swipeDirection="down"
    >
      {trigger ? <DrawerTrigger>{trigger}</DrawerTrigger> : null}
      <DrawerContent className={cn("max-h-[90dvh]", className)}>
        <DrawerHeader>
          <DrawerTitle>{title}</DrawerTitle>
          {description ? (
            <DrawerDescription>{description}</DrawerDescription>
          ) : null}
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-2">
          {children}
        </div>

        {footer ? <DrawerFooter>{footer}</DrawerFooter> : null}
      </DrawerContent>
    </Drawer>
  );
}

/* Re-export primitives for advanced usage */
export {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerTrigger,
  DrawerClose,
};
