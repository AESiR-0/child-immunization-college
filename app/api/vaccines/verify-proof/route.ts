import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/src/db/edge';
import { auth } from '@/auth';

// Use Edge runtime
export const runtime = 'edge';

// Verify vaccine proof (admin function - in production, this would require admin role)
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { vaccineRecordId, verified } = body;

    if (!vaccineRecordId || typeof verified !== 'boolean') {
      return NextResponse.json(
        { error: 'Vaccine record ID and verification status are required' },
        { status: 400 }
      );
    }

    // Verify vaccine record exists and get child info
    const { data: vaccineRecord, error: recordError } = await supabase
      .from('vaccine_records')
      .select('child_id')
      .eq('id', vaccineRecordId)
      .single();

    if (recordError || !vaccineRecord) {
      return NextResponse.json({ error: 'Vaccine record not found' }, { status: 404 });
    }

    // Verify child belongs to user
    const { data: child, error: childError } = await supabase
      .from('children')
      .select('user_id')
      .eq('id', vaccineRecord.child_id)
      .single();

    if (childError || !child || child.user_id !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // In production, add admin role check here
    // For now, allow the parent to verify (you can restrict this later)

    // Update proof verification status
    const { data, error } = await supabase
      .from('vaccine_records')
      .update({
        proof_verified: verified,
        updated_at: new Date().toISOString(),
      })
      .eq('id', vaccineRecordId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json(
      {
        record: data,
        message: verified ? 'Vaccine proof verified' : 'Vaccine proof verification removed',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Vaccine proof verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

