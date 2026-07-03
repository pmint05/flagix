import { createHash, randomBytes } from 'crypto';
import { BASE62_ALPHABET } from '../constants';

export function hashSdkKey(key: string): string {
  return createHash('sha256').update(key).digest('hex');
}

export function hashSha256(value: string, salt: string): string {
  return createHash('sha256')
    .update(value)
    .update(salt)
    .digest('hex');
}

export function hashUserId(userId: string): string {
  const salt = process.env.EVALUATION_USER_HASH_SALT || 'dev-salt';
  return hashSha256(userId, salt);
}

export function hashClientIp(ip: string): string {
  const salt = process.env.EVALUATION_USER_HASH_SALT || 'dev-salt';
  return hashSha256(ip, salt);
}

export function generateRawKey(length = 32): string {
  const bytes = randomBytes(length);
  let result = '';
  for (let i = 0; i < length; i++) {
    result += BASE62_ALPHABET[bytes[i] % 62];
  }
  return `fkx_${result}`;
}
