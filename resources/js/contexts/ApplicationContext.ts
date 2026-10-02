/**
 * ApplicationContext — exposes the service container to React components.
 * Provided by UiServiceProvider; read through the useService hook.
 */

import { createContext } from 'react';

import type { Application } from '@app/Foundation/Application';

export const ApplicationContext = createContext<Application | null>(null);
