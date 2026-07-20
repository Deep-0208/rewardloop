# 08_PWA_Offline.md

> **Project:** RewardLoop
>
> **Sprint:** 8
>
> **Feature:** PWA & Offline
>
> **Version:** 1.0
>
> **Status:** Ready for Development
>
> **Purpose:** Provide a reliable app-like experience for salon owners. RewardLoop must continue working gracefully during unstable internet. The application should behave like a native mobile application.
>
> **Depends on:** 00_Founder_Decisions.md, 03_Product_PRD.md, 04_Domain_Model.md, 05_System_Architecture.md, 06_Database_Design.md, 07_Application_Architecture.md, 08_API_Design.md, 09_UI_UX_Specification.md, Development/00_Project_Setup.md, Development/01_Authentication.md, Development/02_Onboarding.md, Development/03_Dashboard.md, Development/04.1_Customer_Selection.md, Development/04.2_Billing_Engine.md, Development/04.3_Catalog_Selection.md, Development/04.4_Reward_Redemption.md, Development/04.5_Complete_Visit.md, Development/05_Transactions.md, Development/06_Insights.md, Development/07_More_Settings.md

---

# Table of Contents

1. Sprint Goal
2. Scope
3. User Flow
4. Pages
5. UI Components
6. App Manifest
7. Service Worker
8. Cache Strategy
9. Offline Behaviour
10. Network Detection
11. Background Sync
12. Update Strategy
13. Storage Strategy
14. Component Hierarchy
15. State Management
16. State Machine
17. Error States
18. Loading States
19. Edge Cases
20. Security
21. Performance Targets
22. Acceptance Criteria
23. File Structure
24. Dependencies
25. Implementation Order
26. Sprint Ownership
27. Out of Scope
28. PWA Invariants
29. Offline Architecture
30. Cache Strategy Matrix
31. Version History

---

# 1. Sprint Goal

The objective of Sprint 8 is to deliver a seamless PWA experience.
Business owners should be able to:

Install RewardLoop
↓
Launch instantly
↓
Browse cached data
↓
Detect network status
↓
Recover automatically
↓
Receive updates safely
↓
Continue business with minimal disruption

---

# 2. Scope

## Included

- Progressive Web App setup (Manifest, Icons)
- Install Prompt (A2HS - Add to Home Screen)
- Service Worker registration & lifecycle
- Offline UI (Banners, full-page fallbacks)
- Cache Strategy (Network First, Cache First)
- Network Detection (Online/Offline listeners)
- Background Sync (For future retry queues)
- Cache Invalidation & Update Flow
- Storage Strategy (IndexedDB / Cache API)
- Offline Screens

## Future Ready

- Push Notifications
- Background Fetch
- Scheduled Sync
- Native Wrapper (Capacitor/React Native)

## Not Included

- Offline Billing (unless previously approved)
- Offline OTP (Requires server confirmation)
- Offline Authentication
- Offline Transaction Commit (No local-first database sync for MVP)

---

# 3. User Flow

The fundamental lifecycle of PWA interception:

```text
Open App
↓
Service Worker intercepts request
↓
Network Available?
├── Yes
│   ↓
│   Fetch Fresh Data
│   ↓
│   Update Cache
│   ↓
│   Use App
│
└── No
    ↓
    Load from Cache
    ↓
    Show Offline Banner
    ↓
    Retry Automatically (when network fires 'online')
```

---

# 4. Pages

## 4.1 Install Prompt

- **Purpose:** Educate users on how to install the app to their home screen.
- **Components:** InstallBanner, PWA Instructions (iOS/Android specific).

## 4.2 Offline Screen

- **Purpose:** Full-page fallback when the user hard-refreshes on a non-cached route without internet.
- **Components:** Network Error Illustration, RetryButton.

## 4.3 Update Available / Updating

- **Purpose:** Prompts the user to refresh the app to load new Service Worker assets.
- **Components:** UpdateDialog.

## 4.4 Network Error

