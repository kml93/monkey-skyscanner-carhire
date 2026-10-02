import type { AutoConfig } from '@app/Settings/Data/AutoConfig';
import type { Theme } from '@app/Settings/Data/Theme';

/**
 * Default user settings, used until the user saves their own.
 */
export const settingsConfig: { readonly autoConfig: AutoConfig; readonly theme: Theme } = {
  autoConfig: {
    scrollLock: false,
    apiFilter: false,
  },
  theme: 'dark',
};
