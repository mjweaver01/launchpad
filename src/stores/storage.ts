import type { CacheEntry } from './types';

const STORAGE_PREFIX = 'launchpad_';

export class CacheStorage {
  private static isStorageAvailable(): boolean {
    try {
      const test = '__storage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }

  private static getStorageKey(key: string): string {
    return `${STORAGE_PREFIX}${key}`;
  }

  static set<T>(key: string, entry: CacheEntry<T>): void {
    if (!this.isStorageAvailable()) {
      console.warn('localStorage is not available');
      return;
    }

    try {
      const storageKey = this.getStorageKey(key);
      const serialized = JSON.stringify(entry);
      localStorage.setItem(storageKey, serialized);
    } catch (error) {
      console.warn('Failed to store cache entry:', error);
    }
  }

  static get<T>(key: string): CacheEntry<T> | null {
    if (!this.isStorageAvailable()) {
      return null;
    }

    try {
      const storageKey = this.getStorageKey(key);
      const serialized = localStorage.getItem(storageKey);

      if (!serialized) {
        return null;
      }

      const entry: CacheEntry<T> = JSON.parse(serialized);

      // Check if cache has expired
      if (Date.now() >= entry.expiresAt) {
        this.remove(key);
        return null;
      }

      return entry;
    } catch (error) {
      console.warn('Failed to retrieve cache entry:', error);
      this.remove(key); // Remove corrupted entry
      return null;
    }
  }

  static remove(key: string): void {
    if (!this.isStorageAvailable()) {
      return;
    }

    try {
      const storageKey = this.getStorageKey(key);
      localStorage.removeItem(storageKey);
    } catch (error) {
      console.warn('Failed to remove cache entry:', error);
    }
  }

  static clear(): void {
    if (!this.isStorageAvailable()) {
      return;
    }

    try {
      const keysToRemove: string[] = [];

      // Find all keys with our prefix
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(STORAGE_PREFIX)) {
          keysToRemove.push(key);
        }
      }

      // Remove all our cache entries
      keysToRemove.forEach(key => localStorage.removeItem(key));
    } catch (error) {
      console.warn('Failed to clear cache:', error);
    }
  }

  static clearExpired(): void {
    if (!this.isStorageAvailable()) {
      return;
    }

    try {
      const keysToRemove: string[] = [];
      const now = Date.now();

      // Find all expired keys with our prefix
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(STORAGE_PREFIX)) {
          try {
            const serialized = localStorage.getItem(key);
            if (serialized) {
              const entry = JSON.parse(serialized);
              if (now >= entry.expiresAt) {
                keysToRemove.push(key);
              }
            }
          } catch {
            // Remove corrupted entries
            keysToRemove.push(key);
          }
        }
      }

      // Remove expired entries
      keysToRemove.forEach(key => localStorage.removeItem(key));
    } catch (error) {
      console.warn('Failed to clear expired cache:', error);
    }
  }

  // Get cache info for debugging
  static getCacheInfo(): { keys: string[]; totalSize: number } {
    if (!this.isStorageAvailable()) {
      return { keys: [], totalSize: 0 };
    }

    const keys: string[] = [];
    let totalSize = 0;

    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(STORAGE_PREFIX)) {
          keys.push(key.replace(STORAGE_PREFIX, ''));
          const value = localStorage.getItem(key);
          if (value) {
            totalSize += value.length;
          }
        }
      }
    } catch (error) {
      console.warn('Failed to get cache info:', error);
    }

    return { keys, totalSize };
  }
}
