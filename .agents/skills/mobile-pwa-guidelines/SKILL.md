---
name: mobile-pwa-guidelines
description: Use this skill for building Progressive Web Apps (PWAs), ensuring mobile-first responsive design, Apple HIG, and Material 3 compliance.
---

# Mobile PWA Guidelines

## Design Rules

1. **Touch Targets (Apple HIG):** Minimum 44x44px for all interactive elements to ensure thumb-friendliness.
2. **Bottom Navigation (Material 3):** Use bottom sheets and bottom navigation bars for primary actions on mobile, keeping them within reach.
3. **One-hand Usage:** Place critical actions within the bottom 50% of the screen. Minimize typing by using smart defaults and selection chips.

## PWA & Responsiveness

- **Viewports:** Design primarily for 360px, 375px, 390px, and 430px widths before scaling up.
- **Offline States:** Always design empty states, error states, and offline fallbacks.
- **App-like Feel:** Disable text selection (`select-none`) on UI elements. Prevent pull-to-refresh on scrollable overlays.
