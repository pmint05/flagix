import { BASE62_ALPHABET } from '../constants';

export function generateInitialPriority(): string {
  return 'm';
}

export function generatePriorityBetween(a: string, b: string): string {
  if (a >= b) {
    throw new Error(`Invalid order: "${a}" must be less than "${b}"`);
  }

  const aPadded = a.padEnd(b.length + 1, '0');
  const bPadded = b.padEnd(a.length + 1, '0');

  let result = '';
  for (let i = 0; i < aPadded.length; i++) {
    const aChar = aPadded[i] ?? '0';
    const bChar = bPadded[i] ?? '0';
    const aIdx = BASE62_ALPHABET.indexOf(aChar);
    const bIdx = BASE62_ALPHABET.indexOf(bChar);

    if (aIdx === -1 || bIdx === -1) {
      throw new Error(`Invalid character in priority string`);
    }

    if (bIdx - aIdx > 1) {
      const midIdx = Math.floor((aIdx + bIdx) / 2);
      return result + BASE62_ALPHABET[midIdx];
    }

    result += aChar;
  }

  return result + BASE62_ALPHABET[Math.floor(BASE62_ALPHABET.length / 2)];
}

export function generatePriorityAfter(last: string): string {
  const lastChar = last[last.length - 1];
  const lastIdx = BASE62_ALPHABET.indexOf(lastChar);

  if (lastIdx === -1) {
    throw new Error(`Invalid character in priority string`);
  }

  if (lastIdx < BASE62_ALPHABET.length - 2) {
    return last.slice(0, -1) + BASE62_ALPHABET[lastIdx + 1];
  }

  return last + BASE62_ALPHABET[Math.floor(BASE62_ALPHABET.length / 2)];
}
