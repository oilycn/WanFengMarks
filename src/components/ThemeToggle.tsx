"use client";

import React, { useEffect, useState } from 'react';
import { Laptop, MoonStar, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import {
  THEME_EVENT_NAME,
  ThemePreference,
  getNextThemePreference,
  getStoredThemePreference,
  setThemePreference,
} from '@/lib/theme';

const themeMeta: Record<ThemePreference, { label: string; Icon: React.ElementType }> = {
  auto: { label: '自动主题', Icon: Laptop },
  dark: { label: '深色主题', Icon: MoonStar },
  light: { label: '浅色主题', Icon: Sun },
};

interface ThemeToggleProps {
  className?: string;
}

export default function ThemeToggle({ className }: ThemeToggleProps) {
  const [themePreference, setThemePreferenceState] = useState<ThemePreference>('auto');

  useEffect(() => {
    setThemePreferenceState(getStoredThemePreference());

    const themeChangeHandler = (event: Event) => {
      const customEvent = event as CustomEvent<ThemePreference>;
      if (customEvent.detail) {
        setThemePreferenceState(customEvent.detail);
      } else {
        setThemePreferenceState(getStoredThemePreference());
      }
    };

    window.addEventListener(THEME_EVENT_NAME, themeChangeHandler as EventListener);
    return () => {
      window.removeEventListener(THEME_EVENT_NAME, themeChangeHandler as EventListener);
    };
  }, []);

  const handleToggle = () => {
    const nextPreference = getNextThemePreference(themePreference);
    setThemePreference(nextPreference);
    setThemePreferenceState(nextPreference);
  };

  const { label, Icon } = themeMeta[themePreference];

  return (
    <TooltipProvider delayDuration={120}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleToggle}
            className={cn(
              "h-9 w-9 rounded-xl bg-[hsl(var(--surface-elevated)/0.84)] hover:bg-[hsl(var(--surface-elevated))] dark:bg-[hsl(var(--surface-elevated)/0.78)] dark:hover:bg-[hsl(var(--surface-elevated)/0.92)]",
              className
            )}
            aria-label={`切换主题，当前${label}`}
            title={`当前${label}`}
          >
            <Icon className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>主题: {label}（点击切换）</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
