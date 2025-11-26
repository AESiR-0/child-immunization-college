# Edge Runtime Compatibility Notes

## Changes Made for Vercel Edge Runtime

### 1. Password Hashing
- **Replaced**: `bcryptjs` (requires Node.js crypto)
- **With**: Web Crypto API (`utils/password.ts`)
- **Why**: Web Crypto API works in Edge runtime
- **Method**: PBKDF2 with SHA-256, 100,000 iterations

### 2. Database Access
- **Replaced**: Drizzle with `pg` or `postgres-js` (Node.js only)
- **With**: Supabase Client (`@supabase/supabase-js`)
- **Why**: Supabase client uses HTTP/REST API, works in Edge
- **File**: `src/db/edge.ts` for Edge-compatible client

### 3. API Routes
All API routes now use:
- `export const runtime = 'edge'`
- Supabase client instead of Drizzle
- Web Crypto API for password operations

### 4. Server Components
Updated to use Supabase client:
- `app/dashboard/page.tsx`
- `app/chart/page.tsx`
- `app/map/page.tsx`

## Database Column Mapping

Supabase uses snake_case, so we map:
- `userId` → `user_id`
- `dateOfBirth` → `date_of_birth`
- `birthCertificateUrl` → `birth_certificate_url`
- `birthCertificateVerified` → `birth_certificate_verified`

## Migration Notes

If you have existing data with bcryptjs hashes:
1. Users will need to reset passwords, OR
2. Add migration logic to support both hash formats temporarily

## Testing

All routes should now work in Edge runtime:
- ✅ `/api/users/signup`
- ✅ `/api/users/login`
- ✅ `/api/auth/[...nextauth]`
- ✅ `/api/children`
- ✅ Server components (dashboard, chart, map)

## Dependencies

You can remove `bcryptjs` and `@types/bcryptjs` if desired:
```bash
npm uninstall bcryptjs @types/bcryptjs
```

However, keeping them won't cause issues since they're not imported anymore.

