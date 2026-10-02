import type { ValueChangeListener } from './ValueChangeListener';

/**
 * Persistent key/value storage shared across tabs.
 *
 * Abstract class rather than interface so it can serve as the container key.
 */
export abstract class KeyValueStore {
  abstract get<T>(key: string, fallback: T): T;

  abstract set(key: string, value: unknown): void;

  /** Watches a key for local and remote writes. Returns the function removing the watcher. */
  abstract watch(key: string, listener: ValueChangeListener): () => void;
}
