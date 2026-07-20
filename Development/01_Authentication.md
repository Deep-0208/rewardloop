# 01_Authentication.md

> **Project:** RewardLoop
>
> **Sprint:** 1
>
> **Feature:** Authentication
>
> **Version:** 1.1
>
> **Status:** Ready for Development
>
> **Purpose:** Complete implementation specification for the Authentication module. An AI coding agent or developer can build the entire authentication system from this document alone.
>
> **Depends on:** 00_Project_Setup.md, 00_Founder_Decisions.md, 06_Database_Design.md, 08_API_Design.md, 09_UI_UX_Specification.md

---

# Table of Contents

1. Sprint Goal
2. Scope
3. User Flow
4. Pages
5. UI Components
6. Database
7. Server Actions
8. Validation
9. Security
10. State Management
11. Error States
12. Loading States
13. Edge Cases
14. Tasks
15. Acceptance Criteria
16. Definition of Done
17. File Structure
18. Dependencies
19. Testing Checklist
20. Sprint Summary
21. Screen-to-API Mapping
22. Component Hierarchy
23. Route Protection
24. Authentication State Machine
25. Sequence Diagram
26. Performance Targets
27. Analytics Events
28. Feature Flags
29. Risks
30. Sprint Exit Criteria
31. Implementation Order
32. Dependency Graph
33. Sprint Ownership
34. Out of Scope
35. Sprint Success Definition
36. Engineering Review Checklist
37. AI Implementation Rules
38. Version History

---

# 1. Sprint Goal

Build the complete authentication module for RewardLoop.

After this sprint, a salon owner can:

- Enter their phone number.
- Receive an OTP.
- Verify the OTP.
- Be routed to the correct destination (Dashboard or Onboarding).
- Have their session persist across page refreshes.
- Log out.

Authentication is the gateway to the entire application. No other feature functions without it.

---

## Business Context

From `00_Founder_Decisions.md`:

- Authentication uses **Mobile Number + OTP only**.
- **No passwords.** Not now, not ever.
- OTP is required only during first login on a device.
- Session persists until explicit logout.
- One active device per user at a time.
- Device transfer is supported (logging in on a new device logs out the old one).

From `00_Founder_Decisions.md` — Success Metrics:

- Login to Dashboard ≤ 5 seconds.
- Authentication method: OTP.

---

# 2. Scope

## Included

- Phone number input with validation.
- OTP delivery via Supabase Auth (Phone Provider).
- OTP verification — **exactly 6 digits** (locked per `00_Founder_Decisions.md` Decision 12). Do not build 4-digit OTP input.
- Session creation (JWT via Supabase Auth containing `session_version` claim).
- Session persistence across page refreshes.
- Session restoration on app revisit.
- Route protection (middleware-based auth guard).
- Redirect logic: existing business → Dashboard, no business → Onboarding.
- Logout (session termination + session_version increment).
- OTP resend with cooldown timer.
- OTP expiration handling.
- OTP attempt limit handling.
- **SESSION_REVOKED handling** — when a user logs in on a new device, the old device's JWT becomes invalid. The app must detect this (401 SESSION_REVOKED) and redirect to login with a message.
- Error states for all failure scenarios.
- Loading states for all async operations.

## Not Included

- Onboarding (Sprint 2).
- Staff login (uses same auth flow but staff management is Sprint 7).
- Device management UI.
- Account deletion.
- Multi-factor authentication beyond OTP.
- Email authentication.
- Social login.

## Future

- Staff invitation and approval flow.
- Device management settings.
- Session timeout configuration.
- Biometric authentication.

---

# 3. User Flow

## Primary Flow — Owner First Login

```
App Launch
    │
    ▼
Session Check (middleware)
    │
    ├── Valid Session Found
    │       │
    │       ├── Business Exists → Dashboard
    │       │
    │       └── No Business → Onboarding
    │
    └── No Session
            │
            ▼
      Login Page
            │
            ▼
   Enter Phone Number
            │
            ▼
   Tap "Continue"
            │
            ▼
    Send OTP (Server)
            │
            ▼
  OTP Verification Page
            │
            ▼
     Enter OTP
            │
            ▼
   Auto Verify / Tap "Verify"
            │
            ▼
   Verify OTP (Server)
            │
            ├── Success
            │       │
            │       ├── Business Exists → Dashboard
            │       │
            │       └── No Business → Onboarding
            │
            └── Failure
                    │
                    ├── Invalid OTP → Show Error, Stay on Page
                    │
                    ├── Expired OTP → Show Error, Offer Resend
                    │
                    └── Too Many Attempts → Show Error, Block Temporarily
```

---

## Returning User Flow

```
App Launch
    │
    ▼
Session Check (middleware)
    │
    ▼
Valid Session Found
    │
    ▼
Dashboard
```

No login screen. No OTP. Session is already valid.

---

## Expired Session Flow

```
App Launch / Navigation
    │
    ▼
Session Check (middleware)
    │
    ▼
Session Expired / Invalid
    │
    ▼
Redirect to Login Page
```

---

## Session Revoked Flow (Single-Device Enforcement)

This occurs when the owner logs in on a **new device**, automatically invalidating the previous device.

```
Active Session on Device A
    │
    ▼
Owner logs in on Device B
    │
    ▼
Server increments session_version on users table
    │
    ▼
Device A makes next API call (any action or page navigation)
    │
    ▼
Middleware / Server Action receives 401 SESSION_REVOKED
    │
    ▼
Clear local session (supabase.auth.signOut() client-side)
    │
    ▼
Redirect to Login page
    │
    ▼
Show toast: "You have been logged in on another device."
```

**Implementation note:** The middleware must check for `SESSION_REVOKED` error code on every protected route. Server Actions must propagate this error as `ActionResult<never>` with `code: 'SESSION_REVOKED'`, which the client interceptor catches globally.

---

## OTP Resend Flow

```
OTP Verification Page
    │
    ▼
Timer Expires (30 seconds)
    │
    ▼
"Resend OTP" becomes active
    │
    ▼
Tap "Resend OTP"
    │
    ▼
Send OTP (Server)
    │
    ▼
New OTP Sent
    │
    ▼
Timer Resets (30 seconds)
```

---

## Invalid OTP Flow

```
OTP Verification Page
    │
    ▼
Enter Wrong OTP
    │
    ▼
Tap "Verify" / Auto Verify
    │
    ▼
Server Rejects OTP
    │
    ▼
Show Inline Error: "Invalid OTP. Please try again."
    │
    ▼
Clear OTP Fields
    │
    ▼
Auto Focus First OTP Field
    │
    ▼
Remaining Attempts Tracked (Server Side)
```

---

## Expired OTP Flow

```
OTP Verification Page
    │
    ▼
OTP Has Expired (server-side check)
    │
    ▼
Show Inline Error: "OTP has expired. Please request a new one."
    │
    ▼
"Resend OTP" becomes active immediately
```

---

## Logout Flow

```
More Screen → Logout
    │
    ▼
Confirm Logout (Dialog)
    │
    ▼
Logout (Server)
    │
    ▼
Clear Session
    │
    ▼
Redirect to Login Page
```

