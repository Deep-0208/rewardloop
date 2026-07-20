# RewardLoop Design System & UI/UX Source of Truth

This is the permanent Project Design System for RewardLoop, integrating premium SaaS aesthetics, mobile-first PWA standards, and enterprise-grade performance.

---

## 1. Design Principles

- **Minimal & Elegant:** Let the content breathe. High contrast, clean lines, and deep focus on user tasks (Linear/Vercel inspired).
- **Fast & Reliable:** Instant feedback, optimistic UI, and offline-first capabilities.
- **Mobile-First PWA:** Designed for 360px-430px viewports with one-handed usability as a strict requirement.
- **Accessible:** Strict WCAG AA compliance.

---

## 2. Color System (Semantic Only)

All colors must support Light and Dark modes via CSS variables (shadcn/ui standard).

- **Primary:** Deep brand color for primary actions. High contrast against backgrounds.
- **Success:** Emerald/Green.
- **Warning:** Amber/Yellow.
- **Error:** Destructive Red.
- **Info:** Blue.
- **Surface / Background:** `#FFFFFF` to `#09090B`. Subtle 1px borders for elevation.
- **Text:** High contrast primary text, legible muted text for secondary information.

---

## 3. Typography Scale (Inter)

- `h1`: 36px (Mobile) / 48px (Desktop). Tight tracking, bold.
- `h2`: 24px (Mobile) / 32px (Desktop). Semibold.
- `body`: 16px (Mobile/Desktop). 1.5 line height.
- `small`: 12px. Muted text.

---

## 4. Spacing System

- 4px Grid: `4, 8, 12, 16, 24, 32, 48, 64`. Use Tailwind classes (`p-4`, `m-2`, `gap-6`).

---

## 5. Elevation Rules & Border Radius

- **Radius:**
  - Inputs/Buttons: `rounded-md` (6px) or `rounded-lg` (8px).
  - Cards/Modals: `rounded-xl` (12px).
- **Elevation:**
  - Cards: Flat with a 1px border. No drop shadows.
  - Dropdowns: `shadow-md` + 1px border.
  - Modals/Bottom Sheets: `shadow-lg` + dark backdrop.

---

## 6. Icons

- Lucide React (standard with shadcn/ui). Use `stroke-width=2` for clarity at small sizes.

---

## 7. Component Guidelines

- **Strictly use shadcn/ui and Radix.** No custom CSS.
- Use Skeleton Loading for dynamic data. Avoid spinners.
- Use Toasts for transient success/error messages.

---

## 8. Form Design

- Inline validation (Zod). Show errors immediately on blur.
- Auto-focus primary inputs on desktop.
- No typing if selection chips or dropdowns can be used (mobile optimization).

---

## 9. Navigation Rules

- **Mobile:** Bottom Navigation Bar.
- **Desktop:** Sidebar or clean Top Navbar.
- **Complex Actions:** Command Menu (CMD+K) for power users.

---

## 10. Dashboard Layout (SaaS)

- KPI Cards at the top (Stripe style).
- High-density tables below. Sticky headers.
- Three taps maximum to reach any billing or core function.

---

## 11. Mobile Layout (PWA)

- **Viewports:** 360, 375, 390, 430px.
- **Touch Targets:** 44px minimum height for ALL buttons/links.
- **One-Handed:** Primary CTAs must sit in the bottom 50% of the screen. Bottom Sheets over Modals.

---

## 12. Accessibility Rules

- WCAG AA Contrast.
- Keyboard navigation with clear `focus-visible:ring-2`.
- Semantic HTML (`<nav>`, `<main>`, `<article>`).
- ARIA labels on all icon-only buttons.

---

## 13. Motion Guidelines

- **Duration:** 150–250ms.
- **Usage:** Only meaningful motion (e.g., expanding a card, sliding a bottom sheet, hover states).
- **Accessibility:** Respect `prefers-reduced-motion: reduce`. Disable animations if true.

---

## 14. Responsive Breakpoints

- `sm`: 640px (Large Phones/Phablets)
- `md`: 768px (Tablets)
- `lg`: 1024px (Laptops)
- `xl`: 1280px (Desktops)
