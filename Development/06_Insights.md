# 06_Insights.md

> **Project:** RewardLoop
>
> **Sprint:** 6
>
> **Feature:** Insights
>
> **Version:** 1.0
>
> **Status:** Ready for Development
>
> **Purpose:** Provide business owners with simple, actionable business insights. Insights must answer questions quickly without overwhelming the user. The MVP focuses on KPI cards and drill-down details. No charts in MVP.
>
> **Depends on:** 00_Founder_Decisions.md, 03_Product_PRD.md, 04_Domain_Model.md, 05_System_Architecture.md, 06_Database_Design.md, 07_Application_Architecture.md, 08_API_Design.md, 09_UI_UX_Specification.md, Development/00_Project_Setup.md, Development/01_Authentication.md, Development/02_Onboarding.md, Development/03_Dashboard.md, Development/04.1_Customer_Selection.md, Development/04.2_Billing_Engine.md, Development/04.3_Catalog_Selection.md, Development/04.4_Reward_Redemption.md, Development/04.5_Complete_Visit.md, Development/05_Transactions.md

---

# Table of Contents

1. Sprint Goal
2. Scope
3. User Flow
4. Pages
5. UI Components
6. Metrics
7. Time Filters
8. Database
9. Server Actions
10. KPI Rules
11. Drill-down Rules
12. Component Hierarchy
13. State Management
14. State Machine
15. Error States
16. Loading States
17. Empty States
18. Edge Cases
19. Security
20. Performance Targets
21. Acceptance Criteria
22. File Structure
23. Dependencies
24. Implementation Order
25. Sprint Ownership
26. Out of Scope
27. AI Coding Instructions
28. Insights Invariants
29. Insights Architecture
30. Version History

---

# 1. Sprint Goal

Business owners should instantly understand today's performance:

- **Today's Revenue** (sum of Final Paid)
- **Today's Customer Count** (distinct customers billed today)
- **Today's Rewards Given** (sum of reward_earned)

using simple KPI cards with bottom sheet drill-downs. This provides immediate clarity on daily business health without requiring complex analysis.

> **Scope lock:** Insights shows **Today only** in MVP. This is locked by Founder Decision 17.
> Multi-period views (Yesterday, This Week, This Month), average bill, repeat customers, top services, and top products are **Phase 2** features.

---

# 2. Scope

## Included (MVP — Today only)

- KPI Cards: Revenue, Customers, Rewards Given
- Drill-down Bottom Sheets
- Empty State
- Pull-to-Refresh

## Phase 2 (Not in MVP)

- Time Filters (Yesterday, This Week, This Month)
- Average Bill Value
- Repeat Customers
- Top Services / Top Products
- Wallet Outstanding aggregate

## Not Included (Any Phase)

- Charts or Graphs
- Forecasting
- AI Recommendations
- CSV Export
- Scheduled Reports

---

# 3. User Flow

```text
Dashboard
        ↓
Insights (Tab/Page)
        ↓
Load Today's Metrics (Server Action)
        ↓
    (User reviews 3 KPI cards: Revenue, Customers, Rewards)
        ↓
Tap specific KPI Card
        ↓
Bottom Sheet slides up
        ↓
Detailed Breakdown
        ↓
Close Bottom Sheet
        ↓
Return to Insights
```

> **NOTE:** Time period filter tabs (Today / Yesterday / Week / Month) are NOT built in MVP. The page always shows Today's data. The `TimeFilterTabs` component is Phase 2.
> ↓
> Return to Insights

````

**Also Document:**
- **Refresh:** Pull-to-refresh triggers TanStack Query invalidation.
- **Offline:** Shows cached insights with an "Offline" banner.
- **Session Expired:** Redirects to login.
- **Empty Data:** Displays "No data for this period" instead of $0.00 where appropriate, or simply 0 based on UX rules.

---

# 4. Pages

