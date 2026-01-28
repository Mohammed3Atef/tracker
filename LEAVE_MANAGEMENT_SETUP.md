# Leave Management System - Implementation Complete

## Overview

A complete Leave Management system has been implemented with employee leave requests, admin/manager approval workflow, overlapping leave validation, and timezone-aware date handling.

## Prisma Schema Changes

### Migration Applied
- **Migration**: `20260128143302_add_rejection_reason`
- **Change**: Added `rejectionReason` field to `LeaveRequest` model
- **Status**: ✅ Applied successfully

### Updated Model
```prisma
model LeaveRequest {
  id              String             @id @default(uuid())
  userId          String
  startDate       DateTime           @db.Date
  endDate         DateTime           @db.Date
  type            LeaveRequestType
  status          LeaveRequestStatus @default(PENDING)
  reason          String?
  rejectionReason String?            // NEW FIELD
  approvedBy      String?
  approvedAt      DateTime?
  createdAt       DateTime           @default(now())
  updatedAt       DateTime           @updatedAt
  // ... relations
}
```

## Backend API Routes

### 1. POST `/api/leaves/request`
- **Auth**: Any authenticated user
- **Purpose**: Submit a new leave request
- **Validation**:
  - Date range validation (start <= end)
  - Overlap check with existing APPROVED leaves
- **Returns**: Created leave request

### 2. GET `/api/leaves/my`
- **Auth**: Any authenticated user
- **Purpose**: Get current user's leave requests
- **Returns**: Array of user's leave requests (ordered by createdAt desc)

### 3. GET `/api/leaves/pending`
- **Auth**: Admin/Manager only
- **Purpose**: Get all pending leave requests
- **Returns**: Array of pending requests (ordered by createdAt asc)

### 4. POST `/api/leaves/[id]/approve`
- **Auth**: Admin/Manager only
- **Purpose**: Approve a pending leave request
- **Validation**:
  - Request must be PENDING
  - Overlap check with existing APPROVED leaves (excluding current request)
- **Updates**: Sets status to APPROVED, stores approvedBy and approvedAt

### 5. POST `/api/leaves/[id]/reject`
- **Auth**: Admin/Manager only
- **Purpose**: Reject a pending leave request
- **Body**: `{ rejectionReason?: string }`
- **Validation**: Request must be PENDING
- **Updates**: Sets status to REJECTED, stores rejectionReason

## Frontend Implementation

### Pages Created

#### `/app/leaves` - Employee Leave Page
- List of user's leave requests
- "Request Leave" button opens dialog
- Leave request form with:
  - Start Date (date picker)
  - End Date (date picker)
  - Leave Type (dropdown)
  - Reason (optional textarea)
- Status badges: Pending (yellow), Approved (green), Rejected (red), Cancelled (gray)
- Responsive: Table (desktop), Cards (mobile)
- Empty state with helpful message

#### `/admin/leaves` - Admin Leave Management Page
- List of pending leave requests
- Shows employee email, date range, type, reason
- Approve/Reject action buttons
- Reject dialog with optional rejection reason
- Responsive design
- Empty state when no pending requests

### React Query Hooks

#### `hooks/use-my-leaves.ts`
- Fetches current user's leave requests
- Query key: `["leaves", "my"]`

#### `hooks/use-pending-leaves.ts`
- Fetches pending leave requests (admin/manager only)
- Query key: `["leaves", "pending"]`

#### `hooks/use-leave-actions.ts`
- `useRequestLeave()` - Submit new leave request
- `useApproveLeave()` - Approve pending request
- `useRejectLeave()` - Reject pending request
- All mutations invalidate relevant queries on success

## Navigation Updates

### Sidebar
- **"My Leaves"** - All authenticated users (Calendar icon)
- **"Leave Management"** - Admin/Manager only (FileCheck icon)

### Mobile Navigation
- Added "My Leaves" and "Leave Management" links

## Business Rules Implemented

