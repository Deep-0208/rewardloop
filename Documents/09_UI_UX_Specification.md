# 09_UI_UX_Specification.md

> **Project:** RewardLoop
>
> **Version:** 1.1
> **Status:** 🔒 Approved
> **Platform:** Progressive Web App (PWA)
> **Primary Device:** Mobile (360–430px)
> **Purpose:** Single source of truth for all UI, UX, frontend implementation, design reviews, and AI-assisted development.
> **Last updated:** 2026-07-14 — OTP locked to 6 digits (Decision 12). Insights locked to Today-only (Decision 17). StaffCard moved to Phase 2.
> **Conflict resolution:** Where this document conflicts with `00_Founder_Decisions.md`, Founder Decisions take precedence.

---

# 01 Design Philosophy

RewardLoop is a **Counter-First Mobile SaaS**.

The application is designed for salon owners, receptionists, and local business staff who serve customers throughout the day. The primary goal is cognitive ease and operational speed, specifically targeting a "12-second billing flow."

The interface prioritizes:

- Speed
- Simplicity
- Readability
- Consistency
- One-hand usability

The application should feel like a professional counter tool rather than an admin dashboard. The aesthetic is professional, reliable, and "invisible"—getting out of the way to let the service take center stage.

---

# 02 Design Principles

Every screen must follow these principles:

1. **Speed over decoration:** Utility and legibility over decorative elements.
2. **One primary action per screen.**
3. **Counter-first experience:** Optimized for devices held in one hand or resting on a stand.
4. **Minimal typing:** Use bottom sheets for selection-heavy tasks.
5. **One-hand usability:** Critical action buttons (Pay, Add Item, Search) placed within the bottom 40% of the screen.
6. **Large touch targets:** Minimum 48x48px for easy tapping.
7. **Consistent interaction patterns.**
8. **Every tap has a purpose.**
9. **The user should know what to do within three seconds.**
10. **The UI should help users complete tasks, not test them.**

---

# 03 Design Tokens

## Colors

| Token                | Value   | Description                               |
| -------------------- | ------- | ----------------------------------------- |
| color-primary        | #4F46E5 | Primary actions, progress, active states  |
| color-primary-dark   | #3525CD | Pressed states, high emphasis             |
| color-success        | #10B981 | Payment confirmed, positive feedback      |
| color-warning        | #F59E0B | Low loyalty balance, warnings             |
| color-error          | #EF4444 | Voiding transactions, destructive actions |
| color-background     | #F8FAFC | The canvas                                |
| color-surface        | #FFFFFF | Cards, dialogs, bottom sheets             |
| color-border         | #E5E7EB | Borders, outlines, dividers               |
| color-text-primary   | #111827 | Headings, prominent text                  |
| color-text-secondary | #6B7280 | Body text, secondary labels               |

## Radius

| Token       |  Value | Usage                           |
| ----------- | -----: | ------------------------------- |
| radius-sm   |    4px | Badges, small chips             |
| radius-md   |    8px | Chips, large badges             |
| radius-lg   |   12px | Buttons, inputs, standard cards |
| radius-xl   |   16px | Large container groups, dialogs |
| radius-2xl  |   20px | Bottom sheets (top corners)     |
| radius-full | 9999px | Avatars, pill buttons           |

## Spacing

| Token    | Value | Usage                         |
| -------- | ----: | ----------------------------- |
| space-1  |   4px | xs spacing                    |
| space-2  |   8px | base / sm spacing             |
| space-3  |  12px | padding                       |
| space-4  |  16px | md spacing, gutter, margins   |
| space-6  |  24px | lg spacing, section gap       |
| space-8  |  32px | xl spacing, major section gap |
| space-12 |  48px | touch-target-min              |
| space-16 |  64px | list row height               |

---

# 04 Color System

This design system utilizes a high-contrast palette optimized for clarity under various lighting conditions (e.g., bright salon lights).

## Rules

- One primary brand color (Indigo shades).
- Semantic colors only (Success, Warning, Error strictly for feedback).
- Never use color alone to communicate meaning.
- A crisp distinction between Background and Surface creates natural depth.
- Light Mode for MVP.
- Dark Mode architecture ready.

---

# 05 Typography

The design system exclusively uses **Inter** to ensure maximum legibility at small sizes and high-speed reading.

**Weights:** 400, 500, 600, 700

