
"use client";

import React from 'react';
import SearchBar from './SearchBar';
import Clock from './Clock';
import AegisLogo from './AegisLogo'; 
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';

interface AppHeaderProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onToggleMobileSidebar: () => void;
  logoText: string;
  logoIconName: string;
}

const AppHeader: React.FC<AppHeaderProps> = ({ 
  searchQuery, 
  setSearchQuery, 
  onToggleMobileSidebar,
  logoText,
  logoIconName 
}) => {
  return (
    <header
      className="sticky top-0 z-30 bg-background/65 backdrop-blur-2xl"
      data-ai-hint="light muted background"
    >
      <div className="mx-auto w-full max-w-[1880px] px-3 py-3 md:px-6 md:py-4">
        <div className="flex w-full flex-col gap-3 md:grid md:grid-cols-[auto_minmax(440px,1fr)_auto] md:items-center md:gap-4">
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              className="md:hidden h-9 w-9 rounded-xl bg-card/70 hover:bg-muted/60"
              onClick={onToggleMobileSidebar}
              aria-label="打开侧边栏"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <AegisLogo logoText={logoText} logoIconName={logoIconName} />
          </div>

          <div className="w-full md:max-w-[680px] md:justify-self-center">
            <SearchBar currentQuery={searchQuery} onQueryChange={setSearchQuery} />
          </div>

          <div className="hidden md:flex md:justify-end"> 
            <Clock />
          </div>
          <div className="flex justify-end md:hidden">
            <Clock />
          </div>
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
