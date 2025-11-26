# Child Immunization Tracker

A comprehensive web application for parents to track their children's immunization schedules, find nearby hospitals, and manage vaccination records.

## Features

- 🔐 **Secure Authentication** - Using Auth.js (NextAuth.js) with credentials provider
- 👶 **Child Management** - Register children with birth certificate upload
- 📅 **Vaccination Schedule** - Complete immunization chart based on child's age
- 🏥 **Hospital Finder** - Interactive map to locate nearby vaccination centers
- ✅ **Verification System** - Birth certificate verification before accessing charts
- 🎨 **Modern UI** - Beautiful, responsive design with Tailwind CSS

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Database**: Supabase (PostgreSQL) with Drizzle ORM
- **Authentication**: Auth.js (NextAuth.js v5)
- **Styling**: Tailwind CSS
- **Maps**: React Leaflet
- **Deployment**: Vercel

## Prerequisites

- Node.js 18+ and npm
- Supabase account and project
- Vercel account (for deployment)

## Setup Instructions

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd child-immunization-college
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Variables

Create a `.env.local` file in the root directory:

```env
# Database (Supabase PostgreSQL connection string)
DATABASE_URL=postgresql://user:password@host:port/database

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-anon-key

# Auth.js Secret (generate with: openssl rand -base64 32)
AUTH_SECRET=your-generated-secret-here
```

### 4. Database Setup

Run Drizzle migrations to create the database tables:

```bash
# Generate migration
npx drizzle-kit generate

# Apply migration (if using drizzle-kit push)
npx drizzle-kit push
```

Or manually create the tables in Supabase using the schema in `src/db/schema.ts`.

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Database Schema

### Users Table
- `id` (UUID, Primary Key)
- `name` (Text)
- `email` (Text, Unique)
- `phone` (Varchar)
- `password` (Text, Hashed)
- `createdAt`, `updatedAt` (Timestamps)

### Children Table
- `id` (UUID, Primary Key)
- `userId` (UUID, Foreign Key to Users)
- `name` (Text)
- `dateOfBirth` (Date)
- `birthCertificateUrl` (Text, Nullable)
- `birthCertificateVerified` (Boolean, Default: false)
- `createdAt`, `updatedAt` (Timestamps)

## Deployment on Vercel

### 1. Push to GitHub

```bash
git add .
git commit -m "Initial commit"
git push origin main
```

### 2. Deploy on Vercel

1. Go to [Vercel](https://vercel.com)
2. Import your GitHub repository
3. Add environment variables in Vercel project settings:
   - `DATABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - `AUTH_SECRET`
4. Deploy!

### 3. Post-Deployment

After deployment, make sure to:
- Run database migrations if needed
- Verify all environment variables are set correctly
- Test authentication flow

## Project Structure

```
├── app/
│   ├── api/
│   │   ├── auth/[...nextauth]/    # Auth.js API routes
│   │   ├── children/               # Child management API
│   │   └── users/                  # User signup API
│   ├── chart/                      # Vaccination chart page
│   ├── dashboard/                   # User dashboard
│   ├── login/                      # Login page
│   ├── map/                        # Hospital finder page
│   └── signup/                     # Signup page
├── components/
│   ├── Map.tsx                     # Hospital map component
│   ├── SessionProvider.tsx         # Auth session provider
│   └── VaccineAccordion.tsx        # Vaccination schedule component
├── src/
│   └── db/
│       ├── schema.ts               # Drizzle schema
│       └── index.ts                # Database connection
├── auth.config.ts                  # Auth.js configuration
├── auth.ts                         # Auth.js exports
└── middleware.ts                   # Next.js middleware for auth
```

## Usage

1. **Sign Up**: Create an account with name, email, phone, and password
2. **Add Child**: Register your child with name, date of birth, and upload birth certificate
3. **Wait for Verification**: Birth certificate is verified (manual process)
4. **View Chart**: Once verified, access the complete vaccination schedule
5. **Find Hospitals**: Use the map to locate nearby vaccination centers

## Development

### Generate Database Migrations

```bash
npx drizzle-kit generate
```

### View Database Schema

```bash
npx drizzle-kit studio
```

## License

MIT

## Support

For issues and questions, please open an issue on GitHub.
