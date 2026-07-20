# 03_Dashboard.md

> **Project:** RewardLoop
>
> **Sprint:** 3
>
> **Feature:** Dashboard
>
> **Version:** 1.0
>
> **Status:** Ready for Development
>
> **Purpose:** Complete implementation specification for the Dashboard. The Dashboard is the business owner's home screen — the first thing they see after login. A developer or AI coding agent must be able to implement Sprint 3 using only this document.
>
> **Depends on:** 00_Project_Setup.md, 01_Authentication.md, 02_Onboarding.md, 00_Founder_Decisions.md, 04_Domain_Model.md, 06_Database_Design.md, 08_API_Design.md, 09_UI_UX_Specification.md

---

# Table of Contents

1. Sprint Goal
2. Scope
3. User Flow
4. Dashboard Layout
5. Pages
6. UI Components
7. Database
8. Server Actions
9. Dashboard Calculations
10. Validation
11. Security
12. State Management
13. Screen-to-API Mapping
14. Component Hierarchy
15. Dashboard State Machine
16. Error States
17. Loading States
18. Empty States
19. Edge Cases
20. Tasks
21. Acceptance Criteria
22. Definition of Done
23. File Structure
24. Dependencies
25. Testing Checklist
26. Implementation Order
27. Sprint Ownership
28. Out of Scope
29. Performance Targets
30. AI Coding Instructions
31. Sprint Success Definition
32. Version History

---

# 1. Sprint Goal

Build the complete Dashboard for RewardLoop.

The Dashboard should answer four questions within three seconds of loading:

1. **How much did I earn today?** → Revenue Card
2. **How many customers visited today?** → Customers Card
3. **What happened recently?** → Recent Transactions list
4. **What should I do next?** → Add Visit CTA

The Dashboard is not an analytics screen. It is an operational home screen optimized for speed, clarity, and immediate action.

---

## Business Context

From `00_Founder_Decisions.md` — Decision 16 (Dashboard):

- Dashboard contains: Today Revenue, Customers, Recent Transactions.
- Primary CTA: + Visit.
- Rules: No charts. No analytics. Fast loading.

From `00_Founder_Decisions.md` — Decision 25 (Success Metrics):

- Login to Dashboard ≤ 5 seconds.

From `09_UI_UX_Specification.md` — Design Principle 9:

- "The user should know what to do within three seconds."

From `09_UI_UX_Specification.md` — Screen Specifications:

- Dashboard displays: Today's Revenue, Customers Today, Recent Transactions.
- Primary CTA: Add Visit. No charts.

---

# 2. Scope

## Included

- Today's summary cards (Revenue, Customers, Rewards).
- Recent Transactions list (most recent first).
- Quick Actions.
- Pull to refresh.
- Empty state (first day, no transactions).
- Loading skeleton.
- Error state with retry.
- Bottom Navigation (first screen to show it).
- Add Visit FAB / CTA.

## Not Included

- Charts or graphs (from `00_Founder_Decisions.md` — no charts).
- Advanced analytics.
- Date filters or period selectors.
- Export functionality.
- Multi-branch views.
- Staff-specific analytics.
- Real-time WebSocket updates.

## Future

- Customizable widgets.
- Custom dashboard layout.
- AI-powered insights.
- Week/month summary toggles.

---

# 3. User Flow

## Successful Login → Dashboard

```
Authentication Complete (Sprint 1)
    │
    ▼
Business Exists (verified in Sprint 1/2)
    │
    ▼
Dashboard Loads
    │
    ├── getDashboardSummary()
    │
    ├── getRecentTransactions()
    │
    ▼
Dashboard Rendered
    │
    ├── Summary Cards
    ├── Recent Transactions
    └── Bottom Navigation
```

---

## Pull to Refresh

```
Dashboard (Loaded)
    │
    ▼
User Pulls Down
    │
    ▼
Refresh Indicator Appears
    │
    ▼
refreshDashboard()
    │
    ├── Invalidate summary cache
    ├── Invalidate transactions cache
    │
    ▼
Data Refreshed
    │
    ▼
Dashboard Updated
```

---

## Tap Add Visit

```
Dashboard
    │
    ▼
Tap "+" (Add Visit CTA)
    │
    ▼
Navigate to /(app)/visit
```

---

## Tap Transaction Card

```
Dashboard
    │
    ▼
Tap Transaction Card
    │
    ▼
Navigate to /(app)/transactions/[id]
```

---

## Session Expired

```
Dashboard
    │
    ▼
Server Action Returns AUTH_REQUIRED
    │
    ▼
Redirect to /(auth)/login
```

---

## Network Failure

```
Dashboard
    │
    ▼
API Call Fails
    │
    ▼
Show Error Banner with Retry
    │
    ▼
User Taps Retry
    │
    ▼
Retry API Call
```

---

## Empty Dashboard (First Day)

```
Dashboard Loads
    │
    ▼
No Transactions Found
    │
    ▼
Show Empty State
    │
    ├── Message: "No visits yet. Start your first visit!"
    ├── Illustration or Icon
    └── CTA: "Add Visit"
```

---

# 4. Dashboard Layout

The Dashboard uses a single scrollable vertical layout.

```text
┌─────────────────────────────┐
│  App Bar (Business Name)    │
├─────────────────────────────┤
│  Greeting ("Good morning")  │
├─────────────────────────────┤
│  Summary Cards              │
│  ┌─────────┐ ┌─────────┐   │
│  │ Revenue │ │Customer │   │
│  └─────────┘ └─────────┘   │
│  ┌─────────────────────┐   │
│  │   Rewards Given      │   │
│  └─────────────────────┘   │
├─────────────────────────────┤
│  Quick Actions              │
│  [Add Visit]                │
├─────────────────────────────┤
│  Recent Transactions        │
│  ┌─────────────────────┐   │
│  │ Transaction Card    │   │
│  ├─────────────────────┤   │
│  │ Transaction Card    │   │
│  ├─────────────────────┤   │
│  │ Transaction Card    │   │
│  └─────────────────────┘   │
│  [View All Transactions]    │
├─────────────────────────────┤
│  ░░░░ Bottom Navigation ░░░░│
└─────────────────────────────┘
```

