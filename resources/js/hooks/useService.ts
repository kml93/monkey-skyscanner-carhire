import { useContext } from 'react';

import type { Abstract } from '@app/Foundation/Abstract';
import { ApplicationContext } from '@/contexts/ApplicationContext';

/** Resolves a service from the container provided by UiServiceProvider. */
export function useService<T>(abstract: Abstract<T>): T {
  const app = useContext(ApplicationContext);
  if (!app) throw new Error('useService must be used inside an ApplicationProvider.');

  return app.make(abstract);
}
