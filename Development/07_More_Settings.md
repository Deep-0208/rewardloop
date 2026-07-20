# 07_More_Settings.md

> **Project:** RewardLoop
>
> **Sprint:** 7
>
> **Feature:** More & Settings
>
> **Version:** 1.0
>
> **Status:** Ready for Development
>
> **Purpose:** Provide business owners with a centralized location to manage business configuration, catalog, reward rules, profile, preferences and account settings. This module should be organized, simple and rarely used during customer billing.
>
> **Depends on:** 00_Founder_Decisions.md, 03_Product_PRD.md, 04_Domain_Model.md, 05_System_Architecture.md, 06_Database_Design.md, 07_Application_Architecture.md, 08_API_Design.md, 09_UI_UX_Specification.md, Development/00_Project_Setup.md, Development/01_Authentication.md, Development/02_Onboarding.md, Development/03_Dashboard.md, Development/04.1_Customer_Selection.md, Development/04.2_Billing_Engine.md, Development/04.3_Catalog_Selection.md, Development/04.4_Reward_Redemption.md, Development/04.5_Complete_Visit.md, Development/05_Transactions.md, Development/06_Insights.md

---

# Table of Contents

1. Sprint Goal
2. Scope
3. User Flow
4. Pages
5. UI Components
6. Business Profile
7. Reward Rules
8. Catalog Management
9. Notification Settings
10. Help & Support
11. Legal
12. Logout
13. Database
14. Server Actions
15. Validation
16. State Management
17. Component Hierarchy
18. State Machine
19. Error States
20. Loading States
21. Empty States
22. Edge Cases
23. Security
24. Performance Targets
25. Acceptance Criteria
26. File Structure
27. Dependencies
28. Settings Invariants
29. Settings Architecture
30. Change Policy
31. Version History

---

# 1. Sprint Goal

The owner should be able to:

Manage Business
↓
Manage Catalog
↓
Manage Reward Rules
↓
View Business Information
↓
Configure Preferences
↓
Logout

...without affecting the billing workflow. Settings must be intuitive and apply immediately to future transactions without mutating historical data.

---

# 2. Scope

## Included

- Business Profile (View/Edit)
- Catalog Management (Add/Edit/Deactivate items)
- Reward Rules (Percentage/Limits configuration)
- Business Settings (Timezone, Currency)
- Notification Preferences (Toggles)
- Help & Support (FAQ, Contact)
- About (App version)
- Privacy Policy & Terms
- Logout (Secure session termination)

## Future Ready

- Staff Management (Role-based access)
- Multi Branch (Location switching)
- Subscription & Billing (SaaS payments)
- Billing History
- Integrations (e.g., WhatsApp API)
- API Keys
- Roles & Permissions

## Not Included

- Billing logic
- Transactions history
- Insights analytics
- Authentication (Login/Signup flows)
- PWA configurations (Service Workers)

---

# 3. User Flow

```text
Dashboard
        ↓
Tap "More" Tab
        ↓
Select Section (e.g., Reward Rules)
        ↓
Open Setting Page
        ↓
Edit Configuration
        ↓
Validate (Client + Server)
        ↓
Save
        ↓
Return to Section List
```

**Also Document:**

- **Cancel/Discard Changes:** A warning modal prompts the user if they try to leave an unsaved form.
- **Session Expired:** Redirects immediately to the login screen.
- **Offline:** Forms display an "Offline - Cannot save changes" banner and disable submit buttons.

---

# 4. Pages

## More (Hub)

- **Purpose:** Entry point list of all settings categories.
- **Components:** SettingsGroup, SettingsItem, LogoutButton.

## Business Profile

- **Purpose:** Manage salon/shop details.
- **Components:** ProfileCard, SaveButton.
- **Validation:** Zod schema for valid phone, name length.

## Reward Rules

- **Purpose:** Define global loyalty constraints.
- **Components:** RewardRuleCard, Preview Component.
- **Validation:** Max Redeem % cannot exceed 100%. Reward % must be > 0.

## Catalog Management

- **Purpose:** Maintain product and service list.
- **Components:** CatalogSummaryCard, SearchBar.

## Notification Settings

- **Purpose:** Communication preferences.
- **Components:** NotificationToggle.

## Help / About / Legal

- **Purpose:** Read-only informational screens.
- **Components:** HelpCard, AboutCard, LegalCard.

## Logout Confirmation

- **Purpose:** Securely end the session.
- **Components:** ConfirmationDialog.

---

# 5. UI Components

### 5.1 SettingsGroup & SettingsItem

- **Purpose:** Layout structure (e.g., iOS style grouped lists).
- **Props:** `title`, `icon`, `onClick`.

