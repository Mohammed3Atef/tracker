# Prisma PostgreSQL Setup - Commands

## Prisma Setup Complete ✅

All Prisma files have been created and configured. The project uses Prisma 6 for compatibility and stability. Use the following commands to set up your database.

## Exact Commands to Run

### 1. Generate Prisma Client (if not already done)
```bash
npm run db:generate
# or
npx prisma generate
```

### 2. Create and Run Migration
```bash
npm run db:migrate
# or
npx prisma migrate dev --name init
```

This will:
- Create a new migration file in `prisma/migrations/`
- Apply the migration to your PostgreSQL database
- Generate the Prisma Client

### 3. Seed the Database
```bash
npm run db:seed
# or
npx prisma db seed
```

This will:
- Create 3 roles: admin, manager, employee
- Create permissions and map them to roles
- Create 3 users with hashed passwords:
  - **admin@demo.com** / Demo@12345 (admin role)
  - **manager@demo.com** / Demo@12345 (manager role)
  - **employee@demo.com** / Demo@12345 (employee role)
- Create EmployeeProfile for each user

## Additional Useful Commands

### Open Prisma Studio (Database GUI)
```bash
npm run db:studio
# or
npx prisma studio
```

### Push Schema Changes (without migration)
```bash
npm run db:push
# or
npx prisma db push
```

### View Database Status
```bash
npx prisma migrate status
```

### Reset Database (⚠️ WARNING: Deletes all data)
```bash
npx prisma migrate reset
```

## Database Models Created

1. **User** - Authentication and user management
2. **Role** - User roles (admin, manager, employee)
3. **Permission** - System permissions
4. **RolePermission** - Role-Permission mapping
5. **EmployeeProfile** - Extended employee information
6. **TimeSession** - Time tracking entries
7. **BreakSession** - Break tracking
8. **Shift** - Work shift definitions
9. **LeaveRequest** - Leave/time-off requests
10. **PayrollRun** - Payroll processing runs
11. **Payslip** - Individual payslips
12. **AuditLog** - System audit trail

## Environment Variables

Make sure your `.env` file contains:
```
DATABASE_URL="postgresql://neondb_owner:npg_EhDOKlgI7MZ1@ep-floral-river-ahofqwko-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
```

## Next Steps

After running the migration and seed:
1. Verify data in Prisma Studio: `npm run db:studio`
2. Start using Prisma Client in your Next.js app
3. Create API routes or server actions to interact with the database
