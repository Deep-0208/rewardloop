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
      className="px-[var(--spacing-md)] mt-[var(--spacing-sm)] animate-fade-in"
      style={{ animationDelay: "50ms" }}
      aria-label="Today's metrics"
    >
      <div className="flex flex-col gap-[var(--spacing-sm)]">
        {/* Hero Revenue Card */}
        <MetricCard
          id="metric-revenue"
          label="Revenue Today"
          value={formatCurrency(kpis.todayRevenuePaise)}
          variant="hero"
        />

        {/* Secondary Metric Cards */}
        <div className="grid grid-cols-2 gap-[var(--spacing-s)]">
          <MetricCard
            id="metric-visits"
            label="Visits Today"
            value={String(kpis.todayTransactions)}
            icon={<CustomersIcon />}
          />
          <MetricCard
            id="metric-rewards"
            label="Rewards Issued"
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
          p-[var(--spacing-lg)]
          shadow-[var(--shadow-hero)]
          flex items-start gap-[var(--spacing-sm)]
          relative overflow-hidden border border-border/10
        "
      >
        {/* Accent bar */}
        <div
          className="absolute left-0 top-[16px] bottom-[16px] w-[4px] rounded-r-full"
          style={{ backgroundColor: accentColor }}
        />

        <div className="flex flex-col items-start pl-[var(--spacing-s)]">
          <span className="text-[13px] font-semibold text-[var(--color-text-tertiary)] mb-[var(--spacing-xs)] uppercase tracking-wider">
            {label}
          </span>
          <span className="text-[48px] font-extrabold tracking-tighter text-[var(--color-text-primary)] tabular-nums leading-none">
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
        p-[var(--spacing-md)]
        shadow-[var(--shadow-soft)]
        flex flex-col items-start w-full border border-border/10
      "
    >
      {icon && (
        <div
          className="flex-shrink-0 w-9 h-9 rounded-[12px] flex items-center justify-center mb-[var(--spacing-s)]"
          style={{ backgroundColor: accentBg }}
        >
          <span
            style={{ color: accentColor }}
            className="[&>svg]:w-[18px] [&>svg]:h-[18px]"
          >
            {icon}
          </span>
        </div>
      )}

      <div className="flex flex-col items-start min-w-0">
        <span className="text-[12px] font-medium text-[var(--color-text-secondary)] mb-[var(--spacing-2xs)]">
          {label}
        </span>
        <span className="text-[26px] font-bold text-[var(--color-text-primary)] leading-none tabular-nums tracking-tight">
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