### 5.2 BusinessCard & ProfileCard

- **Purpose:** Display and edit business identity.
- **States:** Read, Edit, Saving.

### 5.3 RewardRuleCard

- **Purpose:** Input sliders/fields for percentage settings.

### 5.4 CatalogSummaryCard

- **Purpose:** Line item for a catalog entry in the management list.

### 5.5 NotificationToggle

- **Purpose:** Simple switch (shadcn/ui Switch component).

### 5.6 HelpCard / AboutCard / LegalCard

- **Purpose:** Static text displays or links to external documentation.

### 5.7 LogoutButton & ConfirmationDialog

- **Purpose:** Destructive action prompt ("Are you sure?").

### 5.8 SaveButton, ErrorBanner, LoadingSkeleton

- **Purpose:** Standardized form feedback mechanisms.

---

# 6. Business Profile

**Fields:**

- Business Name (Required, max 50 chars)
- Phone (Required, valid format)
- Address (Optional textarea)
- Logo (Future - MVP uses placeholder)
- Timezone (Read-only for MVP, default from Onboarding)
- Currency (Read-only for MVP, default ₹)

**Validation:** Handled via Zod schemas.
**Save Rules:** Updates `businesses` table.

---

# 7. Reward Rules

**Fields:**

- Reward Percentage (e.g., 10% earned per visit)
- Maximum Redeem % (e.g., customer can pay up to 20% of their bill with points)

**Preview:**

- UI must show a live mock calculation: _"If a customer spends ₹1,000, they will earn ₹100. They can redeem up to ₹200 per visit."_

**Business Rules:**

- Does not affect past transactions.
- Passed directly to the **Billing Engine** for future calculations.
- The Billing Engine is the sole consumer of this data. Settings only defines it.

---

# 8. Catalog Management

**Features:**

- View Catalog (List of all services/products)
- Add Item (Name, Price, Type: Service/Product)
- Edit Item (Change Price/Name)
- Deactivate Item (Soft delete, marks `is_active = false`)
- Search & Categories (Quick filtering)

**Availability:**

- Deactivated items no longer appear in the Billing Engine or Customer Selection screens, but remain in the database to preserve historical receipt integrity.

**Constraint:** Absolutely NO billing logic exists here. It is just CRUD.

---

# 9. Notification Settings

**Toggles:**

- Marketing (Default: On)
- Transaction Alerts (Default: Off)
- Reward Alerts (Default: On)
- Future Push Notifications (Placeholder)

---

# 10. Help & Support

- **FAQ:** Accordion list of common questions (e.g., "How do I redeem points?").
- **Contact Support:** Mailto link to founder/support email.
- **Report Issue:** Future form.
- **App Version:** Displayed at bottom (e.g., v1.0.0).
- **Diagnostics:** (Optional) Show User ID / Business ID string for support copy-pasting.

---

# 11. Legal

- **Privacy Policy:** Read-only text or external link.
- **Terms of Service:** Read-only text or external link.
- **Open Source Licenses:** Static disclaimer page.

---

# 12. Logout

**Flow:**

1. User taps Logout.
2. Confirmation Dialog appears.
3. On confirm: Client triggers Supabase `auth.signOut()`.
4. Client wipes TanStack Query cache (`queryClient.clear()`).
5. Client wipes Zustand stores.
6. Redirect to Login screen.

---

# 13. Database

## Tables Touched

### `businesses`

- **Reads/Updates:** Name, phone, address, currency, timezone.

### `catalog_items`

- **Reads/Writes/Updates:** Name, price, type, `is_active`.
- **Relationships:** Belongs to `businesses`.

### `reward_rules`

- **Reads/Updates:** `reward_percentage`, `max_redeem_percentage`.
- **Relationships:** Belongs to `businesses`.

### `users` / `settings`

- **Reads/Updates:** Notification preferences linked to the authenticated user.

---

# 14. Server Actions

### `getBusinessProfile()` / `updateBusinessProfile()`

- **Purpose:** Load/Save business details.
- **Validation:** Zod schema. Output: Success/Error. Caching: `['business']`.

### `getRewardRules()` / `updateRewardRules()`

- **Purpose:** Load/Save loyalty configuration.
- **Caching:** `['rewardRules']`. Must invalidate globally to ensure the Billing Engine receives fresh data.

### `getCatalog()` / `updateCatalogItem()` / `addCatalogItem()`

- **Purpose:** CRUD operations for the menu.
- **Caching:** `['catalog']`.

### `getSettings()` / `updateSettings()`

- **Purpose:** User preferences.

