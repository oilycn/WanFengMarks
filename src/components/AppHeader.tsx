
"use client";

import React from 'react';
import SearchBar from './SearchBar';
import Clock from './Clock';
// Weather component is removed

interface AppHeaderProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

const AppHeader: React.FC<AppHeaderProps> = ({ searchQuery, setSearchQuery }) => {
  return (
    <header 
      className="h-48 md:h-40 p-4 md:p-6 flex flex-col md:flex-row items-center justify-between relative shadow-md backdrop-blur-sm"
      style={{ backgroundImage: 'var(--header-bg-gradient)' }}
      data-ai-hint="abstract gradient" // Updated hint
    >
      <div className="w-full md:w-2/3 lg:w-1/2 z-10">
        <SearchBar currentQuery={searchQuery} onQueryChange={setSearchQuery} />
      </div>
      <div className="mt-4 md:mt-0 z-10 flex flex-col sm:flex-row items-center gap-3"> 
        {/* Weather component removed */}
        <Clock />
      </div>
    </header>
  );
};

export default AppHeader;
