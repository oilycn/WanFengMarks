
"use client";

import React from 'react';
import type { Bookmark, Category } from '@/types';
import BookmarkItem from './BookmarkItem';
import { Button } from '@/components/ui/button';
import { FolderOpen, SearchX, EyeOff, Save, Globe2 } from 'lucide-react';
import dynamic from 'next/dynamic';
import { cn } from '@/lib/utils';
import { iconMap as globalIconMap } from './AppSidebar';

// Dynamically import react-beautiful-dnd components
const Droppable = dynamic(() =>
  import('react-beautiful-dnd').then(mod => mod.Droppable), { ssr: false }
);
const Draggable = dynamic(() =>
  import('react-beautiful-dnd').then(mod => mod.Draggable), { ssr: false }
);


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
}

const BookmarkGrid: React.FC<BookmarkGridProps> = ({
    bookmarks,
    categories,
    onDeleteBookmark,
    onEditBookmark,
    isAdminAuthenticated,
    currentCategoryName,
    activeCategoryId,
    searchQuery,
    hasPendingOrderChanges,
    onSaveOrder
}) => {

  const getCategoryById = (id: string) => categories.find(c => c.id === id);
  const canDrag = isAdminAuthenticated && activeCategoryId && activeCategoryId !== 'all' && Droppable && Draggable;

  const renderNonDraggableBookmarksList = (bookmarksToRender: Bookmark[]) => (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
      {bookmarksToRender.map((bookmark) => (
        <BookmarkItem
          key={bookmark.id}
          bookmark={bookmark}
          onDeleteBookmark={onDeleteBookmark}
          onEditBookmark={onEditBookmark}
          isAdminAuthenticated={isAdminAuthenticated}
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

  const CategoryIconComponent = activeCategoryId && categories.find(c => c.id === activeCategoryId)?.icon
    ? globalIconMap[categories.find(c => c.id === activeCategoryId)?.icon || 'Default'] || globalIconMap['Default']
    : Globe2;

  if (canDrag && Droppable && Draggable) {
    return (
      <>
        <div className="flex justify-between items-center mb-4 border-b pb-2">
            <h2
                id={`category-title-main-${activeCategoryId}`}
                className="text-xl font-semibold text-foreground flex items-center"
            >
                <CategoryIconComponent className="mr-2 h-5 w-5 text-primary flex-shrink-0" />
                {currentCategoryName}
                {categories.find(c => c.id === activeCategoryId)?.isPrivate && <EyeOff className="ml-2 h-4 w-4 text-muted-foreground" title="私密分类" />}
            </h2>
            {isAdminAuthenticated && hasPendingOrderChanges && (
                <Button onClick={onSaveOrder} size="sm" className="bg-green-600 hover:bg-green-700 text-white">
                    <Save className="mr-2 h-4 w-4" />
                    保存书签顺序
                </Button>
            )}
        </div>
        <Droppable
            key={activeCategoryId} 
            droppableId={activeCategoryId || 'droppable-area-fallback'}
            type="BOOKMARK"
            isDropDisabled={!canDrag}
            ignoreContainerClipping={true}
            isCombineEnabled={false}
        >
            {(provided, snapshot) => (
            <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className={cn(
                    "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4",
                    snapshot.isDraggingOver ? 'bg-accent/10 ring-1 ring-accent/50' : 'bg-transparent'
                )}
            >
                {bookmarks.map((bookmark, index) => (
                    <Draggable
                      key={bookmark.id}
                      draggableId={bookmark.id}
                      index={index}
                      isDragDisabled={!canDrag}
                    >
                      {(providedDraggable, snapshotDraggable) => (
                        <BookmarkItem
                          bookmark={bookmark}
                          onDeleteBookmark={onDeleteBookmark}
                          onEditBookmark={onEditBookmark}
                          isAdminAuthenticated={isAdminAuthenticated}
                          innerRef={providedDraggable.innerRef}
                          draggableProps={providedDraggable.draggableProps}
                          dragHandleProps={providedDraggable.dragHandleProps}
                          isDragging={snapshotDraggable.isDragging}
                        />
                      )}
                    </Draggable>
                ))}
                {provided.placeholder}
            </div>
            )}
        </Droppable>
      </>
    );
  }

  // Fallback for non-draggable views (e.g., "All Bookmarks" or not admin)
  return (
    <div className="space-y-8">
      {(activeCategoryId === 'all' || !activeCategoryId) ? (
        categories
          .filter(c => c.isVisible && (!c.isPrivate || isAdminAuthenticated))
          .sort((a, b) => (b.priority || 0) - (a.priority || 0))
          .map((category) => {
            const categoryBookmarks = bookmarks.filter(
              (bookmark) => bookmark.categoryId === category.id
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
                    {activeCategoryId && categories.find(c => c.id === activeCategoryId)?.isPrivate && <EyeOff className="ml-2 h-4 w-4 text-muted-foreground" title="私密分类" />}
                </h2>
            </div>
            {renderNonDraggableBookmarksList(bookmarks)}
        </>
      )}
    </div>
  );
};

export default BookmarkGrid;
