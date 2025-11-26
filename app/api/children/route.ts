import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/src/db/edge';

// Use Edge runtime (default for Vercel)
export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, name, dateOfBirth, birthCertificateUrl } = body;

    if (!userId || !name || !dateOfBirth) {
      return NextResponse.json(
        { error: 'User ID, name, and date of birth are required' },
        { status: 400 }
      );
    }

    const { data: newChild, error } = await supabase
      .from('children')
      .insert({
        user_id: userId,
        name,
        date_of_birth: dateOfBirth,
        birth_certificate_url: birthCertificateUrl || null,
        birth_certificate_verified: false,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Transform to match expected format
    const child = {
      id: newChild.id,
      name: newChild.name,
      dateOfBirth: newChild.date_of_birth,
      birthCertificateUrl: newChild.birth_certificate_url,
      birthCertificateVerified: newChild.birth_certificate_verified,
    };

    return NextResponse.json(
      { child, message: 'Child registered successfully' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Child registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const { data: userChildren, error } = await supabase
      .from('children')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      throw error;
    }

    // Transform to match expected format
    const children = (userChildren || []).map((child: any) => ({
      id: child.id,
      name: child.name,
      dateOfBirth: child.date_of_birth,
      birthCertificateUrl: child.birth_certificate_url,
      birthCertificateVerified: child.birth_certificate_verified,
    }));

    return NextResponse.json({ children }, { status: 200 });
  } catch (error) {
    console.error('Get children error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

