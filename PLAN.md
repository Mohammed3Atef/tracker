# Tracker Modernization Plan

Reference design: **Shifts by Everhour** (shifts.everhour.com)
Goal: Fix all broken functionality, complete missing features, modernize the UI/UX.

---

## Phase 1 — Fix Broken Core Functionality

These are bugs that actively hurt the app today. Do these first.

### 1.1 Fix Employee Reports showing all users' data

**File**: `app/app/reports/page.tsx`
**Problem**: `useTimeEntries` fetches from `/api/time/my` but the hook or API may not filter by user.
**Fix**: Verify `/api/time/my` correctly filters by `auth.user.id`. If `useTimeEntries` calls a different endpoint, change it to call `/api/time/my` with date params.

### 1.2 Fix infinite refetch in Time page

**File**: `app/app/time/page.tsx` line 27
**Problem**: `getWeekBounds(new Date())` is called directly at render time, making the query key a new object on every render.
**Fix**:
```ts
const weekBounds = React.useMemo(() => getWeekBounds(new Date()), []);
const { data: sessions } = useMyTime(weekBounds.start, weekBounds.end);
```

### 1.3 Fix mobile navigation (no sidebar on mobile)

**File**: `components/layout/sidebar.tsx`, `components/layout/navbar.tsx`
**Problem**: Sidebar is `hidden md:flex` — mobile users have no navigation.
**Fix**: Add a mobile bottom navigation bar OR a hamburger sheet/drawer using `@radix-ui/react-dialog` or shadcn's Sheet component. Show the 4–5 most important nav items.

### 1.4 Fix TeamGrid "View Details" navigation

**File**: `app/(admin)/admin/dashboard/page.tsx` line 143
**Problem**: `window.location.href = /admin/users#${memberId}` doesn't scroll to dynamic content.
**Fix**: Replace with `router.push('/admin/users/' + memberId)` or open a user detail dialog/sheet.

### 1.5 Add clock-out confirmation when break is active

**Files**: `app/(app)/app/dashboard/page.tsx`, `app/app/time/page.tsx`
**Problem**: Clocking out while on a break silently ends the break. User may not realize.
**Fix**: Show a confirmation dialog (shadcn `AlertDialog`) if `status.activeBreak` is truthy when Clock Out is clicked.

### 1.6 Clean up excessive useEffect error handling

**File**: `app/app/time/page.tsx` lines 36–69
**Problem**: 5 separate `useEffect` blocks to watch mutation errors.
**Fix**: Move error handling into each mutation's `onError` option using the `useApiToast` hook:
```ts
const clockIn = useClockIn({ onError: (err) => toastApiError(err) });
```
Or centralize in the `use-time-actions.ts` hooks themselves.

### 1.7 Hide debug page in production

**File**: `app/app/debug/page.tsx`
**Fix**: Add a guard at the top:
```ts
if (process.env.NODE_ENV !== 'development') { notFound(); }
```

---

## Phase 2 — Complete Missing Features

These features have DB models and partial infrastructure but no working UI.

### 2.1 Employee Leave Balance — make it configurable

**Files**: `app/(app)/app/dashboard/page.tsx` line 82, `app/app/leaves/page.tsx`
**Problem**: Total leave days hardcoded to `20`.
**Fix options** (choose one):
- Add a `leaveAllowance` field to `EmployeeProfile` (migration needed)
- Add a config table in the DB
- Read from an env variable `LEAVE_ALLOWANCE_DAYS=20` (simplest)

### 2.2 Implement Shift Scheduling

The `Shift` model is fully defined in the schema. Build the full feature:

**API routes to create**:
- `GET /api/shifts` — list shifts (date range filter, userId filter)
- `POST /api/shifts` — create shift (admin/manager)
- `PUT /api/shifts/[id]` — update shift
- `DELETE /api/shifts/[id]` — delete shift

**Pages to create**:
- `app/admin/shifts/page.tsx` — admin shift calendar/table view, create/edit/delete
- `app/app/time/page.tsx` — show employee's upcoming shifts in their time page

**Hook**: `hooks/use-shifts.ts`

### 2.3 Implement AuditLog writing

