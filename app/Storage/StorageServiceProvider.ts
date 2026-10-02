import { ServiceProvider } from '@app/Foundation/ServiceProvider';
import { KeyValueStore } from './Contracts/KeyValueStore';
import { GmKeyValueStore } from './GmKeyValueStore';

export class StorageServiceProvider extends ServiceProvider {
  register(): void {
    this.app.singleton(KeyValueStore, () => new GmKeyValueStore());
  }
}
