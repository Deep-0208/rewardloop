---
name: shadcn-ui-expert
description: Use this skill for implementing UI components using Tailwind CSS and shadcn/ui, focusing on accessibility and Vercel/Linear aesthetics.
---

# shadcn/ui & UI Design Expert

## Core Principles

1. **Tailwind First:** Use standard shadcn/ui components and utility classes. Do not write custom CSS.
2. **Aesthetics:** Emulate the minimal, high-contrast, premium feel of Vercel and Linear. Use subtle borders (e.g., `border-border/50`), deep shadows for elevation, and clean typography.
3. **Radix Primitives:** Leverage Radix UI under the hood for robust accessibility.

## Accessibility (A11y)

- All components must be fully keyboard navigable (focus rings using `focus-visible:ring`).
- Enforce WCAG AA color contrast requirements.
- Use ARIA roles (`aria-expanded`, `aria-hidden`) correctly on interactive components.
