# UI / UX Design System

## 1. Design Philosophy

- **Premium & Professional:** High trust, clean execution.
- **Fast & Minimal:** Speed over decoration.
- **Mobile-first PWA:** Optimized for 360px - 430px devices.
- **Inspiration:** Linear, Stripe, Vercel, Notion, Clerk, GitHub, Apple HIG, Material Design 3.

## 2. Color System

- **Semantic Tokens Only:** (Supports Light & Dark modes natively via CSS variables)
- `primary`: The brand color.
- `secondary`: Subdued actions.
- `accent`: Highlights.
- `background`: `#ffffff` / `#09090b`.
- `surface`: `#fafafa` / `#18181b`.
- `text`: High contrast.
- `success`, `warning`, `error`, `info`.
- `border`: Subtle lines separating content.

## 3. Typography (Inter)

- **Scale:**
  - H1: 36px/48px, bold, tight tracking.
  - H2: 24px/32px, semibold.
  - Body: 16px (Mobile for accessibility) / 14px (Desktop).
- **Line Heights:** 1.5 for body, 1.2 for headings.

## 4. Spacing, Elevation & Motion

- **Grid:** 4px baseline (`p-1` to `p-16`).
- **Container:** `max-w-md` for auth, `max-w-screen-xl` for dashboards.
- **Radii:** `md` (6px) for inputs, `xl` (12px) for cards.
- **Elevation:** Clean 1px borders for structure, `shadow-md` for dropdowns, `shadow-xl` for modals.
- **Motion:** 150–250ms meaningful motion (hover states, sliding sheets). Respect `prefers-reduced-motion`.

## 5. Components Standards

- **Base:** shadcn/ui.
- **Buttons:** 44px min-height (mobile). Clear focus states.
- **Inputs:** Inline validation (Zod), auto-focus on desktop, standard numeric keypad for OTP.
- **Cards/Dashboard:** Stripe-inspired KPI cards. Clean metrics.
- **Tables:** High density, sticky headers, subtle hover rows.
- **Dialogs vs Bottom Sheets:** Dialogs for Desktop, Bottom Sheets for Mobile.
- **Navigation:** Bottom Tab Bar (Mobile), Sidebar (Desktop).
- **Feedback:** Toast for success/errors. Skeleton for loading. Empty States with illustrations.
- **Billing:** Use secure Stripe Elements embedded seamlessly.

## 6. Mobile PWA Standards

- **Core Viewports:** 360, 375, 390, 412, 430. Tablet, Desktop responsive.
- **Thumb Zones:** Primary CTAs in the bottom 50%. One-handed use.
- **Touch Targets:** 44px minimum for all clickable elements.
- **Offline & Install:** Manifest included, offline fallback screens, service worker caching.
