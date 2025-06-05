
"use client";

import React from 'react';
import type { Bookmark } from '@/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link2, Trash2, EyeOff, PenLine } from 'lucide-react';
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
import { useToast } from "@/hooks/use-toast";

interface BookmarkItemProps {
  bookmark: Bookmark;
  onDeleteBookmark: (id: string) => void;
  onEditBookmark: (bookmark: Bookmark) => void;
  isAdminAuthenticated: boolean;
}

const BookmarkItem: React.FC<BookmarkItemProps> = ({ bookmark, onDeleteBookmark, onEditBookmark, isAdminAuthenticated }) => {
  const { toast } = useToast();
  
  const getFaviconUrl = (url: string) => {
    try {
      const domain = new URL(url).hostname;
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`; 
    } catch (error) {
      console.error("Invalid URL for favicon:", url, error);
      return ''; 
    }
  };
  const favicon = getFaviconUrl(bookmark.url);

  const handleDelete = () => {
    onDeleteBookmark(bookmark.id);
    toast({ title: "书签已删除", description: `"${bookmark.name}" 已被删除。`, variant: "destructive" });
  };

  if (!isAdminAuthenticated && bookmark.isPrivate) {
    return null;
  }

  return (
    <Card className="group relative shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out overflow-hidden bg-card/70 backdrop-blur-sm border border-border/60 hover:border-primary/70 rounded-lg flex flex-col group-hover:bg-accent/10 group-focus-within:bg-accent/10">
      <a
        href={bookmark.url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex-grow p-3 flex flex-col text-card-foreground hover:text-primary transition-colors no-underline hover:no-underline"
        aria-label={`打开 ${bookmark.name}`}
      >
        <div className="flex items-start space-x-3">
          {favicon ? (
            <Image 
              src={favicon} 
              alt="" 
              width={32} 
              height={32}
              className="mt-0.5 rounded-md object-contain group-hover:scale-110 transition-transform flex-shrink-0"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                const fallbackIcon = target.closest('.flex')?.querySelector('.fallback-icon');
                if (fallbackIcon) fallbackIcon.classList.remove('hidden');
              }}
            />
          ) : null}
          <Link2 className={`h-8 w-8 text-muted-foreground fallback-icon ${favicon ? 'hidden' : ''} flex-shrink-0`} />
          
          <div className="flex-grow min-w-0">
            <h3 className="text-sm font-semibold truncate flex items-center" title={bookmark.name}>
              {bookmark.name}
              {bookmark.isPrivate && <EyeOff className="ml-1.5 h-3 w-3 text-muted-foreground/70 flex-shrink-0" title="私密书签"/>}
            </h3>
            {bookmark.description && (
              <p className="text-xs text-muted-foreground mt-0.5 truncate" title={bookmark.description}>
                {bookmark.description}
              </p>
            )}
          </div>
          {/* Removed ArrowUpRightSquare icon from here */}
        </div>
      </a>
      
      {isAdminAuthenticated && (
        <div className="absolute top-1 right-1 flex items-center opacity-0 group-hover:opacity-100 transition-opacity space-x-0.5">
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
  );
};

export default BookmarkItem;
