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
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
    } catch (error) {
      return ''; // Return empty string or a default icon path if URL is invalid
    }
  };
  const favicon = getFaviconUrl(bookmark.url);

  const handleDelete = () => {
    onDeleteBookmark(bookmark.id);
    toast({ title: "书签已删除", description: `"${bookmark.name}" 已被删除。`, variant: "destructive" });
  };

  return (
    <Card className="group relative shadow-sm hover:shadow-lg transition-shadow duration-200 ease-in-out overflow-hidden">
      <CardContent className="p-3 flex flex-col items-center justify-center aspect-square text-center">
        <a
          href={bookmark.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center justify-center w-full h-full text-card-foreground hover:text-primary transition-colors"
          aria-label={`打开 ${bookmark.name}`}
        >
          {favicon ? (
            <Image 
              src={favicon} 
              alt={`${bookmark.name} 图标`} 
              width={32} 
              height={32} 
              className="mb-2 rounded object-contain"
              onError={(e) => (e.currentTarget.style.display = 'none')} // Hide if favicon fails to load
            />
          ) : (
            <Link2 className="h-8 w-8 mb-2 opacity-70 group-hover:opacity-100" />
          )}
          <span className="text-sm font-medium truncate w-full px-1 group-hover:underline">
            {bookmark.name}
          </span>
        </a>
      </CardContent>
      <AlertDialog>
        <AlertDialogTrigger asChild>
           <Button
            variant="ghost"
            size="icon"
            className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:bg-destructive/10"
            aria-label={`删除 ${bookmark.name}`}
          >
            <Trash2 className="h-3 w-3" />
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
