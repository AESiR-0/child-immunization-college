import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/src/db/edge';

// Use Edge runtime
export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: 'Verification token is required' },
        { status: 400 }
      );
    }

    // Find user with this token
    const { data: user, error: findError } = await supabase
      .from('users')
      .select('*')
      .eq('email_verification_token', token)
      .single();

    if (findError || !user) {
      return NextResponse.json(
        { error: 'Invalid or expired verification token' },
        { status: 400 }
      );
    }

    // Check if token is expired
    if (user.email_verification_expires) {
      const expiresAt = new Date(user.email_verification_expires);
      if (expiresAt < new Date()) {
        return NextResponse.json(
          { error: 'Verification token has expired' },
          { status: 400 }
        );
      }
    }

    // Verify the email
    const { error: updateError } = await supabase
      .from('users')
      .update({
        email_verified: true,
        email_verification_token: null,
        email_verification_expires: null,
      })
      .eq('id', user.id);

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json(
      { message: 'Email verified successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Email verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

