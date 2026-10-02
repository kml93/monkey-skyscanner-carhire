import { settingsConfig } from '@config/settings';
import { storageConfig } from '@config/storage';

import { ServiceProvider } from '@app/Foundation/ServiceProvider';
import { KeyValueStore } from '@app/Storage/Contracts/KeyValueStore';
import { StoredValue } from '@app/Storage/StoredValue';
import { SettingsRepository } from './SettingsRepository';

export class SettingsServiceProvider extends ServiceProvider {
  register(): void {
    this.app.singleton(SettingsRepository, (app) => {
      const store = app.make(KeyValueStore);

      return new SettingsRepository(
        new StoredValue(store, storageConfig.keys.autoConfig, settingsConfig.autoConfig),
        new StoredValue(store, storageConfig.keys.theme, settingsConfig.theme),
      );
    });
  }
}
