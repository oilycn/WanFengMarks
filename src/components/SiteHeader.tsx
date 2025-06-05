
import React from 'react';
import AegisLogo from './AegisLogo';
import SearchBar from './SearchBar';

const SiteHeader: React.FC = () => {
  return (
    <header className="flex flex-col md:flex-row justify-between items-center py-3 md:py-4 border-b border-border/80 mb-4 md:mb-6">
      <AegisLogo />
      <div className="mt-3 md:mt-0 w-full md:w-auto">
        <SearchBar />
      </div>
    </header>
  );
};

export default SiteHeader;
