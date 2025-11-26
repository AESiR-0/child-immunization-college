# Supabase Storage Setup for Birth Certificates

## Step 1: Create Storage Bucket in Supabase

1. Go to your Supabase Dashboard
2. Navigate to **Storage** in the left sidebar
3. Click **"New bucket"**
4. Configure the bucket:
   - **Name**: `birth-certificates`
   - **Public bucket**: ❌ **Unchecked** (Keep it private for security)
   - **File size limit**: 5 MB (or your preferred limit)
   - **Allowed MIME types**: 
     - `image/jpeg`
     - `image/jpg`
     - `image/png`
     - `image/webp`
     - `application/pdf`
5. Click **"Create bucket"**

## Step 2: Set Up Storage Policies

After creating the bucket, you need to set up Row Level Security (RLS) policies:

### Policy 1: Allow authenticated users to upload
1. Go to **Storage** → **Policies** → `birth-certificates`
2. Click **"New Policy"**
3. Choose **"For full customization"**
4. Policy name: `Allow authenticated uploads`
5. Allowed operation: `INSERT`
6. Policy definition:
```sql
(bucket_id = 'birth-certificates'::text) AND (auth.role() = 'authenticated'::text)
```
7. Click **"Review"** then **"Save policy"**

### Policy 2: Allow users to read their own files
1. Click **"New Policy"** again
2. Policy name: `Allow users to read own files`
3. Allowed operation: `SELECT`
4. Policy definition:
```sql
(bucket_id = 'birth-certificates'::text) AND (auth.role() = 'authenticated'::text) AND ((storage.foldername(name))[1] = auth.uid()::text)
```
5. Click **"Review"** then **"Save policy"**

### Policy 3: Allow users to delete their own files (optional)
1. Click **"New Policy"** again
2. Policy name: `Allow users to delete own files`
3. Allowed operation: `DELETE`
4. Policy definition:
```sql
(bucket_id = 'birth-certificates'::text) AND (auth.role() = 'authenticated'::text) AND ((storage.foldername(name))[1] = auth.uid()::text)
```
5. Click **"Review"** then **"Save policy"**

## Step 3: Alternative - Public Bucket (Less Secure)

If you want a simpler setup (less secure), you can:

1. Create bucket with **"Public bucket"** checked
2. This allows anyone with the URL to access files
3. Files are organized by user ID in folders

**Note**: This is less secure as anyone with the URL can access the file.

## Step 4: Update Environment Variables

Make sure you have these in your `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
```

## Step 5: Test the Upload

1. Go to your dashboard
2. Try adding a child with a birth certificate
3. Check Supabase Storage → `birth-certificates` bucket
4. You should see files organized by user ID

## File Structure

Files are stored as:
```
birth-certificates/
  └── {userId}/
      └── {timestamp}-{random}.{ext}
```

Example:
```
birth-certificates/
  └── 123e4567-e89b-12d3-a456-426614174000/
      └── 1703123456789-abc123.pdf
```

## Security Notes

- Files are stored in user-specific folders
- Only authenticated users can upload
- Users can only access their own files (with proper RLS policies)
- File size is limited to 5MB
- Only specific file types are allowed

## Troubleshooting

### "Bucket not found" error
- Make sure the bucket name is exactly `birth-certificates`
- Check that the bucket exists in Supabase Storage

### "Permission denied" error
- Check RLS policies are set up correctly
- Verify the user is authenticated
- Check bucket permissions

### "File too large" error
- Increase file size limit in bucket settings
- Or reduce the max size in the API route

### Files not appearing
- Check bucket is not empty
- Verify upload was successful (check response)
- Check browser console for errors