**File**: `lib/audit.ts` (create)
**Problem**: Nothing writes to the `AuditLog` table.
**Fix**: Create a helper `logAudit(action, resource, resourceId, userId, createdBy, metadata?)` and call it in key API routes:
- Clock in/out
- Leave approve/reject
- User create/update
- Role assignment

### 2.4 Add session auto-timeout

**Problem**: If user closes browser without clocking out, session stays ACTIVE forever.
**Fix options**:
- Cron job / background job that marks sessions COMPLETED if `startTime` is > 24 hours ago and status is ACTIVE
- On clock-in: check for stale sessions (status ACTIVE, startTime from previous day) and auto-close them with a warning toast

Simplest fix: in `POST /api/time/clock-in`, before creating new session, check for any ACTIVE session from a previous calendar day and auto-complete it.

### 2.5 Payroll Finalization UI

**Problem**: Payroll preview exists but `PayrollRun` and `Payslip` records are never created.
**Add**:
- `POST /api/payroll/run` — create a `PayrollRun` + `Payslip` per employee for a period
- `GET /api/payroll/runs` — list past runs
- `app/admin/payroll/page.tsx` — add "Finalize Payroll" button that creates the run, list past runs

---

## Phase 3 — UI/UX Modernization (Everhour-style)

Inspired by Shifts by Everhour: clean, card-based, Inter font, blue primary, strong hierarchy.

### 3.1 Design System Updates

**File**: `app/globals.css`, `tailwind.config.ts`

Apply consistent design tokens matching Everhour's system:

```css
:root {
  --radius: 6px;                        /* Everhour uses 6px */
  --content-padding: 1.25rem;
  --inline-spacing: 0.5rem;
  /* Surface hierarchy */
  --surface-ground: hsl(210 20% 98%);
  --surface-section: hsl(0 0% 100%);
  --surface-card: hsl(0 0% 100%);
  --surface-overlay: hsl(0 0% 100%);
  /* Focus ring */
  --focus-ring: #BFDBFE;
}
```

Set Inter as the primary font:
```ts
// app/layout.tsx
import { Inter } from 'next/font/google';
const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
```

### 3.2 Dashboard Redesign

**Target**: Everhour-style dashboard with a prominent clock widget and clear visual hierarchy.

**Employee Dashboard** (`app/(app)/app/dashboard/page.tsx`):
- Replace 4-card stat row with a **hero clock-in widget**: large time display, status badge, clock in/out and break buttons all in one prominent card
- Below: "Today at a glance" — today's work time, breaks taken
- Weekly bar chart: Mon–Sun bars showing hours per day (use a lightweight chart library or build with CSS/SVG)
- Recent entries in a clean timeline list (not a full data table)

