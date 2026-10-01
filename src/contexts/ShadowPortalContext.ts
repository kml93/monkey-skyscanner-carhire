/**
 * ShadowPortalContext — Shadow DOM Portal Container Registry.
 *
 * Distributes the Shadow DOM container element to all Base UI components
 * that use a Portal (Dialog, Tooltip), ensuring they render inside the
 * Shadow Root instead of document.body.
 *
 * Architecture:
 *   main.tsx creates a dedicated <div> inside the Shadow Root,
 *   then provides it via ShadowPortalProvider.
 *   Portal-based components consume it automatically.
 */

import { createContext, useContext } from 'react';

// ── Types ──────────────────────────────────────────────────────────────────

export type ShadowPortalContextValue = {
  container: HTMLElement | null;
};

// ── Context ────────────────────────────────────────────────────────────────

export const ShadowPortalContext = createContext<ShadowPortalContextValue>({
  container: null,
});

// ── Hook ───────────────────────────────────────────────────────────────────

/**
 * Returns the Shadow DOM container element for Portal-based components.
 * Falls back to null (= document.body) if no provider is present.
 */
export function useShadowPortalContainer(): HTMLElement | null {
  return useContext(ShadowPortalContext).container;
}
