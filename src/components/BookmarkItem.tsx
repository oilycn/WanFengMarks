
"use client";

import React from 'react';
import type { Bookmark } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'; // CardHeader, CardTitle not used currently
import { Button } from '@/components/ui/button';
import { Link2, Trash2, ArrowUpRightSquare } from 'lucide-react';
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
  isAdminAuthenticated: boolean;
}

const BookmarkItem: React.FC<BookmarkItemProps> = ({ bookmark, onDeleteBookmark, isAdminAuthenticated }) => {
  const { toast } = useToast();
  
  const getFaviconUrl = (url: string) => {
    try {
      const domain = new URL(url).hostname;
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`; // Increased size for better quality
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

  return (
    <Card className="group relative shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out overflow-hidden bg-card/70 backdrop-blur-sm border border-border/60 hover:border-primary/70 rounded-lg flex flex-col">
      <a
        href={bookmark.url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex-grow p-3 flex flex-col text-card-foreground hover:text-primary transition-colors"
        aria-label={`打开 ${bookmark.name}`}
      >
        <div className="flex items-start space-x-3">
          {favicon ? (
            <Image 
              src={favicon} 
              alt="" // Alt text handled by link
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
            <h3 className="text-sm font-semibold truncate group-hover:underline" title={bookmark.name}>
              {bookmark.name}
            </h3>
            {bookmark.description && (
              <p className="text-xs text-muted-foreground mt-0.5 truncate" title={bookmark.description}>
                {bookmark.description}
              </p>
            )}
          </div>
          <ArrowUpRightSquare className="h-4 w-4 text-muted-foreground/70 group-hover:text-primary transition-colors ml-auto flex-shrink-0 mt-0.5" />
        </div>
      </a>
      
      {isAdminAuthenticated && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
             <Button
              variant="ghost"
              size="icon"
              className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-destructive/60 hover:text-destructive hover:bg-destructive/10 p-1 rounded-full"
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
      )}
    </Card>
  );
};

export default BookmarkItem;
