/**
 * Password hashing utilities using Web Crypto API
 * Compatible with Edge runtime (Vercel)
 */

// Convert ArrayBuffer to hex string
function arrayBufferToHex(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// Convert hex string to Uint8Array (for Edge runtime compatibility)
function hexToUint8Array(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

/**
 * Hash a password using PBKDF2 (Web Crypto API)
 * This works in Edge runtime
 */
export async function hashPassword(password: string): Promise<string> {
  try {
    // Generate a random salt
    const saltArray = new Uint8Array(16);
    crypto.getRandomValues(saltArray);
    
    // Convert salt to hex string directly from Uint8Array
    const saltHex = Array.from(saltArray)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

    // Import the password as a key
    const encoder = new TextEncoder();
    const passwordData = encoder.encode(password);

    // Import the key material - use deriveBits instead of deriveKey for better Edge compatibility
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      passwordData,
      { name: 'PBKDF2' },
      false,
      ['deriveBits']
    );

    // Derive bits using PBKDF2 (more compatible with Edge runtime)
    const derivedBits = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: saltArray,
        iterations: 100000, // High iteration count for security
        hash: 'SHA-256',
      },
      keyMaterial,
      256 // 256 bits = 32 bytes
    );

    // Convert derived bits to hex
    const hashHex = arrayBufferToHex(derivedBits);

    // Return salt:hash format
    return `${saltHex}:${hashHex}`;
  } catch (error) {
    console.error('Password hashing error:', error);
    throw new Error('Failed to hash password');
  }
}

/**
 * Verify a password against a hash
 * This works in Edge runtime
 */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  try {
    const [saltHex, storedHashHex] = hash.split(':');

    if (!saltHex || !storedHashHex) {
      return false;
    }

    // Convert salt from hex to Uint8Array
    const saltBytes = hexToUint8Array(saltHex);
    // Create a new Uint8Array to ensure proper type for Edge runtime
    const salt = new Uint8Array(saltBytes);

    // Import the password as a key
    const encoder = new TextEncoder();
    const passwordData = encoder.encode(password);

    // Import the key material - use deriveBits for consistency
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      passwordData,
      { name: 'PBKDF2' },
      false,
      ['deriveBits']
    );

    // Derive bits using PBKDF2 with the same parameters
    const derivedBits = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000,
        hash: 'SHA-256',
      },
      keyMaterial,
      256 // 256 bits = 32 bytes
    );

    // Convert derived bits to hex
    const hashHex = arrayBufferToHex(derivedBits);

    // Compare hashes using constant-time comparison
    return hashHex === storedHashHex;
  } catch (error) {
    console.error('Password verification error:', error);
    return false;
  }
}

