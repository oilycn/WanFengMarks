
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
}

const AppHeader: React.FC<AppHeaderProps> = ({ searchQuery, setSearchQuery, onToggleMobileSidebar }) => {
  return (
    <header
      className="p-3 flex items-center justify-between relative border-b shadow-sm"
      style={{ backgroundColor: 'hsl(var(--header-solid-bg))' }}
      data-ai-hint="light muted background"
    >
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
        <AegisLogo />
      </div>

      <div className="flex-1 flex justify-center items-center px-2 md:px-4">
        <SearchBar currentQuery={searchQuery} onQueryChange={setSearchQuery} />
      </div>
      
      <div className="flex-shrink-0">
        <Clock />
      </div>
    </header>
  );
};

export default AppHeader;

    