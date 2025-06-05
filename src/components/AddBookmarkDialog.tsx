
"use client";

import React, { useState, useEffect } from 'react';
import type { Bookmark, Category } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Eye, EyeOff } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface AddBookmarkDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAddBookmark: (bookmark: Omit<Bookmark, 'id'>) => Promise<void>; // Changed to Promise<void>
  categories: Category[];
  activeCategoryId?: string | null;
  initialData?: { name?: string; url?: string; description?: string } | null;
}

const AddBookmarkDialog: React.FC<AddBookmarkDialogProps> = ({
  isOpen,
  onClose,
  onAddBookmark,
  categories,
  activeCategoryId,
  initialData,
}) => {
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setName(initialData?.name || '');
      setUrl(initialData?.url || '');
      setDescription(initialData?.description || '');
      setIsPrivate(false);
      setValidationError(null); 
      setIsSubmitting(false);

      let newDefaultCategoryId = '';
      if (activeCategoryId && activeCategoryId !== 'all' && categories.some(cat => cat.id === activeCategoryId)) {
        newDefaultCategoryId = activeCategoryId;
      } else if (categories.length > 0) {
        // Prefer 'default' category if it exists and is provided, otherwise first category
        const defaultCategory = categories.find(c => c.name === '通用书签'); // Assuming '通用书签' is the default
        if (defaultCategory) {
            newDefaultCategoryId = defaultCategory.id;
        } else {
            newDefaultCategoryId = categories[0].id;
        }
      }
      setCategoryId(newDefaultCategoryId);
    }
  }, [isOpen, categories, activeCategoryId, initialData]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null); 

    if (!name.trim() || !url.trim() || !categoryId) {
      setValidationError("名称、网址和分类为必填项。");
      return;
    }
    try {
      new URL(url.startsWith('http') ? url : `https://${url}`);
    } catch (_) {
      setValidationError("请输入有效的网址，例如：https://example.com");
      return;
    }

    setIsSubmitting(true);
    try {
      await onAddBookmark({ 
        name: name.trim(), 
        url: url.trim().startsWith('http') ? url.trim() : `https://${url.trim()}`, 
        categoryId, 
        description: description.trim(), 
        isPrivate 
      });
      onClose(); // Close dialog only on successful submission
    } catch (error: any) {
      console.error("AddBookmarkDialog: Error during onAddBookmark:", error);
      const errorMessage = error.message || "保存书签失败，请重试。";
      setValidationError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        setValidationError(null); 
        setIsSubmitting(false);
      }
      onClose();
    }}>
      <DialogContent
        className="sm:max-w-[480px]"
        onInteractOutside={(event) => {
          if (isSubmitting) { // Prevent closing while submitting
            event.preventDefault();
          }
        }}
      >
        <DialogHeader>
          <DialogTitle>添加新书签</DialogTitle>
          <DialogDescription>
            输入新书签的详细信息。完成后点击保存。
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                名称*
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="col-span-3"
                placeholder="例如：谷歌新闻"
                required
                disabled={isSubmitting}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="url" className="text-right">
                网址*
              </Label>
              <Input
                id="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="col-span-3"
                placeholder="例如：https://news.google.com"
                type="url"
                required
                disabled={isSubmitting}
              />
            </div>
             <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="description" className="text-right pt-2">
                描述
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="col-span-3"
                placeholder="可选的网站描述或副标题"
                rows={2}
                disabled={isSubmitting}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="category" className="text-right">
                分类*
              </Label>
              <Select value={categoryId} onValueChange={setCategoryId} required disabled={isSubmitting}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="选择一个分类" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="privacyButton" className="text-right">
                可见性
              </Label>
              <div className="col-span-3">
                <Button
                  id="privacyButton"
                  type="button"
                  variant="outline"
                  onClick={() => setIsPrivate(!isPrivate)}
                  className="flex items-center w-full justify-start text-sm"
                  aria-label={isPrivate ? '设为公开书签' : '设为私密书签'}
                  disabled={isSubmitting}
                >
                  {isPrivate ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
                  {isPrivate ? '私密 (仅管理员可见)' : '公开 (所有人可见)'}
                </Button>
              </div>
            </div>
            {validationError && (
              <div className="col-span-4 mt-2 text-center">
                <p className="text-sm font-medium text-destructive bg-destructive/10 p-2 rounded-md">{validationError}</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => {
              setValidationError(null); 
              onClose();
            }} disabled={isSubmitting}>取消</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? '正在保存...' : '保存书签'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddBookmarkDialog;
