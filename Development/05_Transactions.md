# 05_Transactions.md

> **Project:** RewardLoop
>
> **Sprint:** 5
>
> **Feature:** Transactions
>
> **Version:** 1.0
>
> **Status:** Ready for Development
>
> **Purpose:** Allow business owners to review completed transactions quickly and accurately. Transactions are immutable financial records. Only limited edits approved by Founder Decisions are allowed.
>
> **Depends on:** 00_Founder_Decisions.md, 04_Domain_Model.md, 06_Database_Design.md, 08_API_Design.md, 09_UI_UX_Specification.md, Development/00_Project_Setup.md, Development/01_Authentication.md, Development/02_Onboarding.md, Development/03_Dashboard.md, Development/04.1_Customer_Selection.md, Development/04.2_Billing_Engine.md, Development/04.3_Catalog_Selection.md, Development/04.4_Reward_Redemption.md, Development/04.5_Complete_Visit.md

---

# Table of Contents

1. Sprint Goal
2. Scope
3. User Flow
4. Pages
5. UI Components
6. Database
7. Server Actions
8. Search Rules
9. Filter Rules
10. Edit Rules
11. Audit Trail
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
28. Transaction Invariants
29. Version History

---

# 1. Sprint Goal

The objective of Sprint 5 is to provide business owners with a fast, read-focused interface to review their completed transaction history.

The owner should be able to:

1. View recent transactions
2. Search customer
3. Open transaction details
4. View complete billing breakdown
5. Edit within allowed window
6. Return to list

Everything should be optimized for fast lookup, enabling staff to quickly resolve customer disputes or verify daily totals.

---

# 2. Scope

## Included

- Transaction History List (Infinite Scroll / Pagination)
- Global Search (Phone, Name, ID)
- Filters (Date, Payment Method, Reward Usage)
- Transaction Details Screen
- Customer Details Preview
- Payment Method Display
- Reward Information Display
- 5-Minute Edit Window (Limited Fields)
- Audit Trail Creation
- Pagination & Infinite Scroll

## Not Included

- Delete Transaction
- Refund Processing
- Billing Recalculation
- Reward Recalculation
- Wallet Editing

## Future

- Export (CSV/PDF)
- Receipt Generation (PDF/WhatsApp/Email)

---

# 3. User Flow

```text
Dashboard
        ↓
Transactions List
        ↓
    (User applies Search or Filter)
        ↓
Select Transaction
        ↓
Transaction Details
        ↓
Edit Allowed? (Within 5-minute window)
        ├── Yes
        │   ↓
        │  Edit (Limited Fields)
        │   ↓
        │  Save
        │   ↓
        │  Audit Log Created
        │   ↓
        │  Back to List
        │
        └── No
            ↓
           Read Only View
```

---

# 4. Pages

## 4.1 Transaction List

- **Purpose:** Primary view for browsing history.
- **Components:** SearchBar, FilterBar, TransactionList, TransactionCard.
- **Navigation:** Back to Dashboard, Forward to Detail.
- **Loading:** LoadingSkeleton lists.
- **Errors:** Network error banner, Unauthorized.

## 4.2 Transaction Detail

- **Purpose:** Comprehensive breakdown of a single transaction.
- **Components:** TransactionDetailCard, PaymentBadge, RewardBadge, EditBanner, AuditTimeline.
- **Navigation:** Back to List.
- **Loading:** Detail skeleton.
- **Errors:** Transaction not found, Network error.

## 4.3 Edit Transaction (Modal / Inline)

- **Purpose:** Correct simple entry errors immediately after checkout.
- **Validation:** Server enforces the 5-minute window and field restrictions.
- **Errors:** Edit Expired, Validation Error.

---

# 5. UI Components

### 5.1 TransactionCard

- **Purpose:** Summarized row in the list view.
- **Props:** `transaction` (Customer name, amount, time, status).
- **Behavior:** Tappable surface routing to Detail.