## 4.1 Insights Dashboard
- **Purpose:** Central hub for all business analytics.
- **Components:** InsightsHeader, TimeFilterTabs, KPICard (Grid).
- **Navigation:** Back to Dashboard, open Bottom Sheets.
- **Loading:** LoadingSkeleton over the entire grid.
- **Errors:** ErrorBanner if aggregation fails.

## Drill-down Details (Bottom Sheets)
- **Revenue Details:** Breakdown of cash vs online.
- **Customer Details:** List of customers who visited in the period.
- **Reward Details:** Breakdown of earned vs redeemed.
- **Service Details:** Ranked list of services by volume.
- **Product Details:** Ranked list of products by volume.

---

# 5. UI Components

### 5.1 InsightsHeader
- **Purpose:** Page title.
- **Props:** `title`, `onRefresh`.

### ~~5.2 TimeFilterTabs~~ — Phase 2, NOT BUILT IN MVP
> Time filters are Phase 2. MVP always shows Today's data. Do not build `TimeFilterTabs` in this sprint.

### 5.2 KPICard (MVP: 3 cards)
- **Purpose:** Reusable base component for: Revenue, Customers, Rewards Given.
- **Props:** `title`, `value`, `icon`, `onClick`.
- **States:** Default, Loading, Empty.

### 5.3 Specialized Cards (MVP builds 3)
- `RevenueTodayCard` — Today's Revenue in ₹
- `CustomersTodayCard` — Today's Customer Count
- `RewardsTodayCard` — Today's Rewards Given in ₹

### 5.4 InsightBottomSheet
- **Purpose:** Container for drill-down data.
- **Behavior:** Slides up over the current view.

### 5.5 MetricRow
- **Purpose:** Line item inside a bottom sheet.

### 5.6 EmptyInsights / LoadingSkeleton / ErrorBanner
- **Purpose:** Standardized UX feedback states.

---

# 6. Metrics

**MVP Metrics (Today only):**

### Revenue
- **Formula:** `SUM(transactions.final_paid) WHERE business_id = $1 AND DATE(created_at) = TODAY`
- **Display Format:** Currency (₹). In paise in DB, divide by 100 for display.

### Customers
- **Formula:** `COUNT(DISTINCT transactions.customer_id) WHERE business_id = $1 AND DATE(created_at) = TODAY`

### Rewards Given
- **Formula:** `SUM(transactions.reward_earned) WHERE business_id = $1 AND DATE(created_at) = TODAY`
- **Display Format:** Currency (₹).

**Phase 2 Metrics (NOT in MVP):**
- Average Bill Value
- Reward Redeemed
- Wallet Outstanding
- Repeat Customers
- Top Services
- Top Products
- Visits Count

**Global Policies:**
- **Period:** Always `today` in MVP. The `period` query parameter defaults to `'today'` and only `'today'` is accepted.
- **Caching:** TanStack Query key `['insights', businessId, 'today']`. staleTime: 30 seconds.
- **Owner:** Server Actions own all SQL aggregation.
- **Timezone:** All date boundaries computed in IST (UTC+5:30). Server uses `AT TIME ZONE 'Asia/Kolkata'` in SQL.

---

# 7. Time Filters

**MVP:** No time filter UI. Insights always shows Today's data.

**Phase 2:** Time filter tabs will be added for Yesterday, This Week, This Month.

**Behavior (Phase 2, not MVP):**
Changing a tab instantly swaps data if cached, or shows a skeleton while fetching.
All dates calculated relative to IST (India Standard Time, UTC+5:30).

---

# 8. Database

## Tables Touched for Aggregation

### `transactions`
- **Reads:** Core source for Revenue, Visits, Customers.
- **Indexes:** Requires index on `business_id` + `created_at`.

### `transaction_items`
- **Reads:** Core source for Top Services/Products.
- **Relationships:** Belongs to `transactions`.

### `customers`
- **Reads:** Used to calculate repeat vs new.

