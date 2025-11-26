# Email Verification Setup Guide

## Overview

Email verification has been implemented to ensure users verify their email addresses before accessing the application.

## How It Works

1. **Signup**: User creates account → Verification token generated → Email sent
2. **Verification**: User clicks link in email → Token verified → Email marked as verified
3. **Login**: System checks if email is verified → Only verified users can login

## Database Schema

New fields added to `users` table:
- `email_verified` (boolean) - Whether email is verified
- `email_verification_token` (text) - Unique token for verification
- `email_verification_expires` (timestamp) - Token expiration (24 hours)

## Setup Email Service

### Option 1: Resend (Recommended)

1. **Sign up at [resend.com](https://resend.com)**
2. **Get API Key** from dashboard
3. **Add to environment variables**:
   ```env
   RESEND_API_KEY=re_xxxxxxxxxxxxx
   ```
4. **Update `utils/email.ts`**:
   - Uncomment the Resend code
   - Update `from` email to your verified domain
   - Update email template as needed

### Option 2: SendGrid

1. **Sign up at [sendgrid.com](https://sendgrid.com)**
2. **Get API Key**
3. **Add to environment variables**:
   ```env
   SENDGRID_API_KEY=SG.xxxxxxxxxxxxx
   ```
4. **Update `utils/email.ts`** to use SendGrid API

### Option 3: Supabase Email (Built-in)

Supabase has built-in email functionality. You can configure it in Supabase dashboard:
- Go to Authentication → Email Templates
- Configure SMTP settings
- Use Supabase's email service

### Option 4: Other Services

- AWS SES
- Mailgun
- Postmark
- Any SMTP service

## Environment Variables

Add to `.env.local`:
```env
# App URL (for verification links)
NEXT_PUBLIC_APP_URL=https://your-domain.com

# Email service (choose one)
RESEND_API_KEY=your_resend_key
# OR
SENDGRID_API_KEY=your_sendgrid_key
```

## Migration

Run this SQL in Supabase to add email verification fields:

```sql
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS email_verification_token TEXT,
ADD COLUMN IF NOT EXISTS email_verification_expires TIMESTAMP;

-- Create index for faster token lookups
CREATE INDEX IF NOT EXISTS idx_users_verification_token 
ON users(email_verification_token);
```

Or use Drizzle:
```bash
npx drizzle-kit generate
npx drizzle-kit push
```

## Testing

### Development Mode

Currently, verification emails are logged to console. Check your terminal for:
```
=== EMAIL VERIFICATION ===
To: user@example.com
Verification Link: http://localhost:3000/verify-email?token=...
==========================
```

### Production Mode

1. Configure email service (Resend, SendGrid, etc.)
2. Update `utils/email.ts` to use real email service
3. Test signup flow
4. Check email inbox for verification link
5. Click link to verify
6. Try logging in

## User Flow

1. **User signs up** → Account created, verification email sent
2. **User receives email** → Clicks verification link
3. **Verification page** → Shows success/error
4. **User logs in** → System checks `email_verified = true`

## Security Features

- ✅ Tokens expire after 24 hours
- ✅ Tokens are cryptographically secure (Web Crypto API)
- ✅ One-time use tokens
- ✅ Email verification required for login
- ✅ Invalid tokens rejected

## Customization

### Email Template

Edit `utils/email.ts` to customize:
- Email subject
- Email body HTML
- Verification link format
- Expiration time

### Verification Page

Edit `app/verify-email/page.tsx` to customize:
- Success/error messages
- Redirect behavior
- UI styling

## Troubleshooting

### Email Not Sending
- Check email service API key
- Verify domain/email is verified in service
- Check console for errors
- Ensure `NEXT_PUBLIC_APP_URL` is set correctly

### Token Not Working
- Check token hasn't expired (24 hours)
- Verify token matches in database
- Check database connection

### Users Can't Login
- Verify `email_verified = true` in database
- Check login error messages
- Ensure verification was successful

## Next Steps

1. Choose email service (Resend recommended)
2. Add API key to environment variables
3. Update `utils/email.ts` with service code
4. Run database migration
5. Test signup → verification → login flow