**Admin Dashboard** (`app/(admin)/admin/dashboard/page.tsx`):
- Team status grid: avatar/name cards showing clocked-in (green dot), on break (orange dot), clocked out (gray dot)
- Live counters: Active now / On break / Out
- Pending leaves alert banner if `pendingLeavesCount > 0`
- Remove "System Health" card (that's a dev tool, not admin UX)

### 3.3 Time Tracking Page Redesign

**File**: `app/app/time/page.tsx`

- Move clock widget to top with a large live timer (already exists, just needs better visual design)
- Status indicator: colored ring around a clock icon — green (working), orange (break), gray (clocked out)
- Weekly view: change the collapsible table to a **day-column layout** similar to Everhour Shifts — each day is a column, entries are blocks
- Show overtime clearly (hours > 8/day highlighted in amber)

### 3.4 Calendar Views

**Files**: `app/app/time/calendar/page.tsx`, `app/admin/time/calendar/page.tsx`

Both calendar pages likely use the `CalendarView` component in `components/time/`. Improve it:
- Month/week/day view toggle
- Click a day to see sessions for that day in a side panel
- Color-coded: work blocks (blue), break blocks (orange), leave days (purple)
- Admin calendar: show all users' entries, filterable by user

### 3.5 Sidebar Modernization

**File**: `components/layout/sidebar.tsx`

- Add a **logo/brand mark** at the top (replace plain "Tracker" text)
- Add **user avatar + name + role** at the bottom of the sidebar
- Group nav items with section labels: "My Workspace", "Admin"
- Active state: use a left border accent (Everhour style) instead of full background fill
- Collapse to icon-only mode on smaller screens (icon sidebar variant)

### 3.6 Leave Management Redesign

**Employee** (`app/app/leaves/page.tsx`):
- Leave balance visualization: progress bars per leave type (vacation, sick, personal)
- Calendar mini-view showing approved leaves
- "Request Leave" as a prominent button that opens a sheet/drawer

**Admin** (`app/admin/leaves/page.tsx`):
- Pending leaves prominently at top with approve/reject inline (no page navigation needed)
- Filter by leave type, employee, date range
- History tab for past approved/rejected requests

### 3.7 Mobile Navigation

**Add**: `components/layout/mobile-nav.tsx`

A sticky bottom bar with icons for: Dashboard, Time, Leaves, Reports (and Admin if role allows).
Show on `md:hidden`. Hide sidebar on mobile, show this instead.

### 3.8 Empty States & Loading States

Replace generic "No data" text with illustrated empty states:
- Clock icon + "Clock in to start tracking" for empty time pages
- Calendar icon + "No leaves requested" for empty leave pages
- Use consistent skeleton loaders (already using `Skeleton` component — standardize usage)

---

## Phase 4 — Performance & Quality

### 4.1 Add rate limiting to API routes

Use a simple in-memory rate limiter or middleware. At minimum, protect:
- `/api/auth` (already handled by next-auth)
- `/api/time/clock-in` and `/api/time/clock-out`

### 4.2 Add timezone support

**File**: `lib/timezone-helpers.ts`
- Use `APP_TIMEZONE` env variable throughout the app
- Display all times in the configured timezone
- Store times in UTC (already done), convert on display

### 4.3 Add React Query error boundaries

Wrap each page section in an `ErrorBoundary` that shows a retry button rather than a blank screen.

### 4.4 Generate real PWA icons

Run an icon generation script using `sharp` or a tool like `pwa-asset-generator`:
```bash
npx pwa-asset-generator logo.png public/icons
```

### 4.5 Add input validation to all forms

Several forms send raw input without Zod validation on the client. Add schemas for:
- Leave request form
- User create/edit form
- Profile edit form

---

## Phase 5 — New Features (Post-Modernization)

Once core is solid and UI is modernized, consider:

- **Shift scheduling** (Phase 2.2) with drag-and-drop calendar
- **Notifications** — browser push notifications for leave approvals, shift reminders
- **Employee self-service profile** — employees can edit their own contact info
- **Report charts** — replace text-only reports with bar/line charts (use `recharts` or `chart.js`)
- **Export to PDF** — payslip PDF generation
- **Multi-language support** — i18n with `next-intl`

---

## Implementation Order

| Priority | Phase | Task |
|---|---|---|
| 1 (Now) | 1.2 | Fix infinite refetch in Time page |
| 2 (Now) | 1.1 | Fix employee reports filtering |
| 3 (Now) | 1.3 | Add mobile navigation |
| 4 (Now) | 1.6 | Clean up useEffect error handling |
| 5 (Now) | 1.5 | Clock-out confirmation dialog |
| 6 (Now) | 1.4 | Fix TeamGrid navigation |
| 7 (Now) | 1.7 | Hide debug page in production |
| 8 (Soon) | 2.1 | Configurable leave balance |
| 9 (Soon) | 2.4 | Session auto-timeout on clock-in |
| 10 (Soon) | 3.1 | Design system tokens + Inter font |
| 11 (Soon) | 3.5 | Sidebar modernization |
| 12 (Soon) | 3.7 | Mobile bottom nav |
| 13 (Soon) | 3.2 | Dashboard redesign |
| 14 (Later) | 3.3 | Time tracking page redesign |
| 15 (Later) | 3.4 | Calendar views improvement |
| 16 (Later) | 3.6 | Leave management redesign |
| 17 (Later) | 2.2 | Shift scheduling feature |
| 18 (Later) | 2.3 | AuditLog implementation |
| 19 (Later) | 2.5 | Payroll finalization UI |
| 20 (Later) | 4.x | Rate limiting, timezone, PWA icons |