1. ✅ Only one open TimeSession per user (existing, unchanged)
2. ✅ Date range validation: startDate <= endDate
3. ✅ Overlap prevention: Cannot approve leaves that overlap with existing APPROVED leaves
4. ✅ Status validation: Only PENDING requests can be approved/rejected
5. ✅ Role-based access: Admin/Manager can approve/reject, all users can request
6. ✅ Dates stored in UTC, displayed using APP_TIMEZONE (defaults to UTC)

## Helper Functions

### `lib/timezone-helpers.ts`
- `getAppTimezone()` - Returns APP_TIMEZONE env var or "UTC"
- `formatDateForDisplay(date)` - Formats date in app timezone
- `parseDateFromInput(dateString)` - Parses date string to UTC Date
- `formatDateRange(start, end)` - Formats date range for display

### `lib/leave-validation.ts`
- `leaveRequestSchema` - Zod schema for request validation
- `dateRangesOverlap()` - Checks if two date ranges overlap
- `parseLeaveDates()` - Parses and validates leave dates

## Error Handling

- All API routes use `handleApiError()` for consistent error responses
- Frontend uses `useApiToast()` for user-friendly error messages
- Validation errors return 422 status with clear messages
- Overlap errors include details about conflicting leaves

## Files Created

### Backend
- `app/api/leaves/request/route.ts`
- `app/api/leaves/my/route.ts`
- `app/api/leaves/pending/route.ts`
- `app/api/leaves/[id]/approve/route.ts`
- `app/api/leaves/[id]/reject/route.ts`
- `lib/leave-validation.ts`
- `lib/timezone-helpers.ts`

### Frontend
- `app/app/leaves/page.tsx`
- `app/admin/leaves/page.tsx`
- `hooks/use-my-leaves.ts`
- `hooks/use-pending-leaves.ts`
- `hooks/use-leave-actions.ts`

### Schema
- `prisma/migrations/20260128143302_add_rejection_reason/migration.sql`

## Manual Test Checklist

### Prerequisites
- ✅ Prisma migration applied: `npx prisma migrate dev --name add_rejection_reason`
- ⚠️ Optional: Set `APP_TIMEZONE` in `.env` (defaults to UTC)

### Employee Tests
- [ ] Submit a leave request with valid dates
- [ ] Submit a leave request with invalid date range (start > end) - should show validation error
- [ ] Submit a leave request that overlaps with existing approved leave - should show overlap error
- [ ] View list of own leave requests
- [ ] See status badges correctly (Pending, Approved, Rejected)
- [ ] Submit request with all leave types (VACATION, SICK, PERSONAL, UNPAID, MATERNITY, PATERNITY, OTHER)
- [ ] Submit request with and without reason

### Admin/Manager Tests
- [ ] View pending leave requests
- [ ] See employee email in pending requests list
- [ ] Approve a pending request
- [ ] Reject a pending request with reason
- [ ] Reject a pending request without reason
- [ ] Try to approve already-approved request - should fail
- [ ] Try to approve request with overlapping approved leave - should fail
- [ ] Verify approvedBy and approvedAt are set on approval

### Edge Cases
- [ ] Date range validation (start = end should be valid)
- [ ] Overlap detection with exact date matches
- [ ] Overlap detection with partial overlaps (e.g., request overlaps start or end of existing)
- [ ] Timezone display (if APP_TIMEZONE is set)
- [ ] Empty states (no requests, no pending requests)
- [ ] Loading states during API calls
- [ ] Error handling (network errors, validation errors)
- [ ] Mobile responsive design

## Environment Variables

Optional (for timezone support):
```env
APP_TIMEZONE=America/New_York
```

If not set, defaults to UTC.

## Build Status

- ✅ TypeScript compilation: Successful
- ✅ Production build: Successful
- ✅ All routes registered correctly

## Next Steps

1. Test the leave management workflow end-to-end
2. Consider adding leave balance tracking (future enhancement)
3. Consider adding leave calendar view (future enhancement)
4. Consider adding email notifications for approvals/rejections (future enhancement)
