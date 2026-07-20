# 02_Onboarding.md

> **Project:** RewardLoop
>
> **Sprint:** 2
>
> **Feature:** First-Time Business Onboarding
>
> **Version:** 1.0
>
> **Status:** Ready for Development
>
> **Purpose:** Complete implementation specification for the Onboarding module. A developer or AI coding agent must be able to implement Sprint 2 using only this document.
>
> **Depends on:** 00_Project_Setup.md, 01_Authentication.md, 00_Founder_Decisions.md, 04_Domain_Model.md, 06_Database_Design.md, 08_API_Design.md, 09_UI_UX_Specification.md

---

# Table of Contents

1. Sprint Goal
2. Scope
3. Complete User Flow
4. Pages
5. UI Components
6. Database
7. Server Actions
8. Validation Rules
9. Security
10. State Management
11. Screen-to-API Mapping
12. Component Hierarchy
13. Onboarding State Machine
14. Error States
15. Loading States
16. Edge Cases
17. Tasks
18. Acceptance Criteria
19. Definition of Done
20. File Structure
21. Dependencies
22. Testing Checklist
23. Implementation Order
24. Sprint Ownership
25. Out of Scope
26. Sprint Success Definition
27. Engineering Review Checklist
28. AI Coding Instructions
29. Version History

---

# 1. Sprint Goal

Build the complete first-time business onboarding experience for RewardLoop.

After this sprint, a newly authenticated business owner can:

- Enter their business name.
- Configure reward rules (reward percentage, maximum redeem percentage).
- Create an initial service catalog.
- Complete onboarding and reach the Dashboard.

Total onboarding time target: **under 60 seconds** (from `00_Founder_Decisions.md` — Decision 25).

---

## Business Context

From `00_Founder_Decisions.md` — Decision 05 (First-Time Setup):

- Flow: Shop Name → Reward Rules → Services → Dashboard
- Shop Name is required.
- Owner defines Reward % and Maximum Redeem %.
- Owner can add, edit, and delete services.
- Suggested services available.

From `09_UI_UX_Specification.md` — Section 20 (Onboarding Standards):

- Onboarding consists of exactly three steps.
- Same header across all onboarding screens.
- Same spacing across all onboarding screens.
- Same sticky Continue button.
- Same progress indicator.
- Back button available from Step 2 onward.
- Maximum completion time: 60 seconds.
- Users should never lose previously entered data.

---

# 2. Scope

## Included

- Business name input and creation.
- Business type selection.
- Reward percentage configuration.
- Maximum redeem percentage configuration.
- Reward preview (showing example calculation).
- Catalog setup with suggested services.
- Manual service addition.
- Service removal during onboarding.
- Duplicate service prevention.
- Progress indicator (3 steps).
- Back navigation between steps.
- Data persistence across steps.
- Completion redirect to Dashboard.
- Onboarding progress restoration on page refresh.

## Not Included

- Dashboard (Sprint 3).
- Billing / Add Visit (Sprint 4).
- Transactions (Sprint 5).
- Insights (Sprint 6).
- More / Settings (Sprint 7).
- Staff management.
- Analytics.
- Notifications.

## Future

- Multi-branch onboarding.
- Membership plan selection.
- Coupon configuration.
- Campaign creation.
- Advanced business profile (logo, GST, address, email).

---

# 3. Complete User Flow

## Primary Flow — First-Time Owner

```
Authentication Complete (Sprint 1)
    │
    ▼
No Business Found
    │
    ▼
Redirect to /(onboarding)/business
    │
    ▼
Step 1: Business Setup
    │  - Enter Business Name (required)
    │  - Select Business Type
    │  - Tap "Continue"
    │
    ▼
Step 2: Reward Rules
    │  - Set Reward % (stepper)
    │  - Set Maximum Redeem % (stepper)
    │  - Preview reward example
    │  - Tap "Continue"
    │
    ▼
Step 3: Catalog Setup
    │  - View suggested services
    │  - Add services from suggestions
    │  - Add custom services manually
    │  - Remove services
    │  - Tap "Finish"
    │
    ▼
Complete Onboarding (Server)
    │
    ▼
Redirect to /(app)/dashboard
```

---

## Returning User Flow

```
Authentication Complete
    │
    ▼
Business Found
    │
    ▼
Redirect to /(app)/dashboard
```

No onboarding screens. Returning users skip entirely.

---

## Back Navigation Flow

```
Step 3: Catalog
    │
    ▼ (Back)
Step 2: Reward Rules (data preserved)
    │
    ▼ (Back)
Step 1: Business Setup (data preserved)
```

Previous data is always preserved when navigating back.

---

## Validation Failure Flow

```
Any Step
    │
    ▼
Tap "Continue" / "Finish"
    │
    ▼
Validation Fails
    │
    ▼
Show Inline Error
    │
    ▼
Stay on Current Step
    │
    ▼
User Corrects Input
    │
    ▼
Continue
```

---

## Skip Catalog Flow

```
Step 3: Catalog Setup
    │
    ▼
No services added
    │
    ▼
Tap "Finish"
    │
    ▼
Allow Completion (catalog can be empty)
    │
    ▼
Redirect to Dashboard
```

From `00_Founder_Decisions.md`: Catalog can be set up later from the More screen.

---

## Refresh Page Flow

```
User is on Step 2
    │
    ▼
Browser Refresh
    │
    ▼
Check Onboarding Progress (Server)
    │
    ▼
Business exists but incomplete → Resume at correct step
    │
    ▼
No business → Start from Step 1
```

---

## Session Expired Flow

```
Any Step
    │
    ▼
Session Expired (detected by middleware or Server Action)
    │
    ▼
Redirect to /(auth)/login
```

---

# 4. Pages

## 4.1 Business Setup — Step 1

**Purpose:** Collect the business name and type to create the business record.

**Route:** `/(onboarding)/business`

**Template:** Form Entry (Header → Progress → Form → Flexible Spacer → Sticky CTA)

**Components:**

- OnboardingLayout (no bottom navigation)
- ProgressHeader (Step 1 of 3)
- BusinessNameInput
- BusinessTypeDropdown
- ContinueButton (primary CTA, sticky bottom)
- ErrorMessage (inline)

**Primary CTA:** "Continue"

**Secondary Actions:** None. This is Step 1.

**Validation:**

- Business Name: required, 2–50 characters, trimmed.
- Business Type: required, must be a valid enum.

**Loading:**

- Continue button shows spinner during `createBusiness()`.
- Inputs disabled during submission.

**Errors:**

- Empty name → inline: "Business name is required."
- Name too short → inline: "Business name must be at least 2 characters."
- Name too long → inline: "Business name must be 50 characters or less."
- No type selected → inline: "Please select a business type."
- Network error → toast: "Unable to save. Please check your connection."
- Server error → toast: "Something went wrong. Please try again."

**Navigation:**

- Success → `/(onboarding)/rewards`
- No back button (this is Step 1).

**UI Rules (from 09_UI_UX_Specification.md):**

- Auto focus on business name input on mount.
- Bottom navigation hidden.
- Minimum touch target 48×48px.
- Progress indicator shows Step 1 of 3 active.

---

## 4.2 Reward Rules — Step 2

**Purpose:** Configure the reward percentage and maximum redeem percentage for the business.

**Route:** `/(onboarding)/rewards`

