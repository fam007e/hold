import { deriveKey, deriveSigningKey, encryptValue, decryptValue, signRecord, verifyRecord } from '../src/lib/security.ts';
import assert from 'assert';

async function runTests() {
  console.log('🔒 Starting Security Verification Tests...\n');

  try {
    const password = 'correct-horse-battery-staple';
    const uid = 'user_12345';

    // 1. Key Derivation
    console.log('🔑 Testing Key Derivation...');
    const encKey = await deriveKey(password, uid);
    const signKey = await deriveSigningKey(password, uid);

    // Ensure keys are different
    assert.notDeepEqual(encKey, signKey, 'Encryption and Signing keys should be different derived keys');
    console.log('✅ Keys derived successfully and are distinct.');

    // 2. Encryption / Decryption
    console.log('\n📝 Testing Encryption/Decryption...');
    const originalText = "Sensitive PII Data: 123-456-7890";
    const encrypted = await encryptValue(originalText, encKey);

    console.log(`   Ciphertext: ${encrypted.ciphertext.substring(0, 20)}...`);
    console.log(`   IV: ${encrypted.iv}`);

    const decrypted = await decryptValue(encrypted, encKey);
    assert.strictEqual(decrypted, originalText, 'Decrypted text must match original');
    console.log('✅ Encryption/Decryption roundtrip successful.');

    // 3. Signing / Verification
    console.log('\n✍️  Testing HMAC Signing...');
    const record = {
      id: 'hold_1',
      title: 'Encrypted Title Blob',
      amount: 500,
      notes: null
    };

    const signature = await signRecord(record, signKey);
    console.log(`   Signature: ${signature}`);

    const isValid = await verifyRecord(record, signature, signKey);
    assert.strictEqual(isValid, true, 'Signature should be valid for untampered data');
    console.log('✅ Signature verified successfully.');

    // 4. Tamper Resistance
    console.log('\n😈 Testing Tamper Resistance...');
    const tamperedRecord = { ...record, amount: 999999 }; // Change amount
    const isTamperedValid = await verifyRecord(tamperedRecord, signature, signKey);

    assert.strictEqual(isTamperedValid, false, 'Signature MUST fail for tampered data');
    console.log('✅ Tampered data correctly rejected.');

    // 5. Reordering Fields (Canonicalization Check)
    console.log('\n🔄 Testing Canonicalization (Field Reordering)...');
    const reorderedRecord = {
      amount: 500, // Amount first now
      notes: null,
      id: 'hold_1',
      title: 'Encrypted Title Blob',
    };
    const isReorderedValid = await verifyRecord(reorderedRecord, signature, signKey);
    assert.strictEqual(isReorderedValid, true, 'Signature should be valid regardless of field order (JSON canonicalization)');
    console.log('✅ Field reordering handled correctly (Canonicalization works).');

    // 6. Attachment Metadata Encryption (Mock Test)
    console.log('\nQw Testing Attachment Metadata Encryption...');
    const attachment = {
      id: 'att_1',
      name: 'medical_report.pdf',
      type: 'application/pdf'
    };

    // Encrypt
    const encryptedAtt = {
      ...attachment,
      name: await encryptValue(attachment.name, encKey),
      type: await encryptValue(attachment.type, encKey)
    };

    assert.notStrictEqual(encryptedAtt.name, attachment.name, 'Name should be encrypted');
    console.log(`   Encrypted Name (preview): ${(encryptedAtt.name as any).ciphertext.substring(0, 15)}...`);

    // Decrypt
    const decryptedAtt = {
      ...encryptedAtt,
      name: await decryptValue(encryptedAtt.name as any, encKey),
      type: await decryptValue(encryptedAtt.type as any, encKey)
    };

    assert.strictEqual(decryptedAtt.name, attachment.name, 'Decrypted name must match');
    assert.strictEqual(decryptedAtt.type, attachment.type, 'Decrypted type must match');
    console.log('✅ Attachment metadata encryption/decryption successful.');

    console.log('\n🎉 ALL SECURITY TESTS PASSED!');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ TEST FAILED:', error);
    process.exit(1);
  }
}

runTests();
