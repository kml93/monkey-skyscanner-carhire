/**
 * Custom element hosting the dashboard's shadow root, isolating its styles from the page.
 */
export class ShadowHost extends HTMLElement {
  readonly root: ShadowRoot;

  constructor() {
    super();
    this.root = this.attachShadow({ mode: 'open' });
  }
}