---

# 4. Pages

## 4.1 Login Page

**Purpose:** Collect the user's phone number to initiate OTP authentication.

**Route:** `/(auth)/login`

**Template:** Form Entry (Header → Form → Flexible Spacer → Sticky CTA)

**Components:**

- AuthLayout (no bottom navigation)
- AppBar (logo only, no back button)
- Phone Input (with country code)
- Continue Button (primary CTA, sticky bottom)
- Error Message (inline, below input)

**Actions:**

- `sendOTP(phone)` — triggered on form submit.

**Navigation:**

- Success → `/(auth)/verify`
- No back navigation (this is the entry point).

**Success Behavior:**

- Navigate to OTP Verification page.
- Pass phone number via route state or query parameter.

**Error Behavior:**

- Invalid phone → inline error below input: "Enter a valid 10-digit phone number."
- Network error → toast: "Unable to send OTP. Please check your connection."
- Server error → toast: "Something went wrong. Please try again."
- Rate limited → inline error: "Too many requests. Please wait before trying again."

**Loading Behavior:**

- Continue button shows spinner, label replaced.
- Input becomes disabled during submission.

**Empty State:**

- Not applicable. The form is always visible.

**UI Rules (from 09_UI_UX_Specification.md):**

- Auto focus on phone input on mount.
- Numeric keyboard.
- Continue button disabled until phone number is valid (10 digits).
- Bottom navigation hidden.
- Minimum touch target 48×48px.

---

## 4.2 OTP Verification Page

**Purpose:** Verify the OTP sent to the user's phone number.

**Route:** `/(auth)/verify`

**Template:** Form Entry (Header → Form → Flexible Spacer → Sticky CTA)

**Components:**

- AuthLayout (no bottom navigation)
- AppBar (back button to login)
- Phone Number Display (show the number OTP was sent to)
- OTP Input (individual digit fields)
- Verify Button (primary CTA, sticky bottom)
- Resend Timer ("Resend OTP in 0:30")
- Resend Button (appears after timer expires)
- Error Message (inline)

**Actions:**

- `verifyOTP(phone, otp)` — triggered on form submit or auto-verify.
- `resendOTP(phone)` — triggered on resend tap.

**Navigation:**

- Back → `/(auth)/login`
- Success + Business exists → `/(app)/dashboard`
- Success + No business → `/(onboarding)/setup`

**Success Behavior:**

- Brief loading state.
- Redirect to Dashboard or Onboarding based on business existence.

**Error Behavior:**

- Invalid OTP → inline error: "Invalid OTP. Please try again."
- Expired OTP → inline error: "OTP has expired. Please request a new one."
- Too many attempts → inline error: "Too many failed attempts. Please request a new OTP."
- Network error → toast: "Unable to verify. Please check your connection."

**Loading Behavior:**

- Verify button shows spinner.
- OTP inputs become disabled during verification.

**Empty State:**

- Not applicable.

**UI Rules (from 09_UI_UX_Specification.md):**

- Auto focus on first OTP field on mount.
- Auto advance to next field on digit entry.
- Backspace moves to previous field.
- Paste supported (full OTP paste fills all fields).
- Auto verify after last digit is entered.
- Numeric keyboard.
- Bottom navigation hidden.

---

## 4.3 Session Validation (Middleware)

**Purpose:** Check authentication state on every protected route.

**Route:** All routes except `/(auth)/*`

**Implementation:** Next.js middleware (`middleware.ts`)

**Behavior:**

- Check for valid Supabase session.
- Valid session → allow navigation.
- No session or expired session → redirect to `/(auth)/login`.
- Auth routes with valid session → redirect to `/(app)/dashboard`.

---

## 4.4 Unauthorized Redirect

**Purpose:** Catch unauthorized access attempts.

**Behavior:**

- If a user directly navigates to a protected route without a session, middleware redirects to `/(auth)/login`.
- No dedicated "unauthorized" page. The login page serves this purpose.

---

# 5. UI Components

## 5.1 AuthLayout

**Responsibility:** Wraps all authentication pages. Provides consistent structure without bottom navigation.

**Behavior:**

