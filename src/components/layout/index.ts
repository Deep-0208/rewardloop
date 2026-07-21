/**
 * Layout — Barrel export for all layout components.
 *
 * Includes both new layout primitives and re-exports of existing
 * layout components that remain at their original paths for compatibility.
 */

export { Stack } from "./stack";
export { Grid } from "./grid";
export { Spacer } from "./spacer";
export { StickyCTA } from "./sticky-cta";

/* Re-export existing layout components from their original locations */
export { AppShell } from "@/components/app-shell";
export { ScreenContainer } from "@/components/screen-container";
export { Section } from "@/components/section";
export { Divider } from "@/components/divider";
export { PageHeader } from "@/components/page-header";
