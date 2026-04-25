
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import type { Bookmark } from '@/types';
import { Card } from '@/components/ui/card';
import { Trash2, EyeOff, PenLine, GripVertical } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
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
    return new URL(getFullUrlWithScheme(url)).host.replace(/^www\./, '');
  } catch {
    return url;
  }
};

const FAVICON_CACHE_PREFIX = 'favicon-cache-v11-';
const CACHE_DURATION_SUCCESS = 30 * 24 * 60 * 60 * 1000;
const CACHE_DURATION_ERROR = 12 * 60 * 60 * 1000;
const ICON_LOAD_TIMEOUT_MS = 1800;

type RuntimeFaviconCacheItem = {
  src: string | null;
  expiresAt: number;
};

type LocalStorageFaviconCacheItem = {
  src?: string;
  timestamp?: number;
  errorTimestamp?: number;
};

const runtimeFaviconCache = new Map<string, RuntimeFaviconCacheItem>();

const getFaviconCacheKey = (domain: string): string => `${FAVICON_CACHE_PREFIX}${domain}`;

const getIconCandidates = (hostWithPort: string, scheme: 'http:' | 'https:' = 'https:', customIcon?: string): string[] => {
  const normalizedHost = hostWithPort.replace(/^www\./, '');
  const candidates = [
    `${scheme}//${normalizedHost}/favicon.ico`,
    `https://icons.duckduckgo.com/ip3/${encodeURIComponent(normalizedHost)}.ico`,
  ];

  if (customIcon?.trim()) {
    candidates.unshift(customIcon.trim());
  }

  return Array.from(new Set(candidates));
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
  const [isCurrentIconLoaded, setIsCurrentIconLoaded] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ visible: boolean; x: number; y: number }>({
    visible: false,
    x: 0,
    y: 0,
  });

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    let isActive = true; 

    setShowFallbackIcon(false);
    setCurrentIconSrc(null);
    setIsCurrentIconLoaded(false);

    const fullBookmarkUrl = getFullUrlWithScheme(bookmark.url);
    let hostWithPort: string;
    let scheme: 'http:' | 'https:' = 'https:';
    try {
      const parsed = new URL(fullBookmarkUrl);
      hostWithPort = parsed.host;
      scheme = parsed.protocol === 'http:' ? 'http:' : 'https:';
    } catch {
      if (isActive) setShowFallbackIcon(true);
      return;
    }
    const normalizedHost = hostWithPort.replace(/^www\./, '');
    const customIconUrl = bookmark.iconUrl || bookmark.icon;
    const iconCandidates = getIconCandidates(normalizedHost, scheme, customIconUrl);
    const cacheKey = getFaviconCacheKey(normalizedHost);

    // If we already have a DB-persisted icon URL, always prefer it over domain cache.
    // This avoids sticking to stale favicon cache after a manual icon upload.
    if (customIconUrl?.trim()) {
      if (isActive) {
        setCurrentIconSrc(customIconUrl.trim());
      }
      return () => {
        isActive = false;
      };
    }

    try {
      const cachedItemString = localStorage.getItem(cacheKey);
      const now = Date.now();
      const runtimeCachedItem = runtimeFaviconCache.get(normalizedHost);

      if (runtimeCachedItem && runtimeCachedItem.expiresAt > now) {
        if (isActive) {
          if (runtimeCachedItem.src) {
            setCurrentIconSrc(runtimeCachedItem.src);
          } else {
            setShowFallbackIcon(true);
            setCurrentIconSrc(null);
          }
        }
        return;
      }

      if (runtimeCachedItem && runtimeCachedItem.expiresAt <= now) {
        runtimeFaviconCache.delete(normalizedHost);
      }

      if (cachedItemString) {
        const cachedItem = JSON.parse(cachedItemString) as LocalStorageFaviconCacheItem;

        if (
          cachedItem.src &&
          cachedItem.timestamp &&
          now - cachedItem.timestamp < CACHE_DURATION_SUCCESS
        ) {
          runtimeFaviconCache.set(normalizedHost, {
            src: cachedItem.src,
            expiresAt: cachedItem.timestamp + CACHE_DURATION_SUCCESS,
          });
          if (isActive) {
            setCurrentIconSrc(cachedItem.src);
          }
          return;
        }

        if (
          cachedItem.errorTimestamp &&
          now - cachedItem.errorTimestamp < CACHE_DURATION_ERROR
        ) {
          runtimeFaviconCache.set(normalizedHost, {
            src: null,
            expiresAt: cachedItem.errorTimestamp + CACHE_DURATION_ERROR,
          });
          if (isActive) {
            setShowFallbackIcon(true);
            setCurrentIconSrc(null);
          }
          return;
        }
      }
    } catch (error) {
      console.warn(`[BookmarkItem] Error reading or parsing cache for ${normalizedHost}:`, error);
      try {
        localStorage.removeItem(cacheKey);
      } catch (removeError) {
        console.warn(`[BookmarkItem] Error removing invalid cache for ${normalizedHost}:`, removeError);
      }
    }
    
    if (isActive) {
      setCurrentIconSrc(iconCandidates[0]);
    }

    return () => {
      isActive = false;
    };
  }, [bookmark.url, bookmark.icon, bookmark.iconUrl]);

  const moveToNextIconCandidate = useCallback(() => {
    try {
      const fullBookmarkUrl = getFullUrlWithScheme(bookmark.url);
      const parsed = new URL(fullBookmarkUrl);
      const hostWithPort = parsed.host.replace(/^www\./, '');
      const scheme = parsed.protocol === 'http:' ? 'http:' : 'https:';
      const customIconUrl = bookmark.iconUrl || bookmark.icon;
      const iconCandidates = getIconCandidates(hostWithPort, scheme, customIconUrl);

      const activeSourceIndex = currentIconSrc
        ? iconCandidates.findIndex((iconSrc) => iconSrc === currentIconSrc)
        : -1;
      const nextSourceIndex = activeSourceIndex + 1;
      if (nextSourceIndex < iconCandidates.length) {
        setCurrentIconSrc(iconCandidates[nextSourceIndex]);
        return;
      }

      setShowFallbackIcon(true);
      setCurrentIconSrc(null);
      const errorTimestamp = Date.now();
      const cacheKey = getFaviconCacheKey(hostWithPort);
      runtimeFaviconCache.set(hostWithPort, {
        src: null,
        expiresAt: errorTimestamp + CACHE_DURATION_ERROR,
      });
      localStorage.setItem(cacheKey, JSON.stringify({ errorTimestamp }));
    } catch (error) {
      setShowFallbackIcon(true);
      setCurrentIconSrc(null);
      console.warn(`[BookmarkItem] Error handling favicon fallback for ${bookmark.url}:`, error);
    }
  }, [bookmark.url, bookmark.icon, bookmark.iconUrl, currentIconSrc]);

  const handleImageError = () => {
    moveToNextIconCandidate();
  };

  useEffect(() => {
    setIsCurrentIconLoaded(false);
  }, [currentIconSrc]);

  useEffect(() => {
    if (!currentIconSrc || showFallbackIcon || isCurrentIconLoaded) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      moveToNextIconCandidate();
    }, ICON_LOAD_TIMEOUT_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [currentIconSrc, showFallbackIcon, isCurrentIconLoaded, moveToNextIconCandidate]);

  const handleImageLoad = () => {
    if (currentIconSrc && !showFallbackIcon) { 
      setIsCurrentIconLoaded(true);
      try {
        const fullBookmarkUrl = getFullUrlWithScheme(bookmark.url);
        const hostWithPort = new URL(fullBookmarkUrl).host.replace(/^www\./, '');
        const customIconUrl = bookmark.iconUrl || bookmark.icon;
        if (customIconUrl?.trim()) {
          // Do not cache DB custom icon URL into domain cache to avoid stale cache pollution.
          return;
        }
        const cacheKey = getFaviconCacheKey(hostWithPort);
        const timestamp = Date.now();
        runtimeFaviconCache.set(hostWithPort, {
          src: currentIconSrc,
          expiresAt: timestamp + CACHE_DURATION_SUCCESS,
        });
        localStorage.setItem(cacheKey, JSON.stringify({
          src: currentIconSrc,
          timestamp,
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
    transform: CSS.Translate.toString(transform),
    transition: isDragging ? 'none' : transition,
    willChange: isDragging ? 'transform' : undefined,
    zIndex: isDragging ? 50 : undefined,
  };

  if (!isAdminAuthenticated && bookmark.isPrivate) {
    return null; 
  }

  const closeContextMenu = () => {
    setContextMenu((prev) => (prev.visible ? { ...prev, visible: false } : prev));
  };

  const handleContextMenu = (event: React.MouseEvent) => {
    if (!isAdminAuthenticated) return;
    event.preventDefault();
    const MENU_WIDTH = 160;
    const MENU_HEIGHT = 84;
    const PADDING = 8;

    const x = Math.min(event.clientX, window.innerWidth - MENU_WIDTH - PADDING);
    const y = Math.min(event.clientY, window.innerHeight - MENU_HEIGHT - PADDING);
    setContextMenu({
      visible: true,
      x: Math.max(PADDING, x),
      y: Math.max(PADDING, y),
    });
  };

  useEffect(() => {
    if (!contextMenu.visible) return;

    const handleClose = () => closeContextMenu();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeContextMenu();
    };

    window.addEventListener('click', handleClose);
    window.addEventListener('scroll', handleClose, true);
    window.addEventListener('resize', handleClose);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('click', handleClose);
      window.removeEventListener('scroll', handleClose, true);
      window.removeEventListener('resize', handleClose);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [contextMenu.visible]);

  const bookmarkDomain = getBookmarkDomain(bookmark.url);
  const metaText = bookmark.description?.trim() || bookmarkDomain;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...(isDraggable ? attributes : {})}
      className={cn(
        "group relative rounded-2xl flex flex-col",
        isDragging
          ? 'shadow-2xl scale-[1.02] z-50'
          : 'transition-shadow duration-200 hover:shadow-[0_24px_34px_-24px_hsl(var(--foreground)/0.45)]',
      )}
    >
      <Card className={cn(
        "flex-grow overflow-hidden rounded-2xl border border-black/[0.03] bg-card shadow-[0_14px_26px_-18px_hsl(var(--foreground)/0.42)]",
        "group-hover:-translate-y-0.5 group-hover:shadow-[0_22px_34px_-20px_hsl(var(--foreground)/0.48)]",
        isDragging ? 'shadow-[0_24px_38px_-18px_hsl(var(--foreground)/0.58)]' : ''
      )} onContextMenu={handleContextMenu}>
        <div className="flex items-center p-2.5">
          {isAdminAuthenticated && isDraggable && (
            <button
              {...listeners}
              className="cursor-grab touch-none p-1 mr-1.5 text-muted-foreground hover:text-foreground group-hover:opacity-100 opacity-55 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md"
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
            <div
              className={cn(
                "relative flex-shrink-0 w-11 h-11 flex items-center justify-center mr-2.5 rounded-xl overflow-hidden",
                "bg-transparent"
              )}
            >
              {(showFallbackIcon || !currentIconSrc) && (
                <img
                  src="/mark.png"
                  alt=""
                  width={44}
                  height={44}
                  className="absolute inset-0 w-full h-full object-contain"
                  loading="lazy"
                  decoding="async"
                />
              )}
              {!showFallbackIcon && currentIconSrc && (
                <img
                  key={currentIconSrc} 
                  src={currentIconSrc}
                  alt="" 
                  width={44}
                  height={44}
                  className="absolute inset-0 w-full h-full object-cover"
                  loading="lazy"
                  decoding="async"
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
      </Card>

      {isMounted && isAdminAuthenticated && contextMenu.visible && createPortal(
        <div
          className="fixed z-[90] min-w-40 rounded-xl border border-border/70 bg-popover/95 text-popover-foreground backdrop-blur p-1.5 shadow-[0_18px_36px_-22px_hsl(var(--foreground)/0.6)]"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={(event) => event.stopPropagation()}
          onContextMenu={(event) => event.preventDefault()}
        >
          <button
            type="button"
            className="w-full flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm hover:bg-muted transition-colors"
            onClick={() => {
              closeContextMenu();
              onEditBookmark(bookmark);
            }}
          >
            <PenLine className="h-3.5 w-3.5" />
            编辑书签
          </button>
          <button
            type="button"
            className="w-full flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
            onClick={() => {
              closeContextMenu();
              setIsDeleteDialogOpen(true);
            }}
          >
            <Trash2 className="h-3.5 w-3.5" />
            删除书签
          </button>
        </div>,
        document.body
      )}

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确定删除书签 "{bookmark.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              此操作无法撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setIsDeleteDialogOpen(false);
                onDeleteBookmark(bookmark.id);
              }}
              className="bg-destructive hover:bg-destructive/90"
            >
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default BookmarkItem;
