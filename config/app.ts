/**
 * Application identity and shadow DOM mount points.
 */
export const appConfig = {
  /** Prefix of every log line. */
  logPrefix: '[SkyScannerDashboard]',
  /** Custom element hosting the shadow root. */
  hostTag: 'skyscanner-controller',
  /** Id of the React root container inside the shadow root. */
  rootId: 'app-skyscanner-car_rental',
} as const;
