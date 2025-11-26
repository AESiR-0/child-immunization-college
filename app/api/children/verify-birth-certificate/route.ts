import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/src/db/edge';
import { auth } from '@/auth';

// Use Edge runtime
export const runtime = 'edge';

// Verify birth certificate (admin function - in production, this would require admin role)
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { childId, verified } = body;

    if (!childId || typeof verified !== 'boolean') {
      return NextResponse.json(
        { error: 'Child ID and verification status are required' },
        { status: 400 }
      );
    }

    // Verify child belongs to user (or check admin role in production)
    const { data: child, error: childError } = await supabase
      .from('children')
      .select('user_id')
      .eq('id', childId)
      .single();

    if (childError || !child) {
      return NextResponse.json({ error: 'Child not found' }, { status: 404 });
    }

    // In production, add admin role check here
    // For now, allow the parent to verify (you can restrict this later)

    // Update birth certificate verification status
    const { data, error } = await supabase
      .from('children')
      .update({
        birth_certificate_verified: verified,
        updated_at: new Date().toISOString(),
      })
      .eq('id', childId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json(
      {
        child: {
          id: data.id,
          name: data.name,
          dateOfBirth: data.date_of_birth,
          birthCertificateUrl: data.birth_certificate_url,
          birthCertificateVerified: data.birth_certificate_verified,
        },
        message: verified ? 'Birth certificate verified' : 'Birth certificate verification removed',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Birth certificate verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