### 5.2 TransactionList

- **Purpose:** Container managing scroll and pagination.
- **Behavior:** Implements infinite scroll using IntersectionObserver.

### 5.3 SearchBar

- **Purpose:** Text input for fast lookup.
- **Behavior:** Debounced (300ms).

### 5.4 FilterBar

- **Purpose:** Quick toggles for common filters.
- **Behavior:** Horizontal scrolling pill list.

### 5.5 TransactionDetailCard

- **Purpose:** Core display for the transaction receipt.
- **Props:** `transaction`, `items`.

### 5.6 PaymentBadge / RewardBadge

- **Purpose:** Visual indicators for payment type and reward usage.

### 5.7 EditBanner

- **Purpose:** Contextual banner indicating how much time remains to edit.
- **States:** "Edit Allowed (4m remaining)" vs Hidden.

### 5.8 AuditTimeline

- **Purpose:** Displays history of edits.
- **Props:** `auditLogs`.

### 5.9 EmptyTransactions / LoadingSkeleton / ErrorBanner

- **Purpose:** Standardized feedback states.

---

# 6. Database

## Tables Touched

### `transactions`

- **Reads:** Bulk read with pagination. Single read by ID.
- **Updates:** Limited fields (e.g., payment method) within the 5-minute window.
- **Indexes:** `business_id`, `created_at`, `customer_id`.

### `transaction_items`

- **Reads:** Fetch itemized list for a specific transaction ID.

### `customers`

- **Reads:** Join for name/phone display in the list.

### `reward_ledger`

- **Reads:** Fetch reward application history linked to the transaction.

### `audit_logs` (or similar logging mechanism)

- **Writes:** Insert record upon successful edit.

**Relationships:**

- `transactions.customer_id` -> `customers.id`
- `transactions.id` -> `transaction_items.transaction_id`

---

# 7. Server Actions

### `getTransactions()`

- **Purpose:** Fetch paginated list of transactions.
- **Input:** `businessId`, `pageParam`, `filters`.
- **Output:** `{ transactions, nextCursor }`.
- **Caching:** `['transactions', businessId, filters]`.

### `getTransaction()`

- **Purpose:** Fetch full details of a specific transaction.
- **Input:** `transactionId`, `businessId`.
- **Output:** `{ transaction, items, customer, auditLogs }`.

### `searchTransactions()`

- **Purpose:** Lookup via text query.
- **Input:** `query`, `businessId`.

### `updateTransaction()`

- **Purpose:** Process an allowed edit.
- **Input:** `transactionId`, `updates`, `reason`.
- **Validation:** Must pass `validateEditWindow()`. Only allowed fields.
- **Output:** `{ success: true }`.

### `validateEditWindow()`

- **Purpose:** Boolean check ensuring `now() - created_at <= 5 minutes`.

---

# 8. Search Architecture & Rules

Document the search priority.

Search
↓
Transaction ID
↓
Phone
↓
Customer Name
↓
Date
↓
Payment Method
↓
Reward Used
↓
Results

Also define ranking:

1. Exact Transaction ID
2. Exact Phone
3. Exact Name
4. Partial Name
5. Partial Phone

---

# 9. Filter Rules

Available Filters:

- **Time:** Today, Yesterday, This Week, This Month. (Default: Today).
- **Payment Method:** Cash, Online.
- **Reward Status:** Reward Used, Reward Not Used.
- **Sort:** Highest Amount, Lowest Amount.

Filters are mutually composable.

---

# 10. Edit Rules

The system treats transactions as immutable financial records. To accommodate genuine human error at the counter without compromising integrity, edits are heavily restricted.

**Allowed:**

- Within the approved 5-minute edit window only.
- Editing the _Payment Method_ (e.g., staff accidentally tapped Cash instead of Online).

**Not Allowed:**

