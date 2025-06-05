
"use client";

import React from 'react';
import SearchBar from './SearchBar';
import Clock from './Clock';
import Weather from './Weather'; 

interface AppHeaderProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

const AppHeader: React.FC<AppHeaderProps> = ({ searchQuery, setSearchQuery }) => {
  return (
    <header 
      className="h-48 md:h-40 p-4 md:p-6 flex flex-col md:flex-row items-center justify-between relative shadow-md bg-[hsl(var(--header-solid-bg))]" 
      data-ai-hint="light gray abstract"
    >
      {/* The header-background-image class can be added above if an image is preferred over solid color */}
      {/* <div className="absolute inset-0 bg-black/05 backdrop-blur-xs"></div> Removed overlay for solid background */}
      
      <div className="w-full md:w-2/3 lg:w-1/2 z-10">
        <SearchBar currentQuery={searchQuery} onQueryChange={setSearchQuery} />
      </div>
      <div className="mt-4 md:mt-0 z-10 flex flex-col sm:flex-row items-center gap-3"> 
        <Weather />
        <Clock />
      </div>
    </header>
  );
};

export default AppHeader;
