import { storageConfig } from '@config/storage';

import { ServiceProvider } from '@app/Foundation/ServiceProvider';
import { KeyValueStore } from '@app/Storage/Contracts/KeyValueStore';
import { StoredValue } from '@app/Storage/StoredValue';
import { Logger } from '@app/Support/Logger';
import type { SupplierEntry } from './Data/SupplierEntry';
import { SupplierRepository } from './SupplierRepository';

export class SuppliersServiceProvider extends ServiceProvider {
  register(): void {
    this.app.singleton(SupplierRepository, (app) => new SupplierRepository(
      new StoredValue<Record<string, SupplierEntry>>(app.make(KeyValueStore), storageConfig.keys.suppliers, {}),
      app.make(Logger),
    ));
  }
}
