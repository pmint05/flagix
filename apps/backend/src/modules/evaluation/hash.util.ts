import MurmurHash3 from 'imurmurhash';

export function bucket(flagKey: string, userId: string): number {
  const hash = MurmurHash3(`${flagKey}:${userId}`, 0);
  return hash.result() % 100;
}
