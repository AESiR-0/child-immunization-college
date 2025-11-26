import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/src/db/edge';

// Use Edge runtime
export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Check if user exists and is verified
    const { data: user, error } = await supabase
      .from('users')
      .select('email_verified')
      .eq('email', email)
      .single();

    if (error || !user) {
      return NextResponse.json(
        { verified: false, error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { verified: user.email_verified },
      { status: 200 }
    );
  } catch (error) {
    console.error('Check verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

