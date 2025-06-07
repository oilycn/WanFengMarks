
"use client";

import React, { FC, useMemo } from 'react'; // Import FC and useMemo
import type { Bookmark, Category } from '@/types';
import BookmarkItem from './BookmarkItem';
import { Button } from '@/components/ui/button';
import { FolderOpen, SearchX, EyeOff, Save, Globe2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { iconMap as globalIconMap } from './AppSidebar';

// Import dnd-kit components and hooks
import {
  DndContext,
  closestCorners, // Using closestCorners for collision detection
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy, // Using rectSortingStrategy for grid
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';


interface BookmarkGridProps {
  bookmarks: Bookmark[];
  categories: Category[];
  onDeleteBookmark: (id: string) => void;
  onEditBookmark: (bookmark: Bookmark) => void;
  isAdminAuthenticated: boolean;
  currentCategoryName?: string;
  activeCategoryId: string | null;
  searchQuery?: string;
  hasPendingOrderChanges: boolean;
  onSaveOrder: () => void;
  onDragEnd: (event: DragEndEvent) => void; // Add onDragEnd prop
}

const BookmarkGrid: FC<BookmarkGridProps> = ({
    bookmarks,
    categories,
    onDeleteBookmark,
    onEditBookmark,
    isAdminAuthenticated,
    currentCategoryName,
    activeCategoryId,
    searchQuery,
    hasPendingOrderChanges,
    onSaveOrder,
    onDragEnd // Destructure onDragEnd
}) => {

  const getCategoryById = (id: string) => categories.find((c: Category) => c.id === id);
  const canDrag = isAdminAuthenticated && activeCategoryId && activeCategoryId !== 'all'; // canDrag logic simplified

  const renderNonDraggableBookmarksList = (bookmarksToRender: Bookmark[]) => (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
      {bookmarksToRender.map((bookmark: Bookmark) => (
        <BookmarkItem
          key={bookmark.id}
          bookmark={bookmark}
          onDeleteBookmark={onDeleteBookmark}
          onEditBookmark={onEditBookmark}
          isAdminAuthenticated={isAdminAuthenticated}
          isDraggable={false} // Non-draggable items are not draggable
          // No dnd-kit props needed for non-draggable items
        />
      ))}
    </div>
  );

  if (bookmarks.length === 0 && activeCategoryId) {
     if (searchQuery && searchQuery.trim() !== '') {
        return (
          <div className="text-center py-12">
            <SearchX className="mx-auto h-16 w-16 text-muted-foreground/50 mb-4" />
            <h2 className="text-2xl font-semibold mb-2 text-foreground/80">未找到与 "{searchQuery}" 相关的书签</h2>
            <p className="text-md text-muted-foreground">请尝试修改您的搜索词，或清除搜索框以显示所有书签。</p>
          </div>
        );
     }
     const activeCat = getCategoryById(activeCategoryId);
     if (activeCat && activeCat.isPrivate && !isAdminAuthenticated) {
        return (
          <div className="text-center py-12">
            <EyeOff className="mx-auto h-16 w-16 text-muted-foreground/50 mb-4" />
            <h2 className="text-2xl font-semibold mb-2 text-foreground/80">此分类为私密分类</h2>
            <p className="text-md text-muted-foreground">请输入管理员密码以查看内容。</p>
          </div>
        );
     }
     return (
      <div className="text-center py-12">
        <FolderOpen className="mx-auto h-16 w-16 text-muted-foreground/50 mb-4" />
        <h2 className="text-2xl font-semibold mb-2 text-foreground/80">"{currentCategoryName || '此分类'}" 中没有书签</h2>
        {isAdminAuthenticated ? (
          <p className="text-md text-muted-foreground">点击右下角的添加按钮来添加新的书签吧！</p>
        ) : (
          <p className="text-md text-muted-foreground">当前分类下没有书签。</p>
        )}
      </div>
    );
  }

  const CategoryIconComponent = activeCategoryId && categories.find((c: Category) => c.id === activeCategoryId)?.icon
    ? globalIconMap[categories.find((c: Category) => c.id === activeCategoryId)?.icon || 'Default'] || globalIconMap['Default']
    : Globe2;

  // dnd-kit setup
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // 5px tolerance before dragging starts
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Get the IDs of the bookmarks for the SortableContext
  const bookmarkIds = useMemo(() => bookmarks.map(bookmark => bookmark.id), [bookmarks]);


  if (canDrag) {
    return (
      <>
        <div className="flex justify-between items-center mb-4 border-b pb-2">
            <h2
                id={`category-title-main-${activeCategoryId}`}
                className="text-xl font-semibold text-foreground flex items-center"
            >
                <CategoryIconComponent className="mr-2 h-5 w-5 text-primary flex-shrink-0" />
                {currentCategoryName}
                {categories.find((c: Category) => c.id === activeCategoryId)?.isPrivate && <EyeOff className="ml-2 h-4 w-4 text-muted-foreground" title="私密分类" />}
            </h2>
            {isAdminAuthenticated && hasPendingOrderChanges && (
                <Button onClick={onSaveOrder} size="sm" className="bg-green-600 hover:bg-green-700 text-white">
                    <Save className="mr-2 h-4 w-4" />
                    保存书签顺序
                </Button>
            )}
        </div>
        {/* DndContext wraps the entire draggable area */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners} // Use closestCorners for grid
          onDragEnd={onDragEnd} // onDragEnd is handled by the parent (page.tsx)
        >
          {/* SortableContext manages the sortable items */}
          <SortableContext
            items={bookmarkIds} // Provide the list of item IDs
            strategy={rectSortingStrategy} // Use rectSortingStrategy for grid
          >
            <div
                className={cn(
                    "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4",
                    "rounded-md transition-colors",
                    // No snapshot.isDraggingOver class here, handled by individual items
                )}
            >
                {bookmarks.map((bookmark: Bookmark) => (
                    // BookmarkItem will use useSortable internally
                    <BookmarkItem
                      key={bookmark.id}
                      bookmark={bookmark}
                      onDeleteBookmark={onDeleteBookmark}
                      onEditBookmark={onEditBookmark}
                      isAdminAuthenticated={isAdminAuthenticated}
                      isDraggable={canDrag} // Pass isDraggable prop
                    />
                ))}
                {/* dnd-kit does not use a placeholder element like rbd */}
            </div>
          </SortableContext>
        </DndContext>
      </>
    );
  }

  // Fallback for non-draggable views (e.g., "All Bookmarks" or not admin)
  return (
    <div className="space-y-8">
      {(activeCategoryId === 'all' || !activeCategoryId) ? (
        categories
          .filter((c: Category) => c.isVisible && (!c.isPrivate || isAdminAuthenticated))
          .sort((a: Category, b: Category) => (b.priority || 0) - (a.priority || 0))
          .map((category: Category) => {
            const categoryBookmarks = bookmarks.filter(
              (bookmark: Bookmark) => bookmark.categoryId === category.id
            );
            if (categoryBookmarks.length === 0) return null;

            const CatIcon = globalIconMap[category.icon || 'Default'] || globalIconMap['Default'];

            return (
              <section key={category.id} aria-labelledby={`category-title-${category.id}`}>
                 <div className="flex justify-between items-center mb-4 border-b pb-2">
                    <h2
                        id={`category-title-${category.id}`}
                        className="text-xl font-semibold text-foreground flex items-center"
                    >
                        <CatIcon className="mr-2 h-5 w-5 text-primary flex-shrink-0" />
                        {category.name}
                        {category.isPrivate && <EyeOff className="ml-2 h-4 w-4 text-muted-foreground" title="私密分类" />}
                    </h2>
                 </div>
                {renderNonDraggableBookmarksList(categoryBookmarks)}
              </section>
            );
          })
      ) : (
        <>
            <div className="flex justify-between items-center mb-4 border-b pb-2">
                <h2
                    id={`category-title-main-${activeCategoryId}`}
                    className="text-xl font-semibold text-foreground flex items-center"
                >
                    <CategoryIconComponent className="mr-2 h-5 w-5 text-primary flex-shrink-0" />
                    {currentCategoryName}
                    {activeCategoryId && categories.find((c: Category) => c.id === activeCategoryId)?.isPrivate && <EyeOff className="ml-2 h-4 w-4 text-muted-foreground" title="私密分类" />}
                </h2>
            </div>
            {renderNonDraggableBookmarksList(bookmarks)}
        </>
      )}
    </div>
  );
};

export default BookmarkGrid;
