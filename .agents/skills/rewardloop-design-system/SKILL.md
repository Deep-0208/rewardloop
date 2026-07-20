---
name: rewardloop-design-system
description: Internal design system guidelines for RewardLoop. Use this skill for all UI generation and frontend architecture.
---

# RewardLoop Design System

## Brand

- Premium, Modern, Minimal, Trustworthy, Fast, Elegant.
- Inspiration: Linear, Stripe, Vercel, Notion, Clerk, GitHub, Apple HIG, Material 3. Do not copy, only follow quality standards.

## Mobile Rules

- Design first for 360px, 375px, 390px, 430px viewports.
- Must be Tablet responsive.

## UX Rules

- Optimize for one-handed usage (primary actions in bottom 50%).
- Three taps maximum for core flows.
- Large touch targets (44px minimum).
- Progressive disclosure.
- Fast billing workflow & Instant feedback.
- Minimal typing & Offline-first thinking.

## Components

- Strictly use `shadcn/ui`, Radix UI, and Tailwind CSS. Avoid unnecessary custom components.
- Rely on: Cards, Bottom Sheets, Dialogs, Popovers, Command Menu, Skeleton Loading, Toasts, Empty States, Error States, Inline Validation.

## Style & Colors

- Semantic colors only (Primary, Success, Warning, Error, Info, Surface, Background, Text, Border).
- Support Light Mode and Dark Mode. Maintain excellent contrast.

## Typography

- Inter font. Proper type scale and consistent spacing. Readable hierarchy.

## Animations & Accessibility

- Use only meaningful motion (150–250ms). Respect `prefers-reduced-motion`.
- Always meet WCAG AA. Keyboard navigation, focus indicators, screen readers, ARIA labels, semantic HTML.

## Performance

- Optimize for PWA, offline support, lazy loading, code splitting, Server Components, Optimistic UI, and fast initial render.
