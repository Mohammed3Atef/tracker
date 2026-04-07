# Tracker — Project Reference for Claude

## What This Is

An employee time-tracking web application. Employees clock in/out, take breaks, request leave, and view their payroll preview. Admins/managers manage teams, approve leaves, view reports, and administer users and roles.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 (strict) |
| UI | React 19, TailwindCSS 3.4, shadcn/ui (Radix UI) |
| State/Data | TanStack React Query 5 |
| Auth | next-auth 4.24 (JWT, credentials provider) |
| ORM | Prisma 6 |
| Database | PostgreSQL (Neon) |
| Forms | react-hook-form + zod |
| Icons | lucide-react |
| PWA | next-pwa 5.6 |
| Theme | next-themes (dark/light) |

---

## Repository Layout

```
tracker/
├── app/
│   ├── (admin)/              # Route group — admin layout wrapper
│   │   └── admin/dashboard/page.tsx
│   ├── (app)/                # Route group — employee layout wrapper
│   │   └── app/dashboard/page.tsx
│   ├── admin/                # Admin-only pages
│   │   ├── leaves/           # Approve/reject leave requests
│   │   ├── payroll/          # Payroll preview (all employees)
│   │   ├── reports/          # Team reports + CSV export
│   │   ├── roles/            # Role & permission management
│   │   ├── team/             # Team member overview
│   │   ├── time/entries/     # All users' time entries
│   │   ├── time/calendar/    # Calendar view (page exists, may be incomplete)
│   │   └── users/            # User CRUD
│   ├── app/                  # Employee pages
│   │   ├── debug/            # API debug page
│   │   ├── leaves/           # Request leave, view own leaves
│   │   ├── reports/          # Personal time reports + CSV export
│   │   ├── time/             # Clock in/out, breaks, weekly view
│   │   ├── time/calendar/    # Calendar view of own entries
│   │   └── time/entries/     # Full list of own time entries
│   ├── api/                  # API routes (Next.js route handlers)
│   │   ├── auth/[...nextauth]/
│   │   ├── health/
│   │   ├── leaves/           # request, my, pending, all, [id]/approve, [id]/reject
│   │   ├── payroll/preview/
│   │   ├── permissions/
│   │   ├── roles/
│   │   ├── time/             # clock-in, clock-out, break/start, break/end, status, my
│   │   └── users/            # CRUD, [id]/profile, all/status
│   ├── login/
│   ├── 403/
│   ├── layout.tsx            # Root: QueryProvider > AuthSessionProvider > ThemeProvider > DashboardLayout
│   └── page.tsx              # Redirects to /app/dashboard or /login
├── components/
│   ├── dashboard/            # SummaryCard, TeamGrid
│   ├── layout/               # Sidebar (role-based nav), Navbar, DashboardLayout, ThemeToggle
│   ├── providers/            # SessionProvider, ThemeProvider
│   ├── time/                 # SessionDetails, SessionTimeline, TimeEntryForm, CalendarView
│   └── ui/                   # shadcn/ui components
├── hooks/                    # 14 React Query hooks
│   ├── use-time-actions.ts   # useClockIn, useClockOut, useStartBreak, useEndBreak
│   ├── use-time-status.ts    # Current session status (polls every 30s)
│   ├── use-my-time.ts        # Personal sessions by date range
│   ├── use-time-entries.ts   # Time entries (used in reports)
│   ├── use-my-leaves.ts      # Own leave requests
│   ├── use-pending-leaves.ts # Pending leaves (admin)
│   ├── use-all-leaves.ts     # All leaves (admin)
│   ├── use-leave-actions.ts  # useApproveLeave, useRejectLeave
│   ├── use-users.ts          # User list + management mutations
│   ├── use-user-time-status.ts # All users' time status (useAllUsersStatus)
│   ├── use-payroll-preview.ts
│   ├── use-health.ts
│   ├── use-api-toast.ts      # Error notification helper
│   └── use-toast.ts
├── lib/
│   ├── auth.ts               # NextAuth config (credentials, JWT, bcrypt)
│   ├── api-auth.ts           # requireAuthApi() helper for route handlers
│   ├── api-client.ts         # Typed fetch wrapper
│   ├── api-errors.ts         # Error classes
│   ├── api-response.ts       # Standardized JSON responses
│   ├── prisma.ts             # Singleton Prisma client
│   ├── time-helpers.ts       # formatDuration, getWeekBounds, calculateDuration, etc.
│   ├── timezone-helpers.ts   # Timezone utilities (partially implemented)
│   ├── leave-validation.ts   # Leave overlap/balance logic
│   ├── payroll-helpers.ts    # Overtime calculation, gross pay
│   └── utils.ts              # cn() function
├── prisma/
│   ├── schema.prisma         # 12 models (see below)
│   ├── seed.ts               # Seeds roles, permissions, demo users
│   └── migrations/
├── types/                    # TypeScript interfaces
├── middleware.ts             # Auth + role guard (withAuth)
├── auth.ts                   # (root) Auth configuration entry point
└── next.config.ts            # Next.js + PWA config
```

---

## Database Models (12)

| Model | Purpose |
|---|---|
| `User` | Auth credentials + role link |
| `Role` | Named roles (admin, manager, employee) |
| `Permission` | Resource+action pairs |
| `RolePermission` | Many-to-many role ↔ permission |
| `EmployeeProfile` | Name, department, position, salary, hire date |
| `TimeSession` | Clock-in/out record, status (ACTIVE/PAUSED/COMPLETED/CANCELLED) |
| `BreakSession` | Break within a TimeSession, type (LUNCH/REST/MEAL/OTHER) |
| `Shift` | Scheduled shifts — **schema exists but NO API or UI** |
| `LeaveRequest` | Leave with type/status/dates/reason |
| `PayrollRun` | Payroll run metadata — **schema exists, no finalization UI** |
| `Payslip` | Per-user payslip in a run — **schema exists, no finalization UI** |
| `AuditLog` | Action log — **schema exists, nothing writes to it** |

