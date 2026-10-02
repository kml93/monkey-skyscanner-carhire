import { useCallback, useState } from 'react';

import type { Theme } from '@app/Settings/Data/Theme';
import { SettingsRepository } from '@app/Settings/SettingsRepository';
import { useService } from './useService';

const OPPOSITE_THEME: Record<Theme, Theme> = { dark: 'light', light: 'dark' };

export function useTheme() {
  const settings = useService(SettingsRepository);
  const [theme, setTheme] = useState<Theme>(() => settings.theme());

  const toggleTheme = useCallback(() => {
    const next = OPPOSITE_THEME[theme];
    settings.saveTheme(next);
    setTheme(next);
  }, [settings, theme]);

  return { theme, toggleTheme };
}
