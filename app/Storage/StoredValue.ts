import type { KeyValueStore } from './Contracts/KeyValueStore';

type Listener<T> = (value: T) => void;

/**
 * One storage key exposed as an observable value.
 *
 * Subscribers hear every change through a single channel:
 *   - local writes through set(), notified synchronously;
 *   - writes from other tabs, relayed from the store watcher.
 * The store watcher only exists while at least one subscriber does.
 */
export class StoredValue<T> {
  private readonly store: KeyValueStore;
  private readonly key: string;
  private readonly fallback: T;
  private readonly listeners = new Set<Listener<T>>();
  private stopWatching: (() => void) | null = null;

  constructor(store: KeyValueStore, key: string, fallback: T) {
    this.store = store;
    this.key = key;
    this.fallback = fallback;
  }

  get(): T {
    return this.store.get(this.key, this.fallback);
  }

  set(value: T): void {
    this.store.set(this.key, value);
    this.notify(value);
  }

  /** Returns the unsubscribe function. */
  subscribe(listener: Listener<T>): () => void {
    this.listeners.add(listener);
    this.stopWatching ??= this.store.watch(this.key, (remote) => this.relayRemote(remote));

    return () => this.unsubscribe(listener);
  }

  private unsubscribe(listener: Listener<T>): void {
    this.listeners.delete(listener);
    if (this.listeners.size > 0) return;

    this.stopWatching?.();
    this.stopWatching = null;
  }

  /** Local writes were already notified by set(). */
  private relayRemote(remote: boolean): void {
    if (!remote) return;

    this.notify(this.get());
  }

  private notify(value: T): void {
    this.listeners.forEach((listener) => listener(value));
  }
}
