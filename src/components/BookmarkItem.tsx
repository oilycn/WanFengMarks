
"use client";

import React, { useState, useEffect } from 'react';
import type { Bookmark } from '@/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bookmark as BookmarkIcon, Trash2, EyeOff, PenLine, GripVertical } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
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

const getBookmarkDomain = (url: string): string => {
  try {
    return new URL(getFullUrlWithScheme(url)).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
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
    setCurrentIconSrc(null);

    const fullBookmarkUrl = getFullUrlWithScheme(bookmark.url);
    let domain: string;
    try {
      domain = new URL(fullBookmarkUrl).hostname;
    } catch (e) {
      if (isActive) setShowFallbackIcon(true);
      return;
    }
    
    const normalizedDomain = domain.replace(/^www\./, '');
    const iconCandidates = [
      `https://proxy.oily.cn/proxy/https://${normalizedDomain}/favicon.ico`,
      `https://proxy.oily.cn/proxy/https://${normalizedDomain}/apple-touch-icon.png`,
      `https://proxy.oily.cn/proxy/https://${normalizedDomain}/apple-touch-icon-precomposed.png`,
    ];

    const cacheKey = `favicon-cache-v6-${normalizedDomain}`;
    const CACHE_DURATION_SUCCESS = 24 * 60 * 60 * 1000;
    const CACHE_DURATION_ERROR = 60 * 60 * 1000;

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
    } catch (error) {
      console.warn(`[BookmarkItem] Error reading or parsing cache for ${normalizedDomain}:`, error);
      try {
        localStorage.removeItem(cacheKey);
      } catch (removeError) {
        console.warn(`[BookmarkItem] Error removing invalid cache for ${normalizedDomain}:`, removeError);
      }
    }
    
    if (isActive) {
      setCurrentIconSrc(iconCandidates[0]);
    }

    return () => {
      isActive = false;
    };
  }, [bookmark.url]);

  const handleImageError = () => {
    try {
      const fullBookmarkUrl = getFullUrlWithScheme(bookmark.url);
      const domain = new URL(fullBookmarkUrl).hostname.replace(/^www\./, '');
      const iconCandidates = [
        `https://proxy.oily.cn/proxy/https://${domain}/favicon.ico`,
        `https://proxy.oily.cn/proxy/https://${domain}/apple-touch-icon.png`,
        `https://proxy.oily.cn/proxy/https://${domain}/apple-touch-icon-precomposed.png`,
      ];

      const activeSourceIndex = currentIconSrc
        ? iconCandidates.findIndex((iconSrc) => iconSrc === currentIconSrc)
        : -1;
      const nextSourceIndex = activeSourceIndex + 1;
      if (nextSourceIndex < iconCandidates.length) {
        setCurrentIconSrc(iconCandidates[nextSourceIndex]);
        return;
      }

      setShowFallbackIcon(true);
      const cacheKey = `favicon-cache-v6-${domain}`;
      localStorage.setItem(cacheKey, JSON.stringify({ errorTimestamp: Date.now() }));
    } catch (error) {
      setShowFallbackIcon(true);
      console.warn(`[BookmarkItem] Error handling favicon fallback for ${bookmark.url}:`, error);
    }
  };

  const handleImageLoad = () => {
    if (currentIconSrc && !showFallbackIcon) { 
      try {
        const fullBookmarkUrl = getFullUrlWithScheme(bookmark.url);
        const domain = new URL(fullBookmarkUrl).hostname.replace(/^www\./, '');
        const cacheKey = `favicon-cache-v6-${domain}`;
        localStorage.setItem(cacheKey, JSON.stringify({
          src: currentIconSrc,
          timestamp: Date.now(),
        }));
      } catch (error) {
        console.warn(`[BookmarkItem] Error saving success state to cache for ${bookmark.url}:`, error);
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

  const bookmarkDomain = getBookmarkDomain(bookmark.url);
  const metaText = bookmark.description?.trim() || bookmarkDomain;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...(isDraggable ? attributes : {})}
      className={cn(
        "group relative rounded-2xl flex flex-col transition-all duration-250",
        isDragging
          ? 'shadow-2xl scale-[1.02] z-50'
          : 'hover:shadow-[0_24px_34px_-24px_hsl(var(--foreground)/0.45)]',
      )}
    >
      <Card className={cn(
        "flex-grow overflow-hidden rounded-2xl border border-black/[0.03] bg-card shadow-[0_14px_26px_-18px_hsl(var(--foreground)/0.42)]",
        "group-hover:-translate-y-0.5 group-hover:shadow-[0_22px_34px_-20px_hsl(var(--foreground)/0.48)]",
        isDragging ? 'shadow-[0_24px_38px_-18px_hsl(var(--foreground)/0.58)]' : ''
      )}>
        <div className="flex items-center p-2.5">
          {isAdminAuthenticated && isDraggable && (
            <button
              {...listeners}
              className="cursor-grab p-1 mr-1.5 text-muted-foreground hover:text-foreground group-hover:opacity-100 opacity-55 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md"
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
            <div className="flex-shrink-0 w-11 h-11 flex items-center justify-center mr-2.5 rounded-xl overflow-hidden bg-gradient-to-br from-muted to-background">
              {showFallbackIcon || !currentIconSrc ? (
                <BookmarkIcon className="w-5 h-5 text-primary/80" />
              ) : (
                <img
                  key={currentIconSrc} 
                  src={currentIconSrc}
                  alt="" 
                  width={44}
                  height={44}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  onError={handleImageError}
                  onLoad={handleImageLoad}
                />
              )}
            </div>

            <div className="flex-grow min-w-0">
              <h3 className="text-[13px] font-semibold truncate flex items-center tracking-tight leading-tight" title={bookmark.name}>
                {bookmark.name}
                {bookmark.isPrivate && (
                  <EyeOff className="ml-1.5 h-3 w-3 text-muted-foreground/70 flex-shrink-0">
                    <title>私密书签</title>
                  </EyeOff>
                )}
              </h3>
              <p className="text-[11px] text-muted-foreground/95 mt-0.5 truncate leading-tight" title={metaText}>
                {metaText}
              </p>
            </div>
          </a>
        </div>

        {isAdminAuthenticated && (
          <div className={cn(
            "absolute top-1.5 right-1.5 flex items-center opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity space-x-1",
            isDragging && "opacity-100"
          )}>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 rounded-lg bg-background/80 text-foreground/65 hover:text-foreground hover:bg-background p-1"
              aria-label={`编辑 ${bookmark.name}`}
              onClick={() => onEditBookmark(bookmark)}
            >
              <PenLine className="h-3 w-3" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 rounded-lg bg-background/80 text-destructive/70 hover:text-destructive hover:bg-destructive/10 p-1"
                  aria-label={`删除 ${bookmark.name}`}
                >
                  <Trash2 className="h-3 w-3" />
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
