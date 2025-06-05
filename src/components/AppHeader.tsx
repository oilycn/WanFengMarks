
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
      className="p-4 flex items-center relative border-b shadow-sm backdrop-blur-sm" // Use p-4 and border-b to match sidebar logo section. Removed bg-opacity-90. Added shadow-sm for subtle depth.
      style={{ backgroundImage: 'var(--header-bg-gradient)' }}
      data-ai-hint="abstract gradient"
    >
      {/* Invisible spacer on the left to help balance if needed, or for future elements.
          Could also be an empty div if a specific element isn't planned here.
          For true clock centering with search bar on right, this part would be empty.
      */}
      {/* <div className="w-auto flex-shrink-0"></div> */}

      {/* Clock - Centered Horizontally & Vertically using absolute positioning */}
      <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
        <Clock />
      </div>

      {/* SearchBar - Right Aligned */}
      <div className="ml-auto z-10"> {/* ml-auto pushes this to the far right */}
        <SearchBar currentQuery={searchQuery} onQueryChange={setSearchQuery} />
      </div>
    </header>
  );
};

export default AppHeader;
