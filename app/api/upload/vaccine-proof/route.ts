import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/src/db/edge';
import { auth } from '@/auth';

// Use Edge runtime
export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const childId = formData.get('childId') as string;
    const vaccineRecordId = formData.get('vaccineRecordId') as string;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    if (!childId || !vaccineRecordId) {
      return NextResponse.json(
        { error: 'Child ID and Vaccine Record ID are required' },
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

    // Verify vaccine record belongs to child
    const { data: vaccineRecord, error: recordError } = await supabase
      .from('vaccine_records')
      .select('child_id')
      .eq('id', vaccineRecordId)
      .single();

    if (recordError || !vaccineRecord || vaccineRecord.child_id !== childId) {
      return NextResponse.json({ error: 'Invalid vaccine record' }, { status: 403 });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only images (JPEG, PNG, WebP) and PDF files are allowed.' },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size too large. Maximum size is 5MB.' },
        { status: 400 }
      );
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${childId}/vaccine-proofs/${vaccineRecordId}-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

    // Convert file to ArrayBuffer for Edge runtime
    const arrayBuffer = await file.arrayBuffer();
    const fileBytes = new Uint8Array(arrayBuffer);

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('vaccine-proofs')
      .upload(fileName, fileBytes, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return NextResponse.json(
        { error: 'Failed to upload file: ' + uploadError.message },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('vaccine-proofs')
      .getPublicUrl(fileName);

    // Update vaccine record with proof URL
    const { error: updateError } = await supabase
      .from('vaccine_records')
      .update({
        proof_url: urlData.publicUrl,
        proof_verified: false, // Needs verification
        updated_at: new Date().toISOString(),
      })
      .eq('id', vaccineRecordId);

    if (updateError) {
      console.error('Update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to update vaccine record' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        url: urlData.publicUrl,
        path: uploadData.path,
        message: 'Proof uploaded successfully. Awaiting verification.',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


