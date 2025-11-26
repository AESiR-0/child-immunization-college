/**
 * Database connection
 * Uses postgres-js for Node.js runtime
 * For Edge runtime, use src/db/edge.ts instead
 */
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set');
}

// Use postgres-js for Node.js runtime
// Note: For Edge runtime routes, use Supabase client directly
const client = postgres(process.env.DATABASE_URL, {
  max: 1,
});

export const db = drizzle(client, { schema });
