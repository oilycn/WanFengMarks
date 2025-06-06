
"use client";

import React, { useState, useEffect } from 'react';
import type { Bookmark } from '@/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Globe2, Trash2, EyeOff, PenLine, GripVertical } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger, // Added AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import { cn } from '@/lib/utils';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface BookmarkItemProps {
  id: string; 
  bookmark: Bookmark;
  onDeleteBookmark: (id: string) => void;
  onEditBookmark: (bookmark: Bookmark) => void;
  isAdminAuthenticated: boolean;
  isDraggable: boolean;
}

// Helper function to ensure URL has a scheme
const getFullUrlWithScheme = (url: string): string => {
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return `https://${url}`;
  }
  return url;
};

const BookmarkItem: React.FC<BookmarkItemProps> = ({
  id,
  bookmark,
  onDeleteBookmark,
  onEditBookmark,
  isAdminAuthenticated,
  isDraggable,
}) => {
  const [currentIconSrc, setCurrentIconSrc] = useState<string | null>(null);
  const [showFallbackIcon, setShowFallbackIcon] = useState(false);

  useEffect(() => {
    let isActive = true; 

    setShowFallbackIcon(false);
    setCurrentIconSrc(null); // Reset on bookmark URL change

    const fullBookmarkUrl = getFullUrlWithScheme(bookmark.url);
    let domain: string;
    try {
      domain = new URL(fullBookmarkUrl).hostname;
    } catch (e) {
      if (isActive) setShowFallbackIcon(true);
      return;
    }
    
    const PROXY_BASE_URL = 'https://proxy.oily.cn/proxy/';
    // The target is to fetch the favicon.ico from the root of the domain
    const targetFaviconUrl = `https://${domain}/favicon.ico`;
    
    // The final URL using the user's proxy. The proxy receives the targetFaviconUrl *without* additional encoding.
    const proxiedIconUrl = `${PROXY_BASE_URL}${targetFaviconUrl}`;

    const cacheKey = `favicon-cache-v4-${domain}`; // Updated cache key version
    const CACHE_DURATION_SUCCESS = 24 * 60 * 60 * 1000; // 24 hours
    const CACHE_DURATION_ERROR = 1 * 60 * 60 * 1000;    // 1 hour

    try {
      const cachedItemString = localStorage.getItem(cacheKey);
      if (cachedItemString) {
        const cachedItem = JSON.parse(cachedItemString);
        const now = Date.now();

        if (cachedItem.src && cachedItem.timestamp && (now - cachedItem.timestamp < CACHE_DURATION_SUCCESS)) {
          if (isActive) {
            setCurrentIconSrc(cachedItem.src);
          }
          return; 
        }

        if (cachedItem.errorTimestamp && (now - cachedItem.errorTimestamp < CACHE_DURATION_ERROR)) {
          if (isActive) {
            setShowFallbackIcon(true);
          }
          return; 
        }
      }
    } catch (e) {
      console.warn(`[BookmarkItem] Error reading or parsing cache for ${domain}:`, e);
      try {
        localStorage.removeItem(cacheKey);
      } catch (removeError) {
        // Silently ignore if remove fails
      }
    }
    
    if (isActive) {
      setCurrentIconSrc(proxiedIconUrl);
    }

    return () => {
      isActive = false;
    };
  }, [bookmark.url]);

  const handleImageError = () => {
    setShowFallbackIcon(true);
    try {
      const fullBookmarkUrl = getFullUrlWithScheme(bookmark.url);
      const domain = new URL(fullBookmarkUrl).hostname;
      const cacheKey = `favicon-cache-v4-${domain}`;
      localStorage.setItem(cacheKey, JSON.stringify({ errorTimestamp: Date.now() }));
    } catch (e) {
       console.warn(`[BookmarkItem] Error saving error state to cache for ${bookmark.url}:`, e);
    }
  };

  const handleImageLoad = () => {
    if (currentIconSrc && !showFallbackIcon) { 
      try {
        const fullBookmarkUrl = getFullUrlWithScheme(bookmark.url);
        const domain = new URL(fullBookmarkUrl).hostname;
        const cacheKey = `favicon-cache-v4-${domain}`;
        localStorage.setItem(cacheKey, JSON.stringify({
          src: currentIconSrc,
          timestamp: Date.now(),
        }));
      } catch (e) {
        console.warn(`[BookmarkItem] Error saving success state to cache for ${bookmark.url}:`, e);
      }
    }
  };
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: String(id), disabled: !isDraggable });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
  };

  if (!isAdminAuthenticated && bookmark.isPrivate) {
    return null; 
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...(isDraggable ? attributes : {})}
      className={cn(
        "group relative rounded-lg flex flex-col transition-shadow",
        isDragging ? 'shadow-2xl scale-105 bg-card z-50' : 'shadow-lg hover:shadow-xl bg-card/70',
      )}
    >
      <Card className={cn(
        "flex-grow overflow-hidden backdrop-blur-sm border border-border/60 hover:border-primary/70 rounded-lg",
        "group-hover:bg-accent/10 group-focus-within:bg-accent/10",
        isDragging ? 'border-primary ring-2 ring-primary' : ''
      )}>
        <div className="flex items-center p-3">
          {isAdminAuthenticated && isDraggable && (
            <button
              {...listeners}
              className="cursor-grab p-1 mr-1 text-muted-foreground hover:text-foreground group-hover:opacity-100 opacity-50 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
              aria-label="拖动排序"
              type="button" 
            >
              <GripVertical className="h-4 w-4" />
            </button>
          )}
          <a
            href={getFullUrlWithScheme(bookmark.url)} 
            target="_blank"
            rel="noopener noreferrer"
            className="flex-grow flex items-center text-card-foreground hover:text-primary transition-colors no-underline hover:no-underline min-w-0"
            aria-label={`打开 ${bookmark.name}`}
          >
            <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center mr-2 rounded-sm overflow-hidden bg-muted/20">
              {showFallbackIcon || !currentIconSrc ? (
                <Globe2 className="w-5 h-5 text-muted-foreground" />
              ) : (
                <img
                  key={currentIconSrc} 
                  src={currentIconSrc}
                  alt="" 
                  width={20}
                  height={20}
                  className="w-5 h-5 object-contain"
                  loading="lazy"
                  onError={handleImageError}
                  onLoad={handleImageLoad}
                />
              )}
            </div>

            <div className="flex-grow min-w-0">
              <h3 className="text-sm font-semibold truncate flex items-center" title={bookmark.name}>
                {bookmark.name}
                {bookmark.isPrivate && (
                  <EyeOff className="ml-1.5 h-3 w-3 text-muted-foreground/70 flex-shrink-0">
                    <title>私密书签</title>
                  </EyeOff>
                )}
              </h3>
              {bookmark.description && (
                <p className="text-xs text-muted-foreground mt-0.5 truncate" title={bookmark.description}>
                  {bookmark.description}
                </p>
              )}
            </div>
          </a>
        </div>

        {isAdminAuthenticated && (
          <div className={cn(
            "absolute top-1 right-1 flex items-center opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity space-x-0.5",
            isDragging && "opacity-100"
          )}>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-foreground/60 hover:text-foreground hover:bg-accent/10 p-1 rounded-full"
              aria-label={`编辑 ${bookmark.name}`}
              onClick={() => onEditBookmark(bookmark)}
            >
              <PenLine className="h-3.5 w-3.5" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-destructive/60 hover:text-destructive hover:bg-destructive/10 p-1 rounded-full"
                  aria-label={`删除 ${bookmark.name}`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>确定删除书签 "{bookmark.name}"?</AlertDialogTitle>
                  <AlertDialogDescription>
                    此操作无法撤销。
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>取消</AlertDialogCancel>
                  <AlertDialogAction onClick={() => onDeleteBookmark(bookmark.id)} className="bg-destructive hover:bg-destructive/90">
                    删除
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </Card>
    </div>
  );
};

export default BookmarkItem;

