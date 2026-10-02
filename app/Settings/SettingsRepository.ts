import type { StoredValue } from '@app/Storage/StoredValue';
import type { AutoConfig } from './Data/AutoConfig';
import type { Theme } from './Data/Theme';

/**
 * Persisted user settings: auto-configuration toggles and theme.
 */
export class SettingsRepository {
  private readonly autoConfigValue: StoredValue<AutoConfig>;
  private readonly themeValue: StoredValue<Theme>;

  constructor(autoConfigValue: StoredValue<AutoConfig>, themeValue: StoredValue<Theme>) {
    this.autoConfigValue = autoConfigValue;
    this.themeValue = themeValue;
  }

  autoConfig(): AutoConfig {
    return this.autoConfigValue.get();
  }

  saveAutoConfig(config: AutoConfig): void {
    this.autoConfigValue.set(config);
  }

  /** Notified on local saves and on saves from other tabs. Returns the unsubscribe function. */
  onAutoConfigChange(listener: (config: AutoConfig) => void): () => void {
    return this.autoConfigValue.subscribe(listener);
  }

  theme(): Theme {
    return this.themeValue.get();
  }

  saveTheme(theme: Theme): void {
    this.themeValue.set(theme);
  }
}
