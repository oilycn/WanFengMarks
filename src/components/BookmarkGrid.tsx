
"use client";

import React from 'react';
import type { Bookmark, Category } from '@/types';
import BookmarkItem from './BookmarkItem';
import { FolderOpen, SearchX, EyeOff } from 'lucide-react';
import { Droppable, Draggable } from 'react-beautiful-dnd';
import { Folder, Briefcase, BookOpen, Film, Gamepad2, GraduationCap, Headphones, Heart, Home, Image, Lightbulb, List, Lock, MapPin, MessageSquare, Music, Newspaper, Package, Palette, Plane, PlayCircle, Save, ShoppingBag, ShoppingCart, Smartphone, Sparkles, Star, ThumbsUp, PenTool, TrendingUp, Tv2, User, Video, Wallet, Wrench, Youtube, Zap, Settings, GripVertical, Settings2, Eye } from 'lucide-react';


const availableIcons: { name: string; value: string; IconComponent: React.ElementType }[] = [
  { name: '文件夹', value: 'Folder', IconComponent: Folder },
  { name: '公文包', value: 'Briefcase', IconComponent: Briefcase },
  { name: '书本', value: 'BookOpen', IconComponent: BookOpen },
  { name: '电影', value: 'Film', IconComponent: Film },
  { name: '游戏', value: 'Gamepad2', IconComponent: Gamepad2 },
  { name: '毕业帽', value: 'GraduationCap', IconComponent: GraduationCap },
  { name: '耳机', value: 'Headphones', IconComponent: Headphones },
  { name: '爱心', value: 'Heart', IconComponent: Heart },
  { name: '主页', value: 'Home', IconComponent: Home },
  { name: '图片', value: 'Image', IconComponent: Image },
  { name: '灯泡', value: 'Lightbulb', IconComponent: Lightbulb },
  { name: '列表', value: 'List', IconComponent: List },
  { name: '锁', value: 'Lock', IconComponent: Lock },
  { name: '地图钉', value: 'MapPin', IconComponent: MapPin },
  { name: '消息', value: 'MessageSquare', IconComponent: MessageSquare },
  { name: '音乐', value: 'Music', IconComponent: Music },
  { name: '报纸', value: 'Newspaper', IconComponent: Newspaper },
  { name: '包裹', value: 'Package', IconComponent: Package },
  { name: '调色板', value: 'Palette', IconComponent: Palette },
  { name: '飞机', value: 'Plane', IconComponent: Plane },
  { name: '播放', value: 'PlayCircle', IconComponent: PlayCircle },
  { name: '保存', value: 'Save', IconComponent: Save },
  { name: '购物袋', value: 'ShoppingBag', IconComponent: ShoppingBag },
  { name: '购物车', value: 'ShoppingCart', IconComponent: ShoppingCart },
  { name: '手机', value: 'Smartphone', IconComponent: Smartphone },
  { name: '闪光', value: 'Sparkles', IconComponent: Sparkles },
  { name: '星星', value: 'Star', IconComponent: Star },
  { name: '点赞', value: 'ThumbsUp', IconComponent: ThumbsUp },
  { name: '钢笔工具', value: 'PenTool', IconComponent: PenTool },
  { name: '趋势', value: 'TrendingUp', IconComponent: TrendingUp },
  { name: '电视', value: 'Tv2', IconComponent: Tv2 },
  { name: '用户', value: 'User', IconComponent: User },
  { name: '视频', value: 'Video', IconComponent: Video },
  { name: '钱包', value: 'Wallet', IconComponent: Wallet },
  { name: '扳手', value: 'Wrench', IconComponent: Wrench },
  { name: 'YouTube', value: 'Youtube', IconComponent: Youtube },
  { name: '闪电', value: 'Zap', IconComponent: Zap },
  { name: '设置', value: 'Settings', IconComponent: Settings },
  { name: '拖动点', value: 'GripVertical', IconComponent: GripVertical },
  { name: '齿轮', value: 'Settings2', IconComponent: Settings2 },
  { name: '眼睛', value: 'Eye', IconComponent: Eye },
  { name: '闭眼', value: 'EyeOff', IconComponent: EyeOff },
];

const iconMap: { [key: string]: React.ElementType } = Object.fromEntries(
  availableIcons.map(icon => [icon.value, icon.IconComponent])
);
iconMap['Default'] = Folder;


interface BookmarkGridProps {
  bookmarks: Bookmark[]; // These are the displayedBookmarks from page.tsx
  categories: Category[]; 
  onDeleteBookmark: (id: string) => void;
  onEditBookmark: (bookmark: Bookmark) => void; 
  isAdminAuthenticated: boolean;
  currentCategoryName?: string; 
  activeCategoryId: string | null;
  searchQuery?: string;
}

