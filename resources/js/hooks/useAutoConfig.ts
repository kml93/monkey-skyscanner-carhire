import { useCallback, useEffect, useState } from 'react';

import type { AutoConfig } from '@app/Settings/Data/AutoConfig';
import { SettingsRepository } from '@app/Settings/SettingsRepository';
import { useService } from './useService';

/** Live auto-configuration: re-renders on local saves and on writes from other tabs. */
export function useAutoConfig() {
  const settings = useService(SettingsRepository);
  const [config, setConfig] = useState<AutoConfig>(() => settings.autoConfig());

  useEffect(() => settings.onAutoConfigChange(setConfig), [settings]);

  const commitConfig = useCallback((next: AutoConfig) => settings.saveAutoConfig(next), [settings]);

  return { config, commitConfig };
}