**Spacing Rules (from `09_UI_UX_Specification.md`):**

- Screen padding: `space-4` (16px).
- Section gap: `space-6` (24px).
- Card padding: `space-4` (16px).
- Card radius: `radius-lg` (12px).
- Card gap within grid: `space-3` (12px).

**Scrolling:**

- Vertical scroll only.
- Bottom Navigation stays fixed.
- Pull-to-refresh enabled at the top.
- Content scrolls behind the Bottom Navigation.

---

# 5. Pages

## 5.1 Dashboard Page

**Purpose:** The primary home screen. Shows today's business summary and recent transactions.

**Route:** `/(app)/dashboard`

**Template:** List & Actions (Header → Scrollable Content → Bottom Navigation)

**Components:**

- DashboardLayout
- AppBar (Business Name)
- GreetingCard
- RevenueCard
- CustomerCard
- RewardCard
- QuickActionGrid
- RecentTransactionList
- TransactionCard (×N)
- EmptyDashboard (conditional)
- LoadingSkeleton (initial load)
- ErrorBanner (error state)
- RefreshIndicator (pull to refresh)
- BottomNavigation

**Navigation:**

- Add Visit (+) → `/(app)/visit`
- Transaction Card → `/(app)/transactions/[id]`
- Transactions tab → `/(app)/transactions`
- Insights tab → `/(app)/insights`
- More tab → `/(app)/more`

**Primary Action:** Add Visit (+ button or Quick Action).

**Secondary Actions:**

- View All Transactions (link below recent list).
- Tap any transaction card for details.

**Loading:**

- Full skeleton layout on initial load.
- Summary cards show skeleton values.
- Transaction list shows skeleton cards.

**Errors:**

- Network error → ErrorBanner with retry button.
- Server error → ErrorBanner with retry button.
- Session expired → Redirect to login (silent).

---

## 5.2 Refresh State

**Purpose:** User pulls down to refresh dashboard data.

**Behavior:**

- Pull-to-refresh gesture triggers data re-fetch.
- RefreshIndicator appears at the top.
- Summary cards and transactions refresh simultaneously.
- On success, data updates in place (no full re-render).
- On failure, show toast: "Unable to refresh. Please try again."

---

## 5.3 Offline State

**Purpose:** Handle loss of network connectivity.

**Behavior:**

- Show cached data if available (TanStack Query stale data).
- Show a subtle offline banner: "You are offline."
- Disable pull-to-refresh.
- Re-enable when connection is restored.

---

## 5.4 Error State

**Purpose:** Handle complete failure to load dashboard data.

**Behavior:**

- Show ErrorBanner: "Unable to load dashboard."
- Retry button.
- Bottom Navigation remains visible.

---

# 6. UI Components

## 6.1 DashboardLayout

**Purpose:** Wraps the dashboard page. Provides scrollable content area with fixed Bottom Navigation.

**Behavior:**

