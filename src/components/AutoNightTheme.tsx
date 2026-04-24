"use client";

import { useEffect } from 'react';

const NIGHT_START_HOUR = 19;
const NIGHT_END_HOUR = 7;

const isNightTime = (date: Date) => {
  const hour = date.getHours();
  return hour >= NIGHT_START_HOUR || hour < NIGHT_END_HOUR;
};

const applyTheme = () => {
  const root = document.documentElement;
  const nightMode = isNightTime(new Date());
  root.classList.toggle('dark', nightMode);
};

export default function AutoNightTheme() {
  useEffect(() => {
    applyTheme();

    const themeTimer = window.setInterval(applyTheme, 60 * 1000);
    const visibilityHandler = () => {
      if (document.visibilityState === 'visible') {
        applyTheme();
      }
    };
    document.addEventListener('visibilitychange', visibilityHandler);

    return () => {
      window.clearInterval(themeTimer);
      document.removeEventListener('visibilitychange', visibilityHandler);
    };
  }, []);

  return null;
}
