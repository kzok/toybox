/**
 * Least-Recently-Used cache powered by es6 Map.
 * @note `V` is barred from holding `undefined`, `null` is left allowed.
 */
// biome-ignore lint/complexity/noBannedTypes: it stands for any value but `undefined`, as intended.
export class LruCache<K, V extends {} | null> {
  private readonly data = new Map<K, V>();
  /**
   * @throws `RangeError` if the capacity is not a positive number
   */
  constructor(readonly capacity: number) {
    // NaN is rejected as well.
    if (!(capacity > 0)) {
      throw new RangeError(`capacity must be greater than 0 but was ${capacity}.`);
    }
  }
  get(key: K): V | undefined {
    const value = this.data.get(key);
    if (value === undefined) return undefined;
    // re-inserting moves the entry last, hence the first key is always the least recent.
    this.data.delete(key);
    this.data.set(key, value);
    return value;
  }
  set(key: K, value: V): void {
    this.data.delete(key);
    // remove overflowed cache.
    if (this.data.size >= this.capacity) {
      const oldest = this.data.keys().next();
      if (!oldest.done) this.data.delete(oldest.value);
    }
    this.data.set(key, value);
  }
  /**
   * @param compute callback to create the value, left uncalled on a hit
   * @returns the cached value, or the computed one after storing it
   */
  getOrCompute(key: K, compute: () => V): V {
    const cached = this.get(key);
    if (cached !== undefined) return cached;
    const value = compute();
    this.set(key, value);
    return value;
  }
}
