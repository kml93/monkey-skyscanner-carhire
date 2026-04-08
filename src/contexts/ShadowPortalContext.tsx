/**
 * ShadowPortalContext — Shadow DOM Portal Container Registry.
 *
 * Distributes the Shadow DOM container element to all Base UI components
 * that use a Portal (Dialog, Tooltip), ensuring they render inside the
 * Shadow Root instead of document.body.
 *
 * Architecture:
 *   main.tsx creates a dedicated <div> inside the Shadow Root,
 *   then provides it here via ShadowPortalProvider.
 *   Portal-based components consume it automatically.
 */

import { createContext, useContext } from 'react';

// ── Types ──────────────────────────────────────────────────────────────────

type ShadowPortalContextValue = {
  container: HTMLElement | null;
};

// ── Context ────────────────────────────────────────────────────────────────

const ShadowPortalContext = createContext<ShadowPortalContextValue>({
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

// ── Provider ───────────────────────────────────────────────────────────────

export function ShadowPortalProvider({
  container,
  children,
}: {
  container: HTMLElement | null;
  children: React.ReactNode;
}) {
  return (
    <ShadowPortalContext.Provider value={{ container }}>
      {children}
    </ShadowPortalContext.Provider>
  );
}