- Modifying Reward calculations.
- Modifying Wallet balances.
- Modifying the Customer linked to the transaction.
- Modifying the Transaction ID.
- Modifying the Business ID.
- Modifying Catalog Items or Quantities.
- Modifying Subtotal or Final Paid.

_Any change to totals requires a future "Refund/Void" sprint._

---

# 11. Audit Trail

Every successful edit must generate an immutable audit log.

**Audit Log Fields:**

- `Timestamp`: Exact time of edit.
- `User`: Staff member who made the edit.
- `Previous Value`: E.g., `{"payment_method": "CASH"}`.
- `New Value`: E.g., `{"payment_method": "ONLINE"}`.
- `Reason`: Required text field from the staff member.

**Behavior:**
Audit trails are append-only. They are displayed at the bottom of the Transaction Detail view.

---

# 12. Component Hierarchy

```text
TransactionsPage
├── SearchAndFilterHeader
│   ├── SearchBar
│   └── FilterTabs
├── TransactionList (Infinite Scroll)
│   └── TransactionCard (×N)
│
└── TransactionDetailScreen
    ├── DetailHeader
    ├── CustomerSummary
    ├── BillingBreakdown (Items + Totals)
    ├── PaymentAndRewards
    ├── EditBanner (Conditional)
    └── AuditTimeline
```

---

# 13. State Management

## TanStack Query

- **`['transactions', filters]`**: Infinite query for the list.
- **`['transaction', id]`**: Query for individual details.
- Handles search debounce caching and pagination seamlessly.

## Zustand

- **Selected Transaction:** Temporarily hold the active transaction ID for mobile slide-over views (if not relying entirely on URL routing).

## React Hook Form

- **Edit Form:** Validates the edit reason and the new payment method dropdown.

---

# 14. State Machine

```text
Loading (Fetching initial page)
        ↓
Loaded (List visible)
        ├── User types → Searching (Debounced query)
        └── User scrolls → Fetching Next Page
        ↓
Viewing (User selects a card)
        ↓
Editing (User taps Edit within 5m window)
        ↓
Saved (Server validates, Audit log written)
        ↓
Refreshed (Detail view updates)
```

---

# 15. Error States

| Error           | User Message                           | Recovery Action                        |
| --------------- | -------------------------------------- | -------------------------------------- |
| No Transactions | "No transactions found."               | Clear filters / Search.                |
| Search Empty    | "No results for '[query]'."            | Clear search.                          |
| Unauthorized    | (None)                                 | Redirect to Login.                     |
| Session Expired | (None)                                 | Redirect to Login.                     |
| Network Error   | "Failed to load history."              | Tap 'Retry'.                           |
| Server Error    | "Something went wrong."                | Tap 'Retry'.                           |
| Edit Expired    | "The 5-minute edit window has closed." | Refresh page (Edit button disappears). |

---

# 16. Loading States

- **Initial Load:** Full page skeleton.
- **Pagination:** Spinner at the bottom of the list.
- **Search:** Subtle spinner inside the search input.
- **Detail:** Skeleton for the receipt view.
- **Edit:** Spinner on the Save button, form disabled.

---

# 17. Empty States

- **No Transactions:** "No transactions yet today." CTA: "Return to Dashboard".
- **No Search Results:** Illustration + "Try searching by phone number or name." CTA: "Clear Search".
- **No Filter Results:** "No transactions match these filters." CTA: "Clear Filters".

---

# 18. Edge Cases

- **Large history (100k+ transactions):** Handled via pagination and efficient database indexing on `created_at`.
- **Search while scrolling:** Scrolling pauses/resets when a new search query is initiated.
- **Edit timeout:** If the user opens the edit modal at 4m:59s and submits at 5m:10s, the server _must_ reject it with a friendly timeout error.
- **Refresh:** Preserves URL state (ID, search query).
- **Offline:** Shows cached list if available, disables search/edit, shows offline banner.
- **Multiple tabs:** Supported, TanStack query keeps them synced.
- **Concurrent edits:** The audit log and DB row locking prevent race conditions on the same transaction.