- **Purpose:** Contextual loading failure (e.g., trying to complete a visit while offline).
- **Components:** ErrorBanner, RetryButton.

---

# 5. UI Components

### 5.1 InstallBanner

- **Purpose:** Floating banner encouraging home screen installation.
- **Props:** `onDismiss`, `onInstall`.

### 5.2 OfflineBanner

- **Purpose:** Persistent red/orange header indicating "You are offline. Viewing cached data."

### 5.3 OnlineBanner

- **Purpose:** Temporary green toast "Back online" when network recovers.

### 5.4 UpdateDialog

- **Purpose:** Modal prompting user to reload for a new version.
- **Behavior:** Triggers `skipWaiting()` on the Service Worker.

### 5.5 ConnectionStatus

- **Purpose:** Tiny dot indicator (green/red) in the app header (optional).

### 5.6 RetryButton

- **Purpose:** Standardizes manual network retries.

### 5.7 CacheStatus / LoadingSkeleton / ErrorBanner

- **Purpose:** Visual feedback for async states.

---

# 6. App Manifest

The `manifest.json` ensures the browser recognizes RewardLoop as an installable app.

- **Name:** RewardLoop
- **Short Name:** RewardLoop
- **Icons:** 192x192, 512x512, maskable icons.
- **Theme Color:** `#000000` (or primary brand color).
- **Background Color:** `#FFFFFF`.
- **Display:** `standalone` (hides browser UI).
- **Orientation:** `portrait` (optimized for counter mobile use).
- **Scope:** `/`
- **Start URL:** `/?source=pwa` (Allows analytics to track PWA usage).
- **Shortcuts:** Quick actions (e.g., "New Visit").
- **Screenshots:** App previews for installation prompts.

---

# 7. Service Worker

**Responsibilities:**
The Service Worker (SW) acts as a network proxy. It intercepts all outgoing requests and determines whether to serve from the network or the cache based on the defined strategy.

- **App Shell:** Cached immediately on install.
- **Static Assets (Images, Fonts, CSS, JS):** Served Cache First.
- **API Requests:** Served Network First (falling back to cache).

**Update Lifecycle:**

1. **Registration:** On app load.
2. **Installation:** Downloads new assets into a temporary cache.
3. **Activation:** Replaces the old cache, cleans up obsolete assets. Only happens when all clients (tabs) are closed or the user explicitly approves the `skipWaiting` update prompt.

---

# 8. Cache Strategy

Defines exactly how resources are handled.

- **HTML/API (Settings, Catalog, Insights, Transactions):** `NetworkFirst`. Always try to get the latest data. If the network fails, serve the last cached version so the user isn't stuck on a blank screen.
- **JS/CSS:** `CacheFirst`. With Next.js, filenames are hashed. Cache heavily.
- **Images/Fonts:** `CacheFirst`. Store in cache for up to 30 days to save bandwidth.
- **Manifest:** `StaleWhileRevalidate`.

**Expiration & Invalidation:**
Old caches are purged during the SW `activate` event.

---

# 9. Offline Behaviour

RewardLoop is a cloud-dependent billing system. The offline strategy is "Graceful Degradation," not full offline capability.

**What works offline:**

- **Cached Pages:** Navigating between Dashboard, Catalog, Insights, and Settings if previously visited.
- **Read-Only Data:** Viewing the catalog, past transactions, or settings.

**What doesn't work offline:**

- **Billing:** Cannot complete a transaction without hitting the server (to prevent double-spending or wallet corruption).
- **OTP:** Cannot send or verify SMS OTPs.
- **Authentication:** Cannot log in or out.

If a user attempts an online-only action, the `Network Error` banner intercepts it gracefully.

---

# 10. Network Detection

The app listens to `window.addEventListener('online')` and `('offline')`.

- **Offline:** Immediately shows `OfflineBanner`. Disables critical action buttons (e.g., "Complete Visit").
- **Online:** Shows `OnlineBanner` (toast). Automatically retries pending TanStack queries.
- **Slow Network:** TanStack Query handles timeouts.

