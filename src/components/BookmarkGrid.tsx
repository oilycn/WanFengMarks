"use client";

import React from 'react';
import type { Bookmark, Category } from '@/types';
import BookmarkItem from './BookmarkItem';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

interface BookmarkGridProps {
  bookmarks: Bookmark[];
  categories: Category[];
  onDeleteBookmark: (id: string) => void;
}

const BookmarkGrid: React.FC<BookmarkGridProps> = ({ bookmarks, categories, onDeleteBookmark }) => {
  const visibleCategories = categories.filter(category => category.isVisible);

  if (bookmarks.length === 0 && visibleCategories.some(cat => cat.id === 'default')) {
     return (
      <div className="text-center py-10">
        <h2 className="text-2xl font-semibold mb-2">还没有书签！</h2>
        <p className="text-muted-foreground">点击“添加书签”开始使用。</p>
      </div>
    );
  }
  
  if (visibleCategories.length === 0) {
    return (
      <div className="text-center py-10">
        <h2 className="text-2xl font-semibold mb-2">没有可见的分类</h2>
        <p className="text-muted-foreground">切换分类可见性或添加新书签。</p>
      </div>
    );
  }


  return (
    <div className="space-y-8">
      {visibleCategories.map((category) => {
        const categoryBookmarks = bookmarks.filter(
          (bookmark) => bookmark.categoryId === category.id
        );

        if (categoryBookmarks.length === 0) {
          return (
            <div key={category.id}>
              <h2 className="text-2xl font-semibold mb-3 text-primary font-headline">{category.name}</h2>
              <p className="text-muted-foreground pl-1">此分类下暂无书签。</p>
              {visibleCategories.length > 1 && <Separator className="my-6" />}
            </div>
          );
        }

        return (
          <section key={category.id} aria-labelledby={`category-title-${category.id}`}>
            <h2 id={`category-title-${category.id}`} className="text-2xl font-semibold mb-4 text-primary font-headline">
              {category.name}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-4">
              {categoryBookmarks.map((bookmark) => (
                <BookmarkItem
                  key={bookmark.id}
                  bookmark={bookmark}
                  onDeleteBookmark={onDeleteBookmark}
                />
              ))}
            </div>
            {visibleCategories.indexOf(category) < visibleCategories.length - 1 && <Separator className="my-8" />}
          </section>
        );
      })}
    </div>
  );
};

export default BookmarkGrid;
