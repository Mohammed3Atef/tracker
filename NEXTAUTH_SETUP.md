# NextAuth Setup Instructions

## Environment Variables

Add the following environment variables to your `.env` file:

### Required Variables

1. **NEXTAUTH_URL**
   - Development: `http://localhost:3000`
   - Production: Your production domain (e.g., `https://yourdomain.com`)

2. **NEXTAUTH_SECRET**
   - A secure random string used to encrypt JWT tokens
   - **Generate a secret key:**
     ```bash
     # Using OpenSSL (recommended)
     openssl rand -base64 32
     
     # Or using Node.js
     node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
     ```
   - **Online generator:** https://generate-secret.vercel.app/32
   - **Important:** Never commit this secret to version control!

### Example .env file

```env
DATABASE_URL="postgresql://neondb_owner:npg_EhDOKlgI7MZ1@ep-floral-river-ahofqwko-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-generated-secret-key-here
```

## Quick Start

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Generate and add your `NEXTAUTH_SECRET`:
   ```bash
   openssl rand -base64 32
   ```

3. Update `NEXTAUTH_URL` for your environment:
   - Development: `http://localhost:3000`
   - Production: Your production URL

4. Restart your development server:
   ```bash
   npm run dev
   ```

## Testing Authentication

Use the demo credentials from the seed script:
- **Admin:** admin@demo.com / Demo@12345
- **Manager:** manager@demo.com / Demo@12345
- **Employee:** employee@demo.com / Demo@12345

## Route Protection

- `/admin/**` - Requires admin or manager role
- `/app/**` - Requires any authenticated user (admin, manager, employee)
- Unauthenticated users are redirected to `/login`
- Unauthorized users are redirected to `/403`

## Login Redirects

After successful login:
- Admin/Manager → `/admin/dashboard`
- Employee → `/app/dashboard`
