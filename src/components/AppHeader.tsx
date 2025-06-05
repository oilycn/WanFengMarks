
"use client";

import React from 'react';
import SearchBar from './SearchBar';
import Clock from './Clock';
import AegisLogo from './AegisLogo'; // Import the logo

interface AppHeaderProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

const AppHeader: React.FC<AppHeaderProps> = ({ searchQuery, setSearchQuery }) => {
  return (
    <header
      className="p-4 flex items-center justify-between relative border-b shadow-sm backdrop-blur-sm"
      style={{ backgroundImage: 'var(--header-bg-gradient)' }}
      data-ai-hint="abstract gradient"
    >
      {/* Logo on the left */}
      <div className="flex-shrink-0">
        <AegisLogo />
      </div>

      {/* Clock - Centered in the available space */}
      <div className="flex-grow flex justify-center items-center z-10 px-4">
        <Clock />
      </div>

      {/* SearchBar - Right Aligned */}
      <div className="flex-shrink-0 z-10">
        <SearchBar currentQuery={searchQuery} onQueryChange={setSearchQuery} />
      </div>
    </header>
  );
};

export default AppHeader;
