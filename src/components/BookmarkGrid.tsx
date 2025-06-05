
"use client";

import React from 'react';
import type { Bookmark, Category } from '@/types';
import BookmarkItem from './BookmarkItem';
import { FolderOpen, SearchX } from 'lucide-react';

interface BookmarkGridProps {
  bookmarks: Bookmark[];
  categories: Category[]; 
  onDeleteBookmark: (id: string) => void;
  isAdminAuthenticated: boolean;
  currentCategoryName?: string; 
  activeCategoryId: string | null;
  searchQuery?: string;
}

const BookmarkGrid: React.FC<BookmarkGridProps> = ({ 
    bookmarks, 
    categories, 
    onDeleteBookmark, 
    isAdminAuthenticated,
    currentCategoryName,
    activeCategoryId,
    searchQuery
}) => {

  const shouldGroup = activeCategoryId === 'all' || !activeCategoryId;
  
  const categoriesToDisplay = shouldGroup 
    ? categories.filter(c => c.isVisible && bookmarks.some(b => b.categoryId === c.id)) 
    : categories.filter(c => c.id === activeCategoryId && c.isVisible);


  if (bookmarks.length === 0) {
     if (searchQuery && searchQuery.trim() !== '') {
        return (
          <div className="text-center py-12">
            <SearchX className="mx-auto h-16 w-16 text-muted-foreground/50 mb-4" />
            <h2 className="text-2xl font-semibold mb-2 text-foreground/80">未找到与 "{searchQuery}" 相关的书签</h2>
            <p className="text-md text-muted-foreground">请尝试修改您的搜索词，或清除搜索框以显示所有书签。</p>
          </div>
        );
     }
     return (
      <div className="text-center py-12">
        <FolderOpen className="mx-auto h-16 w-16 text-muted-foreground/50 mb-4" />
        <h2 className="text-2xl font-semibold mb-2 text-foreground/80">"{currentCategoryName || '此分类'}" 中没有书签</h2>
        {isAdminAuthenticated ? (
          <p className="text-md text-muted-foreground">点击上方的 "添加书签" 按钮来添加新的书签吧！</p>
        ) : (
          <p className="text-md text-muted-foreground">当前分类下没有书签。</p>
        )}
      </div>
    );
  }
  
  return (
    <div className="space-y-8">
      {shouldGroup ? (
        categoriesToDisplay.map((category) => {
          const categoryBookmarks = bookmarks.filter(
            (bookmark) => bookmark.categoryId === category.id
          );
          if (categoryBookmarks.length === 0) return null;

          return (
            <section key={category.id} aria-labelledby={`category-title-${category.id}`}>
              <h2 id={`category-title-${category.id}`} className="text-2xl font-semibold mb-4 text-primary font-headline border-b pb-2">
                {category.name}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
                {categoryBookmarks.map((bookmark) => (
                  <BookmarkItem
                    key={bookmark.id}
                    bookmark={bookmark}
                    onDeleteBookmark={onDeleteBookmark}
                    isAdminAuthenticated={isAdminAuthenticated}
                  />
                ))}
              </div>
            </section>
          );
        })
      ) : (
        <section aria-labelledby={`category-title-main`}>
            {currentCategoryName && (
                 <h2 id={`category-title-main`} className="text-2xl font-semibold mb-4 text-primary font-headline border-b pb-2">
                    {currentCategoryName}
                </h2>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
            {bookmarks.map((bookmark) => (
                <BookmarkItem
                key={bookmark.id}
                bookmark={bookmark}
                onDeleteBookmark={onDeleteBookmark}
                isAdminAuthenticated={isAdminAuthenticated}
                />
            ))}
            </div>
        </section>
      )}
    </div>
  );
};

export default BookmarkGrid;
