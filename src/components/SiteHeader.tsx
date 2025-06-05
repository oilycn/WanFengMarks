import React from 'react';
import AegisLogo from './AegisLogo';
import SearchBar from './SearchBar';

const SiteHeader: React.FC = () => {
  return (
    <header className="flex flex-col md:flex-row justify-between items-center py-4 md:py-6 border-b border-border mb-6 md:mb-8">
      <AegisLogo />
      <div className="mt-4 md:mt-0 w-full md:w-auto">
        <SearchBar />
      </div>
    </header>
  );
};

export default SiteHeader;
