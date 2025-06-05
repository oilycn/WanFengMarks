
"use client";

import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';
// Select component for search engine selection if needed in future
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const SearchBar: React.FC = () => {
  const [query, setQuery] = useState('');
  // const [searchEngine, setSearchEngine] = useState('google'); // Example state for search engine

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      // Basic Google search for now
      window.open(`https://www.google.com/search?q=${encodeURIComponent(query.trim())}`, '_blank');
      // Example for other engines:
      // if (searchEngine === 'baidu') {
      //   window.open(`https://www.baidu.com/s?wd=${encodeURIComponent(query.trim())}`, '_blank');
      // } else {
      //   window.open(`https://www.google.com/search?q=${encodeURIComponent(query.trim())}`, '_blank');
      // }
    }
  };

  return (
    <form onSubmit={handleSearch} className="flex w-full max-w-lg items-center space-x-2 bg-white/20 backdrop-blur-sm p-2 rounded-lg shadow-md">
      {/* Future: Search Engine Selector
      <Select value={searchEngine} onValueChange={setSearchEngine}>
        <SelectTrigger className="w-[100px] bg-white/30 border-none text-black focus:ring-primary">
          <SelectValue placeholder="引擎" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="google">谷歌</SelectItem>
          <SelectItem value="baidu">百度</SelectItem>
        </SelectContent>
      </Select>
      */}
      <Input
        type="search"
        placeholder="搜索网页或站内书签..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="flex-grow bg-transparent border-none text-white placeholder-white/70 focus:ring-0 text-base h-10"
        aria-label="搜索网页"
      />
      <Button type="submit" variant="default" size="icon" aria-label="搜索" className="bg-primary/80 hover:bg-primary text-primary-foreground h-10 w-10">
        <Search className="h-5 w-5" />
      </Button>
    </form>
  );
};

export default SearchBar;

