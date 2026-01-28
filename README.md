# Tracker - Employee Time Tracking & Management System

A comprehensive employee time tracking and management system built with Next.js, featuring time tracking, leave management, payroll preview, and user administration.

## Features

### Core Functionality
- **Time Tracking**: Clock in/out, break management, live timers, weekly summaries
- **Leave Management**: Request, approve/reject leave requests with full workflow
- **Payroll Preview**: Monthly summary with worked hours, overtime, and leave calculations
- **User Management**: Complete user and employee profile administration
- **Role-Based Access Control**: Admin, Manager, and Employee roles with granular permissions
- **Real-time Dashboard**: Live status updates and activity monitoring

### User Roles

- **Admin**: Full system access, user management, all approvals, payroll access
- **Manager**: Team management, leave approvals, payroll access, user viewing
- **Employee**: Personal time tracking, leave requests, own data viewing

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: TailwindCSS
- **UI Components**: shadcn/ui (Radix UI)
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js v4
- **State Management**: React Query (TanStack Query)
- **Form Handling**: React Hook Form + Zod validation
- **Theme**: Dark/Light mode support (next-themes)

## Prerequisites

- Node.js 18+ 
- PostgreSQL database
- npm or yarn

## Getting Started

### 1. Clone the repository

```bash
git clone <repository-url>
cd tracker
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/tracker?sslmode=require"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# Optional: Debug logging
DEBUG_AUTH="true"

# Optional: Timezone (defaults to UTC)
APP_TIMEZONE="America/New_York"
```

**Generate NEXTAUTH_SECRET:**
```bash
openssl rand -base64 32
```

### 4. Set up the database

```bash
# Generate Prisma Client
npm run db:generate

# Run migrations
npm run db:migrate

# Seed the database (creates roles, permissions, and demo users)
npm run db:seed
```

### 5. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 6. Login with demo accounts

After seeding, you can login with:

- **Admin**: `admin@demo.com` / `Demo@12345`
- **Manager**: `manager@demo.com` / `Demo@12345`
- **Employee**: `employee@demo.com` / `Demo@12345`

## Available Scripts

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint

