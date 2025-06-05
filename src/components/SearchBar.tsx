
"use client";

import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Globe } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const searchEngines = [
  { id: 'google', name: '谷歌', url: 'https://www.google.com/search?q=' },
  { id: 'baidu', name: '百度', url: 'https://www.baidu.com/s?wd=' },
  { id: 'bing', name: '必应', url: 'https://www.bing.com/search?q=' },
  { id: 'duckduckgo', name: 'DuckDuckGo', url: 'https://duckduckgo.com/?q=' },
];

interface SearchBarProps {
  currentQuery: string;
  onQueryChange: (query: string) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ currentQuery, onQueryChange }) => {
  const [selectedEngine, setSelectedEngine] = useState(searchEngines[0].id);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentQuery.trim()) {
      const engine = searchEngines.find(se => se.id === selectedEngine);
      if (engine) {
        window.open(`${engine.url}${encodeURIComponent(currentQuery.trim())}`, '_blank');
      }
    }
  };

  return (
    <form onSubmit={handleSearchSubmit} className="flex w-full max-w-lg items-center space-x-2 bg-white/20 backdrop-blur-sm p-1.5 rounded-lg shadow-md">
      <Select value={selectedEngine} onValueChange={setSelectedEngine}>
        <SelectTrigger className="w-[100px] bg-white/30 border-none text-white focus:ring-primary h-10 text-xs pl-2 pr-1">
          <div className="flex items-center gap-1 truncate">
            <Globe className="h-3.5 w-3.5 opacity-80" />
            <SelectValue placeholder="引擎" />
          </div>
        </SelectTrigger>
        <SelectContent>
          {searchEngines.map(engine => (
            <SelectItem key={engine.id} value={engine.id} className="text-xs">
              {engine.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input
        type="search"
        placeholder="搜索网页 或 筛选下方书签..."
        value={currentQuery}
        onChange={(e) => onQueryChange(e.target.value)}
        className="flex-grow bg-transparent border-none text-white placeholder-white/70 focus:ring-0 text-sm h-10"
        aria-label="搜索网页或筛选书签"
      />
      <Button type="submit" variant="default" size="icon" aria-label="搜索" className="bg-primary/80 hover:bg-primary text-primary-foreground h-9 w-9">
        <Search className="h-4 w-4" />
      </Button>
    </form>
  );
};

export default SearchBar;
