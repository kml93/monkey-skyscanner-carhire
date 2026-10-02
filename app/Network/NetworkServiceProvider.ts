import { unsafeWindow } from '$';

import { ServiceProvider } from '@app/Foundation/ServiceProvider';
import { ResultsRefresher } from '@app/Results/ResultsRefresher';
import { SettingsRepository } from '@app/Settings/SettingsRepository';
import { SupplierRepository } from '@app/Suppliers/SupplierRepository';
import { Logger } from '@app/Support/Logger';
import { FetchInterceptor } from './FetchInterceptor';
import { MissedRequestWatcher } from './MissedRequestWatcher';
import { QuotesRequestRewriter } from './QuotesRequestRewriter';
import { QuotesResponseParser } from './QuotesResponseParser';

/**
 * Installs the fetch interceptor at boot (document-start, before the page's first
 * carhire-quotes request) and keeps its filtering flag in sync with AutoConfig.apiFilter.
 */
export class NetworkServiceProvider extends ServiceProvider {
  private stopSyncingFilter: (() => void) | null = null;

  register(): void {
    this.app.singleton(QuotesResponseParser, () => new QuotesResponseParser());
    this.app.singleton(QuotesRequestRewriter, (app) => new QuotesRequestRewriter(app.make(SupplierRepository), app.make(Logger)));
    this.app.singleton(FetchInterceptor, (app) => new FetchInterceptor(
      unsafeWindow,
      app.make(QuotesRequestRewriter),
      app.make(QuotesResponseParser),
      app.make(SupplierRepository),
      app.make(Logger),
    ));
    this.app.singleton(MissedRequestWatcher, (app) => new MissedRequestWatcher(
      app.make(FetchInterceptor),
      app.make(ResultsRefresher),
      app.make(Logger),
    ));
  }

  boot(): void {
    const settings = this.app.make(SettingsRepository);
    const interceptor = this.app.make(FetchInterceptor);

    interceptor.setFilterEnabled(settings.autoConfig().apiFilter);
    interceptor.install();
    // Synchronous on local saves: a re-fetch right after saving already sees the new flag.
    this.stopSyncingFilter = settings.onAutoConfigChange((config) => interceptor.setFilterEnabled(config.apiFilter));
  }

  terminate(): void {
    this.stopSyncingFilter?.();
    this.app.make(MissedRequestWatcher).stop();
    this.app.make(FetchInterceptor).uninstall();
  }
}
