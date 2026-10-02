import { appConfig } from '@config/app';

import { ServiceProvider } from '@app/Foundation/ServiceProvider';
import { IdleCallbackPolyfill } from './IdleCallbackPolyfill';
import { Logger } from './Logger';

/**
 * Cross-cutting infrastructure: logging and browser polyfills.
 * Registered first so every other provider can rely on it.
 */
export class SupportServiceProvider extends ServiceProvider {
  register(): void {
    this.app.singleton(Logger, () => new Logger(appConfig.logPrefix));
  }

  boot(): void {
    new IdleCallbackPolyfill().install();
  }
}
