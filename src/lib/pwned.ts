/**
 * Have I Been Pwned API Client
 * Uses k-Anonymity model:
 * 1. Hashes password with SHA-1
 * 2. Sends first 5 chars to API
 * 3. Checks if the remaining suffix exists in the response
 */

// Calculate SHA-1 digest of a string
async function sha1(str: string): Promise<string> {
  const enc = new TextEncoder();
  const hash = await crypto.subtle.digest('SHA-1', enc.encode(str));
  const hashArray = Array.from(new Uint8Array(hash));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex.toUpperCase();
}

export interface PwnedCheckResult {
  isPwned: boolean;
  count: number;
}

export async function checkPwnedPassword(password: string): Promise<PwnedCheckResult> {
  if (!password) return { isPwned: false, count: 0 };

  try {
    const hash = await sha1(password);
    const prefix = hash.substring(0, 5);
    const suffix = hash.substring(5);

    const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`);
    if (!response.ok) {
      console.warn('HIBP API error:', response.status);
      return { isPwned: false, count: 0 }; // Fail safe (allow signup if API down)
    }

    const text = await response.text();
    const matches = text.split('\n');

    // Look for suffix in response
    // Response format: SUFFIX:COUNT
    const match = matches.find(line => line.startsWith(suffix));

    if (match) {
      const count = parseInt(match.split(':')[1], 10);
      return { isPwned: true, count };
    }

    return { isPwned: false, count: 0 };
  } catch (error) {
    console.error('Error checking password:', error);
    return { isPwned: false, count: 0 };
  }
}