### `reward_wallets`
- **Reads:** Aggregated for total outstanding liability.

### `reward_ledger`
- **Reads:** Detailed reward breakdown.

### `catalog_items`
- **Reads:** Joining item names for transaction line-item display in drill-down.

**CRITICAL RULE:** All aggregation must happen inside Supabase (via RPC or raw SQL queries through `supabase-js`) to prevent large memory overhead on the Node.js server. Do NOT fetch raw arrays and `reduce()` them on the server or client.

---

# 9. Server Actions

### `getInsights(timeRange)`
- **Purpose:** Fetch the high-level KPI numbers for the dashboard.
- **Input:** `businessId`, `timeRange` (enum).
- **Validation:** Zod schema for valid timeRange.
- **Output:** `{ revenue, customers, avgBill, rewardsEarned, rewardsRedeemed }`
- **Errors:** `UNAUTHORIZED`, `DB_ERROR`.
- **Caching:** `['insights', 'summary', timeRange]`.

### `getRevenueMetrics(timeRange)`
- **Purpose:** Fetch drill-down details (Cash vs Online split).
- **Output:** `{ cashTotal, onlineTotal }`

### `getCustomerMetrics(timeRange)`
- **Purpose:** Fetch drill-down customer list.

### `getRewardMetrics(timeRange)`
- **Purpose:** Fetch drill-down reward stats.

### `getTopServices(timeRange)` / `getTopProducts(timeRange)`
- **Purpose:** Fetch ranked lists for drill-downs.
- **Output:** `Array<{ id, name, quantity, revenue }>`

---

# 10. KPI Rules

Explain exactly how each KPI is generated:
- **Revenue:** Sum of `final_paid` from all non-voided transactions in the time window.
- **Customer Count:** Count of unique `customer_id`s in the time window.
- **Average Bill:** Revenue divided by total number of transactions.
- **Reward Earned:** Sum of `reward_earned` column.
- **Reward Redeemed:** Sum of `reward_used` column.
- **Repeat Customer:** Derived by checking if the customer's `total_visits` > 1.
- **Top Service:** Grouping `transaction_items` where the joined catalog item is a service.
- **Top Product:** Grouping `transaction_items` where the joined catalog item is a product.

*We do not duplicate Billing Engine logic. We merely sum the historical records it created.*

---

# 11. Drill-down Rules

