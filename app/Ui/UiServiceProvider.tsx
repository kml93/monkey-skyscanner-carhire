import { StrictMode } from 'react';
import { createRoot, type Root } from 'react-dom/client';

import { appConfig } from '@config/app';

import App from '@/app';
import { ApplicationProvider } from '@/contexts/ApplicationProvider';
import { ShadowPortalProvider } from '@/contexts/ShadowPortalProvider';
import { ServiceProvider } from '@app/Foundation/ServiceProvider';
import { ShadowHost } from './ShadowHost';

import '../../resources/css/fonts.css';
import '../../resources/css/app.css';
import appStyles from '../../resources/css/app.css?inline';

/**
 * Mounts the React dashboard inside a shadow root once the DOM is ready.
 * Registered last: every service the UI resolves is booted by then.
 */
export class UiServiceProvider extends ServiceProvider {
  private root: Root | null = null;

  boot(): void {
    if (!customElements.get(appConfig.hostTag)) customElements.define(appConfig.hostTag, ShadowHost);

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.mount(), { once: true });
      return;
    }
    this.mount();
  }

  terminate(): void {
    this.root?.unmount();
    this.root = null;
    document.querySelector(appConfig.hostTag)?.remove();
  }

  private mount(): void {
    this.terminate();

    const host = document.createElement(appConfig.hostTag) as ShadowHost;
    const styleSheet = new CSSStyleSheet();
    styleSheet.replaceSync(appStyles);
    host.root.adoptedStyleSheets = [styleSheet];
    document.documentElement.appendChild(host);

    const appContainer = document.createElement('div');
    appContainer.id = appConfig.rootId;
    host.root.appendChild(appContainer);

    // Base UI portals render here instead of document.body, outside the React tree container.
    const portalsContainer = document.createElement('div');
    portalsContainer.setAttribute('data-slot', 'portals');
    host.root.appendChild(portalsContainer);

    this.root = createRoot(appContainer);
    this.root.render(
      <StrictMode>
        <ApplicationProvider app={this.app}>
          <ShadowPortalProvider container={portalsContainer}>
            <App shadowHost={host} />
          </ShadowPortalProvider>
        </ApplicationProvider>
      </StrictMode>,
    );
  }
}
