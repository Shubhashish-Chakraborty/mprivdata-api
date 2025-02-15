import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

// Load the encryption key from the environment
const ENCRYPTION_KEY = Buffer.from(process.env.ENCRYPTION_KEY || '', 'utf8');

// Ensure the key is 32 bytes long
if (ENCRYPTION_KEY.length !== 32) {
    throw new Error('Encryption key must be 32 bytes long');
}

const IV_LENGTH = 16; // AES block size

// Encrypt function
export const encrypt = (text: string): string => {
    const iv = crypto.randomBytes(IV_LENGTH); // Generate a random IV
    const cipher = crypto.createCipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return `${iv.toString('hex')}:${encrypted}`; // Prepend IV to the encrypted text
}

// Decrypt function
export const decrypt = (encryptedText: string): string => {
    const [ivHex, encrypted] = encryptedText.split(':'); // Split IV and encrypted text
    if (!ivHex || !encrypted) {
        throw new Error('Invalid encrypted text format');
    }
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}