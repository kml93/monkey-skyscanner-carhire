/**
 * Userscript entry point (`@run-at document-start`).
 *
 * Providers register in order, then boot in order: the fetch interceptor is installed
 * before the page's first carhire-quotes request, the UI mounts last on DOM ready.
 */
import { Application } from '@app/Foundation/Application';
import { MissedRequestWatcher } from '@app/Network/MissedRequestWatcher';
import { NetworkServiceProvider } from '@app/Network/NetworkServiceProvider';
import { ResultsServiceProvider } from '@app/Results/ResultsServiceProvider';
import { ScrollServiceProvider } from '@app/Scroll/ScrollServiceProvider';
import { SettingsServiceProvider } from '@app/Settings/SettingsServiceProvider';
import { StorageServiceProvider } from '@app/Storage/StorageServiceProvider';
import { SuppliersServiceProvider } from '@app/Suppliers/SuppliersServiceProvider';
import { SupportServiceProvider } from '@app/Support/SupportServiceProvider';
import { UiServiceProvider } from '@app/Ui/UiServiceProvider';

const app = new Application([
  SupportServiceProvider,
  StorageServiceProvider,
  SettingsServiceProvider,
  SuppliersServiceProvider,
  ResultsServiceProvider,
  ScrollServiceProvider,
  NetworkServiceProvider,
  UiServiceProvider,
]);

app.boot();

// Real page load only: on HMR re-execution the quotes already on screen were intercepted.
if (!import.meta.hot?.data.booted) app.make(MissedRequestWatcher).watch();

if (import.meta.hot) {
  // Tear everything down before Vite re-executes this module, so patches never stack.
  import.meta.hot.dispose((data) => {
    app.terminate();
    data.booted = true;
  });
  import.meta.hot.accept();
}
