import { createHash, randomBytes } from 'crypto';
import { BASE62_ALPHABET } from '../constants';



export function hashSdkKey(key: string): string {
  return createHash('sha256').update(key).digest('hex');
}

export function generateRawKey(length = 32): string {
  const bytes = randomBytes(length);
  let result = '';
  for (let i = 0; i < length; i++) {
    result += BASE62_ALPHABET[bytes[i] % 62];
  }
  return `fkx_${result}`;
}
