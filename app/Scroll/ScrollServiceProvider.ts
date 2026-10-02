import { ServiceProvider } from '@app/Foundation/ServiceProvider';
import { SettingsRepository } from '@app/Settings/SettingsRepository';
import { ScrollLock } from './ScrollLock';

/**
 * Keeps the ScrollLock in sync with AutoConfig.scrollLock.
 */
export class ScrollServiceProvider extends ServiceProvider {
  private stopSyncing: (() => void) | null = null;

  register(): void {
    this.app.singleton(ScrollLock, () => new ScrollLock());
  }

  boot(): void {
    const settings = this.app.make(SettingsRepository);
    const scrollLock = this.app.make(ScrollLock);

    scrollLock.setEnabled(settings.autoConfig().scrollLock);
    this.stopSyncing = settings.onAutoConfigChange((config) => scrollLock.setEnabled(config.scrollLock));
  }

  terminate(): void {
    this.stopSyncing?.();
    this.app.make(ScrollLock).uninstall();
  }
}
