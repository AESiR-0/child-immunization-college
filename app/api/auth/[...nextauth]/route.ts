import { handlers } from '@/auth';

// Use Edge runtime (default for Vercel)
export const runtime = 'edge';

export const { GET, POST } = handlers;

