
import { deriveKey, deriveSigningKey, encryptValue, decryptValue, signRecord, verifyRecord, type EncryptedData } from '../src/lib/security';

// Mock types
interface Hold {
  id: string;
  title: string;
  category: string; // Now encrypted in DB, but decrypted in object
  startDate: Date;
  expectedResolutionDays: number;
  status: string;
  createdAt: Date;
  counterparty: string;
  notes: string;
  followUps: any[];
  resolution?: any;
  _isTampered?: boolean;
}

// Helper to confirm data is encrypted
function isEncryptedData(data: any): data is EncryptedData {
  return data && typeof data.ciphertext === 'string' && typeof data.iv === 'string';
}

async function runTest() {
  console.log('🔒 Starting Full Metadata Encryption verification...');

  // 1. Setup Keys
  const encryptionKey = await deriveKey('password123', 'user123');
  const signingKey = await deriveSigningKey('password123', 'user123');

  // 2. Define Original Data (Plaintext)
  const originalHold: Hold = {
    id: 'hold1',
    title: 'Secret Dispute',
    category: 'finance',
    startDate: new Date('2023-01-01T12:00:00Z'),
    expectedResolutionDays: 14,
    status: 'pending',
    createdAt: new Date('2023-01-01T10:00:00Z'),
    counterparty: 'MegaCorp',
    notes: 'Sensitive internal notes',
    followUps: [],
    resolution: null
  };

  console.log('📝 Original Data:', JSON.stringify(originalHold, null, 2));

  // 3. Simulate Encryption (Write Path - logic from addHold/updateHold)
  console.log('🔄 Encrypting data...');

  // Encrypt main fields
  const encryptedTitle = await encryptValue(originalHold.title, encryptionKey);
  const encryptedCounterparty = await encryptValue(originalHold.counterparty, encryptionKey);
  const encryptedNotes = await encryptValue(originalHold.notes, encryptionKey);

  // Encrypt Metadata
  const encryptedCategory = await encryptValue(originalHold.category, encryptionKey);
  const encryptedStatus = await encryptValue(originalHold.status, encryptionKey);
  const encryptedStartDate = await encryptValue(originalHold.startDate.toISOString(), encryptionKey);
  const encryptedExpectedDays = await encryptValue(String(originalHold.expectedResolutionDays), encryptionKey);
  const encryptedCreatedAt = await encryptValue(originalHold.createdAt.toISOString(), encryptionKey);

  // Construct DB record
  const dbRecord = {
    userId: 'user123',
    title: encryptedTitle,
    counterparty: encryptedCounterparty,
    notes: encryptedNotes,
    category: encryptedCategory,
    status: encryptedStatus,
    startDate: encryptedStartDate,
    expectedResolutionDays: encryptedExpectedDays,
    createdAt: encryptedCreatedAt,
    followUps: [],
    resolution: null
  };

  // 4. Assert Encryption
  const fieldsToCheck = ['category', 'status', 'startDate', 'expectedResolutionDays', 'createdAt'];
  fieldsToCheck.forEach(field => {
    if (!isEncryptedData((dbRecord as any)[field])) {
      throw new Error(`❌ FAIL: ${field} was NOT encrypted in DB record!`);
    }
    console.log(`✅ PASS: ${field} is encrypted.`);
  });

  // 5. Sign Data
  const signature = await signRecord(dbRecord, signingKey);
  const dbRecordSigned = { ...dbRecord, _signature: signature };

  // 6. Simulate Decryption (Read Path - logic from docToHold)
  console.log('🔓 Decrypting data...');

  // Verify signature
  const isValid = await verifyRecord(dbRecord, dbRecordSigned._signature, signingKey);
  if (!isValid) throw new Error('❌ FAIL: Signature verification failed!');
  console.log('✅ PASS: Signature verified.');

  // Decrypt Metadata
  const decryptedCategory = await decryptValue(dbRecord.category, encryptionKey);
  const decryptedStatus = await decryptValue(dbRecord.status, encryptionKey);
  const decryptedStartDateStr = await decryptValue(dbRecord.startDate, encryptionKey);
  const decryptedExpectedDaysStr = await decryptValue(dbRecord.expectedResolutionDays, encryptionKey);
  const decryptedCreatedAtStr = await decryptValue(dbRecord.createdAt, encryptionKey);

  // 7. Assert Decryption
  if (decryptedCategory !== originalHold.category) throw new Error(`Mismatch category: ${decryptedCategory}`);
  if (decryptedStatus !== originalHold.status) throw new Error(`Mismatch status: ${decryptedStatus}`);
  if (decryptedStartDateStr !== originalHold.startDate.toISOString()) throw new Error(`Mismatch startDate: ${decryptedStartDateStr}`);
  if (parseInt(decryptedExpectedDaysStr) !== originalHold.expectedResolutionDays) throw new Error(`Mismatch expectedDays: ${decryptedExpectedDaysStr}`);
  if (decryptedCreatedAtStr !== originalHold.createdAt.toISOString()) throw new Error(`Mismatch createdAt: ${decryptedCreatedAtStr}`);

  console.log('✅ PASS: All metadata decrypted correctly.');
  console.log('🎉 Full Metadata Encryption Verification COMPLETE.');
}

runTest().catch(e => {
  console.error(e);
  process.exit(1);
});
