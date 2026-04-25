export type ThemePreference = 'auto' | 'light' | 'dark';

export const THEME_STORAGE_KEY = 'wanfeng_theme_preference_v1';
export const THEME_EVENT_NAME = 'wanfeng-theme-changed';
export const NIGHT_START_HOUR = 19;
export const NIGHT_END_HOUR = 7;

export const isNightTime = (date: Date = new Date()): boolean => {
  const hour = date.getHours();
  return hour >= NIGHT_START_HOUR || hour < NIGHT_END_HOUR;
};

export const getStoredThemePreference = (): ThemePreference => {
  if (typeof window === 'undefined') return 'auto';
  const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (stored === 'light' || stored === 'dark' || stored === 'auto') {
    return stored;
  }
  return 'auto';
};

export const resolveIsDark = (preference: ThemePreference): boolean => {
  if (preference === 'dark') return true;
  if (preference === 'light') return false;
  return isNightTime();
};

export const applyThemePreference = (preference: ThemePreference): void => {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  const isDark = resolveIsDark(preference);
  root.classList.toggle('dark', isDark);
  root.dataset.themePreference = preference;
};

export const setThemePreference = (preference: ThemePreference): void => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(THEME_STORAGE_KEY, preference);
  applyThemePreference(preference);
  window.dispatchEvent(new CustomEvent<ThemePreference>(THEME_EVENT_NAME, { detail: preference }));
};

export const getNextThemePreference = (current: ThemePreference): ThemePreference => {
  if (current === 'auto') return 'dark';
  if (current === 'dark') return 'light';
  return 'auto';
};
