declare module 'imurmurhash' {
  interface MurmurHash3 {
    hash(key: string): MurmurHash3;
    result(): number;
    reset(seed?: number): MurmurHash3;
  }

  interface MurmurHash3Constructor {
    (key?: string, seed?: number): MurmurHash3;
    new (key?: string, seed?: number): MurmurHash3;
  }

  const MurmurHash3: MurmurHash3Constructor;
  export = MurmurHash3;
}
