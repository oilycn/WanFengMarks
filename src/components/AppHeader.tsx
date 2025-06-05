
"use client";

import React from 'react';
import SearchBar from './SearchBar';
import Clock from './Clock';
import AegisLogo from './AegisLogo'; 

interface AppHeaderProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

const AppHeader: React.FC<AppHeaderProps> = ({ searchQuery, setSearchQuery }) => {
  return (
    <header
      className="p-3 flex items-center justify-between relative border-b shadow-sm"
      style={{ backgroundColor: 'hsl(var(--header-solid-bg))' }}
      data-ai-hint="light muted background"
    >
      {/* Logo on the left */}
      <div className="flex-shrink-0">
        <AegisLogo />
      </div>

      {/* SearchBar - Centered in the available space */}
      <div className="flex-1 flex justify-center items-center px-2 md:px-4">
        <SearchBar currentQuery={searchQuery} onQueryChange={setSearchQuery} />
      </div>
      
      {/* Clock - On the right */}
      <div className="flex-shrink-0">
        <Clock />
      </div>
    </header>
  );
};

export default AppHeader;