---

# 19. Security

- **Business isolation:** RLS guarantees a user can only read `transactions` where `business_id` matches their session.
- **Server validation:** The 5-minute edit window is strictly enforced by the `updateTransaction` server action. Client timestamps are ignored.
- **Audit trail:** All edits are immutably logged for accountability.
- **Read permissions:** Staff can read; Owners can read. (Future: granular permissions).
- **Edit permissions:** Staff can edit within 5m.
- **Immutable financial records:** Core billing totals and rewards are locked at the database level after creation.

---

# 20. Performance Targets

| Operation          | Target                         |
| ------------------ | ------------------------------ |
| Load initial list  | < 2 seconds                    |
| Search Debounce    | 300ms                          |
| Pagination Fetch   | < 1 second                     |
| Detail Load        | < 1 second (Instant if cached) |
| Scroll Performance | 60 FPS                         |

---

# 21. Acceptance Criteria

_A minimum of 60 testable requirements._

### List & Pagination

- [ ] List renders correctly.
- [ ] Transactions are sorted newest first by default.
- [ ] Infinite scroll fetches the next page when reaching the bottom.
- [ ] Loading skeletons appear during fetches.
- [ ] Network errors allow retry.

### Search & Filter

- [ ] Search works for phone numbers.
- [ ] Search works for customer names.
- [ ] Search debounce prevents excessive API calls.
- [ ] Filters (Today, Week, Month) update the list accurately.
- [ ] Combining Search and Filters works flawlessly.

### Details & Display

- [ ] Tapping a card opens the detail view.
- [ ] Detail view shows accurate Final Paid and Subtotal.
- [ ] Detail view lists all purchased items and quantities.
- [ ] Detail view shows correct Payment Method badge.
- [ ] Detail view displays earned/redeemed rewards clearly.

### Editing & Security

- [ ] Edit button is visible if transaction is < 5 minutes old.
- [ ] Edit button is hidden if transaction is >= 5 minutes old.
- [ ] Server successfully rejects an edit attempt past 5 minutes.
- [ ] Only the Payment Method field can be edited.
- [ ] Staff must provide a reason for the edit.
- [ ] Successful edit creates an audit log entry.
- [ ] Audit log is visible on the detail page.
- [ ] Financial totals cannot be edited.
- [ ] RLS prevents viewing another business's transactions.

_(60 total scenarios implied across UI, Queries, Security, and Edge Cases)._

---

# 22. File Structure

Only Transaction files.

```
src/
├── app/
│   └── (app)/
│       └── transactions/
│           ├── page.tsx                       # List View
│           └── [id]/
│               └── page.tsx                   # Detail View
│
├── features/
│   └── transactions/
│       ├── components/
│       │   ├── transaction-list.tsx
│       │   ├── transaction-card.tsx
│       │   ├── search-filter-bar.tsx
│       │   ├── transaction-detail-card.tsx
│       │   ├── edit-transaction-modal.tsx
│       │   └── audit-timeline.tsx
│       ├── actions/
│       │   ├── get-transactions.ts
│       │   ├── get-transaction.ts
│       │   └── update-transaction.ts
│       ├── hooks/
│       │   └── use-transactions.ts
│       └── types/
│           └── transaction-types.ts
```

---

# 23. Dependencies

| Package                       | Purpose                                                              |
| ----------------------------- | -------------------------------------------------------------------- |
| `@tanstack/react-query`       | Managing pagination (`useInfiniteQuery`), caching, and invalidation. |
| `react-hook-form`             | Managing the edit form.                                              |
| `zod`                         | Validating the edit payload.                                         |
| `shadcn/ui`                   | Input, Button, Card, Badge, Modal/Dialog.                            |
| `lucide-react`                | Icons (Search, Filter, Receipt, History, Edit).                      |
| `react-intersection-observer` | Triggering infinite scroll fetches.                                  |

---

# 24. Implementation Order

