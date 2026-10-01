import type { ReactNode } from 'react';
import { ShadowPortalContext } from './ShadowPortalContext';

type ShadowPortalProviderProps = {
  container: HTMLElement | null;
  children: ReactNode;
};

export function ShadowPortalProvider({
  container,
  children,
}: ShadowPortalProviderProps) {
  return (
    <ShadowPortalContext.Provider value={{ container }}>
      {children}
    </ShadowPortalContext.Provider>
  );
}
