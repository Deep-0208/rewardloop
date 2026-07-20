# Quality Standards

## 1. Accessibility Standards (WCAG AA)

- **Keyboard Navigation:** Full Tab/Enter/Space support. Logical focus order.
- **Focus Indicators:** Explicit `focus-visible:ring` on all interactive elements.
- **ARIA & Screen Readers:** Proper roles (`button`, `dialog`), `aria-labels` for icon buttons, `aria-hidden` for decorative SVG.
- **Contrast & Color:** Minimum 4.5:1 text contrast. Never rely on color alone to convey meaning.
- **Touch:** 44px minimum target sizes.

## 2. Performance Standards

- **Lighthouse:** Target 90+ for Performance, Accessibility, Best Practices, SEO.
- **Core Web Vitals:** LCP < 2.5s, FID < 100ms, CLS < 0.1.
- **Optimization Rules:**
  - Use Server Components to ship zero JS where possible.
  - `next/image` for automatic image optimization.
  - Route-level code splitting and lazy loading (`next/dynamic`) for heavy client components (charts).
  - Stream UI using Suspense.
  - Implement caching headers and Next.js ISR/Data Cache.
  - Optimize DB queries: Add indexes to frequently queried Supabase columns.

## 3. Testing Standards

- **Strategy:** Focus on testing business logic and critical user journeys.
- **Unit Tests (Vitest):** Target complex pure functions and hooks. Mock external APIs.
- **Integration Tests:** Test Server Actions and Route Handlers against a test database.
- **E2E Tests (Playwright/Cypress):** Cover Auth, Billing, and Core Workflows.
- **Accessibility Tests:** Automated aXe checks in CI.
- **Coverage:** Minimum 80% coverage on domain logic and utility functions.
