
"use client";

import React from 'react';
import type { Bookmark } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link2, Trash2 } from 'lucide-react';
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
}

const BookmarkItem: React.FC<BookmarkItemProps> = ({ bookmark, onDeleteBookmark }) => {
  const { toast } = useToast();
  const getFaviconUrl = (url: string) => {
    try {
      const domain = new URL(url).hostname;
      // Google S2 service provides 32x32 favicons, which is a good size.
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
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
    <Card className="group relative shadow-sm hover:shadow-md transition-all duration-200 ease-in-out overflow-hidden bg-card/80 backdrop-blur-sm border border-border/50 hover:border-primary/50">
      <CardContent className="p-2 flex flex-col items-center justify-center aspect-[3/2] text-center">
        <a
          href={bookmark.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center justify-center w-full h-full text-card-foreground hover:text-primary transition-colors group"
          aria-label={`打开 ${bookmark.name}`}
        >
          {favicon ? (
            <Image 
              src={favicon} 
              alt={`${bookmark.name} 图标`} 
              width={28} // Reduced size
              height={28} // Reduced size
              className="mb-1.5 rounded object-contain group-hover:scale-110 transition-transform"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                // Optionally, show a fallback generic icon if favicon fails
                const fallbackIcon = e.currentTarget.parentElement?.querySelector('.fallback-icon');
                if (fallbackIcon) fallbackIcon.classList.remove('hidden');
              }}
            />
          ) : null}
          {/* Fallback icon, initially hidden if favicon is supposed to load */}
          <Link2 className={`h-7 w-7 mb-1.5 opacity-60 group-hover:opacity-90 fallback-icon ${favicon ? 'hidden' : ''}`} />
          
          <span className="text-xs font-medium truncate w-full px-0.5 group-hover:underline leading-tight">
            {bookmark.name}
          </span>
        </a>
      </CardContent>
      <AlertDialog>
        <AlertDialogTrigger asChild>
           <Button
            variant="ghost"
            size="icon"
            className="absolute top-0.5 right-0.5 h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity text-destructive/70 hover:text-destructive hover:bg-destructive/10 p-0"
            aria-label={`删除 ${bookmark.name}`}
          >
            <Trash2 className="h-2.5 w-2.5" />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确定吗？</AlertDialogTitle>
            <AlertDialogDescription>
              此操作将删除书签 "{bookmark.name}"。此操作无法撤销。
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
    </Card>
  );
};

export default BookmarkItem;
