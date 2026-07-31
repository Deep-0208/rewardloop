"use client";

import type { DashboardKpis } from "../types";
import { formatCurrency } from "@/utils";
import { ReactNode } from "react";

interface KpiGridProps {
  kpis: DashboardKpis;
}

export function KpiGrid({ kpis }: KpiGridProps) {
  return (
    <section
      className="px-5 mt-4 animate-fade-in"
      style={{ animationDelay: "50ms" }}
      aria-label="Today's metrics"
    >
      <div className="flex flex-col gap-3">
        {/* Hero Revenue Card */}
        <MetricCard
          id="metric-revenue"
          label="Revenue Today"
          value={formatCurrency(kpis.todayRevenuePaise)}
          variant="hero"
        />

        {/* Secondary Metric Cards */}
        <div className="grid grid-cols-2 gap-3">
          <MetricCard
            id="metric-visits"
            label="Visits Today"
            value={String(kpis.todayTransactions)}
            icon={<CustomersIcon />}
          />
          <MetricCard
            id="metric-rewards"
            label="Rewards Redeemed"
            value={formatCurrency(kpis.todayRewardsRedeemedPaise)}
            icon={<RewardsIcon />}
            accentColor="var(--color-success)"
            accentBg="var(--color-success-light)"
          />
        </div>
      </div>
    </section>
  );
}

// --- Internal MetricCard Component (Ported from Reference) ---
type MetricCardProps = {
  id: string;
  label: string;
  value: string;
  variant?: "hero" | "default";
  icon?: ReactNode;
  accentColor?: string;
  accentBg?: string;
};

function MetricCard({
  id,
  label,
  value,
  variant = "default",
  icon,
  accentColor = "var(--primary)",
  accentBg = "var(--color-primary-light)",
}: MetricCardProps) {
  if (variant === "hero") {
    return (
      <div
        id={id}
        className="
          w-full bg-card rounded-[var(--radius-hero)]
          px-6 py-5
          shadow-[var(--shadow-hero)]
          flex items-start gap-4
          relative overflow-hidden border border-border/20
        "
      >
        {/* Accent bar */}
        <div
          className="absolute left-0 top-4 bottom-4 w-[3px] rounded-r-full"
          style={{ backgroundColor: accentColor }}
        />

        <div className="flex flex-col items-start pl-3">
          <span className="text-[11px] font-semibold text-muted-foreground mb-2 uppercase tracking-wider">
            {label}
          </span>
          <span className="text-[36px] font-extrabold tracking-tighter text-foreground tabular-nums leading-none">
            {value}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      id={id}
      className="
        bg-card rounded-[var(--radius-card)]
        px-4 py-4
        shadow-[var(--shadow-card)]
        flex flex-col items-start w-full border border-border/30
      "
    >
      {icon && (
        <div
          className="flex-shrink-0 w-8 h-8 rounded-[10px] flex items-center justify-center mb-3"
          style={{ backgroundColor: accentBg }}
        >
          <span
            style={{ color: accentColor }}
            className="[&>svg]:w-[16px] [&>svg]:h-[16px]"
          >
            {icon}
          </span>
        </div>
      )}

      <div className="flex flex-col items-start min-w-0">
        <span className="text-[11px] font-medium text-muted-foreground mb-1">
          {label}
        </span>
        <span className="text-[22px] font-bold text-foreground leading-none tabular-nums tracking-tight">
          {value}
        </span>
      </div>
    </div>
  );
}

// ── Icons ──
function CustomersIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function RewardsIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="8" r="6" />
      <path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11" />
    </svg>
  );
}
