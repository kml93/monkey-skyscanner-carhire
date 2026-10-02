import type { Application } from './Application';

/**
 * Base service provider.
 *
 * Lifecycle, driven by Application:
 *   1. register()  — bind services into the container; never resolve or run side effects.
 *   2. boot()      — every provider is registered: resolve services and start them.
 *   3. terminate() — undo boot() side effects (HMR re-execution), in reverse provider order.
 */
export abstract class ServiceProvider {
  protected readonly app: Application;

  constructor(app: Application) {
    this.app = app;
  }

  register(): void {}

  boot(): void {}

  terminate(): void {}
}

export type ServiceProviderClass = new (app: Application) => ServiceProvider;