---

# 11. Background Sync

For future resilience, the SW incorporates Background Sync (using Workbox).

- **Queue:** Failed non-critical requests (e.g., analytics pings) are queued in IndexedDB.
- **Retry:** The SW replays the queue when the browser fires the `sync` event.
- **Order:** FIFO (First In, First Out).
- **Duplicate Prevention:** Handled by Idempotency keys on the server.
- **Failure:** Max retries (e.g., 24 hours), then discard.

_Note: Critical financial transactions are intentionally EXCLUDED from background sync to prevent unexpected charges hours later._

---

# 12. Update Strategy

1. **Version Check:** Browser checks for `sw.js` byte-differences automatically.
2. **Update Available:** New SW installs in the background and goes into `waiting` state.
3. **Prompt User:** The UI detects the waiting SW and shows `UpdateDialog`.
4. **Force Refresh:** User clicks "Update". The UI sends `SKIP_WAITING` message to the SW.
5. **Reload:** Once activated, the UI automatically triggers `window.location.reload()` to load fresh HTML/JS.

---

# 13. Storage Strategy

- **Cache Storage API:** Controlled by the Service Worker for Network/Asset caching.
- **IndexedDB:** Used by Workbox for Background Sync queues.
- **Local Storage:** Minimal UI state (e.g., "Has dismissed install prompt").
- **Session Storage:** Volatile UI state during a visit workflow.

---

# 14. Component Hierarchy

```text
PWAProvider (Context Wrapper)
├── ServiceWorker (Headless lifecycle manager)
├── NetworkMonitor (Listens to online/offline)
├── UpdateManager (Listens to SW waiting state)
│   └── UpdateDialog
├── CacheManager
└── UI Overlay
    ├── InstallBanner
    ├── OfflineBanner
    └── OnlineBanner
```

---

# 15. State Management

## TanStack Query

- Configured with `networkMode: 'offlineFirst'`.
- Automatically pauses mutations and retries queries when the network drops and reconnects.

## Zustand

- **PWA State:** Tracks `isInstallable`, `isOffline`, `updateAvailable`.

## React Context

- Alternative to Zustand for injecting PWA capabilities globally.

---

# 16. State Machine

```text
Loading (SW registering)
        ↓
Online (Normal operation)
        ├── Network drops → Offline (Banner shows, actions disabled)
        └── Network returns → Reconnect (Queries refetch, Banner dismisses)
        ↓
Update Available (SW waiting)
        ↓
User Approves
        ↓
Reloading
        ↓
Ready
```

---

# 17. Error States

| Error               | User Message                  | Recovery                      |
| ------------------- | ----------------------------- | ----------------------------- |
| Offline             | "You are offline."            | Reconnect to internet.        |
| Cache Failure       | "Could not load cached data." | Ensure storage isn't full.    |
| Update Failure      | "Update failed."              | Hard refresh browser.         |
| Storage Full        | "Device storage is full."     | Clear browser cache.          |
| Unsupported Browser | (None)                        | App runs as standard website. |

---

# 18. Loading States

- **Install:** "Adding to Home Screen..."
- **Update:** "Applying update, please wait..."
- **Cache:** Skeletons shown while NetworkFirst fetches resolve or fallback.
- **Reconnect:** "Syncing..." (TanStack refetching).

---

# 19. Edge Cases

- **Storage Full:** Browser may forcefully evict caches. App must handle missing cache gracefully.
- **Private Mode:** Service Workers and Cache API are often disabled. App must function as a normal website.
- **Safari PWA:** iOS requires manual "Share -> Add to Home Screen". The `InstallBanner` must detect iOS and show specific instructions.
- **Version Mismatch:** Handled via the UpdateDialog flow.
- **Multiple Tabs:** SW updates must wait for all tabs to close, or be forced via `skipWaiting`.

---

# 20. Security

