
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

      {/* Clock - Centered in the available space */}
      <div className="flex-1 flex justify-center items-center px-2 md:px-4"> {/* Reduced horizontal padding for clock container */}
        <Clock />
      </div>

      {/* SearchBar - Takes more space on the right */}
      <div className="flex-1 flex justify-end items-center">
        <SearchBar currentQuery={searchQuery} onQueryChange={setSearchQuery} />
      </div>
    </header>
  );
};

export default AppHeader;