**Font Scale:**

| Usage      | Size | Line Height |
| ---------- | ---- | ----------- |
| Display    | 32px | 40px        |
| H1         | 28px | 36px        |
| H2         | 24px | 32px        |
| H3         | 20px | 28px        |
| Body Large | 18px | 28px        |
| Body       | 16px | 24px        |
| Label      | 14px | 20px        |
| Caption    | 12px | 16px        |
| Tiny       | 11px | 14px        |

## Rules

- Title Case for headings and buttons.
- Sentence case for labels.
- Tabular numbers for currency and analytics.
- For prices and loyalty points, use Display or H1 to ensure prominence.
- Line heights are slightly generous to prevent "crowding".

---

# 06 Spacing

- **Design Grid:** 8-point system
- **Screen Padding:** 16px
- **Card Padding:** 16px
- **Section Gap:** 24px
- **Major Section Gap:** 32px

---

# 07 Radius

The shape language is approachable yet professional, utilizing soft rounded corners.

- **Button / Input:** 12px
- **Card:** 12px (or 16px for large wrappers)
- **Dialog:** 16px
- **Bottom Sheet:** 20px (top corners only)
- **Floating Navigation:** 24px
- **Chip:** Pill (9999px) or 8px
- **Avatar:** Circle

---

# 08 Elevation

This design system uses a "layered flat" approach. Depth is communicated through tonal changes and soft, subtle shadows rather than complex skeuomorphism.

- **Level 0 (Background):** No shadow. `#F8FAFC` - The canvas.
- **Level 1 (Cards):** `#FFFFFF` - Used for grouping service items and customer details. Minimal shadow (`0px 1px 3px rgba(0,0,0,0.1)`).
- **Level 2 (Active/Floating):** Use for floating bottom navigation, dialogs, and bottom sheets. Pronounced but soft shadow (`0px 10px 15px -3px rgba(0,0,0,0.1)`) to indicate temporary overlays.

---

# 09 Glass Material

Glass Material is used only for floating surfaces to maintain context without blocking the view completely.

**Allowed:**

- Bottom Navigation
- Bottom Sheets
- Floating Menus
- Dropdowns

**Not Allowed:**

- Cards, Buttons, Inputs, Billing Screens

**Glass Properties:**

- Background Blur
- 85–90% opacity
- Thin border
- Soft shadow

_Note: Surfaces should mostly remain opaque to ensure text contrast remains constant and accessible._

---

# 10 Component Library

## Primitive Components

- Button
- Input
- SearchField
- OTPInput
- Textarea
- Switch
- Checkbox
- Radio
- Dropdown

## Layout Components

- AppBar
- BottomNavigation
- BottomSheet
- Dialog
- Divider
- SectionHeader

## Display Components

- Card
- Badge
- Chip
- Avatar
- EmptyState
- Skeleton
- Toast

## Business Components

- CustomerCard
- CatalogItemCard
- SelectedItemCard
- TransactionCard
- RewardSummaryCard
- WalletCard
- StatCard
- PaymentMethodCard
- RewardPreviewCard
- BillingSummaryCard
- ServiceSelectionCard

> **Note:** `StaffCard` is Phase 2. It is NOT built in MVP (Staff Management = Phase 2, Decision 24).

## Rules

- Never modify base shadcn/ui components directly.
- Build business components by composition.

---

# 11 Component States

## Primary Button

Height: 48px
Radius: 12px
States:

