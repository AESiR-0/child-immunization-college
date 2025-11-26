import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/src/db/edge';
import { auth } from '@/auth';

// Use Edge runtime
export const runtime = 'edge';

// Get vaccine records for a child
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const childId = searchParams.get('childId');

    if (!childId) {
      return NextResponse.json(
        { error: 'Child ID is required' },
        { status: 400 }
      );
    }

    // Verify child belongs to user
    const { data: child, error: childError } = await supabase
      .from('children')
      .select('user_id')
      .eq('id', childId)
      .single();

    if (childError || !child || child.user_id !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Get vaccine records
    const { data: records, error } = await supabase
      .from('vaccine_records')
      .select('*')
      .eq('child_id', childId)
      .order('age_milestone', { ascending: true })
      .order('sequence_order', { ascending: true });

    if (error) {
      throw error;
    }

    return NextResponse.json({ records: records || [] }, { status: 200 });
  } catch (error) {
    console.error('Get vaccine records error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Create or update vaccine record
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { childId, vaccineName, vaccineCategory, status, ageMilestone, sequenceOrder, takenDate, proofUrl } = body;

    if (!childId || !vaccineName || !ageMilestone || !sequenceOrder) {
      return NextResponse.json(
        { error: 'Child ID, vaccine name, age milestone, and sequence order are required' },
        { status: 400 }
      );
    }

    // Verify child belongs to user
    const { data: child, error: childError } = await supabase
      .from('children')
      .select('user_id')
      .eq('id', childId)
      .single();

    if (childError || !child || child.user_id !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Check if record exists
    const { data: existing } = await supabase
      .from('vaccine_records')
      .select('id')
      .eq('child_id', childId)
      .eq('vaccine_name', vaccineName)
      .single();

    if (existing) {
      // Update existing record
      const updateData: any = {
        status: status || 'pending',
        taken_date: takenDate || null,
        updated_at: new Date().toISOString(),
      };
      
      if (proofUrl !== undefined) {
        updateData.proof_url = proofUrl;
        updateData.proof_verified = false; // Reset verification when new proof is uploaded
      }

      const { data, error } = await supabase
        .from('vaccine_records')
        .update(updateData)
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({ record: data }, { status: 200 });
    } else {
      // Create new record
      const insertData: any = {
        child_id: childId,
        vaccine_name: vaccineName,
        vaccine_category: vaccineCategory || 'general',
        status: status || 'pending',
        age_milestone: ageMilestone,
        sequence_order: sequenceOrder,
        taken_date: takenDate || null,
      };

      if (proofUrl) {
        insertData.proof_url = proofUrl;
        insertData.proof_verified = false;
      }

      const { data, error } = await supabase
        .from('vaccine_records')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({ record: data }, { status: 201 });
    }
  } catch (error) {
    console.error('Vaccine record error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