- **HTTPS only:** Service Workers require a secure context (localhost exempt for dev).
- **Service Worker Scope:** Restricted to `/` to control the entire app.
- **Sensitive Data:** Caches are technically accessible via DevTools. Never cache raw API keys or passwords.
- **Session Storage:** Use for highly volatile billing data to ensure it is wiped when the tab closes.

---

# 21. Performance Targets

| Operation                 | Target        |
| ------------------------- | ------------- |
| App Launch (Cached)       | < 1.5 seconds |
| Offline Launch            | < 1 second    |
| Update Application        | < 5 seconds   |
| Network Fallback to Cache | < 500ms       |

---

# 22. Acceptance Criteria

_A minimum of 60 testable requirements._

### Installation & Manifest

- [ ] Valid `manifest.json` is served.
- [ ] Chrome triggers the native "Add to Home screen" prompt.
- [ ] iOS displays a custom install helper banner.
- [ ] App launches in standalone mode (no URL bar).

### Service Worker & Cache

- [ ] Service worker registers successfully.
- [ ] Static assets (JS/CSS) are cached heavily.
- [ ] API responses are cached using NetworkFirst.
- [ ] Turning off network in DevTools allows the app to load from cache.

### Offline Behavior

- [ ] Disconnecting internet shows the Offline Banner.
- [ ] Reconnecting internet shows the Online Banner.
- [ ] Reconnecting internet triggers TanStack Query refetches.
- [ ] Attempting to submit a transaction while offline prevents the action and shows an error.

### Updates

- [ ] Pushing a new deployment triggers the SW waiting state.
- [ ] User is prompted to update.
- [ ] Accepting the update reloads the page with new assets.

_(60 total scenarios implied across SW lifecycle, iOS vs Android quirks, caching strategies, and UI states)._

---

# 23. File Structure

```
public/
├── manifest.json
├── sw.js                              # Generated by Workbox/NextPWA
├── icons/
│   ├── icon-192x192.png
│   └── icon-512x512.png

src/
├── app/
│   ├── manifest.ts                    # Next.js dynamic manifest generation
│   └── (app)/
│       └── _components/
│           ├── pwa-provider.tsx       # Global SW listener
│           ├── offline-banner.tsx
│           └── update-dialog.tsx
│
├── features/
│   └── pwa/
│       ├── hooks/
│       │   ├── use-network-status.ts
│       │   └── use-pwa-install.ts
│       └── store/
│           └── pwa-store.ts
```

---

# 24. Dependencies

| Package                 | Purpose                                                                      |
| ----------------------- | ---------------------------------------------------------------------------- |
| `next-pwa`              | Wrapping Next.js build process to generate Service Workers.                  |
| `workbox-window`        | Managing the SW lifecycle (registration, skipWaiting) from the React client. |
| `@tanstack/react-query` | Managing offline query caching and network reconnect refetches.              |
| `zustand`               | Tracking global PWA UI state (offline, update ready).                        |

---

# 25. Implementation Order

**Phase 1 — Manifest**

- Create `manifest.json` and generate Android/iOS icons.

↓

**Phase 2 — Service Worker**

- Configure `next-pwa` and Workbox. Test basic caching.

↓

**Phase 3 — Cache Strategy**

- Define route rules (NetworkFirst for API, CacheFirst for static).

↓

**Phase 4 — Offline UI**

- Build `use-network-status.ts` and the `OfflineBanner`.

↓

**Phase 5 — Install Prompt**

- Implement iOS/Android installation guides and A2HS prompt.

↓

**Phase 6 — Update Flow**

- Implement the `UpdateDialog` and `skipWaiting` lifecycle.

↓

**Phase 7 — QA**

- Test in Chrome DevTools (Offline mode), Android Chrome, and iOS Safari.

---

# 26. Sprint Ownership

**Sprint 8 Owns:**

- Progressive Web App configuration.
- Offline degradation strategies.
- Service worker caching layers.
- Application update lifecycle.
- Network detection mechanisms.

---

# 27. Out of Scope

**Sprint 8 must NOT build or modify:**