- Scrollable vertical layout.
- Safe area padding.
- Background: `color-background` (#F8FAFC).
- Bottom Navigation fixed at bottom.
- Pull-to-refresh enabled.

---

## 6.2 GreetingCard

**Purpose:** Displays a contextual greeting with the owner's name.

**Props:**

- `businessName: string`

**Behavior:**

- Shows time-based greeting:
  - 5:00–11:59 → "Good morning"
  - 12:00–16:59 → "Good afternoon"
  - 17:00–4:59 → "Good evening"
- Shows business name below: "Royal Salon"
- Typography: `h2` (24px) for greeting, `body` (16px) for business name.
- Text color: `color-text-primary` for greeting, `color-text-secondary` for business name.

---

## 6.3 RevenueCard

**Purpose:** Displays today's total revenue.

**Props:**

- `amount: number`
- `isLoading: boolean`

**Behavior:**

- Label: "Today's Revenue"
- Value: Formatted as ₹X,XXX (with thousand separators, tabular numbers).
- Typography: `label` (14px) for label, `h1` (28px) for value.
- Background: `color-surface` (#FFFFFF).
- Radius: `radius-lg` (12px).
- Shadow: `level-1`.
- Shows skeleton shimmer when loading.
- Shows "₹0" when no revenue (not empty state — zero is a valid value).

---

## 6.4 CustomerCard

**Purpose:** Displays today's customer count.

**Props:**

- `count: number`
- `isLoading: boolean`

**Behavior:**

- Label: "Customers Today"
- Value: Integer count.
- Typography: `label` (14px) for label, `h1` (28px) for value.
- Background: `color-surface` (#FFFFFF).
- Radius: `radius-lg` (12px).
- Shadow: `level-1`.
- Shows skeleton when loading.
- Shows "0" when no customers.

---

## 6.5 RewardCard

**Purpose:** Displays today's total rewards issued.

**Props:**

- `amount: number`
- `isLoading: boolean`

**Behavior:**

- Label: "Rewards Given"
- Value: Formatted as ₹X,XXX.
- Typography: `label` (14px) for label, `h2` (24px) for value.
- Background: `color-surface` (#FFFFFF).
- Radius: `radius-lg` (12px).
- Shadow: `level-1`.
- Shows skeleton when loading.
- Shows "₹0" when no rewards.

---

## 6.6 QuickActionGrid

**Purpose:** Provides fast access to the most common action.

**Props:** None.

**Behavior:**

- Contains the Add Visit button.
- Prominent, centered CTA.
- May expand in future sprints with additional quick actions.

---

## 6.7 QuickActionButton

**Purpose:** A single quick action item.

**Props:**

- `label: string`
- `icon: ReactNode`
- `onClick: () => void`

**Behavior:**

- Touch target ≥ 48×48px.
- Icon + label layout.
- Uses `color-primary` for the Add Visit button.
- 98% scale on press.

---

## 6.8 RecentTransactionList

**Purpose:** Displays the most recent transactions as a scrollable list.

**Props:**

- `transactions: Transaction[]`
- `isLoading: boolean`
- `onViewAll: () => void`

**Behavior:**

- Section header: "Recent Transactions"
- Displays latest 5 transactions (configurable).
- Ordered newest first (from `00_Founder_Decisions.md` — Decision 15).
- "View All" link at the bottom navigates to Transactions page.
- Shows skeleton cards when loading.
- Shows empty state when no transactions.

---

## 6.9 TransactionCard

**Purpose:** Displays a single transaction summary.

**Props:**

- `transaction: Transaction`
- `onClick: () => void`

**Behavior (from `00_Founder_Decisions.md` — Decision 15):**

- Shows: Customer name or phone, Bill amount, Reward Used, Final Paid, Payment Method.
- Customer name in `color-text-primary`.
- Amounts use tabular numbers.
- Payment method badge (Cash / Online).
- Time since transaction (e.g., "2 min ago", "1 hour ago").
- Background: `color-surface`.
- Radius: `radius-lg` (12px).
- Shadow: `level-1`.
- Tappable → navigates to transaction detail.
- 98% scale on press.

---

## 6.10 EmptyDashboard

**Purpose:** Shown when there are no transactions for today (including first-day empty state).

**Props:**

- `onAddVisit: () => void`

**Behavior (from `00_Founder_Decisions.md` — Decision 20):**

- Message: "No visits yet"
- Sub-message: "Start your first visit to see your dashboard come alive."
- Icon: Relevant illustration (e.g., clipboard or sparkle icon from Lucide).
- CTA button: "Add Visit" → navigates to `/(app)/visit`.
- Centered vertically in the content area.
- Summary cards still show ₹0 / 0 values above the empty state.

---

## 6.11 LoadingSkeleton

**Purpose:** Shows placeholder content while dashboard data is loading.

**Behavior (from `09_UI_UX_Specification.md` — Loading: Skeleton preferred over spinner):**

- Skeleton greeting (text shimmer).
- Skeleton summary cards (rectangles with shimmer animation).
- Skeleton transaction cards (3 placeholder cards).
- No full-screen spinner. Never.
- Animation: Subtle shimmer (left-to-right pulse).
- Duration: Visible until data loads, typically < 2 seconds.

---

## 6.12 ErrorBanner

**Purpose:** Displays a banner when the dashboard fails to load.

**Props:**

- `message: string`
- `onRetry: () => void`

**Behavior:**

- Background: Light red tint.
- Text: `color-error`.
- Message: "Unable to load dashboard."
- Retry button: "Try Again".
- Positioned at the top of the content area.
- Does not replace the entire screen — Bottom Navigation remains visible.

---

## 6.13 RefreshIndicator

**Purpose:** Visual feedback during pull-to-refresh.

**Behavior:**

- Appears at the top of the scrollable area.
- Shows a spinner during refresh.
- Disappears when refresh completes.
- Native pull-to-refresh pattern.

---

## 6.14 BottomNavigation

**Purpose:** Primary navigation bar for the application.

**Items (from `00_Founder_Decisions.md` — Decision 18):**

- 🏠 Home (active on Dashboard)
- 📋 Transactions
- ➕ Add Visit (prominent, center)
- 📊 Insights
- ☰ More

**Behavior (from `09_UI_UX_Specification.md`):**

- Always visible on primary screens.
- Hidden during onboarding and authentication.
- Floating glass material.
- Fixed at bottom.
- Safe area aware.
- Active tab uses `color-primary`.
- Inactive tabs use `color-text-secondary`.
- Touch targets ≥ 48×48px per tab.
- Add Visit button is visually prominent (raised, primary color).

**Glass Properties (from `09_UI_UX_Specification.md` — Section 09):**

- Background blur.
- 85–90% opacity.
- Thin border.
- Soft shadow (Level 2).
- Radius: 24px (floating).

---

# 7. Database

## Tables Read

### 7.1 `transactions`

**Reads:**

- Today's transactions filtered by `business_id` and `created_at` (today's date).
- Sum `final_paid` for revenue.
- Sum `reward_earned` for rewards given.
- Count distinct `customer_id` for unique customers.
- Recent 5 transactions ordered by `created_at DESC`.

**Writes:** None on Dashboard (transactions created in Sprint 4).

**Updates:** None on Dashboard.

**Relationships:**

- `transactions.business_id` → `businesses.id`
- `transactions.customer_id` → `customers.id`
- `transactions.created_by` → `users.id`

**Indexes Used:**

- `business_id + created_at` (composite index from `06_Database_Design.md`).
- `business_id + status` (if transaction status filtering is needed).

---

### 7.2 `customers`

**Reads:**

- Customer name and phone for transaction cards.
- Joined with transactions for display.

**Writes:** None on Dashboard.

**Updates:** None on Dashboard.

**Relationships:**

- `customers.business_id` → `businesses.id`

**Indexes Used:**

- `business_id` index.
- `id` primary key (for joins).

---

### 7.3 `reward_ledger`

**Reads:**

- Today's reward activity for rewards given summary (alternative to summing from transactions).

**Writes:** None on Dashboard.

**Relationships:**

- `reward_ledger.transaction_id` → `transactions.id`

---

### 7.4 `businesses`

**Reads:**

- Business name for greeting display.
- Business ID for scoping all queries.

**Writes:** None on Dashboard.

**Relationships:**

- `businesses.id` is the RLS scope for all queries.

---

### 7.5 `users`

**Reads:**

- User name for greeting (if available).
- User's `business_id` for query scoping.

**Writes:** None on Dashboard.

**Relationships:**

- `users.business_id` → `businesses.id`

---

# 8. Server Actions

## 8.1 `getDashboardSummary()`

**Purpose:** Fetch today's summary numbers for the Dashboard.

**Input:**

- None (uses current session to determine `business_id`).

**Validation:**

1. User must be authenticated.
2. User must have a business.

**Database:**

- Query `transactions` where `business_id` = current business AND `created_at` is today.
- Calculate: total revenue (sum `final_paid`), customer count (count distinct `customer_id`), rewards given (sum `reward_earned`).

**Output (Success):**

```typescript
{
  success: true,
  data: {
    revenue: number,          // Today's total revenue (sum of final_paid)
    customers: number,        // Today's unique customer count
    rewardsGiven: number,     // Today's total rewards earned by customers
    businessName: string,     // Business name for greeting
    date: string              // Today's date (ISO)
  }
}
```

**Output (Failure):**

```typescript
{
  success: false,
  code: "AUTH_REQUIRED" | "SERVER_ERROR",
  message: string
}
```

**Errors:**

| Error             | Code          | User Message                |
| ----------------- | ------------- | --------------------------- |
| Not authenticated | AUTH_REQUIRED | Redirect to login.          |
| No business       | AUTH_REQUIRED | Redirect to onboarding.     |
| Database error    | SERVER_ERROR  | "Unable to load dashboard." |

**Caching Strategy:**

- TanStack Query key: `['dashboard', 'summary', todayDate]`
- Stale time: 30 seconds (data should feel fresh for an active billing screen).
- Refetch on window focus: yes.
- Refetch on mount: yes.
- Invalidate after adding a visit (Sprint 4).

---

## 8.2 `getRecentTransactions()`

**Purpose:** Fetch the most recent transactions for the Dashboard.

**Input:**

```typescript
{
  limit: number; // default: 5
}
```

**Validation:**

1. User must be authenticated.
2. User must have a business.
3. Limit must be 1–20.

**Database:**

- Query `transactions` joined with `customers` where `business_id` = current business.
- Order by `created_at DESC`.
- Limit to N records.

**Output (Success):**

```typescript
{
  success: true,
  data: {
    transactions: Array<{
      id: string,
      customerName: string | null,
      customerPhone: string,
      subtotal: number,
      rewardUsed: number,
      rewardEarned: number,
      finalPaid: number,
      paymentMethod: "cash" | "online",
      createdAt: string
    }>
  }
}
```

**Output (Failure):**

```typescript
{
  success: false,
  code: "AUTH_REQUIRED" | "SERVER_ERROR",
  message: string
}
```

**Errors:**

| Error             | Code          | User Message                   |
| ----------------- | ------------- | ------------------------------ |
| Not authenticated | AUTH_REQUIRED | Redirect to login.             |
| Database error    | SERVER_ERROR  | "Unable to load transactions." |

**Caching Strategy:**

- TanStack Query key: `['dashboard', 'transactions']`
- Stale time: 30 seconds.
- Refetch on window focus: yes.
- Invalidate after adding a visit (Sprint 4).

---

## 8.3 `refreshDashboard()`

**Purpose:** A combined refresh that invalidates and re-fetches both summary and transactions.

**Implementation:** Not a separate Server Action. This is a client-side function that invalidates TanStack Query caches.

```typescript
function refreshDashboard() {
  queryClient.invalidateQueries({ queryKey: ["dashboard"] });
}
```

Both `['dashboard', 'summary', ...]` and `['dashboard', 'transactions']` are invalidated and re-fetched.

---

## 8.4 `getBusinessGreeting()`

**Purpose:** Not a separate action. The business name is returned by `getDashboardSummary()`. The time-of-day greeting is computed client-side.

---

# 9. Dashboard Calculations

## 9.1 Today's Revenue

- **Definition:** Sum of `final_paid` from all transactions created today for the business.
- **Source:** `transactions.final_paid`
- **Filter:** `business_id` = current business AND `created_at` >= today start AND `created_at` < tomorrow start.
- **Format:** ₹X,XXX (Indian Rupee, thousand separators, no decimals for whole numbers, two decimals for fractional amounts).
- **Zero value:** Display "₹0".

**Business Rule (from `00_Founder_Decisions.md` — Decision 17):**
Revenue = Final Paid (not subtotal, not original bill).

---

## 9.2 Customers Today

- **Definition:** Count of distinct `customer_id` from today's transactions.
- **Source:** `transactions.customer_id`
- **Filter:** Same as revenue.
- **Format:** Integer (e.g., "12").
- **Zero value:** Display "0".

**Note:** A customer who visits twice in one day counts as 1 unique customer.

---

## 9.3 Rewards Given

- **Definition:** Sum of `reward_earned` from all transactions created today.
- **Source:** `transactions.reward_earned`
- **Filter:** Same as revenue.
- **Format:** ₹X,XXX.
- **Zero value:** Display "₹0".

**Business Rule (from `00_Founder_Decisions.md` — Decision 10):**
Reward Earned = Final Paid × Reward %. Not Original Bill.

---

## 9.4 Recent Transactions

- **Definition:** The latest N transactions for the business (not limited to today).
- **Source:** `transactions` joined with `customers`.
- **Order:** `created_at DESC` (newest first, from Decision 15).
- **Limit:** 5 (configurable).
- **Fields displayed:** Customer name/phone, final paid, reward used, payment method, time.

---

# 10. Validation

## Business Ownership

- Every query scoped to `business_id` from the authenticated user's session.
- RLS policies enforce isolation automatically.

## Session

- Every Server Action validates the session first.
- Expired sessions return `AUTH_REQUIRED`.

## Date Validation

- "Today" is computed server-side using the business's timezone or UTC.
- Date boundaries: today start (00:00:00) to today end (23:59:59).
- Client does not pass dates for summary — the server determines "today."

## Pagination

- Recent Transactions: `limit` parameter validated as 1–20.
- No offset pagination for dashboard (simple limit query).

## Permissions

- Both Owner and Staff can view the Dashboard.
- No owner-only restrictions on dashboard data.

---

# 11. Security

- **Only authenticated users.** Middleware and Server Actions validate session.
- **Business isolation.** All queries filtered by `business_id`. RLS enforced.
- **Staff permissions.** Staff can view the dashboard. No write operations on the dashboard.
- **Server validation.** All data aggregation happens server-side. Client never computes revenue, customer counts, or reward totals.
- **No client trust.** Dashboard values are computed server-side. Client renders only.

---

# 12. State Management

## 12.1 Server State (TanStack Query)

| Query               | Key                              | Stale Time | Refetch            |
| ------------------- | -------------------------------- | ---------- | ------------------ |
| Dashboard Summary   | `['dashboard', 'summary', date]` | 30s        | On focus, on mount |
| Recent Transactions | `['dashboard', 'transactions']`  | 30s        | On focus, on mount |

---

## 12.2 Client State (Zustand)

No Zustand store needed for the Dashboard.

Dashboard state is fully managed by TanStack Query (server state) and local React state.

---

## 12.3 Local UI State

| State          | Type      | Purpose                                  |
| -------------- | --------- | ---------------------------------------- |
| `isRefreshing` | `boolean` | Pull-to-refresh indicator                |
| `greeting`     | `string`  | Time-of-day greeting (computed on mount) |

---

# 13. Screen-to-API Mapping

| Screen    | Trigger         | Server Action             | Success                        | Failure           |
| --------- | --------------- | ------------------------- | ------------------------------ | ----------------- |
| Dashboard | Page load       | `getDashboardSummary()`   | Render summary cards           | Show error banner |
| Dashboard | Page load       | `getRecentTransactions()` | Render transaction list        | Show error banner |
| Dashboard | Pull to refresh | Client-side invalidation  | Refresh all data               | Show toast error  |
| Dashboard | Tap Add Visit   | Client navigation         | Navigate to /visit             | —                 |
| Dashboard | Tap Transaction | Client navigation         | Navigate to /transactions/[id] | —                 |
| Dashboard | Tap View All    | Client navigation         | Navigate to /transactions      | —                 |

---

# 14. Component Hierarchy

```text
DashboardLayout
├── AppBar (Business Name)
├── ScrollableContent
│   ├── GreetingCard
│   ├── SummaryCards
│   │   ├── RevenueCard
│   │   ├── CustomerCard
│   │   └── RewardCard
│   ├── QuickActionGrid
│   │   └── QuickActionButton ("Add Visit")
│   ├── RecentTransactionList
│   │   ├── SectionHeader ("Recent Transactions")
│   │   ├── TransactionCard (×5)
│   │   └── ViewAllLink
│   └── EmptyDashboard (conditional)
├── LoadingSkeleton (conditional)
├── ErrorBanner (conditional)
├── RefreshIndicator (conditional)
└── BottomNavigation
```

---

# 15. Dashboard State Machine

```text
Initial
    │
    ▼
Loading (skeleton)
    │
    ├── Success → Loaded
    │               │
    │               ├── Pull Refresh → Refreshing
    │               │                     │
    │               │                     ├── Success → Loaded (updated)
    │               │                     │
    │               │                     └── Failure → Loaded (stale) + Toast
    │               │
    │               ├── Focus Return → Refetch (background)
    │               │                     │
    │               │                     └── Same as Refreshing
    │               │
    │               └── Session Expired → Login
    │
    └── Failure → Error
                    │
                    ├── Retry → Loading
                    │
                    └── Session Expired → Login
```

---

# 16. Error States

## 16.1 Network Error

**User Message:** "Unable to load dashboard. Please check your connection."

**Display:** ErrorBanner at top of content area.

**Recovery:** Retry button. Also show cached data if available.

## 16.2 Unauthorized / Session Expired

**User Message:** None (silent redirect).

**Display:** Redirect to `/(auth)/login`.

**Recovery:** User re-authenticates.

## 16.3 Server Error

**User Message:** "Something went wrong. Please try again."

**Display:** ErrorBanner at top of content area.

**Recovery:** Retry button.

## 16.4 Refresh Failure

**User Message:** "Unable to refresh. Please try again."

**Display:** Toast notification.

**Recovery:** User pulls to refresh again. Stale data remains visible.

## 16.5 No Transactions

**User Message:** "No visits yet"

**Display:** EmptyDashboard component. Not an error — this is the expected first-day state.

**Recovery:** User taps "Add Visit" to create first transaction.

## 16.6 No Customers

**User Message:** Handled by EmptyDashboard (same as no transactions).

## 16.7 No Revenue

**User Message:** None. Revenue card shows "₹0". This is a valid state, not an error.

---

# 17. Loading States

## 17.1 Initial Load (Skeleton)

**Trigger:** Dashboard page mounts for the first time.

**UI:**

- Skeleton greeting text.
- Skeleton summary cards (3 shimmering rectangles).
- Skeleton transaction cards (3 shimmering cards).
- Bottom Navigation visible and functional.
- Duration: Until `getDashboardSummary()` and `getRecentTransactions()` resolve.

## 17.2 Refresh

**Trigger:** Pull-to-refresh gesture.

**UI:**

- RefreshIndicator spinner at top.
- Existing data remains visible during refresh (no skeleton replacement).
- Duration: Until queries resolve.

## 17.3 Background Refetch

**Trigger:** Window gains focus (TanStack Query `refetchOnWindowFocus`).

**UI:**

- No visible loading indicator.
- Data updates in place when response arrives.
- User sees updated values seamlessly.

---

# 18. Empty States

## 18.1 First Day (No Transactions Ever)

**Message:** "No visits yet"

**Sub-message:** "Start your first visit to see your dashboard come alive."

**Icon:** Lucide `ClipboardList` or `Sparkles`.

**CTA:** "Add Visit" button (primary style).

**Behavior:**

- Summary cards still display ₹0 / 0.
- Empty state replaces the Recent Transactions section.
- Bottom Navigation visible.

## 18.2 No Transactions Today

**Message:** "No visits today"

**Sub-message:** "Your recent transactions will appear here."

**Icon:** Lucide `Calendar`.

**CTA:** "Add Visit" button.

**Behavior:**

- Summary cards show ₹0 / 0.
- Recent Transactions section shows transactions from previous days (not scoped to today, to provide context).

## 18.3 No Customers

Handled by the same empty state as "No Transactions." Customers appear only in the context of transactions.

## 18.4 No Rewards

Not a special empty state. Rewards Given card shows "₹0." This is a valid state when no rewards have been earned today.

---

# 19. Edge Cases

## 19.1 Offline

- Show cached data (TanStack Query stale data).
- Show offline banner: "You are offline."
- Disable pull-to-refresh.
- Bottom Navigation remains functional for cached pages.

## 19.2 Slow Network

- Skeleton loading states remain visible.
- No client-side timeout.
- Data appears when server responds.

## 19.3 Pull Refresh Spam

- Debounce pull-to-refresh. Ignore rapid consecutive pulls.
- Only one refresh request active at a time.
- TanStack Query handles deduplication automatically.

## 19.4 Large Transaction List

- Dashboard shows only 5 recent transactions.
- "View All" navigates to the full Transactions page (Sprint 5).
- No performance concern for 5 items.

## 19.5 Session Expires on Dashboard

- Server Action returns `AUTH_REQUIRED`.
- Client handles by redirecting to login.
- No error banner — clean redirect.

## 19.6 Midnight Rollover

- "Today" is computed server-side.
- If the user is on the dashboard past midnight, pull-to-refresh updates to the new day's data.
- Summary cards reset to ₹0 / 0 for the new day.
- Recent Transactions list still shows latest transactions (not day-scoped).

## 19.7 Timezone Changes

- Server uses a consistent timezone for "today" calculations.
- Recommendation: Use the business's local timezone or UTC consistently.
- Do not rely on client timezone for data filtering.

## 19.8 No Catalog

- Dashboard still loads. Summary cards show ₹0 / 0.
- Add Visit CTA still available (catalog setup happens in the visit flow if empty).

## 19.9 Deleted / Archived Customer

- Transaction cards show phone number if customer name is null.
- Historical transactions remain intact regardless of customer status.

## 19.10 Concurrent Updates

- TanStack Query's `refetchOnWindowFocus` handles data freshness.
- If another device adds a transaction, pulling to refresh shows the updated data.
- No real-time sync in MVP.

---

# 20. Tasks

## Developer Checklist

### Dashboard UI

- [ ] Create `DashboardLayout` component.
- [ ] Create `GreetingCard` component.
- [ ] Create `RevenueCard` component.
- [ ] Create `CustomerCard` component.
- [ ] Create `RewardCard` component.
- [ ] Create `QuickActionGrid` component.
- [ ] Create `QuickActionButton` component.
- [ ] Create `TransactionCard` component.
- [ ] Create `RecentTransactionList` component.
- [ ] Create `EmptyDashboard` component.
- [ ] Create `LoadingSkeleton` for dashboard.
- [ ] Create `ErrorBanner` component.
- [ ] Create `RefreshIndicator` component.
- [ ] Create `BottomNavigation` component.

### Pages

- [ ] Create Dashboard page (`/(app)/dashboard/page.tsx`).
- [ ] Create `(app)` layout with Bottom Navigation.

### Server Actions

- [ ] Implement `getDashboardSummary()`.
- [ ] Implement `getRecentTransactions()`.

### State Management

- [ ] Create TanStack Query hooks for dashboard summary.
- [ ] Create TanStack Query hooks for recent transactions.
- [ ] Implement pull-to-refresh logic.
- [ ] Implement query invalidation strategy.

### Error Handling

- [ ] Handle network errors with ErrorBanner.
- [ ] Handle server errors with ErrorBanner.
- [ ] Handle session expiry with redirect.
- [ ] Handle refresh failure with toast.

### Responsive

- [ ] Test at 360px width.
- [ ] Test at 430px width.
- [ ] Verify touch targets ≥ 48×48px.
- [ ] Verify Bottom Navigation positioning.

### Testing

- [ ] Verify all acceptance criteria.
- [ ] Responsive testing.
- [ ] Accessibility testing.
- [ ] Performance testing.

---

# 21. Acceptance Criteria

### Dashboard Load

- [ ] Dashboard loads within 2 seconds.
- [ ] Dashboard shows skeleton during loading.
- [ ] No full-screen spinners.
- [ ] Login to Dashboard completes in ≤ 5 seconds.

### Greeting

- [ ] Morning greeting shown between 5:00–11:59.
- [ ] Afternoon greeting shown between 12:00–16:59.
- [ ] Evening greeting shown between 17:00–4:59.
- [ ] Business name displayed.

### Summary Cards

- [ ] Revenue card shows today's total `final_paid`.
- [ ] Revenue formatted as ₹X,XXX with thousand separators.
- [ ] Customer card shows today's unique customer count.
- [ ] Rewards card shows today's total `reward_earned`.
- [ ] All cards show ₹0 / 0 when no data (not empty state).
- [ ] All cards show skeleton during loading.

### Recent Transactions

- [ ] Displays latest 5 transactions.
- [ ] Ordered newest first.
- [ ] Shows customer name or phone.
- [ ] Shows final paid amount.
- [ ] Shows reward used.
- [ ] Shows payment method badge.
- [ ] Shows relative time ("2 min ago").
- [ ] "View All" link navigates to Transactions page.

### Navigation

- [ ] Tapping Add Visit navigates to visit flow.
- [ ] Tapping a transaction card navigates to detail.
- [ ] Bottom Navigation shows 5 tabs.
- [ ] Home tab is active on Dashboard.
- [ ] All tab icons are visible and tappable.
- [ ] Add Visit button is visually prominent.

### Pull to Refresh

- [ ] Pull down gesture triggers refresh.
- [ ] Refresh indicator visible during refresh.
- [ ] Summary cards update after refresh.
- [ ] Transaction list updates after refresh.
- [ ] Failed refresh shows toast error.
- [ ] Rapid pulls are debounced.

### Empty State

- [ ] First day shows empty state message.
- [ ] Empty state includes Add Visit CTA.
- [ ] Summary cards show ₹0 / 0 above empty state.

### Error Handling

- [ ] Network error shows ErrorBanner with retry.
- [ ] Server error shows ErrorBanner with retry.
- [ ] Retry button re-fetches data.
- [ ] Session expired redirects to login silently.

### Offline

- [ ] Cached data shown when offline.
- [ ] Offline banner displayed.
- [ ] Pull-to-refresh disabled when offline.

### Responsive

- [ ] Layout correct at 360px.
- [ ] Layout correct at 430px.
- [ ] Touch targets ≥ 48×48px.
- [ ] Bottom Navigation properly positioned.
- [ ] Content scrolls behind Bottom Navigation.

### Accessibility

- [ ] WCAG AA contrast ratios.
- [ ] Semantic HTML.
- [ ] Screen reader reads card values.
- [ ] Focus states visible.
- [ ] `prefers-reduced-motion` respected.

---

# 22. Definition of Done

## Build

- [ ] `npm run build` — no errors.
- [ ] `npx tsc --noEmit` — no TypeScript errors.
- [ ] `npm run lint` — no warnings.

## Responsive

- [ ] Dashboard renders correctly at 360px–430px.
- [ ] Touch targets ≥ 48×48px.
- [ ] Bottom Navigation positioned correctly.

## Accessibility

- [ ] WCAG AA contrast ratios on all text.
- [ ] Semantic HTML.
- [ ] `aria-label` on icon-only elements.
- [ ] Visible focus states.
- [ ] `prefers-reduced-motion` respected.

## Performance

- [ ] Dashboard loads in < 2 seconds.
- [ ] Pull-to-refresh completes in < 1 second.
- [ ] 60 FPS scrolling.
- [ ] No layout shifts during loading.

## Security

- [ ] All data fetched server-side.
- [ ] RLS enforced.
- [ ] No secrets exposed.

## PRD Compliance

- [ ] Dashboard matches `00_Founder_Decisions.md` — Decision 16.
- [ ] No charts.
- [ ] No analytics.
- [ ] Recent transactions ordered newest first (Decision 15).
- [ ] Revenue = Final Paid (Decision 17).

## UI Specification Compliance

- [ ] Design tokens from `09_UI_UX_Specification.md` used.
- [ ] Bottom Navigation with glass material.
- [ ] Inter font applied.
- [ ] Skeleton loading (no spinners).
- [ ] 98% press scale on buttons and cards.

---

# 23. File Structure

Every file that Sprint 3 creates:

```
src/
├── app/
│   └── (app)/
│       ├── dashboard/
│       │   └── page.tsx                    # Dashboard page
│       └── layout.tsx                      # App layout (Bottom Navigation)
│
├── components/
│   └── ui/
│       ├── skeleton.tsx                    # shadcn/ui Skeleton (if not added)
│       └── badge.tsx                       # shadcn/ui Badge (payment method)
│
├── features/
│   └── dashboard/
│       ├── components/
│       │   ├── dashboard-layout.tsx        # Dashboard page wrapper
│       │   ├── greeting-card.tsx           # Time-based greeting
│       │   ├── revenue-card.tsx            # Today's revenue
│       │   ├── customer-card.tsx           # Today's customers
│       │   ├── reward-card.tsx             # Today's rewards given
│       │   ├── quick-action-grid.tsx       # Quick action container
│       │   ├── quick-action-button.tsx     # Individual quick action
│       │   ├── recent-transaction-list.tsx # Recent transactions section
│       │   ├── transaction-card.tsx        # Single transaction card
│       │   ├── empty-dashboard.tsx         # Empty state
│       │   ├── loading-skeleton.tsx        # Dashboard skeleton
│       │   ├── error-banner.tsx            # Error with retry
│       │   └── refresh-indicator.tsx       # Pull-to-refresh indicator
│       ├── actions/
│       │   ├── get-dashboard-summary.ts    # getDashboardSummary server action
│       │   └── get-recent-transactions.ts  # getRecentTransactions server action
│       ├── hooks/
│       │   ├── use-dashboard-summary.ts    # TanStack Query summary hook
│       │   ├── use-recent-transactions.ts  # TanStack Query transactions hook
│       │   └── use-greeting.ts             # Time-of-day greeting hook
│       ├── schemas/                         # Empty (no forms on dashboard)
│       ├── types/
│       │   └── dashboard-types.ts          # Dashboard-related types
│       ├── stores/                          # Empty (no Zustand needed)
│       ├── services/                        # Empty
│       ├── utils/
│       │   ├── format-currency.ts          # ₹X,XXX formatter
│       │   └── format-relative-time.ts     # "2 min ago" formatter
│       ├── constants/
│       │   └── dashboard-constants.ts      # Query limits, stale times
│       └── index.ts                         # Public exports
│
├── components/
│   └── shared/
│       └── bottom-navigation.tsx           # Shared Bottom Navigation

```

---

# 24. Dependencies

| Package                       | Purpose                                                                            |
| ----------------------------- | ---------------------------------------------------------------------------------- |
| `@tanstack/react-query`       | Server state for dashboard summary and recent transactions.                        |
| `@supabase/supabase-js`       | Database queries via Supabase client.                                              |
| `@supabase/ssr`               | Server-side Supabase client.                                                       |
| `lucide-react`                | Icons: Home, ClipboardList, Plus, BarChart3, MoreHorizontal, ArrowRight, Sparkles. |
| `clsx` / `tailwind-merge`     | Conditional class names (`cn()`).                                                  |
| `sonner` or `react-hot-toast` | Toast notifications for refresh errors.                                            |

No new dependencies needed. All are installed from Sprint 1.

---

# 25. Testing Checklist

Manual QA checklist for Sprint 3.

### Dashboard Load

- [ ] Dashboard loads with skeleton.
- [ ] Skeleton replaced by data within 2 seconds.
- [ ] No full-screen spinners.
- [ ] Login → Dashboard in ≤ 5 seconds.

### Summary Values

- [ ] Revenue matches sum of today's `final_paid`.
- [ ] Customer count matches today's unique customers.
- [ ] Rewards given matches today's `reward_earned`.
- [ ] Zero values show ₹0 / 0 (not empty).

### Recent Transactions

- [ ] Newest transaction first.
- [ ] Maximum 5 displayed.
- [ ] Customer name or phone shown.
- [ ] Amounts formatted correctly.
- [ ] Payment method badge shown.
- [ ] Relative time shown ("2 min ago").
- [ ] Tapping card navigates to detail.

### Navigation

- [ ] Add Visit CTA navigates to visit flow.
- [ ] View All navigates to transactions.
- [ ] Bottom nav tabs all functional.
- [ ] Home tab active on dashboard.

### Pull to Refresh

- [ ] Gesture triggers refresh.
- [ ] Indicator visible.
- [ ] Data updates after refresh.
- [ ] Failed refresh shows toast.

### Empty State

- [ ] No transactions → empty state shown.
- [ ] Empty state has Add Visit CTA.
- [ ] Summary cards show zero values.

### Responsive

- [ ] Correct at 360px.
- [ ] Correct at 430px.
- [ ] Touch targets ≥ 48px.
- [ ] Bottom nav positioned correctly.

### Offline

- [ ] Cached data shown when offline.
- [ ] Offline banner visible.
- [ ] Pull-to-refresh disabled.

### Accessibility

- [ ] Tab navigation works.
- [ ] Focus rings visible.
- [ ] Screen reader reads values.
- [ ] `prefers-reduced-motion` respected.

### Performance

- [ ] Load < 2 seconds.
- [ ] Refresh < 1 second.
- [ ] 60 FPS scrolling.
- [ ] No layout shifts.

---

# 26. Implementation Order

**Phase 1 — Routes & Layout**

- Create `/(app)` route group.
- Create app layout with Bottom Navigation placeholder.
- Create Dashboard page stub.

↓

**Phase 2 — Bottom Navigation**

- Build BottomNavigation component.
- Integrate with app layout.
- Add all 5 tab icons and labels.
- Mark Home as active.

↓

**Phase 3 — Summary Cards**

- GreetingCard.
- RevenueCard.
- CustomerCard.
- RewardCard.
- LoadingSkeleton for cards.

↓

**Phase 4 — Recent Transactions**

- TransactionCard.
- RecentTransactionList.
- EmptyDashboard.

↓

**Phase 5 — Server Actions**

- `getDashboardSummary()`.
- `getRecentTransactions()`.
- TanStack Query hooks.

↓

**Phase 6 — Refresh**

- Pull-to-refresh implementation.
- RefreshIndicator.
- Query invalidation.

↓

**Phase 7 — Error Handling**

- ErrorBanner.
- Toast for refresh failure.
- Session expiry redirect.
- Offline detection.

↓

**Phase 8 — Utilities**

- Currency formatter (₹X,XXX).
- Relative time formatter ("2 min ago").
- Greeting time logic.

↓

**Phase 9 — QA**

- Acceptance Criteria verification.
- Responsive testing.
- Accessibility testing.
- Performance testing.

_Why this order?_ Layout and navigation establish the app shell that all future sprints build on. Summary cards and transactions compose the core content. Server Actions wire the data. Refresh and error handling polish the experience. Utilities are extracted during development. QA verifies everything.

---

# 27. Sprint Ownership

**Sprint 3 Owns:**

- Dashboard page (`/(app)/dashboard`).
- App layout (`/(app)/layout.tsx`).
- Bottom Navigation component.
- Dashboard summary Server Actions.
- Dashboard components (greeting, cards, transactions, empty, skeleton, error).
- Dashboard TanStack Query hooks.
- Currency and time formatting utilities.

_Strict Rule:_ No other sprint should modify these files unless absolutely necessary. The Dashboard is a locked foundation after Sprint 3.

---

# 28. Out of Scope

**Sprint 3 must NOT build or modify:**

- Billing / Add Visit (Sprint 4)
- Transaction Detail (Sprint 5)
- Catalog Management
- Reward Rules
- Settings
- Insights (Sprint 6)
- Staff Management
- Notifications
- Analytics Charts
- Date Filters
- Export

_These features belong strictly to future sprints._

---

# 29. Performance Targets

| Metric               | Target      |
| -------------------- | ----------- |
| Dashboard First Load | < 2 seconds |
| Pull to Refresh      | < 1 second  |
| Card Rendering       | < 100ms     |
| Touch Response       | < 100ms     |
| Scroll FPS           | 60 FPS      |
| Login to Dashboard   | ≤ 5 seconds |
| Time to Interactive  | < 3 seconds |
| Layout Shift (CLS)   | 0           |

---

# 30. AI Coding Instructions

**Every AI-generated implementation must:**

- Follow `Development/00_Project_Setup.md`.
- Follow patterns from Sprint 1 (Authentication) and Sprint 2 (Onboarding).
- Follow `09_UI_UX_Specification.md` design tokens and component rules.
- Follow `08_API_Design.md` response formats.
- Follow `00_Founder_Decisions.md` exactly.
- Reuse components from Sprint 1 and Sprint 2 (Button, Input, Toast, ErrorMessage).
- Use Server Actions for all data fetching.
- Use TanStack Query for all server state.
- Never compute dashboard values on the client.
- Never duplicate business logic.
- Never invent calculations not defined in this document.
- Never bypass authentication.
- Prefer Server Components unless client interactivity is required.
- Maintain strict TypeScript. No `any` type.
- Compose from shadcn/ui instead of rewriting components.
- Use existing design tokens for all colors, spacing, typography, and radius.

---

# 31. Sprint Success Definition

The Dashboard is successful when a business owner can:

**Login → Immediately understand today's business performance → Start a new visit with one tap → Review recent activity → Continue working without confusion.**

The Dashboard should feel like a professional POS home screen.

It answers: "What happened today?" and "What should I do next?"

It does not try to be an analytics dashboard, a reporting tool, or an admin panel.

Speed over features. Clarity over complexity. Action over information overload.

---

# 32. Version History

| Version | Status  | Changes                 |
| ------- | ------- | ----------------------- |
| 1.0     | Initial | Sprint document created |

---

# Document Status

✅ Ready for Development

This document is the complete implementation specification for the RewardLoop Dashboard (Sprint 3). Every decision is grounded in the approved planning documents. No business rules have been invented. A developer or AI coding agent can build the entire Dashboard from this document alone.
