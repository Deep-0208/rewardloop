"use client";

import { useRouter, usePathname } from "next/navigation";

interface BottomNavProps {
  onAddVisit?: () => void;
}

const TAB_ROUTES: Record<string, string> = {
  "nav-home": "/dashboard",
  "nav-transactions": "/sales",
  "nav-insights": "/insights",
  "nav-more": "/more",
};

const tabs = [
  {
    id: "nav-home",
    label: "Home",
    icon: (active: boolean) => (
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill={active ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z" />
        <path d="M9 21V12h6v9" />
      </svg>
    ),
  },
  {
    id: "nav-transactions",
    label: "Sales",
    icon: (active: boolean) => (
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect
          x="3"
          y="4"
          width="18"
          height="18"
          rx="2"
          fill={active ? "currentColor" : "none"}
          opacity={active ? 0.15 : 1}
        />
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <path d="M3 10h18" />
        <path d="M7 15h4" />
      </svg>
    ),
  },
  {
    id: "nav-add-visit",
    label: "",
    icon: null,
    isCenter: true,
  },
  {
    id: "nav-insights",
    label: "Insights",
    icon: (active: boolean) => (
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
        {active && (
          <>
            <rect
              x="4"
              y="12"
              width="4"
              height="10"
              fill="currentColor"
              opacity="0.15"
              stroke="none"
            />
            <rect
              x="10"
              y="2"
              width="4"
              height="20"
              fill="currentColor"
              opacity="0.15"
              stroke="none"
            />
            <rect
              x="16"
              y="8"
              width="4"
              height="14"
              fill="currentColor"
              opacity="0.15"
              stroke="none"
            />
          </>
        )}
      </svg>
    ),
  },
  {
    id: "nav-more",
    label: "More",
    icon: (active: boolean) => (
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle
          cx="12"
          cy="6"
          r={active ? "2" : "1.5"}
          fill={active ? "currentColor" : "none"}
        />
        <circle
          cx="12"
          cy="12"
          r={active ? "2" : "1.5"}
          fill={active ? "currentColor" : "none"}
        />
        <circle
          cx="12"
          cy="18"
          r={active ? "2" : "1.5"}
          fill={active ? "currentColor" : "none"}
        />
      </svg>
    ),
  },
];

function getActiveTabFromPath(pathname: string): string {
  if (pathname.startsWith("/sales")) return "nav-transactions";
  if (pathname.startsWith("/insights")) return "nav-insights";
  if (pathname.startsWith("/more")) return "nav-more";
  return "nav-home";
}

export function BottomNav({ onAddVisit }: BottomNavProps) {
  const router = useRouter();
  const pathname = usePathname();
  const activeTab = getActiveTabFromPath(pathname);

  // Hide the bottom navigation when the user is in the visit wizard
  if (pathname.startsWith("/visit")) {
    return null;
  }

  const handleTabClick = (tabId: string) => {
    const route = TAB_ROUTES[tabId];
    if (route && route !== pathname) {
      router.push(route);
    }
  };

  return (
    <nav
      className="
        fixed bottom-5 left-1/2 -translate-x-1/2 z-50
        w-[calc(100%-2.5rem)] max-w-[480px] sm:max-w-[560px] h-[72px]
        bg-card/85 backdrop-blur-2xl
        shadow-[var(--shadow-float)] border border-border/40
        rounded-3xl
        flex items-center justify-around
        px-2
      "
      aria-label="Main navigation"
    >
      {tabs.map((tab) => {
        if (tab.isCenter) {
          return (
            <div
              key={tab.id}
              className="relative flex flex-col items-center justify-center min-w-[60px] h-full"
            >
              <button
                id={tab.id}
                type="button"
                onClick={onAddVisit || (() => router.push("/visit"))}
                className="
                  absolute -top-5
                  flex items-center justify-center
                  w-[56px] h-[56px]
                  bg-primary rounded-full
                  text-primary-foreground
                  border-[4px] border-card
                  shadow-[0_8px_16px_-4px_rgba(79,70,229,0.3)]
                  transition-all duration-200
                  active:scale-90
                  cursor-pointer
                  hover:brightness-110
                "
                aria-label="Add Visit"
              >
                <svg
                  width="26"
                  height="26"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                >
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </button>
            </div>
          );
        }

        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            id={tab.id}
            type="button"
            onClick={() => handleTabClick(tab.id)}
            className={`
              flex flex-col items-center justify-center
              w-[60px] h-full gap-[3px]
              transition-all duration-150
              cursor-pointer select-none relative
              ${isActive ? "text-primary" : "text-muted-foreground/70 hover:text-muted-foreground"}
            `}
            aria-label={tab.label}
            aria-current={isActive ? "page" : undefined}
          >
            {tab.icon && tab.icon(isActive)}
            <span
              className={`text-[10px] font-semibold leading-none ${isActive ? "text-primary" : ""}`}
            >
              {tab.label}
            </span>
            {isActive && (
              <div className="absolute bottom-[6px] w-8 h-0.5 rounded-full bg-primary" />
            )}
          </button>
        );
      })}
    </nav>
  );
}
