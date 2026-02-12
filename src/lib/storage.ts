import { ref, uploadBytes, getBytes } from 'firebase/storage';
import { storage } from './firebase';
import { encryptBuffer, decryptBuffer } from './security';
import { Attachment } from './types';
import { User } from 'firebase/auth';

/**
 * Uploads a file to Firebase Storage with Client-Side Encryption
 */
export async function uploadAttachment(
  file: File,
  holdId: string,
  user: User,
  key: CryptoKey
): Promise<Attachment> {
  // 1. Read file as ArrayBuffer
  const buffer = await file.arrayBuffer();

  // 2. Encrypt buffer
  const { ciphertext, iv } = await encryptBuffer(buffer, key);

  // Convert ciphertext (Base64 string) back to specific Blob for upload?
  // No, encryptBuffer returns { ciphertext: string, iv: string }.
  // ciphertext is Base64. We should upload the Base64 string or convert back to binary for efficiency?
  // Storing Base64 inflates size by 33%.
  // Better: encryptBuffer should strictly return ArrayBuffer or Uint8Array if we want efficient storage.
  // But our security.ts returns { ciphertext: string (base64) }.
  // For MVP, uploading the Base64 text file is fine, or we convert back to Blob.
  // Let's convert Base64 back to Blob to store as "binary" (even though it's effectively encrypted randomness).

  const binaryString = window.atob(ciphertext);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  const encryptedBlob = new Blob([bytes], { type: 'application/octet-stream' });

  // 3. Upload to Storage
  // Path: users/{uid}/attachments/{holdId}/{randomId}.enc
  const fileId = crypto.randomUUID();
  const storagePath = `users/${user.uid}/attachments/${holdId}/${fileId}.enc`;
  const storageRef = ref(storage, storagePath);

  await uploadBytes(storageRef, encryptedBlob);

  // 4. Return Metadata
  return {
    id: fileId,
    originalName: file.name, // Keep original name? Or generic? Keeping for now.
    name: file.name,
    type: file.type,
    size: encryptedBlob.size,
    storagePath,
    iv, // Store IV in metadata to decrypt later
    uploadedAt: new Date(),
  };
}

/**
 * Downloads and decrypts an attachment
 */
export async function downloadAttachment(
  attachment: Attachment,
  key: CryptoKey
): Promise<string> {
  const storageRef = ref(storage, attachment.storagePath);

  // 1. Download encrypted blob
  // getBytes is handy for small files (<10MB)
  const encryptedBuffer = await getBytes(storageRef);

  // 2. Decrypt
  // decryptBuffer expects { ciphertext: string (Base64), iv: string }
  // We have arrayBuffer. Need to convert to Base64 to match our security.ts interface
  // (Or refactor security.ts to accept buffers, which we should have done, but let's stick to interface)

  let binary = '';
  const bytes = new Uint8Array(encryptedBuffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const ciphertextBase64 = window.btoa(binary);

  const decryptedBuffer = await decryptBuffer(
    { ciphertext: ciphertextBase64, iv: attachment.iv },
    key
  );

  // 3. Create Blob URL
  const blob = new Blob([decryptedBuffer], { type: attachment.type });
  return URL.createObjectURL(blob);
}
