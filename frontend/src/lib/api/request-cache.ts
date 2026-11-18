// Short-lived, browser-only cache for data shared between screens.
const MAX_AGE_MS = 30_000;
const MAX_ENTRIES = 100;
const values = new Map<string, { value: unknown; expiresAt: number }>();
const pending = new Map<string, Promise<unknown>>();
let generation = 0;

export const clearRequestCache = () => {
  generation += 1;
  values.clear();
  pending.clear();
};

export const cachedRequest = async <T>(
  key: string,
  load: () => Promise<T>
): Promise<T> => {
  if (typeof window === "undefined") return load();

  const cached = values.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.value as T;
  if (cached) values.delete(key);

  const existing = pending.get(key);
  if (existing) return existing as Promise<T>;

  const requestGeneration = generation;
  const request = load();
  pending.set(key, request);
  try {
    const value = await request;
    if (generation === requestGeneration) {
      if (values.size >= MAX_ENTRIES) {
        const oldestKey = values.keys().next().value;
        if (oldestKey !== undefined) values.delete(oldestKey);
      }
      values.set(key, { value, expiresAt: Date.now() + MAX_AGE_MS });
    }
    return value;
  } finally {
    if (pending.get(key) === request) pending.delete(key);
  }
};
