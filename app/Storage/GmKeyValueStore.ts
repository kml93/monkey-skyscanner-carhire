import { GM_addValueChangeListener, GM_getValue, GM_removeValueChangeListener, GM_setValue } from '$';

import { KeyValueStore } from './Contracts/KeyValueStore';
import type { ValueChangeListener } from './Contracts/ValueChangeListener';

/**
 * KeyValueStore backed by the Tampermonkey GM_* value APIs.
 * The only place of the codebase touching GM_* storage functions.
 */
export class GmKeyValueStore extends KeyValueStore {
  get<T>(key: string, fallback: T): T {
    return GM_getValue<T>(key, fallback);
  }

  set(key: string, value: unknown): void {
    GM_setValue(key, value);
  }

  watch(key: string, listener: ValueChangeListener): () => void {
    const listenerId = GM_addValueChangeListener(key, (_key, _oldValue, _newValue, remote) => {
      listener(remote === true);
    });

    return () => GM_removeValueChangeListener(listenerId);
  }
}
