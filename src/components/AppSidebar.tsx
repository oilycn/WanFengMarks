
"use client";

import React, { useState } from 'react';
import type { Category } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PlusCircle, Trash2, Eye, EyeOff, LayoutGrid, Folder } from 'lucide-react';
import AegisLogo from './AegisLogo';
import { Separator } from './ui/separator';
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

interface AppSidebarProps {
  categories: Category[];
  onAddCategory: (name: string) => void;
  onDeleteCategory: (id: string) => void;
  onToggleVisibility: (id: string) => void;
  isAdminAuthenticated: boolean;
  activeCategory: string | null;
  setActiveCategory: (id: string | null) => void;
}

const AppSidebar: React.FC<AppSidebarProps> = ({
  categories,
  onAddCategory,
  onDeleteCategory,
  onToggleVisibility,
  isAdminAuthenticated,
  activeCategory,
  setActiveCategory,
}) => {
  const [newCategoryName, setNewCategoryName] = useState('');
  const { toast } = useToast();

  const handleAddCategorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) {
      toast({ title: "错误", description: "分类名称不能为空。", variant: "destructive" });
      return;
    }
    onAddCategory(newCategoryName.trim());
    setNewCategoryName('');
    toast({ title: "分类已添加", description: `"${newCategoryName.trim()}" 已成功添加。` });
  };

  const handleDelete = (categoryId: string, categoryName: string) => {
    onDeleteCategory(categoryId);
    toast({ title: "分类已删除", description: `"${categoryName}" 及其所有书签已被删除。`, variant: "destructive" });
  };

  return (
    <aside className="w-64 bg-card/60 backdrop-blur-md border-r flex flex-col h-full shadow-lg">
      <div className="p-4 border-b">
        <AegisLogo />
      </div>
      <ScrollArea className="flex-grow">
        <nav className="p-3 space-y-1">
          <Button
            variant={activeCategory === 'all' || categories.length === 0 ? 'secondary' : 'ghost'}
            className={`w-full justify-start text-sm ${activeCategory === 'all' || categories.length === 0 ? 'font-semibold': ''}`}
            onClick={() => setActiveCategory('all')}
          >
            <LayoutGrid className="mr-2 h-4 w-4" />
            全部书签
          </Button>
          {categories.filter(c => c.id !== 'default' || categories.length === 1).map((category) => ( // Do not show default if other categories exist for "All Bookmarks"
            <div key={category.id} className="group relative">
              <Button
                variant={activeCategory === category.id ? 'secondary' : 'ghost'}
                className={`w-full justify-start text-sm truncate pr-10 ${activeCategory === category.id ? 'font-semibold': ''}`}
                onClick={() => setActiveCategory(category.id)}
                title={category.name}
              >
                <Folder className="mr-2 h-4 w-4" /> 
                {category.name}
              </Button>
              {isAdminAuthenticated && category.id !== 'default' && (
                <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                   <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="text-destructive/70 hover:text-destructive h-6 w-6 p-0.5">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>确定删除分类 "{category.name}"?</AlertDialogTitle>
                        <AlertDialogDescription>
                          此操作将删除该分类及其下的所有书签。此操作无法撤销。
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>取消</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(category.id, category.name)} className="bg-destructive hover:bg-destructive/90">
                          删除
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              )}
            </div>
          ))}
        </nav>
      </ScrollArea>
      {isAdminAuthenticated && (
        <div className="p-3 border-t mt-auto">
          <form onSubmit={handleAddCategorySubmit} className="space-y-2">
            <Input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="新分类名称"
              className="h-9 text-sm"
            />
            <Button type="submit" className="w-full h-9 text-sm bg-primary hover:bg-primary/90">
              <PlusCircle className="mr-2 h-4 w-4" /> 添加分类
            </Button>
          </form>
        </div>
      )}
    </aside>
  );
};

export default AppSidebar;
