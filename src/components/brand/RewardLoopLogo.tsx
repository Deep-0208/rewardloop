import * as React from "react";
import { RewardLoopIcon } from "./RewardLoopIcon";

export interface RewardLoopLogoProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Logo layout variant */
  variant?: "primary" | "horizontal" | "vertical" | "icon";
  /** Color theme context */
  theme?: "light" | "dark" | "monochrome-white" | "monochrome-black";
  /** Icon size scale */
  size?: "sm" | "md" | "lg" | number;
  /** Show tagline below wordmark */
  showTagline?: boolean;
}

/**
 * RewardLoop Official Brand Logo — Directly renders the official PNG logo mark with typography
 */
export const RewardLoopLogo = React.forwardRef<
  HTMLDivElement,
  RewardLoopLogoProps
>(
  (
    {
      variant = "primary",
      theme = "light",
      size = "md",
      showTagline = false,
      className = "",
      style,
      ...props
    },
    ref,
  ) => {
    const iconSizeMap = { sm: 28, md: 36, lg: 48 };
    const fontSizeMap = { sm: "text-lg", md: "text-xl", lg: "text-3xl" };

    const iconSize = typeof size === "number" ? size : iconSizeMap[size] || 36;
    const fontClass = typeof size === "string" ? fontSizeMap[size] : "text-xl";

    const textPrimaryColor =
      theme === "dark" || theme === "monochrome-white"
        ? "#FFFFFF"
        : theme === "monochrome-black"
          ? "#000000"
          : "#111827";

    const textAccentColor =
      theme === "dark"
        ? "#6366F1"
        : theme === "monochrome-white"
          ? "#FFFFFF"
          : theme === "monochrome-black"
            ? "#000000"
            : "#4F46E5";

    if (variant === "icon") {
      return (
        <div
          ref={ref}
          className={`inline-flex items-center justify-center ${className}`}
          style={style}
          {...props}
        >
          <RewardLoopIcon size={iconSize} />
        </div>
      );
    }

    const isVertical = variant === "vertical";

    return (
      <div
        ref={ref}
        className={`inline-flex ${
          isVertical
            ? "flex-col items-center text-center"
            : "flex-row items-center"
        } gap-2.5 select-none ${className}`}
        style={style}
        {...props}
      >
        <RewardLoopIcon size={iconSize} />
        <div className="flex flex-col leading-none">
          <div className={`font-semibold tracking-tight ${fontClass}`}>
            <span style={{ color: textPrimaryColor, fontWeight: 600 }}>
              Reward
            </span>
            <span style={{ color: textAccentColor, fontWeight: 700 }}>
              Loop
            </span>
          </div>
          {showTagline && (
            <span
              className="text-xs font-normal mt-1"
              style={{ color: theme === "dark" ? "#94A3B8" : "#6B7280" }}
            >
              Loyalty Engine
            </span>
          )}
        </div>
      </div>
    );
  },
);

RewardLoopLogo.displayName = "RewardLoopLogo";
