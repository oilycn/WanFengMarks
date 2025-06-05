"use client";

import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';

const SearchBar: React.FC = () => {
  const [query, setQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      window.open(`https://www.google.com/search?q=${encodeURIComponent(query.trim())}`, '_blank');
    }
  };

  return (
    <form onSubmit={handleSearch} className="flex w-full max-w-xl items-center space-x-2">
      <Input
        type="search"
        placeholder="Search the web..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="flex-grow bg-card border-border focus:ring-primary"
        aria-label="Search the web"
      />
      <Button type="submit" variant="default" size="icon" aria-label="Search">
        <Search className="h-5 w-5" />
      </Button>
    </form>
  );
};

export default SearchBar;
