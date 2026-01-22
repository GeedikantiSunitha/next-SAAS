/**
 * Simple in-memory cache utility
 * In production, consider using Redis or another caching solution
 */

interface CacheEntry {
  data: any;
  expiry: number;
}

class SimpleCache {
  private store: Map<string, CacheEntry> = new Map();
  private defaultTTL: number = 5 * 60 * 1000; // 5 minutes

  get(key: string): any {
    const entry = this.store.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiry) {
      this.store.delete(key);
      return null;
    }

    return entry.data;
  }

  set(key: string, value: any, ttl: number = this.defaultTTL): void {
    this.store.set(key, {
      data: value,
      expiry: Date.now() + ttl,
    });
  }

  delete(key: string): boolean {
    return this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }

  has(key: string): boolean {
    const entry = this.store.get(key);
    if (!entry) return false;

    if (Date.now() > entry.expiry) {
      this.store.delete(key);
      return false;
    }

    return true;
  }

  size(): number {
    return this.store.size;
  }
}

export const cache = new SimpleCache();