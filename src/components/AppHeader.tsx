
"use client";

import React from 'react';
import SearchBar from './SearchBar';
import Clock from './Clock';
// import Weather from './Weather'; // Weather can be added back if desired

const AppHeader: React.FC = () => {
  return (
    <header className="h-48 md:h-40 p-4 md:p-6 flex flex-col md:flex-row items-center justify-between text-white header-background relative shadow-md" data-ai-hint="desert landscape">
      <div className="w-full md:w-2/3 lg:w-1/2 z-10">
        <SearchBar />
      </div>
      <div className="mt-4 md:mt-0 z-10">
        <Clock />
        {/* <Weather /> */}
      </div>
      {/* Overlay to darken the background image a bit for better text contrast */}
      <div className="absolute inset-0 bg-black/30"></div>
    </header>
  );
};

export default AppHeader;