**Template:** Form Entry (Header → Progress → Form → Preview → Flexible Spacer → Sticky CTA)

**Components:**

- OnboardingLayout (no bottom navigation)
- ProgressHeader (Step 2 of 3)
- BackButton (returns to Step 1)
- RewardPercentageStepper
- MaxRedeemStepper
- RewardPreviewCard
- ContinueButton (primary CTA, sticky bottom)

**Primary CTA:** "Continue"

**Secondary Actions:** Back button to Step 1.

**Validation:**

- Reward Percentage: 1–50 (integer, from constraints in `06_Database_Design.md`: 0–100 range, but realistic bounds for MVP).
- Maximum Redeem Percentage: 1–50 (integer).

**Loading:**

- Continue button shows spinner during `saveRewardRules()`.
- Steppers disabled during submission.

**Errors:**

- Invalid percentage → inline: "Enter a valid percentage between 1 and 50."
- Network error → toast: "Unable to save. Please check your connection."
- Server error → toast: "Something went wrong. Please try again."

**Navigation:**

- Back → `/(onboarding)/business` (data preserved).
- Success → `/(onboarding)/catalog`

**UI Rules:**

- Steppers use + and – buttons with numeric display.
- Reward Preview updates in real-time as values change.
- Example preview: "On a ₹1,000 bill, customer earns ₹100 reward."
- Bottom navigation hidden.

---

## 4.3 Catalog Setup — Step 3

**Purpose:** Create the initial service catalog for the business.

**Route:** `/(onboarding)/catalog`

**Template:** Form Entry (Header → Progress → Content → Flexible Spacer → Sticky CTA)

**Components:**

- OnboardingLayout (no bottom navigation)
- ProgressHeader (Step 3 of 3)
- BackButton (returns to Step 2)
- SuggestedServices (pre-defined service chips)
- CatalogSearch (manual service name input)
- SelectedServicesList
- ServiceCard (per selected service)
- FinishButton (primary CTA, sticky bottom)

**Primary CTA:** "Finish"

**Secondary Actions:** Back button to Step 2.

**Validation:**

- Duplicate service names prevented.
- Blank service names prevented.
- Service names trimmed.
- Empty catalog allowed (skip).

**Loading:**

- Finish button shows spinner during `createCatalogItems()` and `completeOnboarding()`.

**Errors:**

- Duplicate service → inline: "This service already exists."
- Network error → toast: "Unable to save. Please check your connection."
- Server error → toast: "Something went wrong. Please try again."

**Navigation:**

- Back → `/(onboarding)/rewards` (data preserved).
- Success → `/(app)/dashboard`

**UI Rules:**

- Suggested services shown as tappable chips.
- Tapping a chip adds it to the selected list.
- Selected services shown below with a remove button.
- Manual input allows adding custom service names.
- Bottom navigation hidden.
- Empty catalog is allowed — the owner can add services later from the More screen.

---

## 4.4 Onboarding Complete (Redirect)

**Purpose:** Transition the user from onboarding to the Dashboard.

**Route:** No dedicated page. After `completeOnboarding()` succeeds, redirect to `/(app)/dashboard`.

**Behavior:**

- Brief loading state during redirect.
- No success screen (from `00_Founder_Decisions.md` — Decision 14: No success screen, show confirmation briefly).

---

# 5. UI Components

## 5.1 OnboardingLayout

**Responsibility:** Wraps all onboarding pages. Provides consistent structure without bottom navigation.

**Behavior:**

