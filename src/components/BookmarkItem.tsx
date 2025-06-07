
"use client";

import React, { useState, useEffect } from 'react';
import type { Bookmark } from '@/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Globe2, Trash2, EyeOff, PenLine, GripVertical } from 'lucide-react';
import Image from 'next/image';
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

// Import dnd-kit hooks and utilities
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

const BookmarkItem: React.FC<BookmarkItemProps> = ({
  id,
  bookmark,
  onDeleteBookmark,
  onEditBookmark,
  isAdminAuthenticated,
  isDraggable,
}) => {
  const [faviconError, setFaviconError] = useState(false);

  useEffect(() => {
    setFaviconError(false); 
  }, [bookmark.url]);

  const getFaviconUrl = (url: string) => {
    try {
      const domain = new URL(url).hostname;
      // Using icon.horse service
      const iconHorseServiceUrl = `https://icon.horse/icon/${domain}`;
      return iconHorseServiceUrl;
    } catch (error) {
      console.error("Invalid URL for favicon:", url, error);
      return ''; // Return empty string or a path to a default icon if URL is invalid
    }
  };
  const favicon = getFaviconUrl(bookmark.url);

  const handleDelete = () => {
    onDeleteBookmark(bookmark.id);
  };

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging, // Provided by useSortable
  } = useSortable({ id: String(id), disabled: !isDraggable }); // Ensure ID is a string

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined, // Elevate a dragging item
  };


  if (!isAdminAuthenticated && bookmark.isPrivate) {
    return null; 
  }

  return (
    <div
      ref={setNodeRef} // This ref is for dnd-kit
      style={style} // Apply transform and transition styles
      {...(isDraggable ? attributes : {})} // Spread dnd-kit attributes if draggable
      className={cn(
        "group relative rounded-lg flex flex-col transition-shadow",
        isDragging ? 'shadow-2xl scale-105 bg-card z-50' : 'shadow-lg hover:shadow-xl bg-card/70', // Visual feedback for dragging
      )}
    >
      <Card className={cn(
        "flex-grow overflow-hidden backdrop-blur-sm border border-border/60 hover:border-primary/70 rounded-lg",
        "group-hover:bg-accent/10 group-focus-within:bg-accent/10", // subtle hover/focus for the card itself
        isDragging ? 'border-primary ring-2 ring-primary' : '' // More prominent border when dragging
      )}>
        <div className="flex items-center p-3">
          {/* Drag handle only shown if admin and draggable context */}
          {isAdminAuthenticated && isDraggable && (
            <div
              {...listeners} // Spread dnd-kit listeners for the drag handle
              className="cursor-grab p-1 mr-1 text-muted-foreground hover:text-foreground group-hover:opacity-100 opacity-50 transition-opacity"
              aria-label="拖动排序"
            >
              <GripVertical className="h-4 w-4" />
            </div>
          )}
          <a
            href={bookmark.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-grow flex items-center text-card-foreground hover:text-primary transition-colors no-underline hover:no-underline min-w-0" // Ensure link takes up space and min-w-0 for truncation
            aria-label={`打开 ${bookmark.name}`}
          >
            <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center mr-2 rounded-sm overflow-hidden bg-muted/20">
              {favicon && !faviconError ? (
                <Image
                  src={favicon}
                  alt="" // Decorative, alt text handled by link
                  width={32} // Explicit width
                  height={32} // Explicit height
                  className="object-contain w-full h-full" // Ensure image scales correctly
                  onError={() => {
                    console.warn(`Favicon failed to load for: ${bookmark.url} using ${favicon}`);
                    setFaviconError(true);
                  }}
                  unoptimized // If using external favicon service, optimization might not be needed/possible via next/image
                />
              ) : (
                <Globe2 className="w-5 h-5 text-muted-foreground" /> // Fallback icon
              )}
            </div>

            {/* Text content area */}
            <div className="flex-grow min-w-0"> {/* min-w-0 is crucial for truncation to work in flex items */}
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

        {/* Admin controls: Edit and Delete */}
        {isAdminAuthenticated && (
          <div className={cn(
            "absolute top-1 right-1 flex items-center opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity space-x-0.5",
            isDragging && "opacity-100" // Keep controls visible if dragging this item
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
                  <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
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
