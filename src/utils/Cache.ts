type CacheEntry<T> = {
    value: T;
    expiry: number;
  };
  
export class Cache<T> {
    private cache: Map<string, CacheEntry<T>>;
    private ttl: number; // Time to live in milliseconds
  
    constructor(ttl: number = 300000) { // default ttl = 5 minute
      this.cache = new Map();
      this.ttl = ttl;
    }
  
    set(key: string, value: T) {
      const expiry = Date.now() + this.ttl;
      this.cache.set(key, { value, expiry });
    }
  
    get(key: string): T | null {
      const cacheEntry = this.cache.get(key);
  
      if (!cacheEntry) {
        return null;
      }
  
      if (cacheEntry.expiry < Date.now()) {
        this.cache.delete(key); // Expired, remove from cache
        return null;
      }
  
      return cacheEntry.value;
    }
  
    delete(key: string) {
      this.cache.delete(key);
    }
  
    clear() {
      this.cache.clear();
    }
  }