- Full-screen layout.
- No bottom navigation bar.
- No sidebar.
- Background color: `color-background` (#F8FAFC).
- Same header and spacing across all steps (from `09_UI_UX_Specification.md`).

---

## 5.2 ProgressHeader

**Responsibility:** Displays the current step in the onboarding flow.

**Props:**

- `currentStep: number` (1, 2, or 3)
- `totalSteps: number` (3)

**Behavior:**

- Displays three step indicators.
- Active step uses `color-primary` (#4F46E5).
- Completed steps use `color-success` (#10B981).
- Upcoming steps use `color-border` (#E5E7EB).
- Step labels: "Business", "Rewards", "Catalog".
- Consistent across all onboarding pages.

---

## 5.3 BusinessNameInput

**Responsibility:** Accepts the business/shop name.

**Props:**

- `value: string`
- `onChange: (value: string) => void`
- `error?: string`
- `disabled?: boolean`

**Behavior:**

- Height: 48px.
- Radius: 12px.
- Auto focus on mount.
- Max length: 50 characters.
- Trims whitespace on blur.
- Shows inline error below field.

**States:**

- Default: 1px border (`color-border`).
- Focused: 2px border (`color-primary`).
- Error: 2px border (`color-error`).
- Disabled: Grayed out.

---

## 5.4 BusinessTypeDropdown

**Responsibility:** Selects the business type.

**Props:**

- `value: string`
- `onChange: (value: string) => void`
- `error?: string`
- `disabled?: boolean`

**Options (from `00_Founder_Decisions.md` — Decision 02):**

- Salon
- Spa
- Gym
- Café
- Clinic
- Car Wash
- Other

**Behavior:**

- Height: 48px.
- Radius: 12px.
- Native select or custom dropdown.
- Shows placeholder: "Select business type".
- Shows inline error below field.

---

## 5.5 RewardPercentageStepper

**Responsibility:** Adjusts the reward percentage using increment/decrement controls.

**Props:**

- `value: number`
- `onChange: (value: number) => void`
- `min: number` (1)
- `max: number` (50)
- `step: number` (1)

**Behavior:**

- Displays current value prominently.
- – and + buttons for adjustment.
- Touch targets ≥ 48×48px.
- – button disabled at min.
- - button disabled at max.
- Label: "Reward %"
- Helper text: "Percentage of final bill earned as reward."

---

## 5.6 MaxRedeemStepper

**Responsibility:** Adjusts the maximum redeem percentage.

**Props:** Same as RewardPercentageStepper.

**Behavior:** Same stepper pattern.

- Label: "Max Redeem %"
- Helper text: "Maximum percentage of bill that can be paid with rewards."

---

## 5.7 RewardPreviewCard

**Responsibility:** Shows a live example of how rewards work based on current settings.

**Props:**

- `rewardPercentage: number`
- `maxRedeemPercentage: number`

**Behavior:**

- Shows a calculated example on a ₹1,000 bill.
- Example: "On a ₹1,000 bill, customer earns ₹100 reward."
- Example: "Next visit, customer can redeem up to ₹200 from ₹1,000 bill."
- Updates in real-time as stepper values change.
- Background: `color-surface` (#FFFFFF).
- Border radius: 12px.
- Shadow: `level-1`.

---

## 5.8 SuggestedServices

**Responsibility:** Displays a list of suggested service names as tappable chips.

**Props:**

- `suggestions: string[]`
- `selectedServices: string[]`
- `onAdd: (name: string) => void`

**Suggested Services List (from `00_Founder_Decisions.md` — Decision 09):**

- Haircut
- Beard
- Facial
- Hair Color
- Hair Spa
- Head Massage
- Shaving
- Pedicure
- Manicure
- Waxing

**Behavior:**

- Chips are tappable.
- Tapping adds the service to the selected list.
- Already-selected services are visually marked or hidden from suggestions.
- Chips use `color-primary` background when selected.

---

## 5.9 CatalogSearch

**Responsibility:** Allows adding a custom service name that is not in the suggestions.

**Props:**

- `onAdd: (name: string) => void`
- `existingServices: string[]`

**Behavior:**

- Text input with "Add" button.
- Height: 48px.
- Radius: 12px.
- Trims whitespace before adding.
- Prevents duplicate names.
- Prevents blank input.
- Clears input after successful add.

---

## 5.10 ServiceCard

**Responsibility:** Displays a single selected service in the catalog list.

**Props:**

- `name: string`
- `onRemove: () => void`

**Behavior:**

- Shows service name.
- Shows a remove (X) button.
- Remove touch target ≥ 48×48px.
- Background: `color-surface` (#FFFFFF).
- Border radius: 12px.

---

## 5.11 SelectedServicesList

**Responsibility:** Renders the list of services the owner has selected.

**Props:**

- `services: string[]`
- `onRemove: (index: number) => void`

**Behavior:**

- Renders one `ServiceCard` per service.
- Shows empty state text if no services: "No services added yet. You can add them later."
- Vertical list with `space-3` (12px) gap.

---

## 5.12 ContinueButton / FinishButton

**Responsibility:** Primary CTA for onboarding forms.

**Behavior:**

- Same as `VerifyButton/ContinueButton` from Sprint 1.
- Full width, sticky bottom.
- Height: 48px.
- Radius: 12px.
- Background: `color-primary` (#4F46E5).
- Disabled state when form is invalid.
- Loading spinner replaces label during submission.
- Prevents double-tap.

---

## 5.13 BackButton

**Responsibility:** Navigates to the previous onboarding step.

**Behavior:**

- Displayed in the header area (AppBar).
- Available from Step 2 onward (from `09_UI_UX_Specification.md`).
- Preserves all data entered on the current step.
- Touch target ≥ 48×48px.
- Icon: Left arrow (Lucide `ArrowLeft`).

---

# 6. Database

## Tables Touched

### 6.1 `businesses`

**Reads:**

- Check if business exists for the authenticated user (during redirect logic from Sprint 1).
- Restore onboarding progress — check if business was partially created.

**Writes:**

- Create business record during Step 1 (`createBusiness()`).
- Fields set: `name`, `business_type`, `status` (active), `created_at`.

**Updates:**

- Update business name or type if user navigates back to Step 1 and changes values.

**Deletes:**

- None during onboarding.

**Relationships:**

- `businesses.id` → `users.business_id`
- `businesses.id` → `reward_rules.business_id`
- `businesses.id` → `catalogs.business_id`

---

### 6.2 `reward_rules`

**Reads:**

- Restore onboarding progress — check if reward rules were already saved.

**Writes:**

- Create reward rules record during Step 2 (`saveRewardRules()`).
- Fields set: `business_id`, `reward_percentage`, `max_redeem_percentage`, `created_at`.

**Updates:**

- Update if user navigates back to Step 2 and changes values.

**Deletes:**

- None during onboarding.

**Relationships:**

- `reward_rules.business_id` → `businesses.id`

---

### 6.3 `catalogs`

**Reads:**

- Check if catalog exists for the business.

**Writes:**

- Create catalog record during onboarding if one does not exist.
- Fields set: `business_id`, `created_at`.

**Updates:**

- None during onboarding.

**Deletes:**

- None during onboarding.

**Relationships:**

- `catalogs.business_id` → `businesses.id`
- `catalogs.id` → `catalog_items.catalog_id`

---

### 6.4 `catalog_items`

**Reads:**

- Restore onboarding progress — list existing catalog items.

**Writes:**

- Create catalog items during Step 3 (`createCatalogItems()`).
- Fields set: `catalog_id`, `type` (service), `name`, `price` (0 for onboarding — price set later), `status` (active), `created_at`.

**Updates:**

- None during onboarding.

**Deletes:**

- Remove items if user removes a service during Step 3 (soft delete or hard delete during onboarding only).

**Relationships:**

- `catalog_items.catalog_id` → `catalogs.id`

---

### 6.5 `users`

**Reads:**

- Get authenticated user record for `business_id` association.

**Writes:**

- None during onboarding (user record created during Sprint 1 authentication).

**Updates:**

- Link `business_id` to the user record after business creation.

**Deletes:**

- None during onboarding.

**Relationships:**

- `users.business_id` → `businesses.id`
- `users.auth_user_id` → `auth.users.id`

---

# 7. Server Actions

## 7.1 `createBusiness()`

**Purpose:** Create a new business record for the authenticated user.

**Input:**

```typescript
{
  name: string,           // 2–50 characters, trimmed
  businessType: string    // valid enum value
}
```

**Validation:**

1. User must be authenticated.
2. User must not already have a business.
3. Name: required, 2–50 characters, trimmed.
4. Business Type: required, valid enum.

**Database:**

- Insert into `businesses` table.
- Update `users` table — set `business_id` for the authenticated user.
- Create a `catalogs` record for the new business.

**Output (Success):**

```typescript
{
  success: true,
  data: {
    business: { id: string, name: string, businessType: string }
  }
}
```

**Output (Failure):**

```typescript
{
  success: false,
  code: "VALIDATION_FAILED" | "ALREADY_EXISTS" | "SERVER_ERROR",
  message: string
}
```

**Errors:**

| Error                   | Code              | User Message                                   |
| ----------------------- | ----------------- | ---------------------------------------------- |
| Missing name            | VALIDATION_FAILED | "Business name is required."                   |
| Name too short          | VALIDATION_FAILED | "Business name must be at least 2 characters." |
| Name too long           | VALIDATION_FAILED | "Business name must be 50 characters or less." |
| Invalid type            | VALIDATION_FAILED | "Please select a valid business type."         |
| Business already exists | ALREADY_EXISTS    | "A business already exists for this account."  |
| Not authenticated       | AUTH_REQUIRED     | Redirect to login.                             |
| Server error            | SERVER_ERROR      | "Something went wrong. Please try again."      |

---

## 7.2 `updateBusiness()`

**Purpose:** Update business details if the user navigates back to Step 1.

**Input:**

```typescript
{
  businessId: string,
  name: string,
  businessType: string
}
```

**Validation:**

1. User must be authenticated.
2. User must own the business (RLS).
3. Same validation as `createBusiness()`.

**Database:**

- Update `businesses` record.

**Output (Success):**

```typescript
{
  success: true,
  data: {
    business: { id: string, name: string, businessType: string }
  }
}
```

**Output (Failure):**

```typescript
{
  success: false,
  code: "VALIDATION_FAILED" | "NOT_FOUND" | "SERVER_ERROR",
  message: string
}
```

**Errors:**

| Error              | Code              | User Message                              |
| ------------------ | ----------------- | ----------------------------------------- |
| Validation failure | VALIDATION_FAILED | Same as createBusiness                    |
| Business not found | NOT_FOUND         | "Business not found."                     |
| Not owner          | AUTH_REQUIRED     | Redirect to login.                        |
| Server error       | SERVER_ERROR      | "Something went wrong. Please try again." |

---

## 7.3 `saveRewardRules()`

**Purpose:** Save or update the reward configuration for the business.

**Input:**

```typescript
{
  businessId: string,
  rewardPercentage: number,     // 1–50
  maxRedeemPercentage: number   // 1–50
}
```

**Validation:**

1. User must be authenticated.
2. User must own the business.
3. Reward Percentage: integer, 1–50.
4. Max Redeem Percentage: integer, 1–50.

**Database:**

- Insert into `reward_rules` if no record exists.
- Update existing `reward_rules` record if one exists.
- Also update `businesses.reward_percentage` and `businesses.max_redeem_percentage` for quick access.

**Output (Success):**

```typescript
{
  success: true,
  data: {
    rewardRules: {
      rewardPercentage: number,
      maxRedeemPercentage: number
    }
  }
}
```

**Output (Failure):**

```typescript
{
  success: false,
  code: "VALIDATION_FAILED" | "SERVER_ERROR",
  message: string
}
```

**Errors:**

| Error              | Code              | User Message                                 |
| ------------------ | ----------------- | -------------------------------------------- |
| Invalid percentage | VALIDATION_FAILED | "Enter a valid percentage between 1 and 50." |
| Not authenticated  | AUTH_REQUIRED     | Redirect to login.                           |
| Server error       | SERVER_ERROR      | "Something went wrong. Please try again."    |

---

## 7.4 `createCatalogItems()`

**Purpose:** Create initial catalog items (services) for the business.

**Input:**

```typescript
{
  businessId: string,
  items: Array<{
    name: string,
    type: "service"
  }>
}
```

**Validation:**

1. User must be authenticated.
2. User must own the business.
3. Each item name: required, trimmed, non-empty.
4. No duplicate names within the batch.
5. No duplicate names against existing catalog items.

**Database:**

- Get or create `catalogs` record for the business.
- Insert into `catalog_items` with `price: 0`, `status: active`.

**Output (Success):**

```typescript
{
  success: true,
  data: {
    items: Array<{ id: string, name: string, type: string }>
  }
}
```

**Output (Failure):**

```typescript
{
  success: false,
  code: "VALIDATION_FAILED" | "DUPLICATE_ITEM" | "SERVER_ERROR",
  message: string
}
```

**Errors:**

| Error              | Code              | User Message                              |
| ------------------ | ----------------- | ----------------------------------------- |
| Blank service name | VALIDATION_FAILED | "Service name cannot be empty."           |
| Duplicate service  | DUPLICATE_ITEM    | "This service already exists."            |
| Not authenticated  | AUTH_REQUIRED     | Redirect to login.                        |
| Server error       | SERVER_ERROR      | "Something went wrong. Please try again." |

---

## 7.5 `completeOnboarding()`

**Purpose:** Mark onboarding as complete and prepare the business for use.

**Input:**

```typescript
{
  businessId: string;
}
```

**Validation:**

1. User must be authenticated.
2. User must own the business.
3. Business must exist.
4. Reward rules must exist.

**Database:**

- Update `businesses.status` to `active` (if not already).
- No additional writes. Business is ready for use.

**Output (Success):**

```typescript
{
  success: true,
  data: {
    redirectTo: "/dashboard"
  }
}
```

**Output (Failure):**

```typescript
{
  success: false,
  code: "INCOMPLETE_SETUP" | "SERVER_ERROR",
  message: string
}
```

**Errors:**

| Error                | Code             | User Message                                     |
| -------------------- | ---------------- | ------------------------------------------------ |
| Missing reward rules | INCOMPLETE_SETUP | "Please complete reward setup before finishing." |
| Not authenticated    | AUTH_REQUIRED    | Redirect to login.                               |
| Server error         | SERVER_ERROR     | "Something went wrong. Please try again."        |

---

## 7.6 `getSuggestedServices()`

**Purpose:** Return a list of suggested service names based on business type.

**Input:**

```typescript
{
  businessType: string;
}
```

**Validation:**

1. Business type must be a valid enum.

**Database:**

- No database query. Returns a static list based on business type.

**Output (Success):**

```typescript
{
  success: true,
  data: {
    suggestions: string[]
  }
}
```

**Suggested Services by Type:**

| Business Type | Suggestions                                                         |
| ------------- | ------------------------------------------------------------------- |
| Salon         | Haircut, Beard, Facial, Hair Color, Hair Spa, Head Massage, Shaving |
| Spa           | Full Body Massage, Head Massage, Facial, Manicure, Pedicure, Waxing |
| Gym           | Monthly Membership, Personal Training, Diet Plan                    |
| Café          | Coffee, Tea, Snacks, Meals                                          |
| Clinic        | Consultation, Follow-up, Treatment                                  |
| Car Wash      | Exterior Wash, Interior Cleaning, Full Detailing, Polish            |
| Other         | Service 1, Service 2                                                |

---

## 7.7 `restoreOnboarding()`

**Purpose:** Check onboarding progress and return the current step for the user.

**Input:**

- None (uses current session).

**Validation:**

1. User must be authenticated.

**Database:**

- Check if `users.business_id` exists.
- If business exists, check if `reward_rules` exist for `business_id`.
- If reward rules exist, check if `catalog_items` exist.

**Output (Success):**

```typescript
{
  success: true,
  data: {
    currentStep: 1 | 2 | 3 | "complete",
    business: { id: string, name: string, businessType: string } | null,
    rewardRules: { rewardPercentage: number, maxRedeemPercentage: number } | null,
    catalogItems: Array<{ id: string, name: string }> | null
  }
}
```

**Logic:**

- No business → Step 1.
- Business exists, no reward rules → Step 2.
- Business + reward rules, no catalog saved → Step 3.
- Business + reward rules + onboarding marked complete → Redirect to Dashboard.

---

# 8. Validation Rules

## 8.1 Business Name

| Rule              | Constraint                      |
| ----------------- | ------------------------------- |
| Required          | Yes                             |
| Minimum length    | 2 characters                    |
| Maximum length    | 50 characters                   |
| Trimmed           | Yes (trim whitespace on submit) |
| Client validation | On blur and on submit           |
| Server validation | Zod schema                      |

**Zod Schema:**

```typescript
export const businessSchema = z.object({
  name: z
    .string()
    .min(2, "Business name must be at least 2 characters")
    .max(50, "Business name must be 50 characters or less")
    .transform((val) => val.trim()),
  businessType: z.enum(
    ["salon", "spa", "gym", "cafe", "clinic", "car_wash", "other"],
    { errorMap: () => ({ message: "Please select a business type" }) },
  ),
});
```

---

## 8.2 Business Type

| Rule              | Constraint                                     |
| ----------------- | ---------------------------------------------- |
| Required          | Yes                                            |
| Valid values      | salon, spa, gym, cafe, clinic, car_wash, other |
| Client validation | Dropdown restricts to valid options            |
| Server validation | Zod enum                                       |

---

## 8.3 Reward Percentage

| Rule              | Constraint              |
| ----------------- | ----------------------- |
| Required          | Yes                     |
| Type              | Integer                 |
| Minimum           | 1                       |
| Maximum           | 50                      |
| Default           | 10                      |
| Client validation | Stepper restricts range |
| Server validation | Zod schema              |

---

## 8.4 Maximum Redeem Percentage

| Rule              | Constraint              |
| ----------------- | ----------------------- |
| Required          | Yes                     |
| Type              | Integer                 |
| Minimum           | 1                       |
| Maximum           | 50                      |
| Default           | 20                      |
| Client validation | Stepper restricts range |
| Server validation | Zod schema              |

**Zod Schema:**

```typescript
export const rewardRulesSchema = z.object({
  rewardPercentage: z
    .number()
    .int()
    .min(1, "Must be at least 1%")
    .max(50, "Cannot exceed 50%"),
  maxRedeemPercentage: z
    .number()
    .int()
    .min(1, "Must be at least 1%")
    .max(50, "Cannot exceed 50%"),
});
```

---

## 8.5 Catalog Items

| Rule                   | Constraint                |
| ---------------------- | ------------------------- |
| Required               | No (catalog can be empty) |
| Name required per item | Yes                       |
| Name trimmed           | Yes                       |
| Duplicate prevention   | Case-insensitive match    |
| Blank prevention       | Trimmed length > 0        |
| Maximum items          | No hard limit for MVP     |

**Zod Schema:**

```typescript
export const catalogItemSchema = z.object({
  name: z
    .string()
    .min(1, "Service name cannot be empty")
    .max(100, "Service name is too long")
    .transform((val) => val.trim()),
  type: z.literal("service"),
});

export const catalogItemsSchema = z.object({
  items: z.array(catalogItemSchema),
});
```

---

## 8.6 Validation Messages

| Field         | Condition  | Message                                        |
| ------------- | ---------- | ---------------------------------------------- |
| Business Name | Empty      | "Business name is required."                   |
| Business Name | < 2 chars  | "Business name must be at least 2 characters." |
| Business Name | > 50 chars | "Business name must be 50 characters or less." |
| Business Type | Empty      | "Please select a business type."               |
| Reward %      | < 1        | "Must be at least 1%."                         |
| Reward %      | > 50       | "Cannot exceed 50%."                           |
| Max Redeem %  | < 1        | "Must be at least 1%."                         |
| Max Redeem %  | > 50       | "Cannot exceed 50%."                           |
| Service Name  | Empty      | "Service name cannot be empty."                |
| Service Name  | Duplicate  | "This service already exists."                 |

---

# 9. Security

- **Server validates all inputs.** Every Server Action validates with Zod before any database operation.
- **Ownership validation.** Every action confirms the authenticated user owns the business via `business_id` match and RLS.
- **Prevent duplicate businesses.** `createBusiness()` checks that the user does not already have a business.
- **Prevent unauthorized updates.** `updateBusiness()` and `saveRewardRules()` verify ownership.
- **Never trust client values.** Percentages and names are validated server-side. Client-side validation is UX only.
- **Rate limiting.** Not critical for onboarding (single-use flow), but standard server-side protections apply.
- **RLS enforced.** Every table query passes through Supabase RLS policies scoped to `business_id`.

---

# 10. State Management

## 10.1 Server State (TanStack Query)

| Query               | Key                             | Purpose                            |
| ------------------- | ------------------------------- | ---------------------------------- |
| Onboarding Progress | `['onboarding']`                | Restore step and data on page load |
| Suggested Services  | `['suggestions', businessType]` | Fetch service suggestions by type  |

Used for:

- Restoring onboarding progress on app load or refresh.
- Caching suggested services.

---

## 10.2 Client State (Zustand)

A lightweight onboarding store holds the in-progress form data across steps.

```typescript
interface OnboardingStore {
  // Step 1
  businessName: string;
  businessType: string;
  businessId: string | null;

  // Step 2
  rewardPercentage: number;
  maxRedeemPercentage: number;

  // Step 3
  selectedServices: string[];

  // Actions
  setBusinessInfo: (name: string, type: string, id: string) => void;
  setRewardRules: (reward: number, maxRedeem: number) => void;
  addService: (name: string) => void;
  removeService: (index: number) => void;
  reset: () => void;
}
```

This store ensures data persists across step navigation without extra server calls.

---

## 10.3 Local State (React Hook Form)

Each step has its own form managed by React Hook Form with Zod resolver:

- **Step 1:** `useForm<BusinessInput>({ resolver: zodResolver(businessSchema) })`
- **Step 2:** `useForm<RewardRulesInput>({ resolver: zodResolver(rewardRulesSchema) })`
- **Step 3:** Local `useState` for the service list (no traditional form needed).

---

# 11. Screen-to-API Mapping

| Screen         | User Action                 | Server Action                                   | Success                | Failure                    |
| -------------- | --------------------------- | ----------------------------------------------- | ---------------------- | -------------------------- |
| Business Setup | Enter name & type, Continue | `createBusiness()` or `updateBusiness()`        | Navigate to Rewards    | Show inline error or toast |
| Reward Rules   | Set percentages, Continue   | `saveRewardRules()`                             | Navigate to Catalog    | Show inline error or toast |
| Catalog Setup  | Add services, Finish        | `createCatalogItems()` → `completeOnboarding()` | Redirect to Dashboard  | Show inline error or toast |
| Any Step       | Load page                   | `restoreOnboarding()`                           | Resume at correct step | Redirect to Login          |
| Catalog Setup  | Load step                   | `getSuggestedServices()`                        | Show suggestion chips  | Show fallback list         |

---

# 12. Component Hierarchy

**Step 1 — Business Setup**

```text
OnboardingLayout
├── ProgressHeader (1/3)
├── Form
│   ├── BusinessNameInput
│   ├── BusinessTypeDropdown
│   └── ErrorMessage
└── ContinueButton (Sticky)
```

**Step 2 — Reward Rules**

```text
OnboardingLayout
├── AppBar (BackButton)
├── ProgressHeader (2/3)
├── Form
│   ├── RewardPercentageStepper
│   ├── MaxRedeemStepper
│   └── RewardPreviewCard
└── ContinueButton (Sticky)
```

**Step 3 — Catalog Setup**

```text
OnboardingLayout
├── AppBar (BackButton)
├── ProgressHeader (3/3)
├── CatalogSearch
├── SuggestedServices
├── SelectedServicesList
│   └── ServiceCard (×N)
└── FinishButton (Sticky)
```

---

# 13. Onboarding State Machine

```text
Not Started (No Business)
    │
    ▼
Step 1: Business Setup
    │
    ├── Validation Fails → Stay on Step 1, Show Error
    │
    ├── Server Error → Stay on Step 1, Show Toast
    │
    └── Success → Transition to Step 2
                    │
                    ▼
              Step 2: Reward Rules
                    │
                    ├── Validation Fails → Stay on Step 2, Show Error
                    │
                    ├── Server Error → Stay on Step 2, Show Toast
                    │
                    ├── Back → Return to Step 1 (data preserved)
                    │
                    └── Success → Transition to Step 3
                                    │
                                    ▼
                              Step 3: Catalog
                                    │
                                    ├── Server Error → Stay on Step 3, Show Toast
                                    │
                                    ├── Back → Return to Step 2 (data preserved)
                                    │
                                    └── Finish → completeOnboarding()
                                                    │
                                                    ├── Failure → Stay on Step 3, Show Toast
                                                    │
                                                    └── Success → Dashboard
```

**Session Expired at Any Step:**

- Middleware detects expired session → Redirect to Login.
- Server Action returns `AUTH_REQUIRED` → Redirect to Login.

---

# 14. Error States

## 14.1 Business Already Exists

**User Message:** "A business already exists for this account."

**Recovery:** Redirect to Dashboard. This should not happen in normal flow.

## 14.2 Invalid Reward Percentage

**User Message:** "Enter a valid percentage between 1 and 50."

**Recovery:** Stepper prevents out-of-range values. Message shown only if server rejects.

## 14.3 Duplicate Service

**User Message:** "This service already exists."

**Recovery:** Input is cleared. User enters a different name.

## 14.4 Blank Service Name

**User Message:** "Service name cannot be empty."

**Recovery:** Input remains focused. User enters a valid name.

## 14.5 Network Error

**User Message:** "Unable to save. Please check your connection."

**Display:** Toast notification.

**Recovery:** User retries after restoring connection.

## 14.6 Server Error

**User Message:** "Something went wrong. Please try again."

**Display:** Toast notification.

**Recovery:** User retries the action.

## 14.7 Session Expired

**User Message:** None (silent redirect).

**Recovery:** Redirect to Login. User re-authenticates and resumes onboarding.

## 14.8 Unauthorized

**User Message:** None (silent redirect).

**Recovery:** Redirect to Login.

## 14.9 Incomplete Setup

**User Message:** "Please complete reward setup before finishing."

**Recovery:** Redirect to the missing step.

---

# 15. Loading States

## 15.1 Business Creation

**Trigger:** User taps "Continue" on Step 1.

**UI:** Continue button shows spinner. Inputs disabled.

## 15.2 Reward Save

**Trigger:** User taps "Continue" on Step 2.

**UI:** Continue button shows spinner. Steppers disabled.

## 15.3 Catalog Save

**Trigger:** User taps "Finish" on Step 3.

**UI:** Finish button shows spinner. Inputs and chips disabled.

## 15.4 Complete Onboarding

**Trigger:** After catalog items are saved.

**UI:** Brief loading state before redirect to Dashboard.

## 15.5 Restore Progress

**Trigger:** Page load or refresh on any onboarding route.

**UI:** Skeleton loading state while `restoreOnboarding()` resolves.

---

# 16. Edge Cases

## 16.1 Back Navigation

- Navigating back preserves all entered data.
- Zustand store holds in-progress values.
- Forms are pre-populated from the store.

## 16.2 Refresh Page

- `restoreOnboarding()` checks server for progress.
- User resumes at the correct step.
- Previously saved data is restored from the database.
- Unsaved form data on the current step is lost (acceptable — only the current step's input).

## 16.3 Close Browser

- Same as page refresh. Progress is restored from the database on next visit.

## 16.4 Double Tap Continue/Finish

- Button is disabled immediately on first tap.
- `isSubmitting` prevents duplicate requests.

## 16.5 Slow Network

- Loading states remain visible until server responds.
- No client-side timeout.

## 16.6 Offline

- Show toast: "You are offline. Please check your connection."
- Disable form submission.

## 16.7 Duplicate Services

- Prevented client-side: `CatalogSearch` checks `existingServices` before adding.
- Prevented server-side: `createCatalogItems()` rejects duplicates.
- Case-insensitive comparison.

## 16.8 Skip Catalog

- Catalog can be empty.
- `completeOnboarding()` does not require catalog items.
- Owner can add services later from the More screen.

## 16.9 Keyboard Overlap

- Sticky CTA button positions above the keyboard.
- Scroll adjusts to keep the focused input visible.

## 16.10 Session Expires During Onboarding

- Server Action returns `AUTH_REQUIRED`.
- Client redirects to Login.
- On re-login, `restoreOnboarding()` resumes at the saved step.

## 16.11 Large Catalog

- No hard limit on services during onboarding.
- List scrolls naturally.
- Performance is not a concern for MVP catalog sizes.

## 16.12 Interrupted Onboarding

- If the user completes Step 1 but leaves before Step 2:
  - On return, `restoreOnboarding()` detects business exists but no reward rules → navigates to Step 2.
- If the user completes Steps 1 and 2 but leaves before Step 3:
  - On return, `restoreOnboarding()` navigates to Step 3.

---

# 17. Tasks

## Developer Checklist

### Onboarding UI

- [ ] Create `OnboardingLayout` component.
- [ ] Create `ProgressHeader` component.
- [ ] Create `BusinessNameInput` component.
- [ ] Create `BusinessTypeDropdown` component.
- [ ] Create `RewardPercentageStepper` component.
- [ ] Create `MaxRedeemStepper` component.
- [ ] Create `RewardPreviewCard` component.
- [ ] Create `SuggestedServices` component.
- [ ] Create `CatalogSearch` component.
- [ ] Create `ServiceCard` component.
- [ ] Create `SelectedServicesList` component.

### Pages

- [ ] Create Step 1 page (`/(onboarding)/business/page.tsx`).
- [ ] Create Step 2 page (`/(onboarding)/rewards/page.tsx`).
- [ ] Create Step 3 page (`/(onboarding)/catalog/page.tsx`).
- [ ] Create onboarding layout (`/(onboarding)/layout.tsx`).

### Server Actions

- [ ] Implement `createBusiness()`.
- [ ] Implement `updateBusiness()`.
- [ ] Implement `saveRewardRules()`.
- [ ] Implement `createCatalogItems()`.
- [ ] Implement `completeOnboarding()`.
- [ ] Implement `getSuggestedServices()`.
- [ ] Implement `restoreOnboarding()`.

### Validation

- [ ] Create `businessSchema` (Zod).
- [ ] Create `rewardRulesSchema` (Zod).
- [ ] Create `catalogItemSchema` (Zod).
- [ ] Integrate schemas with React Hook Form.

### State Management

- [ ] Create `onboarding-store.ts` (Zustand).
- [ ] Implement TanStack Query hooks for onboarding.

### Progress Persistence

- [ ] Implement `restoreOnboarding()` logic.
- [ ] Handle page refresh at each step.
- [ ] Handle browser close and reopen.
- [ ] Pre-populate forms from restored data.

### Navigation

- [ ] Implement back navigation with data preservation.
- [ ] Implement forward navigation on success.
- [ ] Implement redirect to Dashboard on completion.

### Error Handling

- [ ] Handle all error codes from Server Actions.
- [ ] Map errors to user-friendly messages.
- [ ] Implement toast notifications.
- [ ] Implement inline validation errors.

### Testing

- [ ] Verify all acceptance criteria.
- [ ] Responsive testing (360px–430px).
- [ ] Accessibility testing.

---

# 18. Acceptance Criteria

### Business Setup

- [ ] User can enter a business name.
- [ ] Business name input auto focuses on mount.
- [ ] Business name validates minimum 2 characters.
- [ ] Business name validates maximum 50 characters.
- [ ] Empty business name shows inline error.
- [ ] User can select a business type from dropdown.
- [ ] Missing business type shows inline error.
- [ ] Continue button is disabled until form is valid.
- [ ] Continue button shows spinner during creation.
- [ ] Successful creation navigates to Reward Rules.
- [ ] Business record exists in database after Step 1.

### Reward Rules

- [ ] Reward percentage stepper defaults to 10.
- [ ] Max redeem percentage stepper defaults to 20.
- [ ] Stepper – button is disabled at minimum (1).
- [ ] Stepper + button is disabled at maximum (50).
- [ ] Reward preview card updates in real-time.
- [ ] Preview shows correct calculation for ₹1,000 bill.
- [ ] Back button navigates to Step 1 with data preserved.
- [ ] Continue button shows spinner during save.
- [ ] Successful save navigates to Catalog Setup.
- [ ] Reward rules record exists in database after Step 2.

### Catalog Setup

- [ ] Suggested services are displayed as chips.
- [ ] Tapping a suggested service adds it to the list.
- [ ] Added services appear in the selected list.
- [ ] User can add custom services via search input.
- [ ] Custom service input clears after adding.
- [ ] Duplicate services are prevented.
- [ ] Duplicate prevention is case-insensitive.
- [ ] Blank service names are prevented.
- [ ] User can remove a service from the list.
- [ ] Empty catalog is allowed (skip).
- [ ] Back button navigates to Step 2 with data preserved.
- [ ] Finish button shows spinner during save.
- [ ] Successful completion redirects to Dashboard.

### Progress Indicator

- [ ] Step 1 shows "1 of 3" as active.
- [ ] Step 2 shows "2 of 3" as active, Step 1 as complete.
- [ ] Step 3 shows "3 of 3" as active, Steps 1–2 as complete.

### Navigation

- [ ] Back button is hidden on Step 1.
- [ ] Back button is visible on Steps 2 and 3.
- [ ] Back navigation preserves all entered data.
- [ ] Forward navigation only proceeds after successful server save.

### Progress Restoration

- [ ] Refreshing on Step 1 stays on Step 1.
- [ ] Refreshing on Step 2 restores Step 2 with saved data.
- [ ] Refreshing on Step 3 restores Step 3 with saved data.
- [ ] Closing browser and reopening resumes at correct step.
- [ ] Completed onboarding redirects to Dashboard.

### Security

- [ ] All inputs validated server-side with Zod.
- [ ] User cannot create a second business.
- [ ] RLS prevents cross-business access.
- [ ] No secrets exposed to browser.

### Performance

- [ ] Total onboarding completes in under 60 seconds.
- [ ] Each step transition takes less than 2 seconds.

### Error Handling

- [ ] Network errors show toast notification.
- [ ] Server errors show toast notification.
- [ ] Validation errors show inline messages.
- [ ] Session expired redirects to login.

---

# 19. Definition of Done

## Build

- [ ] `npm run build` — no errors.
- [ ] `npx tsc --noEmit` — no TypeScript errors.
- [ ] `npm run lint` — no warnings.

## Responsive

- [ ] All onboarding pages render correctly at 360px width.
- [ ] All onboarding pages render correctly at 430px width.
- [ ] Touch targets ≥ 48×48px.
- [ ] Sticky CTA visible and reachable.

## Accessibility

- [ ] WCAG AA contrast ratios.
- [ ] Semantic HTML (`form`, `label`, `input`, `select`, `button`).
- [ ] `aria-label` on icon-only elements.
- [ ] Visible focus states.
- [ ] `prefers-reduced-motion` respected.
- [ ] Screen reader announces errors.

## Performance

- [ ] Onboarding completes in under 60 seconds.
- [ ] No full-screen spinners. Loading localized to buttons.

## Security

- [ ] Server validates all inputs.
- [ ] RLS enforced.
- [ ] No secrets exposed.
- [ ] Ownership validated.

## PRD Compliance

- [ ] Onboarding flow matches `00_Founder_Decisions.md` — Decision 05.
- [ ] Reward rules match Decision 10 and Decision 11.
- [ ] Service management matches Decision 09.
- [ ] No out-of-scope features.

## UI Specification Compliance

- [ ] Design tokens from `09_UI_UX_Specification.md` used.
- [ ] Bottom navigation hidden during onboarding.
- [ ] Progress indicator present on all steps.
- [ ] Same header and spacing on all steps.
- [ ] Inter font applied.

---

# 20. File Structure

Every file that Sprint 2 creates:

```
src/
├── app/
│   └── (onboarding)/
│       ├── business/
│       │   └── page.tsx                    # Step 1: Business Setup
│       ├── rewards/
│       │   └── page.tsx                    # Step 2: Reward Rules
│       ├── catalog/
│       │   └── page.tsx                    # Step 3: Catalog Setup
│       └── layout.tsx                      # Onboarding layout (no bottom nav)
│
├── features/
│   └── onboarding/
│       ├── components/
│       │   ├── onboarding-layout.tsx       # Onboarding page wrapper
│       │   ├── progress-header.tsx         # Step indicator (1/2/3)
│       │   ├── business-name-input.tsx     # Business name field
│       │   ├── business-type-dropdown.tsx  # Business type select
│       │   ├── reward-stepper.tsx          # Shared stepper component
│       │   ├── reward-preview-card.tsx     # Live reward calculation preview
│       │   ├── suggested-services.tsx      # Service suggestion chips
│       │   ├── catalog-search.tsx          # Manual service input
│       │   ├── service-card.tsx            # Individual service card
│       │   └── selected-services-list.tsx  # List of selected services
│       ├── actions/
│       │   ├── create-business.ts          # createBusiness server action
│       │   ├── update-business.ts          # updateBusiness server action
│       │   ├── save-reward-rules.ts        # saveRewardRules server action
│       │   ├── create-catalog-items.ts     # createCatalogItems server action
│       │   ├── complete-onboarding.ts      # completeOnboarding server action
│       │   ├── get-suggested-services.ts   # getSuggestedServices (static)
│       │   └── restore-onboarding.ts       # restoreOnboarding server action
│       ├── hooks/
│       │   ├── use-onboarding.ts           # TanStack Query onboarding hook
│       │   └── use-suggested-services.ts   # TanStack Query suggestions hook
│       ├── schemas/
│       │   ├── business-schema.ts          # Business validation schema
│       │   ├── reward-rules-schema.ts      # Reward rules validation schema
│       │   └── catalog-item-schema.ts      # Catalog item validation schema
│       ├── types/
│       │   └── onboarding-types.ts         # Onboarding-related types
│       ├── stores/
│       │   └── onboarding-store.ts         # Zustand onboarding store
│       ├── services/                        # Empty
│       ├── utils/                           # Empty
│       ├── constants/
│       │   └── onboarding-constants.ts     # Suggested services, defaults
│       └── index.ts                         # Public exports
```

---

# 21. Dependencies

| Package                       | Purpose                                                          |
| ----------------------------- | ---------------------------------------------------------------- |
| `react-hook-form`             | Form state management for Steps 1 and 2.                         |
| `@hookform/resolvers`         | Connects Zod schemas to React Hook Form.                         |
| `zod`                         | Schema validation for business, reward rules, and catalog items. |
| `@tanstack/react-query`       | Caching onboarding progress and suggested services.              |
| `zustand`                     | Onboarding store for cross-step data persistence.                |
| `@supabase/supabase-js`       | Database operations via Supabase client.                         |
| `@supabase/ssr`               | Server-side Supabase client for Server Actions.                  |
| `lucide-react`                | Icons: ArrowLeft, Plus, X, ChevronUp, ChevronDown.               |
| `sonner` or `react-hot-toast` | Toast notifications for errors.                                  |
| `clsx` / `tailwind-merge`     | Conditional class names (`cn()`).                                |

All dependencies are already installed from Sprint 1.

---

# 22. Testing Checklist

Manual QA checklist for Sprint 2.

### Business Setup

- [ ] Business name input auto focuses.
- [ ] Empty name → error shown, Continue disabled.
- [ ] 1 character → error shown.
- [ ] 2+ characters → valid.
- [ ] 50 characters → valid.
- [ ] 51 characters → error shown.
- [ ] No type selected → error shown.
- [ ] Valid form → Continue enabled.
- [ ] Continue shows spinner during save.

### Reward Rules

- [ ] Stepper defaults: Reward 10%, Max Redeem 20%.
- [ ] – disabled at 1%.
- [ ] + disabled at 50%.
- [ ] Preview updates in real-time.
- [ ] Back preserves Step 1 data.
- [ ] Continue shows spinner during save.

### Catalog

- [ ] Suggested services displayed as chips.
- [ ] Tapping chip adds to list.
- [ ] Custom input adds to list.
- [ ] Duplicate prevented with message.
- [ ] Blank prevented.
- [ ] Remove button works.
- [ ] Empty catalog allowed.
- [ ] Back preserves Step 2 data.
- [ ] Finish shows spinner during save.
- [ ] Dashboard loads after finish.

### Navigation

- [ ] Step 1 has no back button.
- [ ] Steps 2 and 3 have back button.
- [ ] Back preserves data.
- [ ] Forward only after server save.

### Progress Restore

- [ ] Refresh on Step 1 → stays on Step 1.
- [ ] Refresh on Step 2 → restores Step 2.
- [ ] Refresh on Step 3 → restores Step 3.
- [ ] Close/reopen → resumes correct step.

### Responsive Behavior

- [ ] All steps correct at 360px width.
- [ ] All steps correct at 430px width.
- [ ] Touch targets ≥ 48×48px.
- [ ] Keyboard does not cover sticky CTA.

### Keyboard Behavior

- [ ] Business name input shows text keyboard.
- [ ] Service search input shows text keyboard.
- [ ] Enter key submits the form.

### Accessibility

- [ ] Tab navigates between fields.
- [ ] Focus ring visible.
- [ ] Screen reader reads labels.
- [ ] Screen reader announces errors.
- [ ] `prefers-reduced-motion` respected.

### Performance

- [ ] Full onboarding under 60 seconds.
- [ ] Each step transition under 2 seconds.

---

# 23. Implementation Order

**Phase 1 — Routes & Layout**

- Create `/(onboarding)` route group.
- Create onboarding layout.
- Create page stubs for all three steps.

↓

**Phase 2 — Shared Components**

- OnboardingLayout
- ProgressHeader
- ErrorMessage (reuse from Sprint 1)
- BackButton
- ContinueButton / FinishButton (reuse from Sprint 1)

↓

**Phase 3 — Step 1: Business Setup**

- BusinessNameInput
- BusinessTypeDropdown
- Business Setup page
- `businessSchema`

↓

**Phase 4 — Step 2: Reward Rules**

- RewardPercentageStepper
- MaxRedeemStepper
- RewardPreviewCard
- Reward Rules page
- `rewardRulesSchema`

↓

**Phase 5 — Step 3: Catalog Setup**

- SuggestedServices
- CatalogSearch
- ServiceCard
- SelectedServicesList
- Catalog Setup page
- `catalogItemSchema`

↓

**Phase 6 — Server Actions**

- `createBusiness()`
- `updateBusiness()`
- `saveRewardRules()`
- `createCatalogItems()`
- `completeOnboarding()`
- `getSuggestedServices()`
- `restoreOnboarding()`

↓

**Phase 7 — State Management**

- Zustand onboarding store.
- TanStack Query hooks.
- Progress restoration logic.

↓

**Phase 8 — Error Handling & Edge Cases**

- Inline validation errors.
- Toast notifications.
- Double-tap prevention.
- Offline detection.

↓

**Phase 9 — QA**

- Acceptance Criteria verification.
- Responsive testing.
- Accessibility testing.

_Why this order?_ Layout and shared components are built first so each step page can compose from them. Steps are built sequentially (1 → 2 → 3) because each step depends on the previous. Server Actions are wired after the UI is ready. State management connects everything. Error handling and QA polish the experience.

---

# 24. Sprint Ownership

**Sprint 2 Owns:**

- Onboarding pages (`/(onboarding)/*`).
- Onboarding components (`features/onboarding/components/*`).
- Onboarding Server Actions (`features/onboarding/actions/*`).
- Onboarding validation schemas (`features/onboarding/schemas/*`).
- Onboarding Zustand store (`features/onboarding/stores/*`).
- Onboarding TanStack Query hooks (`features/onboarding/hooks/*`).
- Onboarding constants (suggested services, defaults).
- Progress restoration logic.

_Strict Rule:_ No other sprint should modify these files unless absolutely necessary. Onboarding is a locked foundation after Sprint 2.

---

# 25. Out of Scope

**Sprint 2 must NOT build or modify:**

- Dashboard
- Billing / Add Visit
- Transactions
- Insights
- Staff Management
- Settings
- Analytics
- Notifications
- PWA Install Prompt
- Offline Sync
- Multi-branch
- Membership Plans
- Coupons
- Campaigns
- Advanced Business Profile (logo, GST, address, email)

_These features belong strictly to future sprints._

---

# 26. Sprint Success Definition

**From the user's perspective:**

_A first-time salon owner should be able to:_

Open RewardLoop → Log in with OTP → Enter business name → Select business type → Set Reward % and Max Redeem % → Add services from suggestions → Reach Dashboard → Start serving customers.

Total time from login to Dashboard: **under 60 seconds.**

_A returning owner should:_

Open RewardLoop → Automatically restore session → Reach Dashboard → Never see onboarding again.

_If onboarding is interrupted:_

Close browser → Reopen → Re-authenticate → Resume at the exact step where they left off.

---

# 27. Engineering Review Checklist

**Before Sprint 2 is marked complete, verify:**

- [ ] Build passes.
- [ ] TypeScript passes.
- [ ] ESLint passes.
- [ ] No `console.log` in production.
- [ ] No duplicated code.
- [ ] No hardcoded strings.
- [ ] No inline styles.
- [ ] Responsive verified (360px–430px).
- [ ] Accessibility verified.
- [ ] Security verified (server validation, RLS, ownership).
- [ ] Business rules verified (reward %, max redeem %, catalog).
- [ ] Progress persistence verified (refresh, close, resume).
- [ ] All Acceptance Criteria verified.
- [ ] Definition of Done completed.

---

# 28. AI Coding Instructions

**Every AI-generated implementation must:**

- Follow `Development/00_Project_Setup.md`.
- Follow authentication patterns established in Sprint 1.
- Follow `09_UI_UX_Specification.md`.
- Follow API contracts from `08_API_Design.md`.
- Follow `00_Founder_Decisions.md` exactly.
- Reuse existing components (Button, Input, Toast from Sprint 1).
- Never invent onboarding steps beyond the approved three.
- Never change business rules (reward formula, redeem rules).
- Never duplicate validation logic (shared schemas).
- Use Server Actions for all data mutations.
- Use Zod for all validation.
- Use React Hook Form for form state.
- Use existing design tokens.
- Prefer Server Components unless client state is required.
- Maintain strict TypeScript. No `any` type.
- Compose from shadcn/ui instead of rewriting components.

---

# 29. Version History

| Version | Status  | Changes                 |
| ------- | ------- | ----------------------- |
| 1.0     | Initial | Sprint document created |

---

# Document Status

✅ Ready for Development

This document is the complete implementation specification for the RewardLoop Onboarding module (Sprint 2). Every decision is grounded in the approved planning documents. No business rules have been invented. A developer or AI coding agent can build the entire onboarding system from this document alone.
