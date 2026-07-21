# RewardLoop Component Library

This document serves as the central reference for all reusable UI components in the RewardLoop Design System.

**All components are located in `src/components/` and exported via barrel files (e.g., `import { Button } from "@/components/ui/button"`).**
Business-specific UI primitives (e.g., `StatCard`) are located in `src/features/shared/components/`.

---

## 1. Typography

**Path:** `src/components/typography/index.tsx`

Semantic typography components matching the 09_UI_UX_Specification scale.

| Component   | Tag    | Size | Weight | Usage                |
| ----------- | ------ | ---- | ------ | -------------------- |
| `Display`   | `p`    | 32px | 700    | Prices, hero numbers |
| `Heading`   | `h1`   | 28px | 700    | Page headings        |
| `Title`     | `h2`   | 24px | 600    | Section titles       |
| `Subtitle`  | `h3`   | 20px | 600    | Sub-sections         |
| `BodyLarge` | `p`    | 18px | 400    | Emphasized body      |
| `Body`      | `p`    | 16px | 400    | Default body text    |
| `Label`     | `span` | 14px | 500    | Form labels          |
| `Caption`   | `span` | 12px | 400    | Secondary info       |
| `Tiny`      | `span` | 11px | 400    | Timestamps           |

**Props:**

- `as`: Override HTML tag
- `muted`: Apply secondary text color
- `tabular`: Enable tabular numbers (`tabular-nums`)

---

## 2. Buttons

**Path:** `src/components/ui/button.tsx`

Enhanced shadcn/ui button.

**Variants:** `default`, `secondary`, `outline`, `ghost`, `destructive`, `success`, `link`
**Sizes:** `default`, `sm`, `lg`, `icon`, `touch` (48px mobile CTA), `full` (full-width 48px sticky CTA)
**Features:**

- `loading`: Shows spinner and disables button
- `leftIcon` / `rightIcon`: Render icons alongside text
- _Accessibility:_ Automatic `aria-busy` when loading, disabled states, focus rings.

---

## 3. Forms & Inputs

**Path:** `src/components/forms/index.ts`

### FormField

Wraps standard text inputs with consistent labels, helper text, and error messages.
**Props:** `label`, `helperText`, `error`, `required`, `prefix`, `suffix`

### PhoneInput

Input configured for 10-digit Indian phone numbers.
**Features:** Auto-appends `+91` prefix, numeric keyboard (`inputMode="tel"`).

### OTPInput

6-digit One Time Password input.
**Features:** Auto-advance, paste support, backspace navigation, auto-focus.

### NumberInput

Numeric input for currency/percentages.
**Features:** Tabular numbers, `inputMode="numeric"`, prefix/suffix support.

### SearchInput

Search field with integrated search icon and clear button.
**Props:** `onClear` callback.

---

## 4. Feedback Components

**Path:** `src/components/feedback/index.ts`

### EmptyState

Standard empty state with icon, title, description, and primary action.
**Variants:** Default (full page), `compact` (inline inside cards).

### ErrorState

Standard error state with title, description, and retry action.
**Variants:** Default, `compact`.

### LoadingOverlay

Full-screen backdrop blur with loading spinner. Blocks interaction during route changes or heavy operations.

### LoadingScreen

Full-screen skeleton layout matching the app shell. Used for initial page loads.

---

## 5. Layout

**Path:** `src/components/layout/index.ts`

### Stack

Flex-based layout with type-safe `gap` (spacing scale), `direction`, `align`, and `justify`.

### Grid

CSS Grid layout with type-safe `cols` and `gap`.

### Spacer

Flexible or fixed-height spacer component for pushing content apart.

### StickyCTA

Bottom-fixed container for primary actions. Safe-area aware (`pb-safe`) and full width.

---

## 6. Navigation

**Path:** `src/components/navigation/index.ts`

### BottomNavigation

Floating glass-material bottom navigation bar for mobile.
**Props:** Accepts array of `BottomNavItem` (icon, label, href, active, onClick).

### BottomSheet

Wrapper around shadcn/ui Drawer.
**Features:** 90% max-height, grab handle, overscroll containment.

---

## 7. Business Primitives

**Path:** `src/features/shared/components/index.ts`

Generic presentation components with mock props for UI layout. (No business logic).

### StatCard

Dashboard KPI card (Label, Value, Icon, Trend).

### ServiceCard

Catalog item card with interactive selection state (`selected` prop).

### CustomerCard

Displays customer Name, Phone, Visit Count, and Wallet Balance.

### RewardCard

Billing summary card showing Available Balance, Max Redeem, Applied Amount, and Final Pay.

### TransactionCard

List item for transaction history showing Customer, Amount, Reward Used, Payment Method, and Timestamp.

---

## 8. Icons

**Path:** `src/components/icons/index.ts`

Centralized icon registry re-exporting from `lucide-react`. **Do not import directly from lucide-react.** Use this module to ensure standard sizing and consistent icon usage.