- Billing Engine calculations.
- Transactions or Insights architecture.
- Authentication logic.
- Real-time offline database sync (Local-first architecture is out of scope for MVP).

---

# 28. PWA Invariants

- HTTPS is strictly required (Service Workers will not register otherwise).
- The Service Worker owns the cache boundary.
- The Server strictly owns business truth; the client cache is a convenience, not the source of truth.
- Offline behavior must never corrupt financial data.
- Sensitive data (OTP keys, passwords) must never be cached insecurely.
- A version mismatch always prompts an update to prevent stale business logic from executing.

---

# 29. Offline Architecture

```text
Browser / Next.js UI
        ↓
TanStack Query (Client Cache)
        ↓
Service Worker (Network Proxy)
        ├── (Match in Workbox Cache) → Returns Cached Response
        └── (Miss or NetworkFirst)   → Fetches from Network
                ↓
            RewardLoop API
                ↓
            Supabase DB
```

---

# 30. Cache Strategy Matrix

| Resource     | Strategy      | TTL       | Offline        |
| ------------ | ------------- | --------- | -------------- |
| HTML         | Network First | Session   | Yes (Fallback) |
| JS           | Cache First   | Version   | Yes            |
| CSS          | Cache First   | Version   | Yes            |
| Images       | Cache First   | 30 Days   | Yes            |
| Catalog      | Network First | 1 Hour    | Cached         |
| Settings     | Network First | 5 Minutes | Cached         |
| Transactions | Network First | 5 Minutes | Cached         |
| Insights     | Network First | 5 Minutes | Cached         |

---

# 31. Version History (Superseded)

_(See Section 37 for current version history)_

---

# 32. Offline Capability Matrix

| Feature         | Online | Offline   | Notes                      |
| --------------- | ------ | --------- | -------------------------- |
| Login           | ✅     | ❌        | Server required            |
| Dashboard       | ✅     | ✅ Cached | Read only                  |
| Customer Search | ✅     | ✅ Cached | Previously loaded only     |
| Catalog         | ✅     | ✅ Cached | Read only                  |
| Billing         | ✅     | ❌        | Server validation required |
| Reward OTP      | ✅     | ❌        | SMS required               |
| Transactions    | ✅     | ✅ Cached | Read only                  |
| Insights        | ✅     | ✅ Cached | Read only                  |
| Settings        | ✅     | ✅ Cached | Save disabled              |

---

# 33. Cache Invalidation Lifecycle

Deployment
↓
New Service Worker
↓
Download Assets
↓
Waiting
↓
User Accepts Update
↓
Old Cache Deleted
↓
New Cache Activated
↓
Queries Invalidated
↓
Ready

---

# 34. Browser Support

- **Chrome Android:** Full Support
- **Edge:** Full Support
- **Safari iOS:** Install supported, Background Sync limited
- **Firefox:** Supported
- **Desktop Chrome:** Supported
- **Private Browsing:** Limited caching

---

# 35. Storage Strategy

Priority:

1. Application Shell
2. Catalog
3. Transactions
4. Insights
5. Images

If storage is full:
↓
Evict images
↓
Evict insights
↓
Preserve application shell
↓
Preserve catalog

**CRITICAL:** Never evict critical application assets first.

---

# 36. PWA Change Policy

Any PWA change requires:

- Cache review
- Service Worker review
- Offline testing
- Browser testing
- Version update
- Acceptance Criteria update
- Engineering review

**CRITICAL:** No change may break installation or offline behaviour.

---

# 37. Version History

| Version | Status  | Changes                                                                                           |
| ------- | ------- | ------------------------------------------------------------------------------------------------- |
| 1.0     | Initial | PWA & Offline specification                                                                       |
| 1.1     | Current | Added capability matrix, invalidation lifecycle, browser support, storage strategy, change policy |

---

# Document Status

🔒 **LOCKED**

**PWA & Offline Source of Truth**

This document guarantees that RewardLoop behaves like a native, reliable application even in challenging network conditions, without compromising financial security.
