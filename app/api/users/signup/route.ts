import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/src/db/edge';
import { hashPassword } from '@/utils/password';
import { generateVerificationToken, logVerificationToken } from '@/utils/email';

// Use Edge runtime (default for Vercel)
export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, phone, password } = body;

    if (!name || !email || !phone || !password) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .limit(1)
      .maybeSingle();

    // If user exists (not an error, but data returned)
    if (existingUser && !checkError) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }

    // Hash password using Web Crypto API (Edge compatible)
    let hashedPassword: string;
    try {
      hashedPassword = await hashPassword(password);
    } catch (hashError) {
      console.error('Password hashing failed:', hashError);
      return NextResponse.json(
        { error: 'Failed to process password' },
        { status: 500 }
      );
    }

    // Generate verification token
    let verificationToken: string;
    try {
      verificationToken = await generateVerificationToken();
    } catch (tokenError) {
      console.error('Token generation failed:', tokenError);
      return NextResponse.json(
        { error: 'Failed to generate verification token' },
        { status: 500 }
      );
    }
    
    const verificationExpires = new Date();
    verificationExpires.setHours(verificationExpires.getHours() + 24); // 24 hours expiry

    // Create user
    const { data: newUser, error } = await supabase
      .from('users')
      .insert({
        name,
        email,
        phone,
        password: hashedPassword,
        email_verified: false,
        email_verification_token: verificationToken,
        email_verification_expires: verificationExpires.toISOString(),
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Log verification token (email sending disabled - no SMTP)
    logVerificationToken(email, name, verificationToken);

    // Don't return password or token
    const { password: _, email_verification_token: __, ...userWithoutPassword } = newUser;

    return NextResponse.json(
      { 
        user: userWithoutPassword, 
        message: 'User created successfully. Email verification is required before login.',
        requiresVerification: true,
        // In development, you can use this token to verify manually
        verificationToken: process.env.NODE_ENV === 'development' ? verificationToken : undefined
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

