const PREFIX = 'e3c_';
const TTL = 30 * 60 * 1000; // 30 min

interface CacheEntry<T> {
  data: T;
  ts: number;
}

export function getCached<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (!raw) return null;
    const entry = JSON.parse(raw) as CacheEntry<T>;
    return entry.data;
  } catch {
    return null;
  }
}

export function setCache<T>(key: string, data: T): void {
  try {
    const entry: CacheEntry<T> = { data, ts: Date.now() };
    localStorage.setItem(PREFIX + key, JSON.stringify(entry));
  } catch { /* quota exceeded, ignore */ }
}

export function isFresh(key: string): boolean {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (!raw) return false;
    const entry = JSON.parse(raw) as CacheEntry<unknown>;
    return Date.now() - entry.ts < TTL;
  } catch {
    return false;
  }
}
