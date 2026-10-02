import type { ReactNode } from 'react';

import type { Application } from '@app/Foundation/Application';
import { ApplicationContext } from './ApplicationContext';

type ApplicationProviderProps = {
  app: Application;
  children: ReactNode;
};

export function ApplicationProvider({ app, children }: ApplicationProviderProps) {
  return <ApplicationContext.Provider value={app}>{children}</ApplicationContext.Provider>;
}
