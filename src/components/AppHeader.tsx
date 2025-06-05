
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
      className="p-3 flex flex-col md:flex-row md:items-center md:justify-between relative border-b shadow-sm"
      style={{ backgroundColor: 'hsl(var(--header-solid-bg))' }}
      data-ai-hint="light muted background"
    >
      {/* Row 1 (Mobile) / Main Header Content (Desktop) */}
      <div className="flex w-full items-center justify-between md:w-auto">
        {/* Left part: Menu toggle and Logo */}
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            className="md:hidden h-8 w-8" // Only show on mobile
            onClick={onToggleMobileSidebar}
            aria-label="打开侧边栏"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <AegisLogo logoText={logoText} logoIconName={logoIconName} />
        </div>

        {/* Right part of Row 1 (Mobile) / Far right of Header (Desktop) */}
        <div className="flex-shrink-0"> 
          <Clock />
        </div>
      </div>

      {/* Row 2 (Mobile) / Center part of Header (Desktop) */}
      <div className="mt-2 w-full md:mt-0 md:flex-1 md:flex md:justify-center md:px-2 lg:px-4">
        <SearchBar currentQuery={searchQuery} onQueryChange={setSearchQuery} />
      </div>
    </header>
  );
};

export default AppHeader;
    

    