const BookmarkGrid: React.FC<BookmarkGridProps> = ({ 
    bookmarks, 
    categories, 
    onDeleteBookmark,
    onEditBookmark, 
    isAdminAuthenticated,
    currentCategoryName,
    activeCategoryId,
    searchQuery
}) => {

  const getCategoryById = (id: string) => categories.find(c => c.id === id);
  const canDrag = isAdminAuthenticated && activeCategoryId && activeCategoryId !== 'all';

  const renderBookmarks = (bookmarksToRender: Bookmark[], droppableId: string) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
      {bookmarksToRender.map((bookmark, index) => (
        <Draggable 
          key={bookmark.id} 
          draggableId={bookmark.id} 
          index={index}
          isDragDisabled={!canDrag}
        >
          {(provided, snapshot) => (
            <BookmarkItem
              bookmark={bookmark}
              onDeleteBookmark={onDeleteBookmark}
              onEditBookmark={onEditBookmark}
              isAdminAuthenticated={isAdminAuthenticated}
              innerRef={provided.innerRef}
              draggableProps={provided.draggableProps}
              dragHandleProps={provided.dragHandleProps}
              isDragging={snapshot.isDragging}
            />
          )}
        </Draggable>
      ))}
    </div>
  );


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
     const activeCat = activeCategoryId ? getCategoryById(activeCategoryId) : null;
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
  
  // If a specific category is selected and user is admin, enable drag-and-drop
  if (canDrag && activeCategoryId) {
    return (
      <Droppable droppableId={activeCategoryId} type="BOOKMARK" isDropDisabled={!canDrag}>
        {(provided) => (
          <div {...provided.droppableProps} ref={provided.innerRef}>
            <section aria-labelledby={`category-title-main`}>
              {currentCategoryName && (
                   <h2 
                      id={`category-title-main`} 
                      className="text-xl font-semibold mb-4 text-foreground border-b pb-2 flex items-center"
                    >
                      {categories.find(c => c.id === activeCategoryId)?.icon && React.createElement(iconMap[categories.find(c => c.id === activeCategoryId)?.icon || 'Default'] || iconMap['Default'], {className: "mr-2 h-5 w-5 text-primary flex-shrink-0"})}
                      {currentCategoryName}
                      {categories.find(c => c.id === activeCategoryId)?.isPrivate && <EyeOff className="ml-2 h-4 w-4 text-muted-foreground" title="私密分类" />}
                  </h2>
              )}
              {renderBookmarks(bookmarks, activeCategoryId)}
              {provided.placeholder}
            </section>
          </div>
        )}
      </Droppable>
    );
  }

  // Default rendering (no D&D or "all" categories view)
  return (
    <div className="space-y-8">
      {(activeCategoryId === 'all' || !activeCategoryId) ? (
        categories
          .filter(c => c.isVisible && (!c.isPrivate || isAdminAuthenticated))
          .map((category) => {
            const categoryBookmarks = bookmarks.filter(
              (bookmark) => bookmark.categoryId === category.id
            );
            if (categoryBookmarks.length === 0) return null;

            const IconComponent = iconMap[category.icon || 'Default'] || iconMap['Default'];

            return (
              <section key={category.id} aria-labelledby={`category-title-${category.id}`}>
                <h2 
                  id={`category-title-${category.id}`} 
                  className="text-xl font-semibold mb-4 text-foreground border-b pb-2 flex items-center"
                >
                  <IconComponent className="mr-2 h-5 w-5 text-primary flex-shrink-0" />
                  {category.name}
                  {category.isPrivate && <EyeOff className="ml-2 h-4 w-4 text-muted-foreground" title="私密分类" />}
                </h2>
                {/* Render bookmarks for "all" view without D&D wrappers */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
                  {categoryBookmarks.map((bookmark) => (
                    <BookmarkItem
                      key={bookmark.id}
                      bookmark={bookmark}
                      onDeleteBookmark={onDeleteBookmark}
                      onEditBookmark={onEditBookmark}
                      isAdminAuthenticated={isAdminAuthenticated}
                    />
                  ))}
                </div>
              </section>
            );
          })
      ) : ( 
        // This case is for when a specific category is selected, but D&D is not enabled (e.g., user not admin)
        // Or, this part might be redundant if the `canDrag` condition above handles it.
        // For safety, providing a non-D&D render path for single category view.
        <section aria-labelledby={`category-title-main`}>
            {currentCategoryName && (
                 <h2 
                    id={`category-title-main`} 
                    className="text-xl font-semibold mb-4 text-foreground border-b pb-2 flex items-center"
                  >
                    {categories.find(c => c.id === activeCategoryId)?.icon && React.createElement(iconMap[categories.find(c => c.id === activeCategoryId)?.icon || 'Default'] || iconMap['Default'], {className: "mr-2 h-5 w-5 text-primary flex-shrink-0"})}
                    {currentCategoryName}
                    {categories.find(c => c.id === activeCategoryId)?.isPrivate && <EyeOff className="ml-2 h-4 w-4 text-muted-foreground" title="私密分类" />}
                </h2>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
            {bookmarks.map((bookmark) => (
                <BookmarkItem
                  key={bookmark.id}
                  bookmark={bookmark}
                  onDeleteBookmark={onDeleteBookmark}
                  onEditBookmark={onEditBookmark}
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