- **Default:** Solid #4F46E5
- **Hover:** Slightly darker (#3525CD)
- **Pressed:** Scaled down slightly (98%)
- **Loading:** Spinner replaces label
- **Disabled:** #D1D5DB background, unclickable

## Input

Height: 48px
Radius: 12px
States:

- **Default:** 1px border (#E5E7EB)
- **Focused:** 2px primary border (#4F46E5)
- **Filled:** Text colored in primary text color
- **Error:** 2px error border (#EF4444)
- **Disabled:** Grayed out background

## Card

Radius: 12px (or 16px)
States:

- **Default:** Pure white background, Level 1 shadow
- **Interactive (Hover):** Slight elevation increase
- **Selected:** 2px primary border

## Bottom Sheet

States:

- **Collapsed/Hidden:** Off-screen
- **Expanded:** Slides up, max-height 90%, background backdrop visible
- **Dragging:** Follows finger, rubber-band effect if pulled past limits

---

# 12 Interaction Rules

## Buttons

- Disabled until form is valid.
- Loading replaces label.
- Prevent double taps.

## Inputs

- Auto focus on entry.
- Auto advance when format complete (e.g. phone number).
- Inline validation on blur or change.

## OTP

- Auto verify after last digit.
- Paste supported.
- Backspace moves to previous field.

---

# 13 Forms

- **Labels:** Above fields.
- **Optional Fields:** Show "(Optional)".
- **Validation:** Inline, server side, human friendly.
- **Keyboard:** Context aware (numpad for phone/OTP).
- **Auto Behaviors:** Auto Focus, Auto Search, Auto Advance, Auto Fill, Auto Correction.
- **Buttons:** Bottom aligned, 48px height.
- **Errors:** Shown directly below the field in `color-error`.

## Input Standards

**Phone Number:**

- Numeric keyboard
- Auto formatting
- Country code selector

**OTP:**

- **Six digits** (locked — see Decision 12 in `00_Founder_Decisions.md`)
- Auto advance between boxes
- Paste support (auto-fills all 6 boxes)
- Auto verify after 6th digit entered
- Backspace moves to previous field

**Currency:**

- Numeric keyboard
- Thousand separators

**Percentage:**

- Number stepper
- Direct editing allowed

---

# 14 Navigation

## Bottom Navigation

**Items:**

- Home
- Transactions
- Add Visit
- Insights
- More

**Rules:**

- Always visible on primary screens.
- Hidden during onboarding.
- Hidden during authentication.
- Hidden inside full-screen workflows.
- Floating glass material only.

## Sticky Primary CTA

Every workflow screen uses a sticky bottom action.

**Rules:**

- Full width
- 48px minimum height
- Safe area aware
- Remains visible when scrolling
- Moves above keyboard automatically

## Navigation Rules

- **Primary Action:** Add Visit (prominent CTA).
- **Navigation Depth:** Maximum 3 levels.
- **Temporary Tasks:** Use Bottom Sheets.
- **Primary Workflows:** Use Full Screens.
- **Dialogs:** Critical/destructive actions only.

---

# 15 Motion

- **Animation Speed:** Fast (150ms), Normal (200ms), Slow (300ms).
- **Animations:** Push, Reverse Push, Slide Up, Fade, Button Scale (98%).
- **Accessibility:** Respect Reduce Motion.

## Micro-interactions

**Buttons:**

- 98% press animation

**Cards:**

- Soft elevation on press

**Bottom Sheets:**

- Spring animation

**Success:**

- Toast only

**Errors:**

- Inline whenever possible

**Loading:**

- Skeleton preferred over spinner

---

# 16 Bottom Sheets

**Used For:**

- Reward Redemption
- Catalog Selection
- Service Selection
- Payment Selection
- Selecting filter options

**Rules:**

- Swipe to close.
- Tap backdrop to dismiss.
- Rounded top corners (20px).
- Max height 90%.
- Includes a "grab handle" at the top.
- Keeps the context of the main bill visible in the background.

---

# 17 Mobile Rules

- **Target Width:** 360–430px.
- **Orientation:** Portrait.
- **Touch Target:** Minimum 48×48px.
- **Scrolling:** Vertical only.
- **Safe Areas:** Always respected.
- **Primary CTA:** Bottom reachable (natural thumb zone).

---

# 18 Accessibility

- **Buttons:** 48px minimum height.
- **Labels:** 14px minimum.
- **Contrast:** WCAG AA compliant.
- **Focus:** Visible focus states for all interactive elements.
- **Reduce Motion:** Supported (disable animations if user prefers).
- **Screen Readers:** Semantic HTML, aria-labels for icons.

---

# 19 Screen Templates

## Template A: Standard Workflow

Header
↓
Content
↓
Sticky CTA

## Template B: List & Actions

Header
↓
Scrollable List (High-density, 64px row height)
↓
Floating Action Button (or Bottom Navigation)

## Template C: Form Entry

Header
↓
Form
↓
Flexible Spacer
↓
Sticky CTA

---

# 20 Onboarding Standards

RewardLoop onboarding consists of exactly three steps.

Business
↓
Rewards
↓
Catalog

**Rules:**

- Same header across all onboarding screens.
- Same spacing across all onboarding screens.
- Same sticky Continue button.
- Same progress indicator.
- Back button available from Step 2 onward.
- Maximum completion time: 60 seconds.
- Users should never lose previously entered data.

---

# 21 Screen Specifications

## Login

**Flow:** Phone → OTP → Dashboard
**Rules:** No password, OTP only, Auto focus, Minimal UI.

## First-Time Setup

**Steps:** Shop Name, Reward Rules, Catalog Setup.
**Target:** Complete within 60 seconds.

## Dashboard

**Displays:** Today's Revenue, Customers Today, Recent Transactions.
**Primary CTA:** Add Visit. No charts.

## Add Visit

**Flow:** Phone → Customer → Catalog → Reward → Payment → Complete.
**If customer not found:** Show Name field → Auto create customer.

## Reward Redemption

**Displays:** Available Reward, Max Redeem, Reward Used, Final Pay.
Manual reward entry. OTP required only when reward is redeemed. Continue Without Reward automatically resets reward amount.

## Transactions

**Displays:** Recent first. Cards show Customer, Bill, Reward Used, Final Paid, Payment Method.
**Editable:** Within 5 minutes. No delete.

## Insights

**Shows:** Revenue, Customers, Rewards Given.
**Views:** Today only (MVP). Multi-period views (Yesterday, Weekly, Monthly) are Phase 2 — see Decision 17.
Cards open bottom sheets for drill-down detail. No charts in MVP.

## More

**Sections:** Quick Actions (Catalog, Reward Rules, Business Settings), Settings (Notifications, Help, Logout).

---

# 22 Empty States

Every Empty State Contains:

- Illustration/Icon
- Title
- Description
- Primary Action

**Example:**

> **No Visits Yet**
> Tap "Add Visit" to record your first customer.

---

# 23 Loading States

- **List:** → Skeleton
- **Card:** → Skeleton
- **Button:** → Spinner inside button

_Rule: Never block the whole screen with a global spinner unless absolutely necessary._

---

# 24 Error States

- **Types:** Invalid OTP, Offline, Customer Not Found, Server Error.
- **Display:** Inline for forms, Toasts for global errors, Empty state for data load failures.

---

# 25 UX Writing

- **Tone:** Friendly, Short, Clear, Human.
- **Good:** "Customer not found"
- **Bad:** "Error Code 404"
- **Buttons:** Continue, Save, Complete Visit, Verify OTP.
  _Never use technical language._

---

# 26 Performance Targets

- **Dashboard:** <2 seconds
- **Touch Response:** <100ms
- **Complete Visit:** <12 seconds
- **Animations:** 60 FPS

---

# 27 Responsive Rules

**Responsive Breakpoints:**

- **Mobile S:** 360px
- **Mobile M:** 375px
- **Mobile L:** 390px
- **Mobile XL:** 430px
- **Tablet:** 768px (Centered container or extended cards)
- **Desktop:** Not supported in MVP

---

# 28 Developer Notes

**Implementation Rules:**

- **Framework:** Next.js
- **Styling:** Tailwind CSS (use the defined Design Tokens)
- **Components:** shadcn/ui
- **Icons:** Lucide
- **State:** Zustand
- **Forms:** React Hook Form
- **Validation:** Zod

**Rule:**
Every UI implementation must follow this specification. Custom components should be composed from base components instead of rewritten. All spacing, typography, and color tokens must map directly to the `tailwind.config.ts`.

---

# 29 Future Design

**Prepared for:**

- Dark Mode
- Multi-branch
- Membership
- Coupons
- Campaigns
- AI Features
- Public APIs
- Native Mobile App

_No redesign should be required to accommodate these features._

---

# 30 Design Checklist

## Do

- Keep screens simple.
- Use bottom sheets.
- Minimize typing.
- Use existing components.
- Keep one primary CTA.

## Don't

- Add unnecessary charts.
- Use more than one primary CTA.
- Create modal overload.
- Hide important actions.
- Introduce inconsistent spacing.

**General Rules:**
Every new screen must satisfy:

- Mobile first & One-hand usage
- Single primary action
- Existing components only
- Correct spacing tokens, typography, and color usage
- Accessibility compliant & Responsive
- Fast interaction & Minimal typing

---

# 31 Summary

Version 2.0 of this specification integrates technical design tokens, interaction states, template architectures, and developer guidelines. Once frozen, this document serves as the absolute single source of truth for both the design and engineering teams.
