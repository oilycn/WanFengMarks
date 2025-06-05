
"use client";

import React, { useState, useEffect } from 'react';
import type { Bookmark, Category } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox'; // Import Checkbox
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
import { useToast } from "@/hooks/use-toast";

interface AddBookmarkDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAddBookmark: (bookmark: Omit<Bookmark, 'id'>) => void;
  categories: Category[];
}

const AddBookmarkDialog: React.FC<AddBookmarkDialogProps> = ({
  isOpen,
  onClose,
  onAddBookmark,
  categories,
}) => {
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [isPrivate, setIsPrivate] = useState(false); // New state for privacy
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      setName('');
      setUrl('');
      setDescription('');
      setIsPrivate(false); 
      if (categories.length > 0 && !categoryId) {
        setCategoryId(categories.find(c => c.id === 'default')?.id || categories[0]?.id || '');
      } else if (categories.length > 0 && categoryId) {
        if (!categories.some(c => c.id === categoryId)) {
           setCategoryId(categories.find(c => c.id === 'default')?.id || categories[0]?.id || '');
        }
      }
    }
  }, [isOpen, categories, categoryId]);


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !url.trim() || !categoryId) {
      toast({ title: "错误", description: "名称、网址和分类为必填项。", variant: "destructive" });
      return;
    }
    try {
      new URL(url.startsWith('http') ? url : `https://${url}`);
    } catch (_) {
      toast({ title: "无效的URL", description: "请输入有效的URL。", variant: "destructive" });
      return;
    }

    onAddBookmark({ name, url: url.startsWith('http') ? url : `https://${url}`, categoryId, description, isPrivate });
    toast({ title: "书签已添加", description: `"${name}" 已成功添加。` });
    onClose(); 
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[480px]">
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
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="category" className="text-right">
                分类*
              </Label>
              <Select value={categoryId} onValueChange={setCategoryId} required>
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
              <Label htmlFor="isPrivate" className="text-right">
                私密
              </Label>
              <div className="col-span-3 flex items-center space-x-2">
                <Checkbox
                  id="isPrivate"
                  checked={isPrivate}
                  onCheckedChange={(checked) => setIsPrivate(checked as boolean)}
                />
                <Label htmlFor="isPrivate" className="text-sm font-normal cursor-pointer">设为私密书签（仅管理员可见）</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>取消</Button>
            <Button type="submit">保存书签</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddBookmarkDialog;
