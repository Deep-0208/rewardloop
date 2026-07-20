---
name: motion-guidelines
description: Use this skill to govern animation and transitions across the application.
---

# Motion Guidelines

## Rules

- **Duration:** 150–250ms for all animations.
- **Purpose:** Use motion only when it improves usability (e.g., expanding a card, sliding a bottom sheet). Avoid purely decorative animations.
- **Accessibility:** Respect `prefers-reduced-motion: reduce`.
- **Implementation:** Use the `motion` library for all complex animations in React/Next.js. Use Tailwind `transition-all duration-200` for simple hover states.
