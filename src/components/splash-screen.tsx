"use client";

/**
 * SplashScreen — Premium PWA splash with auth routing.
 *
 * Design System Compliance:
 * - Uses semantic tokens (--primary, --background, --foreground, etc.)
 * - Inter font via CSS variable (--font-sans)
 * - 150–250ms animation durations per motion guidelines
 * - Respects prefers-reduced-motion
 * - Dark mode aware via design tokens
 * - Mobile-first (360–430px)
 *
 * Flow:
 * - Staggered fade-in of logo → name → tagline → loader
 * - Auth check runs in parallel
 * - Minimum 800ms display, then fade out → navigate
 */

import { useEffect, useState, useId } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ROUTES } from "@/constants/routes";
import { RewardLoopIcon } from "@/components/brand";

/** Minimum splash display time (ms) to prevent flicker */
const MIN_SPLASH_MS = 800;

export function SplashScreen() {
  const router = useRouter();
  const [visible, setVisible] = useState(true);
  const scopeId = useId();

  useEffect(() => {
    const startTime = Date.now();

    async function resolveAuth() {
      let destination: string = ROUTES.LOGIN;

      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          destination = ROUTES.DASHBOARD;
        }
      } catch {
        // Auth check failed — fall through to login
      }

      // Ensure minimum splash duration for a polished feel
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, MIN_SPLASH_MS - elapsed);

      await new Promise((resolve) => setTimeout(resolve, remaining));

      // Fade out, then navigate
      setVisible(false);
      // Wait for fade-out transition to complete before navigating
      await new Promise((resolve) => setTimeout(resolve, 250));
      router.replace(destination);
    }

    resolveAuth();
  }, [router]);

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
            /* ─── Splash Keyframes ─── */
            @keyframes _splashEntry {
              from {
                opacity: 0;
                transform: translateY(8px) scale(0.96);
              }
              to {
                opacity: 1;
                transform: translateY(0) scale(1);
              }
            }

            @keyframes _splashGlow {
              0%, 100% {
                opacity: 0.4;
                transform: translate(-50%, -50%) scale(1);
              }
              50% {
                opacity: 0.7;
                transform: translate(-50%, -50%) scale(1.15);
              }
            }

            @keyframes _dotPulse {
              0%, 80%, 100% {
                opacity: 0.25;
                transform: scale(0.8);
              }
              40% {
                opacity: 1;
                transform: scale(1);
              }
            }

            @keyframes _splashFadeOut {
              to {
                opacity: 0;
                transform: scale(1.02);
              }
            }

            /* Respect reduced motion */
            @media (prefers-reduced-motion: reduce) {
              [data-splash-scope] * {
                animation-duration: 0.01ms !important;
                animation-iteration-count: 1 !important;
                transition-duration: 0.01ms !important;
              }
            }
          `,
        }}
      />
      <div
        id="splash-screen"
        data-scope={scopeId}
        data-splash-scope
        className="fixed inset-0 z-50 flex flex-col items-center justify-center"
        style={{
          backgroundColor: "var(--background, #F8FAFC)",
          opacity: visible ? 1 : 0,
          transform: visible ? "scale(1)" : "scale(1.02)",
          transition: "opacity 250ms ease-out, transform 250ms ease-out",
        }}
        role="status"
        aria-label="Loading RewardLoop"
      >
        {/* ─── Logo + Branding ─── */}
        <div className="flex flex-col items-center" style={{ gap: "16px" }}>
          {/* Logo mark — stagger delay: 0ms */}
          <div
            style={{
              animation:
                "_splashEntry 250ms cubic-bezier(0.16, 1, 0.3, 1) 0ms both",
            }}
          >
            <RewardLoopIcon size={76} className="rounded-[22px]" />
          </div>

          {/* App name — stagger delay: 80ms */}
          <h1
            style={{
              animation:
                "_splashEntry 250ms cubic-bezier(0.16, 1, 0.3, 1) 80ms both",
              color: "var(--foreground, #111827)",
              fontFamily: "var(--font-sans, 'Inter', sans-serif)",
              fontSize: "1.75rem",
              letterSpacing: "-0.03em",
              lineHeight: 1.2,
              margin: 0,
            }}
          >
            <span style={{ fontWeight: 600 }}>Reward</span>
            <span style={{ color: "var(--primary, #4F46E5)", fontWeight: 700 }}>
              Loop
            </span>
          </h1>

          {/* Tagline — stagger delay: 150ms */}
          <p
            style={{
              animation:
                "_splashEntry 250ms cubic-bezier(0.16, 1, 0.3, 1) 150ms both",
              color: "var(--muted-foreground, #6B7280)",
              fontFamily: "var(--font-sans, 'Inter', sans-serif)",
              fontSize: "0.875rem",
              fontWeight: 500,
              letterSpacing: "0.01em",
              lineHeight: 1.5,
              margin: 0,
            }}
          >
            Reward your regulars
          </p>
        </div>

        {/* ─── Dot Pulse Loader ─── */}
        <div
          className="absolute flex items-center justify-center"
          style={{
            bottom: "80px",
            left: "50%",
            transform: "translateX(-50%)",
            gap: "8px",
            animation:
              "_splashEntry 250ms cubic-bezier(0.16, 1, 0.3, 1) 250ms both",
          }}
        >
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                backgroundColor: "var(--primary, #4F46E5)",
                animation: `_dotPulse 1.2s ease-in-out ${i * 160}ms infinite`,
              }}
            />
          ))}
        </div>
      </div>
    </>
  );
}