- Full-screen layout.
- No bottom navigation bar.
- No sidebar.
- Centers content vertically on larger screens.
- Safe area padding applied.
- Background color: `color-background` (#F8FAFC).

---

## 5.2 PhoneInput

**Responsibility:** Accepts and validates a 10-digit Indian phone number.

**Props:**

- `value: string`
- `onChange: (value: string) => void`
- `error?: string`
- `disabled?: boolean`

**Behavior:**

- Height: 48px.
- Radius: 12px.
- Numeric keyboard (`inputMode="numeric"`).
- Max length: 10 characters.
- Strips non-numeric characters automatically.
- Shows inline error below field when invalid.
- Auto focus on mount.

**States:**

- Default: 1px border (`color-border`).
- Focused: 2px border (`color-primary`).
- Error: 2px border (`color-error`).
- Disabled: Grayed out background.

---

## 5.3 CountryCodeDisplay

**Responsibility:** Displays the country code prefix next to the phone input.

**Behavior:**

- Shows "+91" (India) as the default and only supported code for MVP.
- Non-editable for MVP.
- Visually attached to the left of PhoneInput.

---

## 5.4 OTPInput

**Responsibility:** Accepts OTP digits in individual fields.

**Props:**

- `length: number` (6 for Supabase default)
- `value: string`
- `onChange: (value: string) => void`
- `error?: string`
- `disabled?: boolean`

**Behavior:**

- Individual input fields, one per digit.
- Height: 48px per field.
- Radius: 12px.
- Numeric keyboard.
- Auto focus first field on mount.
- Auto advance to next field on entry.
- Backspace moves to previous field and clears it.
- Paste support: pastes full OTP across all fields.
- Auto verify: triggers verification when all fields are filled.

**States:**

- Default: 1px border (`color-border`).
- Focused: 2px border (`color-primary`).
- Filled: Text in `color-text-primary`.
- Error: 2px border (`color-error`) on all fields.
- Disabled: Grayed out.

---

## 5.5 VerifyButton / ContinueButton

**Responsibility:** Primary CTA for authentication forms.

**Behavior:**

- Full width, sticky bottom.
- Height: 48px.
- Radius: 12px.
- Background: `color-primary` (#4F46E5).
- Disabled state: `#D1D5DB` background when form is invalid.
- Loading state: Spinner replaces label text.
- Pressed state: Scale 98%.
- Prevents double-tap (disabled during submission).

---

## 5.6 ResendTimer

**Responsibility:** Shows countdown timer before OTP resend is allowed.

**Props:**

- `seconds: number` (default: 30)
- `onComplete: () => void`

**Behavior:**

- Displays: "Resend OTP in 0:30"
- Counts down from 30 seconds.
- When timer reaches 0, shows "Resend OTP" as a tappable link.
- Tapping resend resets the timer.
- Text color: `color-text-secondary` while counting.
- Link color: `color-primary` when active.

---

## 5.7 ErrorMessage

**Responsibility:** Displays inline error messages below form fields.

**Props:**

- `message: string`

**Behavior:**

- Text size: `caption` (12px).
- Text color: `color-error` (#EF4444).
- Appears directly below the associated field.
- Animates in with a subtle fade (150ms).

---

# 6. Database

## Tables Touched

### 6.1 `auth.users` (Supabase Managed)

Supabase Auth manages this table internally.

**Reads:**

- Check if user exists by phone number (during OTP verification).
- Get user session on app load.

**Writes:**

- Supabase Auth creates user automatically on first successful OTP verification.

**Updates:**

- Supabase Auth updates session tokens on refresh.
- Last sign-in timestamp updated automatically.

**Deletes:**

- None during authentication.

---

### 6.2 `businesses`

**Reads:**

- After OTP verification, query `businesses` to check if the authenticated user has an associated business.
- This determines routing: Dashboard vs Onboarding.

**Writes:**

- None during authentication. Business creation happens in Sprint 2 (Onboarding).

**Updates:**

- None during authentication.

**Deletes:**

- None during authentication.

---

### 6.3 `users`

**Reads:**

- After OTP verification, query `users` table to find the user record linked to `auth_user_id`.
- Check `status` field (must be `active`).
- Check `role` field (owner or staff).
- Retrieve `business_id` for routing.

**Writes:**

- On first-ever login, create a `users` record linked to the `auth.users` entry.
- Set `role` to `owner` for the first user of a new business (handled in Onboarding, but the record may be seeded here).

**Updates:**

- None during authentication.

**Deletes:**

- None during authentication.

---

### 6.4 `otp_requests` (if custom OTP tracking is needed beyond Supabase)

Note: Supabase Auth handles OTP generation, delivery, and verification internally. This table is only needed if custom rate limiting or audit logging is required beyond what Supabase provides.

**Reads:**

- Check attempt count for a phone number.
- Check if OTP is expired.

**Writes:**

- Log OTP request (phone, purpose, timestamp).

**Updates:**

- Increment attempt count on failed verification.
- Set `verified_at` on successful verification.

**Deletes:**

- None. OTP records are retained for audit.

---

# 7. Server Actions

## 7.1 `sendOTP()`

**Purpose:** Send an OTP to the provided phone number.

**Input:**

```typescript
{
  phone: string; // 10-digit phone number
}
```

**Validation:**

1. Phone must be exactly 10 digits.
2. Phone must contain only numeric characters.
3. Rate limit: Maximum 5 OTP requests per phone number per 15 minutes.

**Database:**

- Calls Supabase Auth `signInWithOtp({ phone: "+91" + phone })`.
- Optionally logs to `otp_requests` table for audit.

**Output (Success):**

```typescript
{
  success: true,
  data: { phone: string }
}
```

**Output (Failure):**

```typescript
{
  success: false,
  code: "VALIDATION_FAILED" | "RATE_LIMITED" | "SERVER_ERROR",
  message: string
}
```

**Errors:**

| Error                | Code              | User Message                                          |
| -------------------- | ----------------- | ----------------------------------------------------- |
| Invalid phone format | VALIDATION_FAILED | "Enter a valid 10-digit phone number."                |
| Rate limited         | RATE_LIMITED      | "Too many requests. Please wait before trying again." |
| SMS delivery failure | SERVER_ERROR      | "Unable to send OTP. Please try again."               |
| Server error         | SERVER_ERROR      | "Something went wrong. Please try again."             |

---

## 7.2 `verifyOTP()`

**Purpose:** Verify the OTP and establish an authenticated session.

**Input:**

```typescript
{
  phone: string,  // 10-digit phone number
  otp: string     // 6-digit OTP
}
```

**Validation:**

1. Phone must be exactly 10 digits, numeric only.
2. OTP must be exactly 6 digits, numeric only.
3. OTP must not be expired (server-side check by Supabase).
4. Attempt limit must not be exceeded.

**Database:**

- Calls Supabase Auth `verifyOtp({ phone: "+91" + phone, token: otp, type: "sms" })`.
- On success, Supabase creates/returns a session with JWT.
- Query `users` table by `auth_user_id` to get user record.
- Query `businesses` table by `business_id` from user record.

**Output (Success):**

```typescript
{
  success: true,
  data: {
    user: { id: string, phone: string, role: string },
    business: { id: string, name: string } | null,
    redirectTo: "/dashboard" | "/setup"
  }
}
```

**Output (Failure):**

```typescript
{
  success: false,
  code: "INVALID_OTP" | "OTP_EXPIRED" | "TOO_MANY_ATTEMPTS" | "SERVER_ERROR",
  message: string
}
```

**Errors:**

| Error             | Code              | User Message                                          |
| ----------------- | ----------------- | ----------------------------------------------------- |
| Wrong OTP         | INVALID_OTP       | "Invalid OTP. Please try again."                      |
| OTP expired       | OTP_EXPIRED       | "OTP has expired. Please request a new one."          |
| Too many attempts | TOO_MANY_ATTEMPTS | "Too many failed attempts. Please request a new OTP." |
| User suspended    | AUTH_REQUIRED     | "Your account has been suspended. Contact support."   |
| Server error      | SERVER_ERROR      | "Something went wrong. Please try again."             |

---

## 7.3 `resendOTP()`

**Purpose:** Resend OTP to the same phone number.

**Input:**

```typescript
{
  phone: string; // 10-digit phone number
}
```

**Validation:**

1. Same as `sendOTP()`.
2. Minimum 30 seconds must have passed since last OTP was sent (enforced on client and server).

**Database:**

- Same as `sendOTP()`.

**Output:**

- Same as `sendOTP()`.

**Errors:**

- Same as `sendOTP()` plus:

| Error           | Code         | User Message                                 |
| --------------- | ------------ | -------------------------------------------- |
| Resend too soon | RATE_LIMITED | "Please wait before requesting another OTP." |

---

## 7.4 `logout()`

**Purpose:** End the current authenticated session.

**Input:**

- None (uses current session).

**Validation:**

- Must have an active session.

**Database:**

- Calls Supabase Auth `signOut()`.
- Session token is invalidated server-side.

**Output (Success):**

```typescript
{
  success: true,
  data: null
}
```

**Output (Failure):**

```typescript
{
  success: false,
  code: "SERVER_ERROR",
  message: "Unable to log out. Please try again."
}
```

**Errors:**

| Error        | Code          | User Message                           |
| ------------ | ------------- | -------------------------------------- |
| No session   | AUTH_REQUIRED | "You are not logged in."               |
| Server error | SERVER_ERROR  | "Unable to log out. Please try again." |

---

## 7.5 `validateSession()`

**Purpose:** Check if the current session is valid and retrieve user/business data.

**Input:**

- None (uses current session cookies/tokens).

**Validation:**

- JWT must be valid and not expired.
- User must exist in `users` table.
- User status must be `active`.

**Database:**

- Calls Supabase Auth `getUser()` to validate the JWT.
- Queries `users` table by `auth_user_id`.
- Queries `businesses` table by `business_id`.

**Output (Success):**

```typescript
{
  success: true,
  data: {
    user: { id: string, phone: string, role: string, businessId: string },
    business: { id: string, name: string } | null
  }
}
```

**Output (Failure):**

```typescript
{
  success: false,
  code: "AUTH_REQUIRED" | "SESSION_EXPIRED",
  message: string
}
```

**Errors:**

| Error           | Code            | User Message                       |
| --------------- | --------------- | ---------------------------------- |
| No session      | AUTH_REQUIRED   | Redirect to login (no message).    |
| Expired session | SESSION_EXPIRED | Redirect to login (no message).    |
| User suspended  | AUTH_REQUIRED   | "Your account has been suspended." |

---

# 8. Validation

## 8.1 Phone Number

| Rule              | Constraint                                    |
| ----------------- | --------------------------------------------- |
| Required          | Yes                                           |
| Format            | Numeric only                                  |
| Length            | Exactly 10 digits                             |
| Prefix            | "+91" added server-side (not entered by user) |
| Client validation | On change, disable submit until 10 digits     |
| Server validation | Zod schema validates before Supabase call     |

**Zod Schema:**

```typescript
export const phoneSchema = z.object({
  phone: z
    .string()
    .min(10, "Phone number must be 10 digits")
    .max(10, "Phone number must be 10 digits")
    .regex(/^\d{10}$/, "Enter a valid 10-digit phone number"),
});
```

---

## 8.2 OTP

| Rule              | Constraint                                       |
| ----------------- | ------------------------------------------------ |
| Required          | Yes                                              |
| Format            | Numeric only                                     |
| Length            | 6 digits (Supabase default)                      |
| Client validation | Enable verify button only when all digits filled |
| Server validation | Supabase verifies OTP validity                   |

**Zod Schema:**

```typescript
export const otpSchema = z.object({
  phone: z.string().regex(/^\d{10}$/),
  otp: z
    .string()
    .length(6, "OTP must be 6 digits")
    .regex(/^\d{6}$/, "OTP must contain only numbers"),
});
```

---

## 8.3 OTP Expiry

| Rule        | Constraint                                     |
| ----------- | ---------------------------------------------- |
| Duration    | Managed by Supabase (default: 60 seconds)      |
| Enforcement | Server-side only                               |
| Client hint | Resend timer (30 seconds) provides UX guidance |

---

## 8.4 OTP Attempts

| Rule             | Constraint                                            |
| ---------------- | ----------------------------------------------------- |
| Maximum attempts | 5 invalid OTP attempts per OTP request                |
| Enforcement      | Server-side (Supabase + custom tracking)              |
| Recovery         | Request a new OTP                                     |
| Lockout          | After 5 failed attempts, must wait or request new OTP |

---

## 8.5 Business Exists Check

| Rule           | Constraint                                                               |
| -------------- | ------------------------------------------------------------------------ |
| When           | After successful OTP verification                                        |
| Query          | `users` table by `auth_user_id` → get `business_id` → query `businesses` |
| Business found | Route to Dashboard                                                       |
| No business    | Route to Onboarding                                                      |

---

## 8.6 User Status Check

| Rule      | Constraint                                      |
| --------- | ----------------------------------------------- |
| Active    | Allow login                                     |
| Pending   | Allow login (first-time user, needs onboarding) |
| Suspended | Block login, show error                         |
| Removed   | Block login, show error                         |

---

## 8.7 Session Validation

| Rule        | Constraint                                   |
| ----------- | -------------------------------------------- |
| Method      | Supabase JWT validation                      |
| Refresh     | Supabase handles token refresh automatically |
| Expiry      | Supabase default session duration            |
| Enforcement | Next.js middleware on every protected route  |

---

# 9. Security

## 9.1 OTP Expiry

- OTP expires after the Supabase-configured duration (default: 60 seconds).
- Expired OTPs are rejected server-side.
- Client cannot bypass expiry.

## 9.2 Attempt Limits

- Maximum 5 failed OTP verification attempts per OTP request.
- After 5 failures, the OTP is invalidated.
- User must request a new OTP.

## 9.3 Rate Limiting

- Maximum 5 OTP requests per phone number per 15 minutes (from `08_API_Design.md`).
- Maximum 5 invalid OTP attempts per request (from `08_API_Design.md`).
- Rate limiting enforced server-side.
- Client-side resend cooldown (30 seconds) provides UX protection but is not the security boundary.

## 9.4 Replay Protection

- Each OTP is valid for a single use only.
- Once verified, the OTP cannot be reused.
- Supabase handles this automatically.

## 9.5 Session Security

- Sessions use JWTs issued by Supabase Auth.
- Tokens are stored in HTTP-only cookies (Supabase SSR pattern).
- Tokens are refreshed automatically before expiry.
- One active session per user (from `00_Founder_Decisions.md`).
- Logging in on a new device invalidates the previous session.

## 9.6 Server Validation

- Never trust client input.
- All phone numbers validated with Zod on the server before any database call.
- All OTPs validated with Zod on the server before Supabase verification.
- Server Actions are the only entry point for authentication operations.

## 9.7 Secret Protection

- `SUPABASE_SERVICE_ROLE_KEY` is never exposed to the client.
- Only `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are available in the browser.
- OTP values are never logged, stored in plain text, or returned to the client.

---

# 10. State Management

## 10.1 Server State (TanStack Query)

| Query   | Key           | Purpose                                |
| ------- | ------------- | -------------------------------------- |
| Session | `['session']` | Current user session and business data |

Used for:

- Checking session on app load.
- Refetching session after OTP verification.
- Invalidating session on logout.

---

## 10.2 Client State (Zustand)

No Zustand store is needed for authentication.

Authentication state is fully managed by:

- Supabase Auth (session tokens).
- TanStack Query (session cache).
- React Hook Form (form state).

Zustand is reserved for the billing session (Sprint 4) and UI state.

---

## 10.3 Local State (useState / React Hook Form)

| State        | Location        | Purpose                    |
| ------------ | --------------- | -------------------------- |
| Phone number | React Hook Form | Login form input           |
| OTP digits   | React Hook Form | OTP form input             |
| Resend timer | useState        | Countdown seconds          |
| isSubmitting | React Hook Form | Loading state for buttons  |
| Form errors  | React Hook Form | Inline validation messages |

---

## 10.4 React Hook Form Usage

**Login Form:**

```typescript
const form = useForm<PhoneInput>({
  resolver: zodResolver(phoneSchema),
  defaultValues: { phone: "" },
});
```

**OTP Form:**

```typescript
const form = useForm<OTPInput>({
  resolver: zodResolver(otpSchema),
  defaultValues: { phone: phoneFromRoute, otp: "" },
});
```

---

## 10.5 TanStack Query Usage

**Session Query:**

```typescript
export function useSession() {
  return useQuery({
    queryKey: ["session"],
    queryFn: () => validateSession(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false,
  });
}
```

**Invalidation on Login/Logout:**

```typescript
const queryClient = useQueryClient();
queryClient.invalidateQueries({ queryKey: ["session"] });
```

---

# 11. Error States

## 11.1 Invalid Phone Number

**User Message:** "Enter a valid 10-digit phone number."

**Display:** Inline error below phone input.

**Recovery:** User corrects the phone number and resubmits.

---

## 11.2 Invalid OTP

**User Message:** "Invalid OTP. Please try again."

**Display:** Inline error below OTP input.

**Recovery:** OTP fields are cleared. Auto focus on first field. User enters correct OTP.

---

## 11.3 Expired OTP

**User Message:** "OTP has expired. Please request a new one."

**Display:** Inline error below OTP input.

**Recovery:** "Resend OTP" link becomes immediately active. User requests a new OTP.

---

## 11.4 Too Many Attempts

**User Message:** "Too many failed attempts. Please request a new OTP."

**Display:** Inline error below OTP input.

**Recovery:** User taps "Resend OTP" to get a new OTP. Previous OTP is invalidated.

---

## 11.5 Rate Limited

**User Message:** "Too many requests. Please wait before trying again."

**Display:** Inline error below phone input (login page) or below OTP input (verify page).

**Recovery:** User waits for the rate limit window to pass (15 minutes).

---

## 11.6 Network Error

**User Message:** "Unable to connect. Please check your internet connection."

**Display:** Toast notification.

**Recovery:** User checks connection and retries.

---

## 11.7 Server Error

**User Message:** "Something went wrong. Please try again."

**Display:** Toast notification.

**Recovery:** User retries the action.

---

## 11.8 Session Expired

**User Message:** None (silent redirect).

**Display:** User is redirected to login page.

**Recovery:** User logs in again.

---

## 11.9 Account Suspended

**User Message:** "Your account has been suspended. Contact support."

**Display:** Inline error on OTP verification page.

**Recovery:** User contacts support.

---

# 12. Loading States

## 12.1 Sending OTP

**Trigger:** User taps "Continue" on login page.

**UI:**

- Continue button label replaced with spinner.
- Phone input becomes disabled.
- Duration: Until server responds.

---

## 12.2 Verifying OTP

**Trigger:** User enters last OTP digit (auto verify) or taps "Verify."

**UI:**

- Verify button label replaced with spinner.
- OTP inputs become disabled.
- Duration: Until server responds.

---

## 12.3 Resending OTP

**Trigger:** User taps "Resend OTP."

**UI:**

- "Resend OTP" text replaced with "Sending..."
- Duration: Until server responds.
- On success: Timer resets to 30 seconds.

---

## 12.4 Checking Session (App Load)

**Trigger:** App loads or user navigates to a protected route.

**UI:**

- Full-screen skeleton or blank screen with app logo.
- Duration: Until session validation completes.
- This is handled by middleware, so the user typically sees the destination page loading state.

---

# 13. Edge Cases

## 13.1 Back Button on Verify Page

- Navigates back to Login page.
- Phone number field retains the previously entered value.
- OTP inputs are cleared.
- Resend timer is reset.

## 13.2 Double Tap — Verify Button

- Button is disabled immediately on first tap.
- Subsequent taps are ignored while `isSubmitting` is true.
- Prevents duplicate verification requests.

## 13.3 Double Tap — Continue Button (Send OTP)

- Button is disabled immediately on first tap.
- Prevents duplicate OTP sends.

## 13.4 Paste OTP

- Full OTP string pasted into any field distributes digits across all fields.
- Auto verify triggers after paste if all fields are filled.

## 13.5 Auto Verify

- When the last OTP digit is entered, verification triggers automatically.
- No need to tap "Verify" button.
- Verify button remains as a fallback for users who prefer manual submission.

## 13.6 Offline

- Detect network status.
- Show toast: "You are offline. Please check your connection."
- Disable form submission while offline.
- Re-enable when connection is restored.

## 13.7 Slow Network

- Loading states remain visible until server responds.
- No client-side timeout. Let the browser/fetch handle timeouts.
- If server does not respond, show network error.

## 13.8 Page Refresh on Verify Page

- If the user refreshes the OTP verification page:
  - If phone number is passed via URL query parameter: retain it, show the OTP form.
  - If phone number is lost (route state only): redirect back to login page.
- Recommendation: Pass phone number as an encrypted/encoded query parameter.

## 13.9 Session Expires While Using App

- Middleware checks session on every navigation.
- If a Server Action detects an expired session, it returns `AUTH_REQUIRED`.
- Client handles `AUTH_REQUIRED` by redirecting to login.
- No abrupt error. Clean redirect.

## 13.10 Multiple Devices

- From `00_Founder_Decisions.md`: One active device per user.
- Logging in on Device B invalidates the session on Device A.
- Device A discovers the invalid session on next navigation or API call.
- Device A is redirected to login.

## 13.11 Browser Tab Visibility

- When the tab becomes visible after being hidden, revalidate session.
- Use `visibilitychange` event + TanStack Query `refetchOnWindowFocus`.

## 13.12 Invalid Route Access Without Session

- Middleware redirects to `/(auth)/login`.
- No error message shown. Login page is the default unauthenticated destination.

---

# 14. Tasks

## Developer Checklist

### Authentication UI

- [ ] Create `AuthLayout` component (no bottom navigation).
- [ ] Create Login page (`/(auth)/login/page.tsx`).
- [ ] Create OTP Verification page (`/(auth)/verify/page.tsx`).
- [ ] Create `PhoneInput` component with country code display.
- [ ] Create `OTPInput` component with auto-advance and paste support.
- [ ] Create `ResendTimer` component with 30-second countdown.
- [ ] Implement sticky bottom CTA pattern for both pages.
- [ ] Implement all loading states (spinner buttons).
- [ ] Implement all error states (inline errors, toasts).

### Server Actions

- [ ] Implement `sendOTP()` server action.
- [ ] Implement `verifyOTP()` server action.
- [ ] Implement `resendOTP()` server action.
- [ ] Implement `logout()` server action.
- [ ] Implement `validateSession()` server action.

### Supabase Auth

- [ ] Configure Supabase Phone Auth provider.
- [ ] Configure SMS provider in Supabase dashboard.
- [ ] Create Supabase browser client (`lib/supabase/client.ts`).
- [ ] Create Supabase server client (`lib/supabase/server.ts`).
- [ ] Configure Supabase Auth middleware helper.

### Validation

- [ ] Create `phoneSchema` (Zod).
- [ ] Create `otpSchema` (Zod).
- [ ] Integrate schemas with React Hook Form (zodResolver).
- [ ] Implement server-side validation in all Server Actions.

### Session Management

- [ ] Implement Next.js middleware for route protection.
- [ ] Configure protected routes (all routes except `/(auth)/*`).
- [ ] Implement session restoration on app load.
- [ ] Implement redirect logic (Dashboard vs Onboarding).
- [ ] Implement session invalidation on logout.

### Route Protection

- [ ] Auth routes redirect to dashboard if already logged in.
- [ ] Protected routes redirect to login if not authenticated.
- [ ] Onboarding routes accessible only for users without a business.

### Error Handling

- [ ] Handle all error codes from Server Actions.
- [ ] Map error codes to user-friendly messages.
- [ ] Implement toast notifications for global errors.
- [ ] Implement inline errors for form validation.

### Edge Cases

- [ ] Handle double-tap prevention on all buttons.
- [ ] Handle OTP paste.
- [ ] Handle OTP auto-verify.
- [ ] Handle back button navigation.
- [ ] Handle page refresh on verify page.
- [ ] Handle offline detection.

---

# 15. Acceptance Criteria

Every item must pass for Sprint 1 to be considered complete.

### Login

- [ ] User can enter a 10-digit phone number.
- [ ] Phone input shows numeric keyboard on mobile.
- [ ] Phone input auto focuses on page load.
- [ ] Continue button is disabled until 10 digits are entered.
- [ ] Invalid phone number shows inline error message.
- [ ] Tapping Continue sends an OTP to the phone number.
- [ ] Loading spinner appears on Continue button during OTP send.

### OTP Verification

- [ ] OTP page displays the phone number the OTP was sent to.
- [ ] OTP input auto focuses on the first field.
- [ ] Entering a digit auto advances to the next field.
- [ ] Backspace moves to the previous field.
- [ ] Full OTP can be pasted into any field.
- [ ] Auto verify triggers when the last digit is entered.
- [ ] Invalid OTP shows inline error and clears fields.
- [ ] Expired OTP shows inline error and activates resend link.
- [ ] Too many failed attempts shows error and requires resend.

### OTP Resend

- [ ] Resend OTP is disabled for 30 seconds after sending.
- [ ] Countdown timer displays remaining seconds.
- [ ] After timer expires, "Resend OTP" becomes tappable.
- [ ] Tapping resend sends a new OTP and resets timer.

### Session

- [ ] Successful OTP verification creates a persistent session.
- [ ] Session survives page refresh.
- [ ] Session survives browser close and reopen.
- [ ] Returning user with valid session goes directly to Dashboard.
- [ ] Returning user with valid session skips login entirely.

### Routing

- [ ] User with existing business is routed to Dashboard after login.
- [ ] User without a business is routed to Onboarding after login.
- [ ] Unauthenticated user accessing a protected route is redirected to Login.
- [ ] Authenticated user accessing login page is redirected to Dashboard.

### Logout

- [ ] User can log out from the More screen.
- [ ] Logout clears the session.
- [ ] After logout, user is redirected to Login page.
- [ ] After logout, protected routes are no longer accessible.

### Security

- [ ] OTP expires after the configured duration.
- [ ] Maximum 5 failed OTP attempts before requiring a new OTP.
- [ ] Maximum 5 OTP requests per phone per 15 minutes.
- [ ] Service role key is never exposed to the browser.
- [ ] All inputs are validated server-side with Zod.

### Error Handling

- [ ] Network errors show a toast message.
- [ ] Server errors show a toast message.
- [ ] Form validation errors show inline messages.
- [ ] Suspended accounts show an appropriate error.

### Performance

- [ ] Login to Dashboard completes in ≤ 5 seconds (excluding OTP delivery time).
- [ ] No full-screen spinners. Loading states are localized to buttons.

---

# 16. Definition of Done

## Build

- [ ] `npm run build` — no errors.
- [ ] `npx tsc --noEmit` — no TypeScript errors.
- [ ] `npm run lint` — no warnings.

## Responsive

- [ ] Login page renders correctly on 360px–430px viewports.
- [ ] OTP page renders correctly on 360px–430px viewports.
- [ ] Touch targets ≥ 48×48px.
- [ ] Sticky CTA visible and reachable.

## Accessibility

- [ ] WCAG AA contrast ratios on all text.
- [ ] Semantic HTML (`form`, `label`, `input`, `button`).
- [ ] `aria-label` on icon-only elements.
- [ ] Visible focus states on all interactive elements.
- [ ] `prefers-reduced-motion` respected (no animations if user prefers).
- [ ] Screen reader announces errors.

## Security

- [ ] Server validates all inputs.
- [ ] No secrets exposed to browser.
- [ ] Rate limiting enforced.
- [ ] OTP expiry enforced.

## PRD Compliance

- [ ] Authentication method is Phone + OTP only (no passwords).
- [ ] Session persists.
- [ ] One active device.
- [ ] Flow matches `00_Founder_Decisions.md` exactly.

## UI Specification Compliance

- [ ] Design tokens from `09_UI_UX_Specification.md` used for all colors, spacing, typography, and radius.
- [ ] Bottom navigation hidden during auth.
- [ ] Template C (Form Entry) used for both pages.
- [ ] Inter font loaded and applied.

---

# 17. File Structure

Every file that Sprint 1 creates:

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx                    # Login page
│   │   ├── verify/
│   │   │   └── page.tsx                    # OTP verification page
│   │   └── layout.tsx                      # Auth layout (no bottom nav)
│   ├── layout.tsx                          # Root layout (fonts, providers)
│   ├── loading.tsx                         # Root loading state
│   └── globals.css                         # Tailwind + design token CSS
│
├── components/
│   └── ui/
│       ├── button.tsx                      # shadcn/ui Button
│       ├── input.tsx                       # shadcn/ui Input
│       ├── toast.tsx                       # shadcn/ui Toast / Sonner
│       └── otp-input.tsx                   # Custom OTP input component
│
├── features/
│   └── auth/
│       ├── components/
│       │   ├── login-form.tsx              # Phone number form
│       │   ├── otp-form.tsx               # OTP verification form
│       │   ├── phone-input.tsx             # Phone input with country code
│       │   ├── resend-timer.tsx            # OTP resend countdown
│       │   └── auth-layout.tsx             # Auth page wrapper
│       ├── actions/
│       │   ├── send-otp.ts                # sendOTP server action
│       │   ├── verify-otp.ts              # verifyOTP server action
│       │   ├── resend-otp.ts              # resendOTP server action
│       │   ├── logout.ts                  # logout server action
│       │   └── validate-session.ts        # validateSession server action
│       ├── hooks/
│       │   ├── use-session.ts             # TanStack Query session hook
│       │   └── use-resend-timer.ts        # Resend countdown hook
│       ├── schemas/
│       │   ├── phone-schema.ts            # Phone validation schema
│       │   └── otp-schema.ts              # OTP validation schema
│       ├── types/
│       │   └── auth-types.ts              # Auth-related types
│       ├── stores/                         # Empty (no Zustand needed)
│       ├── services/                       # Empty (logic in actions)
│       ├── utils/                          # Empty
│       ├── constants/
│       │   └── auth-constants.ts          # OTP length, timer duration, etc.
│       └── index.ts                        # Public exports
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts                      # Browser Supabase client
│   │   ├── server.ts                      # Server Supabase client
│   │   └── middleware.ts                  # Supabase auth middleware helper
│   ├── api/
│   │   └── result.ts                      # ActionResult type definition
│   └── utils.ts                           # cn() utility
│
├── types/
│   └── common.ts                          # Shared types (if needed)
│
├── constants/
│   ├── routes.ts                          # Route path constants
│   └── messages.ts                        # User-facing message strings
│
middleware.ts                               # Next.js middleware (auth guard)
tailwind.config.ts                         # Design tokens configuration
components.json                            # shadcn/ui configuration
```

---

# 18. Dependencies

| Package                       | Purpose                                                        |
| ----------------------------- | -------------------------------------------------------------- |
| `next`                        | Framework. App Router, Server Actions, middleware.             |
| `react` / `react-dom`         | UI rendering.                                                  |
| `typescript`                  | Type safety. Strict mode.                                      |
| `tailwindcss`                 | Styling via utility classes. Design tokens.                    |
| `@supabase/supabase-js`       | Supabase client. Auth, database queries.                       |
| `@supabase/ssr`               | Supabase server-side rendering helpers. Cookie-based auth.     |
| `zod`                         | Schema validation for phone and OTP inputs. Client and server. |
| `react-hook-form`             | Form state management. Login and OTP forms.                    |
| `@hookform/resolvers`         | Connects Zod schemas to React Hook Form.                       |
| `@tanstack/react-query`       | Server state management. Session caching and revalidation.     |
| `zustand`                     | Installed but not used in Sprint 1. Reserved for Sprint 4.     |
| `lucide-react`                | Icons. Back arrow, phone icon, spinner.                        |
| `sonner` or `react-hot-toast` | Toast notifications for global errors.                         |
| `clsx` / `tailwind-merge`     | Utility for conditional class names (`cn()`).                  |

---

# 19. Testing Checklist

Manual QA checklist for Sprint 1.

### Phone Validation

- [ ] Empty phone number → Continue button disabled.
- [ ] Less than 10 digits → Continue button disabled.
- [ ] Exactly 10 digits → Continue button enabled.
- [ ] Non-numeric characters → stripped or rejected.
- [ ] 10 digits entered → can submit.

### OTP Validation

- [ ] OTP input shows numeric keyboard.
- [ ] Each digit auto advances to next field.
- [ ] Backspace clears current and moves to previous.
- [ ] Full OTP paste works correctly.
- [ ] Auto verify triggers on last digit entry.
- [ ] Wrong OTP → error message, fields cleared.
- [ ] Expired OTP → error message, resend available.

### Session Restore

- [ ] Close browser, reopen → still logged in.
- [ ] Refresh page → still logged in.
- [ ] Navigate directly to /dashboard → stays on dashboard.
- [ ] Clear cookies → redirected to login.

### Logout

- [ ] Logout clears session.
- [ ] After logout, /dashboard redirects to login.
- [ ] After logout, /login is accessible.

### Route Protection

- [ ] /dashboard without session → redirected to /login.
- [ ] /login with valid session → redirected to /dashboard.
- [ ] /verify without phone context → redirected to /login.

### Error Messages

- [ ] Invalid phone → inline error appears.
- [ ] Invalid OTP → inline error appears.
- [ ] Network error → toast appears.
- [ ] Server error → toast appears.
- [ ] Rate limited → appropriate message shown.

### Responsive Behavior

- [ ] Login page looks correct at 360px width.
- [ ] Login page looks correct at 430px width.
- [ ] OTP page looks correct at 360px width.
- [ ] OTP page looks correct at 430px width.
- [ ] Touch targets are at least 48×48px.

### Keyboard Behavior

- [ ] Phone input opens numeric keyboard on mobile.
- [ ] OTP input opens numeric keyboard on mobile.
- [ ] Keyboard does not cover the submit button (sticky CTA above keyboard).
- [ ] Enter key submits the form.

### Loading States

- [ ] Continue button shows spinner while sending OTP.
- [ ] Verify button shows spinner while verifying OTP.
- [ ] Input fields are disabled during submission.
- [ ] Resend shows "Sending..." while resending.

### Accessibility

- [ ] Tab key navigates between fields.
- [ ] Focus ring visible on all interactive elements.
- [ ] Screen reader reads form labels.
- [ ] Screen reader announces errors.
- [ ] `prefers-reduced-motion` disables animations.

---

# 20. Sprint Summary

## What Sprint 1 Delivers

- Complete phone + OTP authentication flow.
- Login page with phone input.
- OTP verification page with auto-verify.
- Session management with persistence.
- Route protection via Next.js middleware.
- Redirect logic (existing business → Dashboard, new user → Onboarding).
- Logout functionality.
- All error states, loading states, and edge cases handled.
- Supabase Auth integration.
- Zod validation schemas.
- React Hook Form integration.
- TanStack Query session management.

## What Sprint 2 Depends On

Sprint 2 (Onboarding) requires:

- Authenticated user session (from Sprint 1).
- `validateSession()` action (from Sprint 1).
- Auth middleware (from Sprint 1).
- Redirect to Onboarding for users without a business (from Sprint 1).
- Supabase client utilities (from Sprint 1).
- `ActionResult` type (from Sprint 1).
- Design token configuration (from Sprint 1).
- Base UI components: Button, Input, Toast (from Sprint 1).

## Expected Completion Outcome

After Sprint 1 is complete:

- A salon owner can open RewardLoop, enter their phone number, receive an OTP, verify it, and be routed to the correct destination.
- The session persists. Returning users skip login entirely.
- Unauthorized access is blocked. Protected routes require authentication.
- The foundation is set for every subsequent sprint.

---

# 21. Screen-to-API Mapping

| Screen        | User Action               | Server Action       | Success                       | Failure                    |
| ------------- | ------------------------- | ------------------- | ----------------------------- | -------------------------- |
| Login         | Enter Phone & Continue    | `sendOTP()`         | Navigate to OTP Screen        | Show inline error or toast |
| OTP Screen    | Auto-Verify or Tap Verify | `verifyOTP()`       | Route to Dashboard/Onboarding | Show inline error          |
| OTP Screen    | Tap Resend                | `resendOTP()`       | Reset Timer, New OTP sent     | Show rate limit error      |
| More Screen   | Tap Logout                | `logout()`          | Clear session, Route to Login | Show toast error           |
| Any Protected | Load Page                 | `validateSession()` | Allow navigation              | Route to Login             |

---

# 22. Component Hierarchy

**Login Page**
├── AuthLayout
├── AppBar (Logo only)
├── PhoneInput
│ └── CountryCodeDisplay
├── ErrorMessage (Inline)
└── ContinueButton (Sticky)

**OTP Page**
├── AuthLayout
├── AppBar (Back button)
├── Phone Number Display
├── OTPInput
├── ErrorMessage (Inline)
├── VerifyButton (Sticky)
└── ResendTimer

---

# 23. Route Protection

**Public**

- `/auth/login`
- `/auth/verify`

**Protected**

- `/dashboard`
- `/visit`
- `/transactions`
- `/insights`
- `/more`
- `/settings`

**Middleware Behavior:**

- Valid session on protected route → Allow access.
- Valid session on public route (auth) → Redirect to `/dashboard`.
- Invalid/No session on protected route → Redirect to `/auth/login`.

---

# 24. Authentication State Machine

```text
Unauthenticated
    │
    ▼
Phone Entered
    │
    ▼
OTP Sent
    │
    ▼
OTP Verified
    │
    ▼
Authenticated
    │
    ├── Business Exists? ── Yes ──▶ Dashboard
    │
    └── Business Exists? ── No ───▶ Onboarding
```

**Failure Transitions:**

- Phone Entered → Validation Fails → Show Error (State: Unauthenticated)
- OTP Sent → Network Error → Show Toast (State: Unauthenticated)
- OTP Verified → Wrong OTP → Show Error (State: OTP Sent)
- OTP Verified → Expired OTP → Show Error, Enable Resend (State: OTP Sent)
- OTP Verified → Max Attempts Reached → Show Error (State: Blocked Temporarily)

---

# 25. Sequence Diagram

```text
User            Next.js UI           Server Action          Supabase Auth
 │                  │                      │                      │
 ├─ Enter Phone ───▶│                      │                      │
 │                  ├─ sendOTP() ─────────▶│                      │
 │                  │                      ├─ signInWithOtp() ───▶│
 │                  │                      │◀───── Success ───────┤
 │                  │◀───── Success ───────┤                      │
 │◀─── Show OTP ────┤                      │                      │
 │    Screen        │                      │                      │
 │                  │                      │                      │
 ├─ Enter OTP ─────▶│                      │                      │
 │                  ├─ verifyOTP() ───────▶│                      │
 │                  │                      ├─ verifyOtp() ───────▶│
 │                  │                      │◀── Valid Session ────┤
 │                  │◀── Returns User ─────┤                      │
 │                  │    & Business ID     │                      │
 │◀── Redirect ─────┤                      │                      │
```

---

# 26. Performance Targets

- **Send OTP:** < 2 sec
- **Verify OTP:** < 2 sec
- **Redirect:** < 500 ms
- **Session Restore:** < 1 sec

---

# 27. Analytics Events

- `login_started`
- `otp_sent`
- `otp_verified`
- `login_success`
- `login_failed`
- `logout`
- `session_expired`

_(Note: Do not implement analytics. Only reserved for future use.)_

---

# 28. Feature Flags

**Future Flags:**

- WhatsApp OTP
- Biometric Login
- Remember Device
- Magic Link

_(Note: Do not build. Only reserve.)_

---

# 29. Risks

- **SMS delivery delays:** Mitigated by 30-second resend timer and clear UX messaging.
- **OTP abuse:** Mitigated by server-side rate limiting (max 5 requests / 15 mins).
- **Network failures:** Mitigated by robust error handling and toast notifications.
- **Expired sessions:** Mitigated by middleware gracefully redirecting to login.
- **Rate limiting lockout:** Ensure error messaging clearly communicates wait times.

---

# 30. Sprint Exit Criteria

**Sprint 1 is complete only if:**

- [ ] Authentication works.
- [ ] Returning users go to Dashboard.
- [ ] New users go to Onboarding.
- [ ] OTP security works.
- [ ] Session restore works.
- [ ] Middleware protects routes.
- [ ] Build passes.
- [ ] TypeScript passes.
- [ ] ESLint passes.
- [ ] Responsive verified.
- [ ] Accessibility verified.
- [ ] All acceptance criteria pass.

---

# 31. Implementation Order

**Phase 1 — Project Setup**

- Install dependencies
- Configure environment variables
- Configure Supabase
- Configure Tailwind
- Configure shadcn/ui

↓

**Phase 2 — Foundation Components**

- AuthLayout
- PhoneInput
- OTPInput
- ResendTimer
- ErrorMessage

↓

**Phase 3 — Pages**

- Login
- OTP Verification

↓

**Phase 4 — Server Actions**

- sendOTP()
- verifyOTP()
- resendOTP()
- logout()
- validateSession()

↓

**Phase 5 — Middleware**

- Route protection
- Session validation
- Redirect rules

↓

**Phase 6 — Session Management**

- Restore session
- Logout
- Query invalidation

↓

**Phase 7 — Error Handling**

- Inline validation
- Toasts
- Network errors
- Server errors

↓

**Phase 8 — Manual QA**

- Acceptance Criteria
- Responsive testing
- Accessibility testing

_Why this order?_ Building foundations before features ensures that components and utilities are available when the pages and actions are wired up, minimizing complex cross-dependencies and mock implementations.

---

# 32. Dependency Graph

**Feature Dependencies:**

```text
Environment Variables
        ↓
Supabase Client
        ↓
Server Actions
        ↓
Authentication Components
        ↓
Pages
        ↓
Middleware
        ↓
Session Management
        ↓
Protected Routes
```

_Explanation:_

- Server Actions depend on the Supabase Client (which depends on Env Vars).
- UI Components depend on the Actions.
- Pages depend on Components and Actions.
- Middleware and Session Management wrap and protect the Pages, establishing the gateway for all Protected Routes.

---

# 33. Sprint Ownership

**Sprint 1 Owns:**

- Authentication Pages
- Authentication Components
- Authentication Server Actions
- Supabase Authentication Configuration
- Middleware
- Session Management
- Validation Schemas
- Route Protection

_Strict Rule:_ No other sprint should modify these files unless absolutely necessary to support new feature routing. Authentication is a locked foundation.

---

# 34. Out of Scope Protection

**Sprint 1 must NOT modify:**

- Dashboard
- Onboarding
- Catalog
- Reward Rules
- Billing
- Transactions
- Insights
- Staff
- Settings
- Notifications
- Business Settings

_These modules belong strictly to future sprints._

---

# 35. Sprint Success Definition

**From the user's perspective:**

_A first-time business owner should be able to:_
Open RewardLoop → Enter phone number → Receive OTP → Verify OTP → Reach Onboarding

_A returning owner should be able to:_
Open RewardLoop → Automatically restore session → Reach Dashboard → Continue working without logging in again

_Logging out should completely clear the session and return to Login._

---

# 36. Engineering Review Checklist

**Before Sprint 1 is marked complete, verify:**

- [ ] Build passes
- [ ] TypeScript passes
- [ ] ESLint passes
- [ ] No `console.log` in production
- [ ] No duplicated code
- [ ] No hardcoded strings
- [ ] Responsive verified
- [ ] Accessibility verified
- [ ] Security verified
- [ ] Supabase authentication verified
- [ ] Route protection verified
- [ ] Session restoration verified
- [ ] All Acceptance Criteria verified
- [ ] Definition of Done completed

---

# 37. AI Implementation Rules

**Every AI-generated implementation must:**

- Follow `Development/00_Project_Setup.md`.
- Follow `09_UI_UX_Specification.md`.
- Follow API contracts exactly.
- Follow Founder Decisions exactly.
- Never invent business rules.
- Never change authentication flow.
- Never bypass Server Actions.
- Never duplicate validation logic.
- Never bypass Zod validation.
- Reuse existing components.
- Compose from shadcn/ui instead of rewriting components.
- Maintain strict TypeScript.
- Do not use the `any` type.
- Prefer Server Components unless client state is required.

---

# 38. Version History

| Version | Status  | Changes                                                                                              |
| ------- | ------- | ---------------------------------------------------------------------------------------------------- |
| 1.0     | Initial | Initial sprint document                                                                              |
| 1.1     | Updated | Added state machine, mappings, risks, analytics, performance                                         |
| 1.2     | Current | Added implementation order, ownership, dependency graph, engineering review, AI implementation rules |

---

# Document Status

✅ Ready for Development

This document is the complete implementation specification for the RewardLoop Authentication module (Sprint 1). Every decision is grounded in the approved planning documents. No business rules have been invented. An AI coding agent or developer can build the entire authentication system from this document alone.
