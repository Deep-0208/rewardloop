/**
 * RewardLoop — Typography System.
 *
 * Reusable typography components matching the font scale
 * from 09_UI_UX_Specification.md §05.
 *
 * All support: `as` prop, `className`, `muted`, `tabular`
 */

import { cn } from "@/lib/utils";
import type { ElementType, ReactNode } from "react";

interface TypographyProps {
  children: ReactNode;
  className?: string;
  /** Render as a different HTML element */
  as?: ElementType;
  /** Use muted (secondary) text color */
  muted?: boolean;
  /** Use tabular-nums for currency/analytics */
  tabular?: boolean;
}

/** Display — 32px/40px bold. Prices, hero numbers. */
export function Display({
  children,
  className,
  as: Tag = "p",
  muted,
  tabular,
}: TypographyProps) {
  return (
    <Tag
      className={cn(
        "text-[32px] leading-[40px] font-bold tracking-tight",
        muted ? "text-muted-foreground" : "text-foreground",
        tabular && "tabular-nums",
        className,
      )}
    >
      {children}
    </Tag>
  );
}

/** Heading — 28px/36px bold. Page headings (h1). */
export function Heading({
  children,
  className,
  as: Tag = "h1",
  muted,
  tabular,
}: TypographyProps) {
  return (
    <Tag
      className={cn(
        "text-[28px] leading-[36px] font-bold tracking-tight",
        muted ? "text-muted-foreground" : "text-foreground",
        tabular && "tabular-nums",
        className,
      )}
    >
      {children}
    </Tag>
  );
}

/** Title — 24px/32px semibold. Section titles (h2). */
export function Title({
  children,
  className,
  as: Tag = "h2",
  muted,
  tabular,
}: TypographyProps) {
  return (
    <Tag
      className={cn(
        "text-[24px] leading-[32px] font-semibold",
        muted ? "text-muted-foreground" : "text-foreground",
        tabular && "tabular-nums",
        className,
      )}
    >
      {children}
    </Tag>
  );
}

/** Subtitle — 20px/28px semibold. Sub-sections (h3). */
export function Subtitle({
  children,
  className,
  as: Tag = "h3",
  muted,
  tabular,
}: TypographyProps) {
  return (
    <Tag
      className={cn(
        "text-[20px] leading-[28px] font-semibold",
        muted ? "text-muted-foreground" : "text-foreground",
        tabular && "tabular-nums",
        className,
      )}
    >
      {children}
    </Tag>
  );
}

/** BodyLarge — 18px/28px regular. Emphasized body text. */
export function BodyLarge({
  children,
  className,
  as: Tag = "p",
  muted,
  tabular,
}: TypographyProps) {
  return (
    <Tag
      className={cn(
        "text-[18px] leading-[28px]",
        muted ? "text-muted-foreground" : "text-foreground",
        tabular && "tabular-nums",
        className,
      )}
    >
      {children}
    </Tag>
  );
}

/** Body — 16px/24px regular. Default body text. */
export function Body({
  children,
  className,
  as: Tag = "p",
  muted,
  tabular,
}: TypographyProps) {
  return (
    <Tag
      className={cn(
        "text-base leading-6",
        muted ? "text-muted-foreground" : "text-foreground",
        tabular && "tabular-nums",
        className,
      )}
    >
      {children}
    </Tag>
  );
}

/** Label — 14px/20px medium. Form labels. */
export function Label({
  children,
  className,
  as: Tag = "span",
  muted,
  tabular,
}: TypographyProps) {
  return (
    <Tag
      className={cn(
        "text-sm leading-5 font-medium",
        muted ? "text-muted-foreground" : "text-foreground",
        tabular && "tabular-nums",
        className,
      )}
    >
      {children}
    </Tag>
  );
}

/** Caption — 12px/16px regular. Secondary info, timestamps. */
export function Caption({
  children,
  className,
  as: Tag = "span",
  muted = true,
  tabular,
}: TypographyProps) {
  return (
    <Tag
      className={cn(
        "text-xs leading-4",
        muted ? "text-muted-foreground" : "text-foreground",
        tabular && "tabular-nums",
        className,
      )}
    >
      {children}
    </Tag>
  );
}

/** Tiny — 11px/14px regular. Timestamps, fine print. */
export function Tiny({
  children,
  className,
  as: Tag = "span",
  muted = true,
  tabular,
}: TypographyProps) {
  return (
    <Tag
      className={cn(
        "text-[11px] leading-[14px]",
        muted ? "text-muted-foreground" : "text-foreground",
        tabular && "tabular-nums",
        className,
      )}
    >
      {children}
    </Tag>
  );
}