# Database
npm run db:generate  # Generate Prisma Client
npm run db:migrate   # Run database migrations
npm run db:push      # Push schema changes (dev only)
npm run db:studio    # Open Prisma Studio (database GUI)
npm run db:seed      # Seed the database
```

## Project Structure

```
tracker/
├── app/                      # Next.js App Router
│   ├── (admin)/             # Admin route group
│   │   └── admin/
│   │       └── dashboard/   # Admin dashboard
│   ├── (app)/               # App route group
│   │   └── app/
│   │       ├── dashboard/    # Employee dashboard
│   │       ├── time/         # Time tracking page
│   │       └── leaves/      # Employee leave page
│   ├── admin/                # Admin pages
│   │   ├── users/           # User management
│   │   ├── leaves/          # Leave management
│   │   └── payroll/         # Payroll preview
│   ├── api/                  # API routes
│   │   ├── auth/            # NextAuth routes
│   │   ├── users/           # User management APIs
│   │   ├── time/            # Time tracking APIs
│   │   ├── leaves/          # Leave management APIs
│   │   └── payroll/         # Payroll APIs
│   ├── login/               # Login page
│   └── layout.tsx           # Root layout
├── components/              # React components
│   ├── layout/              # Layout components (sidebar, navbar)
│   ├── providers/           # Context providers
│   └── ui/                  # shadcn/ui components
├── hooks/                   # React Query hooks
├── lib/                     # Utility functions
│   ├── api-auth.ts         # API authentication helpers
│   ├── api-client.ts       # API client wrapper
│   ├── api-response.ts     # Standardized API responses
│   ├── prisma.ts           # Prisma client
│   └── ...
├── prisma/                  # Prisma schema and migrations
│   ├── schema.prisma       # Database schema
│   └── seed.ts             # Database seed script
└── types/                   # TypeScript type definitions
```

## API Endpoints

### Authentication
- `POST /api/auth/[...nextauth]` - NextAuth endpoints

### Users
- `GET /api/users` - List all users (admin/manager)
- `GET /api/users/[id]` - Get user details
- `PATCH /api/users/[id]` - Update user
- `GET /api/users/[id]/profile` - Get employee profile
- `PATCH /api/users/[id]/profile` - Update employee profile
- `GET /api/users/[id]/time-status` - Get user's time status
- `GET /api/users/all/status` - Get all users' status
- `GET /api/roles` - Get all roles

### Time Tracking
- `POST /api/time/clock-in` - Clock in
- `POST /api/time/clock-out` - Clock out
- `POST /api/time/break/start` - Start break
- `POST /api/time/break/end` - End break
- `GET /api/time/status` - Get current time status
- `GET /api/time/my?from=&to=` - Get time history

### Leave Management
- `POST /api/leaves/request` - Request leave
- `GET /api/leaves/my` - Get my leave requests
- `GET /api/leaves/pending` - Get pending requests (admin/manager)
- `GET /api/leaves/all?status=&userId=&type=&from=&to=` - Get all requests with filters
- `POST /api/leaves/[id]/approve` - Approve leave request
- `POST /api/leaves/[id]/reject` - Reject leave request

### Payroll
- `GET /api/payroll/preview?month=YYYY-MM` - Get payroll preview (admin/manager)

### Health
- `GET /api/health` - Health check endpoint

## Database Schema

The system uses 12 main models:

- **User** - Authentication and user accounts
- **Role** - User roles (admin, manager, employee)
- **Permission** - System permissions
- **RolePermission** - Role-permission mappings
- **EmployeeProfile** - Extended employee information
- **TimeSession** - Time tracking sessions
- **BreakSession** - Break tracking
- **Shift** - Work shift definitions
- **LeaveRequest** - Leave/time-off requests
- **PayrollRun** - Payroll processing runs
- **Payslip** - Individual payslips
- **AuditLog** - System audit trail

See `prisma/schema.prisma` for complete schema definition.

## Features Overview

### Time Tracking
- Clock in/out functionality
- Break management (start/end breaks)
- Live timers showing current session and break duration
- Daily and weekly summaries
- Overtime calculation (8 hours/day threshold)
- Prevent clock-out with active breaks (auto-ends break)

### Leave Management
- Request leave with date range, type, and reason
- Leave types: VACATION, SICK, PERSONAL, UNPAID, MATERNITY, PATERNITY, OTHER
- Approval workflow (Pending → Approved/Rejected)
- Overlap validation for approved leaves
- Filter by status, user, type, and date range
- View all requests (pending, approved, rejected)

### Payroll Preview
- Monthly summary per employee
- Total worked minutes
- Overtime minutes (above 8h/day)
- Paid leave days (VACATION, SICK)
- Unpaid leave days
- Daily breakdown with expandable rows
- Timezone-aware month boundaries

### User Management
- List all users with profiles
- Edit user email and role (admin only for role changes)
- Edit employee profiles (name, contact, department, position, salary)
- View user time status
- Filter by role and department
- Search by name or email
- Live status indicators (clocked in/on break/out)

## Documentation

Additional documentation files:

- `PRISMA_SETUP.md` - Database setup and migration guide
- `NEXTAUTH_SETUP.md` - Authentication setup guide
- `API_FOUNDATION_SETUP.md` - API foundation layer documentation
- `LEAVE_MANAGEMENT_SETUP.md` - Leave management feature guide
- `DEBUG_LOGGING.md` - Debug logging configuration

## Development

### Adding New Features

1. **API Routes**: Add route handlers in `app/api/`
2. **Hooks**: Create React Query hooks in `hooks/`
3. **Pages**: Create pages in `app/` following route group structure
4. **Components**: Add reusable components in `components/`

### Code Style

- TypeScript strict mode enabled
- ESLint configured with Next.js rules
- Prettier formatting (if configured)
- Component naming: PascalCase
- File naming: kebab-case for routes, camelCase for utilities

### Database Migrations

```bash
# Create a new migration
npm run db:migrate

# Apply migrations in production
npx prisma migrate deploy
```

## Security

- Password hashing with bcrypt
- JWT-based authentication via NextAuth.js
- Role-based access control (RBAC)
- API route protection with middleware
- Input validation with Zod schemas
- SQL injection protection via Prisma ORM

## Production Deployment

1. Set environment variables in your hosting platform
2. Run database migrations: `npx prisma migrate deploy`
3. Build the application: `npm run build`
4. Start the server: `npm start`

### Environment Variables for Production

```env
DATABASE_URL="postgresql://..."
NEXTAUTH_URL="https://your-domain.com"
NEXTAUTH_SECRET="your-production-secret"
NODE_ENV="production"
```

## Troubleshooting

### Database Connection Issues
- Verify `DATABASE_URL` is correct
- Check PostgreSQL is running
- Ensure SSL mode matches your database configuration

### Authentication Issues
- Verify `NEXTAUTH_SECRET` is set
- Check `NEXTAUTH_URL` matches your domain
- Clear browser cookies and try again

### Build Errors
- Run `npm run db:generate` to regenerate Prisma Client
- Clear `.next` folder and rebuild
- Check for TypeScript errors: `npm run lint`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

[Add your license here]

## Support

For issues and questions, please open an issue on the repository.

---

Built with ❤️ using Next.js and modern web technologies.
