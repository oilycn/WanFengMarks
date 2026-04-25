"use client";

import { useEffect } from 'react';
import {
  THEME_EVENT_NAME,
  THEME_STORAGE_KEY,
  applyThemePreference,
  getStoredThemePreference,
} from '@/lib/theme';

export default function AutoNightTheme() {
  useEffect(() => {
    const applyCurrentTheme = () => {
      const preference = getStoredThemePreference();
      applyThemePreference(preference);
    };

    applyCurrentTheme();

    const themeTimer = window.setInterval(() => {
      if (getStoredThemePreference() === 'auto') {
        applyThemePreference('auto');
      }
    }, 60 * 1000);

    const preferenceChangeHandler = () => {
      applyCurrentTheme();
    };

    const storageHandler = (event: StorageEvent) => {
      if (event.key === THEME_STORAGE_KEY) {
        applyCurrentTheme();
      }
    };

    const visibilityHandler = () => {
      if (document.visibilityState === 'visible') {
        applyCurrentTheme();
      }
    };

    window.addEventListener(THEME_EVENT_NAME, preferenceChangeHandler as EventListener);
    window.addEventListener('storage', storageHandler);
    document.addEventListener('visibilitychange', visibilityHandler);

    return () => {
      window.clearInterval(themeTimer);
      window.removeEventListener(THEME_EVENT_NAME, preferenceChangeHandler as EventListener);
      window.removeEventListener('storage', storageHandler);
      document.removeEventListener('visibilitychange', visibilityHandler);
    };
  }, []);

  return null;
}
