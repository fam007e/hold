/**
 * Security Utilities using Web Crypto API
 * Implements Client-Side Encryption (AES-GCM) and Signing (HMAC)
 */

// Configuration
const PBKDF2_ITERATIONS = 600000;
const SALT_FIXED_PREFIX = "HOLD_APP_SECURE_SALT_v1_"; // Combined with UID for per-user salt

export interface EncryptedData {
  ciphertext: string; // Base64
  iv: string; // Base64
}

export interface SignedRecord<T> {
  data: T;
  signature: string; // Base64 HMAC
}

// Convert string to ArrayBuffer
function str2ab(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

// Convert ArrayBuffer to string
function ab2str(buf: ArrayBuffer): string {
  return new TextDecoder().decode(buf);
}

// Cross-platform crypto compatibility
const crypto = globalThis.crypto;

// Helper for Base64 (works in Browser and Node)
function toBase64(buffer: ArrayBuffer): string {
  if (typeof window !== 'undefined') {
    let binary = "";
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  } else {
    return Buffer.from(buffer).toString('base64');
  }
}

function fromBase64(base64: string): Uint8Array {
  if (typeof window !== 'undefined') {
    const binary_string = window.atob(base64);
    const len = binary_string.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binary_string.charCodeAt(i);
    }
    return bytes;
  } else {
    return new Uint8Array(Buffer.from(base64, 'base64'));
  }
}

// Convert ArrayBuffer to Base64
function ab2base64(buf: ArrayBuffer): string {
  return toBase64(buf);
}

// Convert Base64 to ArrayBuffer
function base642ab(base64: string): Uint8Array {
  return fromBase64(base64);
}

/**
 * Derive a master key from the user's password and UID (used as salt)
 */
export async function deriveKey(password: string, uid: string): Promise<CryptoKey> {
  const salt = str2ab(`${SALT_FIXED_PREFIX}${uid}`);
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    str2ab(password) as any,
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt as any,
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false, // Key not exportable
    ["encrypt", "decrypt"]
  );
}

/**
 * Derive a signing key from the master AES key (conceptually, or just derive from password again with different info)
 * To keep it simple, we'll derive a separate keyset from password.
 */
export async function deriveSigningKey(password: string, uid: string): Promise<CryptoKey> {
  const salt = str2ab(`${SALT_FIXED_PREFIX}${uid}_SIGNING`);
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    str2ab(password) as any,
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt as any,
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

/**
 * Encrypt a string value
 */
export async function encryptValue(text: string, key: CryptoKey): Promise<EncryptedData> {
  const encoded = str2ab(text);
  return encryptBuffer(encoded, key);
}

/**
 * Encrypt a buffer (binary data)
 */
export async function encryptBuffer(data: any, key: CryptoKey): Promise<EncryptedData> {
  const iv = crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV for GCM

  const ciphertext = await crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv as any,
    },
    key,
    data as any
  );

  return {
    ciphertext: ab2base64(ciphertext),
    iv: ab2base64(iv.buffer),
  };
}

/**
 * Decrypt a string value
 */
export async function decryptValue(data: EncryptedData, key: CryptoKey): Promise<string> {
  const decrypted = await decryptBuffer(data, key);
  return ab2str(decrypted);
}

/**
 * Decrypt a buffer (binary data)
 */
export async function decryptBuffer(data: EncryptedData, key: CryptoKey): Promise<ArrayBuffer> {
  try {
    const ciphertext = base642ab(data.ciphertext);
    const iv = base642ab(data.iv);

    const decrypted = await crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: iv as any,
      },
      key,
      ciphertext as any
    );

    return decrypted;
  } catch (e) {
    console.error("Decryption failed:", e);
    throw new Error("Failed to decrypt data");
  }
}

/**
 * Sign a record (data object)
 */
export async function signRecord(data: any, key: CryptoKey): Promise<string> {
  // Ordered JSON stringify to ensure consistency
  const canonicalString = JSON.stringify(data, Object.keys(data).sort());
  const encoded = str2ab(canonicalString);

  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoded as any
  );

  return ab2base64(signature);
}

/**
 * Verify a record's signature
 */
export async function verifyRecord(data: any, signature: string, key: CryptoKey): Promise<boolean> {
  const canonicalString = JSON.stringify(data, Object.keys(data).sort());
  const encoded = str2ab(canonicalString);
  const signatureBytes = base642ab(signature);

  return crypto.subtle.verify(
    "HMAC",
    key,
    signatureBytes as any,
    encoded as any
  );
}
