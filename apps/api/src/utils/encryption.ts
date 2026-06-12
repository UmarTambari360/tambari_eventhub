import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 96-bit IV recommended for GCM

function getKey(): Buffer {
  const hex = process.env['BANK_ENCRYPTION_KEY'];
  if (!hex || hex.length !== 64) {
    throw new Error('BANK_ENCRYPTION_KEY must be a 64-character hex string');
  }
  return Buffer.from(hex, 'hex');
}

/**
 * Encrypts a plaintext string using AES-256-GCM.
 * Returns a hex string in the format: iv:authTag:ciphertext
 */
export function encrypt(plaintext: string): string {
  const key = getKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);

  const authTag = cipher.getAuthTag();

  return [
    iv.toString('hex'),
    authTag.toString('hex'),
    encrypted.toString('hex'),
  ].join(':');
}

/**
 * Decrypts a hex string produced by encrypt().
 */
export function decrypt(encryptedString: string): string {
  const key = getKey();
  const parts = encryptedString.split(':');

  if (parts.length !== 3) {
    throw new Error('Invalid encrypted string format');
  }

  const [ivHex, authTagHex, ciphertextHex] = parts as [string, string, string];

  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const ciphertext = Buffer.from(ciphertextHex, 'hex');

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  return Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]).toString('utf8');
}

/**
 * Masks a bank account number: ****1234
 */
export function maskAccountNumber(accountNumber: string): string {
  if (accountNumber.length < 4) return '****';
  return `****${accountNumber.slice(-4)}`;
}