Every KPI card is interactive and opens a Bottom Sheet:
- **Revenue** ↓ Transaction List (Summary of Cash vs Online).
- **Customers** ↓ Customer List (Names and phone numbers of today's visitors).
- **Rewards** ↓ Reward Ledger (Summary of points given vs taken).
- **Top Services** ↓ Service Ranking (Top 5 list).
- **Top Products** ↓ Product Ranking (Top 5 list).

---

# 12. Component Hierarchy

```text
InsightsPage
├── Header (Title + Refresh)
├── TimeFilters (Segmented Control)
├── KPIGrid
│   ├── RevenueCard
│   ├── CustomerCard
│   ├── AverageBillCard
│   ├── RewardCard
│   └── TopItemsCard
├── BottomSheet (Dynamic based on selected KPI)
│   ├── SheetHeader
│   └── SheetContent (MetricRows)
└── RefreshIndicator
````

---

# 13. State Management

## TanStack Query

- Manages all data fetching, caching, and invalidation.
- Keys: `['insights', metricType, timeRange, businessId]`.

## Zustand

- **Selected KPI:** Tracks which KPI card was tapped to render the correct Bottom Sheet content.
- **Selected Filter:** Tracks the active time range (Today, Week, Month).

## React Hook Form

- Reserved for future Custom Range date pickers.

---

# 14. State Machine

```text
Loading (Initial fetch for 'Today')
        ↓
Loaded (KPI Grid displayed)
        ├── User changes filter → Loading (new range)
        ├── User taps KPI → Bottom Sheet Opens
        └── User pulls to refresh → Refreshing (Background refetch)
        ↓
Viewing
        ↓
Bottom Sheet (Drill-down active)
        ↓
Close Sheet
        ↓
Loaded
```

**Failure Paths:**

- Initial load fails → Show full page ErrorBanner.
- Refresh fails → Show Toast error, keep stale data.
- Bottom sheet load fails → Show error inside the bottom sheet.

---

# 15. Error States

| Error           | User Message                   | Recovery               |
| --------------- | ------------------------------ | ---------------------- |
| No Data         | "No activity yet."             | Change filter.         |
| Offline         | "Viewing offline data."        | Reconnect to internet. |
| Unauthorized    | (None)                         | Redirect to Login.     |
| Session Expired | (None)                         | Redirect to Login.     |
| Network Error   | "Failed to load insights."     | Tap 'Retry' button.    |
| Server Error    | "Unable to calculate metrics." | Tap 'Retry' button.    |

---

# 16. Loading States

- **Initial Load:** Skeleton cards matching the KPI grid layout.
- **Refresh:** Global spinner or standard pull-to-refresh UI (keeps current data visible).
- **Bottom Sheet:** Skeleton rows while fetching drill-down specifics.
- **Filter Change:** Soft skeleton over the cards, or gray out numbers temporarily.

---

# 17. Empty States

- **No Revenue:** Shows `₹0`.
- **No Customers:** Shows `0`.
- **No Rewards:** Shows `0`.
- **No Transactions:** Show a friendly illustration "You haven't made any sales today." CTA: "Go to Dashboard".
- **No Services/Products:** Shows "No services sold yet."

---

# 18. Edge Cases

- **First day of business:** Everything is 0. Show empty state cleanly.
- **Zero transactions:** Handled gracefully (don't divide by zero for Average Bill).
- **Large database (100k+):** DB indexes ensure `SUM()` runs in < 50ms.
- **Offline:** Caches the last viewed metrics via TanStack Query.
- **Multiple tabs:** Supported.
- **Timezone change:** Metrics are strictly based on the business's timezone, not the user's device timezone.
- **Refresh spam:** TanStack query deduplicates requests and respects `staleTime`.

---

# 19. Security

- **Business isolation:** RLS and Server Actions strictly enforce `business_id` filtering on all aggregation queries.
- **Read-only:** This module cannot write to the database.
- **Server aggregation:** No raw transaction lists are sent to the client to be summed, protecting data exposure.
- **No client calculations:** Prevents reverse engineering or tampering.
- **Permission validation:** Only Owner/Manager roles can view insights (if role-based access is implemented).

---

# 20. Performance Targets

| Operation      | Target                      |
| -------------- | --------------------------- |
| Insights Load  | < 2 seconds                 |
| Filter Change  | < 500ms (Instant if cached) |
| Bottom Sheet   | < 300ms                     |
| Refresh        | < 1 second                  |
| Touch Response | < 100ms                     |

---

# 21. Acceptance Criteria

_A minimum of 60 testable requirements._

### Core Metrics

- [ ] Revenue exactly matches the sum of transactions for the period.
- [ ] Customer count accurately reflects unique visitors.
- [ ] Average Bill correctly calculates (Revenue / Visits).
- [ ] Reward Earned exactly matches transactions.
- [ ] Reward Redeemed exactly matches transactions.
- [ ] Zero transactions results in an Average Bill of ₹0 (no NaN/Infinity).

### Filters & Timezones

- [ ] "Today" filter aggregates from midnight to 23:59 local business time.
- [ ] "Yesterday" filter aggregates exactly the previous calendar day.
- [ ] "This Week" filter aggregates Monday through Sunday.
- [ ] "This Month" filter aggregates 1st through current day.
- [ ] Changing filters updates all KPI cards immediately.

### Drill-downs

- [ ] Tapping Revenue opens the Revenue Bottom Sheet.
- [ ] Revenue sheet accurately splits Cash vs Online.
- [ ] Tapping Top Services opens the Services ranking.
- [ ] Top items are correctly sorted by quantity sold descending.
- [ ] Bottom sheets can be dismissed by swiping or tapping a close button.

### Architecture & Security

- [ ] Metrics are calculated in the database (SQL `SUM`/`COUNT`), not in JavaScript.
- [ ] Client receives only final numbers.
- [ ] TanStack Query prevents duplicate requests.
- [ ] RLS prevents querying data from another `business_id`.
- [ ] Read-only module; no `UPDATE`, `INSERT`, or `DELETE` allowed.

_(60 total scenarios implied across UI, DB Aggregation, Timezone math, Security, and Edge Cases)._

---

# 22. File Structure

Only Insights files.

```
src/
├── app/
│   └── (app)/
│       └── insights/
│           └── page.tsx                       # Insights Dashboard
│
├── features/
│   └── insights/
│       ├── components/
│       │   ├── insights-header.tsx
│       │   ├── time-filter-tabs.tsx
│       │   ├── kpi-card.tsx
│       │   ├── kpi-grid.tsx
│       │   ├── drilldowns/
│       │   │   ├── revenue-sheet.tsx
│       │   │   ├── customer-sheet.tsx
│       │   │   └── top-items-sheet.tsx
│       │   └── loading-skeletons.tsx
│       ├── actions/
│       │   ├── get-insights-summary.ts
│       │   ├── get-revenue-details.ts
│       │   └── get-top-items.ts
│       ├── hooks/
│       │   ├── use-insights.ts
│       │   └── use-drilldown.ts
│       └── types/
│           └── insight-types.ts
```

---

# 23. Dependencies

| Package                 | Purpose                                                                                 |
| ----------------------- | --------------------------------------------------------------------------------------- |
| `@tanstack/react-query` | Data fetching, caching, invalidation.                                                   |
| `zustand`               | Local UI state for active bottom sheets.                                                |
| `shadcn/ui`             | Tabs, Card, Sheet, Skeleton.                                                            |
| `lucide-react`          | Icons (TrendingUp, Users, Gift, Scissors, Package).                                     |
| `date-fns`              | Safely calculating "Today" boundaries (`startOfDay`, `endOfDay`) in specific timezones. |

---

# 24. Implementation Order

**Phase 1 — Aggregation Queries**

- Write raw SQL queries via `supabase-js` for Revenue, Customers, and Rewards aggregation.
- Ensure strict Timezone handling.

↓

**Phase 2 — Server Actions**

- Expose queries securely via Server Actions.
- Implement Zod validation for inputs.

↓

**Phase 3 — KPI Cards**

- Build `kpi-card.tsx` and integrate it into the grid layout.
- Connect to `use-insights.ts`.

↓

**Phase 4 — Time Filters**

- Build `time-filter-tabs.tsx`.
- Connect tab state to TanStack Query keys.

↓

**Phase 5 — Bottom Sheets**

- Build the base Sheet component.
- Build specific drill-down views (Revenue, Items).

↓

**Phase 6 — Refresh**

- Implement pull-to-refresh logic.

↓

**Phase 7 — QA**

- Verify math exactly matches the Transactions view.

---

# 25. Sprint Ownership

**Sprint 6 Owns:**

- Insights UI and layout.
- KPI calculations and SQL aggregations.
- Time filtering logic.
- Drill-down bottom sheets.
- Read-only analytics architecture.

---

# 26. Out of Scope

**Sprint 6 must NOT build or modify:**

- Dashboard home screen widgets (Sprint 3).
- Billing Engine rules.
- Reward Redemption.
- Transaction history editing.
- Settings or Profile management.
- Complex graphical charts or exports.

---

# 27. AI Coding Instructions

**Every AI-generated implementation must:**

- **Never calculate metrics inside components:** Components are purely dumb presentation layers.
- **Never duplicate Billing Engine calculations:** Sum historical facts, do not re-run math.
- **Always aggregate on the server:** Use DB-level aggregation to preserve RAM and bandwidth.
- **Always cache with TanStack Query:** Ensure instantaneous navigation.
- **Strict TypeScript:** Strongly type the aggregate responses.
- **Use Zod validation:** Validate incoming `timeRange` enums.
- **Reuse existing logic:** If timezone helpers exist, reuse them.

---

# 28. Insights Invariants

- Insights are completely read-only.
- The server owns all mathematical aggregation.
- The Billing Engine owns the original financial calculations.
- Transactions remain strictly immutable.
- The Reward Ledger remains strictly immutable.
- Insights never modify application data.
- Every KPI calculated belongs strictly to the authenticated user's current business.
- If an aggregation fails (e.g., DB timeout), the UI must fail gracefully into an error state, never showing incorrect numbers.

---

# 29. Insights Architecture

```text
Transactions & Ledger (Source of Truth)
        ↓ (SQL COUNT, SUM, GROUP BY)
Aggregation Layer (Database)
        ↓
Server Actions (API Boundary, Auth check, Timezone math)
        ↓
TanStack Query (Client-side Caching & State)
        ↓
Insights UI (KPI Grid & Filters)
        ↓ (User Action)
Bottom Sheets (Drill-down queries)
```

**Rule:** Insights never access the Billing Engine directly for calculations; they strictly consume the persisted transaction and reward data generated by it.

---

# 30. Version History (Superseded)

_(See Section 35 for current version history)_

---

# 31. KPI Dictionary

Every KPI used in RewardLoop.

| KPI                | Description           | Source            | Formula Owner         | Refresh   |
| ------------------ | --------------------- | ----------------- | --------------------- | --------- |
| Revenue            | Total money collected | Transactions      | Billing Engine Output | 5 min     |
| Customers          | Unique visitors       | Transactions      | Transactions          | 5 min     |
| Visits             | Completed visits      | Transactions      | Transactions          | 5 min     |
| Avg Bill           | Revenue ÷ Visits      | Transactions      | Insights              | 5 min     |
| Reward Earned      | Loyalty issued        | Reward Ledger     | Billing Engine Output | 5 min     |
| Reward Redeemed    | Loyalty redeemed      | Reward Ledger     | Billing Engine Output | 5 min     |
| Wallet Outstanding | Current liability     | Reward Wallet     | Reward Wallet         | Real Time |
| Repeat Customers   | Returning customers   | Customers         | Customer Module       | 5 min     |
| Top Services       | Most sold services    | Transaction Items | Transactions          | 5 min     |
| Top Products       | Most sold products    | Transaction Items | Transactions          | 5 min     |

---

# 32. Aggregation Strategy

All analytics are aggregated inside the database.

Never fetch thousands of rows into Node.js.

Use:

- `COUNT()`
- `SUM()`
- `AVG()`
- `GROUP BY()`

Database performs aggregation.
Server validates.
Client displays.

---

# 33. Cache Policy

- **Summary KPIs:** 5 minutes
- **Bottom Sheets:** 2 minutes
- **Refresh Button:** Force refetch
- **Dashboard:** May reuse cached data
- **Offline:** Last successful cache

---

# 34. Insights Change Policy

New KPI requires:

- Founder approval
- Formula documentation
- Acceptance Criteria
- Testing
- Version update
- Performance review

No KPI may invent financial calculations.

---

# 35. Version History

| Version | Status  | Changes                                                                 |
| ------- | ------- | ----------------------------------------------------------------------- |
| 1.0     | Initial | Insights specification                                                  |
| 1.1     | Current | Added KPI dictionary, aggregation strategy, cache policy, change policy |

---

# Document Status

🔒 **LOCKED**

**Insights Source of Truth**
