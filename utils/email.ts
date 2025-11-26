/**
 * Email verification token utility
 * Uses Web Crypto API for token generation (Edge compatible)
 * 
 * Note: Email sending is disabled. Verification tokens are generated
 * and stored, but emails are not sent. Users can verify manually via
 * admin panel or direct database update.
 */

/**
 * Generate a secure verification token
 */
export async function generateVerificationToken(): Promise<string> {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Get verification URL (for manual verification or future email integration)
 * Email sending is currently disabled - no SMTP configured
 */
export function getVerificationUrl(token: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  return `${baseUrl}/verify-email?token=${token}`;
}

/**
 * Log verification token (for development/debugging)
 * Email sending is disabled - tokens are logged for manual verification
 */
export function logVerificationToken(
  email: string,
  name: string,
  token: string
): void {
  const verificationUrl = getVerificationUrl(token);
  
  console.log('=== EMAIL VERIFICATION TOKEN ===');
  console.log(`User: ${name} (${email})`);
  console.log(`Token: ${token}`);
  console.log(`Verification URL: ${verificationUrl}`);
  console.log('================================');
  console.log('Note: Email sending is disabled.');
  console.log('To verify manually, visit the URL above or update the database.');
}

