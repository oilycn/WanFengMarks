
"use client";

import React, { FC } from 'react';
import type { Bookmark, Category } from '@/types';
import BookmarkItem from './BookmarkItem';
import { Button } from '@/components/ui/button';
import { FolderOpen, SearchX, EyeOff, Save, Globe2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { iconMap as globalIconMap } from './AppSidebar';

// Import dnd-kit components and hooks
import {
  SortableContext,
  rectSortingStrategy,
} from '@dnd-kit/sortable';


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
}) => {

  const getCategoryById = (id: string) => categories.find((c: Category) => c.id === id);
  const canDrag = isAdminAuthenticated && activeCategoryId && activeCategoryId !== 'all';
  const sectionTitleClass = "text-xl font-semibold text-foreground flex items-center tracking-tight";
  const sectionTitleWrapClass = "flex justify-between items-end gap-3 mb-3 px-1";

  const renderBookmarksList = (bookmarksToRender: Bookmark[], isDraggableContext: boolean) => (
    <div className={cn(
        "relative grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-3 md:gap-4",
    )}>
      {bookmarksToRender.map((bookmark: Bookmark) => (
        <BookmarkItem
          key={bookmark.id}
          id={bookmark.id} 
          bookmark={bookmark}
          onDeleteBookmark={onDeleteBookmark}
          onEditBookmark={onEditBookmark}
          isAdminAuthenticated={isAdminAuthenticated}
          isDraggable={isDraggableContext && canDrag} 
        />
      ))}
    </div>
  );

  if (bookmarks.length === 0 && activeCategoryId) {
     if (searchQuery && searchQuery.trim() !== '') {
        return (
          <div className="wm-panel text-center py-14 px-6">
            <SearchX className="mx-auto h-16 w-16 text-muted-foreground/50 mb-4" />
            <h2 className="text-2xl font-semibold mb-2 text-foreground/80">未找到与 "{searchQuery}" 相关的书签</h2>
            <p className="text-md text-muted-foreground">请尝试修改您的搜索词，或清除搜索框以显示所有书签。</p>
          </div>
        );
     }
     const activeCat = getCategoryById(activeCategoryId);
     if (activeCat && activeCat.isPrivate && !isAdminAuthenticated) {
        return (
          <div className="wm-panel text-center py-14 px-6">
            <EyeOff className="mx-auto h-16 w-16 text-muted-foreground/50 mb-4" />
            <h2 className="text-2xl font-semibold mb-2 text-foreground/80">此分类为私密分类</h2>
            <p className="text-md text-muted-foreground">请输入管理员密码以查看内容。</p>
          </div>
        );
     }
     return (
      <div className="wm-panel text-center py-14 px-6">
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


  if (canDrag && activeCategoryId && activeCategoryId !== 'all') {
    // Ensure we are only passing IDs of items *within the current sortable category* to SortableContext
    const itemsInCurrentCategory = bookmarks.filter(bm => bm.categoryId === activeCategoryId);
    const itemIdsInCurrentCategory = itemsInCurrentCategory.map(bm => bm.id);
    return (
      <>
        <div className={sectionTitleWrapClass}>
            <div>
              <h2
                  id={`category-title-main-${activeCategoryId}`}
                  className={sectionTitleClass}
              >
                  <CategoryIconComponent className="mr-2 h-5 w-5 text-primary flex-shrink-0" />
                  {currentCategoryName}
                  {categories.find((c: Category) => c.id === activeCategoryId)?.isPrivate && <EyeOff className="ml-2 h-4 w-4 text-muted-foreground" title="私密分类" />}
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                共 {itemsInCurrentCategory.length} 个书签
              </p>
            </div>
            {isAdminAuthenticated && hasPendingOrderChanges && (
                <Button onClick={onSaveOrder} size="sm" className="rounded-xl bg-primary text-primary-foreground hover:bg-primary/90">
                    <Save className="mr-2 h-4 w-4" />
                    保存书签顺序
                </Button>
            )}
        </div>
        <SortableContext
          items={itemIdsInCurrentCategory} // Only pass IDs of items in the current, sortable category
          strategy={rectSortingStrategy} // Suitable for grids
        >
          {renderBookmarksList(itemsInCurrentCategory, true)}
        </SortableContext>
      </>
    );
  }

  // Fallback for 'all' categories or when not in admin mode for a specific category
  return (
    <div className="space-y-8">
      {(activeCategoryId === 'all' || !activeCategoryId) ? (
        categories
          .filter((c: Category) => c.isVisible && (!c.isPrivate || isAdminAuthenticated))
          .sort((a: Category, b: Category) => (b.priority || 0) - (a.priority || 0)) // Sort categories by priority
          .map((category: Category) => {
            const categoryBookmarks = bookmarks.filter(
              (bookmark: Bookmark) => bookmark.categoryId === category.id
            );
            if (categoryBookmarks.length === 0) return null;

            const CatIcon = globalIconMap[category.icon || 'Default'] || globalIconMap['Default'];

            return (
              <section key={category.id} aria-labelledby={`category-title-${category.id}`} className="wm-fade-up">
                 <div className={sectionTitleWrapClass}>
                    <div>
                      <h2
                          id={`category-title-${category.id}`}
                          className={sectionTitleClass}
                      >
                          <CatIcon className="mr-2 h-5 w-5 text-primary flex-shrink-0" />
                          {category.name}
                          {category.isPrivate && <EyeOff className="ml-2 h-4 w-4 text-muted-foreground" title="私密分类" />}
                      </h2>
                      <p className="text-xs text-muted-foreground mt-1">
                        共 {categoryBookmarks.length} 个书签
                      </p>
                    </div>
                 </div>
                {renderBookmarksList(categoryBookmarks, false)}
              </section>
            );
          })
      ) : (
         // This case handles a specific category selected, but not in draggable mode (e.g., not admin)
        <>
            <div className={sectionTitleWrapClass}>
                <div>
                  <h2
                      id={`category-title-main-${activeCategoryId}`}
                      className={sectionTitleClass}
                  >
                      <CategoryIconComponent className="mr-2 h-5 w-5 text-primary flex-shrink-0" />
                      {currentCategoryName}
                      {activeCategoryId && categories.find((c: Category) => c.id === activeCategoryId)?.isPrivate && <EyeOff className="ml-2 h-4 w-4 text-muted-foreground" title="私密分类" />}
                  </h2>
                  <p className="text-xs text-muted-foreground mt-1">
                    共 {bookmarks.length} 个书签
                  </p>
                </div>
                 {/* Save button is shown here if changes are pending, even if not actively dragging (canDrag might be false but changes exist) */}
                 {isAdminAuthenticated && hasPendingOrderChanges && activeCategoryId && activeCategoryId !== 'all' && (
                    <Button onClick={onSaveOrder} size="sm" className="rounded-xl bg-primary text-primary-foreground hover:bg-primary/90">
                        <Save className="mr-2 h-4 w-4" />
                        保存书签顺序
                    </Button>
                )}
            </div>
            {renderBookmarksList(bookmarks, false)}
        </>
      )}
    </div>
  );
};

export default BookmarkGrid;
