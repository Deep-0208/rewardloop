import * as React from "react";

export interface RewardLoopIconProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  /** Size in pixels or string (defaults to 32) */
  size?: number | string;
}

/**
 * RewardLoop Official Brand Icon — Directly renders the official PNG logo mark.
 */
export const RewardLoopIcon: React.FC<RewardLoopIconProps> = ({
  size = 32,
  className = "",
  style,
  alt = "RewardLoop Logo",
  ...props
}) => {
  const dimension = typeof size === "number" ? `${size}px` : size;

  return (
    <img
      src="/logo.png"
      alt={alt}
      width={typeof size === "number" ? size : undefined}
      height={typeof size === "number" ? size : undefined}
      className={`object-contain flex-shrink-0 ${className}`}
      style={{
        width: dimension,
        height: dimension,
        display: "inline-block",
        verticalAlign: "middle",
        ...style,
      }}
      {...props}
    />
  );
};
