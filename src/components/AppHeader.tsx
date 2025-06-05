
"use client";

import React from 'react';
import SearchBar from './SearchBar';
import Clock from './Clock';

interface AppHeaderProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

const AppHeader: React.FC<AppHeaderProps> = ({ searchQuery, setSearchQuery }) => {
  return (
    <header 
      className="h-20 p-3 flex flex-col md:flex-row items-center justify-between relative shadow-md backdrop-blur-sm bg-opacity-90"
      style={{ backgroundImage: 'var(--header-bg-gradient)' }}
      data-ai-hint="abstract gradient"
    >
      <div className="w-full md:w-2/3 lg:w-1/2 z-10">
        <SearchBar currentQuery={searchQuery} onQueryChange={setSearchQuery} />
      </div>
      <div className="mt-3 md:mt-0 z-10 flex flex-col sm:flex-row items-center gap-3"> 
        <Clock />
      </div>
    </header>
  );
};

export default AppHeader;
