# Complete Setup Guide - Child Immunization Tracker

This guide will walk you through setting up and deploying the Child Immunization Tracker application.

## 📋 Prerequisites

Before you begin, ensure you have:

- Node.js 18+ installed
- npm or yarn package manager
- A Supabase account (free tier works)
- A Vercel account (for deployment)
- Git installed

## 🚀 Step-by-Step Setup

### Step 1: Clone and Install Dependencies

```bash
# Clone the repository (or navigate to your project folder)
cd child-immunization-college

# Install all dependencies
npm install
```

### Step 2: Set Up Supabase Database

1. **Create a Supabase Project**
   - Go to [supabase.com](https://supabase.com)
   - Create a new project
   - Wait for the database to be provisioned

2. **Get Your Database Connection String**
   - In Supabase dashboard, go to Settings → Database
   - Copy the "Connection string" under "Connection pooling"
   - It should look like: `postgresql://postgres:[YOUR-PASSWORD]@[PROJECT-REF].supabase.co:5432/postgres`

3. **Get Your Supabase Keys**
   - Go to Settings → API
   - Copy the "Project URL" (NEXT_PUBLIC_SUPABASE_URL)
   - Copy the "anon public" key (NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)

### Step 3: Create Environment Variables

Create a `.env.local` file in the root directory:

```env
# Database (Supabase PostgreSQL connection string)
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@[PROJECT-REF].supabase.co:5432/postgres

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://[PROJECT-REF].supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-anon-key-here

# Auth.js Secret (generate with: openssl rand -base64 32)
AUTH_SECRET=your-generated-secret-here
```

**To generate AUTH_SECRET:**
```bash
# On Mac/Linux:
openssl rand -base64 32

# On Windows (PowerShell):
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

### Step 4: Set Up Database Tables

You have two options:

#### Option A: Using Drizzle Kit (Recommended)

```bash
# Generate migration files
npx drizzle-kit generate

# Push schema to database
npx drizzle-kit push
```

#### Option B: Manual SQL (Alternative)

Run this SQL in Supabase SQL Editor:

```sql
-- Create Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone VARCHAR(20) NOT NULL,
  password TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create Children table
CREATE TABLE IF NOT EXISTS children (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  date_of_birth DATE NOT NULL,
  birth_certificate_url TEXT,
  birth_certificate_verified BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_children_user_id ON children(user_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
```

### Step 5: Test Locally

```bash
# Start the development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) and test:
1. Sign up with a new account
2. Login with your credentials
3. Add a child (birth certificate verification will be pending)

### Step 6: Deploy to Vercel

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Initial setup"
   git push origin main
   ```

2. **Import to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "Add New Project"
   - Import your GitHub repository
   - Vercel will auto-detect Next.js

3. **Add Environment Variables in Vercel**
   - In project settings, go to "Environment Variables"
   - Add all variables from your `.env.local`:
     - `DATABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
     - `AUTH_SECRET`

4. **Deploy**
   - Click "Deploy"
   - Wait for build to complete
   - Your app will be live!

## 🔐 Verification System

### Manual Verification Process

Currently, birth certificate verification is manual. To verify a child:

1. **Access Supabase Dashboard**
   - Go to Table Editor → `children` table
   - Find the child record
   - Update `birth_certificate_verified` to `true`

2. **Or Use SQL:**
   ```sql
   UPDATE children 
   SET birth_certificate_verified = true 
   WHERE id = 'child-uuid-here';
   ```

### Future: Automated Verification

You can add an admin panel or API endpoint for verification:
- Create an admin role in the users table
- Build an admin dashboard
- Add verification API endpoint

## 📁 Project Structure

```
child-immunization-college/
├── app/
│   ├── api/
│   │   ├── auth/[...nextauth]/    # Auth.js routes
│   │   ├── children/               # Child management API
│   │   └── users/                  # User signup API
│   ├── chart/                      # Vaccination chart (verified only)
│   ├── dashboard/                  # User dashboard
│   ├── login/                      # Login page
│   ├── map/                        # Hospital finder
│   └── signup/                     # Signup page
├── components/
│   ├── Map.tsx                     # Hospital map
│   ├── SessionProvider.tsx         # Auth provider
│   └── VaccineAccordion.tsx       # Vaccination schedule
├── src/
│   └── db/
│       ├── schema.ts              # Drizzle schema
│       └── index.ts                # DB connection
├── auth.config.ts                 # Auth.js config
├── auth.ts                         # Auth.js exports
└── middleware.ts                   # Route protection
```

## ✅ Verification Checklist

Before going live, ensure:

- [ ] All environment variables are set
- [ ] Database tables are created
- [ ] Can sign up new users
- [ ] Can login with credentials
- [ ] Can add children
- [ ] Chart page blocks unverified children
- [ ] Map page works with pincode search
- [ ] All pages have proper UI
- [ ] Mobile responsive design works

## 🐛 Troubleshooting

### Database Connection Issues
- Verify `DATABASE_URL` is correct
- Check Supabase project is active
- Ensure connection pooling is enabled

### Authentication Not Working
- Verify `AUTH_SECRET` is set
- Check Auth.js routes are accessible at `/api/auth/*`
- Clear browser cookies and try again

### Map Not Loading
- Check browser console for errors
- Verify Leaflet CSS is loading
- Ensure pincode is valid (6 digits for India)

### Build Errors on Vercel
- Check all environment variables are set
- Verify Node.js version (should be 18+)
- Check build logs for specific errors

## 📞 Support

If you encounter issues:
1. Check the error logs in Vercel
2. Verify all environment variables
3. Ensure database tables exist
4. Check Supabase dashboard for connection issues

## 🎉 You're All Set!

Your Child Immunization Tracker is now ready to use. Parents can:
- Register and login securely
- Add their children
- Upload birth certificates
- View vaccination schedules (after verification)
- Find nearby hospitals

Happy coding! 🚀