---

## Authentication & Authorization

- **Strategy**: JWT via next-auth credentials provider
- **Password**: bcrypt hashed
- **Session token** includes: `id`, `email`, `role` (role name string)
- **Middleware** (`middleware.ts`):
  - `/admin/**` → requires role `admin` or `manager`
  - `/app/**` → requires any authenticated session
  - Public: `/login`, `/403`, `/api/auth`
- **API auth**: every route handler calls `requireAuthApi(req)` which validates JWT and returns user

---

## API Pattern

All API routes follow this pattern:

```ts
// GET /api/time/status
export async function GET(req: NextRequest) {
  const auth = await requireAuthApi(req);
  if (!auth.success) return auth.response;
  const { user } = auth;
  // ... prisma query ...
  return apiSuccess(data);
}
```

Standard responses: `apiSuccess(data)`, `apiError(message, status)`

---

## Data Flow

```
UI Component
  → React Query Hook (useXxx)
    → api-client.ts (typed fetch)
      → API Route Handler
        → requireAuthApi() [auth check]
          → Prisma [DB query]
            → apiSuccess(data)
```

---

## Role-Based Navigation (Sidebar)

The sidebar (`components/layout/sidebar.tsx`) filters nav items by `session.user.role`:

| Section | Roles |
|---|---|
| Dashboard, Time Tracking, My Leaves, Reports | all |
| Admin Dashboard, Team, Time Management, Users Management | admin, manager |
| Leave Management, Payroll Preview, Admin Reports | admin, manager |
| Role Management | admin only |

---

## Known Issues & Incomplete Features

### Broken / Not Working

1. **`/app/reports` — uses `useTimeEntries` which fetches ALL users' entries** — employees see everyone's data, not just their own. Should filter by `userId`.

2. **Live timer in `getWeekBounds` is NOT memoized in `/app/app/time/page.tsx`** — `getWeekBounds(new Date())` is called at render time (not in `useMemo`), causing the query key to change on every render and infinite refetching. Fixed version: wrap in `useMemo(() => getWeekBounds(new Date()), [])`.

3. **`/admin/time/calendar`** — page file exists but likely incomplete/empty.

4. **TeamGrid "View Details" handler** uses `window.location.href` with a hash fragment (`/admin/users#userId`) — browsers don't scroll to dynamic elements this way. Should use router navigation or open a modal.

5. **`useAllUsersStatus` polling** — currently has no error boundary; if it fails, it silently fails with no user feedback.

6. **Clock-out with active break** — auto-ends the break server-side but the UI shows no warning/confirmation dialog.

7. **No timezone handling** — all `DateTime` values stored as UTC but displayed with browser's local timezone. `APP_TIMEZONE` env var exists but is not implemented.

8. **`useEffect` for error handling** is used excessively across pages (e.g., `app/app/time/page.tsx` has 5 separate `useEffect` for each mutation's `.error`). Should use `onError` in mutation options or the `use-api-toast` hook more cleanly.

### Missing / Incomplete

9. **`Shift` model** — DB table exists with full schema, but no API endpoints, no UI, no seed data.

10. **`AuditLog` model** — nothing writes to it despite infrastructure existing.

11. **Payroll finalization** — only a preview exists; no ability to create/finalize a `PayrollRun` or generate `Payslip` records.

12. **Leave balance** — hardcoded to 20 days total in both the dashboard and leaves page. Should come from a configurable setting per user or role.

13. **PWA icons** — `public/icons/` exists with placeholder files; real icons haven't been generated.

14. **No session timeout** — if a user clocks in and closes their browser without clocking out, the session stays ACTIVE indefinitely.

15. **No rate limiting** on any API endpoint.

16. **Debug page** (`/app/debug`) — exposed in production builds; should be dev-only.

17. **Employee reports page** shows raw entries list only; no visual charts or per-day breakdown grouped by user.

18. **Mobile sidebar** — the sidebar is `hidden md:flex`; mobile has no navigation at all (no hamburger menu, no bottom nav).

---

## Scripts

```bash
npm run dev           # Development server
npm run build         # Production build
npm run db:seed       # Seed roles, permissions, demo users
npm run db:studio     # Prisma Studio
npm run db:migrate    # Run migrations
npm run db:generate   # Regenerate Prisma client
```

---

## Reference Design

The modernization target is **Shifts by Everhour** (`shifts.everhour.com`):
- Clean card-based layout with Inter font
- Blue primary (`#3B82F6`), neutral grays
- Surface hierarchy (ground → section → card → overlay)
- Standard 6px border radius
- Consistent spacing tokens (`--content-padding: 1.25rem`)
- Light mode focused, strong accessibility (focus rings)
- Shift scheduling with calendar-centric UI
- Geographic/location awareness (Google Maps integration)
- Real-time status indicators

---

## Development Notes

- Path alias `@/` maps to project root
- shadcn/ui components live in `components/ui/`
- All pages are `"use client"` — this project has no server components beyond layout wrappers
- React Query `staleTime` varies by hook; time status polls every 30s
- The `cn()` utility in `lib/utils.ts` combines `clsx` + `tailwind-merge`
- Zod 4 is used (not Zod 3) — API is slightly different
