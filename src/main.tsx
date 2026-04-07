import { StrictMode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import App from './App';
import './fonts.css';
import styleString from './index.css?inline';

/**
 * 1. Definition of the Custom Element
 * This class acts as the "Shadow Host".
 */
class SkyScannerController extends HTMLElement {
  public static readonly CONTROLLER_TAG = 'skyscanner-controller';

  public shadowRoot: ShadowRoot;

  constructor() {
    super();
    // We attach the Shadow DOM directly in the constructor
    this.shadowRoot = this.attachShadow({ mode: 'open' });

    // Inject styles immediately
    const styleSheet = new CSSStyleSheet();
    styleSheet.replaceSync(styleString);
    this.shadowRoot.adoptedStyleSheets = [styleSheet];
  }
}

// Registration of the custom tag
if (!customElements.get(SkyScannerController.CONTROLLER_TAG)) {
  customElements.define(SkyScannerController.CONTROLLER_TAG, SkyScannerController);
}

/**
 * 2. Main Application Orchestrator
 */
class SkyScannerApplication {
  private static root: Root | null = null;
  private static hostInstance: SkyScannerController | null = null;

  /**
   * Initializes or re-initializes the application.
   */
  public static async init(): Promise<void> {
    // 1. Safety cleanup (Idempotence)
    this.cleanUp();

    this.hostInstance = document.createElement(SkyScannerController.CONTROLLER_TAG) as SkyScannerController;

    // 2. Create Shadow Root
    document.documentElement.appendChild(this.hostInstance);

    // 3. React App Container
    const appContainer = document.createElement('div');
    this.hostInstance.shadowRoot.appendChild(appContainer);

    // 4. React Rendering (Create Root)
    this.root = createRoot(appContainer);
    this.root.render(
      <StrictMode>
        <App />
      </StrictMode>,
    );
  }

  /**
   * Properly cleans up resources to prevent memory leaks and DOM conflicts.
   */
  public static cleanUp(): void {
    // Unmount React before deleting the DOM
    if (this.root) {
      this.root.unmount();
      this.root = null;
    }

    // Remove existing host if it exists
    const existingHost = document.querySelector(SkyScannerController.CONTROLLER_TAG);
    if (existingHost) {
      existingHost.remove();
    }
  }
}

// Launch on DOM load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => SkyScannerApplication.init());
} else {
  SkyScannerApplication.init();
}

/**
 * HMR Configuration (Vite)
 */
if (import.meta.hot) {
  // IMPORTANT: Clear everything before letting Vite re-execute this script
  import.meta.hot.dispose(() => {
    SkyScannerApplication.cleanUp();
  });

  // Signal to Vite that we accept hot changes
  import.meta.hot.accept();
}