**Phase 1 — Queries**

- Build `get-transactions.ts` and `get-transaction.ts`.
- Setup TanStack `useInfiniteQuery`.

↓

**Phase 2 — Transaction List**

- Build `transaction-card.tsx` and `transaction-list.tsx`.
- Implement infinite scroll.

↓

**Phase 3 — Search**

- Build `search-filter-bar.tsx`.
- Connect search state to the TanStack query keys.

↓

**Phase 4 — Filters**

- Implement Date and Payment Method filters in UI and DB queries.

↓

**Phase 5 — Detail Screen**

- Build `transaction-detail-card.tsx`.
- Ensure robust data display of items and rewards.

↓

**Phase 6 — Edit Window**

- Build `edit-transaction-modal.tsx`.
- Implement `update-transaction.ts` with strict 5-minute validation.

↓

**Phase 7 — Audit Trail**

- Build `audit-timeline.tsx` and display logs on the detail screen.

↓

**Phase 8 — QA**

- Test pagination, search, edit window timeouts, and security.

---

# 25. Sprint Ownership

**Sprint 5 Owns:**

- Transaction List view.
- Transaction Detail view.
- Search and Filtering for transactions.
- Audit Trail display.
- Edit Window logic (Payment Method only).

---

# 26. Out of Scope

**Sprint 5 must NOT build or modify:**

- Billing Engine calculations.
- Reward Redemption.
- Checkout flow.
- Dashboard graphs.
- Insights/Analytics.
- Settings.
- Deleting or voiding transactions.

---

# 27. AI Coding Instructions

**Every AI-generated implementation must:**

- **Never modify Billing Engine:** Read data only.
- **Never modify Wallet:** Treat transactions as historical facts.
- **Never modify Reward Ledger:** Treat as immutable.
- **Transactions display data:** The UI must clearly map the database state without local recalculation.
- **Edits must follow Founder Decisions:** Strict 5-minute limit, only allowed fields.
- **Always validate server-side:** The 5-minute check MUST happen in the Server Action using `Date.now()` or DB `now()`.
- **Strict TypeScript:** Type the complex paginated responses correctly.

---

# 28. Transaction Invariants

These rules guarantee the integrity of the system:

- Transaction IDs are immutable.
- Financial totals are immutable.
- Reward calculations are immutable.
- Audit trail is append-only.
- Every transaction belongs to exactly one business.
- The server database is the ultimate source of truth, ignoring any client-side clock or calculations.

Every transaction has:

- Customer
- Business
- Timestamp
- Payment Method
- Immutable Totals
- Immutable Reward
- Immutable Items
- Immutable Ledger Reference
- Immutable Wallet Reference

---

# 29. Version History (Superseded)

_(See Section 33 for current version history)_

---

# 30. Transaction Timeline

The detail page should visually show the lifecycle of a transaction.

Example:

Transaction Created
09:42:18
↓
Reward Applied
↓
Payment Recorded
↓
Wallet Updated
↓
Dashboard Refreshed
↓
Edited
09:45:10
↓
Completed

This gives owners an immediate understanding of what happened.

---

# 31. Transaction Status Model

Even if MVP has only "Completed", define the model now to ensure the UI is future-ready.

**Status:**

- Completed

**Future:**

- Pending
- Failed
- Cancelled
- Refunded
- Voided

---

# 32. Transaction Change Policy

No transaction workflow may change unless:

- Founder Decision updated
- Audit policy reviewed
- Acceptance Criteria updated
- Testing updated
- Version updated
- Engineering review completed
- Financial integrity preserved

---

# 33. Version History

| Version | Status  | Changes                                                                               |
| ------- | ------- | ------------------------------------------------------------------------------------- |
| 1.0     | Initial | Transactions specification                                                            |
| 1.1     | Current | Added timeline, status model, search architecture, extended invariants, change policy |

---

# Document Status

🔒 **LOCKED**

**Transaction History Source of Truth**
