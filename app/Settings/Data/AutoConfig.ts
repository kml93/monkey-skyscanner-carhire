/** User toggles persisted across sessions. */
export interface AutoConfig {
  /** Block Skyscanner's programmatic scroll-to-top. */
  readonly scrollLock: boolean;
  /** Rewrite carhire-quotes requests so only included suppliers are returned. */
  readonly apiFilter: boolean;
}