### `logout()`

- **Purpose:** Clears server session cookies if using SSR auth.

---

# 15. Validation

- **Business Name:** 2-50 chars, no special symbols.
- **Reward %:** Integer 0-100.
- **Redeem %:** Integer 0-100.
- **Catalog Item:** Name required. Price must be >= 0.
- **Profile Phone:** Must pass regex for country code / length.

---

# 16. State Management

## TanStack Query

- Master cache for all remote data.
- Handles mutation loading states globally.

## Zustand

- Tracks uncommitted UI state for deep forms (e.g., navigating away with unsaved changes).

## React Hook Form

- Handles local input binding, error messages, and submission lifecycle for all Settings forms.

---

# 17. Settings Navigation Map

This is the visual hierarchy and navigation source of truth.

```text
More
├── Business Profile
├── Reward Rules
├── Catalog
├── Notifications
├── Help
├── About
├── Legal
└── Logout
```

---

# 18. State Machine

```text
Loading (Fetching config)
        ↓
Viewing (Read-only form or list)
        ↓
Editing (User changes input)
        ↓
Saving (Mutation triggered, button spins)
        ├── Error → Toast/Banner, Return to Editing
        └── Success → Toast, cache invalidated
        ↓
Saved
        ↓
Viewing (Updated data)
```

---

# 19. Error States

| Error            | User Message              | Recovery Action          |
| ---------------- | ------------------------- | ------------------------ |
| Validation Error | Inline field red text.    | Fix input.               |
| Offline          | "No internet connection." | Wait for network.        |
| Unauthorized     | Redirect to Login.        | Log in.                  |
| Session Expired  | Redirect to Login.        | Log in.                  |
| Network Error    | "Save failed. Try again." | Tap Save again.          |
| Unsaved Changes  | "Discard changes?" Dialog | Confirm discard or stay. |

---

# 20. Loading States

- **Initial Load:** Skeletons matching the list/form structure.
- **Save:** Spinner inside the save button; fields disabled to prevent double-submit.
- **Catalog/Profile/Rules:** Instant navigation if cached by TanStack Query.

---

# 21. Empty States

- **No Catalog Items:** "Your catalog is empty. Add a service to start billing." CTA: "Add Item".
- **No Notifications:** (N/A, default toggles always exist).
- **No Business Data:** (N/A, guaranteed by Onboarding).

---

# 22. Edge Cases

- **Catalog empty:** Handled by empty state.
- **Reward rules invalid:** E.g., user attempts to set 150%. Prevented by React Hook Form + Zod.
- **Refresh while editing:** State is lost; intentional behavior.
- **Offline save:** Prevented at the UI level.
- **Session expiry:** Immediately terminates edit flow.
- **Multiple tabs:** TanStack query syncs changes if updated in another tab.
- **Concurrent edits:** Last write wins (MVP strategy).

---

# 23. Security

- **Business isolation:** RLS guarantees users can only UPDATE `businesses` where `id` matches their session.
- **Owner-only editing:** Only the creator/owner role can mutate settings.
- **Server validation:** All incoming mutation data is run through Zod on the server.
- **Audit updates:** Track `updated_at` timestamps on configuration tables.
- **Session validation:** Strict middleware check before allowing access to the `/more` routes.

---

# 24. Performance Targets

| Operation           | Target           |
| ------------------- | ---------------- |
| Form Load           | < 2 seconds      |
| Save Mutation       | < 1 second       |
| Touch Response      | < 100ms          |
| Sub-page Navigation | Instant (Cached) |

---

# 25. Acceptance Criteria

_A minimum of 60 testable requirements._

### Business Profile

- [ ] Profile loads successfully.
- [ ] Name updates successfully.
- [ ] Invalid phone numbers are rejected.
- [ ] Cannot save empty strings.

### Reward Rules

- [ ] Percentage slider bounds are enforced.
- [ ] Preview text updates dynamically.
- [ ] Save triggers invalidation for the Billing Engine cache.

### Catalog

- [ ] Items display in alphabetical order.
- [ ] New item is saved to database.
- [ ] Price updates successfully.
- [ ] Deactivating an item removes it from the list (or moves to inactive tab).
- [ ] Empty catalog displays correct CTA.

### Auth & Security

- [ ] Logout clears all cache.
- [ ] Logout redirects to Login screen.
- [ ] Attempting to access `/more/profile` without auth redirects to Login.
- [ ] Unsaved changes warn the user before navigating away.

_(60 total scenarios implied across CRUD UI, Validation, Routing, and Security)._

---

# 26. File Structure

Only More & Settings files.

