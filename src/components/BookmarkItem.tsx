
"use client";

import React from 'react'; // Import React
import type { Bookmark } from '@/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link2, Trash2, EyeOff, PenLine, GripVertical } from 'lucide-react';
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
import type { DraggableProvidedDraggableProps, DraggableProvidedDragHandleProps } from 'react-beautiful-dnd';

interface BookmarkItemProps {
  bookmark: Bookmark;
  onDeleteBookmark: (id: string) => void;
  onEditBookmark: (bookmark: Bookmark) => void;
  isAdminAuthenticated: boolean;
  innerRef?: (element: HTMLElement | null) => void;
  draggableProps?: DraggableProvidedDraggableProps;
  dragHandleProps?: DraggableProvidedDragHandleProps;
  isDragging?: boolean;
}

const BookmarkItem: React.FC<BookmarkItemProps> = React.memo(({
  bookmark,
  onDeleteBookmark,
  onEditBookmark,
  isAdminAuthenticated,
  innerRef,
  draggableProps,
  dragHandleProps,
  isDragging
}) => {
  const { toast } = useToast();
  const [faviconError, setFaviconError] = React.useState(false);

  React.useEffect(() => {
    setFaviconError(false); // Reset error state when bookmark URL (and thus favicon URL) changes
  }, [bookmark.url]);

  const getFaviconUrl = (url: string) => {
    try {
      const domain = new URL(url).hostname;
      const googleFaviconServiceUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
      return `https://proxy.oily.cn/proxy/${googleFaviconServiceUrl}`;
    } catch (error) {
      console.error("Invalid URL for favicon:", url, error);
      return '';
    }
  };
  const favicon = getFaviconUrl(bookmark.url);

  const handleDelete = () => {
    onDeleteBookmark(bookmark.id);
    toast({ title: "书签已删除", description: `"${bookmark.name}" 已被删除。`, variant: "destructive", duration: 2000 });
  };

  if (!isAdminAuthenticated && bookmark.isPrivate) {
    return null;
  }

  return (
    <div
      ref={innerRef}
      {...draggableProps}
      className={`group relative rounded-lg flex flex-col transition-shadow ${isDragging ? 'shadow-2xl scale-105 bg-card' : 'shadow-lg hover:shadow-xl bg-card/70'}`}
    >
      <Card className={`flex-grow overflow-hidden backdrop-blur-sm border border-border/60 hover:border-primary/70 rounded-lg group-hover:bg-accent/10 group-focus-within:bg-accent/10 ${isDragging ? 'border-primary ring-2 ring-primary' : ''}`}>
        <div className="flex items-center p-3">
          {isAdminAuthenticated && dragHandleProps && (
            <div {...dragHandleProps} className="cursor-grab p-1 mr-1 text-muted-foreground hover:text-foreground group-hover:opacity-100 opacity-50 transition-opacity" aria-label="拖动排序">
              <GripVertical className="h-4 w-4" />
            </div>
          )}
          <a
            href={bookmark.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-grow flex items-center text-card-foreground hover:text-primary transition-colors no-underline hover:no-underline" // Removed space-x-3, will use margin on icon container
            aria-label={`打开 ${bookmark.name}`}
            onClick={(e) => { if(isDragging) e.preventDefault();}} // Prevent navigation while dragging
          >
            <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center mr-2"> {/* Icon container with fixed size and margin */}
              {favicon && !faviconError ? (
                <Image
                  src={favicon}
                  alt="" // Decorative, alt can be empty
                  width={32}
                  height={32}
                  className="rounded-md object-contain" // Removed group-hover scale for simplicity
                />
              ) : (
                <Link2 className="w-5 h-5 text-muted-foreground" /> // Fallback icon, sized to fit well
              )}
            </div>

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
          </a>
        </div>

        {isAdminAuthenticated && (
          <div className="absolute top-1 right-1 flex items-center opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity space-x-0.5" style={isDragging ? { opacity: 1 } : {}}>
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
});

BookmarkItem.displayName = 'BookmarkItem';

export default BookmarkItem;
