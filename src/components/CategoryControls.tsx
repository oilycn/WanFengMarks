"use client";

import React, { useState } from 'react';
import type { Category } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, Trash2, Eye, EyeOff } from 'lucide-react';
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

interface CategoryControlsProps {
  categories: Category[];
  onAddCategory: (name: string) => void;
  onToggleVisibility: (id: string) => void;
  onDeleteCategory: (id: string) => void;
}

const CategoryControls: React.FC<CategoryControlsProps> = ({
  categories,
  onAddCategory,
  onToggleVisibility,
  onDeleteCategory,
}) => {
  const [newCategoryName, setNewCategoryName] = useState('');
  const { toast } = useToast();

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (newCategoryName.trim()) {
      onAddCategory(newCategoryName.trim());
      setNewCategoryName('');
      toast({ title: "分类已添加", description: `"${newCategoryName.trim()}" 已成功添加。` });
    }
  };

  const handleDelete = (categoryId: string, categoryName: string) => {
    onDeleteCategory(categoryId);
    toast({ title: "分类已删除", description: `"${categoryName}" 及其所有书签已被删除。`, variant: "destructive" });
  };

  return (
    <Card className="shadow-md w-full md:max-w-md">
      <CardHeader>
        <CardTitle className="text-xl">管理分类</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleAddCategory} className="flex items-center gap-2 mb-4">
          <Input
            type="text"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            placeholder="新分类名称"
            className="flex-grow"
          />
          <Button type="submit" size="icon" aria-label="添加分类">
            <PlusCircle className="h-5 w-5" />
          </Button>
        </form>
        <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
          {categories.length === 0 && <p className="text-sm text-muted-foreground">还没有分类。在上方添加一个吧！</p>}
          {categories.map((category) => (
            <div key={category.id} className="flex items-center justify-between p-2 rounded-md border bg-card hover:bg-muted/50 transition-colors">
              <span className="font-medium text-card-foreground">{category.name}</span>
              <div className="flex items-center gap-3">
                <Switch
                  id={`vis-${category.id}`}
                  checked={category.isVisible}
                  onCheckedChange={() => onToggleVisibility(category.id)}
                  aria-label={`切换 ${category.name} 的可见性`}
                />
                <Label htmlFor={`vis-${category.id}`} className="cursor-pointer">
                  {category.isVisible ? <Eye className="h-5 w-5 text-green-500"/> : <EyeOff className="h-5 w-5 text-muted-foreground"/>}
                </Label>
                {category.id !== 'default' && ( // Prevent deleting default category
                   <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10" aria-label={`删除分类 ${category.name}`}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>确定吗？</AlertDialogTitle>
                        <AlertDialogDescription>
                          此操作将删除分类 "{category.name}" 及其所有书签。此操作无法撤销。
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
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default CategoryControls;
