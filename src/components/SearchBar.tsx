
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
      className="wm-panel group flex w-full items-center gap-1.5 overflow-hidden p-1.5 transition-all duration-300 focus-within:bg-[hsl(var(--surface-card)/0.96)] focus-within:shadow-[0_16px_30px_-24px_rgba(15,23,42,0.3)] dark:focus-within:bg-[hsl(var(--surface-card)/0.9)] dark:focus-within:shadow-[0_16px_28px_-22px_rgba(0,0,0,0.58)]"
    >
      <Select value={selectedEngine} onValueChange={setSelectedEngine}>
        <SelectTrigger
          className="h-10 w-auto min-w-[96px] rounded-xl border-0 bg-[hsl(var(--surface-input))] px-2.5 text-xs text-foreground/85 shadow-none outline-none focus:outline-none focus:ring-0 focus:ring-offset-0 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 dark:text-foreground/90"
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
        className="h-10 flex-grow rounded-xl border-none bg-transparent px-3 text-sm text-foreground placeholder:text-muted-foreground/90 outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
        aria-label="搜索网页或筛选书签"
      />
      <Button
        type="submit"
        variant="default"
        size="icon"
        aria-label="搜索"
        className="h-10 w-10 rounded-xl bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
      >
        <Search className="h-4 w-4" />
      </Button>
    </form>
  );
};

export default SearchBar;

    
