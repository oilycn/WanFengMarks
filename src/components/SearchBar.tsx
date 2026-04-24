
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
    <form
      onSubmit={handleSearchSubmit}
      className="wm-panel group flex w-full items-center gap-1.5 p-1.5 transition-all duration-300 focus-within:ring-primary/25 focus-within:shadow-[0_20px_45px_-34px_hsl(var(--primary)/0.8)]"
    >
      <Select value={selectedEngine} onValueChange={setSelectedEngine}>
        <SelectTrigger
          className="w-auto min-w-[96px] bg-background/75 text-foreground/85 h-10 text-xs px-2.5 rounded-xl border-0 shadow-none focus:ring-0 focus:ring-offset-0"
          aria-label="选择搜索引擎"
        >
          <div className="flex items-center gap-1.5 truncate">
            <Globe className="h-3.5 w-3.5 opacity-75" />
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
        className="flex-grow border-none bg-transparent text-foreground placeholder:text-muted-foreground/90 focus-visible:ring-0 text-sm h-10 px-3 rounded-xl"
        aria-label="搜索网页或筛选书签"
      />
      <Button
        type="submit"
        variant="default"
        size="icon"
        aria-label="搜索"
        className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-accent hover:brightness-110 text-primary-foreground shadow-sm"
      >
        <Search className="h-4 w-4" />
      </Button>
    </form>
  );
};

export default SearchBar;

    