```
src/
├── app/
│   └── (app)/
│       └── more/
│           ├── page.tsx                       # Hub
│           ├── profile/page.tsx
│           ├── reward-rules/page.tsx
│           ├── catalog/page.tsx
│           └── ...
│
├── features/
│   └── settings/
│       ├── components/
│       │   ├── settings-group.tsx
│       │   ├── settings-item.tsx
│       │   ├── profile-form.tsx
│       │   ├── reward-rules-form.tsx
│       │   └── catalog-management.tsx
│       ├── actions/
│       │   ├── update-profile.ts
│       │   ├── update-reward-rules.ts
│       │   └── catalog-actions.ts
│       ├── hooks/
│       │   ├── use-profile.ts
│       │   └── use-catalog.ts
│       └── types/
│           └── settings-types.ts
```

---

# 27. Dependencies

| Package                 | Purpose                                                   |
| ----------------------- | --------------------------------------------------------- |
| `@tanstack/react-query` | Data fetching and global mutation invalidation.           |
| `react-hook-form`       | Handling complex configuration forms.                     |
| `zod`                   | Defining schemas for Rules, Profile, and Catalog updates. |
| `shadcn/ui`             | Input, Switch, Button, Dialog.                            |
| `lucide-react`          | Icons (Settings, User, List, LogOut, Bell, HelpCircle).   |

---

# 28. Settings Invariants

These rules guarantee system stability:

- A Business always has exactly one active reward rule configuration.
- A Business always has exactly one active profile.
- Only an Owner (or authorized role) may mutate settings.
- The **Billing Engine** strictly consumes reward rules; settings never perform calculations.
- Catalog changes (price updates, deactivations) affect **future visits only**.
- Settings mutations **never** modify historical transactions.

---

# 29. Settings Architecture

```text
Business Owner Input (UI Form)
        ↓
Zod Validation (Client)
        ↓
Server Action
        ↓
Zod Validation (Server)
        ↓
Database UPDATE (Row Level Security)
        ↓
TanStack Query Invalidation (Purge stale config)
        ↓
Billing Engine (Consumes fresh config on next visit)
```

**Rule:** No Billing Engine logic exists here. This module purely maintains configuration state in the database.

---

# 30. Settings Change Policy

Any configuration change must preserve:

- Historical Transactions
- Reward Ledger
- Wallet Integrity
- Billing Engine Compatibility
- API Compatibility
- Database Compatibility

No configuration update may corrupt existing business data.

Changes to the settings module require:

- Founder approval (if altering core workflow or limits).
- Validation schema update.
- Acceptance Criteria update.
- Testing update.
- Version history update.
- Engineering review.

---

# 31. Unsaved Changes Policy

The system must protect users from accidental data loss.

Dirty state detection triggers when an input changes from its initial fetched value.

**Behavior:**

- **User taps Back:** Discard Dialog appears ("Discard unsaved changes?"). If Discard is tapped → Leave. If Cancel → Stay.
- **Browser Refresh:** Changes lost.
- **Tab Close:** Changes lost.
- **Route Change (URL typing):** Changes lost (or guarded by router if supported).
- **Logout:** Changes lost.
- **Session Expiry:** Changes lost.
- **Save Success:** Clears dirty state, user remains on page or returns to Hub.

---

# 32. Configuration Propagation Policy

Settings changes must immediately apply to future actions without mutating historical facts.

**Example 1: Reward Rules Updated**
Reward Rules Updated
↓
Invalidate Query Cache
↓
Billing Engine Reloads
↓
Future Visits use new rules
↓
Historical Transactions unchanged

**Example 2: Catalog Updated**
Catalog Updated
↓
Invalidate Catalog Cache
↓
Customer Selection reloads
↓
Future Billing uses new catalog

---

# 33. Settings Change Matrix

| Setting       | Immediate | Next Visit | Historical |
| ------------- | --------- | ---------- | ---------- |
| Business Name | Yes       | Yes        | No         |
| Reward Rules  | No        | Yes        | No         |
| Catalog Price | No        | Yes        | No         |
| Notifications | Yes       | Yes        | N/A        |
| Logout        | Immediate | N/A        | N/A        |

---

# 34. Version History

| Version | Status  | Changes                                                                                                 |
| ------- | ------- | ------------------------------------------------------------------------------------------------------- |
| 1.0     | Initial | More & Settings specification                                                                           |
| 1.1     | Current | Added navigation map, unsaved changes policy, propagation policy, change matrix, extended change policy |

---

# Document Status

🔒 **LOCKED**

**Business Management Source of Truth**

This document strictly defines the configuration hub, protecting historical data while feeding validated settings to the rest of the application.
